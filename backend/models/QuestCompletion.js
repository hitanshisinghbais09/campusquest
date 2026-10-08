import mongoose from "mongoose";

const completionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questId: { type: mongoose.Schema.Types.ObjectId, ref: "Quest", required: true },
  xpEarned: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now },
});

completionSchema.index({ userId: 1, questId: 1 }, { unique: true });

export default mongoose.model("QuestCompletion", completionSchema);
