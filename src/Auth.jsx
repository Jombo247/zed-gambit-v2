
import { useState } from "react"

export default function Auth() {
  const [tab, setTab] = useState("register")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null")

  function register() {
    if (!username || !password) {
      setMessage("Enter username and password")
      return
    }
    if (password.length < 4) {
      setMessage("Password must be 4 or more")
      return
    }
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    if (users.find((u) => u.username === username)) {
      setMessage("Username already taken, choose another")
      return
    }
    const newUser = {
      username: username,
      password: password,
      rating: 1000,
      balance: 0,
      role: "player",
      createdAt: new Date().toISOString()
    }
    users.push(newUser)
    localStorage.setItem("users", JSON.stringify(users))
    localStorage.setItem("currentUser", JSON.stringify(newUser))
    setMessage("Success. Welcome " + username)
    window.location.reload()
  }

  function login() {
    const users = JSON.parse(localStorage.getItem("users") || "[]")
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

  if (currentUser) {
    return (
      <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12, maxWidth: 360, marginTop: 12 }}>
        <p>Logged in as <b>{currentUser.username}</b></p>
        <p>Rating: {currentUser.rating} | Balance: {currentUser.balance || 0} ZMW</p>
        <button onClick={logout}>Logout</button>
      </div>
    )
  }

  return (
    <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12, maxWidth: 360, marginTop: 12 }}>
      <h3>Player Account</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setTab("login")}>Login</button>
        <button onClick={() => setTab("register")}>Register</button>
      </div>
      <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ display: "block", width: "100%", padding: 8, marginBottom: 8 }} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: "block", width: "100%", padding: 8, marginBottom: 8 }} />
      <button onClick={tab === "register" ? register : login} style={{ width: "100%", padding: 10 }}>
        {tab === "register" ? "Register" : "Login"}
      </button>
      {message && <p>{message}</p>}
    </div>
  )
}


