import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

function makeToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    res.status(201).json({ token: makeToken(user._id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    res.json({ token: makeToken(user._id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select("-passwordHash");
  res.json({ user });
});

export default router;
