import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("nexus_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    axios
      .get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem("nexus_token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function signup(name, email, password) {
    const res = await axios.post(`${API_URL}/api/auth/signup`, { name, email, password });
    localStorage.setItem("nexus_token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  }

  async function login(email, password) {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    localStorage.setItem("nexus_token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  }

  function logout() {
    localStorage.removeItem("nexus_token");
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    if (!token) return;
    const res = await axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUser(res.data.user);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signup, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
