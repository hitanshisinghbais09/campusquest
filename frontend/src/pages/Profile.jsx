import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { rankFor, formatDate } from "../utils.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Profile() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/api/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load your profile."));
  }, []);

  const shell = (children) => (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <Navbar />
        {children}
      </div>
    </div>
  );

  if (error) return shell(<p className="text-sm text-red-300">{error}</p>);
  if (!data) return shell(<p className="text-sm text-mist">Unrolling your scroll...</p>);

  const { user, stats, badges, history } = data;
  const earned = badges.filter((b) => b.earned).length;
  const categories = Object.entries(stats.xpByCategory).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(1, ...categories.map(([, xp]) => xp));

  return shell(
    <>
      {/* header card */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2 border-gold/70 bg-white/5">
              {user.avatarIcon || "🧙"}
            </div>
            <div>
              <p className="font-display text-2xl">{user.name}</p>
              <p className="text-xs text-mist mt-0.5">
                <span className="text-gold">Level {user.level} · {rankFor(user.level)}</span>
                {user.guild && <span style={{ color: user.guild.color }}> · {user.guild.sigil} {user.guild.name}</span>}
                {user.role === "coordinator" && <span className="text-arcane"> · Coordinator</span>}
              </p>
              <p className="text-[11px] text-mist mt-1">Adventuring since {formatDate(user.createdAt)}</p>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div><p className="font-display text-2xl text-gold">{user.xp}</p><p className="text-[11px] text-mist">Total XP</p></div>
            <div><p className="font-display text-2xl text-gold">{stats.completed}</p><p className="text-[11px] text-mist">Quests done</p></div>
            <div><p className="font-display text-2xl text-gold">{earned}/{badges.length}</p><p className="text-[11px] text-mist">Badges</p></div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* badges + categories */}
        <div className="lg:col-span-2 space-y-5">
          <div className="glass p-5">
            <p className="font-display text-lg mb-4">🏅 Achievements</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {badges.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-xl p-4 text-center border ${
                    b.earned ? "border-gold/50 bg-gold/10" : "border-white/10 bg-white/5 opacity-50"
                  }`}
                >
                  <div className={`text-3xl mb-1 ${b.earned ? "" : "grayscale"}`}>{b.earned ? b.icon : "🔒"}</div>
                  <p className={`text-sm font-semibold ${b.earned ? "text-gold" : ""}`}>{b.name}</p>
                  <p className="text-[11px] text-mist mt-1">{b.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass p-5">
            <p className="font-display text-lg mb-4">XP by Category</p>
            {categories.length === 0 && (
              <p className="text-xs text-mist">Complete a quest to see where your contributions go.</p>
            )}
            <div className="space-y-3">
              {categories.map(([cat, xp]) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize">{cat}</span>
                    <span className="text-gold">{xp} XP</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full xp-bar"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((xp / maxCat) * 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* history */}
        <div className="glass p-5">
          <p className="font-display text-lg mb-4">📜 Quest Log</p>
          {history.length === 0 && <p className="text-xs text-mist">No quests completed yet. Your legend begins today.</p>}
          <div className="space-y-4 border-l border-white/15 pl-4">
            {history.map((h) => (
              <div key={h.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-gold" />
                <p className="text-sm font-semibold">{h.title}</p>
                <p className="text-[11px] text-mist mt-0.5">
                  <span className="capitalize">{h.category}</span>
                  {h.guild && <> · {h.guild.sigil} {h.guild.name}</>}
                </p>
                <p className="text-[11px] mt-0.5">
                  <span className="text-gold">+{h.xpEarned} XP</span>
                  <span className="text-mist"> · {formatDate(h.completedAt)}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
