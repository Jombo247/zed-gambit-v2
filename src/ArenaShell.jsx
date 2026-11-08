import { useEffect } from "react";

// Use like: <ArenaShell inArena={true} timeLeft="02:34" onReturn={goToBoard} onResign={resignGame} />
export default function ArenaShell({ inArena, timeLeft, onReturn, onResign }) {

  // Warn if user tries to close tab while in arena
  useEffect(() => {
    if (!inArena) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "You are in an arena. Resign to leave.";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [inArena]);

  // Not in arena = show nothing
  if (!inArena) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
      background: "#111", color: "#FFD700", padding: "10px",
      display: "flex", justifyContent: "space-between", alignItems: "center"
    }}>
      <span>♟️ In Arena - {timeLeft} left</span>

      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={onReturn} style={{ background: "#FFD700", border: "none", padding: "6px 12px", borderRadius: "20px", fontWeight: "bold" }}>
          Back to Game →
        </button>
        <button onClick={onResign} style={{ background: "transparent", color: "white", border: "1px solid white", padding: "6px 12px", borderRadius: "20px" }}>
          Resign
        </button>
      </div>
    </div>
  );
}