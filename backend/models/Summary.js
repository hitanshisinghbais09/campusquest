import mongoose from "mongoose";

const summarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sourceText: { type: String, required: true },
  summary: { type: String, required: true },
  quiz: [
    {
      question: String,
      options: [String],
      correctAnswer: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Summary", summarySchema);
