
import { useState, useEffect, useRef } from 'react'
import Auth from './Auth.jsx'
function AdminDashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null); const [fin, setFin] = useState(null); const [tab, setTab] = useState('finance'); const [txType, setTxType] = useState('stake_win'); const [txAmount, setTxAmount] = useState(''); const [txNote, setTxNote] = useState('')
  const load = async () => { const s = await (await fetch('/api/admin/stats')).json(); setStats(s); const f = await (await fetch('/api/admin/finance')).json(); setFin(f) }
  useEffect(()=>{ load(); const i=setInterval(load, 5000); return ()=>clearInterval(i) },[])
  const ban = async (username) => { await fetch('/api/admin/ban',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username})}); load() }
  const del = async (username) => { if(!confirm('Delete '+username+'?')) return; await fetch('/api/admin/delete-user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username})}); load() }
  const addTx = async (e) => { e.preventDefault(); if(!txAmount) return; await fetch('/api/admin/add-transaction',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type: txType, amount: Number(txAmount), note: txNote, username: user.username})}); setTxAmount(''); setTxNote(''); load() }
  if (!stats || !fin) return <div style={{padding:20, color:'#fff'}}>Loading admin...</div>
  return (
    <div style={{padding:16, maxWidth:1000, margin:'0 auto', color:'#fff', background:'#0f172a', minHeight:'100vh'}}>
      <h1>🛡️ Admin Dashboard</h1>
      <p>Logged in as <b>{user.name} (@{user.username})</b> <button onClick={onLogout}>Logout</button> <button onClick={()=>window.location.reload()}>⬅️ Back</button></p>
      <div style={{display:'flex', gap:12, margin:'16px 0', flexWrap:'wrap'}}><button onClick={()=>setTab('finance')}>💰 Cash Flow</button><button onClick={()=>setTab('overview')}>Overview</button><button onClick={()=>setTab('users')}>Users ({stats.totalUsers})</button><button onClick={()=>setTab('tournaments')}>Tournaments ({stats.totalTournaments})</button></div>
      {tab==='finance' && (<div><h2>💰 Cash Flow — Auto Stakes: Winner 70% + 2nd 30% + Admin 10%</h2><div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', gap:12}}><div style={{background:'#1e293b', padding:14, borderRadius:12}}><small>GROSS POTS</small><h2>K{fin.gross.toFixed(2)}</h2></div><div style={{background:'#581c87', padding:14, borderRadius:12}}><small>👑 ADMIN FEES</small><h2>K{fin.adminFees.toFixed(2)}</h2></div><div style={{background:'#7f1d1d', padding:14, borderRadius:12}}><small>🧾 TAX</small><h2>K{fin.taxReserve.toFixed(2)}</h2></div><div style={{background:'#1e293b', padding:14, borderRadius:12}}><small>WINNERS PAID</small><h2>K{fin.payouts.toFixed(2)}</h2></div><div style={{background:'#14532d', padding:14, borderRadius:12}}><small>📈 NET PROFIT</small><h2>K{fin.profit.toFixed(2)}</h2></div></div><h3 style={{marginTop:20}}>📋 Ledger</h3><table style={{width:'100%', background:'#1e293b', borderRadius:12, padding:8, fontSize:13}}><thead><tr><th align="left">Date</th><th align="left">Type</th><th align="left">Note</th><th>Pot</th><th>Admin</th><th>Tax</th><th>Winner Gets</th><th>Profit</th></tr></thead><tbody>{fin.transactions.map(t=>(<tr key={t.id}><td>{new Date(t.date).toLocaleString()}</td><td>{t.type}</td><td>{t.note}</td><td>K{t.amount.toFixed(2)}</td><td>K{(t.adminFee||0).toFixed(2)}</td><td>K{(t.tax||0).toFixed(2)}</td><td>K{(t.payout||0).toFixed(2)}</td><td>+K{(t.net||0).toFixed(2)}</td></tr>))}</tbody></table></div>)}
      {tab==='overview' && (<div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12}}><div style={{background:'#1e293b', padding:16, borderRadius:12}}><h2>{stats.totalUsers}</h2><p>Total Users</p></div><div style={{background:'#1e293b', padding:16, borderRadius:12}}><h2>{stats.onlineUsers}</h2><p>Online</p></div><div style={{background:'#1e293b', padding:16, borderRadius:12}}><h2>{stats.totalTournaments}</h2><p>Tournaments</p></div><div style={{background:'#1e293b', padding:16, borderRadius:12}}><h2>{stats.totalGames}</h2><p>Games</p></div></div>)}
      {tab==='users' && (<table style={{width:'100%', background:'#1e293b', borderRadius:12, padding:8}}><thead><tr><th align="left">User</th><th>Role</th><th>Rating</th><th>Games</th><th>Action</th></tr></thead><tbody>{stats.users.map(u=>(<tr key={u.username}><td>{u.name}<br/><small>@{u.username} {u.banned?'🚫 BANNED':''}</small></td><td>{u.role}</td><td>{u.rating}</td><td>{u.games}</td><td><button onClick={()=>ban(u.username)}>{u.banned?'Unban':'Ban'}</button> <button onClick={()=>del(u.username)}>Delete</button></td></tr>))}</tbody></table>)}
      {tab==='tournaments' && stats.tournaments.map(t=>(<div key={t.id} style={{background:'#1e293b', padding:12, borderRadius:12, marginBottom:8}}><b>{t.name}</b> — {t.playerCount}/{t.max} • Stake: K{t.stake||0} • Pot: K{(t.stake||0)*(t.playerCount||0)} • 🥇70% 🥈30%</div>))}
    </div>
  )
}
export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('zed_user')) } catch { return null } })
  const [showAdmin, setShowAdmin] = useState(false); const [page, setPage] = useState('home'); const [tournaments, setTournaments] = useState([]); const [lobbyUsers, setLobbyUsers] = useState([]); const [status, setStatus] = useState(''); const [room, setRoom] = useState(''); const [opponent, setOpponent] = useState(''); const [stats, setStats] = useState(null)
  const [balance, setBalance] = useState(() => Number(localStorage.getItem('zed_balance') || 0)); const [showBalance, setShowBalance] = useState(() => localStorage.getItem('zed_show_balance') !== 'hide')
  const [arenaScore, setArenaScore] = useState(0); const [streak, setStreak] = useState(0); const [gamesPlayed, setGamesPlayed] = useState(0); const [countdown, setCountdown] = useState(0); const [autoPlay, setAutoPlay] = useState(true); const [currentArena, setCurrentArena] = useState('MEGA1'); const [joinedArena, setJoinedArena] = useState(null); const [joinedStake, setJoinedStake] = useState(0)
  const [mobile, setMobile] = useState(() => localStorage.getItem('zed_mobile') || ''); const [mobileVerified, setMobileVerified] = useState(() => localStorage.getItem('zed_mobile_verified') === 'yes'); const [mobileCode, setMobileCode] = useState(''); const [mobileStep, setMobileStep] = useState('input'); const [payAmount, setPayAmount] = useState('5'); const [payProvider, setPayProvider] = useState('MTN'); const [payHistory, setPayHistory] = useState(() => { try { return JSON.parse(localStorage.getItem('zed_pay_history') || '[]') } catch { return [] } })
  const [timeline, setTimeline] = useState(() => { try { return JSON.parse(localStorage.getItem('zed_timeline') || '[]') } catch { return [] } })
  const [timelineFilter, setTimelineFilter] = useState('all'); const [now, setNow] = useState(new Date()); const [lastPayout, setLastPayout] = useState(null)
  const calcPayout = (stake, players) => { const pot = stake * players; const adminFee = pot * 0.10; const tax = adminFee * 0.16; const left = pot - adminFee; const winner = players >= 3 ? left * 0.70 : left; const second = players >= 3 ? left * 0.30 : 0; return { pot, adminFee, tax, adminNet: adminFee - tax, left, winner, second } }
  const addTimeline = (text, type) => { const entry = { id: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), date: new Date().toLocaleDateString(), text, type: type || 'info' }; const next = [entry, ...timeline].slice(0, 50); setTimeline(next); localStorage.setItem('zed_timeline', JSON.stringify(next)) }
  const toggleBalance = () => { const next = !showBalance; setShowBalance(next); localStorage.setItem('zed_show_balance', next ? 'show' : 'hide') }
  const addPayHistory = (entry) => { const next = [entry, ...payHistory].slice(0, 20); setPayHistory(next); localStorage.setItem('zed_pay_history', JSON.stringify(next)) }
  const wsRef = useRef(null)
  const loadTournaments = async () => { try { const r = await fetch('/api/tournaments'); const d = await r.json(); setTournaments(d.tournaments || []) } catch {} }
  const loadStats = async () => { try { const r = await fetch('/api/admin/stats'); const d = await r.json(); setStats(d) } catch {} }
  const loadWallet = async () => { if (!user) return; try { const r = await fetch('/api/pay/wallet?username=' + user.username); const d = await r.json(); if (d.balance !== undefined) { setBalance(d.balance); localStorage.setItem('zed_balance', String(d.balance)) } if (d.mobile) { setMobile(d.mobile); localStorage.setItem('zed_mobile', d.mobile) } if (d.mobileVerified) { setMobileVerified(true); localStorage.setItem('zed_mobile_verified', 'yes') } if (d.history) setPayHistory(d.history) } catch {} }
  const finishGame = (result) => {
    setGamesPlayed(g=>g+1)
    if (result==='win') { setArenaScore(s=>s + (streak>=1 ? 4 : 2)); setStreak(s=>s+1); setStatus(`🏆 You won! +${streak>=1 ? 4 : 2} pts`); addTimeline(`🏆 Won vs ${opponent || 'Opponent'} +${streak>=1 ? 4 : 2} pts`, 'win') }
    else if (result==='draw') { setArenaScore(s=>s+1); setStreak(0); setStatus('🤝 Draw! +1 pt'); addTimeline(`🤝 Draw vs ${opponent || 'Opponent'} +1 pt`, 'draw') }
    else { setStreak(0); setStatus('😔 Lost. +0 pts'); addTimeline(`😔 Lost vs ${opponent || 'Opponent'}`, 'loss') }
    wsRef.current?.send(JSON.stringify({ type: 'game-finished', tournamentId: currentArena }))
    if (autoPlay) { setCountdown(3); let c = 3; const iv = setInterval(()=>{ c--; setCountdown(c); if(c<=0){ clearInterval(iv); setStatus('🔍 Finding next opponent...'); wsRef.current?.send(JSON.stringify({ type: 'game-finished', tournamentId: currentArena })); } }, 1000) }
  }
  useEffect(() => { const t = setInterval(()=>setNow(new Date()), 1000); return ()=>clearInterval(t) }, [])
  useEffect(() => {
    if (!user) return
    loadTournaments(); loadStats(); loadWallet()
    const interval = setInterval(() => { loadTournaments(); loadStats(); loadWallet() }, 5000)
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${proto}//${location.host}/ws/lobby`)
    wsRef.current = ws
    ws.onopen = () => { ws.send(JSON.stringify({ type: 'join-lobby', name: user.name, rating: user.rating })) }
    const heartbeat = setInterval(() => { if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'ping' })) }, 20000)
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data)
      if (m.type === 'lobby') { setTournaments(m.tournaments || []); setLobbyUsers(m.users || []) }
      if (m.type === 'waiting-for-opponent') setStatus('🔍 ' + m.message)
      if (m.type === 'stake-deducted') { setBalance(m.balance); localStorage.setItem('zed_balance', String(m.balance)); setStatus(`💰 K${m.stake} deducted automatically — Joined ${m.arenaName} — Pot now K${m.pot} — Good luck!`); addTimeline(`💰 Auto Stake: K${m.stake} deducted — Joined ${m.arenaName} — Pot K${m.pot}`, 'money'); loadWallet() }
      if (m.type === 'stake-failed') { setStatus('❌ ' + m.message); if (m.message.includes('balance')) setPage('wallet') }
      if (m.type === 'game-start') { setCountdown(0); setStatus(`🎉 Opponent found! vs ${m.opponent} — You are ${m.color === 'w' ? 'White' : 'Black'}`); setRoom(m.room); setOpponent(m.opponent); setPage('play'); addTimeline(`🎯 Game ${gamesPlayed+1} Started vs ${m.opponent}`, 'start') }
      if (m.type === 'tournament-started') { setStatus('🏆 Tournament Started! Room: ' + m.room); setRoom(m.room); setPage('play') }
      if (m.type === 'stake-settled') { setLastPayout(m); setStatus(`💰 Auto-Paid! 🥇 ${m.winner} K${m.winnerPayout} • 🥈 ${m.second || '—'} K${m.secondPayout || 0} • Admin K${m.adminFee}`); addTimeline(`💰 Auto-Paid: 🥇 ${m.winner} K${m.winnerPayout} • 🥈 ${m.second || '-'} K${m.secondPayout || 0}`, 'money'); loadWallet() }
      if (m.type === 'wallet-updated') { setBalance(m.balance); localStorage.setItem('zed_balance', String(m.balance)); loadWallet() }
    }
    return () => { clearInterval(interval); clearInterval(heartbeat); ws.close() }
  }, )
  if (!user) return <Auth onLogin={setUser} />
  if (showAdmin && user.role === 'admin') return <AdminDashboard user={user} onLogout={() => { localStorage.removeItem('zed_user'); setUser(null); setShowAdmin(false) }} />
  const joinTournament = async (id, name, stake) => {
    const s = stake || 5
    if (s < 5) { alert('Min stake is K5'); return }
    if (balance < s) { alert(`Not enough! You have K${balance.toFixed(2)}, need K${s}. Deposit first.`); setPage('wallet'); return }
    if (!confirm(`Join ${name}?\n\nK${s} will be deducted AUTOMATICALLY from your balance now.\nBalance: K${balance.toFixed(2)} -> K${(balance - s).toFixed(2)}\n\nWinner gets 70% • 2nd gets 30%`)) return
    setCurrentArena(id); setJoinedArena(id); setJoinedStake(s)
    // AUTOMATIC: Call API to deduct instantly, then join WS
    const r = await fetch('/api/pay/join-arena', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username, tournamentId: id, stake: s }) })
    const d = await r.json()
    if (!r.ok) { setStatus('❌ ' + (d.error || 'Join failed')); if (d.error?.includes('balance')) setPage('wallet'); return }
    setBalance(d.balance); localStorage.setItem('zed_balance', String(d.balance))
    setStatus(`💰 K${s} deducted automatically — Joined ${name} — Pot now K${d.pot} — Finding opponent...`)
    addTimeline(`💰 Auto Stake: K${s} deducted — Joined ${name} — Pot K${d.pot}`, 'money')
    wsRef.current?.send(JSON.stringify({ type: 'join-tournament', tournamentId: id, username: user.username, stake: s }))
  }
  const leaveArena = () => { if (!joinedArena) return; if (!confirm('Leave arena? Your K' + joinedStake + ' stake is NOT refunded — it stays in pot.')) return; setJoinedArena(null); setJoinedStake(0); setStatus('Left arena. Stake stays in pot.'); addTimeline('🚪 Left arena — stake stays in pot', 'info') }
  const createTournament = () => { const name = prompt('Tournament name?'); if (!name) return; const stake = Number(prompt('Stake? Min K5 — e.g. 5, 10, 20, 50, 100') || '5'); if (stake < 5) { alert('Min stake is K5'); return } wsRef.current?.send(JSON.stringify({ type: 'create-rated-tournament', name, format: 'arena', timeControl: 'blitz', rated: true, max: 16, stake })); setStatus('✅ Arena K' + stake + ' created — Auto stakes ON!'); addTimeline(`➕ Created Arena: ${name} — Stake K${stake} — Auto`, 'join') }
  const logout = () => { localStorage.removeItem('zed_user'); setUser(null) }
  const requestMobileCode = async () => { if (!mobile || mobile.length < 10) { setStatus('Enter valid mobile'); return } const r = await fetch('/api/pay/request-mobile-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username, mobile }) }); const d = await r.json(); if (!r.ok) { setStatus('❌ ' + d.error); return } setMobileStep('verify'); setStatus('📱 Code sent to ' + mobile) }
  const verifyMobile = async () => { const r = await fetch('/api/pay/verify-mobile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username, mobile, code: mobileCode }) }); const d = await r.json(); if (!r.ok) { setStatus('❌ ' + d.error); return } setMobileVerified(true); localStorage.setItem('zed_mobile_verified', 'yes'); localStorage.setItem('zed_mobile', mobile); setMobileStep('done'); setStatus('✅ Mobile verified!') }
  const doDeposit = async () => { if (!mobileVerified) { setStatus('⚠️ Verify mobile first.'); setPage('wallet'); return } const amt = Number(payAmount); if (!amt || amt < 5) { setStatus('Min deposit K5'); return } setStatus('⏳ Sending MoMo prompt...'); const r = await fetch('/api/pay/deposit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username, amount: amt, mobile, provider: payProvider }) }); const d = await r.json(); if (!r.ok) { setStatus('❌ ' + d.error); return } setStatus('📱 ' + (d.message || 'Check phone PIN')); addPayHistory({ id: Date.now(), type: 'deposit', amount: amt, provider: payProvider, status: d.status || 'pending', date: new Date().toLocaleString() }); addTimeline(`⬇️ Deposit K${amt} via ${payProvider}`, 'money') }
  const doWithdraw = async () => { if (!mobileVerified) { setStatus('⚠️ Verify mobile first.'); setPage('wallet'); return } const amt = Number(payAmount); if (!amt || amt < 5) { setStatus('Min withdraw K5'); return } if (amt > balance) { setStatus('❌ Not enough balance'); return } if (!confirm(`Withdraw K${amt} to ${mobile}?`)) return; const r = await fetch('/api/pay/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username, amount: amt, mobile, provider: payProvider }) }); const d = await r.json(); if (!r.ok) { setStatus('❌ ' + d.error); return } setStatus('✅ Withdraw sent!'); addPayHistory({ id: Date.now(), type: 'withdraw', amount: amt, provider: payProvider, status: d.status || 'processing', date: new Date().toLocaleString() }); addTimeline(`⬆️ Withdraw K${amt}`, 'money'); loadWallet() }
  const btn = (active) => ({ padding: '10px 16px', border: 0, borderRadius: 10, fontWeight: 700, cursor: 'pointer', background: active ? '#22c55e' : '#1e293b', color: '#fff' })
  const card = { background: '#1e293b', padding: 16, borderRadius: 14, marginBottom: 12 }
  const totalInArenas = tournaments.reduce((a,t)=>a+(t.playerCount||0),0)
  const totalWaiting = tournaments.reduce((a,t)=>a+(t.waitingCount||0),0)
  const filteredTimeline = timelineFilter === 'all' ? timeline : timeline.filter(t=>t.type===timelineFilter)
  const getNextArenaTime = () => { const n = new Date(); n.setMinutes(0,0,0); n.setHours(n.getHours()+1); return n }
  const nextArena = getNextArenaTime(); const minsToNext = Math.floor((nextArena - now)/60000); const secsToNext = Math.floor(((nextArena - now)%60000)/1000)
  const TimelineView = () => (<div style={card}><h3 style={{marginTop:0}}>🕒 Arena Timeline — Live</h3><div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:12}}><button style={btn(timelineFilter==='all')} onClick={()=>setTimelineFilter('all')}>All</button><button style={btn(timelineFilter==='win')} onClick={()=>setTimelineFilter('win')}>🏆 Wins</button><button style={btn(timelineFilter==='money')} onClick={()=>setTimelineFilter('money')}>💰 Money</button></div><div style={{background:'#0f172a', padding:12, borderRadius:10, marginBottom:12, borderLeft:'4px solid #eab308'}}><b>⏰ NEXT ARENA:</b> Mega K5 — {nextArena.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} — in <b>{minsToNext}m {secsToNext}s</b><br/><button style={{...btn(true), marginTop:8}} onClick={()=>joinTournament('MEGA1', 'Mega K5 Arena', 5)}>✅ Pre-Join K5 — Auto Deduct</button></div>{filteredTimeline.length===0 ? <p style={{fontSize:13, opacity:0.7}}>No activity yet. Join a K5 arena to start.</p> : filteredTimeline.map(e=>(<div key={e.id} style={{display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid #334155', fontSize:13}}><span style={{color:'#eab308', fontWeight:700, minWidth:50}}>{e.time}</span><span style={{flex:1}}>{e.text}</span></div>))}</div>)
  return (
    <div style={{ background: '#0f172a', color: '#fff', minHeight: '100vh', padding: 16, paddingTop: 70, maxWidth: 1000, margin: '0 auto', position: 'relative' }}>
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 999, display: 'flex', gap: 6, alignItems: 'center', background: '#1e293b', padding: '8px 10px', borderRadius: 12, border: '2px solid #eab308' }}><span>💰</span><span style={{fontWeight:800}}>{showBalance ? `K${balance.toFixed(2)}` : 'K****'}</span><button onClick={toggleBalance} style={{background:'#0f172a', color:'#fff', border:0, borderRadius:8, padding:'6px 10px', cursor:'pointer'}}>{showBalance ? '👁️' : '🙈'}</button><button onClick={()=>setPage('wallet')} style={{background:'#22c55e', color:'#fff', border:0, borderRadius:8, padding:'6px 10px', cursor:'pointer', fontWeight:700}}>Wallet</button></div>
      <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:16}}><h1 style={{margin:0, marginRight:8}}>♔ Zed Gambit</h1><button style={btn(page==='home')} onClick={()=>setPage('home')}>🏠 Home</button><button style={btn(page==='play')} onClick={()=>setPage('play')}>♟️ Play Now</button><button style={btn(page==='tournaments')} onClick={()=>setPage('tournaments')}>🏆 Arenas</button><button style={btn(page==='stake')} onClick={()=>setPage('stake')}>💰 Stake Games</button><button style={btn(page==='wallet')} onClick={()=>setPage('wallet')}>👛 Wallet</button><button style={btn(page==='timeline')} onClick={()=>setPage('timeline')}>🕒 Timeline</button><button style={btn(page==='leaderboard')} onClick={()=>setPage('leaderboard')}>📊 Leaderboard</button>{user.role==='admin' && <button style={{...btn(false), background:'#a855f7'}} onClick={()=>setShowAdmin(true)}>🛡️ Admin</button>}<button style={{...btn(false), background:'#ef4444'}} onClick={logout}>🚪 Logout</button></div>
      <div style={{background:'#1e293b', padding:12, borderRadius:10, marginBottom:16, fontSize:14}}>👤 <b>{user.name}</b> (@{user.username}) • Rating: <b>{user.rating}</b> • Online: <b>{totalInArenas} in arenas</b><br/>💰 Balance: <b>{showBalance ? `K${balance.toFixed(2)}` : 'K****'}</b> • 📱 {mobileVerified ? mobile + ' ✅' : 'Not verified ⚠️'} • 🕒 {now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}<br/>🔥 Endless: <b>{arenaScore} pts</b> • {gamesPlayed} games • Streak: {streak} • Min Bet <b>K5</b> • <b>AUTO STAKES ON</b> {joinedArena && <><br/>🎯 Joined: <b>{joinedArena}</b> — Stake <b>K{joinedStake}</b> already deducted — <button onClick={leaveArena} style={{background:'#ef4444', color:'#fff', border:0, borderRadius:6, padding:'2px 8px', cursor:'pointer'}}>Leave (No Refund)</button></>}{status && <div style={{marginTop:6}}>📢 {status}</div>}{lastPayout && <div style={{marginTop:8, background:'#14532d', padding:10, borderRadius:8}}>💰 <b>Last Auto-Payout:</b> 🥇 {lastPayout.winner} K{lastPayout.winnerPayout} • 🥈 {lastPayout.second || 'No 2nd'} K{lastPayout.secondPayout || 0} • Admin K{lastPayout.adminFee}</div>}{countdown>0 && <div style={{marginTop:6, fontSize:18, fontWeight:800, color:'#22c55e'}}>⏳ Next game in {countdown}...</div>}{room && <div style={{marginTop:6}}>🎲 Room: <b>{room}</b> {opponent && <>vs {opponent}</>}</div>}</div>
      {page==='home' && (<div><h2>Welcome to Zed Gambit 🇿🇲 — Auto Stakes from K5</h2><p>Tap Join → K5 deducted automatically → Play → Winner 70% + 2nd 30% auto-paid. No admin needed.</p><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}><button style={{...btn(false), padding:20, fontSize:18, background:'#22c55e'}} onClick={()=>setPage('tournaments')}>🏆 Join K5 Arena — Auto</button><button style={{...btn(false), padding:20, fontSize:18, background:'#eab308', color:'#000'}} onClick={()=>setPage('wallet')}>👛 Deposit from K5</button><button style={{...btn(false), padding:20, fontSize:18}} onClick={()=>setPage('play')}>♟️ Quick Play</button><button style={{...btn(false), padding:20, fontSize:18}} onClick={()=>setPage('timeline')}>🕒 View Timeline</button></div><div style={{...card, marginTop:16, border:'2px solid #22c55e'}}><h3 style={{margin:0}}>⚡ How Auto Stakes Work</h3><p style={{fontSize:13}}>1. You tap Join K5 → 2. System checks balance → 3. K5 deducted instantly → 4. You play → 5. Winner + 2nd auto-paid to Wallet.<br/>Leave = No refund. Your stake stays in pot.</p><div style={{display:'flex', gap:8, flexWrap:'wrap'}}><button style={{...btn(true)}} onClick={()=>joinTournament('MEGA1', 'Mega K5 Arena', 5)}>🌍 Join K5 Mega — Auto Deduct K5</button><button style={{...btn(false), background:'#eab308', color:'#000'}} onClick={()=>joinTournament('BLITZ1', 'Blitz K10 Arena', 10)}>⚡ Join K10 — Auto Deduct K10</button><button style={{...btn(false)}} onClick={()=>joinTournament('RAPID1', 'Rapid K20 Arena', 20)}>🚀 Join K20 — Auto Deduct K20</button></div></div><h3 style={{marginTop:20}}>🔥 Live Arenas — From K5 — Auto</h3>{tournaments.map(t=>{ const p = calcPayout(t.stake||5, Math.max(t.playerCount||1, 3)); return (<div key={t.id} style={card}><b>{t.name}</b> — Stake <b>K{t.stake||5}</b> • {t.playerCount}/{t.max} • Waiting: {t.waitingCount} • Pot: <b>K{(t.stake||5)*(t.playerCount||0)}</b><br/><small>💰 🥇 Winner ~K{p.winner.toFixed(2)} • 🥈 2nd ~K{p.second.toFixed(2)} • Auto Deduct</small><br/><button style={{...btn(true), marginTop:8}} onClick={()=>joinTournament(t.id, t.name, t.stake||5)}>✅ Join K{t.stake||5} — Auto Deduct K{t.stake||5}</button></div>) })}<TimelineView /></div>)}
      {page==='timeline' && (<div><h2>🕒 Arena Timeline</h2><TimelineView /></div>)}
      {page==='play' && (<div style={card}><h2>♟️ Play Now — Auto Stake K{joinedStake||5}</h2>{joinedArena && <p style={{background:'#14532d', padding:10, borderRadius:8}}>✅ You are IN {joinedArena} — K{joinedStake} already paid — Pot is building.</p>}{room ? (<div><p>Room <b>{room}</b> vs <b>{opponent}</b></p><p>Score: {arenaScore} pts • Streak: {streak}</p><div style={{display:'flex', gap:8, flexWrap:'wrap'}}><button style={{...btn(true)}} onClick={()=>finishGame('win')}>🏆 I Won</button><button style={btn(false)} onClick={()=>finishGame('draw')}>🤝 Draw</button><button style={{...btn(false), background:'#ef4444'}} onClick={()=>finishGame('loss')}>😔 I Lost</button></div>{countdown>0 && <p style={{fontSize:20, fontWeight:800, color:'#22c55e'}}>Next game in {countdown}...</p>}</div>) : (<div><p>No game yet.</p><button style={btn(true)} onClick={()=>joinTournament('MEGA1', 'Mega K5 Arena', 5)}>🌍 Join K5 Mega — Auto Deduct</button></div>)}<div style={{marginTop:16}}><button style={btn(false)} onClick={()=>{const r=prompt('Enter Room Code:'); if(r) setRoom(r)}}>🔑 Join by Room Code</button></div></div>)}
      {page==='tournaments' && (<div><h2>🏆 Arenas — Auto Stakes From K5</h2><button style={{...btn(true), marginBottom:12}} onClick={createTournament}>➕ Create Arena (Min K5)</button><button style={{...btn(false), marginLeft:8, marginBottom:12}} onClick={loadTournaments}>🔄 Refresh</button>{tournaments.map(t=>{ const p = calcPayout(t.stake||5, Math.max(t.playerCount||1, 3)); return (<div key={t.id} style={card}><b>{t.name}</b><br/><small>Stake K{t.stake||5} • {t.playerCount}/{t.max} • {t.waitingCount} waiting • Pot K{(t.stake||5)*(t.playerCount||0)}</small><br/><small>🥇 K{p.winner.toFixed(2)} • 🥈 K{p.second.toFixed(2)}</small><br/><button style={{...btn(true), marginTop:8}} onClick={()=>joinTournament(t.id, t.name, t.stake||5)}>✅ Join K{t.stake||5} — Auto Deduct</button></div>) })}<TimelineView /></div>)}
      {page==='wallet' && (<div><h2>👛 Wallet — Deposit from K5</h2><div style={card}><h3 style={{margin:0}}>Balance: {showBalance ? `K${balance.toFixed(2)}` : 'K****'}</h3><p style={{fontSize:12, opacity:0.7}}>Min Deposit K5 • Min Withdraw K5 • PawaPay: MTN • Airtel • Zamtel</p></div><div style={card}><h3>📱 Verify Mobile</h3>{mobileVerified ? (<p>✅ Verified: <b>{mobile}</b></p>) : (<div><div style={{display:'flex', gap:8, flexWrap:'wrap'}}><input placeholder="0977123456" value={mobile} onChange={e=>setMobile(e.target.value)} style={{padding:10, borderRadius:8, flex:1}} /><button style={btn(true)} onClick={requestMobileCode}>Send SMS Code</button></div>{mobileStep==='verify' && (<div style={{display:'flex', gap:8, marginTop:10}}><input placeholder="Enter code" value={mobileCode} onChange={e=>setMobileCode(e.target.value)} style={{padding:10, borderRadius:8, flex:1}} /><button style={{...btn(true), background:'#eab308', color:'#000'}} onClick={verifyMobile}>Verify</button></div>)}</div>)}</div><div style={card}><h3>💰 Deposit / Withdraw — From K5</h3><div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:10}}><select value={payProvider} onChange={e=>setPayProvider(e.target.value)} style={{padding:10, borderRadius:8}}><option value="MTN">MTN MoMo</option><option value="Airtel">Airtel Money</option><option value="Zamtel">Zamtel Kwacha</option></select><input placeholder="Amount K" value={payAmount} onChange={e=>setPayAmount(e.target.value)} style={{padding:10, borderRadius:8, width:120}} /><button style={{...btn(false), background:'#22c55e'}} onClick={()=>setPayAmount('5')}>K5</button><button style={{...btn(false), background:'#22c55e'}} onClick={()=>setPayAmount('10')}>K10</button><button style={{...btn(false), background:'#22c55e'}} onClick={()=>setPayAmount('50')}>K50</button><button style={{...btn(false), background:'#22c55e'}} onClick={()=>setPayAmount('100')}>K100</button></div><div style={{display:'flex', gap:8, flexWrap:'wrap'}}><button style={{...btn(true), padding:14, fontSize:16, flex:1}} onClick={doDeposit}>⬇️ Deposit K{payAmount||0}</button><button style={{...btn(false), background:'#eab308', color:'#000', padding:14, fontSize:16, flex:1}} onClick={doWithdraw}>⬆️ Withdraw K{payAmount||0}</button></div></div><div style={card}><h3>📋 Payment History</h3>{payHistory.map(h=>(<div key={h.id} style={{display:'flex', justifyContent:'space-between', fontSize:13, padding:'6px 0', borderBottom:'1px solid #334155'}}><span>{h.type==='deposit' ? '⬇️ Deposit' : '⬆️ Withdraw'} • {h.provider} • {h.date}</span><span><b>K{h.amount}</b> • {h.status}</span></div>))}</div></div>)}
      {page==='stake' && (<div><h2>💰 Stake Games — Auto From K5 — 🥇70% 🥈30%</h2><p style={{fontSize:13}}>Your Balance: <b>K{balance.toFixed(2)}</b> — Tap Join, money deducted automatically.</p>{tournaments.filter(t=>(t.stake||0)>=5).map(t=>{ const p = calcPayout(t.stake||5, Math.max(t.playerCount||1, 3)); return (<div key={t.id} style={card}><b>{t.name}</b> — Stake <b>K{t.stake}</b> • {t.playerCount}/{t.max} • Pot K{(t.stake||5)*(t.playerCount||0)}<br/><small>🥇 Winner ~K{p.winner.toFixed(2)} • 🥈 2nd ~K{p.second.toFixed(2)}</small><br/><button style={{...btn(false), background:'#eab308', color:'#000', marginTop:8}} onClick={()=>joinTournament(t.id, t.name, t.stake)}>💰 Join K{t.stake} — Auto Deduct</button></div>) })}<div style={card}><h3>📊 Payout Table — If 10 Players Join</h3><table style={{width:'100%', fontSize:13}}><thead><tr><th align="left">Stake</th><th>Pot</th><th>🥇 Winner</th><th>🥈 2nd</th><th>Admin</th></tr></thead><tbody>{[5,10,20,50,100].map(s=>{ const p=calcPayout(s,10); return (<tr key={s}><td>K{s}</td><td>K{p.pot}</td><td><b>K{p.winner.toFixed(2)}</b></td><td><b>K{p.second.toFixed(2)}</b></td><td>K{p.adminFee.toFixed(2)}</td></tr>) })}</tbody></table></div></div>)}
      {page==='leaderboard' && (<div><h2>📊 Leaderboard — Auto Payouts</h2><button style={btn(false)} onClick={loadStats}>🔄 Refresh</button>{stats?.users?.sort((a,b)=>b.rating-a.rating).map((u,i)=>(<div key={u.username} style={card}>#{i+1} <b>{u.name}</b> (@{u.username}) — Rating {u.rating} • Games {u.games} • Wins {u.wins} {i===0 ? '🥇' : i===1 ? '🥈' : ''}</div>))}<div style={card}><b>Your Arena:</b> {arenaScore} pts • {gamesPlayed} games • Streak {streak}</div></div>)}
      <p style={{fontSize:12, opacity:0.6, textAlign:'center', marginTop:20}}>Zed Gambit • Auto Stakes from K5 • 🥇 70% • 🥈 30% • Admin 10% • Made in Zambia 🇿🇲</p>
    </div>
  )
}


Step 2: Add to worker.mjs — Paste BEFORE /api/tournaments

This is the brain that deducts + pays automatically:

js
if (url.pathname === '/api/pay/join-arena' && request.method === 'POST') {
  const b = await request.json().catch(()=>({}));
  const u = this.authUsers.get((b.username||'').toLowerCase());
  if (!u) return json({ error: 'User not found' }, 404);
  const stake = Number(b.stake) || 0;
  if (stake < 5) return json({ error: 'Min stake is K5' }, 400);
  if ((u.balance||0) < stake) return json({ error: 'Not enough balance. You have K' + (u.balance||0).toFixed(2) + ', need K' + stake + '. Deposit first.' }, 400);
  // Find arena
  const t = this.tournaments.find(x => x.id === b.tournamentId);
  if (!t) return json({ error: 'Arena not found' }, 404);
  if ((t.joined||[]).includes(u.username)) return json({ error: 'Already joined this arena' }, 400);
  // AUTOMATIC DEDUCT
  u.balance = (u.balance||0) - stake;
  if (!t.joined) t.joined = [];
  t.joined.push(u.username);
  if (!t.pot) t.pot = 0;
  t.pot += stake;
  if (!u.payHistory) u.payHistory = [];
  u.payHistory.unshift({ id: 'STAKE-'+Date.now(), type: 'stake', amount: stake, provider: 'Arena '+t.name, status: 'deducted', date: new Date().toISOString() });
  console.log('AUTO STAKE: ' + u.username + ' paid K' + stake + ' for ' + t.name + ' Pot now K' + t.pot);
  return json({ ok: true, balance: u.balance, pot: t.pot, stake, arenaName: t.name });
}
if (url.pathname === '/api/pay/settle-arena' && request.method === 'POST') {
  const b = await request.json().catch(()=>({}));
  const t = this.tournaments.find(x => x.id === b.tournamentId);
  if (!t) return json({ error: 'Arena not found' }, 404);
  const players = t.joined || [];
  const pot = t.pot || (players.length * (t.stake||5));
  const adminFee = pot * 0.10;
  const tax = adminFee * 0.16;
  const left = pot - adminFee;
  const winnerName = b.winner; const secondName = b.second;
  const winnerPayout = players.length >= 3 ? left * 0.70 : left;
  const secondPayout = players.length >= 3 ? left * 0.30 : 0;
  const w = this.authUsers.get((winnerName||'').toLowerCase());
  if (w) w.balance = (w.balance||0) + winnerPayout;
  const s = secondName ? this.authUsers.get(secondName.toLowerCase()) : null;
  if (s) s.balance = (s.balance||0) + secondPayout;
  this.addTransaction('stake_win', pot, 'Arena '+t.name+' settled: Winner '+winnerName+' K'+winnerPayout.toFixed(2)+' 2nd '+ (secondName||'-') +' K'+secondPayout.toFixed(2), winnerName);
  // Reset pot for next round
  t.pot = 0; t.joined = [];
  return json({ ok: true, pot, adminFee, tax, winnerPayout, secondPayout });
}


