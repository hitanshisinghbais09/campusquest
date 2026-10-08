import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const MEDALS = ["🥇", "🥈", "🥉"];

export default function Guilds() {
  const { user, token } = useAuth();
  const [standings, setStandings] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/guilds/standings`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setStandings(res.data))
      .catch(() => setStandings([]));
  }, []);

  const topXp = Math.max(1, ...(standings || []).map((s) => s.totalXp));

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <Navbar />

        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-gold">Guild Standings</h1>
          <p className="text-sm text-mist mt-1">Every member's XP counts toward their guild's glory.</p>
        </div>

        {!standings && <p className="text-mist text-sm">Consulting the archives...</p>}

        <div className="grid md:grid-cols-2 gap-5">
          {(standings || []).map((g, i) => {
            const mine = g._id === user?.guildId;
            return (
              <motion.div
                key={g._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`glass p-5 ${mine ? "ring-1 ring-gold/60" : ""}`}
                style={{ borderTop: `3px solid ${g.color}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{g.sigil}</div>
                    <div>
                      <p className="font-display text-xl" style={{ color: g.color }}>{g.name}</p>
                      <p className="text-xs text-mist">{g.tagline}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl">{MEDALS[i] || `#${i + 1}`}</p>
                    {mine && <p className="text-[10px] text-gold mt-0.5">Your guild</p>}
                  </div>
                </div>

                <div className="flex justify-between text-xs text-mist mt-4 mb-1.5">
                  <span>{g.memberCount} member{g.memberCount === 1 ? "" : "s"}</span>
                  <span className="text-gold font-semibold">{g.totalXp} XP</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: g.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((g.totalXp / topXp) * 100)}%` }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 + i * 0.08 }}
                  />
                </div>

                <div className="mt-4 space-y-1">
                  {g.topMembers.length === 0 && (
                    <p className="text-xs text-mist">No adventurers have sworn to this guild yet.</p>
                  )}
                  {g.topMembers.map((m, idx) => (
                    <div key={m._id} className="flex justify-between text-sm">
                      <span className="truncate">
                        <span className="text-mist mr-2">{idx + 1}.</span>
                        {m.name}
                      </span>
                      <span className="text-xs text-mist">{m.xp} XP</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
