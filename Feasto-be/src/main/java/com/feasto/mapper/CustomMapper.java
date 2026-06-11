package com.feasto.mapper;

import java.util.List;

import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import com.feasto.dto.AddressDTO;
import com.feasto.dto.DeliveryPartnerDTO;
import com.feasto.dto.LocationDTO;
import com.feasto.dto.LoyaltyProgramDTO;
import com.feasto.dto.MenuItemDTO;
import com.feasto.dto.NotificationDTO;
import com.feasto.dto.OrderDTO;
import com.feasto.dto.OrderItemDTO;
import com.feasto.dto.PaymentDTO;
import com.feasto.dto.RestaurantDTO;
import com.feasto.dto.ReviewDTO;
import com.feasto.dto.UserDTO;
import com.feasto.dto.UserRegistrationDTO;
import com.feasto.entity.Address;
import com.feasto.entity.DeliveryPartner;
import com.feasto.entity.Location;
import com.feasto.entity.LoyaltyProgram;
import com.feasto.entity.MenuItem;
import com.feasto.entity.Notification;
import com.feasto.entity.Order;
import com.feasto.entity.OrderItem;
import com.feasto.entity.Payment;
import com.feasto.entity.Restaurant;
import com.feasto.entity.Review;
import com.feasto.entity.User;

@Component
public class CustomMapper {

    private final ModelMapper modelMapper;

    public CustomMapper() {
        this.modelMapper = new ModelMapper();

    }

    public UserDTO toUserDTO(User user) {
        return modelMapper.map(user, UserDTO.class);
    }

    public User toUser(UserDTO userDTO) {
        return modelMapper.map(userDTO, User.class);
    }

    public RestaurantDTO toRestaurantDTO(Restaurant restaurant) {
        return modelMapper.map(restaurant, RestaurantDTO.class);
    }

    public Restaurant toRestaurant(RestaurantDTO restaurantDTO) {
        return modelMapper.map(restaurantDTO, Restaurant.class);
    }

    public MenuItem toMenuItem(MenuItemDTO menuItemDTO) {
        return modelMapper.map(menuItemDTO, MenuItem.class);
    }

    public MenuItemDTO toMenuItemDTO(MenuItem menuItem) {
        return modelMapper.map(menuItem, MenuItemDTO.class);
    }

    // Manual mapping from OrderDTO to Order entity
    public Order toOrderEntity(OrderDTO dto, User user, Restaurant restaurant) {
        Order order = new Order();
        order.setOrderId(dto.getOrderId());
        order.setUser(user);
        order.setRestaurant(restaurant);
        // DeliveryPartner can be set if needed
        order.setOrderStatus(dto.getOrderStatus());
        order.setTotalAmount(dto.getTotalAmount());
        order.setDiscountAmount(dto.getDiscountAmount());
        order.setPromoCode(dto.getPromoCode());
        order.setTipAmount(dto.getTipAmount());
        order.setDeliveryAddress(dto.getDeliveryAddress());
        order.setOrderTime(dto.getOrderTime());
        order.setDeliveryTime(dto.getDeliveryTime());
        if (dto.getOrderItems() != null) {
            List<OrderItem> items = dto.getOrderItems().stream()
                    .map(this::toOrderItemEntity)
                    .collect(java.util.stream.Collectors.toList());
            order.setOrderItems(items);
        }
        return order;
    }

    // Manual mapping from OrderItemDTO to OrderItem entity
    private OrderItem toOrderItemEntity(OrderItemDTO dto) {
        OrderItem item = new OrderItem();
        item.setOrderItemId(dto.getOrderItemId());
        // Order will be set after saving parent
        if (dto.getMenuItemId() != null) {
            com.feasto.entity.MenuItem menuItem = new com.feasto.entity.MenuItem();
            menuItem.setMenuItemId(dto.getMenuItemId());
            item.setMenuItem(menuItem);
        }
        item.setQuantity(dto.getQuantity());
        item.setPrice(dto.getPrice());
        return item;
    }

