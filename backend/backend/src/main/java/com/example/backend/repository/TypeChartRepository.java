package com.example.backend.repository;

import com.example.backend.model.TypeChart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TypeChartRepository extends JpaRepository<TypeChart, Long> {

    // 攻撃タイプと防御タイプからデータを一件取得する
    Optional<TypeChart> findByAttackerTypeAndDefenderType(String attackerType, String defenderType);
}