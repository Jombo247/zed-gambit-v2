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
