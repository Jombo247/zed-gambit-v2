
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




 