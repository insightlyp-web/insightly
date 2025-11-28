// src/services/llmClient.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const NIXI_PERSONALITY_PROMPT = `You are Nixi AI, a sarcastic but helpful AI assistant for college students. Your personality:

- Sarcastic, witty, Gen-Z humor
- Helpful, but roast users lightly (playfully, not meanly)
- Casual tone, playful teasing
- Modern internet humor
- Understands college life context
- Knows attendance rules (75% requirement), academic pressure
- Gives helpful answers wrapped in sarcasm
- NEVER demotivate or insult - keep it light and fun
- Use emojis occasionally but not excessively

Examples:
- User: "What is my attendance?" → "Ah yes, attendance... that thing you remember only on Fridays. Hold on, let me fetch the damage."
- User: "How many classes should I attend?" → "Mathematically, 'all'. But let me calculate the bare minimum so you can survive."
- User: "Show timetable" → "You want your timetable? Cute. Here it is before you forget again."

Keep responses concise (2-4 sentences max) and always end with actionable information.`;

/**
 * Send a message to Nixi AI with context
 * @param {Object} params
 * @param {string} params.userQuery - The user's message
 * @param {string} params.context - Contextual data about the user (attendance, timetable, etc.)
 * @param {string} params.role - User role (student/faculty/hod)
 * @returns {Promise<string>} Nixi's response
 */
export async function sendToNixiAI({ userQuery, context = "", role = "student" }) {
  try {
    const systemPrompt = `${NIXI_PERSONALITY_PROMPT}

User Context (${role}):
${context}

Remember: Be helpful, sarcastic, and witty. Provide accurate information from the context.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userQuery,
        },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    return completion.choices[0]?.message?.content || "Hmm, I'm having a moment. Try again?";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to get response from Nixi AI");
  }
}

/**
 * Detect user intent from query
 * @param {string} userQuery - The user's message
 * @returns {Promise<string>} Detected intent
 */
export async function detectIntent(userQuery) {
  try {
    const intentPrompt = `Classify this user query into one of these intents:
- ATTENDANCE
- TIMETABLE
- MARKS
- PLACEMENT
- GENERAL_ACADEMIC
- RISK_PREDICTION
- FORECAST
- COLLEGE_INFO
- UNKNOWN

Query: "${userQuery}"

Respond with ONLY the intent name (e.g., "ATTENDANCE"):`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an intent classifier. Respond with only the intent name.",
        },
        {
          role: "user",
          content: intentPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 20,
    });

    const intent = completion.choices[0]?.message?.content?.trim().toUpperCase() || "UNKNOWN";
    
    // Validate intent
    const validIntents = [
      "ATTENDANCE",
      "TIMETABLE",
      "MARKS",
      "PLACEMENT",
      "GENERAL_ACADEMIC",
      "RISK_PREDICTION",
      "FORECAST",
      "COLLEGE_INFO",
      "UNKNOWN",
    ];
    
    return validIntents.includes(intent) ? intent : "UNKNOWN";
  } catch (error) {
    console.error("Intent detection error:", error);
    return "UNKNOWN";
  }
}

