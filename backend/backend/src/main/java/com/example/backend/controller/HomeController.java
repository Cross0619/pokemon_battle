package com.example.backend.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
// Reactのポート(5173)からのアクセスを許可する（これがないとエラーになります）
@CrossOrigin(origins = "http://localhost:5173")
public class HomeController {

    @GetMapping("/hello")
    public String getHello() {
        return "ポケモンバトルアプリへようこそ！";
    }
}