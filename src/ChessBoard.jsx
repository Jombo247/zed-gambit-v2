import { useState } from 'react'
import { Chess } from 'chess.js'

const PIECES = { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚', P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔' }

export default function ChessBoard() {
  const [game] = useState(() => new Chess())
  const [board, setBoard] = useState(game.board())
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('White to move - tap a piece, then tap where to move it')

  function onSquareClick(r, c) {
    const square = 'abcdefgh'[c] + (8 - r)
    if (selected) {
      try {
        const move = game.move({ from: selected, to: square, promotion: 'q' })
        setBoard(game.board())
        setSelected(null)
        setStatus(move ? `Last move: ${move.san} - ${game.turn() === 'w' ? 'White' : 'Black'} to move` : status)
        if (game.isCheckmate()) setStatus('Checkmate!')
        if (game.isDraw()) setStatus('Draw!')
      } catch {
        setSelected(null)
      }
      return
    }
    const piece = game.get(square)
    if (piece && piece.color === game.turn()) setSelected(square)
  }

  return (
    <div>
      <p className="board-status">{status}</p>
      <div className="board">
        {board.map((row, r) => row.map((piece, c) => {
          const isDark = (r + c) % 2 === 1
          const square = 'abcdefgh'[c] + (8 - r)
          return (
            <button key={square} onClick={() => onSquareClick(r, c)} className={`square ${isDark ? 'dark' : 'light'} ${selected === square ? 'selected' : ''}`}>
              <span className={piece ? (piece.color === 'w' ? 'white-piece' : 'black-piece') : ''}>
                {piece ? PIECES[piece.color === 'w' ? piece.type.toUpperCase() : piece.type] : ''}
              </span>
            </button>
          )
        }))}
      </div>
      <button className="reset-btn" onClick={() => { game.reset(); setBoard(game.board()); setSelected(null); setStatus('White to move') }}>Reset Board</button>
    </div>
  )
}
