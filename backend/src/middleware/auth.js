// src/middleware/auth.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export async function requireAuth(req, res, next) {
  try {
    // Check environment variables
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("[requireAuth] Missing Supabase environment variables");
      console.error(`SUPABASE_URL: ${SUPABASE_URL ? 'SET' : 'MISSING'}`);
      console.error(`SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? 'SET' : 'MISSING'}`);
      return res.status(500).json({ 
        message: "Server configuration error", 
        details: "Supabase credentials not configured" 
      });
    }

    const header = req.headers.authorization;
    if (!header) {
      console.log("[requireAuth] Missing Authorization header");
      return res.status(401).json({ message: "Missing Authorization header" });
    }
    
    const m = header.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      console.log("[requireAuth] Malformed Authorization header");
      return res.status(401).json({ message: "Malformed Authorization header" });
    }
    
    const token = m[1];
    console.log(`[requireAuth] Validating token for user...`);

    const resp = await axios.get(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY
      },
      timeout: 5000
    });

    req.user = resp.data; // contains id, email, etc.
    console.log(`[requireAuth] ✅ Token validated for user: ${req.user.email}`);
    next();
  } catch (err) {
    const status = err?.response?.status || 401;
    const errorMessage = err?.response?.data?.message || err?.message || "Unknown error";
    console.error(`[requireAuth] ❌ Token validation failed:`, {
      status,
      message: errorMessage,
      url: err?.config?.url,
      hasResponse: !!err?.response,
      responseData: err?.response?.data
    });
    return res.status(401).json({ 
      message: "Invalid or expired token", 
      details: errorMessage,
      status 
    });
  }
}
