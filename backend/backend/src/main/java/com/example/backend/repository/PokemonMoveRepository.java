package com.example.backend.repository;

import com.example.backend.model.PokemonMove;
import com.example.backend.model.PokemonMoveId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PokemonMoveRepository extends JpaRepository<PokemonMove, PokemonMoveId> {
    // 特定のポケモンと特定の技の組み合わせを取得する
    Optional<PokemonMove> findByPokemonIdAndMoveId(Long pokemonId, Long moveId);
}