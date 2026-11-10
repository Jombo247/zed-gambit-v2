
/* ===== ZED GAMBIT - GENERAL RULE: OPTION A - 30s + 5s FOR ALL GAMES ===== */
/* This file is the LAW for all games. index.html stays untouched. */
/* Rule: 30 seconds per move + 5 seconds bonus every time you move */

const ZED_RULES = {
  FIRST_MOVE_SECONDS: 30,
  MOVE_SECONDS: 30,
  BONUS_SECONDS: 5,
  WARNINGS_BEFORE_RESIGN: 1, // 1 warning, then resign on 2nd timeout
  enabled: true
};

let zedMoveTimeLeft = 30;
let zedMoveTimer = null;
let zedMoveCount = 0; // 0 = first move not yet made
let zedCurrentTurn = 'w';
let zedWarnings = { w: 0, b: 0 };
let zedBonusBank = { w: 0, b: 0 };

function zedStartMoveTimer() {
  if (zedMoveTimer) clearInterval(zedMoveTimer);

  // 30s + bonus you earned from fast moves
  zedMoveTimeLeft = ZED_RULES.MOVE_SECONDS + zedBonusBank[zedCurrentTurn];
  if (zedMoveTimeLeft > 45) zedMoveTimeLeft = 45; // max cap, so no one stacks forever

  let bar = document.getElementById('zedMoveTimerBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'zedMoveTimerBar';
    bar.innerHTML = `
      <div class="move-timer-text" id="zedMoveTimerText">⏱️ White to move - 30s</div>
      <div class="move-timer-bar"><div class="move-timer-fill" id="zedMoveTimerFill"></div></div>
      <div style="text-align:center;font-size:11px;opacity:.7;margin-top:2px" id="zedBonusText">Bonus Bank: White +0s | Black +0s</div>
    `;
    const board = document.getElementById('board') || document.getElementById('checkersBoard');
    if (board) board.parentNode.insertBefore(bar, board);
  }

  const textEl = document.getElementById('zedMoveTimerText');
  const fillEl = document.getElementById('zedMoveTimerFill');
  const bonusEl = document.getElementById('zedBonusText');

  function updateUI() {
    const pct = (zedMoveTimeLeft / 45) * 100;
    if (fillEl) {
      fillEl.style.width = pct + '%';
      fillEl.classList.toggle('danger', zedMoveTimeLeft <= 5);
    }
    if (textEl) {
      const who = zedCurrentTurn === 'w' ? 'White' : 'Black';
      const isFirst = zedMoveCount === 0 ? ' - FIRST MOVE' : '';
      textEl.textContent = `⏱️ ${who} to move${isFirst} - ${zedMoveTimeLeft}s left`;
      textEl.style.color = zedMoveTimeLeft <= 5 ? '#ef4444' : '#facc15';
      if (zedMoveTimeLeft <= 5) textEl.textContent += ` ⚠️ MOVE NOW OR WARNING!`;
    }
    if (bonusEl) {
      bonusEl.textContent = `Bonus Bank: White +${zedBonusBank.w}s | Black +${zedBonusBank.b}s • +5s every fast move`;
    }
  }

  updateUI();
  zedMoveTimer = setInterval(() => {
    zedMoveTimeLeft--;
    updateUI();
    if (zedMoveTimeLeft <= 0) {
      clearInterval(zedMoveTimer);
      zedOnTimeout();
    }
  }, 1000);
}

function zedOnMoveMade(nextTurn) {
  // Player who just moved gets +5s bonus for next time
  const justMoved = zedCurrentTurn;
  zedBonusBank[justMoved] += ZED_RULES.BONUS_SECONDS;
  if (zedBonusBank[justMoved] > 15) zedBonusBank[justMoved] = 15; // cap bonus at 15s

  zedMoveCount++;
  zedCurrentTurn = nextTurn;
  zedStartMoveTimer();
}

function zedOnTimeout() {
  const loser = zedCurrentTurn === 'w' ? 'White' : 'Black';
  const winner = zedCurrentTurn === 'w' ? 'Black' : 'White';
  zedWarnings[zedCurrentTurn]++;

  // FIRST TIMEOUT = WARNING ONLY, NOT RESIGN
  if (zedWarnings[zedCurrentTurn] <= ZED_RULES.WARNINGS_BEFORE_RESIGN) {
    alert(`⚠️ WARNING - ${loser}!\n\nYou ran out of 30 seconds.\n\nThis is your 1 warning. Next timeout = RESIGN.\n\nYou get 30 seconds again - MOVE NOW!`);
    // Give them another 30s, reset bonus
    zedBonusBank[zedCurrentTurn] = 0;
    zedStartMoveTimer();
    return;
  }

  // SECOND TIMEOUT = RESIGN
  const isFirst = zedMoveCount === 0;
  let msg = '';
  if (isFirst) {
    msg = `⏰ TIME UP - 2nd TIME!\n\nWhite did not make first move in 30 seconds twice.\n\nWhite is declared RESIGN.\n🏆 Black Wins!`;
  } else {
    msg = `⏰ TIME UP - 2nd TIME!\n\n${loser} did not move in 30 seconds twice.\n\n${loser} is declared RESIGN.\n🏆 ${winner} Wins!`;
  }
  alert(msg);
  if (typeof gameOver !== 'undefined') gameOver = true;
  if (typeof timer !== 'undefined' && timer) clearInterval(timer);
  if (zedMoveTimer) clearInterval(zedMoveTimer);
  const status = document.getElementById('status');
  if (status) status.textContent = `⏰ ${loser} Resigned on Time - ${winner} Wins!`;
}

function zedResetTimerForNewGame() {
  zedMoveCount = 0;
  zedCurrentTurn = 'w';
  zedWarnings = { w: 0, b: 0 };
  zedBonusBank = { w: 0, b: 0 };
  zedStartMoveTimer();
}

function zedStopTimer() {
  if (zedMoveTimer) clearInterval(zedMoveTimer);
}


