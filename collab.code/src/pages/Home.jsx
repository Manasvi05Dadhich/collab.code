import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const LANGS = ["javascript","typescript","python","rust","go","cpp","css","html"];
const LANG_LABELS = {
  javascript:"JS", typescript:"TS", python:"PY",
  rust:"RS", go:"GO", cpp:"C++", css:"CSS", html:"HTML",
};

function Home() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState("land"); 
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [lang, setLang] = useState("javascript");
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const generateId = () => {
    setRoomId(uuidv4());
  };

  const joinRoom = () => {
    const id = roomId.trim();
    const name = username.trim();
    if (!id || !name) {
      toast.error("Session ID and Username are required!");
      return;
    }
    navigate(`/editor/${id}`, { state: { username: name, lang } });
  };

  const handleKey = (e) => {
    if (e.key === "Enter") joinRoom();
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}>
      {/* ── Theme toggle ── */}
      <div id="thm-toggle" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
        <div className="thm-knob">{theme === "dark" ? "☽" : "☀"}</div>
      </div>

    
      {screen === "land" && (
        <div id="land">
          <nav className="l-nav">
            <div className="l-logo">collab<b>.code</b></div>
            <div className="l-nav-links">
              <span className="l-nav-a">Features</span>
              <span className="l-nav-a">Docs</span>
              <span className="l-nav-a">Changelog</span>
            </div>
            <button className="l-nav-cta" onClick={() => setScreen("join")}>Get started</button>
          </nav>

          <div className="l-hero">
            <div className="l-eyebrow">
              <div className="l-ey-dot" />
              Real-time · Multi-language · Zero setup
            </div>

            <h1 className="l-h1">
              The editor<br />
              <span className="a">built for</span><br />
              <span className="d">together.</span>
            </h1>

            <p className="l-sub">
              Live cursors, instant sync, 8 languages. Code with your team like you're sitting side by side.
            </p>

            <div className="l-btns">
              <button className="l-btn-fill" onClick={() => setScreen("join")}>
                Open a session →
              </button>
              <button className="l-btn-out">Watch the demo</button>
            </div>

            <div className="l-bento">
              {[
                { ico:"⚡", t:"Live cursors",    d:"See teammates in real time. Sub-50ms sync, no refresh." },
                { ico:"🌐", t:"8 Languages",     d:"JS, TS, Python, Rust, Go, C++, CSS, HTML. Switch instantly." },
                { ico:"🔒", t:"Private sessions",d:"Ephemeral by default. Share only with who you choose." },
                { ico:"💾", t:"Auto-save",       d:"Saves as you type. Export any time. Never lose work." },
              ].map(c => (
                <div className="l-card" key={c.t}>
                  <div className="l-card-ico">{c.ico}</div>
                  <div className="l-card-t">{c.t}</div>
                  <div className="l-card-d">{c.d}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="l-strip">
            {[["12k+","Developers"],["8","Languages"],["<50ms","Sync latency"],["∞","Sessions"]].map(([n,l]) => (
              <div className="l-stat" key={l}>
                <div className="l-stat-n">{n}</div>
                <div className="l-stat-l">{l}</div>
              </div>
            ))}
            <div className="l-strip-cta">
              <button
                className="l-btn-fill"
                style={{ height:"36px", fontSize:"13px", padding:"0 18px" }}
                onClick={() => setScreen("join")}
              >
                Start now →
              </button>
            </div>
          </div>
        </div>
      )}

     
      {screen === "join" && (
        <div id="join">
          <nav className="j-nav">
            <div className="j-logo" onClick={() => setScreen("land")}>collab<b>.code</b></div>
            <div className="j-live"><div className="j-live-dot" />&nbsp;Live</div>
          </nav>

          <div className="j-body">
            <div className="j-card">
              <div className="j-card-top">
                <div className="j-pre">New session</div>
                <div className="j-title">Step <span>in.</span></div>
                <div className="j-sub">Name yourself, pick a language, enter.</div>
              </div>

              <div className="j-lang-label">Language</div>
              <div className="j-chips">
                {LANGS.map(l => (
                  <div
                    key={l}
                    className={`j-chip${lang === l ? " on" : ""}`}
                    onClick={() => setLang(l)}
                  >
                    {LANG_LABELS[l]}
                  </div>
                ))}
              </div>

              <div className="j-inp-wrap">
                <input
                  className="j-inp"
                  id="j-name"
                  type="text"
                  placeholder="Your name"
                  autoComplete="off"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={handleKey}
                />
              </div>
              <div className="j-inp-wrap">
                <input
                  className="j-inp mono"
                  id="j-sess"
                  type="text"
                  placeholder="Session ID  e.g. dawn-9x2k"
                  autoComplete="off"
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                  onKeyDown={handleKey}
                />
              </div>

              <div className="j-actions">
                <button className="j-btn-main" onClick={joinRoom}>Enter session →</button>
                <button className="j-btn-ghost" onClick={generateId}>✦ Generate session ID</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;