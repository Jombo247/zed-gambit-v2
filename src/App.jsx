
import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';

// ============ REAL GRAPHIC PIECES - Inline SVG, no internet, never disappears ============
function PieceSVG({ type, color }) {
  const fill = color === 'w' ? '#FFFFFF' : '#111111';
  const stroke = color === 'w' ? '#000000' : '#FFFFFF';
  const sw = color === 'w' ? 1.8 : 1.2;
  const common = { fill, stroke, strokeWidth: sw, strokeLinejoin: 'round', strokeLinecap: 'round' };
  // Drawn with SVG shapes - real graphics, not letters
  if (type === 'p') return (
    <svg viewBox="0 0 45 45" width="34" height="34"><g {...common}><path d="M22.5 11.5c-2.5 0-4.5 2-4.5 4.5 0 1.8 1 3.1 2.3 4.2-1.5 1-3.3 2.5-3.3 5.3 0 2.3 1.5 3.5 3.5 4.5-1 1-2 2.5-2 4.5h13c0-2-1-3.5-2-4.5 2-1 3.5-2.2 3.5-4.5 0-2.8-1.8-4.3-3.3-5.3 1.3-1.1 2.3-2.4 2.3-4.2 0-2.5-2-4.5-4.5-4.5z"/><path d="M12 36h21" fill="none" /></g></svg>
  );
  if (type === 'r') return (
    <svg viewBox="0 0 45 45" width="34" height="34"><g {...common}><path d="M14 12v4h-4v6h4v4c0 3 1 5 2 7h13c1-2 2-4 2-7v-4h4v-6h-4v-4h-6v4h-5v-4z"/><path d="M14 36h17" fill="none" /><path d="M17 30h11" fill="none" /></g></svg>
  );
  if (type === 'n') return (
    <svg viewBox="0 0 45 45" width="34" height="34"><g {...common}><path d="M14 34c0-8 4-14 9-17 1-1 2-1.5 2-3 0-2-1-3-1-3s3-1 5 1c1.5 1.5 1 4-1 5.5-1.5 1-2 2-2 3.5 0 3 2 5 2 5l-2 3h-12z"/><path d="M15 36h15" fill="none" /><circle cx="20" cy="18" r="1.2" fill={stroke} stroke="none" /></g></svg>
  );
  if (type === 'b') return (
    <svg viewBox="0 0 45 45" width="34" height="34"><g {...common}><path d="M22.5 9c-2 2-5 4-5 9 0 3 1 5 2 6-2 1-4 3-4 6 0 2 1 3 2 3h10c1 0 2-1 2-3 0-3-2-5-4-6 1-1 2-3 2-6 0-5-3-7-5-9z"/><path d="M22.5 12v10" fill="none" /><path d="M18 24h9" fill="none" /><path d="M14 36h17" fill="none" /></g></svg>
  );
  if (type === 'q') return (
    <svg viewBox="0 0 45 45" width="34" height="34"><g {...common}><path d="M13 14l-3-6 5 3 4-6 3.5 6 3.5-6 4 6 5-3-3 6 2 8c0 3-2 5-4 6H15c-2-1-4-3-4-6z"/><circle cx="10" cy="8" r="2" /><circle cx="18" cy="5" r="2" /><circle cx="27" cy="5" r="2" /><circle cx="35" cy="8" r="2" /><path d="M14 36h17" fill="none" /><path d="M17 30h11" fill="none" /></g></svg>
  );
  // King
  return (
    <svg viewBox="0 0 45 45" width="34" height="34"><g {...common}><path d="M22.5 8v6M19.5 11h6"/><path d="M22.5 14c-5 3-9 7-9 13 0 4 2 6 4 7-1 1-2 2-2 4h14c0-2-1-3-2-4 2-1 4-3 4-7 0-6-4-10-9-13z"/><path d="M14 38h17" fill="none" /><path d="M17 32h11" fill="none" /></g></svg>
  );
}

