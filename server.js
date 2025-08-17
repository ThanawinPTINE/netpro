/* server.js */
const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { db, initDb, getUserByName, createUser, getOrCreateRoom, listRooms, saveMessage } = require("./db");
const bcrypt = require("bcrypt");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/** REST: register user */
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !username.trim()) {
      return res.status(400).json({ error: "Username is required" });
    }
    const name = username.trim();
    let user = await getUserByName(name);
    if (user) {
      return res.json({ id: user.id, username: user.username, created: false });
    }
    let passwordHash = null;
    if (password && password.length >= 4) {
      passwordHash = await bcrypt.hash(password, 10);
    }
    const newUser = await createUser(name, passwordHash);
    return res.json({ id: newUser.id, username: newUser.username, created: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/** REST: list rooms */
app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await listRooms();
    res.json(rooms);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

io.on("connection", (socket) => {
  // keep track of current user and room on this socket
  socket.data.user = null;
  socket.data.room = null;

  socket.on("exitRoom", () => {
    if (socket.data.room) {
      const roomName = socket.data.room.name;
      socket.leave(roomName);
      io.to(roomName).emit("system", `🚪 ${socket.data.user?.username || "Unknown"} left #${roomName}`);
      socket.emit("leftRoom", { room: roomName });
      socket.data.room = null;
    }
  });

  socket.on("logout", () => {
    if (socket.data.room) {
      const roomName = socket.data.room.name;
      socket.leave(roomName);
      socket.emit("leftRoom", { room: roomName });
      socket.data.room = null;
    }
    socket.data.user = null;
    socket.emit("system", "You have been logged out.");
  });

  socket.on("register", async ({ username }) => {
    try {
      let user = await getUserByName(username);
      if (!user) {
        user = await createUser(username, null);
      }
      socket.data.user = user;
      socket.emit("system", `✅ Logged in as ${user.username}. Type /help for commands.`);
    } catch (e) {
      console.error(e);
      socket.emit("system", "⚠️ Failed to register user.");
    }
  });

  socket.on("joinRoom", async ({ roomName }) => {
    try {
      if (!socket.data.user) {
        return socket.emit("system", "Please /login <username> first.");
      }
      const room = await getOrCreateRoom(roomName);
      if (socket.data.room) {
        socket.leave(socket.data.room.name);
      }
      socket.join(room.name);
      socket.data.room = room;
      io.to(room.name).emit("system", `👤 ${socket.data.user.username} joined #${room.name}`);
    } catch (e) {
      console.error(e);
      socket.emit("system", "⚠️ Failed to join room.");
    }
  });

  socket.on("chatMessage", async ({ text }) => {
    try {
      if (!socket.data.user) return socket.emit("system", "Please /login <username> first.");
      if (!socket.data.room) return socket.emit("system", "Join a room with /join <room>.");
      const msg = text.trim();
      if (msg.length === 0) return;
      await saveMessage(socket.data.room.id, socket.data.user.id, msg);
      io.to(socket.data.room.name).emit("message", {
        user: socket.data.user.username,
        room: socket.data.room.name,
        text: msg,
        ts: Date.now()
      });
    } catch (e) {
      console.error(e);
    }
  });

  socket.on("disconnect", () => {
    // optional: notify room
  });
});

async function start() {
  await initDb();
  server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
start();
