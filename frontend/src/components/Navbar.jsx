import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();

  const links = [
    { to: "/", label: "Dashboard", end: true },
    { to: "/guilds", label: "Guilds" },
    { to: "/profile", label: "Profile" },
    ...(user?.role === "coordinator" ? [{ to: "/coordinator", label: "Coordinator" }] : []),
  ];

  return (
    <header className="flex items-center justify-between flex-wrap gap-3 mb-6">
      <Link to="/" className="font-display text-2xl font-bold text-gold tracking-wide">
        ⚔ CampusQuest
      </Link>
      <nav className="flex items-center gap-1 flex-wrap">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm transition ${isActive ? "bg-gold/15 text-gold" : "text-mist hover:text-gold"}`
            }
          >
            {l.label}
          </NavLink>
        ))}
        <button onClick={logout} className="btn-ghost text-xs px-4 py-2 ml-2">Logout</button>
      </nav>
    </header>
  );
}
