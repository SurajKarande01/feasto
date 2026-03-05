package com.feasto.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private String type; // e.g. ORDER_PLACED, ORDER_ACCEPTED, etc.
    private String message;
    private Long recipientId; // userId, restaurantId, or deliveryPartnerId
    private String recipientRole; // CUSTOMER, RESTAURANT, DELIVERY_PARTNER
    private LocalDateTime timestamp;
    private boolean read = false;
	public String getType() {
		return type;
	}
	public void setType(String type) {
		this.type = type;
	}
	public String getMessage() {
		return message;
	}
	public void setMessage(String message) {
		this.message = message;
	}
	public Long getRecipientId() {
		return recipientId;
	}
	public void setRecipientId(Long recipientId) {
		this.recipientId = recipientId;
	}
	public String getRecipientRole() {
		return recipientRole;
	}
	public void setRecipientRole(String recipientRole) {
		this.recipientRole = recipientRole;
	}
	public LocalDateTime getTimestamp() {
		return timestamp;
	}
	public void setTimestamp(LocalDateTime timestamp) {
		this.timestamp = timestamp;
	}
	public boolean isRead() {
		return read;
	}
	public void setRead(boolean read) {
		this.read = read;
	}
    
    
}
