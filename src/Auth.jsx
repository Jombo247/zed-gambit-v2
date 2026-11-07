
import { useState } from 'react'
export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    const url = mode==='login' ? '/api/auth/login' : '/api/auth/register'
    const body = mode==='login' ? { username, password } : { name, username, password }
    const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
    const d = await r.json()
    if (!r.ok) { setErr(d.error); return }
    localStorage.setItem('zed_user', JSON.stringify(d.user))
    localStorage.setItem('zed_token', d.token)
    onLogin(d.user)
  }
  return (
    <div style={{maxWidth:400, margin:'40px auto', padding:20, background:'#1e293b', borderRadius:16, color:'#fff'}}>
      <h2>{mode==='login' ? '🔐 Login' : '📝 Register'}</h2>
      <p style={{fontSize:13, opacity:0.7}}>Zed Gambit — Rated Chess</p>
      <form onSubmit={submit} style={{display:'flex', flexDirection:'column', gap:10}}>
        {mode==='register' && <input placeholder="Full Name e.g. Themba" value={name} onChange={e=>setName(e.target.value)} style={{padding:10, borderRadius:8}} />}
        <input placeholder="Username e.g. themba" value={username} onChange={e=>setUsername(e.target.value)} style={{padding:10, borderRadius:8}} />
        <input type="password" placeholder="Password (min 4)" value={password} onChange={e=>setPassword(e.target.value)} style={{padding:10, borderRadius:8}} />
        {err && <div style={{color:'#f87171', fontSize:13}}>{err}</div>}
        <button style={{padding:12, background:'#22c55e', border:0, borderRadius:8, fontWeight:700}}>{mode==='login' ? 'Login' : 'Create Account'}</button>
      </form>
      <p style={{fontSize:13, textAlign:'center', marginTop:12}}>{mode==='login' ? "No account? " : "Have account? "}<a href="#" onClick={e=>{e.preventDefault(); setMode(mode==='login'?'register':'login')}} style={{color:'#60a5fa'}}>{mode==='login'?'Register':'Login'}</a></p>
      <p style={{fontSize:11, opacity:0.6, textAlign:'center'}}>Admin test: admin / ZedAdmin2026!</p>
    </div>
  )
}


2. Create file: src/AdminDashboard.jsx — New File, Paste ONLY this

jsx
import { useState, useEffect } from 'react'

