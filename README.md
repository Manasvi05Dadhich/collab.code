# 🚀 collab.code — Real-Time Collaborative Code Editor

**collab.code** is a visually rich, multi-language collaborative code editor designed to simulate real-time coding environments. It enables users to join shared sessions, write code together, and experience live collaboration through an immersive UI.

---

## 🌟 Highlights

* 🧑‍💻 **Session-based collaboration**
* 👀 **Live cursor simulation & collaborator presence**
* 🌐 **Multi-language editor (JS, TS, Python, C++, HTML, CSS, Go, Rust)**
* ⚡ **Instant code execution (JavaScript)**
* 🎨 **Modern glassmorphism UI + animated backgrounds**
* 🌗 **Dark / Light theme toggle**
* 📊 **VS Code–like interface (tabs, sidebar, minimap, output panel)**

---

## 🖼️ UI Overview

* **Landing Page** → Animated hero + preview editor
* **Join Screen** → Enter name, session ID, choose language
* **Editor Screen** → Full IDE layout with:

  * File explorer
  * Code editor
  * Live cursors
  * Output console
  * Collaborator panel

---

## 🏗️ Tech Stack

### Frontend

* HTML5
* CSS3 (Custom design system, animations, glass UI)
* Vanilla JavaScript

### Concepts Used

* DOM Manipulation
* State Management (language/session)
* Dynamic UI rendering
* Simulated collaborative environment

---

## 📁 Project Structure

```bash
collab.code/
│
├── index.html        # Full application (UI + logic)
├── README.md         # Project documentation
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/collab.code.git
cd collab.code
```

### 2. Run the project

Simply open in browser:

```bash
index.html
```

---

## 🎮 Usage Flow

1. Open the app
2. Click **“Start coding”**
3. Enter:

   * Your name
   * Session ID (or generate one)
4. Choose a programming language
5. Start coding in the editor

---

## 🧠 How It Works

* **Session IDs** simulate collaborative rooms
* **Language system** dynamically loads code templates
* **Editor logic** updates UI based on user actions
* **Run button** executes JavaScript using `eval()`
* **Collaborators panel** visually simulates real-time users

---

## ⚠️ Limitations

* ❌ No real-time backend (collaboration is simulated)
* ❌ Code execution limited to JavaScript
* ❌ No persistence (refresh resets state)

---

## 🔮 Future Enhancements

* 🔥 Real-time collaboration using **Socket.io**
* 🧠 Backend code execution (multi-language support)
* 👤 Authentication system
* 💾 File saving & project workspace
* 📡 Live cursor sync across users
* 🐳 Secure sandboxed execution (Docker)

---

## 💡 Learning Outcomes

* Building complex UI systems from scratch
* Managing interactive states without frameworks
* Designing production-level developer tools UI
* Understanding real-time system architecture

---

## 🤝 Contributing

Feel free to fork this project and improve it!

---

## 📜 License

MIT License

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
