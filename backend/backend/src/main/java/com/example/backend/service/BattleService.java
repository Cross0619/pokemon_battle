package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.model.*;
import com.example.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class BattleService {
    @Autowired private PokemonRepository pokemonRepository;
    @Autowired private MoveRepository moveRepository;
    @Autowired private TypeChartRepository typeChartRepository;
    @Autowired private PokemonMoveRepository pokemonMoveRepository; // 中間テーブル用

    public BattleTurnResponse processTurn(BattleTurnRequest request) {
        BattleTurnResponse res = new BattleTurnResponse();
        List<String> logs = new ArrayList<>();
        
        // ★最初に応答用のHPを現在のHPで初期化しておく（これが重要！）
        res.p1NewHp = request.p1CurrentHp;
        res.p2NewHp = request.p2CurrentHp;
        res.p1ActiveId = request.p1ActiveId;
        res.p2ActiveId = request.p2ActiveId;

        // 1. データの準備（現在の場にいるポケモンを取得）
        Pokemon p1Active = pokemonRepository.findById(request.p1ActiveId).orElseThrow();
        Pokemon p2Active = pokemonRepository.findById(request.p2ActiveId).orElseThrow();

        // 2. 行動順の決定
        // 原則：交代(SWITCH)は技(MOVE)より先。両方MOVEなら素早さ(speed)順。
        boolean p1First = true;

        if (request.player1Action.type.equals("SWITCH") && request.player2Action.type.equals("MOVE")) {
            p1First = true;
        } else if (request.player2Action.type.equals("SWITCH") && request.player1Action.type.equals("MOVE")) {
            p1First = false;
        } else {
            // 両方MOVE、または両方SWITCHの場合は素早さ比較
            p1First = p1Active.getSpeed() >= p2Active.getSpeed();
        }

        // 3. 行動実行（先攻 → 後攻）
        executeAction(p1First ? request.player1Action : request.player2Action, 
                      p1First ? p1Active : p2Active, 
                      p1First ? p2Active : p1Active, 
                      p1First ? request.p1CurrentHp : request.p2CurrentHp,
                      p1First ? request.p2CurrentHp : request.p1CurrentHp,
                      res, logs, p1First, true);

        // ★ここで重要！先攻の行動（交代など）を反映した最新の「場」の情報に更新する
        p1Active = pokemonRepository.findById(res.p1ActiveId).orElseThrow();
        p2Active = pokemonRepository.findById(res.p2ActiveId).orElseThrow();

        // 後攻の行動（相手が生きていれば実行）
        if (!res.p1Fainted && !res.p2Fainted) {
            executeAction(p1First ? request.player2Action : request.player1Action, 
                          p1First ? p2Active : p1Active, 
                          p1First ? p1Active : p2Active, 
                          p1First ? res.p2NewHp : res.p1NewHp,
                          p1First ? res.p1NewHp : res.p2NewHp,
                          res, logs, !p1First, false);
        }

        // 3. 全滅チェック（1P側）
    boolean p1AllFainted = request.p1Party.stream()
        .allMatch(p -> {
            // 今戦っているポケモンの場合は最新のHP(res.p1NewHp)を見る
            if (p.id.equals(request.p1ActiveId)) return res.p1NewHp <= 0;
            // 控えのポケモンの場合はそのままのHPを見る
            return p.currentHp <= 0;
        });

    // 4. 全滅チェック（2P側）
    boolean p2AllFainted = request.p2Party.stream()
        .allMatch(p -> {
            if (p.id.equals(request.p2ActiveId)) return res.p2NewHp <= 0;
            return p.currentHp <= 0;
        });

    // 5. 勝者の確定
    if (p1AllFainted) {
        res.winner = "PLAYER 2";
        logs.add("1Pの手持ちが全滅した！");
    } else if (p2AllFainted) {
        res.winner = "PLAYER 1";
        logs.add("2Pの手持ちが全滅した！");
    }

        res.message = String.join("\n", logs);
        return res;
    }

    private void executeAction(BattleTurnRequest.BattleAction action, Pokemon actor, Pokemon target, 
                               int actorHp, int targetHp, BattleTurnResponse res, 
                               List<String> logs, boolean isP1Action, boolean isFirst) {
        
        if (action.type.equals("SWITCH")) {
            // 交代処理
            Pokemon nextPkmn = pokemonRepository.findById(action.actionId).orElseThrow();
            logs.add((isP1Action ? "1P" : "2P") + "は " + actor.getName() + " を下げて " + nextPkmn.getName() + " を繰り出した！");
            if (isP1Action) { res.p1ActiveId = nextPkmn.getId(); res.p1NewHp = nextPkmn.getHp(); }
            else { res.p2ActiveId = nextPkmn.getId(); res.p2NewHp = nextPkmn.getHp(); }
        } else {
            // 攻撃処理
            Move move = moveRepository.findById(action.actionId).orElseThrow();
            // 中間テーブルからそのポケモンが使う時の威力を取得
            int power = pokemonMoveRepository.findByPokemonIdAndMoveId(actor.getId(), move.getId())
            .orElseThrow(() -> new RuntimeException("技の威力データが見つかりません"))
            .getPower();
            
            logs.add((isP1Action ? "1P" : "2P") + "の " + actor.getName() + " の " + move.getName() + "！");
            
            // ダメージ計算
            int damage = calculateDamage(power, move.getType(), target);
            int newTargetHp = Math.max(targetHp - damage, 0);
            
            if (damage > 0) logs.add(target.getName() + " に " + damage + " のダメージ！");
            else logs.add(target.getName() + " には効果がないようだ...");

            // 結果のセット
            if (isP1Action) { 
                res.p2NewHp = newTargetHp; 
                if (isFirst) res.p1NewHp = actorHp; // 先攻なら自分のHPはそのまま
                if (newTargetHp <= 0) { res.p2Fainted = true; logs.add("2Pの " + target.getName() + " はたおれた！"); }
            } else { 
                res.p1NewHp = newTargetHp; 
                if (isFirst) res.p2NewHp = actorHp;
                if (newTargetHp <= 0) { res.p1Fainted = true; logs.add("1Pの " + target.getName() + " はたおれた！"); }
            }
        }
    }

    public int calculateDamage(int movePower, String moveType, Pokemon defender) {
        double multiplier = getMultiplier(moveType, defender.getType1(), defender.getType2());
        // 公式: floor(威力 * 相性) - 防御力
        int baseDamage = (int) Math.floor(movePower * multiplier);
        return Math.max(baseDamage - defender.getDefense(), 0);
    }

    private double getMultiplier(String atkType, String defType1, String defType2) {
        double m1 = typeChartRepository.findByAttackerTypeAndDefenderType(atkType, defType1)
                    .map(TypeChart::getMultiplier).orElse(1.0);
        double m2 = (defType2 == null || defType2.isEmpty()) ? 1.0 : 
                    typeChartRepository.findByAttackerTypeAndDefenderType(atkType, defType2)
                    .map(TypeChart::getMultiplier).orElse(1.0);
        return m1 * m2;
    }
}