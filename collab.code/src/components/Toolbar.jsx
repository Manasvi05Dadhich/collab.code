import React from "react";
import { LANGUAGES } from "../constants/languages";

export default function Toolbar({
  language,
  onLanguageChange,
  onRun,
  isRunning,
  fontSize,
  onFontSizeChange,
  theme,
  onThemeToggle,
  saveStatus,
}) {
  return (
    <div className="Toolbar">
      <div className="ToolbarLeft">
        <button
          className="RunBtn"
          onClick={onRun}
          disabled={isRunning}
          title="Run Code (Ctrl+Enter)"
        >
          {isRunning ? (
            <span className="spinner-btn"></span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          <span>{isRunning ? "Running..." : "Run"}</span>
        </button>

        <div className="LangSelectWrapper">
          <span
            className="LangDot"
            style={{
              backgroundColor:
                LANGUAGES.find((l) => l.id === language)?.color || "#ABB2BF",
            }}
          ></span>
          <select
            className="LangSelect"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ToolbarCenter">
        <span className={`SaveStatus ${saveStatus}`}>
          <span className={`save-dot ${saveStatus}`}></span>
          {saveStatus === "unsaved" && "Unsaved"}
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "Saved"}
        </span>
      </div>

      <div className="ToolbarRight">
        <div className="FontSizeControl">
          <button
            className="FontSizeBtn"
            onClick={() => onFontSizeChange(Math.max(10, fontSize - 1))}
            title="Decrease font size"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13H5v-2h14v2z" />
            </svg>
          </button>
          <span className="FontSizeValue">{fontSize}</span>
          <button
            className="FontSizeBtn"
            onClick={() => onFontSizeChange(Math.min(28, fontSize + 1))}
            title="Increase font size"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
        </div>

        <button
          className="ThemeToggle"
          onClick={onThemeToggle}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
