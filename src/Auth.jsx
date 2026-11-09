
import { useState } from "react"

// Player starts with rating 1000, balance 0 for now
// Payment will be added later

function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]")
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users))
}

export default function Auth({ mode }) {
  const isAdminLink = window.location.search.includes("admin=1")
  const isAdmin = mode === "admin" || isAdminLink

  const [tab, setTab] = useState("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null")

  function register() {
    if (!username || !password) {
      setMessage("Enter username and password")
      return
    }
    const users = getUsers()
    if (users.find((u) => u.username === username)) {
      setMessage("Username already taken")
      return
    }
    const newUser = {
      username,
      password,
      rating: 1000,
      balance: 0,
      role: "player",
      createdAt: new Date().toISOString(),
    }
    users.push(newUser)
    saveUsers(users)
    localStorage.setItem("currentUser", JSON.stringify(newUser))
    setMessage("Registered. Welcome " + username)
    window.location.reload()
  }

  function login() {
    const users = getUsers()

    // ADMIN LOGIN - only works on secret link
    if (isAdmin) {
      if (username === "admin" && password === "admin123") {
        localStorage.setItem("currentUser", JSON.stringify({ username: "admin", role: "admin", rating: 0 }))
        window.location.href = "/admin-dashboard"
        return
      } else {
        setMessage("Wrong admin login")
        return
      }
    }

    // PLAYER LOGIN
    const found = users.find((u) => u.username === username && u.password === password)
    if (!found) {
      setMessage("Wrong username or password")
      return
    }
    localStorage.setItem("currentUser", JSON.stringify(found))
    setMessage("Welcome back " + username)
    window.location.reload()
  }

  function logout() {
    localStorage.removeItem("currentUser")
    window.location.reload()
  }

  function deleteAccount() {
    if (!window.confirm("Delete your account? This cannot be undone.")) return
    const users = getUsers().filter((u) => u.username !== currentUser.username)
    saveUsers(users)
    localStorage.removeItem("currentUser")
    localStorage.removeItem("inArena")
    window.location.reload()
  }

  if (currentUser) {
    return (
      <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <p>Logged in as <b>{currentUser.username}</b> - {currentUser.role}</p>
        <p>Rating: {currentUser.rating || 1000}</p>
        <button onClick={logout}>Logout</button>
        <button onClick={deleteAccount} style={{ marginLeft: 8, color: "red" }}>Delete Account</button>
      </div>
    )
  }

  return (
    <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12, maxWidth: 320 }}>
      <h3>{isAdmin ? "Admin Login" : "Player Login / Register"}</h3>

      {!isAdmin && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => setTab("login")}>Login</button>
          <button onClick={() => setTab("register")}>Register</button>
        </div>
      )}

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
      />

      <button onClick={tab === "register" && !isAdmin ? register : login} style={{ width: "100%", padding: 10 }}>
        {isAdmin ? "Login as Admin" : tab === "register" ? "Register" : "Login"}
      </button>

      {message && <p>{message}</p>}
      {isAdmin && <p style={{ fontSize: 12 }}>Admin link only. Not shown on website.</p>}
    </div>
  )
}


