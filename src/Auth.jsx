
import { useState } from 'react'
export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('form') // form | verify
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setInfo('')
    if (mode==='login') {
      const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, password }) })
      const d = await r.json()
      if (!r.ok) {
        if (d.needVerify) { setPendingEmail(d.email); setStep('verify'); setInfo('Your email is not verified yet. Enter the code sent to '+d.email); return }
        setErr(d.error); return
      }
      localStorage.setItem('zed_user', JSON.stringify(d.user))
      localStorage.setItem('zed_token', d.token)
      onLogin(d.user)
      return
    }
    // register
    if (!email.includes('@')) { setErr('Enter a valid email e.g. themba@gmail.com'); return }
    const r = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, username, email, password }) })
    const d = await r.json()
    if (!r.ok) { setErr(d.error); return }
    setPendingEmail(email)
    setStep('verify')
    setInfo('✅ Verification code sent to '+email+'. Check inbox / spam. For testing, code is: '+(d.debugCode || 'check email'))
  }

  const verify = async (e) => {
    e.preventDefault(); setErr('')
    const r = await fetch('/api/auth/verify-email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: pendingEmail, code }) })
    const d = await r.json()
    if (!r.ok) { setErr(d.error); return }
    setInfo('✅ Email verified! Now login.')
    setStep('form'); setMode('login'); setCode('')
  }

  const resend = async () => {
    const r = await fetch('/api/auth/resend-code', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: pendingEmail }) })
    const d = await r.json()
    if (!r.ok) { setErr(d.error); return }
    setInfo('New code sent to '+pendingEmail+'. For testing, code is: '+(d.debugCode || 'check email'))
  }

  if (step==='verify') {
    return (
      <div style={{maxWidth:400, margin:'40px auto', padding:20, background:'#1e293b', borderRadius:16, color:'#fff'}}>
        <h2>📧 Verify Email</h2>
        <p style={{fontSize:13, opacity:0.8}}>We sent a 6-digit code to<br/><b>{pendingEmail}</b></p>
        <form onSubmit={verify} style={{display:'flex', flexDirection:'column', gap:10}}>
          <input placeholder="Enter 6-digit code e.g. 482913" value={code} onChange={e=>setCode(e.target.value)} style={{padding:12, borderRadius:8, fontSize:18, textAlign:'center', letterSpacing:4}} />
          {err && <div style={{color:'#f87171', fontSize:13}}>{err}</div>}
          {info && <div style={{color:'#4ade80', fontSize:13}}>{info}</div>}
          <button style={{padding:12, background:'#22c55e', border:0, borderRadius:8, fontWeight:700}}>Verify Email</button>
        </form>
        <p style={{fontSize:13, textAlign:'center}}>Didn't get code? <a href="#" onClick={e=>{e.preventDefault(); resend()}} style={{color:'#60a5fa'}}>Resend Code</a></p>
        <p style={{fontSize:13, textAlign:'center}}><a href="#" onClick={e=>{e.preventDefault(); setStep('form')}} style={{color:'#94a3b8'}}>← Back to Login</a></p>
      </div>
    )
  }

  return (
    <div style={{maxWidth:400, margin:'40px auto', padding:20, background:'#1e293b', borderRadius:16, color:'#fff'}}>
      <h2>{mode==='login' ? '🔐 Login' : '📝 Register'}</h2>
      <p style={{fontSize:13, opacity:0.7}}>Zed Gambit — Email Verified Accounts</p>
      <form onSubmit={submit} style={{display:'flex', flexDirection:'column', gap:10}}>
        {mode==='register' && <input placeholder="Full Name e.g. Themba Ndhlovu" value={name} onChange={e=>setName(e.target.value)} style={{padding:10, borderRadius:8}} />}
        <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} style={{padding:10, borderRadius:8}} />
        {mode==='register' && <input placeholder="Email e.g. themba@gmail.com" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:10, borderRadius:8}} />}
        <input type="password" placeholder="Password (min 4 chars)" value={password} onChange={e=>setPassword(e.target.value)} style={{padding:10, borderRadius:8}} />
        {err && <div style={{color:'#f87171', fontSize:13}}>{err}</div>}
        {info && <div style={{color:'#4ade80', fontSize:13}}>{info}</div>}
        <button style={{padding:12, background:'#22c55e', border:0, borderRadius:8, fontWeight:700}}>{mode==='login' ? 'Login' : 'Create Account & Send Code'}</button>
      </form>
      <p style={{fontSize:13, textAlign:'center', marginTop:12}}>{mode==='login' ? "No account? " : "Have account? "}<a href="#" onClick={e=>{e.preventDefault(); setMode(mode==='login'?'register':'login')}} style={{color:'#60a5fa'}}>{mode==='login'?'Register':'Login'}</a></p>
      <p style={{fontSize:12, textAlign:'center', marginTop:8, opacity:0.6}}>Players and Administrator login here.<br/>Mobile verification will be required later for payments only.</p>
    </div>
  )
}


2. In worker.mjs — Add these 3 endpoints INSIDE Lobby.fetch, before /api/tournaments:

Copy this block and paste it just above if (url.pathname === '/api/tournaments'):

js
if (url.pathname === '/api/auth/register' && request.method === 'POST') { const b = await request.json().catch(()=>({})); const username = (b.username||'').toLowerCase().trim(); const name = (b.name||username).trim(); const email = (b.email||'').toLowerCase().trim(); const password = b.password||''; if (!username || password.length < 4) return json({ error: 'Username + password (min 4 chars) required' }, 400); if (!email.includes('@')) return json({ error: 'Valid email required' }, 400); if (this.authUsers.has(username)) return json({ error: 'Username already taken' }, 400); for (const u of this.authUsers.values()) { if (u.email===email) return json({ error: 'Email already registered' }, 400); } const code = Math.floor(100000 + Math.random()*900000).toString(); const user = { username, name, email, password: hashPass(password), role: 'user', rating: 1200, games: 0, wins: 0, created: new Date().toISOString(), banned: false, emailVerified: false, verifyCode: code, verifyExpires: Date.now()+15*60*1000 }; this.authUsers.set(username, user); console.log('VERIFY CODE for '+email+': '+code); return json({ ok: true, needVerify: true, email, debugCode: code }); }
if (url.pathname === '/api/auth/verify-email' && request.method === 'POST') { const b = await request.json().catch(()=>({})); const email = (b.email||'').toLowerCase().trim(); const code = (b.code||'').trim(); let found=null; for (const u of this.authUsers.values()) { if (u.email===email) found=u; } if (!found) return json({ error: 'Email not found. Register first.' }, 404); if (found.emailVerified) return json({ ok: true, message: 'Already verified' }); if (found.verifyCode !== code) return json({ error: 'Wrong code. Check email / spam.' }, 400); if (Date.now() > found.verifyExpires) return json({ error: 'Code expired. Tap Resend.' }, 400); found.emailVerified=true; found.verifyCode=null; return json({ ok: true }); }
if (url.pathname === '/api/auth/resend-code' && request.method === 'POST') { const b = await request.json().catch(()=>({})); const email = (b.email||'').toLowerCase().trim(); let found=null; for (const u of this.authUsers.values()) { if (u.email===email) found=u; } if (!found) return json({ error: 'Email not found' }, 404); const code = Math.floor(100000 + Math.random()*900000).toString(); found.verifyCode=code; found.verifyExpires=Date.now()+15*60*1000; console.log('RESEND CODE for '+email+': '+code); return json({ ok: true, debugCode: code }); }


