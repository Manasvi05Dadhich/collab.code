import React, { useRef, useCallback } from "react";

export default function OutputPanel({
  output,
  isVisible,
  onToggle,
  onClear,
  height,
  onResize,
  isRunning,
}) {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      isDragging.current = true;
      startY.current = e.clientY;
      startHeight.current = height;
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";

      const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        const delta = startY.current - e.clientY;
        const newHeight = Math.max(
          80,
          Math.min(window.innerHeight * 0.6, startHeight.current + delta)
        );
        onResize(newHeight);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [height, onResize]
  );


  if (!isVisible) {
    return (
      <div className="OutputCollapsed">
        <button onClick={onToggle} className="OutputToggleBtn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14l5-5 5 5z" />
          </svg>
          <span>Console</span>
        </button>
      </div>
    );
  }


  return (
    <div className="OutputPanel" style={{ height }}>
      <div className="OutputResizeHandle" onMouseDown={handleMouseDown}>
        <div className="ResizeGrip"></div>
      </div>

      <div className="OutputHeader">
        <div className="OutputHeaderLeft">
          <button onClick={onToggle} className="OutputToggleBtn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
            <span>Console</span>
          </button>
          {isRunning && (
            <span className="RunningTag">
              <span className="spinner-small"></span>
              Running...
            </span>
          )}
        </div>
        <button onClick={onClear} className="ClearBtn" title="Clear console">
          Clear
        </button>
      </div>

      <div className="OutputContent">
        {output.length === 0 ? (
          <div className="OutputEmpty">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <span>Run your code to see output here…</span>
          </div>
        ) : (
          output.map((entry, i) => (
            <div key={i} className={`OutputEntry ${entry.type}`}>
              <span className="OutputTimestamp">
                {new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span className="OutputIcon">
                {entry.type === "error" && "✕"}
                {entry.type === "warn" && "⚠"}
                {entry.type === "info" && "ℹ"}
                {entry.type === "log" && "›"}
                {entry.type === "return" && "←"}
                {entry.type === "system" && "⚙"}
              </span>
              <pre className="OutputText">{entry.text}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
