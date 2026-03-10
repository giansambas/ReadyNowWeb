export default async function handler(req, res) {

  const username = req.cookies?.username;

  if (!username) {
    return res.json({ user: null });
  }

  res.json({
    user: {
      username
    }
  });
}