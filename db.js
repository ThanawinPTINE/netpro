
/* db.js */
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "chatcord.db");
const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, row) {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function (err, rows) {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initDb() {
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES rooms(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
}

async function getUserByName(username) {
  return await get(`SELECT * FROM users WHERE username = ?`, [username]);
}

async function createUser(username, passwordHash) {
  await run(`INSERT INTO users (username, password_hash) VALUES (?, ?)`, [username, passwordHash]);
  return await getUserByName(username);
}

async function getOrCreateRoom(name) {
  let room = await get(`SELECT * FROM rooms WHERE name = ?`, [name]);
  if (!room) {
    await run(`INSERT INTO rooms (name) VALUES (?)`, [name]);
    room = await get(`SELECT * FROM rooms WHERE name = ?`, [name]);
  }
  return room;
}

async function listRooms() {
  return await all(`SELECT id, name, created_at FROM rooms ORDER BY name ASC`);
}

async function saveMessage(roomId, userId, content) {
  await run(`INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)`, [roomId, userId, content]);
}

module.exports = {
  db,
  initDb,
  getUserByName,
  createUser,
  getOrCreateRoom,
  listRooms,
  saveMessage
};

if (require.main === module) {
  // allow manual init via `npm run init-db`
  initDb().then(() => {
    console.log("DB initialized at", DB_PATH);
    process.exit(0);
  });
}
