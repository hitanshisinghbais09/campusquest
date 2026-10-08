import mongoose from "mongoose";

const questSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ["academic", "social", "sports", "club", "arts"], default: "social" },
  xpReward: { type: Number, default: 50 },
  guildId: { type: mongoose.Schema.Types.ObjectId, ref: "Guild" },
  startDate: { type: Date },
  endDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Quest", questSchema);
