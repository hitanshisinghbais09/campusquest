import express from "express";
import requireAuth from "../middleware/auth.js";
import User from "../models/User.js";
import QuestCompletion from "../models/QuestCompletion.js";

const router = express.Router();

// Badge catalog: unlocked automatically from the member's real data
const BADGES = [
  { id: "guild-sworn", name: "Guild Sworn", icon: "🛡️", description: "Join a guild", test: (s) => s.hasGuild },
  { id: "first-steps", name: "First Steps", icon: "🥾", description: "Complete your first quest", test: (s) => s.completed >= 1 },
  { id: "quest-hunter", name: "Quest Hunter", icon: "🏹", description: "Complete 5 quests", test: (s) => s.completed >= 5 },
  { id: "all-rounder", name: "All-Rounder", icon: "🎭", description: "Finish quests in 3 different categories", test: (s) => s.categories >= 3 },
  { id: "rising-sage", name: "Rising Sage", icon: "📜", description: "Reach Level 3", test: (s) => s.level >= 3 },
  { id: "dragons-hoard", name: "Dragon's Hoard", icon: "💰", description: "Earn 500 XP", test: (s) => s.xp >= 500 },
];

// GET /api/profile
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-passwordHash")
      .populate("guildId", "name sigil color tagline");

    const completions = await QuestCompletion.find({ userId: req.userId })
      .sort({ completedAt: -1 })
      .populate({ path: "questId", select: "title category guildId", populate: { path: "guildId", select: "name sigil" } });

    const history = completions.map((c) => ({
      id: c._id,
      title: c.questId?.title || "Retired quest",
      category: c.questId?.category || "club",
      guild: c.questId?.guildId ? { name: c.questId.guildId.name, sigil: c.questId.guildId.sigil } : null,
      xpEarned: c.xpEarned,
      completedAt: c.completedAt,
    }));

    const xpByCategory = {};
    history.forEach((h) => {
      xpByCategory[h.category] = (xpByCategory[h.category] || 0) + h.xpEarned;
    });

    const facts = {
      completed: history.length,
      categories: Object.keys(xpByCategory).length,
      level: user.level,
      xp: user.xp,
      hasGuild: !!user.guildId,
    };
    const badges = BADGES.map(({ test, ...b }) => ({ ...b, earned: test(facts) }));

    const profileUser = user.toObject();
    profileUser.guild = profileUser.guildId;
    delete profileUser.guildId;

    res.json({ user: profileUser, stats: { completed: facts.completed, xpByCategory }, badges, history });
  } catch (err) {
    res.status(500).json({ message: "Could not load profile", error: err.message });
  }
});

export default router;
