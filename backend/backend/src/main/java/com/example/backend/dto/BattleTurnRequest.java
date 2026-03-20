package com.example.backend.dto;

import com.example.backend.model.Pokemon;
import com.example.backend.model.Move;
import java.util.List;

public class BattleTurnRequest {
    public BattleAction player1Action;
    public BattleAction player2Action;
    public List<PokemonState> p1Party; // パーティ全員の現在のHPを含む状態
    public List<PokemonState> p2Party;
    
    // 現在の場のポケモンのID
    public Long p1ActiveId;
    public Long p2ActiveId;

    // 現在のHP
    public Integer p1CurrentHp;
    public Integer p2CurrentHp;

    public static class BattleAction {
        public String type; // "MOVE" or "SWITCH"
        public Long actionId; // MoveのID or ポケモンのID
    }

    public static class PokemonState {
        public Long id;
        public Integer currentHp;
    }
}