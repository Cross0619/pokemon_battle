import { useEffect, useState } from 'react';
import './BattleScene.css';

// --- サブコンポーネント：HPバーの表示 ---
const getHpBarColorClass = (current, max) => {
  const ratio = current / max;
  if (ratio <= 0.2) return 'hp-red';
  if (ratio <= 0.5) return 'hp-yellow';
  return '';
};

function StatusHud({ pokemon, currentHp, isP1 }) {
  if (!pokemon) return null;
  const hpRatio = (currentHp / pokemon.hp) * 100;
  return (
    <div className={`status-hud ${isP1 ? 'p1-hud' : 'p2-hud'}`}>
      <div className="pokemon-info-header">
        <span className="pokemon-name">{pokemon.name}</span>
        <span className="pokemon-level">防御力：{pokemon.defense}</span>
      </div>
      <div className="hp-bar-container">
        <div className={`hp-bar-fill ${getHpBarColorClass(currentHp, pokemon.hp)}`} style={{ width: `${hpRatio}%` }} />
      </div>
      <div className="hp-text">{currentHp} / {pokemon.hp}</div>
    </div>
  );
}

// --- メインコンポーネント ---
function BattleScene({ battleData }) {
    // --- 1. ここに手持ちの状態管理を追加！ ---
  const [p1PartyStatus, setP1PartyStatus] = useState([]);
  const [p2PartyStatus, setP2PartyStatus] = useState([]);

  // 1. ポケモンの状態管理
  const [p1Active, setP1Active] = useState(null);
  const [p1Hp, setP1Hp] = useState(0);
  const [p1Moves, setP1Moves] = useState([]);
  
  const [p2Active, setP2Active] = useState(null);
  const [p2Hp, setP2Hp] = useState(0);
  const [p2Moves, setP2Moves] = useState([]);

  // 2. バトルの進行状態
  const [p1SelectedAction, setP1SelectedAction] = useState(null);
  const [battlePhase, setBattlePhase] = useState('P1_SELECT_MAIN');
  const [message, setMessage] = useState("バトル開始！1Pの行動を選択してください。");

  // 3. 技取得API
  const fetchMovesForPokemon = async (pokemonId) => {
    const response = await fetch(`http://localhost:8080/api/pokemons/${pokemonId}/moves`);
    return await response.json();
  };

  // 4. 初期セットアップ
  useEffect(() => {
    const init = async () => {
      if (battleData) {
        // パーティ全体のHP状態を初期化
        setP1PartyStatus(battleData.party1.map(p => ({ id: p.id, currentHp: p.hp })));
        setP2PartyStatus(battleData.party2.map(p => ({ id: p.id, currentHp: p.hp })));

        const p1 = battleData.party1[0];
        const p2 = battleData.party2[0];
        setP1Active(p1); setP1Hp(p1.hp);
        setP2Active(p2); setP2Hp(p2.hp);
        const m1 = await fetchMovesForPokemon(p1.id);
        const m2 = await fetchMovesForPokemon(p2.id);
        setP1Moves(m1); setP2Moves(m2);
      }
    };
    init();
  }, [battleData]);

  // 5. 【心臓部】ターン実行API
const executeTurn = async (p1Action, p2Action) => {
    setBattlePhase('EXECUTING');
    setMessage("・・・計算中・・・");

    const requestBody = {
      player1Action: p1Action,
      player2Action: p2Action,
      p1ActiveId: p1Active.id,
      p2ActiveId: p2Active.id,
      p1CurrentHp: p1Hp,
      p2CurrentHp: p2Hp,
      p1Party: p1PartyStatus,
      p2Party: p2PartyStatus
    };

    try {
      const res = await fetch("http://localhost:8080/api/battle/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      const result = await res.json();

      // --- デバッグ用ログ（F12で見れます） ---
      console.log("サーバーからの結果:", result);

      // 1. まずHPを最新にする
      setP1Hp(result.p1NewHp);
      setP2Hp(result.p2NewHp);
      setMessage(result.message);

      // 2. 【ここが超重要】場のポケモンを最新に更新する
      // 1Pが交代した場合
      let latestP1 = p1Active; // 最新のオブジェクトを一時保存
      if (result.p1ActiveId && String(result.p1ActiveId) !== String(p1Active.id)) {
        latestP1 = battleData.party1.find(p => String(p.id) === String(result.p1ActiveId));
        setP1Active(latestP1); // ステート更新
        const ms = await fetchMovesForPokemon(latestP1.id);
        setP1Moves(ms);
      }

      // 2Pが交代した場合
      let latestP2 = p2Active;
      if (result.p2ActiveId && String(result.p2ActiveId) !== String(p2Active.id)) {
        latestP2 = battleData.party2.find(p => String(p.id) === String(result.p2ActiveId));
        setP2Active(latestP2);
        const ms = await fetchMovesForPokemon(latestP2.id);
        setP2Moves(ms);
      }

      // 手持ち全体のHP状態も更新
      setP1PartyStatus(prev => prev.map(p => String(p.id) === String(result.p1ActiveId) ? { ...p, currentHp: result.p1NewHp } : p));
      setP2PartyStatus(prev => prev.map(p => String(p.id) === String(result.p2ActiveId) ? { ...p, currentHp: result.p2NewHp } : p));


      // たおれたポケモンのHPを手持ち状態に反映
      if (result.p1Fainted) {
        setP1PartyStatus(prev => prev.map(p =>
          String(p.id) === String(result.p1ActiveId) ? { ...p, currentHp: 0 } : p
        ));
      }
      if (result.p2Fainted) {
        setP2PartyStatus(prev => prev.map(p =>
          String(p.id) === String(result.p2ActiveId) ? { ...p, currentHp: 0 } : p
        ));
      }

      // 3. 判定ロジック（最新の latestP1/latestP2 を使う）
      setTimeout(() => {
        if (result.winner) {
          setBattlePhase('FINISHED');
          setMessage(`試合終了！勝者は ${result.winner} です！`);
        } else if (result.p1Fainted) {
          setBattlePhase('P1_FORCED_SWITCH');
          // ここで p1Active.name ではなく、今の名前に更新された latestP1.name を使う！
          setMessage(`${latestP1.name} は たおれた！\n交代してください。`);
        } else if (result.p2Fainted) {
          setBattlePhase('P2_FORCED_SWITCH');
          setMessage(`${latestP2.name} は たおれた！\n交代してください。`);
        } else {
          setBattlePhase('P1_SELECT_MAIN');
          setMessage("次のターン！1Pの行動を選択してください。");
          setP1SelectedAction(null);
        }
      }, 3000);

    } catch (e) {
      console.error("通信エラー詳細:", e);
      setMessage("通信エラーが発生しました。");
    }
  };


  // 6. 通常の行動選択（たたかう・こうたい）
  const handleSelectAction = (type, id, name) => {
    const action = { type, actionId: id };
    if (battlePhase === 'P1_SELECT_MOVE' || battlePhase === 'P1_SELECT_SWITCH' || battlePhase === 'P1_SELECT_MAIN') {
      setP1SelectedAction(action);
      setBattlePhase('P2_SELECT_MAIN');
      setMessage(`次は2Pの行動を選んでください。`);
    } else if (p1SelectedAction !== null) { // ★ nullチェックを追加
      executeTurn(p1SelectedAction, action);
    } else {
      // 不正な状態：リセット
      console.warn("p1SelectedAction が null のまま P2 の選択が来た");
      setBattlePhase('P1_SELECT_MAIN');
      setMessage("エラー：最初からやり直してください。");
    }
  };

// 7. 【修正】ひんし時の強制交代
  const handleForcedSwitch = async (pokemon) => {
    // 技を読み込む
    const ms = await fetchMovesForPokemon(pokemon.id);


    // ★先にリセットしてから状態更新
    setP1SelectedAction(null);

    if (battlePhase === 'P1_FORCED_SWITCH') {
      setP1Active(pokemon);
      setP1Hp(pokemon.currentHp);
      setP1Moves(ms);
      // ★重要：手持ちの状態も「このポケモンは今これだけのHPで場にいる」と更新する
      setP1PartyStatus(prev => prev.map(p => p.id === pokemon.id ? { ...p, currentHp: pokemon.currentHp } : p));
      
      setBattlePhase('P1_SELECT_MAIN');
      setMessage(`1Pは ${pokemon.name} を繰り出した！\n行動を選択してください。`);
    } else {
      setP2Active(pokemon);
      setP2Hp(pokemon.currentHp);
      setP2Moves(ms);
      // ★重要：2P側も同様
      setP2PartyStatus(prev => prev.map(p => p.id === pokemon.id ? { ...p, currentHp: pokemon.currentHp } : p));
      
      setBattlePhase('P1_SELECT_MAIN');
      setMessage(`2Pは ${pokemon.name} を繰り出した！\n1Pの行動を選択してください。`);
    }
    setP1SelectedAction(null); // 前のターンの選択を確実に消去
  };

  if (!p1Active || !p2Active) return <div className="battle-container">読み込み中...</div>;

  // ボタンに表示する技や控えのリストを判定
  const isP1Turn = battlePhase.startsWith('P1');
  const currentMoves = isP1Turn ? p1Moves : p2Moves;
  
  // 控えのリストを作る際、現在のHP情報を合体させる
  const currentBench = (isP1Turn ? battleData.party1 : battleData.party2)
    .filter(p => p.id !== (isP1Turn ? p1Active.id : p2Active.id)) // 場に出ている子以外
    .map(p => {
      const status = (isP1Turn ? p1PartyStatus : p2PartyStatus).find(s => s.id === p.id);
      return { ...p, currentHp: status ? status.currentHp : p.hp }; // 最新のHPを合成
    })
    .filter(p => p.currentHp > 0); // 生きている子だけ（強制交代時用）


  return (
    <div className="battle-container">
      <div className="battle-field">
        <div className="player-stage">
          <StatusHud pokemon={p1Active} currentHp={p1Hp} isP1={true} />
          {/* <div className="pokemon-sprite-placeholder">{p1Active.name[0]}</div> */}
          <div className="pokemon-sprite-container">
              <img 
                src={`/pokemon_images/${p1Active.id}.png`} 
                alt={p1Active.name} 
                className="pokemon-sprite p1-sprite" 
              />
          </div>
          {/* ★追加：手持ちポケモンのリスト */}
          <div className="party-display party">
            {battleData.party1.map(p => {
              const status = p1PartyStatus.find(s => s.id === p.id);
              const isFainted = status && status.currentHp <= 0;
              const isActive = p.id === p1Active.id;
              
              return (
                <div key={p.id} className={`party-icon-container ${isActive ? 'active-icon' : ''}`}>
                  <img 
                    src={`/pokemon_images/${p.id}.png`} 
                    alt={p.name} 
                    className={`party-mini-sprite ${isFainted ? 'fainted-sprite' : ''}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="player-stage">
          <StatusHud pokemon={p2Active} currentHp={p2Hp} isP1={false} />
          {/* <div className="pokemon-sprite-placeholder">{p2Active.name[0]}</div> */}
          <div className="pokemon-sprite-container">
              <img 
                src={`/pokemon_images/${p2Active.id}.png`} 
                alt={p2Active.name} 
                className="pokemon-sprite p2-sprite" 
              />
          </div>
          
          {/* ★追加：手持ちポケモンのリスト */}
          <div className="party-display party">
            {battleData.party2.map(p => {
              const status = p2PartyStatus.find(s => s.id === p.id);
              const isFainted = status && status.currentHp <= 0;
              const isActive = p.id === p2Active.id;
              
              return (
                <div key={p.id} className={`party-icon-container ${isActive ? 'active-icon' : ''}`}>
                  <img 
                    src={`/pokemon_images/${p.id}.png`} 
                    alt={p.name} 
                    className={`party-mini-sprite ${isFainted ? 'fainted-sprite' : ''}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="control-panel">
        <div className="message-log-container">
          {message.split('\n').map((l, i) => <p key={i}>{l}</p>)}
        </div>

        <div className="action-buttons-container">

          {/* ★追加：試合終了時の表示 */}
          {battlePhase === 'FINISHED' && (
            <div className="main-actions-grid">
              <button 
                className="battle-btn btn-switch" 
                style={{ gridColumn: 'span 2', backgroundColor: '#f1c40f', color: '#000' }}
                onClick={() => window.location.reload()} // とりあえずリロードでホームへ
              >
                表彰台へ（ホームに戻る）
              </button>
            </div>
          )}
        
          {/* 通常メニュー */}
          {(battlePhase === 'P1_SELECT_MAIN' || battlePhase === 'P2_SELECT_MAIN') && (
            <div className="main-actions-grid">
              <button className="battle-btn btn-fight" onClick={() => setBattlePhase(battlePhase.replace('MAIN', 'MOVE'))}>たたかう</button>
              <button className="battle-btn btn-switch" onClick={() => setBattlePhase(battlePhase.replace('MAIN', 'SWITCH'))}>こうたい</button>
            </div>
          )}

          {/* 技選択 */}
          {battlePhase.includes('MOVE') && (
            <div className="sub-action-panel active">
              {currentMoves.map(m => (
                <button key={m.id} className={`battle-btn btn-move type-${m.type}`} onClick={() => handleSelectAction('MOVE', m.id, m.name)}>
                  {m.name}({m.power})
                </button>
              ))}
              <button className="battle-btn btn-cancel" onClick={() => setBattlePhase(battlePhase.replace('MOVE', 'MAIN'))}>戻る</button>
            </div>
          )}

          {/* 通常の交代 */}
          {(battlePhase === 'P1_SELECT_SWITCH' || battlePhase === 'P2_SELECT_SWITCH') && (
            <div className="sub-action-panel active bench-list">
              {currentBench.map(p => (
                <button key={p.id} className="battle-btn btn-bench" onClick={() => handleSelectAction('SWITCH', p.id, p.name)}>
                    <div className="bench-btn-content">
                      <span className="bench-pokemon-name">{p.name}</span>
                      <br/>
                      <span className="bench-pokemon-hp">
                        {p.currentHp} / {p.hp}
                      </span>
                    </div>
                    {/* おまけ：HPバーも小さく出すとさらに「いい感じ」になります */}
                    {/* <div className="mini-hp-bar-container">
                       <div 
                         className={`mini-hp-bar-fill ${getHpBarColorClass(p.currentHp, p.hp)}`} 
                         style={{ width: `${(p.currentHp / p.hp) * 100}%` }} 
                       />
                    </div> */}
                </button>
              ))}
              <button className="battle-btn btn-cancel" onClick={() => setBattlePhase(battlePhase.replace('SWITCH', 'MAIN'))}>戻る</button>
            </div>
          )}

          {/* 【重要】ひんし時の強制交代メニュー */}
          {(battlePhase === 'P1_FORCED_SWITCH' || battlePhase === 'P2_FORCED_SWITCH') && (
            <div className="sub-action-panel active bench-list">
              {currentBench.map(p => (
                <button key={p.id} className="battle-btn btn-bench" onClick={() => handleForcedSwitch(p)}>
                    <div className="bench-btn-content">
                      <span className="bench-pokemon-name">{p.name}</span>
                      <br/>
                      <span className="bench-pokemon-hp">
                        {p.currentHp} / {p.hp}
                      </span>
                    </div>
                    {/* おまけ：HPバーも小さく出すとさらに「いい感じ」になります */}
                    {/* <div className="mini-hp-bar-container">
                       <div 
                         className={`mini-hp-bar-fill ${getHpBarColorClass(p.currentHp, p.hp)}`} 
                         style={{ width: `${(p.currentHp / p.hp) * 100}%` }} 
                       />
                    </div> */}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BattleScene;