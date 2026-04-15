# collab.code

A real-time collaborative code editor I built to learn how WebSockets actually work under the hood. You open a session, share the ID with someone, and both of you can type in the same file at the same time — changes show up instantly on the other side.

## What it does

- **Live editing** — two or more people can edit the same code simultaneously. No polling, no refreshing. It's all WebSocket-based through Socket.io.
- **Room system** — each session gets a unique UUID. Share it and anyone can join. When someone joins or leaves, everyone gets a toast notification.
- **8 languages** — JavaScript, TypeScript, Python, Rust, Go, C++, CSS, HTML. Monaco handles syntax highlighting for all of them.
- **Run JS/TS in the browser** — there's a built-in execution engine that sandboxes your code using `new Function()`. Hit Ctrl+Enter or click Run.
- **Multi-file support** — create new files, rename them (double-click in the sidebar), close them. Each file keeps its own state.
- **Resizable panels** — sidebar and terminal panel can be dragged to resize, just like VS Code.

## Tech stack

| Layer | What I used |
|-------|-------------|
| Frontend | React, React Router, Monaco Editor |
| Backend | Node.js, Express, Socket.io |
| Styling | Vanilla CSS (no Tailwind, no Bootstrap) |

The UI is dark-mode by default with a light mode toggle. I went for a clean, minimal look inspired by Apple's design language — lots of subtle blur effects, smooth transitions, and a muted color palette.

## Running it locally

You need two terminals open.

**Terminal 1 — backend:**
```bash
cd collaborative-code-editor
npm install
npm run server:dev
```

**Terminal 2 — frontend:**
```bash
cd collaborative-code-editor/collab.code
npm install
npm start
```

Frontend runs on `localhost:3000`, backend on `localhost:5000`. There's a `.env` file inside `collab.code/` that points the frontend to the backend URL.

## How the real-time sync works

Pretty straightforward Socket.io event flow:

1. User joins a room → server stores their socket ID and broadcasts to everyone
2. Existing users send their current code to the new joiner via `sync-code`
3. When anyone types, `code-change` gets emitted → server relays it to everyone else in the room
4. On disconnect, server notifies remaining users

That's it. No CRDT, no OT algorithm. For a small number of concurrent editors it works fine.

## Keyboard shortcuts

- `Ctrl + Enter` — run code
- `Ctrl + S` — save (visual feedback only for now)
- `Ctrl + N` — new file

## Known limitations

- No persistent storage — refresh the page and your code is gone
- No auth — anyone with the room ID can join
- Only JS/TS can actually execute — other languages just get syntax highlighting
- No conflict resolution for simultaneous edits on the exact same line

## What I'd add next

- Hook up the [Piston API](https://github.com/engineer-man/piston) so Python/Rust/Go/C++ can actually run
- Remote cursor positions so you can see where others are typing
- MongoDB or Redis to persist sessions
- Proper operational transforms if this ever needs to scale

## License

MIT
