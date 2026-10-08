import mongoose from "mongoose";

const guildSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  tagline: { type: String },
  color: { type: String },       // hex accent color
  sigil: { type: String },       // emoji standing in for a crest
  memberCount: { type: Number, default: 0 },
});

export default mongoose.model("Guild", guildSchema);
