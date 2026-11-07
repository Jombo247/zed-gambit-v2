
import { useState, useEffect, useRef } from 'react'

const FORMATS = [
  { id: 'arena', name: '🏟️ Arena', desc: 'Play as many as you want in 30 min. Most points wins.', icon: '🏟️' },
  { id: 'swiss', name: '🇨🇭 Swiss', desc: '5 rounds. Paired vs same score. Fairest format.', icon: '🇨🇭' },
  { id: 'knockout', name: '⚔️ Knockout', desc: 'Single elimination bracket. Lose = out.', icon: '⚔️' },
]

const TIME_CONTROLS = [
  { id: 'bullet', label: 'Bullet 1+0', min: 1, inc: 0 },
  { id: 'blitz', label: 'Blitz 3+2', min: 3, inc: 2 },
  { id: 'rapid', label: 'Rapid 10+0', min: 10, inc: 0 },
  { id: 'classical', label: 'Classical 15+10', min: 15, inc: 10 },
]

export default function RatedTournaments({ onBack, onPlayRoom, myRating }) {
  const [tournaments, setTournaments] = useState([])
  const [myTournaments, setMyTournaments] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [format, setFormat] = useState('arena')
  const [timeControl, setTimeControl] = useState('blitz')
  const [name, setName] = useState('Zed Rated Open')
  const [stake, setStake] = useState(0)
  const [rated, setRated] = useState(true)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
    const ws = new WebSocket(`${proto}${window.location.host}/ws/lobby`)
    wsRef.current = ws
    ws.onopen = () => {
      setConnected(true)
      ws.send(JSON.stringify({ type: 'join-lobby', name: localStorage.getItem('zed_name') || 'Themba', rating: myRating || 1200 }))
    }
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data)
      if (m.type === 'lobby') setTournaments(m.tournaments || [])
      if (m.type === 'tournament-update') setTournaments(m.tournaments || [])
      if (m.type === 'tournament-started') {
        alert(`Tournament started! Your first game Room: ${m.room}`)
        onPlayRoom(m.room, 0)
      }
    }
    return () => ws.close()
  }, [])

  const create = () => {
    wsRef.current?.send(JSON.stringify({
      type: 'create-rated-tournament',
      name, format, timeControl, stake, rated, max: format === 'knockout' ? 8 : 16
    }))
    setShowCreate(false)
    alert('Rated tournament created!')
  }

  const join = (id) => {
    wsRef.current?.send(JSON.stringify({ type: 'join-tournament', tournamentId: id }))
    setMyTournaments([...myTournaments, id])
    alert('Joined! You will be paired when tournament starts.')
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 12, color: '#fff' }}>
      <button onClick={onBack} style={{ padding: '8px 12px', background: '#333', color: '#fff', border: 'none', borderRadius: 8 }}>← Back</button>
      <h2 style={{ textAlign: 'center' }}>🏆 Rated Tournaments</h2>
      <p style={{ textAlign: 'center', fontSize: 13, opacity: 0.8 }}>Your Rating: <b style={{ color: '#EF7D00', fontSize: 18 }}>{myRating || 1200}</b> {connected ? '🟢 Live' : '🔴 Connecting...'}</p>

      <button onClick={() => setShowCreate(!showCreate)} style={{ width: '100%', padding: 12, background: '#198A00', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 'bold', marginTop: 8 }}>+ CREATE RATED TOURNAMENT</button>

      {showCreate && (
        <div style={{ background: '#111', border: '2px solid #198A00', borderRadius: 10, padding: 12, marginTop: 10 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Tournament name" style={{ width: '100%', padding: 10, borderRadius: 8, background: '#222', color: '#fff', border: '1px solid #333', marginBottom: 8 }} />
          <b>Format:</b>
          <div style={{ display: 'flex', gap: 6, margin: '8px 0' }}>
            {FORMATS.map(f => (
              <button key={f.id} onClick={() => setFormat(f.id)} style={{ flex: 1, padding: 10, background: format === f.id ? '#EF7D00' : '#333', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 'bold' }}>{f.name}</button>
            ))}
          </div>
          <p style={{ fontSize: 12, opacity: 0.8 }}>{FORMATS.find(f => f.id === format)?.desc}</p>
          <b>Time Control:</b>
          <div style={{ display: 'flex', gap: 6, margin: '8px 0', flexWrap: 'wrap' }}>
            {TIME_CONTROLS.map(t => (
              <button key={t.id} onClick={() => setTimeControl(t.id)} style={{ padding: '8px 10px', background: timeControl === t.id ? '#EF7D00' : '#333', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12 }}>{t.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 13 }}>Stake:</label>
            <select value={stake} onChange={e => setStake(parseInt(e.target.value))} style={{ padding: 8, borderRadius: 8, background: '#222', color: '#fff' }}>
              <option value={0}>Free - Rating Only</option>
              <option value={10}>K10</option>
              <option value={20}>K20</option>
              <option value={50}>K50</option>
              <option value={100}>K100</option>
            </select>
            <label style={{ fontSize: 13, display: 'flex', gap: 4, alignItems: 'center' }}>
              <input type="checkbox" checked={rated} onChange={e => setRated(e.target.checked)} /> Rated ⭐
            </label>
          </div>
          <button onClick={create} style={{ width: '100%', padding: 10, background: '#EF7D00', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', marginTop: 10 }}>CREATE TOURNAMENT</button>
        </div>
      )}

      <h3 style={{ marginTop: 16 }}>🔴 Live Rated Tournaments ({tournaments.length})</h3>
      {tournaments.length === 0 && <p style={{ opacity: 0.7, fontSize: 13 }}>No tournaments yet. Create the first one!</p>}
      {tournaments.map(t => (
        <div key={t.id} style={{ background: '#111', border: t.rated ? '2px solid #EF7D00' : '1px solid #333', borderRadius: 10, padding: 12, marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <b>{t.name}</b>
            <span style={{ background: t.rated ? '#EF7D00' : '#555', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{t.rated ? '⭐ RATED' : 'CASUAL'}</span>
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>
            {t.format === 'arena' ? '🏟️ Arena' : t.format === 'swiss' ? '🇨🇭 Swiss' : '⚔️ Knockout'} • {t.timeControl || 'Blitz 3+2'} • {t.players?.length || 0}/{t.max} players • {t.stake > 0 ? `K${t.stake} stake` : 'Free'}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Players: {(t.players || []).join(', ') || 'None yet'}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Status: {t.status} • Avg Rating: {t.avgRating || 1200}</div>
          {myTournaments.includes(t.id)
            ? <button style={{ width: '100%', padding: 10, background: '#198A00', color: '#fff', border: 'none', borderRadius: 8, marginTop: 8 }}>✅ JOINED - Waiting for start</button>
            : <button onClick={() => join(t.id)} style={{ width: '100%', padding: 10, background: '#EF7D00', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', marginTop: 8 }}>JOIN TOURNAMENT</button>
          }
        </div>
      ))}

      <div style={{ background: '#222', padding: 12, borderRadius: 10, marginTop: 14, fontSize: 12, lineHeight: 1.6 }}>
        <b>How Rating Works (like Chess.com):</b><br/>
        - Beat a higher-rated player = +25 to +32 points<br/>
        - Beat a lower-rated player = +5 to +10 points<br/>
        - Lose to a higher-rated player = -5 points<br/>
        - Lose to a lower-rated player = -25 points<br/>
        - Tournaments give double rating points for the final
      </div>
    </div>
  )
}


Tell me Rated UI Done when this file is saved — then Step 2 is the backend: Elo calculation + auto-pairing in worker.js, and wiring a new 🏆 Rated Tournaments card on Home.