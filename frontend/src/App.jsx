import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Background from "./components/Background.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Sorting from "./pages/Sorting.jsx";
import Profile from "./pages/Profile.jsx";
import Guilds from "./pages/Guilds.jsx";
import Coordinator from "./pages/Coordinator.jsx";

function ProtectedRoute({ children }) {
  const { user, token, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gold font-display tracking-widest">
        Summoning your realm...
      </div>
    );
  if (!token || !user) return <Navigate to="/login" replace />;
  return children;
}

// UI guard only - the API enforces the same rule on the server
function CoordinatorRoute({ children }) {
  const { user } = useAuth();
  return user?.role === "coordinator" ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <>
      <Background />
      <div className="relative z-10">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/sorting" element={<ProtectedRoute><Sorting /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/guilds" element={<ProtectedRoute><Guilds /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route
            path="/coordinator"
            element={<ProtectedRoute><CoordinatorRoute><Coordinator /></CoordinatorRoute></ProtectedRoute>}
          />
        </Routes>
      </div>
    </>
  );
}
