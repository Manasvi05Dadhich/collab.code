import React, { useRef, useEffect } from "react";
import MonacoEditor from "@monaco-editor/react";

function injectCursorStyles(cursors) {
  let styleEl = document.getElementById("remote-cursor-styles");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "remote-cursor-styles";
    document.head.appendChild(styleEl);
  }

  const css = cursors
    .map(
      (cursor) => `
    .remote-cursor-${cursor.id} {
      border-left: 2px solid ${cursor.color} !important;
      margin-left: -1px;
    }
    .remote-cursor-widget-${cursor.id}::after {
      content: '${cursor.username}';
      position: absolute;
      top: -1.4em;
      left: -1px;
      background: ${cursor.color};
      color: #fff;
      padding: 1px 6px 2px;
      border-radius: 3px 3px 3px 0;
      font-size: 11px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      white-space: nowrap;
      pointer-events: none;
      z-index: 100;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      animation: cursorLabelFadeIn 0.2s ease;
    }
    .remote-selection-${cursor.id} {
      background-color: ${cursor.color}30 !important;
    }
  `
    )
    .join("\n");

  styleEl.textContent = css;
}

/* ──────────────────────────────────────────────
 *  Editor Component
 * ────────────────────────────────────────────── */
export default function Editor({
  filePath,
  code,
  language,
  theme,
  fontSize,
  onChange,
  onCursorChange,
  remoteCursors = [],
  onEditorMount,
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef(null);

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


    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        const selection = editor.getSelection();
        onCursorChange({
          position: e.position,
          selection:
            selection && !selection.isEmpty()
              ? {
                  startLineNumber: selection.startLineNumber,
                  startColumn: selection.startColumn,
                  endLineNumber: selection.endLineNumber,
                  endColumn: selection.endColumn,
                }
              : null,
        });
      }
    });
    editor.onDidChangeCursorSelection((e) => {
      if (onCursorChange) {
        const sel = e.selection;
        onCursorChange({
          position: { lineNumber: sel.positionLineNumber, column: sel.positionColumn },
          selection: sel.isEmpty()
            ? null
            : {
                startLineNumber: sel.startLineNumber,
                startColumn: sel.startColumn,
                endLineNumber: sel.endLineNumber,
                endColumn: sel.endColumn,
              },
        });
      }
    });

    if (onEditorMount) {
      onEditorMount(editor, monaco);
    }
  };


  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || remoteCursors.length === 0)
      return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;


    injectCursorStyles(remoteCursors);

    const decorations = [];

    remoteCursors.forEach((cursor) => {
      if (!cursor.position) return;

      decorations.push({
        range: new monaco.Range(
          cursor.position.lineNumber,
          cursor.position.column,
          cursor.position.lineNumber,
          cursor.position.column
        ),
        options: {
          className: `remote-cursor-${cursor.id}`,
          afterContentClassName: `remote-cursor-widget-${cursor.id}`,
          stickiness: 1,
        },
      });

      if (cursor.selection) {
        decorations.push({
          range: new monaco.Range(
            cursor.selection.startLineNumber,
            cursor.selection.startColumn,
            cursor.selection.endLineNumber,
            cursor.selection.endColumn
          ),
          options: {
            className: `remote-selection-${cursor.id}`,
            stickiness: 1,
          },
        });
      }
    });

    if (decorationsRef.current) {
      decorationsRef.current.clear();
    }
    decorationsRef.current = editor.createDecorationsCollection(decorations);
  }, [remoteCursors]);

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
            "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontLigatures: true,
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