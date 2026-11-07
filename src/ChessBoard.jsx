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
    