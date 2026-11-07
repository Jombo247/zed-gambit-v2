import { useState } from 'react'
import { Chess } from 'chess.js'

const PIECES = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
}

export default function ChessBoard() {
  const [game, setGame] = useState(new Chess())
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState('friend')
  const [status, setStatus] = useState('White to move - Friend Mode')

  const reset = (newMode) => {
    const m = newMode || mode
    const g = new Chess()
    setGame(g)
    setSelected(null)
    setMode(m)
    setStatus(m === 'computer' ? 'White to move - vs Computer' : 'White to move - Friend Mode')
  }

  const makeComputerMove = (g) => {
    const moves = g.moves({ verbose: true })
    if (moves.length === 0) return
    const random = moves[Math.floor(Math.random() * moves.length)]
    g.move(random)
    setGame(new Chess(g.fen()))
    setStatus(g.isCheckmate() ? 'Checkmate! Computer wins' : g.isDraw() ? 'Draw!' : 'Your turn - White')
  }

  const handleClick = (square) => {
    if (mode === 'computer' && game.turn() === 'b') return

    if (selected) {
      const move = game.moves({ from: selected, verbose: true }).find(m => m.to === square)
      if (move) {
        const g = new Chess(game.fen())
        g.move(move)
        setSelected(null)
        setGame(g)
        if (g.isCheckmate()) { setStatus('Checkmate!'); return }
        if (g.isDraw()) { setStatus('Draw!'); return }
        if (mode === 'computer') {
          setStatus('Computer thinking...')
          setTimeout(() => makeComputerMove(new Chess(g.fen())), 500)
        } else {
          setStatus(g.turn() === 'w' ? 'White to move' : 'Black to move')
        }
        return
      }
    }
