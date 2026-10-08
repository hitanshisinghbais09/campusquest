import { useMemo } from "react";

// Fixed full-screen backdrop: midnight gradient + drifting colour glows + twinkling stars
export default function Background() {
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4,
      })),
    []
  );

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ background: "linear-gradient(160deg, #0a0920 0%, #150f3a 55%, #0d1a33 100%)" }}
    >
      <div className="blob" style={{ top: "-10%", left: "-10%", width: 520, height: 520, background: "#6D28D9" }} />
      <div className="blob" style={{ bottom: "-15%", right: "-10%", width: 560, height: 560, background: "#0f9d9a", animationDuration: "30s", animationDelay: "-6s" }} />
      <div className="blob" style={{ top: "40%", left: "55%", width: 380, height: 380, background: "#b8447a", opacity: 0.22, animationDuration: "34s", animationDelay: "-12s" }} />
      {stars.map((s) => (
        <span
          key={s.id}
          className="star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
