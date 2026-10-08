import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const email = process.argv[2];
if (!email) {
  console.log("Usage: node make-coordinator.js your@email.com");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const user = await User.findOneAndUpdate({ email }, { role: "coordinator" }, { new: true });
console.log(user ? `${user.name} is now a coordinator` : `No user found with email ${email}`);
await mongoose.disconnect();
