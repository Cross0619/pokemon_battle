import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState("読み込み中...")

  useEffect(() => {
    // SpringBootのAPIを叩く
    fetch("http://localhost:8080/api/hello")
      .then(res => res.text())
      .then(data => setMessage(data))
      .catch(err => setMessage("サーバーに接続できませんでした"))
  }, [])

  return (
    <div className="home-container">
      <h1>🎮 {message}</h1>
      <div className="menu-buttons">
        <button className="menu-btn">バトル開始</button>
        <button className="menu-btn">ポケモン管理</button>
        <button className="menu-btn">技リスト</button>
      </div>
    </div>
  )
}

export default App