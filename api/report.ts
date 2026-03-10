import { kv } from "@vercel/kv";

export default async function handler(req, res) {

  // GET reports
  if (req.method === "GET") {

    const reports = await kv.get("reports");

    return res.json(reports || []);
  }

  // POST report
  if (req.method === "POST") {

    const username = req.cookies?.username;

    if (!username) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    const { location, disaster, description } = req.body;

    if (!location || !disaster || !description) {
      return res.status(400).json({
        error: "Missing fields"
      });
    }

    type Report = {
  id: number
  username: string
  location: string
  disaster: string
  description: string
  time: string
}

const reports = (await kv.get<Report[]>("reports")) || [];

    const newReport = {
      id: Date.now(),
      username,
      location,
      disaster,
      description,
      time: new Date().toISOString()
    };

    reports.unshift(newReport);

    await kv.set("reports", reports);

    res.json({
      status: "success"
    });
  }

}