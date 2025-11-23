// src/middleware/auth.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "Missing Authorization header" });
    const m = header.match(/^Bearer\s+(.+)$/i);
    if (!m) return res.status(401).json({ message: "Malformed Authorization header" });
    const token = m[1];

    const resp = await axios.get(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY
      },
      timeout: 5000
    });

    req.user = resp.data; // contains id, email, etc.
    next();
  } catch (err) {
    const status = err?.response?.status || 401;
    return res.status(401).json({ message: "Invalid or expired token", details: err?.message ?? null, status });
  }
}
