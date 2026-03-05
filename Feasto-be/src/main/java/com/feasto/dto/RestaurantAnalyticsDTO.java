package com.feasto.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantAnalyticsDTO {
	private Long restaurantId;
	private Long totalOrders;
	private Double totalRevenue;
	private Double averageOrderValue;
	private Double averageRating;
	private Long totalReviews;
	private Map<String, Long> ordersByStatus; // status -> count
	private List<TopMenuItem> topMenuItems; // top sold items

	public Long getRestaurantId() {
		return restaurantId;
	}

	public void setRestaurantId(Long restaurantId) {
		this.restaurantId = restaurantId;
	}

	public Long getTotalOrders() {
		return totalOrders;
	}

	public void setTotalOrders(Long totalOrders) {
		this.totalOrders = totalOrders;
	}

	public Double getTotalRevenue() {
		return totalRevenue;
	}

	public void setTotalRevenue(Double totalRevenue) {
		this.totalRevenue = totalRevenue;
	}

	public Double getAverageOrderValue() {
		return averageOrderValue;
	}

	public void setAverageOrderValue(Double averageOrderValue) {
		this.averageOrderValue = averageOrderValue;
	}

	public Double getAverageRating() {
		return averageRating;
	}

	public void setAverageRating(Double averageRating) {
		this.averageRating = averageRating;
	}

	public Long getTotalReviews() {
		return totalReviews;
	}

	public void setTotalReviews(Long totalReviews) {
		this.totalReviews = totalReviews;
	}

	public Map<String, Long> getOrdersByStatus() {
		return ordersByStatus;
	}

	public void setOrdersByStatus(Map<String, Long> ordersByStatus) {
		this.ordersByStatus = ordersByStatus;
	}

	public List<TopMenuItem> getTopMenuItems() {
		return topMenuItems;
	}

	public void setTopMenuItems(List<TopMenuItem> topMenuItems) {
		this.topMenuItems = topMenuItems;
	}

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class TopMenuItem {
		private Long menuItemId;
		private String name;
		private Long quantitySold;
		private Double revenueGenerated;

		public TopMenuItem(Long menuItemId2, String name2, Long qty, Double rev) {
			this.menuItemId = menuItemId2;
			this.name = name2;
			this.quantitySold = qty;
			this.revenueGenerated = rev;
		}

		public Long getMenuItemId() {
			return menuItemId;
		}

		public void setMenuItemId(Long menuItemId) {
			this.menuItemId = menuItemId;
		}

		public String getName() {
			return name;
		}

		public void setName(String name) {
			this.name = name;
		}

		public Long getQuantitySold() {
			return quantitySold;
		}

		public void setQuantitySold(Long quantitySold) {
			this.quantitySold = quantitySold;
		}

		public Double getRevenueGenerated() {
			return revenueGenerated;
		}

		public void setRevenueGenerated(Double revenueGenerated) {
			this.revenueGenerated = revenueGenerated;
		}

	}
}
