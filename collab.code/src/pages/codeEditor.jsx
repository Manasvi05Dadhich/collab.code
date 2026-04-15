import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useLocation, useNavigate, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import Client from "../components/Client";
import Editor from "../components/Editor";
import {
  LANGUAGES,
  getLanguageById,
  getLanguageByExt,
  getExtFromFilename,
} from "../constants/languages";
import { initSocket } from "../socket";
import ACTIONS from "../constants/Actions";

const LANG_COLORS = {
  javascript: "#ff6b6b", typescript: "#69c0ff", python: "#b5f5a0",
  rust: "#ffd666", go: "#69d2e7", cpp: "#ffb347", css: "#c0a0ff", html: "#ffd666",
};
const COLLAB_COLORS = ["#2997ff","#ff6b6b","#30d158","#ffd666","#c0a0ff","#ffb347","#69c0ff","#ff9f0a"];

let fileCounter = 1;

function CodeEditor() {
  const { roomId } = useParams();
  const location   = useLocation();
  const navigate   = useNavigate();
  const username   = location.state?.username || "Anonymous";

  /* ── Files ── */
  const [files, setFiles] = useState([
    { id: "file-1", name: "main.js", language: "javascript", code: LANGUAGES[0].template },
  ]);
  const [activeFileId, setActiveFileId] = useState("file-1");
  const [renamingId, setRenamingId]     = useState(null);
  const [renameVal,  setRenameVal]      = useState("");

  /* ── UI ── */
  const [theme, setTheme]       = useState("dark");
  const [fontSize]              = useState(14);
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
  const [showLangMenu, setShowLangMenu] = useState(false);

  /* ── Layout (resizable) ── */
  const [sidebarWidth,    setSidebarWidth]    = useState(190);
  const [terminalHeight,  setTerminalHeight]  = useState(200);

  /* ── Output / run ── */
  const [output, setOutput]   = useState([
    { type: "dim", text: "// collab.code terminal", timestamp: 0 },
    { type: "ok",  text: "✓ session synced",        timestamp: 1 },
  ]);
  const [consoleLog, setConsoleLog] = useState([
    { type: "dim", text: "// browser console", timestamp: 0 },
  ]);
  const [terminalTab, setTerminalTab] = useState("output"); // "output" | "console"
  const [isRunning, setIsRunning] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");

  /* ── Collab ── */
  const [clients, setClients] = useState([]);
  const [remoteCursors] = useState([]);

  /* ── Refs ── */
  const socketRef       = useRef(null);
  const saveTimerRef    = useRef(null);
  const activeFileRef   = useRef(null);
  const activeFileIdRef = useRef(activeFileId);
  const langMenuRef     = useRef(null);
  const langBtnRef      = useRef(null);   // for fixed-position dropdown coords
  const isDraggingX     = useRef(false);
  const isDraggingY     = useRef(false);
  const [langMenuPos, setLangMenuPos] = useState({ top: 0, left: 0 });

  /* ── Apply theme to <html> ── */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  /* ── Keep refs in sync ── */
  useEffect(() => { activeFileRef.current = activeFile; });           // eslint-disable-line
  useEffect(() => { activeFileIdRef.current = activeFileId; }, [activeFileId]);

  /* ── Resize via mouse drag ── */
  useEffect(() => {
    const onMove = (e) => {
      if (isDraggingX.current) {
        // 40px = activity bar width
        setSidebarWidth(Math.max(120, Math.min(500, e.clientX - 40)));
      }
      if (isDraggingY.current) {
        const editorEl = document.getElementById("editor");
        if (editorEl) {
          const bottom    = editorEl.getBoundingClientRect().bottom;
          const newHeight = bottom - e.clientY - 22; // 22 = status bar
          setTerminalHeight(Math.max(60, Math.min(600, newHeight)));
        }
      }
    };
    const onUp = () => {
      if (isDraggingX.current || isDraggingY.current) {
        isDraggingX.current = false;
        isDraggingY.current = false;
        document.body.style.cursor     = "";
        document.body.style.userSelect = "";
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };
  }, []);

  /* ── Socket.IO ── */
  useEffect(() => {
    const init = async () => {
      try {
        socketRef.current = await initSocket();

        const handleError = (err) => {
          console.error("Socket error:", err);
          toast.error("Connection failed. Redirecting...");
          navigate("/");
        };
        socketRef.current.on("connect_error",   handleError);
        socketRef.current.on("connect_timeout", handleError);
        socketRef.current.on("error",           handleError);

        socketRef.current.on(ACTIONS.JOINED, ({ clients: roomClients, username: joinedUser, socketId }) => {
          if (joinedUser !== location.state?.username) {
            toast.success(`${joinedUser} joined the room`);
          }
          setClients(roomClients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            socketId,
            code: activeFileRef.current?.code,
          });
        });

        socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username: leftUser }) => {
          toast(`${leftUser} left the room`, { icon: "👋" });
          setClients(prev => prev.filter(c => c.socketId !== socketId));
        });

        socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
          if (code != null) {
            setFiles(prev =>
              prev.map(f => f.id === activeFileIdRef.current ? { ...f, code } : f)
            );
          }
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
        socketRef.current.off(ACTIONS.CODE_CHANGE);
        socketRef.current.disconnect();
      }
    };
  }, []); // eslint-disable-line

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  /* ── Handlers ── */
  const handleCodeChange = useCallback((newCode) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, code: newCode } : f));
    if (socketRef.current) {
      socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code: newCode });
    }
    setSaveStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus("saving");
      setTimeout(() => setSaveStatus("saved"), 500);
    }, 1500);
  }, [activeFileId, roomId]);

  const handleLanguageChange = useCallback((langId) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== activeFileId) return f;
      const lang = getLanguageById(langId);
      const ext  = lang?.ext || "txt";
      const base = f.name.includes(".") ? f.name.split(".").slice(0, -1).join(".") : f.name;
      return { ...f, language: langId, name: `${base}.${ext}`, code: lang?.template || "" };
    }));
    setShowLangMenu(false);
  }, [activeFileId]);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const { code, language } = activeFile;
      const ts = Date.now();
      // Always log to console tab too
      setConsoleLog(prev => [...prev, { type: "dim", text: `▶ Run at ${new Date(ts).toLocaleTimeString()}`, timestamp: ts }]);
      if (language === "javascript" || language === "typescript") {
        const results = executeJavaScript(code);
        setOutput(prev => [...prev, ...results]);
        setConsoleLog(prev => [...prev, ...results]);
      } else {
        const label = getLanguageById(language)?.label || language;
        const msg = { type: "system", text: `⚡ Connect a backend to run ${label}. JS & TS run locally.`, timestamp: Date.now() };
        setOutput(prev => [...prev, msg]);
        setConsoleLog(prev => [...prev, msg]);
      }
      setIsRunning(false);
    }, 300);
  }, [activeFile]);

  const handleAddFile = useCallback(() => {
    fileCounter++;
    const f = {
      id: `file-${Date.now()}`,
      name: `untitled-${fileCounter}.js`,
      language: "javascript",
      code: getLanguageById("javascript").template,
    };
    setFiles(prev => [...prev, f]);
    setActiveFileId(f.id);
  }, []);

  const handleCloseFile = useCallback((fileId) => {
    setFiles(prev => {
      const next = prev.filter(f => f.id !== fileId);
      if (fileId === activeFileId && next.length > 0) setActiveFileId(next[next.length - 1].id);
      return next.length ? next : prev;
    });
  }, [activeFileId]);

  const handleRenameFile = useCallback((fileId, newName) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      const ext  = getExtFromFilename(newName);
      const lang = ext ? getLanguageByExt(ext) : null;
      return { ...f, name: newName, language: lang?.id || f.language };
    }));
  }, []);

  const handleCursorChange = useCallback((data) => {
    if (data?.position) setCursorPos({ ln: data.position.lineNumber, col: data.position.column });
  }, []);

  const copyRoomId = async () => {
    try { await navigator.clipboard.writeText(roomId); toast.success("Room ID copied!"); }
    catch { toast.error("Failed to copy Room ID"); }
  };

  const leaveRoom = () => { navigate("/"); toast.success("Left the room"); };

  /* ── Click-outside for lang menu ── */
  useEffect(() => {
    const h = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── Keyboard shortcuts (capture phase — runs before Monaco) ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); handleRun(); }
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        setSaveStatus("saving");
        setTimeout(() => setSaveStatus("saved"), 400);
        toast.success("Saved!", { duration: 1500 });
      }
      if (e.ctrlKey && e.key === "n") { e.preventDefault(); handleAddFile(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [handleRun, handleAddFile]);

  /* ── Guard ── */
  if (!location.state) return <Navigate to="/" />;

  const langColor = LANG_COLORS[activeFile.language] || "#a1a1a6";

  /* ─── RENDER ──────────────────────────────────── */
  return (
    <div id="editor" data-theme={theme}>

      {/* ── Title bar ── */}
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
          {/* Language selector — dropdown uses position:fixed to escape backdrop-filter stacking context */}
          <div ref={langMenuRef} style={{ position: "relative" }}>
            <button
              ref={langBtnRef}
              className="e-lang-btn"
              onClick={() => {
                const rect = langBtnRef.current?.getBoundingClientRect();
                if (rect) {
                  setLangMenuPos({ top: rect.bottom + 6, left: rect.left });
                }
                setShowLangMenu(v => !v);
              }}
            >
              <div className="e-lang-dot" style={{ background: langColor }} />
              <span>{getLanguageById(activeFile.language)?.label || activeFile.language}</span>
              <span style={{ fontSize: "8px", color: "var(--text3)" }}>▾</span>
            </button>
          </div>

          <div className="e-avs">
            {clients.slice(0, 5).map((c, i) => (
              <div key={c.socketId} className="e-av"
                style={{ background: COLLAB_COLORS[i % COLLAB_COLORS.length] }}
                title={c.username}
              >
                {c.username?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
          <button className="e-tbtn" onClick={copyRoomId}>Copy ID</button>
          <button className="e-tbtn run" onClick={handleRun} disabled={isRunning}>
            {isRunning ? "⏳" : "▶ Run"}
          </button>
          <button className="e-tbtn" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "☀" : "☽"}
          </button>
          <button className="e-tbtn" onClick={leaveRoom}>Leave</button>
        </div>
      </div>

      {/* Language dropdown rendered at body level via fixed position — no stacking context issues */}
      {showLangMenu && (
        <div
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
          {LANGUAGES.map(l => (
            <div
              key={l.id}
              className={`e-lm-item${l.id === activeFile.language ? " on" : ""}`}
              onClick={() => handleLanguageChange(l.id)}
            >
              <div className="e-lm-dot" style={{ background: LANG_COLORS[l.id] || "#a1a1a6" }} />
              {l.label}
            </div>
          ))}
        </div>
      )}

      {/* ── Body ── */}
      <div className="e-body">

        {/* Activity bar */}
        <div className="e-act">
          <div className="e-act-i on">📁<span className="e-tip">Explorer</span></div>
          <div className="e-act-i">🔍<span className="e-tip">Search</span></div>
          <div className="e-act-i">🌿<span className="e-tip">Source Control</span></div>
          <div className="e-act-i" style={{ marginTop: "auto" }}>⚙️<span className="e-tip">Settings</span></div>
        </div>

        {/* ── Sidebar (resizable) ── */}
        <div className="e-side" style={{ width: sidebarWidth, minWidth: 0 }}>
          <div className="e-side-h">Explorer</div>
          {files.map(f => {
            const ext        = f.name.split(".").pop();
            const col        = LANG_COLORS[f.language] || "#a1a1a6";
            const isRenaming = renamingId === f.id;
            return (
              <div
                key={f.id}
                className={`e-file${f.id === activeFileId ? " on" : ""}`}
                onClick={() => setActiveFileId(f.id)}
                onDoubleClick={() => { setRenamingId(f.id); setRenameVal(f.name); }}
                title="Double-click to rename"
              >
                <span className="e-ext" style={{ background: col + "22", color: col }}>{ext}</span>
                {isRenaming ? (
                  <input
                    autoFocus
                    style={{
                      background: "var(--bg4)", border: "1px solid var(--acc)",
                      borderRadius: 4, color: "var(--text)", fontSize: 11,
                      padding: "1px 4px", width: "100%", outline: "none",
                      fontFamily: "'DM Mono', monospace",
                    }}
                    value={renameVal}
                    onChange={e => setRenameVal(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => {
                      if (e.key === "Enter")  { handleRenameFile(f.id, renameVal || f.name); setRenamingId(null); }
                      if (e.key === "Escape")   setRenamingId(null);
                    }}
                    onBlur={() => { handleRenameFile(f.id, renameVal || f.name); setRenamingId(null); }}
                  />
                ) : f.name}
              </div>
            );
          })}
        </div>

        {/* Sidebar ↔ editor drag handle */}
        <div
          className="e-resize-x"
          onMouseDown={() => {
            isDraggingX.current = true;
            document.body.style.cursor     = "col-resize";
            document.body.style.userSelect = "none";
          }}
        />

        {/* ── Code area: editor on top, terminal on bottom ── */}
        <div className="e-code-area">

          {/* File tabs */}
          <div className="e-tabs">
            {files.map(f => (
              <div
                key={f.id}
                className={`e-tab${f.id === activeFileId ? " on" : ""}`}
                onClick={() => setActiveFileId(f.id)}
              >
                {f.name}
                {files.length > 1 && (
                  <button className="e-tab-close"
                    onClick={e => { e.stopPropagation(); handleCloseFile(f.id); }}
                    title="Close"
                  >×</button>
                )}
              </div>
            ))}
            <div className="e-tab" onClick={handleAddFile} title="New file (Ctrl+N)"
              style={{ color:"var(--text3)", paddingLeft:12, paddingRight:12 }}
            >+</div>
          </div>

          {/* Monaco editor */}
          <div className="e-wrap" style={{ position: "relative" }}>
            <div className="e-amb" />
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

          {/* Editor ↕ terminal drag handle */}
          <div
            className="e-resize-y"
            onMouseDown={() => {
              isDraggingY.current = true;
              document.body.style.cursor     = "row-resize";
              document.body.style.userSelect = "none";
            }}
          />

          {/* Terminal / Output — bottom panel like VS Code */}
          <div className="e-terminal" style={{ height: terminalHeight }}>
            <div className="e-terminal-h">
              <div
                className={`e-terminal-tab${terminalTab === "output" ? " on" : ""}`}
                onClick={() => setTerminalTab("output")}
              >Output</div>
              <div
                className={`e-terminal-tab${terminalTab === "console" ? " on" : ""}`}
                onClick={() => setTerminalTab("console")}
              >Console</div>
              <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{
                  fontSize:10, fontFamily:"'DM Mono',monospace",
                  color:"var(--green)", animation:"pulse 2s infinite",
                }}>● live</span>
                <button className="e-tbtn" style={{ height:20, fontSize:10, padding:"0 8px" }}
                  onClick={() => {
                    if (terminalTab === "output") setOutput([]);
                    else setConsoleLog([]);
                  }}>Clear</button>
              </div>
            </div>
            <div className="e-terminal-body">
              {(terminalTab === "output" ? output : consoleLog).map((item, i) => (
                <div key={`${item.timestamp}-${i}`} className={`ol ${item.type}`}>
                  {item.text}
                </div>
              ))}
              {isRunning && terminalTab === "output" && <div className="ol hi">→ running<span className="blk" /></div>}
            </div>
          </div>
        </div>

        {/* ── Right collab panel ── */}
        <div className="e-rp">
          <div className="e-rp-h"><span>Collaborators</span></div>
          <div className="e-rp-body">
            <div className="e-ch">In session</div>
            {clients.map((c, i) => (
              <Client
                key={c.socketId}
                username={c.username}
                color={COLLAB_COLORS[i % COLLAB_COLORS.length]}
                isYou={c.username === username}
              />
            ))}
            {clients.length === 0 && (
              <div style={{ fontSize:11, color:"var(--text3)", fontFamily:"'DM Mono',monospace" }}>
                Connecting...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="e-status">
        <div className="e-si">
          ● {saveStatus === "saved" ? "saved" : saveStatus === "saving" ? "saving…" : "unsaved"}
        </div>
        <div className="e-si" style={{ color: "#fff" }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: langColor, display: "inline-block", marginRight: 5, flexShrink: 0,
          }} />
          {getLanguageById(activeFile.language)?.label || activeFile.language}
        </div>
        <div className="e-si">UTF-8</div>
        <div className="e-si">Ln {cursorPos.ln}, Col {cursorPos.col}</div>
        <div className="e-si e-si-ml">collab.code · v1.0</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
 *  JavaScript execution engine (browser sandbox)
 * ═══════════════════════════════════════════ */
function executeJavaScript(code) {
  const output = [];
  const makeEntry = (type) => (...args) =>
    output.push({
      type,
      text: args.map(a =>
        a === null ? "null"
        : a === undefined ? "undefined"
        : typeof a === "object" ? JSON.stringify(a, null, 2)
        : String(a)
      ).join(" "),
      timestamp: Date.now(),
    });

  const mockConsole = {
    log:   makeEntry("log"),
    error: makeEntry("error"),
    warn:  makeEntry("warn"),
    info:  makeEntry("log"),
    table: makeEntry("log"),
    dir:   makeEntry("log"),
    clear: () => {},
  };

  try {
    const fn = new Function("console", code);
    const result = fn(mockConsole);
    if (result !== undefined) {
      output.push({
        type: "return",
        text: `→ ${typeof result === "object" ? JSON.stringify(result, null, 2) : String(result)}`,
        timestamp: Date.now(),
      });
    }
  } catch (err) {
    output.push({ type: "error", text: `${err.name}: ${err.message}`, timestamp: Date.now() });
  }

  return output;
}

export default CodeEditor;