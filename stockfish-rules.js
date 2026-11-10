
/* ===== ZED GAMBIT - STOCKFISH CONTROL - Rules MUST control Stockfish, not opposite ===== */
/* Stockfish = Engine only. Chess.js = Rules. This file makes Stockfish wait for rules. */

window.addEventListener('load', () => {
  console.log('ZED STOCKFISH CONTROL: Loaded');

  // 1. STOP everything on load - Stockfish must NOT move on load
  if (typeof timer !== 'undefined' && timer) clearInterval(timer);
  if (typeof zedClockTimer !== 'undefined' && zedClockTimer) clearInterval(zedClockTimer);

  // 2. Hide "White to move" + show full board - SCREEN FIX
  const hideWhiteToMove = () => {
    const s = document.getElementById('status');
    if (s) s.style.display = 'none';
    const e = document.getElementById('eval');
    if (e) e.style.display = 'none';
    const t = document.getElementById('zedMoveTimerText');
    if (t) t.style.display = 'none';
    const bar = document.getElementById('zedMoveTimerBar');
    if (bar) bar.style.display = 'none';
  };
  hideWhiteToMove();
  setInterval(hideWhiteToMove, 1000); // Keep it hidden - Stockfish keeps re-creating it

  // 3. Force FULL BOARD + PLAYERS - SCREEN FIX
  const fixScreen = () => {
    const board = document.getElementById('board');
    if (board) {
      board.style.width = '100%';
      board.style.height = 'auto';
      board.style.aspectRatio = '1 / 1';
      board.style.maxWidth = '480px';
      board.style.margin = '8px auto';
      board.style.display = 'grid';
    }
    // Player bars must stay visible
    document.querySelectorAll('.player-bar').forEach(el => {
      el.style.display = 'flex';
      el.style.visibility = 'visible';
      el.style.width = '100%';
      el.style.maxWidth = '480px';
    });
    document.querySelectorAll('.clock').forEach(el => {
      el.style.display = 'block';
      el.style.visibility = 'visible';
    });
  };
  fixScreen();
  setInterval(fixScreen, 1000);

  // 4. OVERRIDE Stockfish - Stockfish CANNOT move until game is STARTED
  const originalStockfishThink = window.stockfishThink;
  window.stockfishThink = function() {
    // REAL RULE: If game NOT started, Stockfish MUST NOT move
    if (typeof zedGameState !== 'undefined' && zedGameState !== 'playing') {
      console.log('ZED: Stockfish BLOCKED - Game not started yet. Waiting for READY + START');
      return;
    }
    // If thinking already, don't double move
    if (typeof thinking !== 'undefined' && thinking) return;
    if (typeof gameOver !== 'undefined' && gameOver) return;
    if (originalStockfishThink) return originalStockfishThink();
  };

  // 5. OVERRIDE newGame - Stockfish game must show READY screen, NOT auto-start
  window.newGame = function() {
    console.log('ZED: newGame - Stockfish game reset, waiting for START');
    if (typeof game !== 'undefined') game = new Chess();
    if (typeof selected !== 'undefined') selected = null;
    if (typeof legalMoves !== 'undefined') legalMoves = [];
    if (typeof lastMove !== 'undefined') lastMove = null;
    if (typeof gameOver !== 'undefined') gameOver = false;
    if (typeof thinking !== 'undefined') thinking = false;
    if (typeof render === 'function') render();
    hideWhiteToMove();
    fixScreen();
    // Show READY screen - do NOT start clock, do NOT call Stockfish
    if (typeof zedResetTimerForNewGame === 'function') {
      zedResetTimerForNewGame();
    } else {
      // If game-rules.js not loaded, show simple START button ourselves
      showSimpleStartButton();
    }
  };

  // 6. OVERRIDE doMove - After human moves, Stockfish moves ONLY if game is playing
  const originalDoMove = window.doMove;
  if (originalDoMove) {
    window.doMove = function(from, to) {
      if (typeof zedGameState !== 'undefined' && zedGameState !== 'playing') {
        alert('⏸️ Game NOT started!\n\nPress READY + START first.\nStockfish is waiting.');
        return;
      }
      const beforeTurn = (typeof game !== 'undefined') ? game.turn() : 'w';
      const result = originalDoMove(from, to);
      // After your move, update real clock + let Stockfish move
      if (typeof game !== 'undefined' && game.turn() !== beforeTurn) {
        if (typeof zedOnMoveMade === 'function') zedOnMoveMade(game.turn());
      }
      hideWhiteToMove();
      fixScreen();
      return result;
    };
  }

  // 7. OVERRIDE clickSquare - Block clicks before START
  const originalClick = window.clickSquare;
  if (originalClick) {
    window.clickSquare = function(sq) {
      if (typeof zedGameState !== 'undefined' && zedGameState === 'waiting') {
        alert('⏸️ Press READY + START first!\n\nStockfish will NOT move until you START.');
        return;
      }
      return originalClick(sq);
    };
  }

  console.log('ZED STOCKFISH CONTROL: Done - Stockfish now obeys Real Rules');
});

