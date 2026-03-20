package com.example.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "type_charts")
public class TypeChart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attacker_type")
    private String attackerType;

    @Column(name = "defender_type")
    private String defenderType;

    private Double multiplier; // 2.0, 0.5, 0.0 など

    // コンストラクタ
    public TypeChart() {}

    public TypeChart(String attackerType, String defenderType, Double multiplier) {
        this.attackerType = attackerType;
        this.defenderType = defenderType;
        this.multiplier = multiplier;
    }

    // Getter & Setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAttackerType() { return attackerType; }
    public void setAttackerType(String attackerType) { this.attackerType = attackerType; }
    public String getDefenderType() { return defenderType; }
    public void setDefenderType(String defenderType) { this.defenderType = defenderType; }
    public Double getMultiplier() { return multiplier; }
    public void setMultiplier(Double multiplier) { this.multiplier = multiplier; }
}