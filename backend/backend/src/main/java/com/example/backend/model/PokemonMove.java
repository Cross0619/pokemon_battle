package com.example.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "pokemon_moves")
@IdClass(PokemonMoveId.class) // 先ほど作ったキー用クラスを指定
public class PokemonMove {

    @Id
    @Column(name = "pokemon_id")
    private Long pokemonId;

    @Id
    @Column(name = "move_id")
    private Long moveId;

    private Integer power;

    // Getter & Setter
    public Long getPokemonId() { return pokemonId; }
    public void setPokemonId(Long pokemonId) { this.pokemonId = pokemonId; }
    public Long getMoveId() { return moveId; }
    public void setMoveId(Long moveId) { this.moveId = moveId; }
    public Integer getPower() { return power; }
    public void setPower(Integer power) { this.power = power; }
}