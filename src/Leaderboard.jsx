export default function Leaderboard({ onBack }) {
  const data = JSON.parse(localStorage.getItem('zed_leaderboard') || '{"wins":0,"losses":0,"draws":0,"rating":1200}')
  const total = data.wins + data.losses + data.draws
  const winRate = total ? Math.round((data.wins / total) * 100) : 0
  const list = [
    { name: '🇿🇲 Themba Ndhlovu (You)', rating: data.rating, w: data.wins, l: data.losses, d: data.draws },
    { name: '🤖 Stockfish Computer', rating: 1500, w: 128, l: 42, d: 30 },
    { name: '🇿🇲 Chanda M.', rating: 1340, w: 45, l: 20, d: 10 },
    { name: '🇿🇲 Mutinta K.', rating: 1280, w: 38, l: 25, d: 8 },
    { name: '🇿🇲 Boyd P.', rating: 1150, w: 22, l: 30, d: 5 },
  ].sort((a,b) => b.rating - a.rating)
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 12, color: 'white' }}>
      <button onClick={onBack} style={{ background: '#333', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8 }}>← Back</button>
      <h2 style={{ textAlign: 'center' }}>🏆 Leaderboard</h2>
      <div style={{ background: '#222', padding: 12, borderRadius: 10, textAlign: 'center', marginBottom: 12 }}>
        <div>Your Rating: <b style={{ color: '#22c55e', fontSize: 22 }}>{data.rating}</b></div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>{data.wins}W - {data.losses}L - {data.draws}D • Win Rate {winRate}% • {total} games</div>
      </div>
      {list.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: p.name.includes('You') ? '#14532d' : '#222', padding: 12, borderRadius: 10, marginBottom: 8 }}>
          <div><b>#{i+1}</b> {p.name}</div>
          <div>⭐ {p.rating} • {p.w}W-{p.l}L</div>
        </div>
      ))}
      <p style={{ textAlign: 'center', fontSize: 12, opacity: 0.7 }}>Win = +15 rating, Loss = -10, Draw = +2. Finish a game vs Computer to climb.</p>
    </div>
  )
}


2. Create src/OnlineChess.jsx

GitHub → src → Add file → Create new file → Name: src/OnlineChess.jsx → Paste this → Commit:

jsx
import { useState } from 'react'
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
    setMyColor('b'); setJoined(true); setGame(new Chess(fen)); setStatus('Joined room ' + code + '. You are Black.')
  }
  const copyCode = () => { navigator.clipboard?.writeText(code); setCopied(true) }
  const click = (sq) => {
    if (!joined || game.turn() !== myColor) return
    const sel = sessionStorage.getItem('online_sel')
    if (sel) {
      const mv = game.moves({ square: sel, verbose: true }).find(m => m.to === sq)
      if (mv) { const g = new Chess(game.fen()); g.move(mv); setGame(g); sessionStorage.removeItem('online_sel'); localStorage.setItem('zed_room_' + code, g.fen()); setStatus(g.isCheckmate() ? 'Checkmate!' : 'Move sent! Opponent turn'); return }
    }
    const pc = game.get(sq)
    if (pc && pc.color === myColor) sessionStorage.setItem('online_sel', sq)
  }
  const refresh = () => { const fen = localStorage.getItem('zed_room_' + code); if (fen) setGame(new Chess(fen)) }
  const P = { K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟' }
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
          <p style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>1 person taps Create, shares code on WhatsApp. Other person enters code and taps Join. Both tap Refresh to see opponent move.</p>
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
              const ch = sq ? P[sq.color === 'w' ? sq.type.toUpperCase() : sq.type] : ''
              return <button key={name} onClick={() => click(name)} style={{ aspectRatio: '1', fontSize: 26, background: light ? '#f0d9b5' : '#b58863', border: 'none', color: sq?.color === 'w' ? 'white' : 'black', textShadow: '0 0 3px black' }}>{ch}</button>
            })}
          </div>
        </div>
      )}
    </div>
  )
}
