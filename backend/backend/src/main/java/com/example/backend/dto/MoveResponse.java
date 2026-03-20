package com.example.backend.dto;

public class MoveResponse {
    private Long id; // ★ これを追加！
    private String name;
    private String type;
    private Integer power;

    // コンストラクタも修正
    public MoveResponse(Long id, String name, String type, Integer power) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.power = power;
    }

    // Getterを追加
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getType() { return type; }
    public Integer getPower() { return power; }
}