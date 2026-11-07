import { useState, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
export default function OnlineChess({ onBack }) {
  const [code, setCode] = useState('')
  const [joined, setJoined] = useState(false)
  const [game, setGame] = useState(new Chess())
  const [myColor, setMyColor] = useState('w')
  const [status, setStatus] = useState('Create or join a room')
  const [copied, setCopied] = useState(false)
  const createRoom = () => {
    const c = Math.random().toString(36).substring(2, 8).toUpperCase()
    setCode(c); setMyColor('w'); setJoined(true); setStatus('Room ' + c + ' created. Share this code! Waiting for opponent...')
    localStorage.setItem('zed_room_' + c, new Chess().fen())
  }
  const joinRoom = () => {
    if (!code) return
    const fen = localStorage.getItem('zed_room_' + code.toUpperCase())
    if (!fen) { setStatus('Room not found. Check code.'); return }
    setMyColor('b'); setJoined(true); setGame(new Chess(fen)); setStatus('Joined room ' + code + '. You are Black. Waiting for White...')
  }
  const copyCode = () => { navigator.clipboard?.writeText(code); setCopied(true) }
  const click = (sq) => {
    if (!joined || game.turn() !== myColor) return
    const moves = game.moves({ square: sq, verbose: true })
    // simple: tap piece then tap target - for online demo, tap target square directly if you tapped before
    // This is simplified: click a square to move if it's a legal target from selected
    const sel = sessionStorage.getItem('online_sel')
    if (sel) {
      const mv = game.moves({ square: sel, verbose: true }).find(m => m.to === sq)
      if (mv) { const g = new Chess(game.fen()); g.move(mv); setGame(g); sessionStorage.removeItem('online_sel'); localStorage.setItem('zed_room_' + code, g.fen()); setStatus(g.isCheckmate() ? 'Checkmate!' : 'Move sent! Opponent turn'); return }
    }
    const pc = game.get(sq)
    if (pc && pc.color === myColor) sessionStorage.setItem('online_sel', sq)
  }
  const refresh = () => { const fen = localStorage.getItem('zed_room_' + code); if (fen) setGame(new Chess(fen)) }
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 12, color: 'white' }}>
      <button onClick={onBack} style={{ background: '#333', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8 }}>← Back</button>
      <h2 style={{ textAlign: 'center' }}>🌐 Play Online</h2>
      {!joined ? (
        <div style={{ background: '#222', padding: 16, borderRadius: 12, textAlign: 'center' }}>
          <button onClick={createRoom} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 10, width: '100%', marginBottom: 10, fontSize: 16 }}>Create Room</button>
          <p style={{ opacity: 0.7 }}>OR</p>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Enter room code e.g. A7K9P2" style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', marginBottom: 10, boxSizing: 'border-box', textAlign: 'center', fontSize: 16 }} />
          <button onClick={joinRoom} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 10, width: '100%', fontSize: 16 }}>Join Room</button>
          <p style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>How it works: 1 person taps Create, shares code on WhatsApp. Other person enters code and taps Join. Both tap Refresh to see opponent move.</p>
        </div>
      ) : (
        <div>
          <div style={{ background: '#222', padding: 10, borderRadius: 10, textAlign: 'center', marginBottom: 10 }}>
            <div>Room: <b style={{ fontSize: 18, letterSpacing: 2 }}>{code}</b> <button onClick={copyCode} style={{ background: '#444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: 6, marginLeft: 6 }}>{copied ? 'Copied!' : 'Copy'}</button></div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{status}</div>
            <div style={{ fontSize: 13 }}>You are: <b>{myColor === 'w' ? 'White' : 'Black'}</b> • Turn: {game.turn() === 'w' ? 'White' : 'Black'}</div>
            <button onClick={refresh} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, marginTop: 8 }}>🔄 Refresh - Check Opponent Move</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', border: '2px solid #333' }}>
            {game.board().flat().map((sq, i) => {
              const file = 'abcdefgh'[i % 8]; const rank = 8 - Math.floor(i / 8); const name = sq ? sq.square : `${file}${rank}`
              const light = (name.charCodeAt(0) + name.charCodeAt(1)) % 2 === 1
              const P = { K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟' }
              const ch = sq ? P[sq.color === 'w' ? sq.type.toUpperCase() : sq.type] : ''
              return <button key={name} onClick={() => click(name)} style={{ aspectRatio: '1', fontSize: 26, background: light ? '#f0d9b5' : '#b58863', border: 'none', color: sq?.color === 'w' ? 'white' : 'black', textShadow: '0 0 3px black' }}>{ch}</button>
            })}
          </div>
        </div>
      )}
    </div>
  )
}
