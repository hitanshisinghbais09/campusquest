import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Each answer key maps to a guild (team): A=Emberclaw, B=Thistlewood, C=Tidehollow, D=Duskmere
const QUESTIONS = [
  {
    q: "A big deadline is tomorrow. You:",
    options: [
      { label: "Dive in headfirst and figure it out as you go", key: "A" },
      { label: "Make a steady plan and stick to it", key: "B" },
      { label: "Research every angle before starting", key: "C" },
      { label: "Work alone, late at night, undisturbed", key: "D" },
    ],
  },
  {
    q: "Which club activity sounds best?",
    options: [
      { label: "Organising events and competitions", key: "A" },
      { label: "Community service drives", key: "B" },
      { label: "Tech projects and problem-solving", key: "C" },
      { label: "Design, art or music", key: "D" },
    ],
  },
  {
    q: "A teammate needs help. You:",
    options: [
      { label: "Jump in immediately", key: "A" },
      { label: "Quietly show up and stay until it's done", key: "B" },
      { label: "Ask questions to understand the problem first", key: "C" },
      { label: "Help in your own private way", key: "D" },
    ],
  },
  {
    q: "You're proudest when:",
    options: [
      { label: "You took a bold risk", key: "A" },
      { label: "People could count on you", key: "B" },
      { label: "You solved something clever", key: "C" },
      { label: "You made something meaningful", key: "D" },
    ],
  },
];

export default function Sorting() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const { token } = useAuth();
  const navigate = useNavigate();

  async function handleAnswer(key) {
    const next = [...answers, key];
    setAnswers(next);
    setError("");

    if (step + 1 < QUESTIONS.length) {
      setStep(step + 1);
      return;
    }
    try {
      const res = await axios.post(
        `${API_URL}/api/guilds/sort`,
        { answers: next },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data.guild);
    } catch (err) {
      setError("The trial could not be completed. Check your connection and try again.");
      setStep(0);
      setAnswers([]);
    }
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="glass p-10 text-center max-w-sm w-full"
        >
          <div className="floaty inline-block text-7xl mb-3">{result.sigil}</div>
          <p className="text-[11px] text-mist tracking-[0.3em] mb-1">THE ORACLE HAS SPOKEN</p>
          <h1 className="font-display text-4xl font-bold mb-2" style={{ color: result.color }}>
            {result.name}
          </h1>
          <p className="text-sm text-mist mb-7">{result.tagline}</p>
          <button onClick={() => navigate("/")} className="btn-gold px-8 py-2.5 text-sm">
            Enter the Realm
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <h1 className="font-display text-2xl font-bold text-gold">The Sorting Trial</h1>
          <p className="text-xs text-mist mt-1">Four questions to find your guild (team).</p>
        </div>

        <div className="flex gap-2 mb-4">
          {QUESTIONS.map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-gold" : "bg-white/15"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="glass p-7"
          >
            <p className="text-xs text-mist mb-2">Question {step + 1} of {QUESTIONS.length}</p>
            <h2 className="font-display text-xl mb-5">{QUESTIONS[step].q}</h2>
            <div className="space-y-3">
              {QUESTIONS[step].options.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleAnswer(opt.key)}
                  className="w-full text-left text-sm rounded-xl border border-white/12 bg-white/5 px-4 py-3 transition hover:border-gold/60 hover:bg-gold/10"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-red-300 mt-4">{error}</p>}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
