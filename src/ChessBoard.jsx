import { useState } from 'react'
import { Chess } from 'chess.js'

const pieces = { p:'♟', r:'♜', n:'♞', b:'♝', q:'♛', k:'♚', P:'♟', R:'♜', N:'♞', B:'♝', Q:'♛', K:'♚' }

export default function ChessBoard() {
  const [game, setGame] = useState(new Chess())
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState('friend')
  const [status, setStatus] = useState('White to move - tap a piece')

  function makeComputerMove(g) {
    const moves = g.moves({ verbose: true })
    if (moves.length === 0) return
    const captures = moves.filter(m => m.captured)
    const pick = captures.length > 0 && Math.random() < 0.8
      ? captures[Math.floor(Math.random() * captures.length)]
      : moves[Math.floor(Math.random() * moves.length)]
    g.move(pick)
    updateStatus(g)
  }

  function updateStatus(g) {
    if (g.isCheckmate()) setStatus(g.turn() === 'w' ? 'Checkmate! Black wins!' : 'Checkmate! White wins!')
    else if (g.isDraw()) setStatus('Draw!')
    else if (g.isCheck()) setStatus((g.turn() === 'w' ? 'White' : 'Black') + ' to move - Check!')
    else setStatus((g.turn() === 'w' ? 'White' : 'Black') + ' to move')
  }

  function handleClick(square) {
    if (mode === 'computer' && game.turn() === 'b') return
    if (selected) {
      const move = game.moves({ from: selected, verbose: true }).find(m => m.to === square)
      if (move) {
        const g = new Chess(game.fen())
        g.move(move)
        setGame(g)
        setSelected(null)
        if (mode === 'computer' && !g.isGameOver()) {
          setStatus('Computer thinking...')
          setTimeout(() => {
            const g2 = new Chess(g.fen())
            makeComputerMove(g2)
            setGame(g2)
          }, 500)
        } else {
          updateStatus(g)
        }
        return
      }
    }
    const piece = game.get(square)
    if (piece && piece.color === game.turn()) setSelected(square)
    else setSelected(null)
  }

  function reset() {
    const g = new Chess()
    setGame(g)
    setSelected(null)
    setStatus('White to move - tap a piece')
  }

  const board = game.board()

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
        <button onClick={() => { setMode('friend'); reset() }} style={{ background: mode === 'friend' ? '#f59e0b' : '#334155', color: mode === 'friend' ? '#020617' : 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>👥 2 Players</button>
        <button onClick={() => { setMode('computer'); reset() }} style={{ background: mode === 'computer' ? '#f59e0b' : '#334155', color: mode === 'computer' ? '#020617' : 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>🤖 Play Computer</button>
      </div>
      <div className="board-status">{status}</div>
      <div className="board">
        {board.flat().map((sq, i) => {
  const file = 'abcdefgh'[i % 8]
  const rank = 8 - Math.floor(i / 8)
  const squareName = sq ? sq.square : `${file}${rank}`
  const isLight = (squareName.charCodeAt(0) + squareName.charCodeAt(1)) % 2 === 1
  const piece = sq ? pieces[sq.color === 'w' ? sq.type.toUpperCase() : sq.type] : ''
  return (
    <button key={squareName} onClick={() => handleClick(squareName)} className={`square ${isLight ? 'light' : 'dark'}`}>
      {sq && <span className={sq.color === 'w' ? 'white-piece' : 'black-piece'}>{piece}</span>}
    </button>
  )
})}

      </div>
      <button onClick={reset} className="reset-btn">Reset Game</button>
    </div>
  )
}
