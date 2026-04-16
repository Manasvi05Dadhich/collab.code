import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useLocation, useNavigate, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import Client from "../components/Client";
import Editor from "../components/Editor";
import FileTree from "../components/FileTree";
import {
  LANGUAGES,
  getLanguageById,
  getLanguageByExt,
  getExtFromFilename,
} from "../constants/languages";
import { initSocket } from "../socket";
import ACTIONS from "../constants/Actions";
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from 'y-monaco'

const LANG_COLORS = {
  javascript: "#ff6b6b", typescript: "#69c0ff", python: "#b5f5a0",
  rust: "#ffd666", go: "#69d2e7", cpp: "#ffb347", css: "#c0a0ff", html: "#ffd666",
};
const COLLAB_COLORS = ["#2997ff", "#ff6b6b", "#30d158", "#ffd666", "#c0a0ff", "#ffb347", "#69c0ff", "#ff9f0a"];

let fileCounter = 1;
let folderCounter = 1;

function createFileRecord(id, name) {
  const safeName = name || `untitled-${fileCounter}.js`;
  const ext = getExtFromFilename(safeName);
  const language = ext ? getLanguageByExt(ext)?.id || "javascript" : "javascript";

  return {
    id,
    name: safeName,
    language,
    code: getLanguageById(language)?.template || "",
  };
}

function createFileNode(file) {
  return {
    id: file.id,
    type: "file",
    name: file.name,
    language: file.language,
  };
}

function createFolderNode(name) {
  return {
    id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "folder",
    name: name || `folder-${folderCounter}`,
    expanded: true,
    children: [],
  };
}

function updateTree(nodes, nodeId, updater) {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return updater(node);
    }

    if (node.type === "folder") {
      return {
        ...node,
        children: updateTree(node.children, nodeId, updater),
      };
    }

    return node;
  });
}

function addNodeToTree(nodes, parentId, newNode) {
  if (!parentId) {
    return [...nodes, newNode];
  }

  return nodes.map((node) => {
    if (node.id === parentId && node.type === "folder") {
      return {
        ...node,
        expanded: true,
        children: [...node.children, newNode],
      };
    }

    if (node.type === "folder") {
      return {
        ...node,
        children: addNodeToTree(node.children, parentId, newNode),
      };
    }

    return node;
  });
}

function removeNodeFromTree(nodes, nodeId) {
  const removedIds = [];

  const collectIds = (node) => {
    removedIds.push(node.id);
    if (node.type === "folder") {
      node.children.forEach(collectIds);
    }
  };

  const nextNodes = [];

  nodes.forEach((node) => {
    if (node.id === nodeId) {
      collectIds(node);
      return;
    }

    if (node.type === "folder") {
      const childResult = removeNodeFromTree(node.children, nodeId);
      removedIds.push(...childResult.removedIds);
      nextNodes.push({
        ...node,
        children: childResult.nodes,
      });
      return;
    }

    nextNodes.push(node);
  });

  return { nodes: nextNodes, removedIds };
}

function findFirstFileId(nodes) {
  for (const node of nodes) {
    if (node.type === "file") {
      return node.id;
    }

    const childId = findFirstFileId(node.children);
    if (childId) {
      return childId;
    }
  }

  return null;
}