// ============ ALL RATED ARENA TOURNAMENTS ============
const RATED_ARENAS = [
  { id: "BULLET1", name: "⚡ Bullet 1+0 • Rated", format: "Bullet", time: "1+0", stake: 5, playerCount: 0, max: 200, prize: "K70", status: "WAITING", details: "Rated Bullet. Winner 70% / 2nd 30%. 10% fee + 16% tax on fee.", rules: "1 min, no increment. 2 pts win, 1 draw." },
  { id: "BLITZ3", name: "🔥 Blitz 3+2 • Rated", format: "Blitz", time: "3+2", stake: 10, playerCount: 0, max: 200, prize: "K140", status: "WAITING", details: "Rated Blitz 3+2. Most popular.", rules: "3 min + 2 sec increment." },
  { id: "BLITZ5", name: "⚡ Blitz 5+0 • Rated", format: "Blitz", time: "5+0", stake: 10, playerCount: 0, max: 200, prize: "K140", status: "WAITING", details: "Rated Blitz 5+0.", rules: "5 min, no increment." },
  { id: "RAPID10", name: "🌍 Rapid 10+0 • Rated", format: "Rapid", time: "10+0", stake: 5, playerCount: 0, max: 200, prize: "K70", status: "WAITING", details: "Rated Rapid 10 min. Mega Arena.", rules: "10 min rapid." },
  { id: "RAPID15", name: "🏆 Rapid 15+10 • Rated", format: "Rapid", time: "15+10", stake: 50, playerCount: 0, max: 100, prize: "K700", status: "WAITING", details: "Rated Rapid 15+10. VIP.", rules: "15 min + 10 sec increment." },
  { id: "CLASS30", name: "👑 Classical 30+0 • Rated", format: "Classical", time: "30+0", stake: 50, playerCount: 0, max: 50, prize: "K700", status: "WAITING", details: "Rated Classical 30 min. Serious players.", rules: "30 min classical." },
  { id: "FREE1", name: "🎁 Free Practice • Unrated", format: "Practice", time: "10+0", stake: 0, playerCount: 0, max: 200, prize: "K0", status: "WAITING", details: "Free practice, no prize.", rules: "No prize, just points." },
];

const FALLBACK_COURSES = [
  { id: "C1", title: "Beginner: How Pieces Move", level: "Beginner", lessons: 8, time: "45 min", desc: "Pawn, Knight, Bishop, Rook, Queen, King + Castling + En Passant." },
  { id: "C2", title: "Openings Every Zambian Must Know", level: "Beginner", lessons: 10, time: "1 hr", desc: "Italian, Sicilian, London, Caro-Kann." },
  { id: "C3", title: "Tactics: Forks, Pins & Skewers", level: "Intermediate", lessons: 12, time: "1.5 hr", desc: "Win material in 2 moves. 100 puzzles." },
  { id: "C4", title: "Endgames That Win Money", level: "Intermediate", lessons: 9, time: "1 hr", desc: "K+Q vs K, Rook endgames, Opposition." },
  { id: "C5", title: "Pro: Calculation & Strategy", level: "Advanced", lessons: 15, time: "2 hr", desc: "Pawn structures, weak squares, prophylaxis." },
  { id: "C6", title: "Blitz & Arena Psychology", level: "Advanced", lessons: 6, time: "40 min", desc: "Win K5/K10 arenas: time, tilt, streak." },
];

const TRAINING = {
  C1: [
    { q: "Lesson 1: Pawn moves 1 or 2 forward, captures diagonally", answer: "Pawn" },
    { q: "Lesson 2: Knight jumps in L shape - 2 + 1. Only piece that jumps.", answer: "Knight" },
    { q: "Lesson 3: Bishop moves diagonally. Stays on same colour.", answer: "Bishop" },
    { q: "Lesson 4: Rook moves straight. Best on open files.", answer: "Rook" },
  ],
  C3: [
    { q: "Puzzle 1: FORK - Knight attacks King + Queen at same time.", answer: "Fork wins Queen" },
    { q: "Puzzle 2: PIN - Bishop pins Knight to King, Knight cannot move.", answer: "Pin" },
    { q: "Puzzle 3: SKEWER - Rook attacks Queen, Queen moves, King behind falls.", answer: "Skewer" },
  ],
};

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' + s : s}`;
}

