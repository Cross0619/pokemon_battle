package com.example.backend.controller;

import com.example.backend.model.Pokemon;
import com.example.backend.repository.PokemonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.example.backend.dto.MoveResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import java.util.stream.Collectors;

import java.util.List;

@RestController
@RequestMapping("/api/pokemons")
@CrossOrigin(origins = "http://localhost:5173")
public class PokemonController {

    @Autowired
    private PokemonRepository pokemonRepository;
    
    @PersistenceContext
    private EntityManager entityManager; // 直接SQLを実行するために使用

    @GetMapping
    public List<Pokemon> getAllPokemons() {
        return pokemonRepository.findAll();
    }

    @PostMapping
    public Pokemon createPokemon(@RequestBody Pokemon pokemon) {
        return pokemonRepository.save(pokemon);
    }

    @PutMapping("/{id}")
    public Pokemon updatePokemon(@PathVariable Long id, @RequestBody Pokemon details) {
        Pokemon pokemon = pokemonRepository.findById(id).orElseThrow();
        pokemon.setName(details.getName());
        pokemon.setType1(details.getType1());
        pokemon.setType2(details.getType2());
        pokemon.setHp(details.getHp());
        pokemon.setDefense(details.getDefense());
        pokemon.setSpeed(details.getSpeed());
        return pokemonRepository.save(pokemon);
    }

    @DeleteMapping("/{id}")
    public void deletePokemon(@PathVariable Long id) {
        pokemonRepository.deleteById(id);
    }

    // ポケモンIDに紐づく技を取得する
@GetMapping("/{id}/moves")
public List<MoveResponse> getPokemonMoves(@PathVariable Long id) {
    // SELECT に m.id を追加
    String sql = "SELECT m.id, m.name, m.type, pm.power " +
                 "FROM moves m " +
                 "JOIN pokemon_moves pm ON m.id = pm.move_id " +
                 "WHERE pm.pokemon_id = :pokemonId";

    Query query = entityManager.createNativeQuery(sql);
    query.setParameter("pokemonId", id);

    List<Object[]> results = query.getResultList();

    return results.stream()
            .map(res -> new MoveResponse(
                ((Number)res[0]).longValue(), // id
                (String)res[1],               // name
                (String)res[2],               // type
                (Integer)res[3]               // power
            ))
            .collect(Collectors.toList());
}
}