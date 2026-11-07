
import { useState } from 'react'
import { Chess } from 'chess.js'
const P = { K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟' }
export default function ChessBoard() {
  const [game, setGame] = useState(new Chess())
  const [sel, setSel] = useState(null)
  const [mode, setMode] = useState('friend')
  const [status, setStatus] = useState('White to move - Friend Mode')
  const reset = (m) => { const mm = m || mode; setGame(new Chess()); setSel(null); setMode(mm); setStatus(mm === 'computer' ? 'White to move - vs Computer' : 'White to move - Friend Mode') }
  const cpu = (g) => { const ms = g.moves({ verbose: true }); if (!ms.length) return; g.move(ms[Math.floor(Math.random() * ms.length)]); setGame(new Chess(g.fen())); setStatus(g.isCheckmate() ? 'Checkmate! Computer wins' : g.isDraw() ? 'Draw!' : 'Your turn - White') }
  const click = (sq) => {
    if (mode === 'computer' && game.turn() === 'b') return
    if (sel) {
      const mv = game.moves({ square: sel, verbose: true }).find(x => x.to === sq)
      if (mv) {
        const g = new Chess(game.fen()); g.move(mv); setSel(null); setGame(g)
        if (g.isCheckmate()) { setStatus('Checkmate!'); return }
        if (g.isDraw()) { setStatus('Draw!'); return }
        if (mode === 'computer') { setStatus('Computer thinking...'); setTimeout(() => cpu(new Chess(g.fen())), 500) }
        else setStatus(g.turn() === 'w' ? 'White to move' : 'Black to move')
        return
      }
    }
    const pc = game.get(sq)
    setSel(pc && pc.color === game.turn() ? sq : null)
  }
  const board = game.board()
  const targets = sel ? game.moves({ square: sel, verbose: true }).map(m => m.to) : []
  const btn = (a) => ({ padding: '8px 16px', background: a ? '#22c55e' : '#333', color: 'white', border: 'none', borderRadius: 8 })
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
        <button onClick={() => reset('friend')} style={btn(mode === 'friend')}>Friend</button>
        <button onClick={() => reset('computer')} style={btn(mode === 'computer')}>Computer</button>
        <button onClick={() => reset()} style={btn(false)}>Reset</button>
      </div>
      <p style={{ textAlign: 'center' }}>{status}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', maxWidth: 480, margin: '0 auto', border: '2px solid #333' }}>
        {board.flat().map((sq, i) => {
          const file = 'abcdefgh'[i % 8]; const rank = 8 - Math.floor(i / 8)
          const name = sq ? sq.square : `${file}${rank}`
          const light = (name.charCodeAt(0) + name.charCodeAt(1)) % 2 === 1
          const ch = sq ? P[sq.color === 'w' ? sq.type.toUpperCase() : sq.type] : ''
          const bg = sel === name ? '#facc15' : targets.includes(name) ? '#4ade80' : light ? '#f0d9b5' : '#b58863'
          return <button key={name} onClick={() => click(name)} style={{ aspectRatio: '1', fontSize: 32, cursor: 'pointer', background: bg, border: 'none', color: sq?.color === 'w' ? 'white' : 'black', textShadow: '0 0 3px black' }}>{ch}</button>
        })}
      </div>
      <p style={{ textAlign: 'center', fontSize: 13, opacity: 0.7 }}>Tap a piece (yellow) - green squares are legal moves</p>
    </div>
  )
}
