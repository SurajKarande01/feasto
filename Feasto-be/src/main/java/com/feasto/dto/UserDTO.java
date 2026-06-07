package com.feasto.dto;

import java.time.LocalDateTime;

import com.feasto.entity.Address;
import com.feasto.enums.Role;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {

    private Long userId;
    private String name;
    private String email;
    private String phoneNumber;
    // password intentionally excluded from DTO — never send it in responses
    private Address address;
    private Role role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
}