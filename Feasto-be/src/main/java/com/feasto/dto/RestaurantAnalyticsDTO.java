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

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class TopMenuItem {
		private Long menuItemId;
		private String name;
		private Long quantitySold;
		private Double revenueGenerated;
	}
}
