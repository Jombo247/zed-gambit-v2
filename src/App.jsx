
import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';

// ============ SOUNDS - Web Audio, no files needed ============
function useSounds(enabledRef) {
  const ctxRef = useRef(null);
  function tone(freq, dur, type, vol, delay) {
    if (!enabledRef.current) return;
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const t = ctx.currentTime + (delay || 0);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol || 0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch {}
  }
  return {
    select: () => tone(800, 0.06, 'sine', 0.08),
    move: () => { tone(500, 0.08, 'triangle', 0.15); tone(250, 0.06, 'sine', 0.08, 0.02); },
    capture: () => { tone(180, 0.12, 'square', 0.12); tone(90, 0.15, 'sine', 0.15, 0.01); },
    check: () => { tone(880, 0.15, 'sine', 0.15); tone(880, 0.15, 'sine', 0.15, 0.18); },
    start: () => { tone(523, 0.12, 'sine', 0.12); tone(659, 0.12, 'sine', 0.12, 0.12); tone(784, 0.2, 'sine', 0.12, 0.24); },
    illegal: () => tone(150, 0.1, 'sawtooth', 0.06),
    win: () => { tone(523, 0.15, 'sine', 0.15); tone(659, 0.15, 'sine', 0.15, 0.15); tone(784, 0.15, 'sine', 0.15, 0.3); tone(1046, 0.3, 'sine', 0.15, 0.45); },
  };
}

