import React, { useRef, useEffect, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from 'y-monaco'
import CURSOR_COLORS from '../constants/cursorColors';

export default function Editor({
  filePath,
  code,
  language,
  theme,
  fontSize,
  onChange,
  roomId,
  username,
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const providerRef = useRef(null);
  const [editorReady, setEditorReady] = useState(false);

  const handleBeforeMount = (monaco) => {
    monaco.editor.defineTheme("collab-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955", fontStyle: "italic" },
        { token: "keyword", foreground: "C586C0" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
        { token: "type", foreground: "4EC9B0" },
        { token: "function", foreground: "DCDCAA" },
        { token: "variable", foreground: "9CDCFE" },
      ],
      colors: {
        "editor.background": "#1c1e29",
        "editor.foreground": "#e1e1e6",
        "editor.lineHighlightBackground": "#2a2d3e",
        "editor.selectionBackground": "#3a3f5c",
        "editorCursor.foreground": "#4eafff",
        "editorLineNumber.foreground": "#4a4e69",
        "editorLineNumber.activeForeground": "#e1e1e6",
        "editor.inactiveSelectionBackground": "#2a2d3e80",
        "editorWidget.background": "#282a36",
        "editorSuggestWidget.background": "#282a36",
        "editorSuggestWidget.border": "#3a3f5c",
        "editorSuggestWidget.selectedBackground": "#3a3f5c",
        "editorIndentGuide.background": "#3a3f5c40",
        "editorIndentGuide.activeBackground": "#4eafff40",
        "editorBracketMatch.background": "#4eafff20",
        "editorBracketMatch.border": "#4eafff60",
      },
    });

    monaco.editor.defineTheme("collab-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A737D", fontStyle: "italic" },
        { token: "keyword", foreground: "D73A49" },
        { token: "string", foreground: "032F62" },
        { token: "number", foreground: "005CC5" },
        { token: "type", foreground: "6F42C1" },
        { token: "function", foreground: "6F42C1" },
        { token: "variable", foreground: "24292E" },
      ],
      colors: {
        "editor.background": "#FFFFFF",
        "editor.foreground": "#24292E",
        "editor.lineHighlightBackground": "#F6F8FA",
        "editor.selectionBackground": "#C8E1FF",
        "editorCursor.foreground": "#2563EB",
        "editorLineNumber.foreground": "#B0B7C3",
        "editorLineNumber.activeForeground": "#24292E",
        "editorWidget.background": "#F3F4F6",
        "editorSuggestWidget.background": "#FFFFFF",
        "editorSuggestWidget.border": "#E5E7EB",
        "editorSuggestWidget.selectedBackground": "#E5E7EB",
        "editorIndentGuide.background": "#E5E7EB",
        "editorIndentGuide.activeBackground": "#2563EB40",
        "editorBracketMatch.background": "#2563EB20",
        "editorBracketMatch.border": "#2563EB60",
      },
    });
  };


  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setEditorReady(true);
  };

  useEffect(() => {
    if(!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider('ws://localhost:1234', roomId, ydoc);
    providerRef.current = provider;
    const ytext = ydoc.getText('monaco');
    const binding = new MonacoBinding(ytext, editor.getModel(), new Set([editor]), provider.awareness);
    const colorIndex = username.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % CURSOR_COLORS.length;
    provider.awareness.setLocalStateField('user', {
      name: username,
      color: CURSOR_COLORS[colorIndex],
    });

    const injectAwarenessCursorStyles = () => {
      let styleEl = document.getElementById('yjs-cursor-styles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'yjs-cursor-styles';
        document.head.appendChild(styleEl);
      }
      let css = '';
      provider.awareness.getStates().forEach((state, clientId) => {
        if (clientId === provider.awareness.clientID) return;
        const user = state.user;
        if (!user) return;
        const encodedColor = encodeURIComponent(user.color);
        const cursorSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='18' viewBox='0 0 16 18'%3E%3Cpath d='M1 1 L15 9 L8 9 L8 17 Z' fill='${encodedColor}' stroke='white' stroke-width='1' stroke-linejoin='round'/%3E%3C/svg%3E`;
        css += `
          .yRemoteSelectionHead-${clientId} {
            border-left: none !important;
            position: relative;
          }
          .yRemoteSelectionHead-${clientId}::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            width: 16px;
            height: 20px;
            background-image: url("${cursorSvg}");
            background-size: contain;
            background-repeat: no-repeat;
            z-index: 101;
            pointer-events: none;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
          }
          .yRemoteSelectionHead-${clientId}::after {
            content: '${user.name}';
            position: absolute;
            top: -1.5em;
            left: 14px;
            background: ${user.color};
            color: #fff;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            font-family: 'Source Sans 3', 'Segoe UI', sans-serif;
            white-space: nowrap;
            pointer-events: none;
            z-index: 100;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          }
          .yRemoteSelection-${clientId} {
            background-color: ${user.color}30 !important;
          }
        `;
      });
      styleEl.textContent = css;
    };

    provider.awareness.on('change', injectAwarenessCursorStyles);
    injectAwarenessCursorStyles();

    return () => {
      provider.awareness.off('change', injectAwarenessCursorStyles);
      binding.destroy();
      provider.disconnect();
      ydoc.destroy();
    };
  }, [roomId, editorReady, username]);



  return (
    <div className="EditorContainer">
      <MonacoEditor
        height="100%"
        path={filePath}
        language={language}
        value={code}
        theme={theme === "dark" ? "collab-dark" : "collab-light"}
        onChange={onChange}
        beforeMount={handleBeforeMount}
        onMount={handleEditorDidMount}
        options={{
          fontSize,
          fontFamily:
            "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
          fontLigatures: true,
          lineHeight: 24,
          fontWeight: "500",
          minimap: { enabled: true, scale: 2 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          formatOnPaste: true,
          automaticLayout: true,
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: "all",
          wordWrap: "on",
          tabSize: 2,
          lineNumbers: "on",
          folding: true,
          links: true,
          colorDecorators: true,
          contextmenu: true,
          mouseWheelZoom: true,
        }}
        loading={
          <div className="EditorLoading">
            <div className="LoadingSpinner"></div>
            <span>Loading editor…</span>
          </div>
        }
      />
    </div>
  );
}
