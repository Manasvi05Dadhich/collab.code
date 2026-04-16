import React, { useState } from "react";

const LANG_COLORS = {
  javascript: "#ff6b6b",
  typescript: "#69c0ff",
  python: "#b5f5a0",
  rust: "#ffd666",
  go: "#69d2e7",
  cpp: "#ffb347",
  css: "#c0a0ff",
  html: "#ffd666",
};

const btnStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--wb-text-dim)",
  fontSize: 12,
  lineHeight: 1,
  padding: "2px 4px",
  borderRadius: 4,
  transition: "all .12s",
  display: "flex",
  alignItems: "center",
};

function FileNode({
  node,
  depth,
  activeFileId,
  onSelectFile,
  onToggleFolder,
  onRenameNode,
  onDeleteNode,
  onAddFile,
  onAddFolder,
}) {
  const [hovered, setHovered] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(node.name);
  const indent = 10 + depth * 14;

  const commitRename = () => {
    onRenameNode(node.id, renameVal.trim() || node.name);
    setRenaming(false);
  };

  const inlineInput = (
    <input
      autoFocus
      value={renameVal}
      onChange={(e) => setRenameVal(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.stopPropagation();
          commitRename();
        }
        if (e.key === "Escape") {
          setRenaming(false);
          setRenameVal(node.name);
        }
      }}
      onBlur={commitRename}
      style={{
        background: "var(--wb-panel-5)",
        border: "1px solid var(--wb-accent)",
        borderRadius: 4,
        color: "var(--wb-text)",
        fontSize: 11,
        padding: "1px 5px",
        width: "calc(100% - 8px)",
        outline: "none",
        fontFamily: "'DM Mono', monospace",
      }}
    />
  );

  if (node.type === "folder") {
    return (
      <div>
        <div
          className="e-file"
          style={{ paddingLeft: indent, paddingRight: 6, userSelect: "none" }}
          onClick={() => onToggleFolder(node.id)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setRenaming(true);
            setRenameVal(node.name);
          }}
          title="Click to expand. Double-click to rename."
        >
          <span style={{ fontSize: 9, color: "var(--wb-text-dim)", width: 10, flexShrink: 0 }}>
            {node.expanded ? "▾" : "▸"}
          </span>
          <span style={{ fontSize: 11, marginRight: 5, flexShrink: 0, color: "var(--wb-text-3)" }}>
            □
          </span>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {renaming ? inlineInput : node.name}
          </span>
          {hovered && !renaming && (
            <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
              <button style={btnStyle} title="New file" onMouseDown={(e) => { e.stopPropagation(); onAddFile(node.id); }}>
                +
              </button>
              <button style={btnStyle} title="New folder" onMouseDown={(e) => { e.stopPropagation(); onAddFolder(node.id); }}>
                □+
              </button>
              <button
                style={{ ...btnStyle, color: "var(--red)" }}
                title="Delete"
                onMouseDown={(e) => { e.stopPropagation(); onDeleteNode(node.id); }}
              >
                ×
              </button>
            </div>
          )}
        </div>

        {node.expanded && node.children.map((child) => (
          <FileNode
            key={child.id}
            node={child}
            depth={depth + 1}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
            onToggleFolder={onToggleFolder}
            onRenameNode={onRenameNode}
            onDeleteNode={onDeleteNode}
            onAddFile={onAddFile}
            onAddFolder={onAddFolder}
          />
        ))}
      </div>
    );
  }

  const ext = node.name.includes(".") ? node.name.split(".").pop() : "txt";
  const color = LANG_COLORS[node.language] || "#a1a1a6";
  const isActive = node.id === activeFileId;

  return (
    <div
      className={`e-file${isActive ? " on" : ""}`}
      style={{ paddingLeft: indent, paddingRight: 6 }}
      onClick={() => onSelectFile(node.id)}
      onDoubleClick={() => {
        setRenaming(true);
        setRenameVal(node.name);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Double-click to rename"
    >
      <span className="e-ext" style={{ background: `${color}22`, color, flexShrink: 0 }}>
        {ext}
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {renaming ? inlineInput : node.name}
      </span>
      {hovered && !renaming && (
        <button
          style={{ ...btnStyle, color: "var(--red)", flexShrink: 0 }}
          title="Delete file"
          onMouseDown={(e) => { e.stopPropagation(); onDeleteNode(node.id); }}
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function FileTree({
  tree,
  activeFileId,
  onSelectFile,
  onToggleFolder,
  onRenameNode,
  onDeleteNode,
  onAddFile,
  onAddFolder,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        className="e-side-h"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 8 }}
      >
        <span>Explorer</span>
        <div style={{ display: "flex", gap: 2 }}>
          <button style={{ ...btnStyle, fontSize: 14 }} title="New file" onClick={() => onAddFile(null)}>
            +
          </button>
          <button style={{ ...btnStyle, fontSize: 11 }} title="New folder" onClick={() => onAddFolder(null)}>
            □+
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {tree.map((node) => (
          <FileNode
            key={node.id}
            node={node}
            depth={0}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
            onToggleFolder={onToggleFolder}
            onRenameNode={onRenameNode}
            onDeleteNode={onDeleteNode}
            onAddFile={onAddFile}
            onAddFolder={onAddFolder}
          />
        ))}
        {tree.length === 0 && (
          <div
            style={{
              padding: "16px 14px",
              fontSize: 11,
              color: "var(--wb-text-dim)",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            No files yet. Click + to create one.
          </div>
        )}
      </div>
    </div>
  );
}
