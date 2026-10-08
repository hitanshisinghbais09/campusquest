import User from "../models/User.js";

// Must run AFTER requireAuth (needs req.userId). Enforced on the server,
// so hiding the UI link alone is not what protects these routes.
export default async function requireCoordinator(req, res, next) {
  try {
    const user = await User.findById(req.userId).select("role");
    if (!user || user.role !== "coordinator") {
      return res.status(403).json({ message: "Coordinator access only" });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: "Authorization check failed" });
  }
}
