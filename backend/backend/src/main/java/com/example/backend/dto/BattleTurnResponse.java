package com.example.backend.dto;

import java.util.List;

public class BattleTurnResponse {
    public String message;          // 「ゲッコウガの みずしゅりけん！」などのログ
    public Integer p1NewHp;        // ターン終了後の1PのHP
    public Integer p2NewHp;        // ターン終了後の2PのHP
    public Long p1ActiveId;        // 交代した後の1PのポケモンID
    public Long p2ActiveId;        // 交代した後の2PのポケモンID
    public boolean p1Fainted;      // 1Pがひんしになったか
    public boolean p2Fainted;      // 2Pがひんしになったか
    public String winner;          // 勝者が決まった場合 "PLAYER1" or "PLAYER2"
    
    // コンストラクタ（後でロジックから使いやすいように）
    public BattleTurnResponse() {}
}