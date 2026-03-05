package com.feasto.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.feasto.dto.LoyaltyProgramDTO;
import com.feasto.service.LoyaltyService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/loyalty")
public class LoyaltyController {

    @Autowired
    private LoyaltyService loyaltyService;

    @PostMapping("/subscribe")
    public ResponseEntity<LoyaltyProgramDTO> subscribe(@Valid @RequestBody LoyaltyProgramDTO dto) {
        return ResponseEntity.ok(loyaltyService.subscribe(dto));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<LoyaltyProgramDTO> getLoyaltyByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(loyaltyService.getLoyaltyByUserId(userId));
    }

    @PutMapping("/{id}/renew")
    public ResponseEntity<LoyaltyProgramDTO> renewLoyalty(@PathVariable Long id, @Valid @RequestBody LoyaltyProgramDTO dto) {
        return ResponseEntity.ok(loyaltyService.renewLoyalty(id, dto));
    }
}