
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


