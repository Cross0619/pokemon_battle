package com.example.backend.controller;

import com.example.backend.model.Move;
import com.example.backend.repository.MoveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/moves")
@CrossOrigin(origins = "http://localhost:5173") // Reactからの接続を許可
public class MoveController {

    @Autowired
    private MoveRepository moveRepository;

    // 全件取得
    @GetMapping
    public List<Move> getAllMoves() {
        return moveRepository.findAll();
    }

    // 新規登録
    @PostMapping
    public Move createMove(@RequestBody Move move) {
        return moveRepository.save(move);
    }

    // 更新
    @PutMapping("/{id}")
    public Move updateMove(@PathVariable Long id, @RequestBody Move moveDetails) {
        Move move = moveRepository.findById(id).orElseThrow();
        move.setName(moveDetails.getName());
        move.setType(moveDetails.getType());
        return moveRepository.save(move);
    }

    // 削除
    @DeleteMapping("/{id}")
    public void deleteMove(@PathVariable Long id) {
        moveRepository.deleteById(id);
    }
}