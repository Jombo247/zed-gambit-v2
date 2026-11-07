
import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';

const FALLBACK_ARENAS = [
  { id: "MEGA1", name: "🌍 Mega K5 Arena", stake: 5, playerCount: 12, max: 200, prize: "K70", status: "LIVE", details: "Winner K70. 10% fee + 16% tax on fee. 70% / 30% split.", rules: "10 min rapid, 2 pts win, 1 draw, 4 for 3-win streak." },
  { id: "PRO10", name: "🔥 Pro K10 Arena", stake: 10, playerCount: 8, max: 100, prize: "K140", status: "LIVE", details: "Winner K140.", rules: "10 min rapid." },
  { id: "VIP50", name: "👑 VIP K50 Arena", stake: 50, playerCount: 3, max: 50, prize: "K700", status: "LIVE", details: "Winner K700.", rules: "15 min rapid." },
  { id: "FREE1", name: "🎁 Free Practice", stake: 0, playerCount: 25, max: 200, prize: "K0", status: "LIVE", details: "Free practice.", rules: "No prize, just points." },
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

  // Chess
  const [fen, setFen] = useState(new Chess().fen());
  const [selected, setSelected] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [msg, setMsg] = useState('Choose Level & Time to start');
  const [level, setLevel] = useState('Medium');
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [gameActive, setGameActive] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const [setupLevel, setSetupLevel] = useState('Medium');
  const [setupTime, setSetupTime] = useState(600);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch('/api/tournaments').then(r => r.json()).then(d => { if (d.tournaments?.length) setTournaments(d.tournaments); }).catch(()=>{});
    fetch('/api/courses').then(r => r.json()).then(d => { if (d.courses?.length) setCourses(d.courses); }).catch(()=>{});
  }, []);

  // Clock - only ticks if gameActive AND hasMoved
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

  function startNewGame() {
    const g = new Chess();
    setFen(g.fen());
    setLastMove(null);
    setSelected(null);
    setLevel(setupLevel);
    setWhiteTime(setupTime);
    setBlackTime(setupTime);
    setHasMoved(false);
    setGameActive(false);
    setMsg(`Ready - ${setupLevel} - ${setupTime / 60} min - White to move first, clock starts after your move`);
    setShowSetup(false);
  }

  function pickComputerMove(game) {
    const moves = game.moves({ verbose: true });
    if (!moves.length) return null;
    if (level === 'Easy') return moves[Math.floor(Math.random() * moves.length)];
    if (level === 'Medium') {
      const captures = moves.filter(m => m.captured);
      if (captures.length && Math.random() > 0.3) return captures[Math.floor(Math.random() * captures.length)];
      return moves[Math.floor(Math.random() * moves.length)];
    }
    const scored = moves.map(m => {
      let s = Math.random() * 2;
      if (m.captured) s += 5;
      if (m.san.includes('+')) s += 3;
      return { m, s };
    });
    scored.sort((a, b) => b.s - a.s);
    return scored[0].m;
  }

  function onSquareClick(sq) {
    if (selected === sq) { setSelected(null); return; }
    if (selected) {
      try {
        const game = new Chess(fen);
        const move = game.move({ from: selected, to: sq, promotion: 'q' });
        if (move) {
          // START CLOCK ONLY AFTER WHITE FIRST MOVE
          if (!hasMoved) { setHasMoved(true); setGameActive(true); }
          setFen(game.fen());
          setLastMove({ from: move.from, to: move.to });
          setSelected(null);
          setMsg(`You: ${move.san} - Computer thinking...`);
          setTimeout(() => {
            const g2 = new Chess(game.fen());
            const comp = pickComputerMove(g2);
            if (comp) {
              g2.move(comp);
              setFen(g2.fen());
              setLastMove({ from: comp.from, to: comp.to });
              setMsg(`Computer: ${comp.san} - Your move`);
            } else { setMsg('Game Over!'); setGameActive(false); }
          }, 500);
          return;
        }
      } catch {}
    }
    const game = new Chess(fen);
    const piece = game.get(sq);
    if (piece && piece.color === game.turn()) setSelected(sq);
  }

  function renderBoard() {
    const game = new Chess(fen);
    const files = ['a','b','c','d','e','f','g','h'];
    const symbols = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚', P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔' };
    const rows = [];
    for (let r = 8; r >= 1; r--) {
      const cols = [];
      for (let c = 0; c < 8; c++) {
        const sq = files[c] + r;
        const piece = game.get(sq);
        const isDark = (r + c) % 2 === 0;
        const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
        const isSel = selected === sq;
        let bg = isDark ? '#769656' : '#eeeed2';
        if (isLast) bg = '#facc15';
        if (isSel) bg = '#22c55e';
        let sym = '';
        if (piece) sym = symbols[piece.color === 'w' ? piece.type.toUpperCase() : piece.type];
        const isWhitePiece = piece?.color === 'w';
        cols.push(
          <div key={sq} onClick={() => onSquareClick(sq)} style={{ width: 42, height: 42, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, cursor: 'pointer', position: 'relative', color: isWhitePiece ? '#FFFFFF' : '#000000', WebkitTextStroke: isWhitePiece ? '1.5px #000' : '0.5px #fff', textShadow: isWhitePiece ? '0 0 2px #000, 0 1px 1px #000' : '0 1px 1px #fff', fontWeight: 'bold' }}>
            {c === 0 && <span style={{ position: 'absolute', top: 1, left: 2, fontSize: 9, fontWeight: 'bold', color: isDark ? '#eeeed2' : '#769656', WebkitTextStroke: '0px', textShadow: 'none' }}>{r}</span>}
            {r === 1 && <span style={{ position: 'absolute', bottom: 1, right: 2, fontSize: 9, fontWeight: 'bold', color: isDark ? '#eeeed2' : '#769656', WebkitTextStroke: '0px', textShadow: 'none' }}>{files[c]}</span>}
            {sym}
          </div>
        );
      }
      rows.push(<div key={r} style={{ display: 'flex', justifyContent: 'center' }}>{cols}</div>);
    }
    return <div style={{ border: '3px solid #333', width: 336, margin: '0 auto', background: '#fff' }}>{rows}</div>;
  }

  function BoardWithClocks() {
    const turn = new Chess(fen).turn();
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '10px 14px', borderRadius: 10, marginBottom: 8, border: turn === 'b' && hasMoved ? '2px solid #facc15' : '2px solid #333' }}>
          <span>⬛ Black • {level}</span>
          <span style={{ fontSize: 22, fontWeight: 'bold', fontFamily: 'monospace', color: blackTime < 60 ? '#ef4444' : '#fff' }}>⏱ {formatTime(blackTime)}</span>
        </div>
        {renderBoard()}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', color: '#000', padding: '10px 14px', borderRadius: 10, marginTop: 8, border: turn === 'w' && hasMoved ? '2px solid #22c55e' : '2px solid #333' }}>
          <span>⬜ White - You ({user.username})</span>
          <span style={{ fontSize: 22, fontWeight: 'bold', fontFamily: 'monospace', color: whiteTime < 60 ? '#ef4444' : '#000' }}>⏱ {formatTime(whiteTime)}</span>
        </div>
        <p style={{ fontSize: 12, opacity: 0.8 }}>🟡 Yellow = Last Move • 🟢 Green = Selected • {hasMoved ? 'Clock running' : '⏸ Clock paused - play first move to start'}</p>
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
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 16, fontFamily: 'sans-serif' }}>
      <div style={{ background: '#1e293b', padding: 16, borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>👤 {user.name}<br/>1200 • Online<br/>🔥 Endless: {points} pts • {games} games • Streak: {streak}<br/>Min Bet K5 • AUTO STAKES + AUTO REFUND 5 MINS</div>
          <div style={{ background: '#000', padding: '8px 12px', borderRadius: 20, border: '2px solid #facc15' }}>💰 K{balance}.00 <button onClick={() => setView('wallet')} style={{ background: '#22c55e', border: 0, padding: '6px 12px', borderRadius: 8, color: '#fff' }}>Wallet</button></div>
        </div>
        <div>📣 🏆 You won! +4 pts<br/>🎲 Room: {room}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={() => { setView('computer'); setShowSetup(true); }} style={{ flex: 1, padding: 14, background: '#7c3aed', color: '#fff', border: 0, borderRadius: 12, fontWeight: 'bold' }}>🤖 Play vs Computer</button>
        <button onClick={() => setView('courses')} style={{ flex: 1, padding: 14, background: '#0ea5e9', color: '#fff', border: 0, borderRadius: 12, fontWeight: 'bold' }}>📚 Chess Courses</button>
      </div>
      <div style={{ background: '#1e293b', padding: 20, borderRadius: 16, marginTop: 16 }}>
        <h2>♟️ Play Now — Auto Stake K5</h2>
        <p>Room {room} vs</p><p>Score: {points} pts • Streak: {streak}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => reportResult('win')} style={{ flex: 1, padding: 12, background: '#22c55e', border: 0, borderRadius: 10 }}>🏆 I Won</button>
          <button onClick={() => reportResult('draw')} style={{ flex: 1, padding: 12, background: '#334155', color: '#fff', border: 0, borderRadius: 10 }}>💛 Draw</button>
          <button onClick={() => reportResult('loss')} style={{ flex: 1, padding: 12, background: '#ef4444', border: 0, borderRadius: 10 }}>😞 I Lost</button>
        </div>
        <p style={{ textAlign: 'center', marginTop: 12 }}>🔑 Join by Room Code</p>
      </div>
      <h3 style={{ marginTop: 20 }}>🏆 ARENAS — Tap to Join & See Details ({tournaments.length} Arenas)</h3>
      {tournaments.map(t => (
        <div key={t.id} style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 10, border: '1px solid #facc15' }}>
          <b>{t.name}</b><br/>Stake: K{t.stake} • Players: {t.playerCount}/{t.max} • Prize: {t.prize} • {t.status}
          <button onClick={() => joinArena(t)} style={{ display: 'block', width: '100%', marginTop: 10, padding: 12, background: '#22c55e', border: 0, borderRadius: 10, fontWeight: 'bold' }}>Join K{t.stake} - See Arena Details →</button>
        </div>
      ))}
      <p style={{ textAlign: 'center', opacity: 0.7 }}>Zed Gambit • Auto Stakes K5 • Auto Refund 5 Mins if No Opponent • 🏆 70% • 🥈 30% • Made in Zambia 🇿🇲</p>
    </div>
  );

  if (view === 'computer') {
    if (showSetup) return (
      <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 20, textAlign: 'center' }}>
        <button onClick={() => setView('home')} style={{ float: 'left' }}>← Back</button>
        <h2>🤖 Play vs Computer</h2>
        <p>Choose Level & Time First</p>
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
        <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginTop: 20 }}>
          <p>You chose: <b>{setupLevel}</b> • <b>{setupTime / 60} min</b> each</p>
          <p style={{ fontSize: 13, opacity: 0.8 }}>Clock will NOT start until White plays first move.</p>
        </div>
        <button onClick={startNewGame} style={{ width: '100%', padding: 16, background: '#22c55e', border: 0, borderRadius: 12, marginTop: 20, fontWeight: 'bold', fontSize: 16 }}>▶️ Start Game → Open Board</button>
      </div>
    );
    return (
      <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 16, textAlign: 'center' }}>
        <button onClick={() => { setView('home'); setShowSetup(true); }} style={{ float: 'left' }}>← Back</button>
        <button onClick={() => setShowSetup(true)} style={{ float: 'right', padding: '6px 12px', background: '#facc15', border: 0, borderRadius: 8 }}>⚙️ Change Level / Time</button>
        <h2>🤖 Play vs Computer</h2>
        <p>Level: <b>{level}</b> • Time: <b>{setupTime / 60} min</b> • {hasMoved ? msg : '⏸ Clock paused - Play first move to start clock'}</p>
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
      <h3 style={{ textAlign: 'center' }}>♟️ Arena Board — With Clock + Last Move Hint</h3>
      <div style={{ textAlign: 'center' }}>
        <BoardWithClocks />
        <button onClick={startNewGame} style={{ padding: 12, background: '#22c55e', border: 0, borderRadius: 10, marginTop: 12 }}>▶️ Start Arena Game</button>
      </div>
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


