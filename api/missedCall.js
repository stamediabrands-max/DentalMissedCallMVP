export default function handler(req, res) {
  try {
    console.log('Function started'); // This logs to Vercel
    res.json({ status: "Serverless function is alive!" });
  } catch (err) {
    console.error('Function crashed:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
