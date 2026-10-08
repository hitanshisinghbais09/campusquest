import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["member", "coordinator"], default: "member" },
  guildId: { type: mongoose.Schema.Types.ObjectId, ref: "Guild", default: null },
  avatarIcon: { type: String, default: "🧙" },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
