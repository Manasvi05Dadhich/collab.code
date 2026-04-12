import React, { useState } from "react";
import { LANGUAGES } from "../constants/languages";

function getLanguageColor(language) {
  const lang = LANGUAGES.find((l) => l.id === language);
  return lang?.color || "#ABB2BF";
}

export default function FileTabsBar({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onCloseFile,
  onRenameFile,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const handleDoubleClick = (file) => {
    setEditingId(file.id);
    setEditValue(file.name);
  };

  const handleRenameSubmit = (fileId) => {
    if (editValue.trim()) {
      onRenameFile(fileId, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="FileTabsBar">
      <div className="TabsScroll">
        {files.map((file) => (
          <div
            key={file.id}
            className={`FileTab ${file.id === activeFileId ? "active" : ""}`}
            onClick={() => onSelectFile(file.id)}
            onDoubleClick={() => handleDoubleClick(file)}
          >
            {editingId === file.id ? (
              <input
                className="TabRenameInput"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleRenameSubmit(file.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit(file.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span
                  className="TabDot"
                  style={{ backgroundColor: getLanguageColor(file.language) }}
                ></span>
                <span className="TabName">{file.name}</span>
              </>
            )}
            {files.length > 1 && (
              <button
                className="TabClose"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile(file.id);
                }}
                title="Close file"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
      <button className="AddFileBtn" onClick={onAddFile} title="New File">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </button>
    </div>
  );
}
