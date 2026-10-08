import express from "express";
import Guild from "../models/Guild.js";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const guilds = await Guild.find();
  res.json(guilds);
});

// GET /api/guilds/standings - guild-vs-guild ranking built with a MongoDB aggregation
router.get("/standings", requireAuth, async (req, res) => {
  try {
    const standings = await Guild.aggregate([
      { $lookup: { from: "users", localField: "_id", foreignField: "guildId", as: "members" } },
      {
        $project: {
          name: 1,
          sigil: 1,
          color: 1,
          tagline: 1,
          memberCount: { $size: "$members" },
          totalXp: { $sum: "$members.xp" },
        },
      },
      { $sort: { totalXp: -1, name: 1 } },
    ]);

    const members = await User.find({ guildId: { $ne: null } })
      .select("name xp level avatarIcon guildId")
      .sort({ xp: -1 });

    const result = standings.map((s) => ({
      ...s,
      topMembers: members.filter((m) => m.guildId.toString() === s._id.toString()).slice(0, 5),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Could not load standings", error: err.message });
  }
});

// POST /api/guilds/sort  { answers: ["A","C","B","A"] }
router.post("/sort", requireAuth, async (req, res) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "Answers are required" });
    }

    const tally = {};
    answers.forEach((a) => (tally[a] = (tally[a] || 0) + 1));
    const winner = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];

    const guildMap = { A: "Emberclaw", B: "Thistlewood", C: "Tidehollow", D: "Duskmere" };
    const guild = await Guild.findOne({ name: guildMap[winner] });
    if (!guild) return res.status(404).json({ message: "Guild not found - run the seed script" });

    // Keep memberCount accurate if someone retakes the trial
    const user = await User.findById(req.userId);
    const previous = user.guildId?.toString();
    if (previous !== guild._id.toString()) {
      if (previous) await Guild.findByIdAndUpdate(previous, { $inc: { memberCount: -1 } });
      await Guild.findByIdAndUpdate(guild._id, { $inc: { memberCount: 1 } });
      user.guildId = guild._id;
      await user.save();
    }

    res.json({ guild });
  } catch (err) {
    res.status(500).json({ message: "Sorting failed", error: err.message });
  }
});

export default router;
