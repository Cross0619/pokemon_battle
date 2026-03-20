package com.example.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.backend.dto.BattleTurnRequest;
import com.example.backend.dto.BattleTurnResponse;
import com.example.backend.service.BattleService;

@RestController
@RequestMapping("/api/battle")
@CrossOrigin(origins = "http://localhost:5173")
public class BattleController {

    @Autowired private BattleService battleService;

    @PostMapping("/turn")
    public BattleTurnResponse executeTurn(@RequestBody BattleTurnRequest request) {
        return battleService.processTurn(request);
    }
}