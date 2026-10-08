import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <div className="floaty inline-block text-4xl mb-2">⚔️</div>
          <h1 className="font-display text-3xl font-bold text-gold tracking-wide">CampusQuest</h1>
          <p className="text-sm text-mist mt-1">Club tasks, turned into legend.</p>
        </div>

        <div className="glass p-7">
          <h2 className="font-display text-xl mb-5">Enter the Realm</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-mist">Email</label>
              <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="field" />
            </div>
            <div>
              <label className="text-xs text-mist">Password</label>
              <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="field" />
            </div>
            {error && <p className="text-xs text-red-300">{error}</p>}
            <button type="submit" className="btn-gold w-full py-2.5 text-sm">Begin Your Quest</button>
          </form>
          <p className="text-xs text-mist mt-5 text-center">
            New adventurer? <Link to="/signup" className="text-gold hover:underline">Join the realm</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
