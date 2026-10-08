import express from "express";
import Quest from "../models/Quest.js";
import QuestCompletion from "../models/QuestCompletion.js";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";
import requireCoordinator from "../middleware/coordinator.js";

const router = express.Router();
const CATEGORIES = ["academic", "social", "sports", "club", "arts"];

function cleanQuest(body) {
  const { title, description, category, xpReward, guildId, endDate } = body;
  return {
    title: title?.trim(),
    description: description?.trim() || "",
    category,
    xpReward: Number(xpReward),
    guildId: guildId || null,
    endDate: endDate ? new Date(endDate) : null,
  };
}

function validate(q) {
  if (!q.title) return "Title is required";
  if (!CATEGORIES.includes(q.category)) return "Invalid category";
  if (!Number.isFinite(q.xpReward) || q.xpReward < 10 || q.xpReward > 500) {
    return "XP reward must be between 10 and 500";
  }
  return null;
}

// ---------- READ (everyone) ----------
router.get("/", async (req, res) => {
  const quests = await Quest.find().populate("guildId", "name sigil color").sort({ endDate: 1 });
  res.json(quests);
});

// ids of quests this member has already completed
router.get("/completed", requireAuth, async (req, res) => {
  const done = await QuestCompletion.find({ userId: req.userId }).select("questId");
  res.json(done.map((c) => c.questId.toString()));
});

router.get("/leaderboard", async (req, res) => {
  const top = await User.find().select("name xp level avatarIcon guildId").sort({ xp: -1 }).limit(10);
  res.json(top);
});

// ---------- COORDINATOR ONLY ----------
// quests + how many members completed each (aggregation on completions)
router.get("/admin/overview", requireAuth, requireCoordinator, async (req, res) => {
  const counts = await QuestCompletion.aggregate([{ $group: { _id: "$questId", count: { $sum: 1 } } }]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
  const quests = await Quest.find().populate("guildId", "name sigil color").sort({ createdAt: -1 });
  res.json(quests.map((q) => ({ ...q.toObject(), completions: countMap[q._id.toString()] || 0 })));
});

// CREATE
router.post("/", requireAuth, requireCoordinator, async (req, res) => {
  try {
    const data = cleanQuest(req.body);
    const problem = validate(data);
    if (problem) return res.status(400).json({ message: problem });
    const quest = await Quest.create(data);
    res.status(201).json(quest);
  } catch (err) {
    res.status(500).json({ message: "Could not create quest", error: err.message });
  }
});

// UPDATE
router.put("/:id", requireAuth, requireCoordinator, async (req, res) => {
  try {
    const data = cleanQuest(req.body);
    const problem = validate(data);
    if (problem) return res.status(400).json({ message: problem });
    const quest = await Quest.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!quest) return res.status(404).json({ message: "Quest not found" });
    res.json(quest);
  } catch (err) {
    res.status(400).json({ message: "Could not update quest", error: err.message });
  }
});

// DELETE (also removes that quest's completion records; XP already earned stays)
router.delete("/:id", requireAuth, requireCoordinator, async (req, res) => {
  try {
    const quest = await Quest.findByIdAndDelete(req.params.id);
    if (!quest) return res.status(404).json({ message: "Quest not found" });
    await QuestCompletion.deleteMany({ questId: quest._id });
    res.json({ message: "Quest deleted" });
  } catch (err) {
    res.status(400).json({ message: "Could not delete quest", error: err.message });
  }
});

// ---------- MEMBER: complete a quest ----------
router.post("/:id/complete", requireAuth, async (req, res) => {
  try {
    const quest = await Quest.findById(req.params.id);
    if (!quest) return res.status(404).json({ message: "Quest not found" });

    const already = await QuestCompletion.findOne({ userId: req.userId, questId: quest._id });
    if (already) return res.status(409).json({ message: "Quest already completed" });

    await QuestCompletion.create({ userId: req.userId, questId: quest._id, xpEarned: quest.xpReward });

    const user = await User.findById(req.userId);
    user.xp += quest.xpReward;
    // simple level curve: every 300 xp = 1 level
    user.level = Math.floor(user.xp / 300) + 1;
    await user.save();

    res.json({ xpEarned: quest.xpReward, newXp: user.xp, newLevel: user.level });
  } catch (err) {
    res.status(500).json({ message: "Completion failed", error: err.message });
  }
});

export default router;
