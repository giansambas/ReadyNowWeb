import { kv } from "@vercel/kv";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { username, password } = req.body;

  const user = await kv.get<{ password: string }>(`user:${username}`);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

res.setHeader(
  "Set-Cookie",
  `username=${username}; Path=/; HttpOnly`
);

res.json({
  username,
  status: "success"
});
}