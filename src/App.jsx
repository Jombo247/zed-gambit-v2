
import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';

const ARENAS = [
  { id: 'bullet1', name: 'Bullet 1+0 • Rated', type: 'Bullet', time: '1+0', stake: 5, prize: 70 },
  { id: 'blitz3', name: 'Blitz 3+2 • Rated', type: 'Blitz', time: '3+2', stake: 10, prize: 140 },
  { id: 'blitz5', name: 'Blitz 5+0 • Rated', type: 'Blitz', time: '5+0', stake: 10, prize: 140 },
  { id: 'rapid10', name: 'Rapid 10+0 • Rated', type: 'Rapid', time: '10+0', stake: 20, prize: 280 },
];

export default function App() {
  const [view, setView] = useState('lobby');
  const [arena, setArena] = useState(null);
  const [room, setRoom] = useState('');
  const [game, setGame] = useState(new Chess());
  const [selected, setSelected] = useState(null);
  const [whiteTime, setWhiteTime] = useState(60);
  const [blackTime, setBlackTime] = useState(60);
  const [resultMsg, setResultMsg] = useState('');
  const [balance, setBalance] = useState(100);

  // AUTO REPORT TO D1 - NO BUTTON
  const autoReport = async (result, winner) => {
    setResultMsg(result === 'draw' ? 'Draw! Pot split automatically.' : `Game Over! ${winner} wins - Pot auto-paid K7 / K3`);
    try {
      await fetch('/api/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, winner, result })
      });
    } catch {}
  };

  // AUTOMATIC GAME OVER CHECK - RUNS AFTER EVERY MOVE
  const checkAutoWin = (g) => {
    if (g.isCheckmate()) {
      const winner = g.turn() === 'w' ? 'Black' : 'White';
      autoReport('win', winner);
      return true;
    }
    if (g.isDraw() || g.isStalemate() || g.isThreefoldRepetition()) {
      autoReport('draw', 'Draw');
      return true;
    }
    return false;
  };

  // CLOCK - AUTOMATIC TIMEOUT WIN
  useEffect(() => {
    if (view !== 'game') return;
    const t = setInterval(() => {
      if (game.turn() === 'w') {
        setWhiteTime(v => {
          if (v <= 1) { clearInterval(t); autoReport('win', 'Black'); return 0; }
          return v - 1;
        });
      } else {
        setBlackTime(v => {
          if (v <= 1) { clearInterval(t); autoReport('win', 'White'); return 0; }
          return v - 1;
        });
      }
    }, 1000);
    return () => clearInterval(t);
  }, [view, game]);

  const joinArena = (a) => {
    setArena(a);
    setRoom('ROOM-' + Math.floor(1000 + Math.random() * 9000));
    setGame(new Chess());
    setSelected(null);
    setResultMsg('');
    const mins = parseInt(a.time.split('+')[0]);
    setWhiteTime(mins * 60);
    setBlackTime(mins * 60);
    setView('game');
  };

  const onSquareClick = (sq) => {
    if (resultMsg) return;
    const g = new Chess(game.fen());
    if (!selected) {
      const piece = g.get(sq);
      if (piece && piece.color === g.turn()) setSelected(sq);
      return;
    }
    try {
      const move = g.move({ from: selected, to: sq, promotion: 'q' });
      if (move) {
        setGame(g);
        setSelected(null);
        checkAutoWin(g); // AUTOMATIC - NO CLICK
      } else setSelected(null);
    } catch { setSelected(null); }
  };

  const board = game.board();

  if (view === 'game' && arena) {
    return (
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto', fontFamily: 'sans-serif', background: '#0f172a', color: 'white', minHeight: '100vh' }}>
        <button onClick={() => setView('lobby')} style={{ background: '#334155', color: 'white', border: 0, padding: '8px 12px', borderRadius: 8 }}>← Back</button>
        <h2>{arena.name}</h2>
        <p>Your Room: {room} • Pot: K{arena.stake * 2} • Winner: K{Math.round(arena.prize * 0.7)} • 2nd: K{Math.round(arena.prize * 0.3)}</p>
        <p>Players: 1 / 200 • Balance: K{balance}</p>
        <p>White: {Math.floor(whiteTime/60)}:{String(whiteTime%60).padStart(2,'0')} | Black: {Math.floor(blackTime/60)}:{String(blackTime%60).padStart(2,'0')}</p>
        <p>Turn: {game.turn() === 'w' ? 'White' : 'Black'}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', width: '100%', aspectRatio: '1', border: '2px solid #333' }}>
          {board.flatMap((row, r) => row.map((cell, c) => {
            const sq = 'abcdefgh'[c] + (8 - r);
            const isDark = (r + c) % 2 === 1;
            return (
              <div key={sq} onClick={() => onSquareClick(sq)} style={{ background: selected === sq ? '#facc15' : isDark ? '#78350f' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, cursor: 'pointer' }}>
                {cell ? (cell.type === 'p' ? '♟' : cell.type === 'n' ? '♞' : cell.type === 'b' ? '♝' : cell.type === 'r' ? '♜' : cell.type === 'q' ? '♛' : '♚') : ''}
              </div>
            );
          }))}
        </div>

        {resultMsg ? (
          <div style={{ background: '#14532d', padding: 16, borderRadius: 12, marginTop: 16, textAlign: 'center' }}>
            <h3>✅ {resultMsg}</h3>
            <p>Result saved automatically. No button needed.</p>
            <button onClick={() => setView('lobby')} style={{ background: 'white', padding: '10px 16px', borderRadius: 8, border: 0 }}>Back to Lobby</button>
          </div>
        ) : (
          <button onClick={() => autoReport('resign', game.turn() === 'w' ? 'Black' : 'White')} style={{ background: '#dc2626', color: 'white', padding: '12px', width: '100%', marginTop: 16, borderRadius: 8, border: 0 }}>Resign — Opponent Wins Automatically</button>
        )}
        <p style={{ fontSize: 12, opacity: 0.7 }}>Rules: {arena.time}, no cheating. Checkmate / Timeout / Resign = Auto Win.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto', fontFamily: 'sans-serif', background: '#0f172a', color: 'white', minHeight: '100vh' }}>
      <h1>♞ ZED GAMBIT</h1>
      <p>Balance: K{balance}</p>
      <h2>RATED ARENAS</h2>
      {ARENAS.map(a => (
        <div key={a.id} style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12 }}>
          <b>{a.name}</b><br/>
          <span>Stake: K{a.stake} • Prize: K{a.prize}</span><br/>
          <span style={{ fontSize: 12, opacity: 0.7 }}>No players yet - Be first to join</span><br/>
          <button onClick={() => joinArena(a)} style={{ background: '#22c55e', padding: '10px 16px', borderRadius: 8, border: 0, marginTop: 8, width: '100%' }}>Join Arena - K{a.stake}</button>
        </div>
      ))}
      <p style={{ fontSize: 12, opacity: 0.6 }}>Wins are automatic. No "I Won" button.</p>
    </div>
  );
}



