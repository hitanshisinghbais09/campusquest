import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import dotenv from "dotenv";
import Guild from "./models/Guild.js";
import Quest from "./models/Quest.js";
import QuestCompletion from "./models/QuestCompletion.js";
import User from "./models/User.js";

dotenv.config();

// Guilds = the club's teams / committees
const guilds = [
  { name: "Emberclaw", tagline: "Events & Operations · bold and quick to act", color: "#F2704E", sigil: "🔥" },
  { name: "Thistlewood", tagline: "Outreach & Community · loyal and steady", color: "#4FB477", sigil: "🌿" },
  { name: "Tidehollow", tagline: "Tech & Research · curious and clever", color: "#4DA3E8", sigil: "🌊" },
  { name: "Duskmere", tagline: "Design & Creative · quiet and ambitious", color: "#A98BFF", sigil: "🌙" },
];

// Quests = real club tasks (days = how far ahead the deadline is)
const quests = [
  { title: "Design the Tech Fest Poster", description: "Create the main poster and 3 social media banners for the annual Tech Fest.", category: "arts", xpReward: 100, guild: "Duskmere", days: 6 },
  { title: "Run the Registration Desk", description: "Manage participant check-in and badge distribution on workshop day.", category: "club", xpReward: 80, guild: "Emberclaw", days: 4 },
  { title: "Host a Beginner Coding Workshop", description: "Conduct a 2-hour introductory web development session for first-year students.", category: "academic", xpReward: 150, guild: "Tidehollow", days: 9 },
  { title: "Campus Cleanup Drive", description: "Volunteer at the Saturday cleanup drive and log your hours with the coordinator.", category: "social", xpReward: 90, guild: "Thistlewood", days: 7 },
  { title: "Recruit 5 New Members", description: "Bring five new students to the club orientation session.", category: "social", xpReward: 120, guild: "Thistlewood", days: 12 },
  { title: "Weekly Meeting Minutes", description: "Take and circulate the minutes for this week's club meeting.", category: "club", xpReward: 40, guild: "Emberclaw", days: 3 },
  { title: "Write the Event Report", description: "Prepare a one-page summary with photos of the last event for the faculty coordinator.", category: "academic", xpReward: 60, guild: "Tidehollow", days: 8 },
  { title: "Social Media Content Week", description: "Plan and post a week of content that highlights club activities.", category: "arts", xpReward: 70, guild: "Duskmere", days: 10 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Seeding...");

  // Upsert guilds by name so existing users keep their guild assignment
  const guildIds = {};
  for (const g of guilds) {
    const doc = await Guild.findOneAndUpdate(
      { name: g.name },
      { $set: g, $setOnInsert: { memberCount: 0 } },
      { upsert: true, new: true }
    );
    guildIds[g.name] = doc._id;
  }
  console.log(`Seeded ${guilds.length} guilds`);

  // Replace quests, clear old completions, reset everyone's XP for a clean demo
  await QuestCompletion.deleteMany({});
  await Quest.deleteMany({});
  await Quest.insertMany(
    quests.map((q) => ({
      title: q.title,
      description: q.description,
      category: q.category,
      xpReward: q.xpReward,
      guildId: guildIds[q.guild],
      endDate: new Date(Date.now() + q.days * 86400000),
    }))
  );
  await User.updateMany({}, { $set: { xp: 0, level: 1 } });
  console.log(`Seeded ${quests.length} quests (user XP reset to 0)`);

  await mongoose.disconnect();
  console.log("Done.");
}

seed();
