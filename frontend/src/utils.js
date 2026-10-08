export const RANKS = ["Apprentice", "Adept", "Sage", "Archmage", "Legend"];
export const XP_PER_LEVEL = 300;

export const rankFor = (level) => RANKS[Math.min((level || 1) - 1, RANKS.length - 1)];

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
