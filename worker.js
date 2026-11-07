
// Zed Gambit - Worker P3 Rated Tournaments + Elo
function calcElo(rA, rB, score, gamesPlayed) {
  const K = gamesPlayed < 30 ? 32 : 20
  const expected = 1 / (1 + Math.pow(10, (rB - rA) / 400))
  return Math.round(rA + K * (score - expected))
}

