import { useState, useEffect } from 'react'
import { Chess } from 'chess.js'
const P = { K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟' }
const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
export default function ChessBoard() {
  const [game, setGame] = useState(new Chess())
  const [sel, setSel] = useState(null)
  const [mode, setMode] = useState('computer')
  const [status, setStatus] = useState('White to move')
  const [wt, setWt] = useState(600)
  const [bt, setBt] = useState(600)
  const over = game.isCheckmate() || game.isDraw() || game.isStalemate()
  useEffect(() => {
    if (over) return
    const id = setInterval(() => { if (game.turn() === 'w') setWt(t => Math.max(0, t-1)); else setBt(t => Math.max(0, t-1)) }, 1000)
    return () => clearInterval(id)
  }, [game, over])
  const reset = (m) => { const mm = m || mode; setGame(new Chess()); setSel(null); setMode(mm); setWt(600); setBt(600); setStatus(mm === 'computer' ? 'You (White) vs Computer' : 'Friend Mode - White to move') }
    if (!ms.length) return; g.move(ms[Math.floor(Math.random() * ms.length)]); setGame(new Chess(g.fen())); setStatus(g.isCheckmate() ? 'Checkmate! Computer wins' : g.isDraw() ? 'Draw!' : 'Your turn - White') }
  const click = (sq) => {
    if (mode === 'computer' && game.turn() === 'b') return
    if (sel) {
      const mv = game.moves({ square: sel, verbose: true }).find(x => x.to === sq)
      if (mv) {
        const g = new Chess(game.fen()); g.move(mv); setSel(null); setGame(g)
        if (g.isCheckmate()) { setStatus('Checkmate!'); const lb = JSON.parse(localStorage.getItem('zed_leaderboard') || '{"wins":0,"losses":0,"draws":0,"rating":1200}'); const youWon = g.turn() === 'b'; lb.wins += youWon ? 1 : 0; lb.losses += youWon ? 0 : 1; lb.rating += youWon ? 15 : -10; localStorage.setItem('zed_leaderboard', JSON.stringify(lb)); return }
        if (g.isDraw()) { setStatus('Draw!'); return }
       const cpu = (g) => { const ms = g.moves({ verbose: true }); if (!ms.length) return; const caps = ms.filter(m => m.captured || m.san.includes('+')); const pick = caps.length && Math.random() > 0.3 ? caps[Math.floor(Math.random()*caps.length)] : ms[Math.floor(Math.random()*ms.length)]; g.move(pick);
 if (mode === 'computer') { setStatus('Computer thinking...'); setTimeout(() => cpu(new Chess(g.fen())), 500) }
        else setStatus(g.turn() === 'w' ? 'White to move' : 'Black to move')
        return
      }
    }
    const pc = game.get(sq); setSel(pc && pc.color === game.turn() ? sq : null)
  }
  const board = game.board()
  const targets = sel ? game.moves({ square: sel, verbose: true }).map(m => m.to) : []
  const btn = (a) => ({ padding: '8px 12px', background: a ? '#22c55e' : '#333', color: 'white', border: 'none', borderRadius: 8, fontSize: 14 })
  const bar = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#222', padding: '8px 10px', borderRadius: 8, color: 'white', width: '100%', boxSizing: 'border-box' }
  const clock = (active, t) => ({ background: active ? '#22c55e' : '#444', color: 'white', padding: '6px 10px', borderRadius: 6, fontWeight: 'bold', fontSize: 16, minWidth: 58, textAlign: 'center' })
  const oppName = mode === 'computer' ? 'Computer' : 'Black Player'
  const oppFlag = mode === 'computer' ? '🤖' : '🇿🇲'
  const oppRate = mode === 'computer' ? '1500' : '1200'
  return (
    <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', padding: 8, boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
        <button onClick={() => reset('friend')} style={btn(mode === 'friend')}>Friend</button>
        <button onClick={() => reset('computer')} style={btn(mode === 'computer')}>Computer</button>
        <button onClick={() => reset()} style={btn(false)}>Reset</button>
      </div>
      <p style={{ textAlign: 'center', margin: '6px 0' }}>{status}</p>
      <div style={bar}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ fontSize: 24 }}>♟️</span><div><div style={{ fontWeight: 'bold', fontSize: 14 }}>{oppFlag} {oppName}</div><div style={{ fontSize: 12, opacity: 0.8 }}>⭐ {oppRate} • {mode === 'computer' ? 'AI' : 'Zambia'}</div></div></div>
        <div style={clock(game.turn() === 'b' && !over, bt)}>{fmt(bt)}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', width: '100%', border: '2px solid #333', margin: '8px 0', boxSizing: 'border-box' }}>
        {board.flat().map((sq, i) => {
          const file = 'abcdefgh'[i % 8]; const rank = 8 - Math.floor(i / 8)
          const name = sq ? sq.square : `${file}${rank}`
          const light = (name.charCodeAt(0) + name.charCodeAt(1)) % 2 === 1
          const ch = sq ? P[sq.color === 'w' ? sq.type.toUpperCase() : sq.type] : ''
          const bg = sel === name ? '#facc15' : targets.includes(name) ? '#4ade80' : light ? '#f0d9b5' : '#b58863'
          return <button key={name} onClick={() => click(name)} style={{ aspectRatio: '1', fontSize: 28, cursor: 'pointer', background: bg, border: 'none', color: sq?.color === 'w' ? 'white' : 'black', textShadow: '0 0 3px black', padding: 0 }}>{ch}</button>
        })}
      </div>
      <div style={bar}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ fontSize: 24 }}>♔</span><div><div style={{ fontWeight: 'bold', fontSize: 14 }}>🇿🇲 Themba Ndhlovu (You)</div><div style={{ fontSize: 12, opacity: 0.8 }}>⭐ 1200 • Zambia</div></div></div>
        <div style={clock(game.turn() === 'w' && !over, wt)}>{fmt(wt)}</div>
      </div>
      <p style={{ textAlign: 'center', fontSize: 12, opacity: 0.7 }}>Tap a piece - green = legal move • 10 min clock</p>
    </div>
  )
}
