# 🎮 Simon Game

A modern and interactive Simon Memory Game built using HTML, CSS, and JavaScript, with a Node.js and Express backend for user authentication.

## ✨ Features

- 🎮 Classic Simon memory gameplay
- 🔴🟢🔵🟡 Interactive color pads
- 🔊 Sound effects
- 📈 Level progression
- 🏆 High score tracking
- ⏸️ Pause and resume
- 🎚️ Difficulty levels
- 🔐 User authentication
- 📝 User signup and login
- 🔑 JWT authentication
- 🛡️ Protected API routes
- 🗄️ MongoDB database integration
- 📱 Responsive design

## 🛠️ Technologies

### Frontend

- HTML5
- CSS3
- JavaScript
- Web Audio API
- LocalStorage

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- dotenv

### Tools

- Git
- GitHub
- VS Code
- Postman

## 📂 Project Structure

```text
Simon-Game/
│
├── index.html
├── style.css
├── script.js
├── .gitignore
│
└── backend/
    ├── server.js
    ├── db.js
    │
    ├── middleware/
    │   └── authMiddleware.js
    │
    ├── models/
    │   └── User.js
    │
    ├── routes/
    │   ├── auth.js
    │   └── protected.js
    │
    ├── package.json
    └── package-lock.json