export default function AdminDashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null)
  const [fin, setFin] = useState(null)
  const [tab, setTab] = useState('finance')
  const [txType, setTxType] = useState('stake_win')
  const [txAmount, setTxAmount] = useState('')
  const [txNote, setTxNote] = useState('')
  const load = async () => {
    const s = await (await fetch('/api/admin/stats')).json(); setStats(s)
    const f = await (await fetch('/api/admin/finance')).json(); setFin(f)
  }
  useEffect(()=>{ load(); const i=setInterval(load, 5000); return ()=>clearInterval(i) },[])
  const ban = async (username) => { await fetch('/api/admin/ban',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username})}); load() }
  const del = async (username) => { if(!confirm('Delete '+username+'?')) return; await fetch('/api/admin/delete-user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username})}); load() }
  const addTx = async (e) => {
    e.preventDefault(); if(!txAmount) return
    await fetch('/api/admin/add-transaction',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type: txType, amount: Number(txAmount), note: txNote, username: user.username})})
    setTxAmount(''); setTxNote(''); load()
  }
  if (!stats || !fin) return <div style={{padding:20, color:'#fff'}}>Loading admin...</div>
  return (
    <div style={{padding:16, maxWidth:1000, margin:'0 auto', color:'#fff', background:'#0f172a', minHeight:'100vh'}}>
      <h1>🛡️ Admin Dashboard</h1>
      <p>Logged in as <b>{user.name} (@{user.username})</b> — {user.role} <button onClick={onLogout}>Logout</button> <button onClick={()=>window.location.reload()}>⬅️ Back to App</button></p>
      <div style={{display:'flex', gap:12, margin:'16px 0', flexWrap:'wrap'}}>
        <button onClick={()=>setTab('finance')}>💰 Cash Flow / Tax / Admin %</button>
        <button onClick={()=>setTab('overview')}>Overview</button>
        <button onClick={()=>setTab('users')}>Users ({stats.totalUsers})</button>
        <button onClick={()=>setTab('tournaments')}>Tournaments ({stats.totalTournaments})</button>
      </div>
      {tab==='finance' && (
        <div>
          <h2>💰 Cash Flow — Admin % From Stake Won</h2>
          <p style={{fontSize:13, opacity:0.7}}>Admin Fee: {Math.round(fin.adminFeeRate*100)}% of pot • Tax: {Math.round(fin.taxRate*100)}% on admin fee only</p>
          <div style={{background:'#1e293b', padding:14, borderRadius:12, marginBottom:12, fontSize:14}}>
            <b>Example:</b> 2 players stake K100 each = Pot K200 → Admin Fee K20 (10%) → Tax K3.20 → Winner gets K180 → Your Profit K16.80
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', gap:12}}>
            <div style={{background:'#1e293b', padding:14, borderRadius:12}}><small>GROSS POTS</small><h2>K{fin.gross.toFixed(2)}</h2></div>
            <div style={{background:'#581c87', padding:14, borderRadius:12, border:'2px solid #a855f7'}}><small>👑 ADMIN FEES</small><h2>K{fin.adminFees.toFixed(2)}</h2></div>
            <div style={{background:'#7f1d1d', padding:14, borderRadius:12, border:'2px solid #ef4444'}}><small>🧾 TAX - LOCKED</small><h2>K{fin.taxReserve.toFixed(2)}</h2><p style={{fontSize:11}}>For ZRA. Do NOT spend.</p></div>
            <div style={{background:'#1e293b', padding:14, borderRadius:12}}><small>WINNERS PAID</small><h2>K{fin.payouts.toFixed(2)}</h2></div>
            <div style={{background:'#14532d', padding:14, borderRadius:12, border:'2px solid #22c55e'}}><small>📈 NET PROFIT</small><h2>K{fin.profit.toFixed(2)}</h2></div>
          </div>
          <div style={{background:'#1e293b', padding:16, borderRadius:12, marginTop:16}}>
            <h3>+ Record Stake Game / Transaction</h3>
            <form onSubmit={addTx} style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              <select value={txType} onChange={e=>setTxType(e.target.value)} style={{padding:10, borderRadius:8}}>
                <option value="stake_win">Stake Game Won - Amount = Total Pot (e.g. 200 for 2x100)</option>
                <option value="entry_fee">Entry Fee (Taxed)</option>
                <option value="payout">Manual Payout</option>
              </select>
              <input placeholder="Pot / Amount K e.g. 200" value={txAmount} onChange={e=>setTxAmount(e.target.value)} style={{padding:10, borderRadius:8}} />
              <input placeholder="Note e.g. Themba won K100 stake" value={txNote} onChange={e=>setTxNote(e.target.value)} style={{padding:10, borderRadius:8, flex:1}} />
              <button style={{padding:10, background:'#22c55e', border:0, borderRadius:8, fontWeight:700}}>Add</button>
            </form>
          </div>
          <h3 style={{marginTop:20}}>📋 Ledger</h3>
          <table style={{width:'100%', background:'#1e293b', borderRadius:12, padding:8, fontSize:13}}>
            <thead><tr><th align="left">Date</th><th align="left">Type</th><th align="left">Note</th><th>Pot</th><th>Admin Fee</th><th>Tax</th><th>Winner Gets</th><th>Your Profit</th></tr></thead>
            <tbody>{fin.transactions.map(t=>(
              <tr key={t.id}><td>{new Date(t.date).toLocaleString()}</td><td>{t.type}</td><td>{t.note}</td><td>K{t.amount.toFixed(2)}</td><td style={{color:'#c084fc'}}>K{(t.adminFee||0).toFixed(2)}</td><td style={{color:'#f87171'}}>K{(t.tax||0).toFixed(2)}</td><td>K{(t.payout||0).toFixed(2)}</td><td style={{color:'#4ade80'}}>+K{(t.net||0).toFixed(2)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {tab==='overview' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12}}>
          <div style={{background:'#1e293b', padding:16, borderRadius:12}}><h2>{stats.totalUsers}</h2><p>Total Users</p></div>
          <div style={{background:'#1e293b', padding:16, borderRadius:12}}><h2>{stats.onlineUsers}</h2><p>Online Now</p></div>
          <div style={{background:'#1e293b', padding:16, borderRadius:12}}><h2>{stats.totalTournaments}</h2><p>Tournaments</p></div>
          <div style={{background:'#1e293b', padding:16, borderRadius:12}}><h2>{stats.totalGames}</h2><p>Games Started</p></div>
        </div>
      )}
      {tab==='users' && (
        <table style={{width:'100%', background:'#1e293b', borderRadius:12, padding:8}}>
          <thead><tr><th align="left">User</th><th>Role</th><th>Rating</th><th>Games</th><th>Action</th></tr></thead>
          <tbody>{stats.users.map(u=>(
            <tr key={u.username}><td>{u.name}<br/><small>@{u.username} {u.banned?'🚫 BANNED':''}</small></td><td>{u.role}</td><td>{u.rating}</td><td>{u.games}</td>
            <td><button onClick={()=>ban(u.username)}>{u.banned?'Unban':'Ban'}</button> <button onClick={()=>del(u.username)}>Delete</button></td></tr>
          ))}</tbody>
        </table>
      )}
      {tab==='tournaments' && stats.tournaments.map(t=>(
        <div key={t.id} style={{background:'#1e293b', padding:12, borderRadius:12, marginBottom:8}}>
          <b>{t.name}</b> — {t.playerCount}/{t.max} • Waiting: {t.waitingCount} • Stake: K{t.stake||0} • {t.format} • {t.timeControl} • {t.rated?'Rated':'Casual'}
        </div>
      ))}
    </div>
  )
}


