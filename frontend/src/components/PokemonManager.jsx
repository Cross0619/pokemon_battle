import { useEffect, useState, useMemo } from 'react';
import './PokemonManager.css';

function PokemonManager() {
  const [pokemons, setPokemons] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPokemon, setEditingPokemon] = useState(null);
  const [isMovesModalOpen, setIsMovesModalOpen] = useState(false);
  const [selectedMoves, setSelectedMoves] = useState([]);
  const [selectedPokemonName, setSelectedPokemonName] = useState("");
  const [formData, setFormData] = useState({
    name: "", type1: "", type2: "", hp: 0, defense: 0, speed: 0
  });

  const API_URL = "http://localhost:8080/api/pokemons";

  const fetchPokemons = () => {
    fetch(API_URL).then(res => res.json()).then(data => setPokemons(data));
  };

  useEffect(() => { fetchPokemons(); }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const isEditing = !!editingPokemon;
    const url = isEditing ? `${API_URL}/${editingPokemon.id}` : API_URL;
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }).then(() => {
      fetchPokemons();
      closeModal();
    });
  };

  const openModal = (pokemon = null) => {
    setEditingPokemon(pokemon);
    setFormData(pokemon || { name: "", type1: "", type2: "", hp: 0, defense: 0, speed: 0 });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  // --- 技を取得する関数を追加 ---
  const handleShowMoves = (pokemon) => {
    setSelectedPokemonName(pokemon.name);
    fetch(`http://localhost:8080/api/pokemons/${pokemon.id}/moves`)
      .then(res => res.json())
      .then(data => {
        setSelectedMoves(data);
        setIsMovesModalOpen(true);
      })
      .catch(err => alert("技の取得に失敗しました"));
  };

  return (
    <div className="pokemon-manager-container">
      <h2 className="page-title">🔍 ポケモン図鑑管理</h2>
      <div className="action-bar">
        <button className="add-btn" onClick={() => openModal()}>＋ 新規ポケモン登録</button>
      </div>

      <table className="move-table pokemon-table">
        <thead>
          <tr>
            <th>名前</th><th>タイプ</th><th>HP</th><th>防御</th><th>素早さ</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          {pokemons.map(p => (
            <tr key={p.id}>
              <td 
                onClick={() => handleShowMoves(p)} 
                style={{ cursor: 'pointer', color: '#f1c40f', textDecoration: 'underline' }}
              >
                {p.name}
              </td>
              <td>
                <div className="type-container">
                  <span className="type-badge">{p.type1}</span>
                  {p.type2 && <span className="type-badge">{p.type2}</span>}
                </div>
              </td>
              <td>{p.hp}</td>
              <td>{p.defense}</td>
              <td>{p.speed}</td>
              <td className="action-cell">
                <button className="sm-btn edit-btn" onClick={() => openModal(p)}>編集</button>
                <button className="sm-btn delete-btn" onClick={() => {
                  if(window.confirm("削除しますか？")) 
                    fetch(`${API_URL}/${p.id}`, {method:'DELETE'}).then(fetchPokemons);
                }}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">{editingPokemon ? "編集" : "新規登録"}</h3>
            <form onSubmit={handleSave} className="modal-form">
              <input placeholder="名前" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <div className="stats-input-group">
                <input placeholder="タイプ1" value={formData.type1} onChange={e => setFormData({...formData, type1: e.target.value})} required />
                <input placeholder="タイプ2" value={formData.type2} onChange={e => setFormData({...formData, type2: e.target.value})} />
              </div>
              <div className="stats-input-group">
                <label>HP<input type="number" value={formData.hp} onChange={e => setFormData({...formData, hp: parseInt(e.target.value)})} /></label>
                <label>防御<input type="number" value={formData.defense} onChange={e => setFormData({...formData, defense: parseInt(e.target.value)})} /></label>
                <label>素早さ<input type="number" value={formData.speed} onChange={e => setFormData({...formData, speed: parseInt(e.target.value)})} /></label>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="modal-btn cancel-btn">キャンセル</button>
                <button type="submit" className="modal-btn save-btn">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* 技確認用モーダルを最後に追加 */}
      {isMovesModalOpen && (
        <div className="modal-overlay" onClick={() => setIsMovesModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">⚔️ {selectedPokemonName} のわざ</h3>
            <table className="move-table" style={{ width: '100%', color: '#333' }}>
              <thead>
                <tr>
                  <th>技名</th><th>タイプ</th><th>威力</th>
                </tr>
              </thead>
              <tbody>
                {selectedMoves.map((move, index) => (
                  <tr key={index}>
                    <td>{move.name}</td>
                    <td>{move.type}</td>
                    <td>{move.power}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="modal-actions">
              <button className="modal-btn cancel-btn" onClick={() => setIsMovesModalOpen(false)}>閉じる</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default PokemonManager;