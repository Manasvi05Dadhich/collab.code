import React from "react";

export default function Client({ username, color, isYou = false }) {
  const initial = username ? username[0].toUpperCase() : "?";

  return (
    <div className="e-cr">
      <div className="e-cav" style={{ background: color }}>
        {initial}
      </div>
      <div className="e-ci">
        <div className="e-cn">{isYou ? `${username} (you)` : username}</div>
        <div className="e-cs">editing</div>
      </div>
      <div className="e-cdot" style={{ background: color }} />
    </div>
  );
}
