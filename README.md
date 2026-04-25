# collab.code

Real-time collaborative code editor. Open a room, share the link, write code together. That's it.

I built this to understand how real-time sync actually works — started with raw Socket.io broadcasts, hit the wall with merge conflicts on concurrent edits, then rewrote the sync layer using Y.js (CRDT). The difference was night and day.

![React](https://img.shields.io/badge/React_19-20232A?style=flat&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_v5-000000?style=flat&logo=express)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socketdotio)
![Y.js](https://img.shields.io/badge/Y.js_(CRDT)-6C3483?style=flat)
![Monaco](https://img.shields.io/badge/Monaco_Editor-007ACC?style=flat&logo=visualstudiocode&logoColor=white)

## How it works

Two protocols running on the same server, same port:

- **Y.js over WebSocket** — handles all document sync. Every keystroke gets encoded as a tiny CRDT delta (~50 bytes) and merged conflict-free on the other end. No server logic needed for conflict resolution because CRDTs handle it mathematically.
- **Socket.io** — handles presence only. Join/leave notifications, user list, room management. No code payloads flow through here anymore.

The server multiplexes both by intercepting the HTTP upgrade request — if the URL starts with `/yjs`, it routes to the Y.js WebSocket server. Everything else goes to Socket.io.

```
Client A ──┐                          ┌── Client B
           │   ┌──────────────────┐   │
           ├──►│  Express + HTTP  │◄──┤
           │   ├──────────────────┤   │
           │   │  /yjs → ws (Y.js)│   │  ← document sync (CRDT deltas)
           │   │  /*   → socket.io│   │  ← presence (join/leave/users)
           │   └──────────────────┘   │
           └──────────────────────────┘
```

### Per-file collaboration

Each file in the workspace gets its own `Y.Text` instance, keyed by file path. So when you switch files, the binding swaps — but the Y.js doc (and WebSocket connection) stays alive. One connection per room, not per file.

### Live cursors

Y.js has an awareness protocol that broadcasts cursor position + selection to all peers. I inject dynamic CSS per remote client — each cursor gets an SVG arrow and a floating name label in their assigned color. No extra WebSocket messages needed, it piggybacks on the same Y.js connection.

## Features

- **17 languages** — JS, TS, Python, Java, C++, C, C#, Go, Rust, Ruby, PHP, HTML, CSS, JSON, Markdown, SQL, Plain Text
- **Multi-file workspace** — create files/folders, rename (double-click), delete, drag between folders
- **Live cursors with labels** — see who's typing where, with colored SVG cursors and username tags
- **Built-in JS/TS execution** — sandboxed `new Function()` runner, hit Ctrl+Enter
- **Resizable panels** — sidebar and output panel are drag-resizable
- **Room system** — UUID-based sessions, join with a link, toast notifications on join/leave
- **Two themes** — dark (default) and light, toggle from the toolbar
- **Monaco Editor** — autocomplete, bracket matching, minimap, font ligatures, the works

## Tech stack

| What | Why |
|------|-----|
| React 19 + React Router 7 | SPA with room-based routing (`/editor/:roomId`) |
| Monaco Editor | Same editor engine as VS Code, with custom dark/light themes |
| Y.js + y-monaco + y-websocket | CRDT-based sync, zero-conflict merges, delta-encoded updates |
| Socket.io | Presence layer — room join/leave, connected user list |
| Express v5 | Static file serving + WebSocket upgrade routing |
| Node.js `ws` | Raw WebSocket server for Y.js (multiplexed with Socket.io) |
| Vanilla CSS | No framework. Custom properties, blur effects, transitions |

## Running locally

Two terminals:

**Backend:**
```bash
npm install
npm run server:dev
```

**Frontend:**
```bash
cd collab.code
npm install
npm start
```

Frontend on `localhost:3000`, backend on `localhost:5000`. The frontend auto-connects to the backend via env var or `window.location.origin` in production.

## Production build

Single command builds the React app and starts the Express server serving everything:

```bash
npm run build && npm start
```

The server serves the React build as static files and handles both WebSocket protocols. One process, one port, one deploy.

## Project structure

```
├── server.js                  # Express + Socket.io + Y.js WebSocket server
├── package.json               # Server deps (express, ws, y-websocket@1, socket.io)
└── collab.code/
    ├── package.json            # Client deps (react, yjs, y-websocket@3, y-monaco)
    └── src/
        ├── App.jsx             # Router setup
        ├── pages/
        │   ├── Home.jsx        # Landing page + join flow
        │   └── codeEditor.jsx  # Main editor page (861 lines — file state, sidebar, output panel)
        ├── components/
        │   ├── Editor.jsx      # Monaco + Y.js integration (binding, awareness, cursor injection)
        │   ├── FileTree.jsx    # Recursive file/folder tree with CRUD
        │   ├── FileTabsBar.jsx # Tab bar with close/switch
        │   ├── OutputPanel.jsx # Resizable console output
        │   ├── Toolbar.jsx     # Run, theme toggle, font size, language picker
        │   └── Client.jsx      # User avatar in sidebar
        └── constants/
            ├── languages.js    # 17 language configs with templates
            ├── cursorColors.js # 12 cursor colors for awareness
            └── Actions.js      # Socket.io event names
```

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Run code |
| `Ctrl + S` | Save |
| `Ctrl + N` | New file |

## What's not here (yet)

- No persistent storage — rooms are ephemeral, refresh = gone
- No auth — anyone with the room ID can join
- Only JS/TS can execute — other languages are editor-only for now
- No server-side code execution (Piston API would fix this)

## What I learned building this

The biggest takeaway was understanding *why* CRDTs exist. My first version used Socket.io to broadcast the entire document on every keystroke. It worked for 2 people, but the moment edits overlapped on the same line, one person's changes would get silently overwritten. Y.js solved this completely — concurrent edits merge deterministically with zero data loss. The tradeoff is a slightly larger initial sync payload (the CRDT state), but the per-keystroke overhead is tiny.

Also learned a lot about WebSocket multiplexing. Running two WebSocket-based protocols (Socket.io and raw `ws`) on the same HTTP server required intercepting the `upgrade` event and routing by URL path. Cleaner than running two servers.

## License

MIT
