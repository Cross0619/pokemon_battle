import { useEffect, useState, useMemo } from 'react';
import './MoveManager.css'; // 新しいCSSをインポート

function MoveManager() {
  // --- 状態管理 (State) ---
  const [moves, setMoves] = useState([]); // 技リスト
  const [loading, setLoading] = useState(true); // 読み込み中フラグ

  // モーダル管理
  const [isModalOpen, setIsModalOpen] = useState(false); // モーダルの開閉
  const [editingMove, setEditingMove] = useState(null); // 編集中の技（nullなら新規追加）
  
  // フォーム入力値
  const [formData, setFormData] = useState({ name: "", type: "" });

  // 並び替え設定
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  const API_URL = "http://localhost:8080/api/moves";

  // --- API通信 (CRUD) ---

  // 1. 一覧取得 (Read)
  const fetchMoves = () => {
    setLoading(true);
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setMoves(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMoves();
  }, []);

  // 2. 追加・更新 (Create/Update)
  const handleSaveMove = (e) => {
    e.preventDefault(); // フォームのデフォルトの挙動（リロード）を防ぐ

    // バリデーション（簡易）
    if (!formData.name || !formData.type) {
      alert("技名とタイプを入力してください");
      return;
    }

    const isEditing = !!editingMove; // editingMoveがnullでなければ編集モード
    const url = isEditing ? `${API_URL}/${editingMove.id}` : API_URL;
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(() => {
        fetchMoves(); // リストを更新
        closeModal(); // モーダルを閉じる
      })
      .catch(err => alert("保存に失敗しました: " + err));
  };

  // 3. 削除 (Delete)
  const handleDeleteMove = (id, name) => {
    if (window.confirm(`技「${name}」を削除してもよろしいですか？`)) {
      fetch(`${API_URL}/${id}`, { method: 'DELETE' })
        .then(() => {
          fetchMoves(); // リストを更新
        })
        .catch(err => alert("削除に失敗しました: " + err));
    }
  };

  // --- 画面操作ロジック (UI Logic) ---

  // モーダルを開く（追加モードまたは編集モード）
  const openModal = (move = null) => {
    setEditingMove(move); // 編集モードなら技データを、追加モードならnullをセット
    if (move) {
      setFormData({ name: move.name, type: move.type }); // 編集時はデータをフォームに反映
    } else {
      setFormData({ name: "", type: "" }); // 追加時はフォームを空に
    }
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMove(null);
  };

  // フォームの入力値を更新
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- 並び替えロジック (Sorting) ---

  // 並び替えを実行する関数
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'; // 同じヘッダーをクリックしたら昇順/降順を切り替え
    }
    setSortConfig({ key, direction });
  };

  // 並び替えられた技リストを計算（movesが変更された時だけ再計算）
  const sortedMoves = useMemo(() => {
    let sortableItems = [...moves];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [moves, sortConfig]);

  // 並び替えアイコンを表示するヘルパー
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <span className="sort-icon">⇅</span>;
    return sortConfig.direction === 'asc' ? <span className="sort-icon">▲</span> : <span className="sort-icon">▼</span>;
  };

  // タイプごとのCSSクラスを取得するヘルパー
  const getTypeClass = (type) => {
    const typeMap = {
      'みず': 'type-water',
      'ほのお': 'type-fire',
      // 他のタイプも必要に応じて追加
    };
    return `type-badge ${typeMap[type] || ''}`;
  };

  // --- レンダリング (Rendering) ---

  return (
    <div className="move-manager-container">
      <h2 className="page-title">📜 技図鑑（技リスト管理）</h2>
      
      {/* 操作バー */}
      <div className="action-bar">
        <button className="add-btn" onClick={() => openModal()}>
          ＋ 新規技を登録
        </button>
      </div>

      {/* 読み込み中表示 */}
      {loading && <div style={{color: 'white', marginTop: '20px'}}>読み込み中...</div>}

      {/* 技リストテーブル */}
      {!loading && moves.length === 0 && <div style={{color: 'white', marginTop: '20px'}}>技が登録されていません。</div>}
      
      {!loading && moves.length > 0 && (
        <table className="move-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('id')}>ID {getSortIcon('id')}</th>
              <th onClick={() => requestSort('name')}>技名 {getSortIcon('name')}</th>
              <th onClick={() => requestSort('type')}>タイプ {getSortIcon('type')}</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedMoves.map(move => (
              <tr key={move.id}>
                <td>{move.id}</td>
                <td>{move.name}</td>
                <td>
                  <span className={getTypeClass(move.type)}>
                    {move.type}
                  </span>
                </td>
                <td className="action-cell">
                  <button className="sm-btn edit-btn" onClick={() => openModal(move)}>編集</button>
                  <button className="sm-btn delete-btn" onClick={() => handleDeleteMove(move.id, move.name)}>削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* --- 追加・編集モーダル --- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}> {/* 背景クリックで閉じる */}
          <div className="modal-content" onClick={e => e.stopPropagation()}> {/* コンテンツクリックは閉じない */}
            <h3 className="modal-title">
              {editingMove ? "📜 技を編集" : "➕ 新規技を追加"}
            </h3>
            <form className="modal-form" onSubmit={handleSaveMove}>
              <div className="form-group">
                <label>技名:</label>
                <input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="例: みずしゅりけん" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>タイプ:</label>
                <input 
                  name="type" 
                  value={formData.type} 
                  onChange={handleInputChange} 
                  placeholder="例: みず" 
                  required 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-btn cancel-btn" onClick={closeModal}>
                  キャンセル
                </button>
                <button type="submit" className="modal-btn save-btn">
                  {editingMove ? "更新" : "追加"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MoveManager;