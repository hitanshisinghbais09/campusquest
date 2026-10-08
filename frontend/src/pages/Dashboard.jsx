import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";
import { rankFor, XP_PER_LEVEL } from "../utils.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const MEDALS = ["🥇", "🥈", "🥉"];


function dueText(d) {
  if (!d) return "";
  const days = Math.ceil((new Date(d) - Date.now()) / 86400000);
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  return `Due in ${days} day${days > 1 ? "s" : ""}`;
}

const GLOSSARY = [
  ["Quest", "Club task or event"],
  ["Guild", "Team / committee"],
  ["XP", "Contribution points"],
  ["Level", "Member rank"],
  ["Oracle", "AI task recommender"],
];

export default function Dashboard() {
  const { user, token, refreshUser } = useAuth();
  const [quests, setQuests] = useState([]);
  const [doneCount, setDoneCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [guilds, setGuilds] = useState([]);
  const [oracle, setOracle] = useState(null);
  const [loadingOracle, setLoadingOracle] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function loadLeaderboard() {
    const res = await axios.get(`${API_URL}/api/quests/leaderboard`);
    setLeaderboard(res.data);
  }

  async function loadQuests() {
    const [all, done] = await Promise.all([
      axios.get(`${API_URL}/api/quests`),
      axios.get(`${API_URL}/api/quests/completed`, authHeader),
    ]);
    setQuests(all.data.filter((q) => !done.data.includes(q._id)));
    setDoneCount(done.data.length);
  }

  useEffect(() => {
    refreshUser();
    loadQuests();
    loadLeaderboard();
    axios.get(`${API_URL}/api/guilds`).then((res) => setGuilds(res.data));
  }, []);

  async function askOracle() {
    setLoadingOracle(true);
    setOracle(null);
    try {
      const res = await axios.get(`${API_URL}/api/oracle/suggest`, authHeader);
      setOracle(res.data);
      if ("speechSynthesis" in window && res.data.message) {
        speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(res.data.message);
        utter.rate = 0.95;
        speechSynthesis.speak(utter);
      }
    } catch (err) {
      setOracle({ message: "The Oracle's vision is clouded. Try again shortly." });
    } finally {
      setLoadingOracle(false);
    }
  }

  async function completeQuest(id) {
    setCompletingId(id);
    const prevLevel = user?.level || 1;
    try {
      const res = await axios.post(`${API_URL}/api/quests/${id}/complete`, {}, authHeader);
      const { xpEarned, newLevel } = res.data;
      await refreshUser();
      setQuests((prev) => prev.filter((q) => q._id !== id));
      setDoneCount((c) => c + 1);
      setOracle(null);
      await loadLeaderboard();
      showToast(
        newLevel > prevLevel
          ? `Level up! You are now a ${rankFor(newLevel)} (Level ${newLevel})`
          : `+${xpEarned} XP earned`
      );
    } catch (err) {
      // e.g. already completed - resync the list so it disappears
      await loadQuests();
    } finally {
      setCompletingId(null);
    }
  }

  const level = user?.level || 1;
  const guild = guilds.find((g) => g._id === user?.guildId);
  const xpIntoLevel = user ? user.xp % XP_PER_LEVEL : 0;
  const xpPercent = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100);

  const stats = [
    { label: "Quests completed", value: doneCount },
    { label: "Open quests", value: quests.length },
    { label: "Guild members", value: guild?.memberCount ?? "—" },
  ];

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      {/* toast */}
      <div className="fixed top-5 inset-x-0 flex justify-center z-50 pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass px-5 py-3 text-sm font-semibold text-gold"
            >
              ✨ {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-6xl mx-auto">
        <Navbar />

        {/* profile */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 border-gold/70 bg-white/5">
                {user?.avatarIcon || "🧙"}
              </div>
              <div>
                <p className="font-display text-xl">{user?.name}</p>
                <p className="text-xs text-mist mt-0.5">
                  <span className="text-gold">Level {level} · {rankFor(level)}</span>
                  {guild && <span style={{ color: guild.color }}> · {guild.sigil} {guild.name}</span>}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl text-gold leading-none">{user?.xp || 0}</p>
              <p className="text-[11px] text-mist mt-1">Total XP</p>
            </div>
          </div>
          <div className="mt-5 h-2.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full xp-bar"
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </div>
          <p className="text-[11px] text-mist mt-1.5 text-right">{XP_PER_LEVEL - xpIntoLevel} XP to next level</p>
        </motion.div>

        {/* stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="glass p-4 text-center"
            >
              <p className="font-display text-2xl text-gold">{s.value}</p>
              <p className="text-[11px] text-mist mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* left: oracle + quests */}
          <div className="lg:col-span-2 space-y-5">
            <div className="glass p-6 text-center">
              <div className="floaty inline-block">
                <motion.button
                  onClick={askOracle}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Ask the Oracle"
                  className="relative w-32 h-32 block"
                >
                  <div className="absolute -inset-3 rounded-full border border-dashed border-gold/40 spin-slow" />
                  <div className="absolute -inset-1 rounded-full border border-arcane/40 spin-slow-rev" />
                  <div
                    className="absolute inset-0 rounded-full orb"
                    style={{ background: "radial-gradient(circle at 35% 30%, #b79bff, #5b32c9 55%, #1b1047 100%)" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">🔮</div>
                </motion.button>
              </div>
              <p className="text-[11px] text-mist mt-6 tracking-[0.3em]">TAP THE ORACLE FOR YOUR NEXT QUEST</p>
              {loadingOracle && <p className="text-sm text-gold mt-3">The Oracle stirs...</p>}
              {oracle && !loadingOracle && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                  {oracle.message && (
                    <p className="font-display text-gold text-base max-w-md mx-auto">“{oracle.message}”</p>
                  )}
                  {oracle.quest && (
                    <p className="text-xs text-mist mt-1.5">{oracle.quest.title} · +{oracle.quest.xpReward} XP</p>
                  )}
                </motion.div>
              )}
            </div>

            <div>
              <p className="font-display text-lg mb-3">Active Quests</p>
              <div className="space-y-3">
                <AnimatePresence>
                  {quests.map((q, i) => {
                    const picked = oracle?.quest?._id === q._id;
                    return (
                      <motion.div
                        key={q._id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 60 }}
                        transition={{ delay: i * 0.05 }}
                        className={`glass p-4 flex items-center justify-between gap-4 ${picked ? "ring-1 ring-gold/70" : ""}`}
                        style={{ borderLeft: `3px solid ${q.guildId?.color || "#8B5CF6"}` }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{q.title}</p>
                            {picked && (
                              <span className="text-[10px] text-gold border border-gold/40 rounded-full px-2 py-0.5">✨ Oracle's pick</span>
                            )}
                          </div>
                          {q.description && <p className="text-xs text-mist mt-1">{q.description}</p>}
                          <div className="flex items-center gap-2 mt-2 text-[11px] text-mist flex-wrap">
                            <span className="capitalize bg-white/10 rounded-full px-2 py-0.5">{q.category}</span>
                            {q.guildId && <span>{q.guildId.sigil} {q.guildId.name}</span>}
                            {q.endDate && <span>· {dueText(q.endDate)}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-sm font-semibold text-gold">+{q.xpReward} XP</span>
                          <button
                            onClick={() => completeQuest(q._id)}
                            disabled={completingId === q._id}
                            className="btn-gold text-xs px-3 py-1.5 disabled:opacity-50"
                          >
                            {completingId === q._id ? "..." : "Complete"}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {quests.length === 0 && (
                  <div className="glass p-5 text-sm text-mist text-center">
                    All quests complete! New trials will appear when your coordinator posts them.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* right: leaderboard + glossary */}
          <div className="space-y-5">
            <div className="glass p-5">
              <p className="font-display text-lg text-gold mb-3">🏆 Top Adventurers</p>
              <div className="space-y-1">
                {leaderboard.map((u, i) => {
                  const g = guilds.find((x) => x._id === u.guildId);
                  const me = u._id === user?._id;
                  return (
                    <div
                      key={u._id}
                      className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${me ? "bg-gold/10 border border-gold/30" : ""}`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-6 text-center text-mist">{MEDALS[i] || i + 1}</span>
                        <span className="truncate">{u.name}</span>
                        {g && <span title={g.name}>{g.sigil}</span>}
                      </span>
                      <span className="text-xs text-mist shrink-0">{u.xp} XP</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass p-5">
              <p className="font-display text-lg mb-3">📖 Realm Glossary</p>
              <div className="space-y-2">
                {GLOSSARY.map(([term, meaning]) => (
                  <div key={term} className="flex justify-between text-xs">
                    <span className="text-gold">{term}</span>
                    <span className="text-mist">{meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
