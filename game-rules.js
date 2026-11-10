
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

/* ===== ZED GAMBIT - OFFLINE RULE - Opponent goes offline while in play ===== */
/* Real Rule: Pause clocks, 60s grace to reconnect, then Abandoned = You Win */

let zedOpponentOnline = true;
let zedOfflineTimer = null;
let zedOfflineSecondsLeft = 60;
let zedOfflineGrace = 60; // 60 seconds to come back

// Call this when opponent disconnects - we detect via heartbeat
function zedOpponentWentOffline() {
  if (typeof zedGameState !== 'undefined' && zedGameState !== 'playing') return;
  if (!zedOpponentOnline) return; // already offline
  zedOpponentOnline = false;
  zedOfflineSecondsLeft = zedOfflineGrace;

  // 1. PAUSE clocks - no one loses time while opponent is offline
  if (typeof zedStopClock === 'function') zedStopClock();
  if (typeof zedStopTimer === 'function') zedStopTimer();

  // 2. Show offline banner
  let bar = document.getElementById('zedMoveTimerBar');
  if (bar) {
    bar.innerHTML = `
      <div style="background:#fef3c7;color:#000;padding:14px;border-radius:12px;text-align:center;border:2px solid #f59e0b">
        <div style="font-weight:900;font-size:17px">📶 Opponent Offline - Game Paused</div>
        <div style="font-size:13px;margin:6px 0">Your clock is PAUSED. You are NOT losing time.<br>Waiting for opponent to reconnect...</div>
        <div style="font-size:22px;font-weight:900" id="zedOfflineCountdown">60s left to reconnect</div>
        <div style="font-size:12px;margin-top:6px">If opponent does not come back in 60s, you WIN by abandonment.<br>If this is a network glitch, they can still come back.</div>
        <button onclick="zedClaimWinByAbandonment()" style="background:#22c55e;color:#fff;padding:10px 14px;border:0;border-radius:10px;font-weight:900;margin-top:8px;cursor:pointer;display:none" id="zedClaimWinBtn">🏆 Claim Win Now</button>
        <button onclick="zedWaitLonger()" style="background:#fff;color:#000;padding:10px 14px;border:0;border-radius:10px;font-weight:900;margin-top:8px;cursor:pointer">⏳ Wait 60s More (Friendly)</button>
      </div>
    `;
  }

  // 3. Countdown 60s
  zedOfflineTimer = setInterval(() => {
    zedOfflineSecondsLeft--;
    const el = document.getElementById('zedOfflineCountdown');
    if (el) el.textContent = zedOfflineSecondsLeft + 's left to reconnect';
    if (zedOfflineSecondsLeft <= 0) {
      clearInterval(zedOfflineTimer);
      // Show Claim Win button
      const btn = document.getElementById('zedClaimWinBtn');
      if (btn) btn.style.display = 'inline-block';
      if (el) el.textContent = '0s - Opponent did not return. You can Claim Win.';
      // Auto-claim after 10 more seconds if you don't tap
      setTimeout(() => {
        if (!zedOpponentOnline) zedClaimWinByAbandonment();
      }, 10000);
    }
  }, 1000);
}

// Call this when opponent comes back online
function zedOpponentCameBack() {
  if (zedOpponentOnline) return;
  zedOpponentOnline = true;
  if (zedOfflineTimer) clearInterval(zedOfflineTimer);
  alert('✅ Opponent is back online!\n\nGame resumes. No one lost time.');
  // Resume clocks
  if (typeof zedStartClock === 'function' && typeof zedGameState !== 'undefined' && zedGameState === 'playing') zedStartClock();
  // Re-show normal timer bar
  const bar = document.getElementById('zedMoveTimerBar');
  if (bar) {
    bar.innerHTML = `<div class="move-timer-text" id="zedMoveTimerText" style="text-align:center;font-weight:800;color:#22c55e">▶️ Game Resumed - Opponent Reconnected</div>`;
  }
  if (typeof zedUpdateClockDisplay === 'function') zedUpdateClockDisplay();
}

// Opponent did NOT return - You Win
function zedClaimWinByAbandonment() {
  if (zedOpponentOnline) return;
  if (zedOfflineTimer) clearInterval(zedOfflineTimer);
  if (typeof zedGameState !== 'undefined') zedGameState = 'finished';
  if (typeof gameOver !== 'undefined') gameOver = true;
  if (typeof zedStopClock === 'function') zedStopClock();

  const isStake = (typeof currentStake !== 'undefined' && currentStake > 0);
  const prize = (typeof currentPrize !== 'undefined' ? currentPrize : 0);

  if (isStake) {
    // Stake game: You get prize
    if (typeof balance !== 'undefined' && typeof updateBalance === 'function') {
      balance += prize;
      updateBalance();
    }
    alert(`🏆 YOU WIN BY ABANDONMENT!\n\nOpponent was offline for 60s and did not return.\n\nPrize K${prize} added to your Balance.\nOpponent loses stake.`);
  } else {
    alert(`🏆 YOU WIN BY ABANDONMENT!\n\nOpponent was offline for 60s and did not return.\n\nOpponent loses. You win.`);
  }
  const status = document.getElementById('status');
  if (status) status.textContent = '🏆 You Win - Opponent Abandoned (Offline)';
}

// Friendly option - wait longer, don't claim win yet
function zedWaitLonger() {
  if (zedOfflineTimer) clearInterval(zedOfflineTimer);
  zedOfflineSecondsLeft = 60;
  alert('⏳ OK, waiting 60 seconds more for your friend.\n\nYour clock stays PAUSED.');
  // Restart countdown
  zedOpponentWentOffline._waitingLonger = true;
  // Re-trigger with new timer - simple: call again after resetting flag
  zedOpponentOnline = false;
  // Manually restart countdown
  zedOfflineTimer = setInterval(() => {
    zedOfflineSecondsLeft--;
    const el = document.getElementById('zedOfflineCountdown');
    if (el) el.textContent = zedOfflineSecondsLeft + 's left to reconnect (Extra time)';
    if (zedOfflineSecondsLeft <= 0) {
      clearInterval(zedOfflineTimer);
      const btn = document.getElementById('zedClaimWinBtn');
      if (btn) btn.style.display = 'inline-block';
    }
  }, 1000);
}

// ===== DETECT OFFLINE AUTOMATICALLY =====
// This runs every 5 seconds - checks if we still have internet
setInterval(() => {
  if (!navigator.onLine && zedOpponentOnline && typeof zedGameState !== 'undefined' && zedGameState === 'playing') {
    // YOU went offline, not opponent - show message to you
    console.log('ZED: You are offline');
  }
}, 5000);

// For testing - you can simulate offline in console:
// zedOpponentWentOffline() -> shows offline screen
// zedOpponentCameBack() -> resumes game