// ============ REAL CHESS PIECES - cburnett, inline SVG ============
function PieceSVG({ type, color }) {
  const fill = color === 'w' ? '#fff' : '#000';
  const s = { fill, stroke: '#000', strokeWidth: 1.5, strokeLinejoin: 'round', strokeLinecap: 'round' };
  const style = { width: '100%', height: '100%', display: 'block' };
  if (type === 'p') return (<svg viewBox="0 0 45 45" style={style}><path d="M22.5 11.63c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 19.5 16 21.59 16 24c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.99.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" {...s} /></svg>);
  if (type === 'r') return (<svg viewBox="0 0 45 45" style={style}><g {...s}><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" /><path d="M34 14l-3 3H14l-3-3" /><path d="M31 17v12.5H14V17" /><path d="M31 29.5l1.5 2.5h-20l1.5-2.5" /><path d="M11 14h23" /></g></svg>);
  if (type === 'n') return (<svg viewBox="0 0 45 45" style={style}><g {...s}><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" /><path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.04-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.32-.31-4-2 2-3.26 8.45-7.35 9-9.5" /><path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zM15.43 15.75a.5 1.5 30 1 1-.86-.5.5 1.5 30 1 1 .86.5z" /></g></svg>);
  if (type === 'b') return (<svg viewBox="0 0 45 45" style={style}><g {...s}><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65-1.99 3-3.5.74-2.87.5-6.57-.5-9.5-1.5-2-2.5-3.5-4-5-1.5-1.5-3.5-3-6-3-2.5 0-4.5 1.5-6 3-1.5 1.5-2.5 3-4 5-1 2.93-1.24 6.63-.5 9.5 1.35 1.51 3 3.5 3 3.5z" /><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" /><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" /></g></svg>);
  if (type === 'q') return (<svg viewBox="0 0 45 45" style={style}><g {...s}><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM33 9a2 2 0 1 1-4 0 2 2 0 1 1 4 0z" /><path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14l2 12z" /><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-2 0-2 1.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" /><path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" fill="none" /></g></svg>);
  return (<svg viewBox="0 0 45 45" style={style}><g {...s}><path d="M22.5 11.63V6M20 8h5" fill="none" /><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" /><path d="M11.5 37c5.5 3.5 14.5 3.5 22 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7z" /><path d="M11.5 30c3.5-1 18.5-1 22 0M12.5 33.5c5-1 14-1 20 0" fill="none" /></g></svg>);
}

const RATED_ARENAS = [
  { id: "BULLET1", name: "⚡ Bullet 1+0 • Rated", format: "Bullet", time: "1+0", stake: 5, playerCount: 0, max: 200, prize: "K70", status: "WAITING", details: "Rated Bullet. Winner 70% / 2nd 30%. 10% fee + 16% tax on fee.", rules: "1 min, no increment. 2 pts win, 1 draw." },
  { id: "BLITZ3", name: "🔥 Blitz 3+2 • Rated", format: "Blitz", time: "3+2", stake: 10, playerCount: 0, max: 200, prize: "K140", status: "WAITING", details: "Rated Blitz 3+2. Most popular.", rules: "3 min + 2 sec increment." },
  { id: "BLITZ5", name: "⚡ Blitz 5+0 • Rated", format: "Blitz", time: "5+0", stake: 10, playerCount: 0, max: 200, prize: "K140", status: "WAITING", details: "Rated Blitz 5+0.", rules: "5 min, no increment." },
  { id: "RAPID10", name: "🌍 Rapid 10+0 • Rated", format: "Rapid", time: "10+0", stake: 5, playerCount: 0, max: 200, prize: "K70", status: "WAITING", details: "Rated Rapid 10 min. Mega Arena.", rules: "10 min rapid." },
  { id: "RAPID15", name: "🏆 Rapid 15+10 • Rated", format: "Rapid", time: "15+10", stake: 50, playerCount: 0, max: 100, prize: "K700", status: "WAITING", details: "Rated Rapid 15+10. VIP.", rules: "15 min + 10 sec increment." },
  { id: "CLASS30", name: "👑 Classical 30+0 • Rated", format: "Classical", time: "30+0", stake: 50, playerCount: 0, max: 50, prize: "K700", status: "WAITING", details: "Rated Classical 30 min.", rules: "30 min classical." },
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
  const [soundOn, setSoundOn] = useState(true);
  const soundRef = useRef(true);
  soundRef.current = soundOn;
  const sounds = useSounds(soundRef);

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

  function playMoveSound(move, gameAfter) {
    if (move.captured) sounds.capture();
    else if (gameAfter.inCheck()) sounds.check();
    else sounds.move();
    if (gameAfter.isCheckmate()) setTimeout(() => sounds.win(), 300);
  }

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
    playMoveSound(comp, g2);
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
    sounds.start();
    if (colour === 'w') setMsg(`You are WHITE - ${setupLevel} - ${setupTime / 60} min - Your move first`);
    else {
      setMsg(`You are BLACK - Computer moves first...`);
      setTimeout(() => { setHasMoved(true); setGameActive(true); makeComputerMove(g.fen()); }, 800);
    }
  }

  function onSquareClick(sq) {
    const game = new Chess(fen);
    if (game.turn() !== playerColour) { sounds.illegal(); return; }
    if (selected === sq) { setSelected(null); sounds.select(); return; }
    if (selected) {
      try {
        const move = game.move({ from: selected, to: sq, promotion: 'q' });
        if (move) {
          if (!hasMoved) { setHasMoved(true); setGameActive(true); }
          setFen(game.fen());
          setLastMove({ from: move.from, to: move.to });
          setSelected(null);
          playMoveSound(move, game);
          setMsg(`You: ${move.san} - Computer thinking...`);
          setTimeout(() => makeComputerMove(game.fen()), 500);
          return;
        }
      } catch { sounds.illegal(); }
    }
    const piece = game.get(sq);
    if (piece && piece.color === playerColour) { setSelected(sq); sounds.select(); }
  }

  // ============ BOARD - FITS MOBILE + DESKTOP ============
  function renderBoard() {
    const game = new Chess(fen);
    const files = ['a','b','c','d','e','f','g','h'];
    const displayFiles = playerColour === 'w' ? files : [...files].reverse();
    const displayRanks = playerColour === 'w' ? [8,7,6,5,4,3,2,1] : [1,2,3,4,5,6,7,8];
    return (
      <div style={{ width: 'min(92vw, 480px)', aspectRatio: '1 / 1', margin: '0 auto', border: '3px solid #333', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', overflow: 'hidden', borderRadius: 4 }}>
        {displayRanks.map((r, ri) =>
          displayFiles.map((file, ci) => {
            const sq = file + r;
            const piece = game.get(sq);
            const fileIdx = files.indexOf(file);
            const isDark = (fileIdx + r) % 2 === 0;
            const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
            const isSel = selected === sq;
            let bg = isDark ? '#769656' : '#eeeed2';
            if (isLast) bg = '#facc15';
            if (isSel) bg = '#22c55e';
            return (
              <div key={sq} onClick={() => onSquareClick(sq)} style={{ width: '100%', height: '100%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
                {ci === 0 && <span style={{ position: 'absolute', top: '2%', left: '4%', fontSize: 'clamp(8px, 2vw, 11px)', fontWeight: 'bold', color: isDark ? '#eeeed2' : '#769656', zIndex: 2 }}>{r}</span>}
                {ri === 7 && <span style={{ position: 'absolute', bottom: '2%', right: '4%', fontSize: 'clamp(8px, 2vw, 11px)', fontWeight: 'bold', color: isDark ? '#eeeed2' : '#769656', zIndex: 2 }}>{file}</span>}
                {piece && <div style={{ width: '88%', height: '88%', lineHeight: 0, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.6))' }}><PieceSVG type={piece.type} color={piece.color} /></div>}
              </div>
            );
          })
        )}
      </div>
    );
  }

  function BoardWithClocks() {
    const youAreWhite = playerColour === 'w';
    const topLabel = youAreWhite ? '⬛ Black • Computer' : '⬜ White • Computer';
    const topTime = youAreWhite ? blackTime : whiteTime;
    const bottomLabel = youAreWhite ? `⬜ White - You (${user.username})` : `⬛ Black - You (${user.username})`;
    const bottomTime = youAreWhite ? whiteTime : blackTime;
    return (
      <div style={{ width: 'min(94vw, 500px)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: youAreWhite ? '#111' : '#fff', color: youAreWhite ? '#fff' : '#000', padding: '10px 14px', borderRadius: 10, marginBottom: 8, width: '100%', boxSizing: 'border-box' }}>
          <span style={{ fontSize: 'clamp(12px, 3.5vw, 15px)' }}>{topLabel}</span><span style={{ fontSize: 20, fontWeight: 'bold', fontFamily: 'monospace' }}>⏱ {formatTime(topTime)}</span>
        </div>
        {renderBoard()}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: youAreWhite ? '#fff' : '#111', color: youAreWhite ? '#000' : '#fff', padding: '10px 14px', borderRadius: 10, marginTop: 8, width: '100%', boxSizing: 'border-box' }}>
          <span style={{ fontSize: 'clamp(12px, 3.5vw, 15px)' }}>{bottomLabel}</span><span style={{ fontSize: 20, fontWeight: 'bold', fontFamily: 'monospace' }}>⏱ {formatTime(bottomTime)}</span>
        </div>
        <p style={{ fontSize: 12 }}>🟡 Yellow = Last Move • 🟢 Green = Selected • {hasMoved ? 'Clock running' : '⏸ Clock paused'}</p>
        <p style={{ fontSize: 13, fontWeight: 'bold', color: '#facc15' }}>You are {youAreWhite ? 'WHITE' : 'BLACK'} • Real SVG Graphics • 🔊 Sounds On</p>
      </div>
    );
  }

  async function joinArena(t) {
    setJoining(t.id);
    sounds.select();
    try {
      const r = await fetch('/api/pay/join-arena', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username, tournamentId: t.id, stake: t.stake }) });
      const d = await r.json();
      if (d.error) { alert(d.error); setJoining(null); return; }
      if (d.balance !== undefined) setBalance(d.balance);
    } catch (e) { console.log('Join API offline', e); }
    const newRoom = 'ROOM-' + Math.floor(Math.random()*9000+1000);
    setRoom(newRoom);
    setArena({ ...t, pot: t.stake * 2, winnerPrize: Math.round(t.stake * 2 * 0.7), secondPrize: Math.round(t.stake * 2 * 0.3), players: 1 });
    setJoining(null);
    setView('arena');
  }

  async function reportResult(result) {
    if (result === 'win') sounds.win();
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

  function updateArenaStake(id, newStake) {
    const s = parseInt(newStake) || 0;
    setTournaments(prev => prev.map(t => {
      if (t.id !== id) return t;
      return { ...t, stake: s, prize: s === 0 ? 'K0' : `K${Math.round(s * 2 * 0.7)}` };
    }));
    if (arena && arena.id === id) setArena(prev => ({ ...prev, stake: s }));
  }
  function updateArenaField(id, field, value) {
    setTournaments(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  }

  const moneyTotal = tournaments.reduce((sum, t) => sum + (t.stake * (t.playerCount || 0)), 0) + (games * 5);
  const moneyFee = moneyTotal * 0.10;
  const moneyTax = moneyFee * 0.16;
  const moneyProfit = moneyFee - moneyTax;

  if (view === 'home') return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 12, fontFamily: 'sans-serif', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ background: '#1e293b', padding: 10, borderRadius: 12, maxWidth: 520, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, lineHeight: 1.3 }}>👤 <b>{user.name}</b> • 1200 • Online<br/>🔥 {points} pts • {games} games • Streak: {streak}</div>
          <button onClick={() => setView('wallet')} style={{ background: '#000', padding: '6px 10px', borderRadius: 20, border: '1px solid #facc15', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>💰 K{balance} <span style={{ background: '#22c55e', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>Wallet</span></button>
        </div>
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>Min Bet K5 • AUTO STAKES + AUTO REFUND 5 MINS • 🎲 Room: {room}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
        <button onClick={() => { setView('computer'); setShowSetup(true); }} style={{ flex: 1, padding: 12, background: '#7c3aed', color: '#fff', border: 0, borderRadius: 12, fontWeight: 'bold' }}>🤖 Play vs Computer</button>
        <button onClick={() => setView('courses')} style={{ flex: 1, padding: 12, background: '#0ea5e9', color: '#fff', border: 0, borderRadius: 12, fontWeight: 'bold' }}>📚 Courses</button>
      </div>
      <div style={{ background: '#1e293b', padding: 16, borderRadius: 16, marginTop: 12, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
        <h2 style={{ fontSize: 20, margin: '0 0 8px 0' }}>♟️ Play Now — Auto Stake K5</h2>
        <p>Room {room} vs</p><p>Score: {points} pts • Streak: {streak}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => reportResult('win')} style={{ flex: 1, padding: 10, background: '#22c55e', border: 0, borderRadius: 10 }}>🏆 I Won</button>
          <button onClick={() => reportResult('draw')} style={{ flex: 1, padding: 10, background: '#334155', color: '#fff', border: 0, borderRadius: 10 }}>💛 Draw</button>
          <button onClick={() => reportResult('loss')} style={{ flex: 1, padding: 10, background: '#ef4444', border: 0, borderRadius: 10 }}>😞 I Lost</button>
        </div>
        <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13 }}>🔑 Join by Room Code</p>
      </div>
      <h3 style={{ marginTop: 16, textAlign: 'center' }}>🏆 RATED ARENAS — Bullet / Blitz / Rapid / Classical ({tournaments.length})</h3>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        {tournaments.map(t => (
          <div key={t.id} style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 10, border: '1px solid #facc15' }}>
            <div><b>{t.name}</b><br/><span style={{ fontSize: 13, color: '#facc15' }}>{t.format} • {t.time} • Rated</span><br/><span style={{ fontSize: 13 }}>Stake: K{t.stake} • {t.playerCount === 0 ? '👥 No players yet - Be first to join' : `👥 ${t.playerCount} real players`} • Prize: {t.prize} • {t.status}</span></div>
            <button onClick={() => joinArena(t)} disabled={joining === t.id} style={{ display: 'block', width: '100%', marginTop: 10, padding: 11, background: joining === t.id ? '#94a3b8' : '#22c55e', border: 0, borderRadius: 10, fontWeight: 'bold', cursor: 'pointer' }}>{joining === t.id ? 'Joining...' : `Join K${t.stake} - See Arena Details →`}</button>
          </div>
        ))}
      </div>
      <p style={{ textAlign: 'center', opacity: 0.7, fontSize: 12 }}>Zed Gambit • Rated Arenas • Auto Refund 5 Mins • 🏆 70% • 🥈 30% • Made in Zambia 🇿🇲</p>
      <button onClick={() => setView('adminLogin')} style={{ display: 'block', width: '100%', maxWidth: 520, margin: '10px auto 0', padding: 10, background: '#111', color: '#888', border: '1px solid #333', borderRadius: 10, fontSize: 12 }}>🔐 Admin Dashboard</button>
    </div>
  );

  if (view === 'arena') return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 16, boxSizing: 'border-box' }}>
      <button onClick={() => setView('home')}>← Back to Home</button>
      <h2>🏟️ {arena?.name}</h2>
      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, maxWidth: 520, margin: '0 auto' }}>
        <p>💰 <b>Pot: K{arena?.pot}</b></p>
        <p>🏆 Winner: <b>K{arena?.winnerPrize}</b> • 🥈 2nd: <b>K{arena?.secondPrize}</b></p>
        <p>👥 Players: {arena?.players} / {arena?.max}</p>
        <p>🎲 Your Room: {room}</p>
        <p>📜 Rules: {arena?.rules}</p>
        <p>📋 {arena?.details}</p>
      </div>
      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginTop: 12, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
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
      <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 20, textAlign: 'center', boxSizing: 'border-box' }}>
        <button onClick={() => setView('home')} style={{ float: 'left' }}>← Back</button>
        <h2>🤖 Play vs Computer</h2>
        <p>Choose Level, Time & Colour First</p>
        <h3>1. Choose Level</h3>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {['Easy','Medium','Hard'].map(l => (
            <button key={l} onClick={() => { setSetupLevel(l); sounds.select(); }} style={{ padding: '12px 18px', borderRadius: 20, border: setupLevel === l ? '3px solid #facc15' : '1px solid #555', background: setupLevel === l ? '#facc15' : '#334155', color: setupLevel === l ? '#000' : '#fff', fontWeight: 'bold' }}>{l === 'Easy' ? '😊 Easy' : l === 'Medium' ? '😐 Medium' : '🔥 Hard'}</button>
          ))}
        </div>
        <h3 style={{ marginTop: 20 }}>2. Choose Time</h3>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{ label: '⚡ Blitz 3 min', val: 180 },{ label: '⏱ Rapid 5 min', val: 300 },{ label: '🕐 Rapid 10 min', val: 600 },{ label: '🐢 Classical 15 min', val: 900 }].map(t => (
            <button key={t.val} onClick={() => { setSetupTime(t.val); sounds.select(); }} style={{ padding: '12px 16px', borderRadius: 12, border: setupTime === t.val ? '3px solid #22c55e' : '1px solid #555', background: setupTime === t.val ? '#22c55e' : '#334155', color: '#fff', fontWeight: 'bold' }}>{t.label}</button>
          ))}
        </div>
        <h3 style={{ marginTop: 20 }}>3. Choose Colour 🎲</h3>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[{ label: '⬜ White', val: 'White' },{ label: '⬛ Black', val: 'Black' },{ label: '🎲 Random', val: 'Random' }].map(c => (
            <button key={c.val} onClick={() => { setSetupColour(c.val); sounds.select(); }} style={{ padding: '14px 18px', borderRadius: 12, border: setupColour === c.val ? '3px solid #facc15' : '1px solid #555', background: setupColour === c.val ? '#facc15' : '#334155', color: setupColour === c.val ? '#000' : '#fff', fontWeight: 'bold' }}>{c.label}</button>
          ))}
        </div>
        <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginTop: 16, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}><p>You chose: <b>{setupLevel}</b> • <b>{setupTime / 60} min</b> • <b>{setupColour}</b></p></div>
        <button onClick={startNewGame} style={{ width: '100%', maxWidth: 520, padding: 16, background: '#22c55e', border: 0, borderRadius: 12, marginTop: 20, fontWeight: 'bold', fontSize: 16 }}>▶️ Start Game → Open Board</button>
      </div>
    );
    return (
      <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: '12px 8px', textAlign: 'center', overflowX: 'hidden', boxSizing: 'border-box' }}>
        <div style={{ width: 'min(94vw, 500px)', margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => { setView('home'); setShowSetup(true); }}>← Back</button>
          <button onClick={() => setSoundOn(!soundOn)} style={{ padding: '6px 12px', background: soundOn ? '#22c55e' : '#555', border: 0, borderRadius: 8, color: '#fff', fontWeight: 'bold' }}>{soundOn ? '🔊 Sound On' : '🔇 Muted'}</button>
          <button onClick={() => setShowSetup(true)} style={{ padding: '6px 12px', background: '#facc15', border: 0, borderRadius: 8 }}>⚙️ Change Setup</button>
        </div>
        <h2>🤖 Play vs Computer</h2>
        <p>Level: <b>{level}</b> • You are <b>{playerColour === 'w' ? 'WHITE' : 'BLACK'}</b><br/>{hasMoved ? msg : '⏸ Clock paused - Tap a piece to hear sound'}</p>
        <BoardWithClocks />
        <div style={{ width: 'min(94vw, 500px)', margin: '12px auto 0', display: 'flex', gap: 8 }}>
          <button onClick={() => { sounds.start(); startNewGame(); }} style={{ flex: 1, padding: 12, background: '#22c55e', border: 0, borderRadius: 10 }}>🔄 New Game</button>
          <button onClick={() => reportResult('win')} style={{ flex: 1, padding: 12, background: '#facc15', border: 0, borderRadius: 10 }}>I Beat Computer 🏆</button>
        </div>
        {lastMove && <p>Last Move: <b style={{ background: '#facc15', color: '#000', padding: '2px 8px', borderRadius: 6 }}>{lastMove.from} → {lastMove.to}</b></p>}
      </div>
    );
  }

  if (view === 'courses') return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 16, boxSizing: 'border-box' }}>
      <button onClick={() => setView('home')}>← Back</button>
      <h2>📚 Chess Courses</h2>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        {courses.map(c => (
          <div key={c.id} style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12 }}>
            <b>{c.title}</b><br/><span style={{ color: '#facc15' }}>{c.level} • {c.lessons} lessons • {c.time}</span><br/>{c.desc}<br/>
            <button onClick={() => { setOpenCourse(openCourse === c.id ? null : c.id); sounds.select(); }} style={{ marginTop: 10, padding: 10, background: '#0ea5e9', border: 0, borderRadius: 8, color: '#fff' }}>{openCourse === c.id ? 'Close' : 'Start Lesson →'}</button>
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
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 12 }}>Default PIN: <b>2026</b></p>
    </div>
  );

  if (view === 'admin' && isAdmin) return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 16, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 520, margin: '0 auto' }}><h2>🛠️ Admin Dashboard</h2><button onClick={() => { setIsAdmin(false); setView('home'); }}>Logout</button></div>
      <p style={{ textAlign: 'center' }}>Welcome, {user.name} • Admin: {user.username}</p>
      <div style={{ display: 'flex', gap: 8, maxWidth: 520, margin: '0 auto' }}>
        {['arenas','money','players'].map(t => (
          <button key={t} onClick={() => setAdminTab(t)} style={{ flex: 1, padding: 10, background: adminTab === t ? '#facc15' : '#334155', color: adminTab === t ? '#000' : '#fff', border: 0, borderRadius: 10, fontWeight: 'bold' }}>{t === 'arenas' ? '🏟️ Arenas / Edit Stakes' : t === 'money' ? '💰 Money' : '👥 Players'}</button>
        ))}
      </div>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        {adminTab === 'arenas' && (
          <div style={{ marginTop: 16 }}>
            <h3>All Rated Arenas — Edit Stake Here</h3>
            {tournaments.map(t => (
              <div key={t.id} style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 10 }}>
                <b>{t.name}</b><br/><span style={{ fontSize: 12, color: '#facc15' }}>{t.format} • {t.time} • {t.status}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                  <label style={{ fontSize: 13 }}>Stake K:</label>
                  <input type="number" value={t.stake} onChange={e => updateArenaStake(t.id, e.target.value)} style={{ width: 80, padding: 8, borderRadius: 8, border: '1px solid #555', background: '#000', color: '#fff', fontSize: 16, fontWeight: 'bold' }} />
                  <label style={{ fontSize: 13 }}>Max:</label>
                  <input type="number" value={t.max} onChange={e => updateArenaField(t.id, 'max', parseInt(e.target.value) || 0)} style={{ width: 70, padding: 8, borderRadius: 8, border: '1px solid #555', background: '#000', color: '#fff' }} />
                  <select value={t.status} onChange={e => updateArenaField(t.id, 'status', e.target.value)} style={{ padding: 8, borderRadius: 8, background: '#000', color: '#fff' }}><option>WAITING</option><option>LIVE</option><option>CLOSED</option></select>
                </div>
                <p style={{ fontSize: 13 }}>Prize now: <b>{t.prize}</b> • Players: {t.playerCount} / {t.max}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[5,10,20,50,100].map(v => (
                    <button key={v} onClick={() => updateArenaStake(t.id, v)} style={{ padding: '6px 10px', background: t.stake === v ? '#facc15' : '#334155', color: t.stake === v ? '#000' : '#fff', border: 0, borderRadius: 8, fontWeight: 'bold' }}>K{v}</button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => { alert('Stakes saved!'); setView('home'); }} style={{ width: '100%', padding: 14, background: '#22c55e', border: 0, borderRadius: 10, fontWeight: 'bold' }}>✅ Save All Stakes → Go Home</button>
          </div>
        )}
        {adminTab === 'money' && (
          <div style={{ marginTop: 16 }}>
            <h3>💰 Money — Total / Tax / Profit</h3>
            <div style={{ background: '#1e293b', padding: 16, borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #333' }}><span>1. TOTAL Collected</span><b style={{ fontSize: 20 }}>K{moneyTotal.toFixed(2)}</b></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #333' }}><span>2. TAX (16% of 10% fee)</span><b style={{ fontSize: 20, color: '#f87171' }}>K{moneyTax.toFixed(2)}</b></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}><span>3. PROFIT (Fee - Tax)</span><b style={{ fontSize: 22, color: '#22c55e' }}>K{moneyProfit.toFixed(2)}</b></div>
            </div>
            <div style={{ background: '#000', padding: 14, borderRadius: 12, fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
              Fee = 10% of Total = K{moneyFee.toFixed(2)}<br/>Tax = 16% of Fee = K{moneyTax.toFixed(2)}<br/>Profit = Fee - Tax = K{moneyProfit.toFixed(2)}
            </div>
          </div>
        )}
        {adminTab === 'players' && (
          <div style={{ marginTop: 16 }}>
            <h3>Players</h3>
            <div style={{ background: '#1e293b', padding: 14, borderRadius: 12 }}><b>{user.name} ({user.username})</b><br/>Balance: K{balance} • Points: {points} • Games: {games} • Streak: {streak}</div>
          </div>
        )}
      </div>
    </div>
  );

  return null;
}


