package com.example.backend.model;

import java.io.Serializable;
import java.util.Objects;

public class PokemonMoveId implements Serializable {
    private Long pokemonId;
    private Long moveId;

    public PokemonMoveId() {}

    public PokemonMoveId(Long pokemonId, Long moveId) {
        this.pokemonId = pokemonId;
        this.moveId = moveId;
    }

    // equals と hashCode が必須です
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PokemonMoveId that = (PokemonMoveId) o;
        return Objects.equals(pokemonId, that.pokemonId) && Objects.equals(moveId, that.moveId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(pokemonId, moveId);
    }
}