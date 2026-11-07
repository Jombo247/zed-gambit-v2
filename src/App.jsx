
import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';

// REAL GRAPHICS - Image URLs, not Unicode. Works on all Android phones.
const PIECE_IMG = {
  wk: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  wq: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  wr: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  wb: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  wn: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  wp: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  bk: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
  bq: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  br: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  bb: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  bn: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Chess_ndt45.svg',
  bp: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
};

// NO FAKE PLAYERS - playerCount: 0 = Real, shows "No players yet"
const FALLBACK_ARENAS = [
  { id: "MEGA1", name: "🌍 Mega K5 Arena", stake: 5, playerCount: 0, max: 200, prize: "K70", status: "WAITING", details: "Winner K70. 10% fee + 16% tax on fee. 70% / 30% split.", rules: "10 min rapid, 2 pts win, 1 draw, 4 for 3-win streak." },
  { id: "PRO10", name: "🔥 Pro K10 Arena", stake: 10, playerCount: 0, max: 100, prize: "K140", status: "WAITING", details: "Winner K140.", rules: "10 min rapid." },
  { id: "VIP50", name: "👑 VIP K50 Arena", stake: 50, playerCount: 0, max: 50, prize: "K700", status: "WAITING", details: "Winner K700.", rules: "15 min rapid." },
  { id: "FREE1", name: "🎁 Free Practice", stake: 0, playerCount: 0, max: 200, prize: "K0", status: "WAITING", details: "Free practice.", rules: "No prize, just points." },
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
  const [tournaments, setTournaments] = useState(FALLBACK_ARENAS);
  const [courses, setCourses] = useState(FALLBACK_COURSES);
  const [arena, setArena] = useState(null);
  const [points, setPoints] = useState(43);
  const [games, setGames] = useState(18);
  const [streak, setStreak] = useState(2);
  const [room, setRoom] = useState('123456');
  const [openCourse, setOpenCourse] = useState(null);

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

  useEffect(() => {
    fetch('/api/tournaments').then(r => r.json()).then(d => { if (d.tournaments?.length) setTournaments(d.tournaments); }).catch(()=>{});
    fetch('/api/courses').then(r => r.json()).then(d => { if (d.courses?.length) setCourses(d.courses); }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!gameActive || !hasMoved) return;
    timerRef.current = setInterval(() => {
      const g = new Chess(fen);
      if (g.turn() === 'w') setWhiteTime(t => Math.max(0, t - 1));
      else setBlackTime(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameActive, hasMoved, fen]);

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
    if (colour === 'w') {
      setMsg(`You are WHITE - ${setupLevel} - ${setupTime / 60} min - Your move first, clock starts after your move`);
    } else {
      setMsg(`You are BLACK - Computer is White, computer moves first...`);
      setTimeout(() => {
        setHasMoved(true);
        setGameActive(true);
        makeComputerMove(g.fen());
      }, 800);
    }
  }

  function onSquareClick(sq) {
    const game = new Chess(fen);
    if (game.turn() !== playerColour) { setMsg('Wait - Computer thinking...'); return; }
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
          <div key={sq} onClick={() => onSquareClick(sq)} style={{ width: 40, height: 40, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
            {ci === 0 && <span style={{ position: 'absolute', top: 1, left: 2, fontSize: 9, fontWeight: 'bold', color: isDark ? '#eeeed2' : '#769656', zIndex: 2 }}>{r}</span>}
            {ri === 7 && <span style={{ position: 'absolute', bottom: 1, right: 2, fontSize: 9, fontWeight: 'bold', color: isDark ? '#eeeed2' : '#769656', zIndex: 2 }}>{file}</span>}
            {piece && <img src={PIECE_IMG[piece.color + piece.type]} alt={sq} style={{ width: 34, height: 34, pointerEvents: 'none', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }} draggable={false} />}
          </div>
        );
      }
      rows.push(<div key={r} style={{ display: 'flex', justifyContent: 'center' }}>{cols}</div>);
    }
    return <div style={{ border: '3px solid #333', width: 320, margin: '0 auto', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>{rows}</div>;
  }

  function BoardWithClocks() {
    const turn = new Chess(fen).turn();
    const youAreWhite = playerColour === 'w';
    const topLabel = youAreWhite ? '⬛ Black • Computer' : '⬜ White • Computer';
    const topTime = youAreWhite ? blackTime : whiteTime;
    const bottomLabel = youAreWhite ? `⬜ White - You (${user.username})` : `⬛ Black - You (${user.username})`;
    const bottomTime = youAreWhite ? whiteTime : blackTime;
    const topIsTurn = (youAreWhite && turn === 'b') || (!youAreWhite && turn === 'w');
    const bottomIsTurn = (youAreWhite && turn === 'w') || (!youAreWhite && turn === 'b');
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: youAreWhite ? '#111' : '#fff', color: youAreWhite ? '#fff' : '#000', padding: '10px 14px', borderRadius: 10, marginBottom: 8, border: topIsTurn && hasMoved ? '2px solid #facc15' : '2px solid #333' }}>
          <span>{topLabel}</span>
          <span style={{ fontSize: 22, fontWeight: 'bold', fontFamily: 'monospace' }}>⏱ {formatTime(topTime)}</span>
        </div>
        {renderBoard()}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: youAreWhite ? '#fff' : '#111', color: youAreWhite ? '#000' : '#fff', padding: '10px 14px', borderRadius: 10, marginTop: 8, border: bottomIsTurn && hasMoved ? '2px solid #22c55e' : '2px solid #333' }}>
          <span>{bottomLabel}</span>
          <span style={{ fontSize: 22, fontWeight: 'bold', fontFamily: 'monospace' }}>⏱ {formatTime(bottomTime)}</span>
        </div>
        <p style={{ fontSize: 12, opacity: 0.8 }}>🟡 Yellow = Last Move • 🟢 Green = Selected • {hasMoved ? 'Clock running' : '⏸ Clock paused'}</p>
        <p style={{ fontSize: 13, fontWeight: 'bold', color: '#facc15' }}>You are {youAreWhite ? 'WHITE - White pieces at bottom' : 'BLACK - Black pieces at bottom'}</p>
      </div>
    );
  }

  async function joinArena(t) {
    const r = await fetch('/api/pay/join-arena', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username, tournamentId: t.id, stake: t.stake }) });
    const d = await r.json();
    if (d.error) { alert(d.error); return; }
    setBalance(d.balance);
    const ar = await fetch('/api/arena/' + t.id).then(x => x.json()).catch(() => ({ arena: t }));
    setArena({ ...(ar.arena || t), pot: ar.pot || t.stake * t.playerCount, winnerPrize: ar.winnerPrize || 0, secondPrize: ar.secondPrize || 0, players: ar.players || t.playerCount });
    setRoom('ROOM-' + Math.floor(Math.random()*9000+1000));
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

  if (view === 'home') return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 12, fontFamily: 'sans-serif' }}>
      {/* SMALL WALLET HEADER */}
      <div style={{ background: '#1e293b', padding: 10, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, lineHeight: 1.3 }}>
            👤 <b>{user.name}</b> • 1200 • Online<br/>
            🔥 {points} pts • {games} games • Streak: {streak}
          </div>
          <button onClick={() => setView('wallet')} style={{ background: '#000', padding: '6px 10px', borderRadius: 20, border: '1px solid #facc15', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            💰 K{balance} <span style={{ background: '#22c55e', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>Wallet</span>
          </button>
        </div>
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>Min Bet K5 • AUTO STAKES + AUTO REFUND 5 MINS • 🎲 Room: {room} • 🏆 You won! +4 pts</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={() => { setView('computer'); setShowSetup(true); }} style={{ flex: 1, padding: 12, background: '#7c3aed', color: '#fff', border: 0, borderRadius: 12, fontWeight: 'bold', fontSize: 14 }}>🤖 Play vs Computer</button>
        <button onClick={() => setView('courses')} style={{ flex: 1, padding: 12, background: '#0ea5e9', color: '#fff', border: 0, borderRadius: 12, fontWeight: 'bold', fontSize: 14 }}>📚 Chess Courses</button>
      </div>
      <div style={{ background: '#1e293b', padding: 16, borderRadius: 16, marginTop: 12 }}>
        <h2 style={{ fontSize: 20, margin: '0 0 8px 0' }}>♟️ Play Now — Auto Stake K5</h2>
        <p style={{ margin: '4px 0' }}>Room {room} vs</p><p style={{ margin: '4px 0' }}>Score: {points} pts • Streak: {streak}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => reportResult('win')} style={{ flex: 1, padding: 10, background: '#22c55e', border: 0, borderRadius: 10 }}>🏆 I Won</button>
          <button onClick={() => reportResult('draw')} style={{ flex: 1, padding: 10, background: '#334155', color: '#fff', border: 0, borderRadius: 10 }}>💛 Draw</button>
          <button onClick={() => reportResult('loss')} style={{ flex: 1, padding: 10, background: '#ef4444', border: 0, borderRadius: 10 }}>😞 I Lost</button>
        </div>
        <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13 }}>🔑 Join by Room Code</p>
      </div>
      <h3 style={{ marginTop: 16, fontSize: 16 }}>🏆 ARENAS — Tap to Join & See Details</h3>
      {tournaments.map(t => (
        <div key={t.id} style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 10, border: '1px solid #facc15' }}>
          <b>{t.name}</b><br/><span style={{ fontSize: 13 }}>Stake: K{t.stake} • {t.playerCount === 0 ? '👥 No players yet - Be first to join' : `👥 ${t.playerCount} real players`} • Prize: {t.prize} • {t.status}</span>
          <button onClick={() => joinArena(t)} style={{ display: 'block', width: '100%', marginTop: 10, padding: 11, background: '#22c55e', border: 0, borderRadius: 10, fontWeight: 'bold' }}>Join K{t.stake} - See Arena Details →</button>
        </div>
      ))}
      <p style={{ textAlign: 'center', opacity: 0.7, fontSize: 12 }}>Zed Gambit • Auto Stakes K5 • Auto Refund 5 Mins if No Opponent • 🏆 70% • 🥈 30% • Made in Zambia 🇿🇲</p>
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
            <button key={l} onClick={() => setSetupLevel(l)} style={{ padding: '12px 18px', borderRadius: 20, border: setupLevel === l ? '3px solid #facc15' : '1px solid #555', background: setupLevel === l ? '#facc15' : '#334155', color: setupLevel === l ? '#000' : '#fff', fontWeight: 'bold' }}>
              {l === 'Easy' ? '😊 Easy' : l === 'Medium' ? '😐 Medium' : '🔥 Hard'}
            </button>
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
          {[
            { label: '⬜ White', val: 'White' },
            { label: '⬛ Black', val: 'Black' },
            { label: '🎲 Random', val: 'Random' },
          ].map(c => (
            <button key={c.val} onClick={() => setSetupColour(c.val)} style={{ padding: '14px 18px', borderRadius: 12, border: setupColour === c.val ? '3px solid #facc15' : '1px solid #555', background: setupColour === c.val ? '#facc15' : '#334155', color: setupColour === c.val ? '#000' : '#fff', fontWeight: 'bold', fontSize: 16 }}>{c.label}</button>
          ))}
        </div>
        <p style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>{setupColour === 'Random' ? '🎲 Coin flip - 50% White, 50% Black. Board will flip if you get Black.' : setupColour === 'Black' ? 'You will be Black at bottom, Computer moves first.' : 'You will be White at bottom, you move first.'}</p>
        <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginTop: 16 }}>
          <p>You chose: <b>{setupLevel}</b> • <b>{setupTime / 60} min</b> • <b>{setupColour}</b></p>
          <p style={{ fontSize: 13, opacity: 0.8 }}>Clock will NOT start until first move is played.</p>
        </div>
        <button onClick={startNewGame} style={{ width: '100%', padding: 16, background: '#22c55e', border: 0, borderRadius: 12, marginTop: 20, fontWeight: 'bold', fontSize: 16 }}>▶️ Start Game → Open Board</button>
      </div>
    );
    return (
      <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 16, textAlign: 'center' }}>
        <button onClick={() => { setView('home'); setShowSetup(true); }} style={{ float: 'left' }}>← Back</button>
        <button onClick={() => setShowSetup(true)} style={{ float: 'right', padding: '6px 12px', background: '#facc15', border: 0, borderRadius: 8 }}>⚙️ Change Setup</button>
        <h2>🤖 Play vs Computer</h2>
        <p>Level: <b>{level}</b> • Time: <b>{setupTime / 60} min</b> • You are <b>{playerColour === 'w' ? 'WHITE' : 'BLACK'}</b><br/>{hasMoved ? msg : '⏸ Clock paused - Play first move to start clock'}</p>
        <BoardWithClocks />
        <button onClick={startNewGame} style={{ padding: 12, background: '#22c55e', border: 0, borderRadius: 10, marginTop: 12 }}>🔄 New Game</button>
        <button onClick={() => reportResult('win')} style={{ padding: 12, background: '#facc15', border: 0, borderRadius: 10, marginLeft: 8 }}>I Beat Computer 🏆</button>
        {lastMove && <p>Last Move: <b style={{ background: '#facc15', color: '#000', padding: '2px 8px', borderRadius: 6 }}>{lastMove.from} → {lastMove.to}</b></p>}
      </div>
    );
  }

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
      <h3 style={{ textAlign: 'center' }}>♟️ Arena Board</h3>
      <div style={{ textAlign: 'center' }}><BoardWithClocks /><button onClick={startNewGame} style={{ padding: 12, background: '#22c55e', border: 0, borderRadius: 10, marginTop: 12 }}>▶️ Start Arena Game</button></div>
    </div>
  );

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
              {(TRAINING[c.id] || [{ q: 'Lesson coming soon for ' + c.title, answer: 'Check back soon' }]).map((l, i) => (
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
      <button onClick={async () => { const r = await fetch('/api/pay/deposit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username, amount: 10 }) }); const d = await r.json(); setBalance(d.balance); alert('Deposited K10'); }} style={{ padding: 14, background: '#22c55e', border: 0, borderRadius: 10 }}>Deposit K10 (Demo)</button>
    </div>
  );
  return null;
}


