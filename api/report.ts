import { kv } from "@vercel/kv";

export default async function handler(req, res) {

  // GET reports
  if (req.method === "GET") {

    const keys = await kv.keys("report:*");

    const reports = await Promise.all(
      keys.map((key) => kv.get(key))
    );

    return res.json(reports.filter(Boolean));
  }

  // POST report
  if (req.method === "POST") {

    const username = req.cookies?.username;

    if (!username) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { location, disaster, description } = req.body;

    if (!location || !disaster || !description) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const id = Date.now();

    const report = {
      id,
      username,
      location,
      disaster,
      description,
      time: new Date().toISOString()
    };

    await kv.set(`report:${id}`, report, {
      ex: 86400   // 24 hours
    });

    res.json({
      status: "success"
    });
  }
}