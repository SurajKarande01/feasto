package com.feasto.dto;

import com.feasto.entity.Address;
import com.feasto.enums.Role;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRegistrationDTO {

    private String name;
    private String email;
    private String phoneNumber;
    private String password;
    private Address address;
    private Role role;
}