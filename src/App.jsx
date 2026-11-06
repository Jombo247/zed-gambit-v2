import './styles.css'
import ChessBoard from './ChessBoard.jsx'

function App() {
  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-icon">♞</span>
          <span>ZED <strong>GAMBIT</strong></span>
        </a>
        <span className="status">MVP DEVELOPMENT</span>
      </header>
      <main className="main-content">
        <section className="hero">
          <p className="eyebrow">WELCOME TO ZED GAMBIT</p>
          <h1>Think Smart. <br />Play Bold. <span>Win Big.</span></h1>
          <p className="hero-description">Your next chess challenge starts here. Sharpen your strategy and challenge your limits.</p>
        </section>
        <section className="game-section">
          <h2>Your Chessboard</h2>
          <ChessBoard />
        </section>
        <section className="game-options">
          <h2>Choose Your Challenge</h2>
          <div className="option-grid">
            <article className="option-card"><span className="option-icon">🤖</span><h3>Play Computer</h3><p>Challenge the Stockfish chess engine.</p><span className="coming-soon">Coming soon</span></article>
            <article className="option-card"><span className="option-icon">👥</span><h3>Play Online</h3><p>Challenge another player in real time.</p><span className="coming-soon">Coming soon</span></article>
            <article className="option-card"><span className="option-icon">🏆</span><h3>Leaderboard</h3><p>Compete for a place among the best.</p><span className="coming-soon">Coming soon</span></article>
          </div>
        </section>
        <footer>ZED GAMBIT © 2026 - THINK SMART. PLAY BOLD. WIN BIG.</footer>
      </main>
    </div>
  )
}

export default App