function CodeEditor() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || "Anonymous";

  const initialFile = { id: "file-1", name: "main.js", language: "javascript", code: LANGUAGES[0].template };

  const [files, setFiles] = useState([initialFile]);
  const [activeFileId, setActiveFileId] = useState(initialFile.id);
  const [fileTree, setFileTree] = useState([
    {
      id: "folder-src",
      type: "folder",
      name: "src",
      expanded: true,
      children: [createFileNode(initialFile)],
    },
  ]);

  
  const [theme, setTheme] = useState("dark");
  const [fontSize] = useState(14);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(190);
  const [terminalHeight, setTerminalHeight] = useState(200);


  const [output, setOutput] = useState([
    { type: "dim", text: "// collab.code terminal", timestamp: 0 },
    { type: "ok", text: "session synced", timestamp: 1 },
  ]);
  const [consoleLog, setConsoleLog] = useState([
    { type: "dim", text: "// browser console", timestamp: 0 },
  ]);
  const [terminalTab, setTerminalTab] = useState("output");
  const [isRunning, setIsRunning] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");

  
  const [clients, setClients] = useState([]);

  const socketRef = useRef(null);
  const saveTimerRef = useRef(null);
  const activeFileRef = useRef(null);
  const activeFileIdRef = useRef(activeFileId);
  const langMenuRef = useRef(null);
  const langBtnRef = useRef(null);
  const langDropRef = useRef(null);
  const isDraggingX = useRef(false);
  const isDraggingY = useRef(false);
  const [langMenuPos, setLangMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const activeFile = files.find((file) => file.id === activeFileId) || files[0];

  useEffect(() => {
    activeFileRef.current = activeFile;
  });

  useEffect(() => {
    activeFileIdRef.current = activeFileId;
  }, [activeFileId]);

  useEffect(() => {
    const onMove = (e) => {
      if (isDraggingX.current) {
        setSidebarWidth(Math.max(120, Math.min(500, e.clientX - 40)));
      }

      if (isDraggingY.current) {
        const editorEl = document.getElementById("editor");
        if (editorEl) {
          const bottom = editorEl.getBoundingClientRect().bottom;
          const newHeight = bottom - e.clientY - 22;
          setTerminalHeight(Math.max(60, Math.min(600, newHeight)));
        }
      }
    };

    const onUp = () => {
      if (isDraggingX.current || isDraggingY.current) {
        isDraggingX.current = false;
        isDraggingY.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        socketRef.current = await initSocket();

        const handleError = (err) => {
          console.error("Socket error:", err);
          toast.error("Connection failed. Redirecting...");
          navigate("/");
        };

        socketRef.current.on("connect_error", handleError);
        socketRef.current.on("connect_timeout", handleError);
        socketRef.current.on("error", handleError);

        socketRef.current.on(ACTIONS.JOINED, ({ clients: roomClients, username: joinedUser, socketId }) => {
          if (joinedUser !== location.state?.username) {
            toast.success(`${joinedUser} joined the room`);
          }

          setClients(roomClients);
          
        });

        socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username: leftUser }) => {
          toast(`${leftUser} left the room`, { icon: "👋" });
          setClients((prev) => prev.filter((client) => client.socketId !== socketId));
        });

        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          username: location.state?.username,
        });
      } catch (err) {
        console.error("Failed to connect:", err);
        toast.error("Could not connect to the server.");
        navigate("/");
      }
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect_error");
        socketRef.current.off("connect_timeout");
        socketRef.current.off("error");
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.disconnect();
      }
    };
  }, []); 

  const handleCodeChange = useCallback((newCode) => {
    setFiles((prev) => prev.map((file) => (
      file.id === activeFileId ? { ...file, code: newCode } : file
    )));



    setSaveStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus("saving");
      setTimeout(() => setSaveStatus("saved"), 500);
    }, 1500);
  }, [activeFileId, roomId]);

  const handleLanguageChange = useCallback((langId) => {
    setFiles((prev) => prev.map((file) => {
      if (file.id !== activeFileId) return file;

      const lang = getLanguageById(langId);
      const ext = lang?.ext || "txt";
      const base = file.name.includes(".") ? file.name.split(".").slice(0, -1).join(".") : file.name;

      return {
        ...file,
        language: langId,
        name: `${base}.${ext}`,
        code: lang?.template || "",
      };
    }));

    setFileTree((prev) =>
      updateTree(prev, activeFileId, (node) => (
        node.type === "file"
          ? {
              ...node,
              language: langId,
              name: `${node.name.includes(".") ? node.name.split(".").slice(0, -1).join(".") : node.name}.${getLanguageById(langId)?.ext || "txt"}`,
            }
          : node
      ))
    );

    setShowLangMenu(false);
  }, [activeFileId]);

  const handleRun = useCallback(() => {
    setIsRunning(true);

    setTimeout(() => {
      const { code, language } = activeFile;
      const timestamp = Date.now();

      setConsoleLog((prev) => [
        ...prev,
        { type: "dim", text: `Run at ${new Date(timestamp).toLocaleTimeString()}`, timestamp },
      ]);

      if (language === "javascript" || language === "typescript") {
        const results = executeJavaScript(code);
        setOutput((prev) => [...prev, ...results]);
        setConsoleLog((prev) => [...prev, ...results]);
      } else {
        const label = getLanguageById(language)?.label || language;
        const message = {
          type: "system",
          text: `Connect a backend to run ${label}. JS and TS run locally.`,
          timestamp: Date.now(),
        };
        setOutput((prev) => [...prev, message]);
        setConsoleLog((prev) => [...prev, message]);
      }

      setIsRunning(false);
    }, 300);
  }, [activeFile]);

  const handleAddTreeFile = useCallback((parentId = null) => {
    fileCounter++;
    const file = createFileRecord(`file-${Date.now()}`);
    setFiles((prev) => [...prev, file]);
    setFileTree((prev) => addNodeToTree(prev, parentId, createFileNode(file)));
    setActiveFileId(file.id);
  }, []);

  const handleAddFolder = useCallback((parentId = null) => {
    folderCounter++;
    setFileTree((prev) => addNodeToTree(prev, parentId, createFolderNode()));
  }, []);

  const handleToggleFolder = useCallback((folderId) => {
    setFileTree((prev) =>
      updateTree(prev, folderId, (node) => (
        node.type === "folder" ? { ...node, expanded: !node.expanded } : node
      ))
    );
  }, []);

  const handleRenameFile = useCallback((fileId, newName) => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      return;
    }

    setFiles((prev) => prev.map((file) => {
      if (file.id !== fileId) return file;

      const ext = getExtFromFilename(trimmedName);
      const lang = ext ? getLanguageByExt(ext) : null;

      return {
        ...file,
        name: trimmedName,
        language: lang?.id || file.language,
      };
    }));

    setFileTree((prev) =>
      updateTree(prev, fileId, (node) => {
        if (node.type !== "file") {
          return node;
        }

        const ext = getExtFromFilename(trimmedName);
        const lang = ext ? getLanguageByExt(ext) : null;

        return {
          ...node,
          name: trimmedName,
          language: lang?.id || node.language,
        };
      })
    );
  }, []);

  const handleRenameNode = useCallback((nodeId, newName) => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      return;
    }

    const fileMatch = files.find((file) => file.id === nodeId);
    if (fileMatch) {
      handleRenameFile(nodeId, trimmedName);
      return;
    }

    setFileTree((prev) =>
      updateTree(prev, nodeId, (node) => (
        node.type === "folder" ? { ...node, name: trimmedName } : node
      ))
    );
  }, [files, handleRenameFile]);

  const handleDeleteNode = useCallback((nodeId) => {
    setFileTree((prevTree) => {
      const result = removeNodeFromTree(prevTree, nodeId);
      const removedIds = new Set(result.removedIds);
      let nextFiles = files.filter((file) => !removedIds.has(file.id));
      let nextTree = result.nodes;

      if (nextFiles.length === 0) {
        fileCounter++;
        const fallbackFile = createFileRecord(`file-${Date.now()}`, "main.js");
        nextFiles = [fallbackFile];
        nextTree = [createFileNode(fallbackFile)];
        setActiveFileId(fallbackFile.id);
      } else if (removedIds.has(activeFileId)) {
        setActiveFileId(findFirstFileId(nextTree) || nextFiles[0].id);
      }

      setFiles(nextFiles);
      return nextTree;
    });
  }, [activeFileId, files]);

  const handleCloseFile = useCallback((fileId) => {
    handleDeleteNode(fileId);
  }, [handleDeleteNode]);

  const handleAddFile = useCallback(() => {
    handleAddTreeFile(null);
  }, [handleAddTreeFile]);


  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied!");
    } catch {
      toast.error("Failed to copy Room ID");
    }
  };

  const leaveRoom = () => {
    navigate("/");
    toast.success("Left the room");
  };

  useEffect(() => {
    const handler = (e) => {
      const inButton = langMenuRef.current?.contains(e.target);
      const inDropdown = langDropRef.current?.contains(e.target);
      if (!inButton && !inDropdown) {
        setShowLangMenu(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }

      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        setSaveStatus("saving");
        setTimeout(() => setSaveStatus("saved"), 400);
        toast.success("Saved!", { duration: 1500 });
      }

      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        handleAddFile();
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [handleRun, handleAddFile]);

  if (!location.state) return <Navigate to="/" />;
  if (!activeFile) return null;

  const langColor = LANG_COLORS[activeFile.language] || "#a1a1a6";

  return (
    <div id="editor" data-theme={theme}>
      <div className="e-titlebar">
        <div className="e-tl">
          <div className="e-traffic">
            <div className="e-dot red" onClick={leaveRoom} title="Leave" />
            <div className="e-dot yel" />
            <div className="e-dot grn" />
          </div>
          <div className="e-logo-sm">collab<b>.code</b></div>
          <div className="e-sess-pill">
            <div className="e-sess-pip" />
            <span>{roomId}</span>
          </div>
        </div>

        <div className="e-tr">
          <div ref={langMenuRef} style={{ position: "relative" }}>
            <button
              ref={langBtnRef}
              className="e-lang-btn"
              onClick={() => {
                const rect = langBtnRef.current?.getBoundingClientRect();
                if (rect) {
                  setLangMenuPos({ top: rect.bottom + 6, left: rect.left });
                }
                setShowLangMenu((value) => !value);
              }}
            >
              <div className="e-lang-dot" style={{ background: langColor }} />
              <span>{getLanguageById(activeFile.language)?.label || activeFile.language}</span>
              <span style={{ fontSize: "8px", color: "var(--text3)" }}>▾</span>
            </button>
          </div>

          <div className="e-avs">
            {clients.slice(0, 5).map((client, index) => (
              <div
                key={client.socketId}
                className="e-av"
                style={{ background: COLLAB_COLORS[index % COLLAB_COLORS.length] }}
                title={client.username}
              >
                {client.username?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
          <button className="e-tbtn" onClick={copyRoomId}>Copy ID</button>
          <button className="e-tbtn run" onClick={handleRun} disabled={isRunning}>
            {isRunning ? "Running" : "Run"}
          </button>
          <button className="e-tbtn" onClick={() => setTheme((value) => value === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button className="e-tbtn" onClick={leaveRoom}>Leave</button>
        </div>
      </div>

      {showLangMenu && (
        <div
          ref={langDropRef}
          style={{
            position: "fixed",
            top: langMenuPos.top,
            left: langMenuPos.left,
            minWidth: 160,
            borderRadius: 14,
            background: "var(--bg2)",
            border: ".5px solid var(--sep2)",
            boxShadow: "0 20px 60px rgba(0,0,0,.8)",
            overflow: "hidden",
            zIndex: 99999,
          }}
        >
          {LANGUAGES.map((language) => (
            <div
              key={language.id}
              className={`e-lm-item${language.id === activeFile.language ? " on" : ""}`}
              onClick={() => handleLanguageChange(language.id)}
            >
              <div className="e-lm-dot" style={{ background: LANG_COLORS[language.id] || "#a1a1a6" }} />
              {language.label}
            </div>
          ))}
        </div>
      )}

      <div className="e-body">
        <div className="e-act">
          <div className="e-act-i on">EX<span className="e-tip">Explorer</span></div>
          <div className="e-act-i">SR<span className="e-tip">Search</span></div>
          <div className="e-act-i">SC<span className="e-tip">Source Control</span></div>
          <div className="e-act-i" style={{ marginTop: "auto" }}>ST<span className="e-tip">Settings</span></div>
        </div>

        <div className="e-side" style={{ width: sidebarWidth, minWidth: 0 }}>
          <FileTree
            tree={fileTree}
            activeFileId={activeFileId}
            onSelectFile={setActiveFileId}
            onToggleFolder={handleToggleFolder}
            onRenameNode={handleRenameNode}
            onDeleteNode={handleDeleteNode}
            onAddFile={handleAddTreeFile}
            onAddFolder={handleAddFolder}
          />
        </div>

        <div
          className="e-resize-x"
          onMouseDown={() => {
            isDraggingX.current = true;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
        />

        <div className="e-code-area">
          <div className="e-tabs">
            {files.map((file) => (
              <div
                key={file.id}
                className={`e-tab${file.id === activeFileId ? " on" : ""}`}
                onClick={() => setActiveFileId(file.id)}
              >
                {file.name}
                {files.length > 1 && (
                  <button
                    className="e-tab-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseFile(file.id);
                    }}
                    title="Close"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <div
              className="e-tab"
              onClick={handleAddFile}
              title="New file (Ctrl+N)"
              style={{ color: "var(--text3)", paddingLeft: 12, paddingRight: 12 }}
            >
              +
            </div>
          </div>

          <div className="e-wrap" style={{ position: "relative" }}>
            <div className="e-amb" />
            <Editor
              filePath={activeFile.id}
              code={activeFile.code}
              language={activeFile.language}
              theme={theme}
              fontSize={fontSize}
              onChange={handleCodeChange}
              roomId={roomId}
              username={username}
            />
          </div>

          <div
            className="e-resize-y"
            onMouseDown={() => {
              isDraggingY.current = true;
              document.body.style.cursor = "row-resize";
              document.body.style.userSelect = "none";
            }}
          />

          <div className="e-terminal" style={{ height: terminalHeight }}>
            <div className="e-terminal-h">
              <div
                className={`e-terminal-tab${terminalTab === "output" ? " on" : ""}`}
                onClick={() => setTerminalTab("output")}
              >
                Output
              </div>
              <div
                className={`e-terminal-tab${terminalTab === "console" ? " on" : ""}`}
                onClick={() => setTerminalTab("console")}
              >
                Console
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "'DM Mono', monospace",
                    color: "var(--green)",
                    animation: "pulse 2s infinite",
                  }}
                >
                  live
                </span>
                <button
                  className="e-tbtn"
                  style={{ height: 20, fontSize: 10, padding: "0 8px" }}
                  onClick={() => {
                    if (terminalTab === "output") setOutput([]);
                    else setConsoleLog([]);
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="e-terminal-body">
              {(terminalTab === "output" ? output : consoleLog).map((item, index) => (
                <div key={`${item.timestamp}-${index}`} className={`ol ${item.type}`}>
                  {item.text}
                </div>
              ))}
              {isRunning && terminalTab === "output" && <div className="ol hi">running<span className="blk" /></div>}
            </div>
          </div>
        </div>

        <div className="e-rp">
          <div className="e-rp-h"><span>Collaborators</span></div>
          <div className="e-rp-body">
            <div className="e-ch">In session</div>
            {clients.map((client, index) => (
              <Client
                key={client.socketId}
                username={client.username}
                color={COLLAB_COLORS[index % COLLAB_COLORS.length]}
                isYou={client.username === username}
              />
            ))}
            {clients.length === 0 && (
              <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "'DM Mono', monospace" }}>
                Connecting...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="e-status">
        <div className="e-si">
          {saveStatus === "saved" ? "saved" : saveStatus === "saving" ? "saving..." : "unsaved"}
        </div>
        <div className="e-si" style={{ color: "#fff" }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: langColor,
              display: "inline-block",
              marginRight: 5,
              flexShrink: 0,
            }}
          />
          {getLanguageById(activeFile.language)?.label || activeFile.language}
        </div>
        <div className="e-si">UTF-8</div>
        <div className="e-si">Y.js Sync</div>
        <div className="e-si e-si-ml">collab.code v1.0</div>
      </div>
    </div>
  );
}

function executeJavaScript(code) {
  const output = [];

  const makeEntry = (type) => (...args) =>
    output.push({
      type,
      text: args.map((arg) =>
        arg === null ? "null"
          : arg === undefined ? "undefined"
            : typeof arg === "object" ? JSON.stringify(arg, null, 2)
              : String(arg)
      ).join(" "),
      timestamp: Date.now(),
    });

  const mockConsole = {
    log: makeEntry("log"),
    error: makeEntry("error"),
    warn: makeEntry("warn"),
    info: makeEntry("log"),
    table: makeEntry("log"),
    dir: makeEntry("log"),
    clear: () => {},
  };

  try {
    const fn = new Function("console", code);
    const result = fn(mockConsole);

    if (result !== undefined) {
      output.push({
        type: "return",
        text: `-> ${typeof result === "object" ? JSON.stringify(result, null, 2) : String(result)}`,
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
