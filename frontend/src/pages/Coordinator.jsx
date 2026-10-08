import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate } from "../utils.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CATEGORIES = ["academic", "social", "sports", "club", "arts"];
const EMPTY = { title: "", description: "", category: "club", xpReward: 50, guildId: "", endDate: "" };

export default function Coordinator() {
  const { token } = useAuth();
  const [quests, setQuests] = useState([]);
  const [guilds, setGuilds] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  async function load() {
    const res = await axios.get(`${API_URL}/api/quests/admin/overview`, authHeader);
    setQuests(res.data);
  }

  useEffect(() => {
    load();
    axios.get(`${API_URL}/api/guilds`).then((res) => setGuilds(res.data));
  }, []);

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  function flash(text) {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      xpReward: Number(form.xpReward),
      guildId: form.guildId || null,
      endDate: form.endDate || null,
    };
    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/quests/${editingId}`, payload, authHeader);
        flash("Quest updated");
      } else {
        await axios.post(`${API_URL}/api/quests`, payload, authHeader);
        flash("Quest posted to the board");
      }
      setForm(EMPTY);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  }

  function startEdit(q) {
    setEditingId(q._id);
    setError("");
    setForm({
      title: q.title,
      description: q.description || "",
      category: q.category,
      xpReward: q.xpReward,
      guildId: q.guildId?._id || "",
      endDate: q.endDate ? q.endDate.slice(0, 10) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  }

  async function handleDelete(q) {
    if (!window.confirm(`Delete "${q.title}"? Its completion records will be removed too.`)) return;
    try {
      await axios.delete(`${API_URL}/api/quests/${q._id}`, authHeader);
      flash("Quest deleted");
      if (editingId === q._id) cancelEdit();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete quest");
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <Navbar />

        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-gold">Coordinator Panel</h1>
          <p className="text-sm text-mist mt-1">Post, edit and retire club tasks, and see how many members completed each one.</p>
        </div>

        <AnimatePresence>
          {msg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass px-4 py-2 text-sm text-gold mb-4 inline-block"
            >
              ✨ {msg}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-5 items-start">
          {/* form */}
          <form onSubmit={handleSubmit} className="glass p-5 space-y-4 lg:sticky lg:top-6">
            <p className="font-display text-lg">{editingId ? "Edit Quest" : "Post a New Quest"}</p>

            <div>
              <label className="text-xs text-mist">Title</label>
              <input className="field" value={form.title} onChange={(e) => setField("title", e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-mist">Description</label>
              <textarea className="field resize-none" rows={3} value={form.description} onChange={(e) => setField("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-mist">Category</label>
                <select className="field capitalize" style={{ colorScheme: "dark" }} value={form.category} onChange={(e) => setField("category", e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c} className="bg-night">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-mist">XP reward</label>
                <input type="number" min={10} max={500} className="field" value={form.xpReward} onChange={(e) => setField("xpReward", e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="text-xs text-mist">Guild (team)</label>
              <select className="field" style={{ colorScheme: "dark" }} value={form.guildId} onChange={(e) => setField("guildId", e.target.value)}>
                <option value="" className="bg-night">Open to all teams</option>
                {guilds.map((g) => <option key={g._id} value={g._id} className="bg-night">{g.sigil} {g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-mist">Deadline</label>
              <input type="date" className="field" style={{ colorScheme: "dark" }} value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} />
            </div>

            {error && <p className="text-xs text-red-300">{error}</p>}

            <div className="flex gap-2">
              <button type="submit" className="btn-gold flex-1 py-2.5 text-sm">{editingId ? "Save changes" : "Post quest"}</button>
              {editingId && <button type="button" onClick={cancelEdit} className="btn-ghost px-4 text-sm">Cancel</button>}
            </div>
          </form>

          {/* list */}
          <div className="lg:col-span-2 space-y-3">
            <p className="font-display text-lg">All Quests ({quests.length})</p>
            <AnimatePresence>
              {quests.map((q) => (
                <motion.div
                  key={q._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 60 }}
                  className={`glass p-4 flex items-center justify-between gap-4 ${editingId === q._id ? "ring-1 ring-gold/70" : ""}`}
                  style={{ borderLeft: `3px solid ${q.guildId?.color || "#8B5CF6"}` }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{q.title}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-mist flex-wrap">
                      <span className="capitalize bg-white/10 rounded-full px-2 py-0.5">{q.category}</span>
                      <span>{q.guildId ? `${q.guildId.sigil} ${q.guildId.name}` : "Open to all"}</span>
                      {q.endDate && <span>· Due {formatDate(q.endDate)}</span>}
                    </div>
                    <p className="text-[11px] mt-1.5">
                      <span className="text-gold">+{q.xpReward} XP</span>
                      <span className="text-mist"> · {q.completions} member{q.completions === 1 ? "" : "s"} completed</span>
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEdit(q)} className="btn-ghost text-xs px-3 py-1.5">Edit</button>
                    <button onClick={() => handleDelete(q)} className="btn-ghost text-xs px-3 py-1.5 hover:!text-red-300 hover:!border-red-300/50">Delete</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {quests.length === 0 && <div className="glass p-5 text-sm text-mist text-center">No quests yet. Post the first one!</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
