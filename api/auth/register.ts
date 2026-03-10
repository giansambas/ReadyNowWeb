import { kv } from "@vercel/kv";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const existing = await kv.get(`user:${username}`);

  if (existing) {
    return res.status(400).json({ error: "Username already exists" });
  }

  const hash = await bcrypt.hash(password, 10);

  await kv.set(`user:${username}`, { password: hash });

  res.json({ status: "success" });
}