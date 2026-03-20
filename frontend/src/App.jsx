import { useEffect, useState } from 'react'
import './App.css'
import MoveManager from './components/MoveManager'
import PokemonManager from './components/PokemonManager'
import PartySelector from './components/PartySelector' // 追加
import BattleScene from './components/BattleScene'

function App() {
  const [message, setMessage] = useState("オーキド博士を呼んでいます...")
  // 表示する画面を管理するステート ('home' か 'moves' か)
  const [view, setView] = useState('home')
  const [battleData, setBattleData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8080/api/hello")
      .then(res => res.text())
      .then(data => setMessage(data))
      .catch(err => setMessage("サーバーとの通信に失敗しました。"));
  }, []);

  // --- バトル開始の処理 ---
  const handleBattleStart = (party1, party2) => {
    // console.log("1P Party:", party1);
    // console.log("2P Party:", party2);
    setBattleData({ party1, party2 });
    setView('battle'); // バトル画面へ遷移（まだ作ってないけど）
  };

  // --- 画面切り替えのロジック ---
  
  // 1. 技リスト画面を表示する場合
  if (view === 'moves') {
    return (
      <div className="home-container">
        <MoveManager />
        <button className="menu-btn" onClick={() => setView('home')} style={{marginTop: '20px'}}>
          ホームに戻る
        </button>
      </div>
    )
  }

    if (view === 'manage') {
    return (
      <div className="home-container">
        <PokemonManager />
        <button className="menu-btn" onClick={() => setView('home')} style={{marginTop: '20px'}}>
          ホームに戻る
        </button>
      </div>
    )
  }

  // --- 選出画面 ---
  if (view === 'select') {
    return (
      <div className="home-container">
        <PartySelector onBattleStart={handleBattleStart} />
        {/* 選出中は戻るボタンを置かない（READY管理が大変なので）、リロードで戻る想定 */}
      </div>
    );
  }
  
  // --- バトル画面 ---
if (view === 'battle') {
  return (
    <div className="home-container">
      {/* 仮の画面ではなく、作成した BattleScene を呼び出す */}
      <BattleScene battleData={battleData} />
      
      {/* 開発用に参りましたボタンを少しスマートに配置（本当はバトル画面内にあるべきだが） */}
      <button 
        style={{position:'fixed', bottom:'10px', left:'10px', padding:'5px 10px', fontSize:'0.7rem', opacity:0.5}}
        onClick={() => setView('home')}>
        降参（ホームへ）
      </button>
    </div>
  );
}



  // 2. ホーム画面を表示する場合 (デフォルト)
  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="game-title">POKEMON BATTLE</h1>
        <div className="message-window">
          <p>{message}</p>
        </div>
      </header>

      <nav className="menu-nav">
        <button className="menu-btn start" onClick={() => setView('select')}>
          <span className="btn-icon">⚔️</span> バトル開始
        </button>
        <button className="menu-btn manage" onClick={() => setView('manage')}>
          <span className="btn-icon">📁</span> ポケモン管理
        </button>
        {/* クリック時に view を 'moves' に書き換える */}
        <button className="menu-btn moves" onClick={() => setView('moves')}>
          <span className="btn-icon">📜</span> 技リスト
        </button>
      </nav>

      <footer className="home-footer">
        <p>© 2026 My Pokemon Project</p>
      </footer>
    </div>
  )
}

export default App