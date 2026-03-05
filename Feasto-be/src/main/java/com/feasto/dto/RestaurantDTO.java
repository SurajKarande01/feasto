package com.feasto.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.feasto.entity.Address;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantDTO {

    private Long restaurantId;
    private String name;
    private String description;
    private Address address;
    private String phoneNumber;
    private String cuisineType;
    // Credentials (used for registration/login flows)
    private String email;
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
	public Long getRestaurantId() {
		return restaurantId;
	}
	public void setRestaurantId(Long restaurantId) {
		this.restaurantId = restaurantId;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getDescription() {
		return description;
	}
	public void setDescription(String description) {
		this.description = description;
	}
	public Address getAddress() {
		return address;
	}
	public void setAddress(Address address) {
		this.address = address;
	}
	public String getPhoneNumber() {
		return phoneNumber;
	}
	public void setPhoneNumber(String phoneNumber) {
		this.phoneNumber = phoneNumber;
	}
	public String getCuisineType() {
		return cuisineType;
	}
	public void setCuisineType(String cuisineType) {
		this.cuisineType = cuisineType;
	}
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
	public String getPassword() {
		return password;
	}
	public void setPassword(String password) {
		this.password = password;
	}
	public Double getRating() {
		return rating;
	}
	public void setRating(Double rating) {
		this.rating = rating;
	}
	public Boolean getIsActive() {
		return isActive;
	}
	public void setIsActive(Boolean isActive) {
		this.isActive = isActive;
	}
	public com.feasto.enums.Role getRole() {
		return role;
	}
	public void setRole(com.feasto.enums.Role role) {
		this.role = role;
	}
	public LocalDateTime getCreatedAt() {
		return createdAt;
	}
	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}
	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}
	public Double getDistanceKm() {
		return distanceKm;
	}
	public void setDistanceKm(Double distanceKm) {
		this.distanceKm = distanceKm;
	}
	public List<MenuItemDTO> getSpecialMenuItems() {
		return specialMenuItems;
	}
	public void setSpecialMenuItems(List<MenuItemDTO> specialMenuItems) {
		this.specialMenuItems = specialMenuItems;
	}
	public String getImageUrl() {
		return imageUrl;
	}
	public void setImageUrl(String imageUrl) {
		this.imageUrl = imageUrl;
	}
	public String getCloudinaryPublicId() {
		return cloudinaryPublicId;
	}
	public void setCloudinaryPublicId(String cloudinaryPublicId) {
		this.cloudinaryPublicId = cloudinaryPublicId;
	}
    
    
    
}