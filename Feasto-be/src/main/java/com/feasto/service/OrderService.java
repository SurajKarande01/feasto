package com.feasto.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.feasto.dto.OrderDTO;
import com.feasto.entity.DeliveryPartner;
import com.feasto.entity.Order;
import com.feasto.entity.OrderItem;
import com.feasto.entity.Payment;
import com.feasto.entity.Restaurant;
import com.feasto.entity.User;
import com.feasto.enums.OrderStatus;
import com.feasto.enums.PaymentMethod;
import com.feasto.enums.PaymentStatus;
import com.feasto.exception.ResourceNotFoundException;
import com.feasto.exception.ValidationException;
import com.feasto.mapper.CustomMapper;
import com.feasto.repository.DeliveryPartnerRepository;
import com.feasto.repository.OrderItemRepository;
import com.feasto.repository.OrderRepository;
import com.feasto.repository.RestaurantRepository;
import com.feasto.repository.UserRepository;
import com.feasto.util.DistanceUtil;
import com.feasto.util.NotificationUtil;
import com.feasto.util.OrderUtil;

@Service
public class OrderService {
	@Autowired
	private NotificationService notificationService;
	@Autowired
	private com.feasto.repository.PaymentRepository paymentRepository;

	@Autowired
	private CustomMapper mapper;

	@Autowired
	private OrderRepository orderRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private RestaurantRepository restaurantRepository;

	@Autowired
	private OrderItemRepository orderItemRepository;

	@Autowired
	private DeliveryPartnerRepository deliveryPartnerRepository;

	@Autowired
	private com.feasto.repository.MenuItemRepository menuItemRepository;

	// Scoring weights and normalization settings for auto-assignment
	@Value("${feasto.scoring.proximityWeight:0.7}")
	private double proximityWeight;

	@Value("${feasto.scoring.ratingWeight:0.3}")
	private double ratingWeight;

	@Value("${feasto.scoring.maxDistanceKm:10.0}")
	private double maxDistanceKm;

	private static final double MAX_RATING = 5.0;