export default function App() {
  const user = { name: 'Themba Ndhlovu', username: 'Pazed200' };
  const [balance, setBalance] = useState(900);
  const [view, setView] = useState('home');
  const [tournaments, setTournaments] = useState(RATED_ARENAS);
  const [courses, setCourses] = useState(FALLBACK_COURSES);
  const [arena, setArena] = useState(null);
  const [points, setPoints] = useState(43);
  const [games, setGames] = useState(18);
  const [streak, setStreak] = useState(2);
  const [room, setRoom] = useState('123456');
  const [openCourse, setOpenCourse] = useState(null);
  const [joining, setJoining] = useState(null);
  const [adminPin, setAdminPin] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState('arenas');
  const [fen, setFen] = useState(new Chess().fen());
  const [selected, setSelected] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [msg, setMsg] = useState('Choose Level, Time & Colour to start');
  const [level, setLevel] = useState('Medium');
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [gameActive, setGameActive] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const [setupLevel, setSetupLevel] = useState('Medium');
  const [setupTime, setSetupTime] = useState(600);
  const [setupColour, setSetupColour] = useState('Random');
  const [playerColour, setPlayerColour] = useState('w');
  const timerRef = useRef(null);
  const fenRef = useRef(fen);
  fenRef.current = fen;

  useEffect(() => {
    fetch('/api/tournaments').then(r => r.json()).then(d => { if (d.tournaments?.length) setTournaments(d.tournaments); }).catch(()=>{});
    fetch('/api/courses').then(r => r.json()).then(d => { if (d.courses?.length) setCourses(d.courses); }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!gameActive || !hasMoved) return;
    timerRef.current = setInterval(() => {
      const g = new Chess(fenRef.current);
      if (g.turn() === 'w') setWhiteTime(t => Math.max(0, t - 1));
      else setBlackTime(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameActive, hasMoved]);

  useEffect(() => {
    if (whiteTime === 0 && hasMoved) { setMsg('Time up! Black wins on time'); setGameActive(false); }
    if (blackTime === 0 && hasMoved) { setMsg('Time up! White wins on time'); setGameActive(false); }
  }, [whiteTime, blackTime, hasMoved]);

  function makeComputerMove(currentFen) {
    const g2 = new Chess(currentFen);
    const moves = g2.moves({ verbose: true });
    if (!moves.length) { setMsg('Game Over!'); setGameActive(false); return; }
    let comp = null;
    if (level === 'Easy') comp = moves[Math.floor(Math.random() * moves.length)];
    else if (level === 'Medium') {
      const caps = moves.filter(m => m.captured);
      comp = caps.length && Math.random() > 0.3 ? caps[Math.floor(Math.random() * caps.length)] : moves[Math.floor(Math.random() * moves.length)];
    } else {
      const scored = moves.map(m => { let s = Math.random() * 2; if (m.captured) s += 5; if (m.san.includes('+')) s += 3; return { m, s }; });
      scored.sort((a, b) => b.s - a.s);
      comp = scored[0].m;
    }
    g2.move(comp);
    setFen(g2.fen());
    setLastMove({ from: comp.from, to: comp.to });
    setMsg(`Computer: ${comp.san} - Your move`);
  }

  function startNewGame() {
    let colour = 'w';
    if (setupColour === 'White') colour = 'w';
    else if (setupColour === 'Black') colour = 'b';
    else colour = Math.random() < 0.5 ? 'w' : 'b';
    const g = new Chess();
    setFen(g.fen());
    setLastMove(null);
    setSelected(null);
    setLevel(setupLevel);
    setPlayerColour(colour);
    setWhiteTime(setupTime);
    setBlackTime(setupTime);
    setHasMoved(false);
    setGameActive(false);
    setShowSetup(false);
    if (colour === 'w') setMsg(`You are WHITE - ${setupLevel} - ${setupTime / 60} min - Your move first`);
    else {
      setMsg(`You are BLACK - Computer moves first...`);
      setTimeout(() => { setHasMoved(true); setGameActive(true); makeComputerMove(g.fen()); }, 800);
    }
  }

  function onSquareClick(sq) {
    const game = new Chess(fen);
    if (game.turn() !== playerColour) return;
    if (selected === sq) { setSelected(null); return; }
    if (selected) {
      try {
        const move = game.move({ from: selected, to: sq, promotion: 'q' });
        if (move) {
          if (!hasMoved) { setHasMoved(true); setGameActive(true); }
          setFen(game.fen());
          setLastMove({ from: move.from, to: move.to });
          setSelected(null);
          setMsg(`You: ${move.san} - Computer thinking...`);
          setTimeout(() => makeComputerMove(game.fen()), 500);
          return;
        }
      } catch {}
    }
    const piece = game.get(sq);
    if (piece && piece.color === playerColour) setSelected(sq);
  }

  function renderBoard() {
    const game = new Chess(fen);
    const files = ['a','b','c','d','e','f','g','h'];
    const displayFiles = playerColour === 'w' ? files : [...files].reverse();
    const displayRanks = playerColour === 'w' ? [8,7,6,5,4,3,2,1] : [1,2,3,4,5,6,7,8];
    const rows = [];
    for (let ri = 0; ri < 8; ri++) {
      const r = displayRanks[ri];
      const cols = [];
      for (let ci = 0; ci < 8; ci++) {
        const file = displayFiles[ci];
        const sq = file + r;
        const piece = game.get(sq);
        const fileIdx = files.indexOf(file);
        const isDark = (fileIdx + r) % 2 === 0;
        const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
        const isSel = selected === sq;
        let bg = isDark ? '#769656' : '#eeeed2';
        if (isLast) bg = '#facc15';
        if (isSel) bg = '#22c55e';
        cols.push(
          <div key={sq} onClick={() => onSquareClick(sq)} style={{ width: 42, height: 42, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
            {ci === 0 && <span style={{ position: 'absolute', top: 1, left: 2, fontSize: 9, fontWeight: 'bold', color: isDark ? '#eeeed2' : '#769656', zIndex: 2 }}>{r}</span>}
            {ri === 7 && <span style={{ position: 'absolute', bottom: 1, right: 2, fontSize: 9, fontWeight: 'bold', color: isDark ? '#eeeed2' : '#769656', zIndex: 2 }}>{file}</span>}
            {piece && <div style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.6))', lineHeight: 0 }}><PieceSVG type={piece.type} color={piece.color} /></div>}
          </div>
        );
      }
      rows.push(<div key={r} style={{ display: 'flex', justifyContent: 'center' }}>{cols}</div>);
    }
    return <div style={{ border: '3px solid #333', width: 336, margin: '0 auto', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>{rows}</div>;
  }

  function BoardWithClocks() {
    const youAreWhite = playerColour === 'w';
    const topLabel = youAreWhite ? '⬛ Black • Computer' : '⬜ White • Computer';
    const topTime = youAreWhite ? blackTime : whiteTime;
    const bottomLabel = youAreWhite ? `⬜ White - You (${user.username})` : `⬛ Black - You (${user.username})`;
    const bottomTime = youAreWhite ? whiteTime : blackTime;
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', background: youAreWhite ? '#111' : '#fff', color: youAreWhite ? '#fff' : '#000', padding: '10px 14px', borderRadius: 10, marginBottom: 8 }}>
          <span>{topLabel}</span><span style={{ fontSize: 22, fontWeight: 'bold', fontFamily: 'monospace' }}>⏱ {formatTime(topTime)}</span>
        </div>
        {renderBoard()}
        <div style={{ display: 'flex', justifyContent: 'space-between', background: youAreWhite ? '#fff' : '#111', color: youAreWhite ? '#000' : '#fff', padding: '10px 14px', borderRadius: 10, marginTop: 8 }}>
          <span>{bottomLabel}</span><span style={{ fontSize: 22, fontWeight: 'bold', fontFamily: 'monospace' }}>⏱ {formatTime(bottomTime)}</span>
        </div>
        <p style={{ fontSize: 12 }}>🟡 Yellow = Last Move • 🟢 Green = Selected • {hasMoved ? 'Clock running' : '⏸ Clock paused'}</p>
        <p style={{ fontSize: 13, fontWeight: 'bold', color: '#facc15' }}>You are {youAreWhite ? 'WHITE' : 'BLACK'} • Real SVG Graphics</p>
      </div>
    );
  }

  async function joinArena(t) {
    setJoining(t.id);
    try {
      const r = await fetch('/api/pay/join-arena', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username, tournamentId: t.id, stake: t.stake }) });
      const d = await r.json();
      if (d.error) { alert(d.error); setJoining(null); return; }
      if (d.balance !== undefined) setBalance(d.balance);
    } catch (e) { console.log('Join API offline, opening locally', e); }
    const newRoom = 'ROOM-' + Math.floor(Math.random()*9000+1000);
    setRoom(newRoom);
    setArena({ ...t, pot: t.stake * 2, winnerPrize: Math.round(t.stake * 2 * 0.7), secondPrize: Math.round(t.stake * 2 * 0.3), players: 1 });
    setJoining(null);
    setView('arena');
  }

  async function reportResult(result) {
    const r = await fetch('/api/game-result', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username, name: user.name, result, streak }) }).catch(()=>null);
    const d = r ? await r.json() : {};
    if (d.points) setPoints(d.points);
    if (result === 'win') { setStreak(streak + 1); setGames(games + 1); alert('You won! +4 pts'); }
    if (result === 'draw') setGames(games + 1);
    setView('home');
  }

  function tryAdminLogin() {
    if (adminPin === '2026') { setIsAdmin(true); setView('admin'); }
    else alert('Wrong PIN.');
  }

  // ADMIN: Edit stake for ANY arena
  function updateArenaStake(id, newStake) {
    const s = parseInt(newStake) || 0;
    setTournaments(prev => prev.map(t => {
      if (t.id !== id) return t;
      const winner = Math.round(s * 2 * 0.7);
      return { ...t, stake: s, prize: s === 0 ? 'K0' : `K${winner}`, winnerPrize: winner };
    }));
    if (arena && arena.id === id) setArena(prev => ({ ...prev, stake: s }));
  }
  function updateArenaField(id, field, value) {
    setTournaments(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  }

  // ADMIN MONEY: 1 Total, 2 Tax, 3 Profit
  // Total = sum(stake * players) from real joins + demo balance activity
  // Fee = 10% of Total, Tax = 16% of Fee, Profit = Fee - Tax
  const moneyTotal = tournaments.reduce((sum, t) => sum + (t.stake * (t.playerCount || 0)), 0) + (games * 5);
  const moneyFee = moneyTotal * 0.10;
  const moneyTax = moneyFee * 0.16;
  const moneyProfit = moneyFee - moneyTax;

  if (view === 'home') return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 12, fontFamily: 'sans-serif' }}>
      <div style={{ background: '#1e293b', padding: 10, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, lineHeight: 1.3 }}>👤 <b>{user.name}</b> • 1200 • Online<br/>🔥 {points} pts • {games} games • Streak: {streak}</div>
          <button onClick={() => setView('wallet')} style={{ background: '#000', padding: '6px 10px', borderRadius: 20, border: '1px solid #facc15', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>💰 K{balance} <span style={{ background: '#22c55e', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>Wallet</span></button>
        </div>
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>Min Bet K5 • AUTO STAKES + AUTO REFUND 5 MINS • 🎲 Room: {room}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={() => { setView('computer'); setShowSetup(true); }} style={{ flex: 1, padding: 12, background: '#7c3aed', color: '#fff', border: 0, borderRadius: 12, fontWeight: 'bold' }}>🤖 Play vs Computer</button>
        <button onClick={() => setView('courses')} style={{ flex: 1, padding: 12, background: '#0ea5e9', color: '#fff', border: 0, borderRadius: 12, fontWeight: 'bold' }}>📚 Courses</button>
      </div>
      <div style={{ background: '#1e293b', padding: 16, borderRadius: 16, marginTop: 12 }}>
        <h2 style={{ fontSize: 20, margin: '0 0 8px 0' }}>♟️ Play Now — Auto Stake K5</h2>
        <p>Room {room} vs</p><p>Score: {points} pts • Streak: {streak}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => reportResult('win')} style={{ flex: 1, padding: 10, background: '#22c55e', border: 0, borderRadius: 10 }}>🏆 I Won</button>
          <button onClick={() => reportResult('draw')} style={{ flex: 1, padding: 10, background: '#334155', color: '#fff', border: 0, borderRadius: 10 }}>💛 Draw</button>
          <button onClick={() => reportResult('loss')} style={{ flex: 1, padding: 10, background: '#ef4444', border: 0, borderRadius: 10 }}>😞 I Lost</button>
        </div>
        <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13 }}>🔑 Join by Room Code</p>
      </div>
      <h3 style={{ marginTop: 16 }}>🏆 RATED ARENAS — Bullet / Blitz / Rapid / Classical ({tournaments.length})</h3>
      {tournaments.map(t => (
        <div key={t.id} style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 10, border: '1px solid #facc15' }}>
          <div><b>{t.name}</b><br/><span style={{ fontSize: 13, color: '#facc15' }}>{t.format} • {t.time} • Rated</span><br/><span style={{ fontSize: 13 }}>Stake: K{t.stake} • {t.playerCount === 0 ? '👥 No players yet - Be first to join' : `👥 ${t.playerCount} real players`} • Prize: {t.prize} • {t.status}</span></div>
          <button onClick={() => joinArena(t)} disabled={joining === t.id} style={{ display: 'block', width: '100%', marginTop: 10, padding: 11, background: joining === t.id ? '#94a3b8' : '#22c55e', border: 0, borderRadius: 10, fontWeight: 'bold', cursor: 'pointer' }}>{joining === t.id ? 'Joining...' : `Join K${t.stake} - See Arena Details →`}</button>
        </div>
      ))}
      <p style={{ textAlign: 'center', opacity: 0.7, fontSize: 12 }}>Zed Gambit • Rated Arenas • Auto Refund 5 Mins • 🏆 70% • 🥈 30% • Made in Zambia 🇿🇲</p>
      <button onClick={() => setView('adminLogin')} style={{ display: 'block', width: '100%', marginTop: 10, padding: 10, background: '#111', color: '#888', border: '1px solid #333', borderRadius: 10, fontSize: 12 }}>🔐 Admin Dashboard</button>
    </div>
  );

  if (view === 'arena') return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 16 }}>
      <button onClick={() => setView('home')}>← Back to Home</button>
      <h2>🏟️ {arena?.name}</h2>
      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12 }}>
        <p>💰 <b>Pot: K{arena?.pot}</b></p>
        <p>🏆 Winner: <b>K{arena?.winnerPrize}</b> • 🥈 2nd: <b>K{arena?.secondPrize}</b></p>
        <p>👥 Players: {arena?.players} / {arena?.max}</p>
        <p>🎲 Your Room: {room}</p>
        <p>📜 Rules: {arena?.rules}</p>
        <p>📋 {arena?.details}</p>
      </div>
      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginTop: 12 }}>
        <h3>Report Arena Result</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => reportResult('win')} style={{ flex: 1, padding: 12, background: '#22c55e', border: 0, borderRadius: 10 }}>🏆 I Won Arena</button>
          <button onClick={() => reportResult('draw')} style={{ flex: 1, padding: 12, background: '#334155', color: '#fff', border: 0, borderRadius: 10 }}>💛 Draw</button>
          <button onClick={() => reportResult('loss')} style={{ flex: 1, padding: 12, background: '#ef4444', border: 0, borderRadius: 10 }}>😞 I Lost</button>
        </div>
        <button onClick={() => { setView('computer'); setShowSetup(true); }} style={{ width: '100%', marginTop: 10, padding: 12, background: '#7c3aed', color: '#fff', border: 0, borderRadius: 10 }}>🤖 Practice vs Computer First</button>
      </div>
    </div>
  );

  if (view === 'computer') {
    if (showSetup) return (
      <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 20, textAlign: 'center' }}>
        <button onClick={() => setView('home')} style={{ float: 'left' }}>← Back</button>
        <h2>🤖 Play vs Computer</h2>
        <p>Choose Level, Time & Colour First</p>
        <h3>1. Choose Level</h3>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {['Easy','Medium','Hard'].map(l => (
            <button key={l} onClick={() => setSetupLevel(l)} style={{ padding: '12px 18px', borderRadius: 20, border: setupLevel === l ? '3px solid #facc15' : '1px solid #555', background: setupLevel === l ? '#facc15' : '#334155', color: setupLevel === l ? '#000' : '#fff', fontWeight: 'bold' }}>{l === 'Easy' ? '😊 Easy' : l === 'Medium' ? '😐 Medium' : '🔥 Hard'}</button>
          ))}
        </div>
        <h3 style={{ marginTop: 20 }}>2. Choose Time</h3>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{ label: '⚡ Blitz 3 min', val: 180 },{ label: '⏱ Rapid 5 min', val: 300 },{ label: '🕐 Rapid 10 min', val: 600 },{ label: '🐢 Classical 15 min', val: 900 }].map(t => (
            <button key={t.val} onClick={() => setSetupTime(t.val)} style={{ padding: '12px 16px', borderRadius: 12, border: setupTime === t.val ? '3px solid #22c55e' : '1px solid #555', background: setupTime === t.val ? '#22c55e' : '#334155', color: '#fff', fontWeight: 'bold' }}>{t.label}</button>
          ))}
        </div>
        <h3 style={{ marginTop: 20 }}>3. Choose Colour 🎲</h3>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[{ label: '⬜ White', val: 'White' },{ label: '⬛ Black', val: 'Black' },{ label: '🎲 Random', val: 'Random' }].map(c => (
            <button key={c.val} onClick={() => setSetupColour(c.val)} style={{ padding: '14px 18px', borderRadius: 12, border: setupColour === c.val ? '3px solid #facc15' : '1px solid #555', background: setupColour === c.val ? '#facc15' : '#334155', color: setupColour === c.val ? '#000' : '#fff', fontWeight: 'bold' }}>{c.label}</button>
          ))}
        </div>
        <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginTop: 16 }}><p>You chose: <b>{setupLevel}</b> • <b>{setupTime / 60} min</b> • <b>{setupColour}</b></p></div>
        <button onClick={startNewGame} style={{ width: '100%', padding: 16, background: '#22c55e', border: 0, borderRadius: 12, marginTop: 20, fontWeight: 'bold', fontSize: 16 }}>▶️ Start Game → Open Board</button>
      </div>
    );
    return (
      <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 16, textAlign: 'center' }}>
        <button onClick={() => { setView('home'); setShowSetup(true); }} style={{ float: 'left' }}>← Back</button>
        <button onClick={() => setShowSetup(true)} style={{ float: 'right', padding: '6px 12px', background: '#facc15', border: 0, borderRadius: 8 }}>⚙️ Change Setup</button>
        <h2>🤖 Play vs Computer</h2>
        <p>Level: <b>{level}</b> • You are <b>{playerColour === 'w' ? 'WHITE' : 'BLACK'}</b><br/>{hasMoved ? msg : '⏸ Clock paused'}</p>
        <BoardWithClocks />
        <button onClick={startNewGame} style={{ padding: 12, background: '#22c55e', border: 0, borderRadius: 10, marginTop: 12 }}>🔄 New Game</button>
        {lastMove && <p>Last Move: <b style={{ background: '#facc15', color: '#000', padding: '2px 8px', borderRadius: 6 }}>{lastMove.from} → {lastMove.to}</b></p>}
      </div>
    );
  }

  if (view === 'courses') return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 16 }}>
      <button onClick={() => setView('home')}>← Back</button>
      <h2>📚 Chess Courses</h2>
      {courses.map(c => (
        <div key={c.id} style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12 }}>
          <b>{c.title}</b><br/><span style={{ color: '#facc15' }}>{c.level} • {c.lessons} lessons • {c.time}</span><br/>{c.desc}<br/>
          <button onClick={() => setOpenCourse(openCourse === c.id ? null : c.id)} style={{ marginTop: 10, padding: 10, background: '#0ea5e9', border: 0, borderRadius: 8, color: '#fff' }}>{openCourse === c.id ? 'Close' : 'Start Lesson →'}</button>
          {openCourse === c.id && (
            <div style={{ background: '#000', padding: 12, borderRadius: 8, marginTop: 10 }}>
              {(TRAINING[c.id] || [{ q: 'Lesson coming soon', answer: 'Check back soon' }]).map((l, i) => (
                <div key={i} style={{ background: '#1e293b', padding: 10, marginBottom: 8, borderRadius: 8 }}><b>{i + 1}. {l.q}</b><br/><span style={{ color: '#facc15' }}>💡 {l.answer}</span></div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (view === 'wallet') return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 16 }}>
      <button onClick={() => setView('home')}>← Back</button>
      <h2>💰 Wallet: K{balance}</h2>
      <p>User: {user.username} • {user.name}</p>
      <button onClick={async () => { const r = await fetch('/api/pay/deposit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username, amount: 10 }) }); const d = await r.json(); setBalance(d.balance); alert('Deposited K10'); }} style={{ padding: 14, background: '#22c55e', border: 0, borderRadius: 10 }}>Deposit K10 (Demo)</button>
      <button onClick={() => setView('adminLogin')} style={{ display: 'block', marginTop: 12, padding: 12, background: '#111', color: '#fff', border: '1px solid #444', borderRadius: 10 }}>🔐 Go to Admin Dashboard</button>
    </div>
  );

  if (view === 'adminLogin') return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 20, textAlign: 'center' }}>
      <button onClick={() => setView('home')} style={{ float: 'left' }}>← Back</button>
      <h2>🔐 Admin Dashboard</h2>
      <p>Enter Admin PIN to continue.<br/>You are the owner - Themba Ndhlovu</p>
      <input value={adminPin} onChange={e => setAdminPin(e.target.value)} placeholder="Enter PIN" type="password" inputMode="numeric" style={{ padding: 14, fontSize: 18, borderRadius: 10, border: '1px solid #555', background: '#1e293b', color: '#fff', textAlign: 'center', width: 180 }} />
      <br/><button onClick={tryAdminLogin} style={{ marginTop: 16, padding: '14px 30px', background: '#22c55e', border: 0, borderRadius: 10, fontWeight: 'bold', fontSize: 16 }}>Login as Admin →</button>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 12 }}>Default PIN for first time: <b>2026</b></p>
    </div>
  );

  if (view === 'admin' && isAdmin) return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2>🛠️ Admin Dashboard</h2><button onClick={() => { setIsAdmin(false); setView('home'); }}>Logout</button></div>
      <p>Welcome, {user.name} • Admin: {user.username}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        {['arenas','money','players'].map(t => (
          <button key={t} onClick={() => setAdminTab(t)} style={{ flex: 1, padding: 10, background: adminTab === t ? '#facc15' : '#334155', color: adminTab === t ? '#000' : '#fff', border: 0, borderRadius: 10, fontWeight: 'bold' }}>{t === 'arenas' ? '🏟️ Arenas / Edit Stakes' : t === 'money' ? '💰 Money' : '👥 Players'}</button>
        ))}
      </div>

      {adminTab === 'arenas' && (
        <div style={{ marginTop: 16 }}>
          <h3>All Rated Arenas — Edit Stake Here</h3>
          <p style={{ fontSize: 13, opacity: 0.8 }}>Change the number, it updates instantly on Home for all players. Prize auto-updates to 70% of pot.</p>
          {tournaments.map(t => (
            <div key={t.id} style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 10, border: '1px solid #333' }}>
              <b>{t.name}</b><br/><span style={{ fontSize: 12, color: '#facc15' }}>{t.format} • {t.time} • {t.status}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                <label style={{ fontSize: 13 }}>Stake K:</label>
                <input type="number" value={t.stake} onChange={e => updateArenaStake(t.id, e.target.value)} style={{ width: 80, padding: 8, borderRadius: 8, border: '1px solid #555', background: '#000', color: '#fff', fontSize: 16, fontWeight: 'bold' }} />
                <label style={{ fontSize: 13 }}>Max:</label>
                <input type="number" value={t.max} onChange={e => updateArenaField(t.id, 'max', parseInt(e.target.value) || 0)} style={{ width: 70, padding: 8, borderRadius: 8, border: '1px solid #555', background: '#000', color: '#fff' }} />
                <select value={t.status} onChange={e => updateArenaField(t.id, 'status', e.target.value)} style={{ padding: 8, borderRadius: 8, background: '#000', color: '#fff' }}>
                  <option>WAITING</option><option>LIVE</option><option>CLOSED</option>
                </select>
              </div>
              <p style={{ fontSize: 13, margin: '8px 0 0 0' }}>Prize now: <b>{t.prize}</b> • Players: {t.playerCount} / {t.max} • Pot if full: K{t.stake * t.max}</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[5,10,20,50,100].map(v => (
                  <button key={v} onClick={() => updateArenaStake(t.id, v)} style={{ padding: '6px 10px', background: t.stake === v ? '#facc15' : '#334155', color: t.stake === v ? '#000' : '#fff', border: 0, borderRadius: 8, fontWeight: 'bold' }}>K{v}</button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => { alert('Stakes saved! Home arenas updated.'); setView('home'); }} style={{ width: '100%', padding: 14, background: '#22c55e', border: 0, borderRadius: 10, fontWeight: 'bold' }}>✅ Save All Stakes → Go Home</button>
        </div>
      )}

      {adminTab === 'money' && (
        <div style={{ marginTop: 16 }}>
          <h3>💰 Money — Total / Tax / Profit</h3>
          <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #333' }}><span>1. TOTAL Collected</span><b style={{ fontSize: 20 }}>K{moneyTotal.toFixed(2)}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #333' }}><span>2. TAX (16% of 10% fee)</span><b style={{ fontSize: 20, color: '#f87171' }}>K{moneyTax.toFixed(2)}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}><span>3. PROFIT (Fee - Tax)</span><b style={{ fontSize: 22, color: '#22c55e' }}>K{moneyProfit.toFixed(2)}</b></div>
          </div>
          <div style={{ background: '#000', padding: 14, borderRadius: 12, fontSize: 13, lineHeight: 1.6 }}>
            <b>How it works:</b><br/>
            Fee = 10% of Total = K{moneyFee.toFixed(2)}<br/>
            Tax = 16% of Fee = K{moneyTax.toFixed(2)}<br/>
            Profit = Fee - Tax = K{moneyProfit.toFixed(2)}<br/>
            Payouts: 70% Winner / 30% 2nd from remaining 90%<br/>
            Games played: {games} • Total players in arenas: {tournaments.reduce((s,t)=>s+(t.playerCount||0),0)}
          </div>
          <h4 style={{ marginTop: 16 }}>Per Arena Breakdown</h4>
          {tournaments.map(t => {
            const tot = t.stake * (t.playerCount || 0);
            const fee = tot * 0.10;
            const tax = fee * 0.16;
            const profit = fee - tax;
            return (
              <div key={t.id} style={{ background: '#1e293b', padding: 12, borderRadius: 10, marginBottom: 8, fontSize: 13 }}>
                <b>{t.name}</b> • Stake K{t.stake} • Players {t.playerCount}<br/>
                Total K{tot.toFixed(0)} • Tax K{tax.toFixed(2)} • Profit K{profit.toFixed(2)}
              </div>
            );
          })}
        </div>
      )}

      {adminTab === 'players' && (
        <div style={{ marginTop: 16 }}>
          <h3>Players</h3>
          <div style={{ background: '#1e293b', padding: 14, borderRadius: 12 }}><b>{user.name} ({user.username})</b><br/>Balance: K{balance} • Points: {points} • Games: {games} • Streak: {streak}</div>
          <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Other players appear here when they join via /api/pay/join-arena.</p>
        </div>
      )}
    </div>
  );

  return null;
}


