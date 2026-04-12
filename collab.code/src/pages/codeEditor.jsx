import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Client from "../components/Client";
import Editor from "../components/Editor";
import Toolbar from "../components/Toolbar";
import FileTabsBar from "../components/FileTabsBar";
import OutputPanel from "../components/OutputPanel";
import {
  LANGUAGES,
  getLanguageById,
  getLanguageByExt,
  getExtFromFilename,
} from "../constants/languages";

let fileCounter = 1;

function CodeEditor() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || "Anonymous";

  /* ───── File state ───── */
  const [files, setFiles] = useState([
    {
      id: "file-1",
      name: "main.js",
      language: "javascript",
      code: LANGUAGES[0].template,
    },
  ]);
  const [activeFileId, setActiveFileId] = useState("file-1");

  /* ───── Editor settings ───── */
  const [theme, setTheme] = useState("dark");
  const [fontSize, setFontSize] = useState(14);

  /* ───── Output ───── */
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(true);
  const [outputHeight, setOutputHeight] = useState(200);

  /* ───── Save status ───── */
  const [saveStatus, setSaveStatus] = useState("saved");
  const saveTimerRef = useRef(null);

  /* ───── Connected clients (mock — replace with Socket.IO) ───── */
  const [clients] = useState([
    { socketId: 1, username: username },
  ]);

  /* ───── Remote cursors (mock for demo) ───── */
  const [remoteCursors] = useState([
    {
      id: "user-alice",
      username: "Alice",
      color: "#FF6B6B",
      position: { lineNumber: 3, column: 15 },
      selection: null,
    },
    {
      id: "user-bob",
      username: "Bob",
      color: "#4ECDC4",
      position: { lineNumber: 6, column: 5 },
      selection: {
        startLineNumber: 6,
        startColumn: 5,
        endLineNumber: 6,
        endColumn: 28,
      },
    },
  ]);

  /* ───── Derived ───── */
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  /* ═══════════════════════════════════════════════
   *  Handlers
   * ═══════════════════════════════════════════════ */

  /** Code changes → update file + trigger auto-save simulation */
  const handleCodeChange = useCallback(
    (newCode) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFileId ? { ...f, code: newCode } : f
        )
      );

      setSaveStatus("unsaved");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus("saving");
        // Simulates a network save — replace with real API call
        setTimeout(() => setSaveStatus("saved"), 500);
      }, 1500);
    },
    [activeFileId]
  );

  /** Language change → update active file's language + extension */
  const handleLanguageChange = useCallback(
    (langId) => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== activeFileId) return f;
          const lang = getLanguageById(langId);
          const ext = lang?.ext || "txt";
          const baseName = f.name.includes(".")
            ? f.name.split(".").slice(0, -1).join(".")
            : f.name;
          return { ...f, language: langId, name: `${baseName}.${ext}` };
        })
      );
    },
    [activeFileId]
  );

  /** Run code */
  const handleRun = useCallback(() => {
    setIsRunning(true);
    setShowOutput(true);

    setTimeout(() => {
      const { code, language } = activeFile;

      if (language === "javascript" || language === "typescript") {
        const results = executeJavaScript(code);
        setOutput((prev) => [...prev, ...results]);
      } else {
        const label = getLanguageById(language)?.label || language;
        setOutput((prev) => [
          ...prev,
          {
            type: "system",
            text: `⚡ Connect a backend execution service to run ${label} code. JavaScript & TypeScript can run locally.`,
            timestamp: Date.now(),
          },
        ]);
      }

      setIsRunning(false);
    }, 300);
  }, [activeFile]);

  /** Add a new file tab */
  const handleAddFile = useCallback(() => {
    fileCounter++;
    const newFile = {
      id: `file-${Date.now()}`,
      name: `untitled-${fileCounter}.js`,
      language: "javascript",
      code: getLanguageById("javascript").template,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  }, []);

  /** Close a file tab */
  const handleCloseFile = useCallback(
    (fileId) => {
      setFiles((prev) => {
        const newFiles = prev.filter((f) => f.id !== fileId);
        if (fileId === activeFileId && newFiles.length > 0) {
          setActiveFileId(newFiles[newFiles.length - 1].id);
        }
        return newFiles;
      });
    },
    [activeFileId]
  );

  /** Rename a file (double-click tab) → auto-detect language from new extension */
  const handleRenameFile = useCallback((fileId, newName) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const ext = getExtFromFilename(newName);
        const lang = ext ? getLanguageByExt(ext) : null;
        return {
          ...f,
          name: newName,
          language: lang?.id || f.language,
        };
      })
    );
  }, []);

  /** Copy room ID to clipboard */
  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard!");
    } catch {
      toast.error("Failed to copy Room ID");
    }
  };

  /** Leave room → navigate home */
  const leaveRoom = () => {
    navigate("/");
    toast.success("Left the room");
  };

  /** Cursor changes (for future Socket.IO integration) */
  const handleCursorChange = useCallback((data) => {
    // TODO: Emit to Socket.IO server
    // socket.emit('cursor-change', { ...data, username, roomId });
  }, []);

  /* ───── Keyboard shortcuts ───── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + ` → toggle output panel
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setShowOutput((prev) => !prev);
      }
      // Ctrl + Enter → run code
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
      // Ctrl + S → save (prevent browser default, show saved status)
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        setSaveStatus("saving");
        setTimeout(() => setSaveStatus("saved"), 400);
        toast.success("Saved!", { duration: 1500 });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRun]);

  /* ═══════════════════════════════════════════════
   *  Render
   * ═══════════════════════════════════════════════ */
  return (
    <div className="MainWrap" data-theme={theme}>
      {/* ── Sidebar ── */}
      <div className="LeftBar">
        <div className="asideInner">
          <div className="Logo">
            <img src="/logo.svg" alt="Collab.Code Logo" />
          </div>
          <h4>Connected</h4>
          <div className="ClientList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
          <div>
            <button className="roomIDbtn" onClick={copyRoomId}>
              Copy Room ID
            </button>
            <button className="leaveRoomBtn" onClick={leaveRoom}>
              Leave Room
            </button>
          </div>
        </div>
      </div>

      {/* ── Coding Area ── */}
      <div className="CodingArea">
        <Toolbar
          language={activeFile.language}
          onLanguageChange={handleLanguageChange}
          onRun={handleRun}
          isRunning={isRunning}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          theme={theme}
          onThemeToggle={() =>
            setTheme((prev) => (prev === "dark" ? "light" : "dark"))
          }
          saveStatus={saveStatus}
        />

        <FileTabsBar
          files={files}
          activeFileId={activeFileId}
          onSelectFile={setActiveFileId}
          onAddFile={handleAddFile}
          onCloseFile={handleCloseFile}
          onRenameFile={handleRenameFile}
        />

        <div className="EditorWrapper">
          <Editor
            filePath={activeFile.id}
            code={activeFile.code}
            language={activeFile.language}
            theme={theme}
            fontSize={fontSize}
            onChange={handleCodeChange}
            onCursorChange={handleCursorChange}
            remoteCursors={remoteCursors}
          />
        </div>

        <OutputPanel
          output={output}
          isVisible={showOutput}
          onToggle={() => setShowOutput((prev) => !prev)}
          onClear={() => setOutput([])}
          height={outputHeight}
          onResize={setOutputHeight}
          isRunning={isRunning}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
 *  JavaScript execution engine (browser sandbox)
 *
 *  NOTE: This uses `new Function()` which has access to the
 *  global scope. For production, use a backend execution
 *  service or sandboxed iframe.
 * ═══════════════════════════════════════════════ */
function executeJavaScript(code) {
  const output = [];

  const makeEntry = (type) => (...args) =>
    output.push({
      type,
      text: args
        .map((a) =>
          a === null
            ? "null"
            : a === undefined
            ? "undefined"
            : typeof a === "object"
            ? JSON.stringify(a, null, 2)
            : String(a)
        )
        .join(" "),
      timestamp: Date.now(),
    });

  const mockConsole = {
    log: makeEntry("log"),
    error: makeEntry("error"),
    warn: makeEntry("warn"),
    info: makeEntry("info"),
    table: makeEntry("log"),
    dir: makeEntry("log"),
    clear: () => {},
  };

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function("console", code);
    const result = fn(mockConsole);
    if (result !== undefined) {
      output.push({
        type: "return",
        text: `→ ${
          typeof result === "object"
            ? JSON.stringify(result, null, 2)
            : String(result)
        }`,
        timestamp: Date.now(),
      });
    }
  } catch (err) {
    output.push({
      type: "error",
      text: `${err.name}: ${err.message}`,
      timestamp: Date.now(),
    });
  }

  return output;
}

export default CodeEditor;