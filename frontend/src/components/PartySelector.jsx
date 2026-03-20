import { useEffect, useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './PartySelector.css';

// --- 1. ドラッグ可能なアイテム（ポケモン）のコンポーネント ---
function SortablePokemonItem({ id, pokemon, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, // ドラッグ中は半透明に
  };

  return (
    <div ref={setNodeRef} style={style} className="party-item">
      {/* 「≡」ドラッグハンドル（listenersをここだけにつけることで、名前クリック等と分離） */}
      <div {...attributes} {...listeners} className="drag-handle">≡</div>
      
      {/* ★追加：ポケモンアイコン画像 */}
      <img 
        src={`/pokemon_images/${pokemon.id}.png`} 
        alt={pokemon.name} 
        className="party-list-icon" 
      />
      
      <div className="pokemon-info">
        <span className="pokemon-name">{pokemon.name}</span>
        {/* ★タイプ表示（type-badge）は削除しました */}
      </div>
      
      <button className="pokemon-remove" onClick={() => onRemove(pokemon.id)}>✕</button>
    </div>
  );
}

// --- 2. プレイヤーごとの選択パネル（1P/2P共通） ---
function PlayerPanel({ playerId, playerName, masterPokemons, party, setParty, isReady, setIsReady }) {
  const [searchQuery, setSearchQuery] = useState("");

  // 検索クエリに基づいてマスターデータをフィルタリング
  const filteredPokemons = masterPokemons.filter(p => 
    p.name.includes(searchQuery) && !party.some(member => member.id === p.id) // すでにパーティにいるのは除外
  );

  // パーティに追加
  const addToParty = (pokemon) => {
    if (party.length < 6) {
      setParty([...party, pokemon]);
    } else {
      alert("パーティは6匹までです。");
    }
  };

  // パーティから削除
  const removeFromParty = (id) => {
    setParty(party.filter(p => p.id !== id));
  };

  // 選出数のバリデーション（1匹〜6匹）
  const isValidParty = party.length >= 1 && party.length <= 6;

  // ドラッグ＆ドロップのセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ドラッグ終了時の処理（並び替え）
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setParty((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex); // ライブラリの関数で配列を入れ替え
      });
    }
  };

  return (
    <div className={`player-panel player${playerId}-panel`}>
      <div className="panel-header">
        <h3 className="player-name">{playerName}</h3>
      </div>

      {/* 検索・選択エリア */}
      {!isReady && (
        <div className="search-section">
          <input 
            className="search-input" 
            placeholder="ポケモンを検索..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
          {searchQuery && (
            <div className="search-results">
              {filteredPokemons.map(p => (
                <div key={p.id} className="result-item" onClick={() => addToParty(p)}>
                  {/* ★追加：ポケモンアイコン画像 */}
                  <img 
                    src={`/pokemon_images/${p.id}.png`} 
                    alt={p.name} 
                    className="party-list-icon" 
                  />
                  <span className="result-pokemon-name">{p.name}</span>
                  {/* <span>{p.name}</span> */}
                  {/* <span className="type-badge">{p.type1}</span> */}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* パーティリストエリア（DnD） */}
      <div className="party-section">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={party.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="party-list">
              {party.map(p => (
                <SortablePokemonItem 
                  key={p.id} 
                  id={p.id} 
                  pokemon={p} 
                  onRemove={isReady ? () => {} : removeFromParty} // READY後は削除不可
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* READYボタンエリア */}
      <div className="action-section">
        {isValidParty && !isReady && (
          <button className="ready-btn active" onClick={() => setIsReady(true)}>READY!</button>
        )}
        {(!isValidParty || isReady) && (
          <button className={`ready-btn ${isReady ? 'active' : ''}`}>
            {isReady ? 'WAITING...' : `${party.length}/6匹`}
          </button>
        )}
      </div>
    </div>
  );
}

// --- 3. 選出画面のメインコンポーネント ---
function PartySelector({ onBattleStart }) {
  const [masterPokemons, setMasterPokemons] = useState([]); // 全ポケモンデータ
  
  // 1Pの状態
  const [party1, setParty1] = useState([]);
  const [ready1, setReady1] = useState(false);
  
  // 2Pの状態
  const [party2, setParty2] = useState([]);
  const [ready2, setReady2] = useState(false);

  // ポケモンデータの読み込み
  useEffect(() => {
    fetch("http://localhost:8080/api/pokemons")
      .then(res => res.json())
      .then(data => setMasterPokemons(data));
  }, []);

  // 両プレイヤーがREADYならバトル開始ボタンを表示
  const bothReady = ready1 && ready2;

  return (
    <div className="selector-container">
      {/* 1Pパネル (左) */}
      <PlayerPanel 
        playerId={1} 
        playerName="PLAYER 1 (YOU)" 
        masterPokemons={masterPokemons} 
        party={party1} 
        setParty={setParty1} 
        isReady={ready1} 
        setIsReady={setReady1} 
      />

      {/* 2Pパネル (右) */}
      <PlayerPanel 
        playerId={2} 
        playerName="PLAYER 2 (ENEMY)" 
        masterPokemons={masterPokemons} 
        party={party2} 
        setParty={setParty2} 
        isReady={ready2} 
        setIsReady={setReady2} 
      />

      {/* バトル開始ボタン（オーバーレイで表示） */}
      {bothReady && (
        <div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100}}>
          <button 
            className="start-btn" 
            onClick={() => onBattleStart(party1, party2)}
          >
            バトル開始！！！
          </button>
        </div>
      )}
    </div>
  );
}

export default PartySelector;