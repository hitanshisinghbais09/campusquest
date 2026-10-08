import express from "express";
import requireAuth from "../middleware/auth.js";
import User from "../models/User.js";
import Quest from "../models/Quest.js";
import QuestCompletion from "../models/QuestCompletion.js";

const router = express.Router();

// GET /api/oracle/suggest - AI picks + phrases one quest for this member
router.get("/suggest", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate("guildId", "name tagline");
    const completed = await QuestCompletion.find({ userId: req.userId }).select("questId");
    const completedIds = completed.map((c) => c.questId.toString());

    const openQuests = (await Quest.find().populate("guildId", "name")).filter(
      (q) => !completedIds.includes(q._id.toString())
    );

    if (openQuests.length === 0) {
      return res.json({ message: "The Oracle sees no quests left to reveal. Return when new trials appear." });
    }

    const questList = openQuests
      .map((q) => `- "${q.title}" (${q.category}, +${q.xpReward} XP, team: ${q.guildId?.name || "open to all"})`)
      .join("\n");

    const guildLine = user.guildId ? `"${user.guildId.name}" (${user.guildId.tagline})` : "none yet";

    const prompt = `You are a mystical Oracle inside a fantasy-themed college club task tracker.
A member (Level ${user.level}, ${user.xp} XP) belongs to the guild ${guildLine}.
Their open quests (club tasks) are:
${questList}

Pick ONE quest to recommend (prefer one from their own guild unless another is clearly more valuable).
Respond with a JSON object using exactly these two keys:
{ "questTitle": "the exact title you picked", "message": "a short, 1-2 sentence mystical fantasy-styled recommendation mentioning the task, under 30 words" }`;

    // Fallbacks so the Oracle never shows an empty message
    const own = openQuests.filter(
      (q) => q.guildId && user.guildId && q.guildId._id.equals(user.guildId._id)
    );
    const pool = own.length ? own : openQuests;
    let matchedQuest = pool[Math.floor(Math.random() * pool.length)];
    let message = "";

    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          response_format: { type: "json_object" },
        }),
      });

      const data = await groqRes.json();
      if (data.error) console.error("Groq error:", data.error.message);

      const raw = data.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

      const found = openQuests.find((q) => q.title === parsed.questTitle);
      if (found) matchedQuest = found;
      message = parsed.message || parsed.recommendation || parsed.text || "";
    } catch (aiErr) {
      console.error("Oracle AI error:", aiErr.message);
    }

    if (!message) {
      message = `The stars align over "${matchedQuest.title}". Seek it, adventurer.`;
    }

    res.json({ quest: matchedQuest, message });
  } catch (err) {
    res.status(500).json({ message: "The Oracle's vision is clouded", error: err.message });
  }
});

export default router;
