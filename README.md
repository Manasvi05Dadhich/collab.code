# 🚀 collab.code — Real-Time Collaborative Code Editor

**collab.code** is a full-stack real-time collaborative code editor that enables multiple users to write, edit, and share code simultaneously in a shared session.

Built using modern web technologies, it delivers a seamless coding experience with instant synchronization across users.

---

## ✨ Features

* ⚡ **Real-time code collaboration**
* 👥 **Multiple users in a shared room**
* 🔄 **Live code synchronization**
* 🧠 **Auto-sync for new users**
* 🏠 **Room-based session system**
* 📋 **Copy & share session ID**
* 🚪 **Join / Leave functionality**
* 🔔 **User join/leave notifications**

---

## 🏗️ Tech Stack

### Frontend

* ⚛️ React.js
* React Router
* CodeMirror (code editor)

### Backend

* 🟢 Node.js
* 🚂 Express.js
* 🔌 Socket.io (WebSockets)

---

## 🧠 How It Works

collab.code uses **WebSockets (Socket.io)** to maintain a persistent connection between the server and all connected clients.

### 🔄 Real-time Flow

```bash
User A types → Server → User B & C instantly see updates
```

---

## 📁 Project Structure

```bash
collab.code/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.js
│
├── server/
│   ├── server.js
│   └── socket.js
│
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/collab.code.git
cd collab.code
```

---

### 2. Setup Client

```bash
cd client
npm install
npm start
```

---

### 3. Setup Server

```bash
cd server
npm install
node server.js
```

---

## 🎮 Usage

1. Open the application
2. Enter:

   * Username
   * Room ID (or generate one)
3. Join the session
4. Start coding collaboratively 🚀

---

## 🔌 Socket Events

| Event         | Description             |
| ------------- | ----------------------- |
| `join`        | User joins a room       |
| `code-change` | Broadcast code updates  |
| `sync-code`   | Sync code for new users |
| `disconnect`  | Handle user leaving     |

---

## ⚠️ Limitations

* ❌ Limited language support (depends on editor setup)
* ❌ No authentication system
* ❌ No persistent storage
* ❌ Basic UI (can be enhanced further)

---

## 🔮 Future Enhancements

* 🔥 Multi-language execution support
* 👤 Authentication & user profiles
* 💾 Save sessions/projects
* 🎯 Live cursor tracking
* 🌐 Deployment (Vercel / Render)

---

## 💡 Learning Outcomes

* Real-time communication using Socket.io
* Full-stack architecture design
* Handling multiple clients simultaneously
* Building collaborative systems

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork and improve.

---

## 📜 License

MIT License

---
## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!
