import express from "express";
import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "readynow-secret-key-12345";

// Render requires writable location
const dbPath =
  process.env.NODE_ENV === "production"
    ? "/tmp/data.db"
    : "data.db";

const db = new Database(dbPath);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Initialize Database
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT,
  location TEXT,
  disaster TEXT,
  description TEXT,
  time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Register
app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const info = db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(username, hashedPassword);

    const token = jwt.sign(
      { id: info.lastInsertRowid, username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none"
    });

    res.json({
      id: info.lastInsertRowid,
      username,
      status: "success"
    });

  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Username already exists" });
    }

    res.status(500).json({ error: "Server error" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  const user: any = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  });

  res.json({
    id: user.id,
    username: user.username,
    status: "success"
  });
});

// Get current user
app.get("/api/auth/me", (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.json({ user: null });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.json({ user: null });
  }
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ status: "success" });
});

// Get reports
app.get("/api/report", (req, res) => {
  const reports = db
    .prepare("SELECT * FROM reports ORDER BY time DESC")
    .all();

  res.json(reports);
});

// Submit report
app.post("/api/report", authenticate, (req: any, res) => {
  const { location, disaster, description } = req.body;
  const { id, username } = req.user;

  if (!location || !disaster || !description) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const info = db
    .prepare(`
      INSERT INTO reports
      (user_id, username, location, disaster, description)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(id, username, location, disaster, description);

  res.json({
    id: info.lastInsertRowid,
    status: "success"
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});