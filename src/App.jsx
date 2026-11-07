import { useState } from 'react'
import './styles.css'
import ChessBoard from './ChessBoard.jsx'
import Leaderboard from './Leaderboard.jsx'
import OnlineChess from './OnlineChess.jsx'
import LiveLobby from './LiveLobby.jsx'

function App() {
  const [screen, setScreen] = useState('home')
  const [pendingRoom, setPendingRoom] = useState('')
  const [pendingStake, setPendingStake] = useState(20)

  if (screen === 'leaderboard') {
    return (
      <div className="app">
        <header className="topbar">
          <a className="brand" href="#"><span>ZED <strong>GAMBIT</strong></span></a>
          <span className="status">MVP DEVELOPMENT</span>
        </header>
        <main className="main-content">
          <Leaderboard onBack={() => setScreen('home')} />
        </main>
      </div>
    )
  }

  if (screen === 'online') {
    return (
      <div className="app">
        <header className="topbar">
          <a className="brand" href="#"><span>ZED <strong>GAMBIT</strong></span></a>
          <span className="status">MVP DEVELOPMENT</span>
        </header>
        <main className="main-content">
          <OnlineChess onBack={() => setScreen('home')} initialRoom={pendingRoom} initialStake={pendingStake} />
        </main>
      </div>
    )
  }

  if (screen === 'lobby') {
    return (
      <div className="app">
        <header className="topbar">
          <a className="brand" href="#"><span>ZED <strong>GAMBIT</strong></span></a>
          <span className="status">MVP DEVELOPMENT</span>
        </header>
        <main className="main-content">
          <LiveLobby
            onBack={() => setScreen('home')}
            onPlayRoom={(room, stake) => { setPendingRoom(room); setPendingStake(stake || 20); setScreen('online') }}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#"><span>ZED <strong>GAMBIT</strong></span></a>
        <span className="status">MVP DEVELOPMENT</span>
      </header>
      <main className="main-content">
        <section className="hero">
          <p className="eyebrow">WELCOME TO ZED GAMBIT</p>
          <h1>Think Smart.<br />Play Bold.</h1>
          <p>Your next chess challenge starts here. Sharpen your strategy and challenge your limits.</p>
        </section>
        <section className="game-section">
          <h2>Your Chessboard</h2>
          <ChessBoard />
        </section>
        <section className="game-options">
          <h2>Choose Your Challenge</h2>
          <div className="options-grid">
            <article className="option-card" onClick={() => document.querySelector('.game-section')?.scrollIntoView({ behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
              <span className="option-icon">🤖</span>
              <h3>Play Computer</h3>
              <p>Challenge the Stockfish chess engine.</p>
              <p><span style={{ background: '#22c55e', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>▶ Play Now - Tap Board Above</span></p>
            </article>
            <article className="option-card" onClick={() => setScreen('online')} style={{ cursor: 'pointer' }}>
              <span className="option-icon">👥</span>
              <h3>Play Online</h3>
              <p>Challenge another player in real time.</p>
              <p><span style={{ background: '#3b82f6', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>▶ Play Now</span></p>
            </article>
            <article className="option-card" onClick={() => setScreen('lobby')} style={{ cursor: 'pointer', border: '2px solid #EF7D00' }}>
              <span className="option-icon">🔴</span>
              <h3>Live Lobby</h3>
              <p>See who's online, challenge them, join tournaments.</p>
              <p><span style={{ background: '#EF7D00', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>▶ LIVE - See Players</span></p>
            </article>
            <article className="option-card" onClick={() => setScreen('leaderboard')} style={{ cursor: 'pointer' }}>
              <span className="option-icon">🏆</span>
              <h3>Leaderboard</h3>
              <p>Compete for a place among the best.</p>
              <p><span style={{ background: '#f59e0b', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>▶ View Board</span></p>
            </article>
          </div>
        </section>
      </main>
      <footer>ZED GAMBIT © 2026 - THINK SMART. PLAY BOLD. WIN BIG.</footer>
    </div>
  )
}
export default App