    // Manual mapping from Order entity to OrderDTO
    public OrderDTO toOrderDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setOrderId(order.getOrderId());
        dto.setUserId(order.getUser() != null ? order.getUser().getUserId() : null);
        dto.setRestaurantId(order.getRestaurant() != null ? order.getRestaurant().getRestaurantId() : null);
        dto.setRestaurantName(order.getRestaurant() != null ? order.getRestaurant().getName() : null);
        dto.setDeliveryPartnerId(
                order.getDeliveryPartner() != null ? order.getDeliveryPartner().getDeliveryPartnerId() : null);
        dto.setDeliveryPartnerName(
                order.getDeliveryPartner() != null ? order.getDeliveryPartner().getName() : null);
        dto.setOrderStatus(order.getOrderStatus());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setDiscountAmount(order.getDiscountAmount());
        dto.setPromoCode(order.getPromoCode());
        dto.setTipAmount(order.getTipAmount());
        dto.setDeliveryAddress(order.getDeliveryAddress());
        dto.setOrderTime(order.getOrderTime());
        dto.setDeliveryTime(order.getDeliveryTime());
        if (order.getOrderItems() != null) {
            List<com.feasto.dto.OrderItemDTO> items = order.getOrderItems().stream()
                    .map(this::toOrderItemDTO)
                    .collect(java.util.stream.Collectors.toList());
            dto.setOrderItems(items);
        }
        return dto;
    }

    private OrderItemDTO toOrderItemDTO(OrderItem item) {
        OrderItemDTO dto = new OrderItemDTO();
        dto.setOrderItemId(item.getOrderItemId());
        dto.setOrderId(item.getOrder() != null ? item.getOrder().getOrderId() : null);
        dto.setMenuItemId(item.getMenuItem() != null ? item.getMenuItem().getMenuItemId() : null);
        dto.setMenuItemName(item.getMenuItem() != null ? item.getMenuItem().getName() : null);
        dto.setQuantity(item.getQuantity());
        dto.setPrice(item.getPrice());
        return dto;
    }

    public OrderItem toOrderItem(OrderItemDTO orderItemDTO) {
        return modelMapper.map(orderItemDTO, OrderItem.class);
    }

    public DeliveryPartnerDTO toDeliveryPartnerDTO(DeliveryPartner deliveryPartner) {
        return modelMapper.map(deliveryPartner, DeliveryPartnerDTO.class);
    }

    public DeliveryPartner toDeliveryPartner(DeliveryPartnerDTO deliveryPartnerDTO) {
        return modelMapper.map(deliveryPartnerDTO, DeliveryPartner.class);
    }

    public ReviewDTO toReviewDTO(Review review) {
        return modelMapper.map(review, ReviewDTO.class);
    }

    public Review toReview(ReviewDTO reviewDTO) {
        return modelMapper.map(reviewDTO, Review.class);
    }

    public AddressDTO toAddressDTO(Address address) {
        return modelMapper.map(address, AddressDTO.class);
    }

    public Address toAddress(AddressDTO addressDTO) {
        return modelMapper.map(addressDTO, Address.class);
    }

    public PaymentDTO toPaymentDTO(Payment payment) {
        return modelMapper.map(payment, PaymentDTO.class);
    }

    public Payment toPayment(PaymentDTO paymentDTO) {
        return modelMapper.map(paymentDTO, Payment.class);
    }

    public LoyaltyProgramDTO toLoyaltyProgramDTO(LoyaltyProgram loyaltyProgram) {
        return modelMapper.map(loyaltyProgram, LoyaltyProgramDTO.class);
    }

    public LoyaltyProgram toLoyaltyProgram(LoyaltyProgramDTO loyaltyProgramDTO) {
        return modelMapper.map(loyaltyProgramDTO, LoyaltyProgram.class);
    }

    public LocationDTO toLocationDTO(Location location) {
        return modelMapper.map(location, LocationDTO.class);
    }

    public Location toLocation(LocationDTO locationDTO) {
        return modelMapper.map(locationDTO, Location.class);
    }

    public NotificationDTO toNotificationDTO(Notification n) {
        return modelMapper.map(n, NotificationDTO.class);
    }

    public Notification toNotificationEntity(NotificationDTO dto) {
        return modelMapper.map(dto, Notification.class);
    }

    // Add more as needed for other DTOs like UserRegistrationDTO
    public User toUserFromRegistration(UserRegistrationDTO dto) {
        return modelMapper.map(dto, User.class);
    }
}