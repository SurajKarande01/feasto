package com.feasto.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.feasto.entity.Address;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantDTO {

    private Long restaurantId;

    @NotBlank(message = "Name is required")
    private String name;

    private String description;
    private Address address;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    private String cuisineType;
    // Credentials (used for registration/login flows)
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    private Double rating;
    private Boolean isActive;
    private com.feasto.enums.Role role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // Distance from user in kilometers (optional, populated by location queries)
    private Double distanceKm;

    // A small list of special/top menu items to show in listings
    private List<MenuItemDTO> specialMenuItems;

    private String imageUrl;
    private String cloudinaryPublicId;

}