/* ===== ZED GAMBIT - FIX: Force index.html to use REAL Chess Rules ===== */
/* You only add 1 line to index.html: <script src="chess-fix.js"></script> */
/* This file overrides the old wrong timer in index.html */

window.addEventListener('load', () => {
  console.log('ZED FIX: Real Chess Rules loaded');

  // 1. Stop old auto-timer immediately
  if (typeof timer !== 'undefined' && timer) clearInterval(timer);
  if (typeof zedMoveTimer !== 'undefined' && zedMoveTimer) clearInterval(zedMoveTimer);
  if (typeof zedClockTimer !== 'undefined' && zedClockTimer) clearInterval(zedClockTimer);

  // 2. Force game into WAITING state - clocks PAUSED
  if (typeof zedShowStartScreen === 'function') {
    zedShowStartScreen();
  } else {
    console.log('ZED FIX ERROR: game-rules.js NOT loaded! Check that game-rules.js is in same folder as index.html');
    alert('⚠️ Chess Rules NOT loaded!\n\nYou forgot to add game-rules.js\n\nAdd this line in index.html <head>:\n<script src="game-rules.js"></script>');
  }

  // 3. Override old newGame() - old newGame auto-started timer, new one shows READY screen
  const originalNewGame = window.newGame;
  window.newGame = function() {
    console.log('ZED FIX: newGame called - showing READY screen, NOT auto-start');
    if (typeof game !== 'undefined') game = new Chess();
    if (typeof selected !== 'undefined') selected = null;
    if (typeof legalMoves !== 'undefined') legalMoves = [];
    if (typeof lastMove !== 'undefined') lastMove = null;
    if (typeof gameOver !== 'undefined') gameOver = false;
    if (typeof thinking !== 'undefined') thinking = false;
    if (typeof render === 'function') render();
    // REAL RULE: Do NOT start timer. Show READY screen.
    if (typeof zedResetTimerForNewGame === 'function') zedResetTimerForNewGame();
  };

  // 4. Override old doMove() - after move, call real rule to add +5s and switch turn
  const originalDoMove = window.doMove;
  if (originalDoMove) {
    window.doMove = function(from, to) {
      // If game not started yet, block move
      if (typeof zedGameState !== 'undefined' && zedGameState !== 'playing') {
        alert('⏸️ Game NOT started yet!\n\nBoth players must press READY, then START.\n\nClocks are PAUSED until START.');
        return;
      }
      // Call original move
      const beforeTurn = (typeof game !== 'undefined') ? game.turn() : 'w';
      const result = originalDoMove(from, to);
      // If move succeeded, update real clock
      if (typeof game !== 'undefined' && game.turn() !== beforeTurn) {
        if (typeof zedOnMoveMade === 'function') zedOnMoveMade(game.turn());
      }
      return result;
    };
  }

  // 5. Override old clickSquare() - block moves before START
  const originalClick = window.clickSquare;
  if (originalClick) {
    window.clickSquare = function(sq) {
      if (typeof zedGameState !== 'undefined' && zedGameState !== 'playing' && zedGameState !== 'waiting') {
        return;
      }
      if (typeof zedGameState !== 'undefined' && zedGameState === 'waiting') {
        alert('⏸️ Press READY + START first!\n\nGame has NOT started. Clocks are PAUSED.');
        return;
      }
      return originalClick(sq);
    };
  }

  console.log('ZED FIX: Done - Real rules now control index.html');
});

// Helper to check if rules are working - type this in console: zedCheckRules()
window.zedCheckRules = function() {
  console.log('game-rules.js loaded?', typeof zedShowStartScreen === 'function');
  console.log('Game State:', typeof zedGameState !== 'undefined' ? zedGameState : 'NOT FOUND');
  console.log('White Time:', typeof zedWhiteTime !== 'undefined' ? zedWhiteTime : 'NOT FOUND');
  console.log('Black Time:', typeof zedBlackTime !== 'undefined' ? zedBlackTime : 'NOT FOUND');
  if (typeof zedShowStartScreen !== 'function') {
    alert('❌ game-rules.js NOT loaded!\n\nCheck: Is game-rules.js in SAME folder as index.html?\nIs <script src="game-rules.js"></script> in <head>?');
  } else {
    alert('✅ Real Chess Rules ARE loaded!\n\nState: ' + zedGameState + '\nWhite: ' + zedWhiteTime + 's\nBlack: ' + zedBlackTime + 's');
  }
};