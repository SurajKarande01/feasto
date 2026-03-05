// src/main/java/com/tka/feasto/repository/LoyaltyProgramRepository.java
package com.feasto.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.feasto.entity.LoyaltyProgram;

@Repository
public interface LoyaltyProgramRepository extends JpaRepository<LoyaltyProgram, Long> {
    Optional<LoyaltyProgram> findByUser_UserId(Long userId);
}