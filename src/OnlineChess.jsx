import { useState, useEffect } from 'react'
import { Chess } from 'chess.js'

const P = { K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟' }
const STAKES = [10, 20, 50, 100]
const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

export default function OnlineChess({ onBack }) {
  const [wallet, setWallet] = useState(() => parseInt(localStorage.getItem('zed_wallet') || '500'))
  const [stake, setStake] = useState(20)
  const [room, setRoom] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [inGame, setInGame] = useState(false)
  const [game, setGame] = useState(new Chess())
  const [sel, setSel] = useState(null)
  const [status, setStatus] = useState('White to move')
  const [wt, setWt] = useState(600)
  const [bt, setBt] = useState(600)
  const [result, setResult] = useState('')

  const over = game.isCheckmate() || game.isDraw()
  useEffect(() => {
    if (!inGame || over) return
    const id = setInterval(() => { if (game.turn() === 'w') setWt(t => Math.max(0, t-1)); else setBt(t => Math.max(0, t-1)) }, 1000)
    return () => clearInterval(id)
  }, [game, inGame, over])

  const saveWallet = (v) => { setWallet(v); localStorage.setItem('zed_wallet', String(v)) }
  const createRoom = () => {
    if (wallet < stake) return alert('Not enough balance! Top up demo coins.')
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    setRoom(code); saveWallet(wallet - stake); setInGame(true); setStatus(`Room ${code} - Pot K${stake * 2} - White to move`)
  }
  const joinRoom = () => {
    if (!joinCode.trim()) return alert('Enter room code')
    if (wallet < stake) return alert('Not enough balance!')
    setRoom(joinCode.toUpperCase()); saveWallet(wallet - stake); setInGame(true); setStatus(`Joined ${joinCode.toUpperCase()} - Pot K${stake * 2} - White to move`)
  }
  const claimWin = () => {
    const pot = stake * 2
    saveWallet(wallet + pot); setResult(`You won K${pot}! New balance K${wallet + pot}`)
  }
  const topUp = () => { saveWallet(wallet + 500); alert('Demo +K500 added') }

  const click = (sq) => {
    if (sel) {
      const mv = game.moves({ square: sel, verbose: true }).find(x => x.to === sq)
      if (mv) {
        const g = new Chess(game.fen()); g.move(mv); setSel(null); setGame(g)
        if (g.isCheckmate()) { setStatus(`Checkmate! ${g.turn() === 'b' ? 'White wins pot!' : 'Black wins pot!'}`); return }
        if (g.isDraw()) { setStatus('Draw! Stake refunded'); return }
        setStatus(g.turn() === 'w' ? 'White to move' : 'Black to move'); return
      }
    }
    const pc = game.get(sq); setSel(pc && pc.color === game.turn() ? sq : null)
  }

  const board = game.board()
  const targets = sel ? game.moves({ square: sel, verbose: true }).map(m => m.to) : []
  const card = { background: '#111', border: '2px solid #198A00', borderRadius: 10, padding: 14 }
  const btn = (a, c) => ({ padding: '10px 14px', background: a ? (c || '#198A00') : '#333', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' })

  if (!inGame) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 12, color: '#fff' }}>
        <button onClick={onBack} style={btn(false)}>← Back</button>
        <h2 style={{ textAlign: 'center', margin: '14px 0' }}>💰 Play For Stake - LIVE</h2>
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 13, opacity: 0.8 }}>YOUR WALLET (DEMO)</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#EF7D00' }}>K{wallet}</div>
          <button onClick={topUp} style={{ ...btn(true, '#EF7D00'), marginTop: 8 }}>+ Top Up K500 Demo</button>
          <p style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>Demo coins only - not real money yet</p>
        </div>
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>1. Pick Your Stake</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {STAKES.map(s => <button key={s} onClick={() => setStake(s)} style={{ flex: 1, padding: 12, background: stake === s ? '#EF7D00' : '#333', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: 16 }}>K{s}</button>)}
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 14 }}>Pot to win: <b style={{ color: '#198A00', fontSize: 18 }}>K{stake * 2}</b> • Winner takes all</div>
        </div>
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>2. Create or Join Room</div>
          <button onClick={createRoom} style={{ ...btn(true), width: '100%', fontSize: 16 }}>🎲 CREATE ROOM - Stake K{stake}</button>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Enter Code e.g. A7K9P2" style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #333', background: '#222', color: '#fff', textTransform: 'uppercase' }} />
            <button onClick={joinRoom} style={btn(true, '#DE2010')}>JOIN</button>
          </div>
          <p style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>Share your code on WhatsApp. Both players stake same amount.</p>
        </div>
        <div style={{ background: '#222', padding: 10, borderRadius: 8, marginTop: 12, fontSize: 12, lineHeight: 1.5 }}>
          <b>Rules:</b> 10 min clock • Checkmate wins pot • Draw = refund • Disconnect = forfeit • 18+ only
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 12, color: '#fff' }}>
      <button onClick={() => setInGame(false)} style={btn(false)}>← Leave</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', background: '#198A00', padding: 12, borderRadius: 8, margin: '12px 0', fontWeight: 'bold' }}>
        <span>🏆 POT: K{stake * 2}</span><span>💰 Wallet: K{wallet}</span><span>Room: {room}</span>
      </div>
      <p style={{ textAlign: 'center' }}>{status}</p>
      {result && <div style={{ background: '#EF7D00', padding: 12, borderRadius: 8, textAlign: 'center', fontWeight: 'bold', margin: '8px 0' }}>{result}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', background: '#222', padding: 8, borderRadius: 8 }}><span>♟️ Black</span><b>{fmt(bt)}</b></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', width: '100%', margin: '8px 0', borderRadius: 6, overflow: 'hidden' }}>
        {board.flat().map((sq, i) => {
          const name = sq ? sq.square : `${'abcdefgh'[i % 8]}${8 - Math.floor(i / 8)}`
          const light = (name.charCodeAt(0) + name.charCodeAt(1)) % 2 === 1
          const ch = sq ? P[sq.color === 'w' ? sq.type.toUpperCase() : sq.type] : ''
          const bg = sel === name ? '#f7f769' : targets.includes(name) ? '#EF7D00' : light ? '#ebecd0' : '#739552'
          return <button key={name} onClick={() => click(name)} style={{ aspectRatio: '1', fontSize: 28, background: bg, border: 'none', color: sq?.color === 'w' ? 'white' : 'black', textShadow: '0 0 3px black', padding: 0 }}>{ch}</button>
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', background: '#222', padding: 8, borderRadius: 8 }}><span>♔ You (White)</span><b>{fmt(wt)}</b></div>
      {over && <button onClick={claimWin} style={{ ...btn(true, '#EF7D00'), width: '100%', marginTop: 12, fontSize: 16 }}>💰 CLAIM WIN - K{stake * 2}</button>}
      <p style={{ textAlign: 'center', fontSize: 12, opacity: 0.7, marginTop: 8 }}>Play on same phone for demo. Real online with 2 phones comes next.</p>
    </div>
  )
}

