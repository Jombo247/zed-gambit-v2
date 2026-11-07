
import { useState, useEffect, useRef } from 'react'
import Auth from './Auth.jsx'
import AdminDashboard from './AdminDashboard.jsx'

export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('zed_user')) } catch { return null } })
  const [showAdmin, setShowAdmin] = useState(false)
  const [page, setPage] = useState('home')
  const [tournaments, setTournaments] = useState([])
  const [lobbyUsers, setLobbyUsers] = useState([])
  const [status, setStatus] = useState('')
  const [room, setRoom] = useState('')
  const [opponent, setOpponent] = useState('')
  const [stats, setStats] = useState(null)

  // ===== BALANCE - TOP RIGHT CORNER - SHOW / HIDE =====
  const [balance, setBalance] = useState(() => Number(localStorage.getItem('zed_balance') || 1000))
  const [showBalance, setShowBalance] = useState(() => localStorage.getItem('zed_show_balance') !== 'hide')
  const toggleBalance = () => {
    const next = !showBalance
    setShowBalance(next)
    localStorage.setItem('zed_show_balance', next ? 'show' : 'hide')
  }
  const addBalance = (amount) => {
    const next = balance + amount
    setBalance(next); localStorage.setItem('zed_balance', String(next))
  }

  const wsRef = useRef(null)

  const loadTournaments = async () => {
    try { const r = await fetch('/api/tournaments'); const d = await r.json(); setTournaments(d.tournaments || []) } catch {}
  }
  const loadStats = async () => {
    try { const r = await fetch('/api/admin/stats'); const d = await r.json(); setStats(d) } catch {}
  }

  useEffect(() => {
    if (!user) return
    loadTournaments(); loadStats()
    const interval = setInterval(() => { loadTournaments(); loadStats() }, 3000)
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${proto}//${location.host}/ws/lobby`)
    wsRef.current = ws
    ws.onopen = () => { ws.send(JSON.stringify({ type: 'join-lobby', name: user.name, rating: user.rating })) }
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data)
      if (m.type === 'lobby') { setTournaments(m.tournaments || []); setLobbyUsers(m.users || []) }
      if (m.type === 'waiting-for-opponent') setStatus('🔍 ' + m.message)
      if (m.type === 'game-start') {
        setStatus(`🎉 Opponent found! vs ${m.opponent} — You are ${m.color === 'w' ? 'White' : 'Black'} — Room: ${m.room}`)
        setRoom(m.room); setOpponent(m.opponent); setPage('play')
      }
      if (m.type === 'tournament-started') { setStatus('🏆 Tournament Started! Room: ' + m.room); setRoom(m.room); setPage('play') }
      if (m.type === 'stake-settled') {
        setStatus(`💰 Stake settled! Winner: ${m.winner} got K${m.winnerPayout} — Admin Fee K${m.adminFee} — Tax K${m.tax}`)
        // If you won, add payout to your balance
        if (m.winner === user.name) addBalance(m.winnerPayout)
      }
    }
    return () => { clearInterval(interval); ws.close() }
  }, )

  if (!user) return <Auth onLogin={setUser} />
  if (showAdmin && user.role === 'admin') return <AdminDashboard user={user} onLogout={() => { localStorage.removeItem('zed_user'); setUser(null); setShowAdmin(false) }} />

  const joinTournament = (id) => {
    setStatus('Joining...')
    wsRef.current?.send(JSON.stringify({ type: 'join-tournament', tournamentId: id }))
  }
  const createTournament = () => {
    const name = prompt('Tournament name? e.g. My Blitz Arena')
    if (!name) return
    wsRef.current?.send(JSON.stringify({ type: 'create-rated-tournament', name, format: 'arena', timeControl: 'blitz', rated: true, max: 16 }))
    setStatus('✅ Tournament created!')
  }
  const logout = () => { localStorage.removeItem('zed_user'); setUser(null) }

  const btn = (active) => ({ padding: '10px 16px', border: 0, borderRadius: 10, fontWeight: 700, cursor: 'pointer', background: active ? '#22c55e' : '#1e293b', color: '#fff' })
  const card = { background: '#1e293b', padding: 16, borderRadius: 14, marginBottom: 12 }

  return (
    <div style={{ background: '#0f172a', color: '#fff', minHeight: '100vh', padding: 16, paddingTop: 70, maxWidth: 1000, margin: '0 auto', position: 'relative' }}>

      {/* ===== TOP RIGHT CORNER - BALANCE + EYE BUTTON - ALWAYS VISIBLE ===== */}
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 999, display: 'flex', gap: 6, alignItems: 'center', background: '#1e293b', padding: '8px 10px', borderRadius: 12, border: '2px solid #eab308', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <span style={{ fontSize: 14 }}>💰</span>
        <span style={{ fontWeight: 800, fontSize: 15 }}>
          {showBalance ? `K${balance.toFixed(2)}` : 'K****'}
        </span>
        <button onClick={toggleBalance} title={showBalance ? 'Hide Balance' : 'Show Balance'} style={{ background: '#0f172a', color: '#fff', border: 0, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}>
          {showBalance ? '👁️' : '🙈'}
        </button>
        <button onClick={() => { const a = prompt('Add funds K? e.g. 100'); if (a) addBalance(Number(a)) }} style={{ background: '#22c55e', color: '#fff', border: 0, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}>+</button>
      </div>

      {/* ===== TOP BAR - ALL BUTTONS ===== */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, marginRight: 8 }}>♔ Zed Gambit</h1>
        <button style={btn(page === 'home')} onClick={() => setPage('home')}>🏠 Home</button>
        <button style={btn(page === 'play')} onClick={() => setPage('play')}>♟️ Play Now</button>
        <button style={btn(page === 'tournaments')} onClick={() => setPage('tournaments')}>🏆 Rated Tournaments</button>
        <button style={btn(page === 'stake')} onClick={() => setPage('stake')}>💰 Stake Games</button>
        <button style={btn(page === 'leaderboard')} onClick={() => setPage('leaderboard')}>📊 Leaderboard</button>
        {user.role === 'admin' && <button style={{ ...btn(false), background: '#a855f7' }} onClick={() => setShowAdmin(true)}>🛡️ Admin</button>}
        <button style={{ ...btn(false), background: '#ef4444' }} onClick={logout}>🚪 Logout</button>
      </div>

      <div style={{ background: '#1e293b', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
        👤 <b>{user.name}</b> (@{user.username}) • Rating: <b>{user.rating}</b> • Role: <b>{user.role}</b> • Online: {lobbyUsers.length} players
        <br />💰 Balance: <b>{showBalance ? `K${balance.toFixed(2)}` : 'K****'}</b> <button onClick={toggleBalance} style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 14 }}>{showBalance ? '👁️ Hide' : '🙈 Show'}</button>
        {status && <div style={{ marginTop: 6 }}>📢 {status}</div>}
        {room && <div style={{ marginTop: 6 }}>🎲 Current Room: <b>{room}</b> {opponent && <>vs {opponent}</>}</div>}
      </div>

      {page === 'home' && (
        <div>
          <h2>Welcome to Zed Gambit 🇿🇲</h2>
          <p>Join an Arena and start playing rated games instantly — like lichess / chess.com</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button style={{ ...btn(false), padding: 20, fontSize: 18, background: '#22c55e' }} onClick={() => setPage('tournaments')}>🏆 Join Rated Arena</button>
            <button style={{ ...btn(false), padding: 20, fontSize: 18, background: '#eab308', color: '#000' }} onClick={() => setPage('stake')}>💰 Play Stake Game</button>
            <button style={{ ...btn(false), padding: 20, fontSize: 18 }} onClick={() => setPage('play')}>♟️ Quick Play</button>
            <button style={{ ...btn(false), padding: 20, fontSize: 18 }} onClick={() => setPage('leaderboard')}>📊 View Leaderboard</button>
          </div>
          <h3 style={{ marginTop: 20 }}>🔥 Live Arenas Right Now</h3>
          {tournaments.map(t => (
            <div key={t.id} style={card}>
              <b>{t.name}</b> — {t.playerCount}/{t.max} • Waiting: {t.waitingCount} • {t.timeControl} • {t.rated ? 'Rated' : 'Casual'} {t.stake ? `• Stake K${t.stake}` : ''}
              <br /><button style={{ ...btn(true), marginTop: 8 }} onClick={() => joinTournament(t.id)}>✅ Join & Play</button>
            </div>
          ))}
        </div>
      )}

      {page === 'play' && (
        <div style={card}>
          <h2>♟️ Play Now</h2>
          {room ? (
            <div>
              <p>Your game room is <b>{room}</b>. Share this room code with your opponent or wait for auto-pairing.</p>
              <button style={btn(true)} onClick={() => { wsRef.current?.send(JSON.stringify({ type: 'game-finished', tournamentId: tournaments[0]?.id })); setStatus('Game finished! Searching for next opponent...') }}>🏁 Finish Game & Find Next Opponent</button>
            </div>
          ) : (
            <div>
              <p>No game yet. Join an arena to get paired instantly.</p>
              <button style={btn(true)} onClick={() => joinTournament('MEGA1')}>🌍 Join Mega Arena - Everyone Can Join</button>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <button style={btn(false)} onClick={() => { const r = prompt('Enter Room Code:'); if (r) setRoom(r) }}>🔑 Join by Room Code</button>
            <button style={{ ...btn(false), marginLeft: 8 }} onClick={() => { const r = Math.random().toString(36).slice(2, 8).toUpperCase(); setRoom(r); setStatus('Room created: ' + r) }}>➕ Create Private Room</button>
          </div>
        </div>
      )}

      {page === 'tournaments' && (
        <div>
          <h2>🏆 Rated Tournaments</h2>
          <button style={{ ...btn(true), marginBottom: 12 }} onClick={createTournament}>➕ Create Tournament</button>
          <button style={{ ...btn(false), marginLeft: 8, marginBottom: 12 }} onClick={loadTournaments}>🔄 Refresh List</button>
          {tournaments.length === 0 && <p>No tournaments. Tap Refresh.</p>}
          {tournaments.map(t => (
            <div key={t.id} style={card}>
              <b>{t.name}</b><br />
              <small>{t.format} • {t.timeControl} • {t.rated ? 'Rated ⭐' : 'Casual'} • {t.playerCount}/{t.max} joined • {t.waitingCount} waiting • Avg Rating {t.avgRating}</small><br />
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={btn(true)} onClick={() => joinTournament(t.id)}>✅ Join Arena</button>
                <button style={btn(false)} onClick={() => { setStatus('Players: ' + (t.players || []).join(', ')) }}>👥 View Players</button>
              </div>
              {t.players && t.players.length > 0 && <p style={{ fontSize: 13 }}>Players: {t.players.join(', ')}</p>}
            </div>
          ))}
        </div>
      )}

      {page === 'stake' && (
        <div>
          <h2>💰 Stake Games — Winner Takes Pot Minus 10% Admin Fee</h2>
          <p style={{ fontSize: 13 }}>Example: 2 x K100 = Pot K200 → Admin K20 → Tax K3.20 → Winner gets K180</p>
          <p style={{ fontSize: 13 }}>Your Balance: <b>{showBalance ? `K${balance.toFixed(2)}` : 'K****'}</b></p>
          {tournaments.filter(t => (t.stake || 0) > 0).map(t => (
            <div key={t.id} style={card}>
              <b>{t.name}</b> — Stake K{t.stake} • {t.playerCount}/{t.max} • Waiting: {t.waitingCount}<br />
              <button style={{ ...btn(false), background: '#eab308', color: '#000', marginTop: 8 }} onClick={() => {
                if (balance < t.stake) { alert('Not enough balance! Top up with + button top right.'); return }
                addBalance(-t.stake); joinTournament(t.id)
              }}>💰 Join Stake K{t.stake} — Balance: {showBalance ? `K${balance.toFixed(2)}` : 'K****'}</button>
            </div>
          ))}
          <div style={card}>
            <h3>➕ Create Custom Stake Game</h3>
            <button style={btn(false)} onClick={() => { const s = prompt('Stake amount K? e.g. 50'); if (s) { wsRef.current?.send(JSON.stringify({ type: 'create-rated-tournament', name: `💰 Stake K${s} Arena`, format: 'arena', timeControl: 'blitz', rated: true, stake: Number(s), max: 16 })); setStatus('Stake game created!') } }}>➕ Create Stake Arena</button>
          </div>
        </div>
      )}

      {page === 'leaderboard' && (
        <div>
          <h2>📊 Leaderboard</h2>
          <button style={btn(false)} onClick={loadStats}>🔄 Refresh</button>
          {stats?.users?.sort((a, b) => b.rating - a.rating).map((u, i) => (
            <div key={u.username} style={card}>#{i + 1} <b>{u.name}</b> (@{u.username}) — Rating {u.rating} • Games {u.games} • Wins {u.wins} {u.role === 'admin' ? '🛡️' : ''}</div>
          ))}
          {!stats && <p>Loading...</p>}
        </div>
      )}

      <p style={{ fontSize: 12, opacity: 0.6, textAlign: 'center', marginTop: 20 }}>Zed Gambit • Rated • Stake • Admin Fee 10% • Tax 16% VAT • Made in Zambia 🇿🇲</p>
    </div>
  )
}


