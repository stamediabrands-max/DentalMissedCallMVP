export default function handler(req, res) {
  try {
    res.json({ status: "Function is alive – no Supabase" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
