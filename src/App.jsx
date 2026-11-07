
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

  // Chess State - Shared for Computer + Arena
  const [fen, setFen] = useState(new Chess().fen());
  const [selected, setSelected] = useState(null);
  const [lastMove, setLastMove] = useState(null); // {from, to}
  const [msg, setMsg] = useState('Your move - You are White');
  const [level, setLevel] = useState('Easy'); // Easy | Medium | Hard
  const [whiteTime, setWhiteTime] = useState(600); // 10:00
  const [blackTime, setBlackTime] = useState(600);
  const [gameActive, setGameActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch('/api/tournaments').then(r => r.json()).then(d => { if (d.tournaments?.length) setTournaments(d.tournaments); }).catch(()=>{});
    fetch('/api/courses').then(r => r.json()).then(d => { if (d.courses?.length) setCourses(d.courses); }).catch(()=>{});
  }, []);

  // Chess Clock - ticks only for player to move
  useEffect(() => {
    if (!gameActive) return;
    timerRef.current = setInterval(() => {
      const g = new Chess(fen);
      if (g.turn() === 'w') setWhiteTime(t => Math.max(0, t - 1));
      else setBlackTime(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameActive, fen]);

  useEffect(() => {
    if (whiteTime === 0) { setMsg('⏰ Time up! Black wins on time'); setGameActive(false); }
    if (blackTime === 0) { setMsg('⏰ Time up! White wins on time'); setGameActive(false); }
  }, [whiteTime, blackTime]);

  function startNewGame() {
    const g = new Chess();
    setFen(g.fen());
    setLastMove(null);
    setSelected(null);
    setWhiteTime(level === 'Hard' ? 300 : level === 'Medium' ? 600 : 900);
    setBlackTime(level === 'Hard' ? 300 : level === 'Medium' ? 600 : 900);
    setGameActive(true);
    setMsg(`New game - ${level} - Your move, White`);
  }

  function pickComputerMove(game) {
    const moves = game.moves({ verbose: true });
    if (!moves.length) return null;
    if (level === 'Easy') return moves[Math.floor(Math.random() * moves.length)];
    if (level === 'Medium') {
      // Prefer captures, then checks
      const captures = moves.filter(m => m.captured);
      if (captures.length && Math.random() > 0.3) return captures[Math.floor(Math.random() * captures.length)];
      return moves[Math.floor(Math.random() * moves.length)];
    }
    // Hard - Prefer captures + checks + centre
    const scored = moves.map(m => {
      let s = Math.random() * 2;
      if (m.captured) s += 5;
      if (m.san.includes('+')) s += 3;
      if (['e4','d4','e5','d5','Nf3','Nc3','Nf6','Nc6'].includes(m.san)) s += 2;
      return { m, s };
    });
    scored.sort((a,b) => b.s - a.s);
    return scored[0].m;
  }

  function onSquareClick(sq) {
    if (!gameActive) { setMsg('Tap New Game to start clock'); return; }
    if (selected === sq) { setSelected(null); return; }
    if (selected) {
      try {
        const game = new Chess(fen);
        const move = game.move({ from: selected, to: sq, promotion: 'q' });
        if (move) {
          setFen(game.fen());
          setLastMove({ from: move.from, to: move.to });
          setSelected(null);
          setMsg(`You: ${move.san} • Computer thinking... (${level})`);
          setTimeout(() => {
            const g2 = new Chess(game.fen());
            const comp = pickComputerMove(g2);
            if (comp) {
              g2.move(comp);
              setFen(g2.fen());
              setLastMove({ from: comp.from, to: comp.to });
              setMsg(`Computer: ${comp.san} • Your move`);
            } else {
              setMsg('Game Over!'); setGameActive(false);
            }
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
    // Row 8 at top, Row 1 at bottom - FIDE rules, White at bottom
    for (let r = 8; r >= 1; r--) {
      const cols = [];
      // Rank number on left
      cols.push(<div key={'num'+r} style={{ width: 18, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', color: '#facc15' }}>{r}</div>);
      for (let c = 0; c < 8; c++) {
        const sq = files[c] + r;
        const piece = game.get(sq);
        const isDark = (r + c) % 2 === 0;
        const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
        const isSel = selected === sq;
        let bg = isDark ? '#769656' : '#eeeed2';
        if (isLast) bg = '#facc15'; // HINT LAST MOVE - yellow
        if (isSel) bg = '#22c55e';
        let sym = '';
        if (piece) sym = symbols[piece.color === 'w' ? piece.type.toUpperCase() : piece.type];
        cols.push(
          <div key={sq} onClick={() => onSquareClick(sq)} style={{ width: 40, height: 42, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, cursor: 'pointer', color: piece?.color === 'w' ? '#fff' : '#111', textShadow: '0 1px 2px #000', border: isLast ? '2px solid #eab308' : 'none' }}>
            {sym}
          </div>
        );
      }
      rows.push(<div key={r} style={{ display: 'flex', justifyContent: 'center' }}>{cols}</div>);
    }
    // File letters a-h at bottom
    const fileRow = [<div key="corner" style={{ width: 18 }} />];
    files.forEach(f => fileRow.push(<div key={f} style={{ width: 40, textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#facc15' }}>{f}</div>));
    rows.push(<div key="files" style={{ display: 'flex', justifyContent: 'center' }}>{fileRow}</div>);
    return <div style={{ border: '3px solid #333', background: '#0f172a', padding: 4, width: 360, margin: '0 auto' }}>{rows}</div>;
  }

  function BoardWithClocks() {
    return (
      <div>
        {/* BLACK CLOCK - TOP */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '10px 14px', borderRadius: 10, marginBottom: 8, border: new Chess(fen).turn() === 'b' ? '2px solid #facc15' : '2px solid #333' }}>
          <span>⬛ Black {level === 'Hard' ? '• Hard' : ''}</span>
          <span style={{ fontSize: 22, fontWeight: 'bold', fontFamily: 'monospace', color: blackTime < 60 ? '#ef4444' : '#fff' }}>⏱ {formatTime(blackTime)}</span>
        </div>
        {renderBoard()}
        {/* WHITE CLOCK - BOTTOM */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', color: '#000', padding: '10px 14px', borderRadius: 10, marginTop: 8, border: new Chess(fen).turn() === 'w' ? '2px solid #22c55e' : '2px solid #333' }}>
          <span>⬜ White - You ({user.username})</span>
          <span style={{ fontSize: 22, fontWeight: 'bold', fontFamily: 'monospace', color: whiteTime < 60 ? '#ef4444' : '#000' }}>⏱ {formatTime(whiteTime)}</span>
        </div>
        <p style={{ fontSize: 12, opacity: 0.8 }}>🟡 Yellow = Last Move Hint • 🟢 Green = Selected • Clock ticks for player to move</p>
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
        <button onClick={() => { setView('computer'); startNewGame(); }} style={{ flex: 1, padding: 14, background: '#7c3aed', color: '#fff', border: 0, borderRadius: 12, fontWeight: 'bold' }}>🤖 Play vs Computer</button>
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

  if (view === 'computer') return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 16, textAlign: 'center' }}>
      <button onClick={() => setView('home')} style={{ float: 'left' }}>← Back</button>
      <h2>🤖 Play vs Computer</h2>
      {/* LEVEL SWITCH */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
        {['Easy','Medium','Hard'].map(l => (
          <button key={l} onClick={() => { setLevel(l); setTimeout(startNewGame, 50); }} style={{ padding: '10px 18px', borderRadius: 20, border: level === l ? '2px solid #facc15' : '1px solid #555', background: level === l ? '#facc15' : '#334155', color: level === l ? '#000' : '#fff', fontWeight: 'bold' }}>
            {l === 'Easy' ? '😊 Easy (15 min)' : l === 'Medium' ? '😐 Medium (10 min)' : '🔥 Hard (5 min)'}
          </button>
        ))}
      </div>
      <p>Level: <b>{level}</b> • {msg}</p>
      <BoardWithClocks />
      <button onClick={startNewGame} style={{ padding: 12, background: '#22c55e', border: 0, borderRadius: 10, marginTop: 12 }}>🔄 New Game ({level})</button>
      <button onClick={() => reportResult('win')} style={{ padding: 12, background: '#facc15', border: 0, borderRadius: 10, marginLeft: 8 }}>I Beat Computer 🏆</button>
      {lastMove && <p>Last Move Hint: <b style={{ background: '#facc15', color: '#000', padding: '2px 8px', borderRadius: 6 }}>{lastMove.from} → {lastMove.to}</b> — Yellow squares on board</p>}
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
          <button style={{ marginTop: 10, padding: 10, background: '#0ea5e9', border: 0, borderRadius: 8, color: '#fff' }}>Start Lesson →</button>
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


