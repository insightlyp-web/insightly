// src/routes/chatbot.js
import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { sendToNixiAI, detectIntent } from "../services/llmClient.js";
import {
  buildStudentContext,
  buildFacultyContext,
  buildHODContext,
  formatContext,
  getRiskPrediction,
  getAttendanceForecast,
} from "../services/contextBuilder.js";
import { query } from "../config/db.js";

const router = express.Router();

/**
 * POST /chatbot/message
 * Main chatbot endpoint
 */
router.post("/message", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Get user role
    const profileRes = await query(
      `SELECT role, department FROM campus360_dev.profiles WHERE id = $1`,
      [userId]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json({ message: "User profile not found" });
    }

    const role = profileRes.rows[0].role;
    const userQuery = message.trim();

    // Detect intent
    const intent = await detectIntent(userQuery);

    // Build context based on role
    let context = {};
    let mlData = null;

    if (role === "student") {
      context = await buildStudentContext(userId);

      // Get ML predictions if needed
      if (intent === "RISK_PREDICTION") {
        mlData = await getRiskPrediction(userId);
      } else if (intent === "FORECAST") {
        mlData = await getAttendanceForecast(userId);
      }
    } else if (role === "faculty") {
      context = await buildFacultyContext(userId);
    } else if (role === "hod") {
      context = await buildHODContext(userId);
    } else {
      return res.status(403).json({ message: "Unsupported role for chatbot" });
    }

    // Add ML data to context if available
    if (mlData) {
      context.mlData = mlData;
    }

    // Format context string
    let contextStr = formatContext(context, role, intent);

    // Add ML data to context string if available
    if (mlData) {
      if (intent === "RISK_PREDICTION") {
        contextStr += `Risk Prediction:\n`;
        contextStr += `- Risk Level: ${mlData.risk_level || "N/A"}\n`;
        contextStr += `- Risk Score: ${mlData.risk_score || "N/A"}\n`;
        if (mlData.risk_factors) {
          contextStr += `- Risk Factors: ${mlData.risk_factors.join(", ")}\n`;
        }
        contextStr += "\n";
      } else if (intent === "FORECAST") {
        contextStr += `Attendance Forecast:\n`;
        if (mlData.forecast) {
          contextStr += `- Predicted Attendance: ${mlData.forecast}%\n`;
        }
        contextStr += "\n";
      }
    }

    // Get response from Nixi AI
    const reply = await sendToNixiAI({
      userQuery,
      context: contextStr,
      role,
    });

    res.json({
      reply,
      intent,
      contextUsed: {
        role,
        hasAttendance: !!context.attendance,
        hasTimetable: !!context.timetable && context.timetable.length > 0,
        hasMLData: !!mlData,
      },
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      message: "Failed to process message",
      error: error.message,
    });
  }
});

export default router;