	@CacheEvict(value = { "ordersByRestaurant", "ordersByUser", "ordersByDeliveryPartner",
			"orderById" }, allEntries = true)
	@Transactional
	public OrderDTO placeOrder(OrderDTO orderDTO) {
		User user = userRepository.findById(orderDTO.getUserId())
				.orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + orderDTO.getUserId()));
		Restaurant restaurant = restaurantRepository.findById(orderDTO.getRestaurantId())
				.orElseThrow(() -> new ResourceNotFoundException(
						"Restaurant not found with id: " + orderDTO.getRestaurantId()));
		Order order = mapper.toOrderEntity(orderDTO, user, restaurant);

		// Recalculate subtotal using menu item prices from the database for security
		double calculatedSubtotal = 0.0;
		if (order.getOrderItems() != null) {
			for (OrderItem item : order.getOrderItems()) {
				if (item.getMenuItem() == null || item.getMenuItem().getMenuItemId() == null) {
					throw new ValidationException("Menu item ID must not be null");
				}
				com.feasto.entity.MenuItem dbMenuItem = menuItemRepository.findById(item.getMenuItem().getMenuItemId())
						.orElseThrow(() -> new ResourceNotFoundException(
								"Menu item not found with id: " + item.getMenuItem().getMenuItemId()));
				item.setPrice(dbMenuItem.getPrice());
				calculatedSubtotal += dbMenuItem.getPrice() * item.getQuantity();
			}
		}

		// Validate and calculate promo code discount
		double discountAmount = 0.0;
		if (orderDTO.getPromoCode() != null && !orderDTO.getPromoCode().trim().isEmpty()) {
			String code = orderDTO.getPromoCode().trim().toUpperCase();
			if (code.equals("WELCOME10") || code.equals("FEASTO10")) {
				discountAmount = calculatedSubtotal * 0.10;
			} else if (code.equals("GOLD20")) {
				discountAmount = calculatedSubtotal * 0.20;
			} else {
				throw new ValidationException("Invalid promo code: " + code);
			}
		}

		// Calculate delivery charge and tip
		double deliveryCharge = calculatedSubtotal > 0 ? 30.0 : 0.0;
		double tipAmount = orderDTO.getTipAmount() != null ? orderDTO.getTipAmount() : 0.0;
		if (tipAmount < 0) {
			throw new ValidationException("Tip amount cannot be negative");
		}

		double expectedTotal = calculatedSubtotal + deliveryCharge + tipAmount - discountAmount;
		expectedTotal = Math.round(expectedTotal * 100.0) / 100.0;

		order.setDiscountAmount(discountAmount);
		order.setTipAmount(tipAmount);
		order.setTotalAmount(expectedTotal);
		order.setOrderStatus(OrderStatus.PLACED);

		Order savedOrder = orderRepository.save(order);
		for (OrderItem item : order.getOrderItems()) {
			item.setOrder(savedOrder);
			orderItemRepository.save(item);
		}
		// Payment for COD will be created/completed when order is delivered

		// 1. Notify restaurant when user places an order
		notificationService.notifyRestaurant(
				restaurant.getRestaurantId(),
				NotificationUtil.buildNotification(
						"ORDER_PLACED",
						"New order placed by user #" + user.getUserId(),
						restaurant.getRestaurantId()));

		return mapper.toOrderDTO(savedOrder);
	}

	/**
	 * Automated assignment of best delivery partner for an order.
	 * Criteria: availability, (proximity), rating, orders completed.
	 * Proximity/geospatial logic is commented for future implementation.
	 * Returns assigned OrderDTO or null if no available partner.
	 */
	@CacheEvict(value = { "ordersByRestaurant", "ordersByUser", "ordersByDeliveryPartner",
			"orderById" }, allEntries = true)
	@Transactional
	public OrderDTO autoAssignDeliveryPartner(Long orderId) {
		Order order = orderRepository.findById(orderId)
				.orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
		if (order.getDeliveryPartner() != null) {
			DeliveryPartner oldPartner = order.getDeliveryPartner();
			oldPartner.setAvailable(true);
			deliveryPartnerRepository.save(oldPartner);
			order.setDeliveryPartner(null);
		}

		// 1. Get all available delivery partners
		List<DeliveryPartner> availablePartners = deliveryPartnerRepository.findByAvailableTrue();
		if (availablePartners.isEmpty()) {
			// Optionally: queue for retry
			return null;
		}

		// 2. Score each partner (combine proximity and rating)
		DeliveryPartner bestPartner = null;
		double bestScore = -1;
		for (DeliveryPartner partner : availablePartners) {
			double rating = partner.getAverageRating() != null ? partner.getAverageRating() : 0.0;
			// Compute distance-based proximity score (1 = perfect, 0 = at or beyond
			// maxDistanceKm)
			double proximityScore = 0.0;
			double distanceKm = Double.MAX_VALUE;
			if (partner.getCurrentLocation() != null && order.getRestaurant() != null
					&& order.getRestaurant().getAddress() != null
					&& order.getRestaurant().getAddress().getLatitude() != null
					&& order.getRestaurant().getAddress().getLongitude() != null
					&& partner.getCurrentLocation().getLatitude() != null
					&& partner.getCurrentLocation().getLongitude() != null) {
				double pLat = partner.getCurrentLocation().getLatitude();
				double pLon = partner.getCurrentLocation().getLongitude();
				double rLat = order.getRestaurant().getAddress().getLatitude();
				double rLon = order.getRestaurant().getAddress().getLongitude();
				distanceKm = DistanceUtil.haversine(pLat, pLon, rLat, rLon);
				// proximityScore is 1 when distance = 0, and 0 when distance >= maxDistanceKm
				proximityScore = 1.0 - Math.min(distanceKm / Math.max(0.0001, maxDistanceKm), 1.0);
			}

			// Normalize rating to 0..1
			double ratingScore = Math.max(0.0, Math.min(1.0, rating / MAX_RATING));

			// If distance is unknown, rely more on rating (we'll treat proximityScore as 0)
			double score = (proximityWeight * proximityScore) + (ratingWeight * ratingScore);
			if (score > bestScore) {
				bestScore = score;
				bestPartner = partner;
			}
		}

		if (bestPartner == null) {
			// No suitable partner found
			return null;
		}

		// 3. Assign and update
		order.setDeliveryPartner(bestPartner);
		order.setOrderStatus(OrderStatus.ASSIGNED);
		bestPartner.setAvailable(false);
		deliveryPartnerRepository.save(bestPartner);

		Order updatedOrder = orderRepository.save(order);

		// Notify delivery partner
		notificationService.notifyDeliveryPartner(
				bestPartner.getDeliveryPartnerId(),
				NotificationUtil.buildNotification(
						"ORDER_ASSIGNED_AUTO",
						"You have been automatically assigned order #" + order.getOrderId(),
						bestPartner.getDeliveryPartnerId()));

		return mapper.toOrderDTO(updatedOrder);
	}

	@Transactional(readOnly = true)
	@Cacheable(value = "orderById", key = "#id")
	public OrderDTO getOrderById(Long id) {
		Order order = orderRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
		return mapper.toOrderDTO(order);
	}

	@Transactional(readOnly = true)
	@Cacheable(value = "ordersByUser", key = "#userId")
	public List<OrderDTO> getOrdersByUserId(Long userId) {
		return orderRepository.findByUser_UserId(userId).stream()
				.map(mapper::toOrderDTO)
				.collect(Collectors.toList());
	}

	@Transactional(readOnly = true)
	@Cacheable(value = "ordersByRestaurant", key = "#restaurantId")
	public List<OrderDTO> getOrdersByRestaurantId(Long restaurantId) {
		return orderRepository.findByRestaurant_RestaurantId(restaurantId).stream()
				.map(mapper::toOrderDTO)
				.collect(Collectors.toList());
	}

	@Transactional(readOnly = true)
	@Cacheable(value = "ordersByRestaurant", key = "#restaurantId + '-' + #page + '-' + #limit")
	public Page<OrderDTO> getOrdersByRestaurantId(Long restaurantId, int page, int limit) {
		Page<Order> orders = orderRepository.findByRestaurant_RestaurantId(
				restaurantId,
				PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "orderTime")));
		return orders.map(mapper::toOrderDTO);
	}

	@Transactional(readOnly = true)
	@Cacheable(value = "ordersByRestaurant", key = "#restaurantId + '-' + (#status != null ? #status.name() : 'ALL') + '-' + #page + '-' + #limit")
	public Page<OrderDTO> getOrdersByRestaurantId(Long restaurantId, OrderStatus status, int page, int limit) {
		PageRequest pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "orderTime"));
		Page<Order> orders;
		if (status != null) {
			orders = orderRepository.findByRestaurant_RestaurantIdAndOrderStatus(restaurantId, status, pageable);
		} else {
			orders = orderRepository.findByRestaurant_RestaurantId(restaurantId, pageable);
		}
		return orders.map(mapper::toOrderDTO);
	}

	@Transactional(readOnly = true)
	@Cacheable(value = "ordersByDeliveryPartner", key = "#deliveryPartnerId", condition = "#deliveryPartnerId != null")
	public List<OrderDTO> getOrdersByDeliveryPartnerId(Long deliveryPartnerId) {
		return orderRepository.findByDeliveryPartner_DeliveryPartnerId(deliveryPartnerId).stream()
				.map(mapper::toOrderDTO)
				.collect(Collectors.toList());
	}

	@CacheEvict(value = { "ordersByRestaurant", "ordersByUser", "ordersByDeliveryPartner",
			"orderById" }, allEntries = true)
	@Transactional
	public OrderDTO updateOrderStatus(Long id, OrderStatus status) {
		Order order = orderRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
		
		// Validate order status transitions (like real food delivery platforms)
		validateStatusTransition(order.getOrderStatus(), status);
		
		order.setOrderStatus(status);
		// when delivered, set deliveryTime and handle COD / delivery partner
		// availability
		if (status == OrderStatus.DELIVERED) {
			order.setDeliveryTime(java.time.LocalDateTime.now());
			// If payment method is COD, ensure there's a completed Payment record.
			// Try to find existing payment for order
			Optional<Payment> existingPayment = paymentRepository.findByOrder(order);
			if (existingPayment.isEmpty()) {
				Payment payment = new Payment();
				payment.setOrder(order);
				payment.setUser(order.getUser());
				payment.setAmount(order.getTotalAmount());
				payment.setPaymentMethod(PaymentMethod.COD);
				payment.setPaymentStatus(PaymentStatus.COMPLETED);
				payment.setTransactionId(OrderUtil.generatePaymentId());
				paymentRepository.save(payment);
			} else {
				Payment p = existingPayment.get();
				if (p.getPaymentMethod() == PaymentMethod.COD
						&& p.getPaymentStatus() != PaymentStatus.COMPLETED) {
					p.setPaymentStatus(PaymentStatus.COMPLETED);
					if (p.getTransactionId() == null) {
						p.setTransactionId(OrderUtil.generatePaymentId());
					}
					paymentRepository.save(p);
				}
			}

			// Make delivery partner available again (if assigned)
			DeliveryPartner dp = order.getDeliveryPartner();
			if (dp != null) {
				dp.setAvailable(true);
				deliveryPartnerRepository.save(dp);
			}
		}

		Order updatedOrder = orderRepository.save(order);
		// 2. Notify user about the specific order status update
		String notifType = "ORDER_" + (status != null ? status.name() : "STATUS_UPDATE");
		notificationService.notifyUser(
				order.getUser() != null ? order.getUser().getUserId() : null,
				NotificationUtil.buildNotification(
						notifType,
						"Your order #" + order.getOrderId() + " is now " + status,
						order.getUser() != null ? order.getUser().getUserId() : null));

		return mapper.toOrderDTO(updatedOrder);
	}

	@CacheEvict(value = { "ordersByRestaurant", "ordersByUser", "ordersByDeliveryPartner",
			"orderById" }, allEntries = true)
	@Transactional
	public OrderDTO assignDeliveryPartner(Long orderId, Long deliveryPartnerId) {
		Order order = orderRepository.findById(orderId)
				.orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
		DeliveryPartner deliveryPartner = deliveryPartnerRepository.findById(deliveryPartnerId)
				.orElseThrow(() -> new ResourceNotFoundException(
						"Delivery partner not found with id: " + deliveryPartnerId));
		if (order.getDeliveryPartner() != null) {
			DeliveryPartner oldPartner = order.getDeliveryPartner();
			if (!oldPartner.getDeliveryPartnerId().equals(deliveryPartnerId)) {
				oldPartner.setAvailable(true);
				deliveryPartnerRepository.save(oldPartner);
			}
		}
		if (!Boolean.TRUE.equals(deliveryPartner.getAvailable())) {
			throw new ValidationException("Selected delivery partner is not available");
		}
		order.setDeliveryPartner(deliveryPartner);
		order.setOrderStatus(OrderStatus.ASSIGNED);
		deliveryPartner.setAvailable(false);
		deliveryPartnerRepository.save(deliveryPartner);
		Order updatedOrder = orderRepository.save(order);

		// 3. Notify delivery partner when restaurant assigns order
		notificationService.notifyDeliveryPartner(
				deliveryPartnerId,
				NotificationUtil.buildNotification(
						"ORDER_ASSIGNED",
						"You have been assigned order #" + order.getOrderId(),
						deliveryPartnerId));

		return mapper.toOrderDTO(updatedOrder);
	}

	@CacheEvict(value = { "ordersByRestaurant", "ordersByUser", "ordersByDeliveryPartner",
			"orderById" }, allEntries = true)
	@Transactional
	public void deliveryPartnerAcceptOrder(Long orderId, Long deliveryPartnerId) {
		Order order = orderRepository.findById(orderId)
				.orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
		// ... update order status, etc. as needed
		// 4. Notify customer when delivery partner accepts order
		notificationService.notifyUser(
				order.getUser() != null ? order.getUser().getUserId() : null,
				NotificationUtil.buildNotification(
						"ORDER_ACCEPTED_BY_DELIVERY",
						"Your order #" + order.getOrderId() + " has been accepted by delivery partner.",
						order.getUser() != null ? order.getUser().getUserId() : null));
	}

	/**
	 * Validates that the order status transition is valid.
	 * Enforces the correct lifecycle:
	 * PLACED → ACCEPTED / REJECTED / CANCELLED
	 * ACCEPTED → PREPARING / CANCELLED
	 * PREPARING → ASSIGNED
	 * ASSIGNED → OUT_FOR_DELIVERY
	 * OUT_FOR_DELIVERY → DELIVERED
	 * DELIVERED, CANCELLED, REJECTED → terminal (no further transitions)
	 */
	private void validateStatusTransition(OrderStatus current, OrderStatus next) {
		if (current == null || next == null) return;
		
		java.util.Map<OrderStatus, java.util.Set<OrderStatus>> validTransitions = java.util.Map.of(
			OrderStatus.PLACED, java.util.Set.of(OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED),
			OrderStatus.ACCEPTED, java.util.Set.of(OrderStatus.PREPARING, OrderStatus.CANCELLED),
			OrderStatus.PREPARING, java.util.Set.of(OrderStatus.ASSIGNED),
			OrderStatus.ASSIGNED, java.util.Set.of(OrderStatus.OUT_FOR_DELIVERY),
			OrderStatus.OUT_FOR_DELIVERY, java.util.Set.of(OrderStatus.DELIVERED),
			OrderStatus.DELIVERED, java.util.Set.of(),
			OrderStatus.CANCELLED, java.util.Set.of(),
			OrderStatus.REJECTED, java.util.Set.of()
		);
		
		java.util.Set<OrderStatus> allowed = validTransitions.get(current);
		if (allowed != null && !allowed.contains(next)) {
			throw new ValidationException(
				"Invalid status transition from " + current + " to " + next + 
				". Allowed: " + allowed);
		}
	}
}