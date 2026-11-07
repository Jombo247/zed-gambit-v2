
import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(900);
  const [view, setView] = useState('home'); // home | computer | arena | courses | wallet
  const [tournaments, setTournaments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [arena, setArena] = useState(null);
  const [points, setPoints] = useState(43);
  const [games, setGames] = useState(18);
  const [streak, setStreak] = useState(2);
  const [room, setRoom] = useState('123456');

  // Chess vs Computer
  const [chess, setChess] = useState(new Chess());
  const [fen, setFen] = useState(new Chess().fen());
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState('Your move - You are White');

  // Auth
  const [name, setName] = useState('Themba Ndhlovu');
  const [username, setUsername] = useState('Pazed200');
  const [email, setEmail] = useState('Thembandhlovu24@gmail.com');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [authMsg, setAuthMsg] = useState('');

  useEffect(() => {
    fetch('/api/tournaments').then(r => r.json()).then(d => setTournaments(d.tournaments || [])).catch(()=>{});
    fetch('/api/courses').then(r => r.json()).then(d => setCourses(d.courses || [])).catch(()=>{});
  }, []);

  async function register() {
    const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, username, email, password }) });
    const d = await r.json();
    setAuthMsg(d.error || d.msg || 'Created! Code is 123456');
    if (d.ok) setUser(d.user);
  }

  async function joinArena(t) {
    const r = await fetch('/api/pay/join-arena', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username || 'Pazed200', tournamentId: t.id, stake: t.stake }) });
    const d = await r.json();
    if (d.error) { alert(d.error); return; }
    setBalance(d.balance);
    // OPEN ARENA DETAILS AFTER PAYMENT
    const ar = await fetch('/api/arena/' + t.id).then(x => x.json());
    setArena({ ...ar.arena, pot: ar.pot, winnerPrize: ar.winnerPrize, secondPrize: ar.secondPrize, players: ar.players });
    setRoom('ROOM-' + Math.floor(Math.random()*9000+1000));
    setView('arena');
  }

  function onSquareClick(sq) {
    if (selected === sq) { setSelected(null); return; }
    if (selected) {
      try {
        const game = new Chess(fen);
        const move = game.move({ from: selected, to: sq, promotion: 'q' });
        if (move) {
          setFen(game.fen());
          setChess(game);
          setSelected(null);
          setMsg('You played ' + move.san + '... Computer thinking...');
          // Computer replies
          setTimeout(() => {
            const moves = game.moves({ verbose: true });
            if (moves.length === 0) { setMsg('Game Over!'); return; }
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            game.move(randomMove);
            setFen(game.fen());
            setChess(game);
            setMsg('Computer played ' + randomMove.san + ' - Your move');
            fetch('/api/play/computer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ move: move.san }) });
          }, 600);
          return;
        }
      } catch {}
    }
    // Select own piece
    const game = new Chess(fen);
    const piece = game.get(sq);
    if (piece && piece.color === game.turn()) setSelected(sq);
  }

  function renderBoard() {
    const game = new Chess(fen);
    const rows = [];
    for (let r = 8; r >= 1; r--) {
      const cols = [];
      for (let c = 0; c < 8; c++) {
        const file = 'abcdefgh'[c];
        const sq = file + r;
        const piece = game.get(sq);
        const isDark = (r + c) % 2 === 0;
        const symbols = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚', P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔' };
        let sym = '';
        if (piece) sym = symbols[piece.color === 'w' ? piece.type.toUpperCase() : piece.type];
        cols.push(
          <div key={sq} onClick={() => onSquareClick(sq)} style={{ width: 42, height: 42, background: selected === sq ? '#22c55e' : isDark ? '#769656' : '#eeeed2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, cursor: 'pointer', color: piece?.color === 'w' ? '#fff' : '#000', textShadow: '0 1px 2px #000' }}>
            {sym}
          </div>
        );
      }
      rows.push(<div key={r} style={{ display: 'flex' }}>{cols}</div>);
    }
    return <div style={{ border: '3px solid #333', width: 336, margin: '0 auto' }}>{rows}</div>;
  }

  async function reportResult(result) {
    const r = await fetch('/api/game-result', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username || 'Pazed200', name, result, streak }) });
    const d = await r.json();
    setPoints(d.points || points);
    if (result === 'win') { setStreak(streak + 1); setGames(games + 1); alert('You won! +4 pts'); }
    if (result === 'draw') { setGames(games + 1); alert('Draw +1 pt'); }
    if (result === 'win' || result === 'draw' || result === 'loss') setView('home');
  }

  // HOME SCREEN - Like your screenshot
  if (view === 'home') return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 16, fontFamily: 'sans-serif' }}>
      <div style={{ background: '#1e293b', padding: 16, borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>👤 {name}<br/>1200 • Online<br/>🕐 12:06 AM<br/>🔥 Endless: {points} pts • {games} games • Streak: {streak}<br/>Min Bet K5 • AUTO STAKES + AUTO REFUND 5 MINS</div>
          <div style={{ background: '#000', padding: '8px 12px', borderRadius: 20, border: '2px solid #facc15' }}>💰 K{balance}.00 👁️ <button onClick={() => setView('wallet')} style={{ background: '#22c55e', border: 0, padding: '6px 12px', borderRadius: 8, color: '#fff' }}>Wallet</button></div>
        </div>
        <div>📣 🏆 You won! +4 pts<br/>🎲 Room: {room}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={() => setView('computer')} style={{ flex: 1, padding: 14, background: '#7c3aed', color: '#fff', border: 0, borderRadius: 12, fontWeight: 'bold' }}>🤖 Play vs Computer</button>
        <button onClick={() => setView('courses')} style={{ flex: 1, padding: 14, background: '#0ea5e9', color: '#fff', border: 0, borderRadius: 12, fontWeight: 'bold' }}>📚 Chess Courses</button>
      </div>

      <div style={{ background: '#1e293b', padding: 20, borderRadius: 16, marginTop: 16 }}>
        <h2>♟️ Play Now — Auto Stake K5</h2>
        <p>Room {room} vs</p>
        <p>Score: {points} pts • Streak: {streak}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => reportResult('win')} style={{ flex: 1, padding: 12, background: '#22c55e', border: 0, borderRadius: 10 }}>🏆 I Won</button>
          <button onClick={() => reportResult('draw')} style={{ flex: 1, padding: 12, background: '#334155', color: '#fff', border: 0, borderRadius: 10 }}>💛 Draw</button>
          <button onClick={() => reportResult('loss')} style={{ flex: 1, padding: 12, background: '#ef4444', border: 0, borderRadius: 10 }}>😞 I Lost</button>
        </div>
        <p style={{ textAlign: 'center', marginTop: 12 }}>🔑 Join by Room Code</p>
      </div>

      <h3 style={{ marginTop: 20 }}>🏆 Arenas — Tap to Join & See Details</h3>
      {tournaments.map(t => (
        <div key={t.id} style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 10 }}>
          <b>{t.name}</b><br/>Stake: K{t.stake} • Players: {t.playerCount}/{t.max} • Prize: {t.prize}
          <button onClick={() => joinArena(t)} style={{ display: 'block', width: '100%', marginTop: 10, padding: 12, background: '#22c55e', border: 0, borderRadius: 10, fontWeight: 'bold' }}>Join K{t.stake} - See Arena Details →</button>
        </div>
      ))}
      <p style={{ textAlign: 'center', opacity: 0.7 }}>Zed Gambit • Auto Stakes K5 • Auto Refund 5 Mins if No Opponent • 🏆 70% • 🥈 30% • Made in Zambia 🇿🇲</p>
    </div>
  );

  if (view === 'computer') return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 16, textAlign: 'center' }}>
      <button onClick={() => setView('home')}>← Back</button>
      <h2>🤖 Play vs Computer</h2>
      <p>{msg}</p>
      {renderBoard()}
      <p>Tap a piece, then tap where to move it.</p>
      <button onClick={() => { const g = new Chess(); setFen(g.fen()); setMsg('New game - Your move'); }} style={{ padding: 12, background: '#22c55e', border: 0, borderRadius: 10, marginTop: 12 }}>🔄 New Game</button>
      <button onClick={() => reportResult('win')} style={{ padding: 12, background: '#facc15', border: 0, borderRadius: 10, marginLeft: 8 }}>I Beat Computer 🏆</button>
    </div>
  );

  if (view === 'arena') return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 16 }}>
      <button onClick={() => setView('home')}>← Back to Home</button>
      <h2>🏟️ {arena?.name}</h2>
      <div style={{ background: '#1e293b', padding: 16, borderRadius: 12 }}>
        <p>💰 <b>Pot: K{arena?.pot}</b></p>
        <p>🏆 Winner Prize: <b>K{arena?.winnerPrize}</b></p>
        <p>🥈 2nd Prize: <b>K{arena?.secondPrize}</b></p>
        <p>👥 Players: {arena?.players} / {arena?.max}</p>
        <p>🎲 Your Room: {room}</p>
        <p>📜 Rules: {arena?.rules || '10 min rapid, 2 pts win, 1 draw, 4 for 3-win streak'}</p>
        <p>📋 Details: {arena?.details || ''}</p>
      </div>
      <button onClick={() => setView('computer')} style={{ width: '100%', padding: 14, background: '#22c55e', border: 0, borderRadius: 12, marginTop: 16, fontWeight: 'bold' }}>♟️ Enter Board & Play Now</button>
    </div>
  );

  if (view === 'courses') return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', padding: 16 }}>
      <button onClick={() => setView('home')}>← Back</button>
      <h2>📚 Chess Courses</h2>
      {courses.length === 0 && <p>Loading courses... If empty, make sure Worker has /api/courses (I gave you new Worker).</p>}
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
      <p>Deposit K10 to test, then Join Arena.</p>
      <button onClick={async () => { const r = await fetch('/api/pay/deposit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, amount: 10 }) }); const d = await r.json(); setBalance(d.balance); alert('Deposited K10'); }} style={{ padding: 14, background: '#22c55e', border: 0, borderRadius: 10 }}>Deposit K10 (Demo)</button>
    </div>
  );

  return null;
}


