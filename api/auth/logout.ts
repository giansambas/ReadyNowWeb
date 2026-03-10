export default async function handler(req, res) {

  res.setHeader(
    "Set-Cookie",
    "username=; Path=/; HttpOnly; Max-Age=0"
  );

  res.json({
    status: "success"
  });
}