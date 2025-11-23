// src/routes/student/events.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  res.json({
    events: [
      { title: "Hackathon 2025", date: "2025-01-22" },
      { title: "AI seminar", date: "2025-01-30" }
    ]
  });
});

export default router;
