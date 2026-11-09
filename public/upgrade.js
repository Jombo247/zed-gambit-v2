
// Zed Gambit Upgrade - No App.jsx edit needed
// Runs on top of App.jsx and fixes display

function getLoggedInUser() {
  try {
    const user = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("loggedInUser") || "null");
    if (user) return user;
  } catch(e) {}
  // Fallback: try to read from page header "Logged in as Zanda"
  const text = document.body.innerText || "";
  const match = text.match(/Logged in as\s+([A-Za-z0-9_]+)/);
  if (match) return { username: match[1], name: match[1] };
  return null;
}

function fixWallet() {
  const user = getLoggedInUser();
  if (!user) return;

  // 1. Hide Admin button for normal players
  const allButtons = document.querySelectorAll("button, a");
  allButtons.forEach((btn) => {
    if (btn.textContent.includes("Go to Admin Dashboard")) {
      const isAdmin = user.role === "admin" || user.isAdmin === true || user.username === "admin";
      if (!isAdmin) {
        btn.style.display = "none";
      }
    }
  });

  // 2. Fix Wallet user line if it shows wrong user
  // Look for "User: Pazed200" or "User:" text
  const allDivs = document.querySelectorAll("div, p, span");
  allDivs.forEach((el) => {
    if (el.textContent.startsWith("User:") && el.children.length === 0) {
      const correctName = user.name || user.username;
      // Only fix if it does NOT contain logged in username
      if (!el.textContent.includes(user.username) && !el.textContent.includes(correctName)) {
        el.textContent = `User: ${user.username} • ${correctName}`;
        el.style.color = "#fff";
      }
    }
  });
}

// Run every 1 second, because App.jsx re-renders
setInterval(fixWallet, 1000);
fixWallet();
// RULE 1: Never edit App.jsx - Fix Free Practice -> Free Arena here
function fixArenaText() {
  // Replace all text on page
  document.querySelectorAll('*').forEach(el => {
    if (el.children.length === 0 && el.textContent) {
      if (el.textContent.includes('Free Practice')) {
        el.textContent = el.textContent.replaceAll('Free Practice', 'Free Arena');
      }
      if (el.textContent.includes('Free practice')) {
        el.textContent = el.textContent.replaceAll('Free practice', 'Free Arena');
      }
    }
  });

  // Allow all arena types without stack / stake
  // Enable any locked arena buttons
  document.querySelectorAll('button').forEach(btn => {
    const t = btn.textContent.toLowerCase();
    if (t.includes('arena') || t.includes('play') || t.includes('join')) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    }
  });
}

// Run it every 1 sec like fixWallet
setInterval(fixArenaText, 1000);
fixArenaText();
// Fix profile card to show logged-in user, not Themba
function fixProfile() {
  // Find who is logged in from top text
  const topText = document.body.innerText || "";
  const m = topText.match(/Logged in as (\w+)/);
  if (!m) return;
  const realUser = m[1]; // Zanda
  const ratingMatch = topText.match(/Rating:\s*(\d+)/);
  const balMatch = topText.match(/Balance:\s*(\d+)/);
  const realRating = ratingMatch ? ratingMatch[1] : "1000";
  const realBal = balMatch ? balMatch[1] : "0";

  document.querySelectorAll('*').forEach(el => {
    if (el.children.length === 0 && el.textContent) {
      if (el.textContent.includes('Themba Ndhlovu')) {
        el.textContent = el.textContent.replace('Themba Ndhlovu', realUser);
      }
      if (el.textContent.includes('1200') && el.textContent.includes('Online')) {
        el.textContent = el.textContent.replace('1200', realRating);
      }
      if (el.textContent.trim() === 'K900') {
        el.textContent = 'K' + realBal;
      }
      if (el.textContent.includes('43 pts')) {
        el.textContent = el.textContent.replace('43 pts', '0 pts').replace('18 games', '0 games').replace('Streak: 2', 'Streak: 0');
      }
    }
  });
}
setInterval(fixProfile, 1000);
fixProfile();
// Hide Themba card when nobody is logged in
function fixLoggedOut() {
  const text = document.body.innerText || "";
  const isLoggedIn = text.includes('Logged in as');

  // Find the Themba card - it's the dark card with "Min Bet K5"
  document.querySelectorAll('div').forEach(div => {
    if (div.textContent.includes('Themba Ndhlovu') && div.textContent.includes('Min Bet K5')) {
      // Only hide if this is the outer card, not tiny inner text
      if (div.textContent.length < 500) {
        div.style.display = isLoggedIn ? '' : 'none';
      }
    }
    // Also hide Play Now / Play vs Computer when logged out
    if (!isLoggedIn && (div.textContent.trim() === 'Play Now — Auto Stake K5')) {
      div.style.display = 'none';
    }
  });
}
setInterval(fixLoggedOut, 1000);
fixLoggedOut();
// Gate Wallet + Rated Games behind verification
function gateVerified(){
  const verified = localStorage.getItem('zg_verified') === 'yes';
  if(verified) return;
  // Block Wallet button if not verified
  document.querySelectorAll('button').forEach(btn=>{
    const t = btn.textContent.toLowerCase();
    if(t.includes('wallet') || t.includes('rated') || t.includes('tournament')){
      btn.onclick = () => { alert('Please Register + Verify Email & Phone first to unlock Wallet & Rated Games'); location.href='/register.html'; };
    }
  });
  // Add Register link if on login screen
  if(document.body.innerText.includes('Player Account') && !document.getElementById('zg-reg-link')){
    const a=document.createElement('a'); a.id='zg-reg-link'; a.href='/register.html'; a.innerText='Register with Email + Phone Verification'; a.style.cssText='display:block;background:#22c55e;color:#fff;padding:12px;text-align:center;border-radius:10px;margin:10px 0;text-decoration:none;font-weight:700';
    document.body.prepend(a);
  }
}
setInterval(gateVerified, 1000);
// GATE: Email = Free Arena, Phone = Wallet + Rated + Tournaments
function gatePhone(){
  const emailOk = localStorage.getItem('zg_email_verified')==='yes';
  const phoneOk = localStorage.getItem('zg_phone_verified')==='yes';
  // Show Verify Phone banner if email ok but phone not
  if(emailOk && !phoneOk && !document.getElementById('zg-phone-banner')){
    const b=document.createElement('a'); b.id='zg-phone-banner'; b.href='/verify-phone.html';
    b.innerText='⚠️ Verify Phone to Unlock Wallet + Tournaments →';
    b.style.cssText='display:block;background:#f59e0b;color:#000;padding:12px;text-align:center;border-radius:10px;margin:10px;font-weight:700;text-decoration:none';
    document.body.prepend(b);
  }
  if(phoneOk) return;
  document.querySelectorAll('button').forEach(btn=>{
    const t=btn.textContent.toLowerCase();
    if(t.includes('wallet') || t.includes('tournament') || t.includes('rated') || t.includes('auto stake')){
      btn.onclick=()=>{ 
        if(!emailOk){ alert('Please Register with Email first'); location.href='/register.html'; }
        else { alert('Verify your Phone Number first to use Wallet / Tournaments'); location.href='/verify-phone.html'; }
      };
    }
  });
}
setInterval(gatePhone, 1000);








 