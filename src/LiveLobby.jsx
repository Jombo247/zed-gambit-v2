import { useState, useEffect, useRef } from 'react'

export default function LiveLobby({ onPlayRoom, onBack }) {
  const [users, setUsers] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [myId, setMyId] = useState('')
  const [name, setName] = useState(() => localStorage.getItem('zed_name') || 'Themba')
  const [stake, setStake] = useState(20)
  const [tourName, setTourName] = useState('Zed Open')
  const [incoming, setIncoming] = useState(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
    const ws = new WebSocket(`${proto}${window.location.host}/ws/lobby`)
    wsRef.current = ws
    ws.onopen = () => { setConnected(true); ws.send(JSON.stringify({ type: 'join-lobby', name, rating: 1200 })); }
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data)
      if (m.type === 'welcome') setMyId(m.id)
      if (m.type === 'lobby') { setUsers(m.users); setTournaments(m.tournaments) }
      if (m.type === 'challenge-incoming') setIncoming(m)
      if (m.type === 'challenge-accepted') { alert(`Challenge accepted! Joining room ${m.room}`); onPlayRoom(m.room, stake) }
      if (m.type === 'challenge-declined') alert('Challenge declined')
    }
    ws.onclose = () => setConnected(false)
    return () => ws.close()
  }, [])

  const challenge = (targetId, targetName) => {
    const room = Math.random().toString(36).slice(2, 8).toUpperCase()
    wsRef.current?.send(JSON.stringify({ type: 'challenge', to: targetId, stake, room }))
    alert(`Challenge sent to ${targetName} - Room ${room}. Wait for accept.`)
  }

  const accept = () => {
    wsRef.current?.send(JSON.stringify({ type: 'challenge-accept', to: incoming.from, room: incoming.room }))
    onPlayRoom(incoming.room, incoming.stake)
  }
  const decline = () => {
    wsRef.current?.send(JSON.stringify({ type: 'challenge-decline', to: incoming.from }))
    setIncoming(null)
  }

  const createTour = () => {
    wsRef.current?.send(JSON.stringify({ type: 'create-tournament', name: tourName, stake, max: 8 }))
  }
  const joinTour = (id) => {
    wsRef.current?.send(JSON.stringify({ type: 'join-tournament', tournamentId: id }))
    alert('Joined tournament! Wait for it to fill.')
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 12, color: '#fff' }}>
      <button onClick={onBack} style={{ padding: '8px 12px', background: '#333', color: '#fff', border: 'none', borderRadius: 8 }}>← Back</button>
      <h2 style={{ textAlign: 'center' }}>🔴 LIVE LOBBY {connected ? `• ${users.length} online` : '• Connecting...'}</h2>

      {incoming && (
        <div style={{ background: '#EF7D00', padding: 14, borderRadius: 10, textAlign: 'center', marginBottom: 12 }}>
          <b>⚡ Challenge from {incoming.fromName}</b><br/>Stake K{incoming.stake} • Room {incoming.room}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={accept} style={{ flex: 1, padding: 10, background: '#198A00', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold' }}>✅ ACCEPT</button>
            <button onClick={decline} style={{ flex: 1, padding: 10, background: '#DE2010', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold' }}>❌ DECLINE</button>
          </div>
        </div>
      )}

      <div style={{ background: '#111', border: '2px solid #198A00', borderRadius: 10, padding: 12 }}>
        <b>👥 Live Players ({users.length})</b>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input value={name} onChange={e => { setName(e.target.value); localStorage.setItem('zed_name', e.target.value) }} placeholder="Your name" style={{ flex: 1, padding: 8, borderRadius: 8, background: '#222', color: '#fff', border: '1px solid #333' }} />
          <select value={stake} onChange={e => setStake(parseInt(e.target.value))} style={{ padding: 8, borderRadius: 8, background: '#222', color: '#fff' }}>
            {[10,20,50,100].map(s => <option key={s} value={s}>K{s}</option>)}
          </select>
        </div>
        {users.length === 0 && <p style={{ opacity: 0.7, fontSize: 13 }}>No one else online yet. Open this page on a 2nd phone to test.</p>}
        {users.map(u => (
          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#222', padding: 10, borderRadius: 8, marginTop: 8 }}>
            <span>🟢 <b>{u.name}</b> {u.id === myId ? '(You)' : ''} • ⭐ {u.rating}</span>
            {u.id !== myId && <button onClick={() => challenge(u.id, u.name)} style={{ padding: '6px 10px', background: '#EF7D00', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold' }}>⚔️ CHALLENGE</button>}
          </div>
        ))}
      </div>

      <div style={{ background: '#111', border: '2px solid #EF7D00', borderRadius: 10, padding: 12, marginTop: 12 }}>
        <b>🏆 Live Tournaments ({tournaments.length})</b>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input value={tourName} onChange={e => setTourName(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 8, background: '#222', color: '#fff', border: '1px solid #333' }} />
          <button onClick={createTour} style={{ padding: '8px 12px', background: '#198A00', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold' }}>+ CREATE</button>
        </div>
        {tournaments.map(t => (
          <div key={t.id} style={{ background: '#222', padding: 10, borderRadius: 8, marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{t.name}</b><span>K{t.stake} • {t.players.length}/{t.max} • {t.status}</span></div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Players: {t.players.join(', ')}</div>
            <button onClick={() => joinTour(t.id)} style={{ marginTop: 8, width: '100%', padding: 8, background: '#EF7D00', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold' }}>JOIN TOURNAMENT</button>
          </div>
        ))}
        {tournaments.length === 0 && <p style={{ opacity: 0.7, fontSize: 13, marginTop: 8 }}>No tournaments yet. Create one!</p>}
      </div>
      <p style={{ fontSize: 11, opacity: 0.7, textAlign: 'center', marginTop: 10 }}>Demo coins only • Real-time via WebSocket • Challenges arrive instantly</p>
    </div>
  )
}