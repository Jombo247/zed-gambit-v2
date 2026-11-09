
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import ArenaShell from "./ArenaShell"
import "./index.css"

const inArena = localStorage.getItem("inArena") === "true"

function goBack() {
  window.scrollTo(0, 0)
  alert("Back to board")
}

function resign() {
  localStorage.removeItem("inArena")
  window.location.reload()
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ArenaShell
      inArena={inArena}
      timeLeft="02:34"
      onReturn={goBack}
      onResign={resign}
    />
    <App />
  </React.StrictMode>
)


