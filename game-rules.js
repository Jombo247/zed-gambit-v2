/* ===== ZED GAMBIT - GENERAL RULE: 20 SECONDS PER MOVE ===== */
/* Rule: White has 20s to make FIRST move. Every move after: 20s. Fail = Resign / Lose. */
/* Works for Chess, Checkers, Ludo. No need to edit index.html. */

const ZED_RULES = {
  FIRST_MOVE_SECONDS: 20,
  MOVE_SECONDS: 20,
  enabled: true
};

let zedMoveTimeLeft = 20;
let zedMoveTimer = null;
let zedMoveCount = 0; // 0 = first move not yet made
let zedCurrentTurn = 'w'; // 'w' or 'b'

function zedStartMoveTimer(onTimeout) {
  // Stop old timer
  if (zedMoveTimer) clearInterval(zedMoveTimer);
  zedMoveTimeLeft = ZED_RULES.MOVE_SECONDS;

  // Show UI - create if not exists
  let bar = document.getElementById('zedMoveTimerBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'zedMoveTimerBar';
    bar.innerHTML = `
      <div class="move-timer-text" id="zedMoveTimerText">⏱️ White to move - 20s to play or you resign</div>
      <div class="move-timer-bar"><div class="move-timer-fill" id="zedMoveTimerFill"></div></div>
    `;
    // Insert bar just above board
    const board = document.getElementById('board') || document.getElementById('checkersBoard');
    if (board) board.parentNode.insertBefore(bar, board);
  }

  const textEl = document.getElementById('zedMoveTimerText');
  const fillEl = document.getElementById('zedMoveTimerFill');

  function tick() {
    zedMoveTimeLeft--;
    const pct = (zedMoveTimeLeft / 20) * 100;
    if (fillEl) {
      fillEl.style.width = pct + '%';
      fillEl.classList.toggle('danger', zedMoveTimeLeft <= 5);
    }
    if (textEl) {
      const who = zedCurrentTurn === 'w' ? 'White' : 'Black';
      const isFirst = zedMoveCount === 0 ? ' - FIRST MOVE' : '';
      textEl.textContent = `⏱️ ${who} to move${isFirst} - ${zedMoveTimeLeft}s left or you RESIGN`;
      textEl.style.color = zedMoveTimeLeft <= 5 ? '#ef4444' : '#facc15';
    }
    if (zedMoveTimeLeft <= 0) {
      clearInterval(zedMoveTimer);
      zedDeclareResignByTimeout();
      if (onTimeout) onTimeout();
    }
  }

  // Initial display
  if (textEl) {
    const who = zedCurrentTurn === 'w' ? 'White' : 'Black';
    textEl.textContent = `⏱️ ${who} to move - 20s to play or you resign`;
  }
  if (fillEl) fillEl.style.width = '100%';
  zedMoveTimer = setInterval(tick, 1000);
}

function zedOnMoveMade(nextTurn) {
  // Call this AFTER every successful move
  zedMoveCount++;
  zedCurrentTurn = nextTurn; // 'w' or 'b'
  zedStartMoveTimer();
}

function zedDeclareResignByTimeout() {
  const loser = zedCurrentTurn === 'w' ? 'White' : 'Black';
  const winner = zedCurrentTurn === 'w' ? 'Black' : 'White';
  const isFirst = zedMoveCount === 0;

  let msg = '';
  if (isFirst) {
    msg = `⏰ TIME UP!\n\nWhite did not make first move in 20 seconds.\n\nWhite is declared RESIGN.\n🏆 Black Wins!`;
  } else {
    msg = `⏰ TIME UP!\n\n${loser} did not move in 20 seconds.\n\n${loser} is declared RESIGN.\n🏆 ${winner} Wins!`;
  }
  alert(msg);

  // Stop game - your existing gameOver flag
  if (typeof gameOver !== 'undefined') gameOver = true;
  if (typeof timer !== 'undefined' && timer) clearInterval(timer);
  if (zedMoveTimer) clearInterval(zedMoveTimer);

  // Update status text if exists
  const status = document.getElementById('status');
  if (status) status.textContent = `⏰ ${loser} Resigned on Time - ${winner} Wins!`;

  // If stake game, winner gets prize - call your existing logic
  if (typeof currentPrize !== 'undefined' && currentPrize > 0) {
    // White lost on time = Black wins, etc.
    // You handle prize in index.html - this just notifies
    console.log('ZED RULE: Timeout resign, winner:', winner);
  }
}

function zedResetTimerForNewGame() {
  zedMoveCount = 0;
  zedCurrentTurn = 'w';
  zedStartMoveTimer();
}

function zedStopTimer() {
  if (zedMoveTimer) clearInterval(zedMoveTimer);
}
