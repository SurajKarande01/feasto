package com.feasto.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.feasto.dto.ReviewDTO;
import com.feasto.entity.DeliveryPartner;
import com.feasto.entity.Review;
import com.feasto.exception.ResourceNotFoundException;
import com.feasto.mapper.CustomMapper;
import com.feasto.repository.OrderRepository;
import com.feasto.repository.RestaurantRepository;
import com.feasto.repository.ReviewRepository;
import com.feasto.repository.UserRepository;

@Service
public class ReviewService {
        @Autowired
        private com.feasto.repository.DeliveryPartnerRepository deliveryPartnerRepository;

        @Autowired
        private CustomMapper mapper;

        @Autowired
        private ReviewRepository reviewRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private RestaurantRepository restaurantRepository;

        @Autowired
        private OrderRepository orderRepository;

        @CacheEvict(value = "reviewsByRestaurant", key = "#dto.restaurantId", condition = "#dto.restaurantId != null")
        public ReviewDTO submitReview(ReviewDTO dto) {
                userRepository.findById(dto.getUserId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "User not found with id: " + dto.getUserId()));
                if (dto.getRestaurantId() != null) {
                        restaurantRepository.findById(dto.getRestaurantId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Restaurant not found with id: " + dto.getRestaurantId()));
                }
                if (dto.getOrderId() != null) {
                        orderRepository.findById(dto.getOrderId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Order not found with id: " + dto.getOrderId()));
                }
                if (dto.getDeliveryPartnerId() != null) {
                        deliveryPartnerRepository.findById(dto.getDeliveryPartnerId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Delivery Partner not found with id: "
                                                                        + dto.getDeliveryPartnerId()));
                }
                Review review = mapper.toReview(dto);
                // Set delivery partner if present
                if (dto.getDeliveryPartnerId() != null) {
                        review.setDeliveryPartner(deliveryPartnerRepository.findById(dto.getDeliveryPartnerId()).get());
                }
                Review saved = reviewRepository.save(review);

                // Update average rating for delivery partner if applicable
                if (dto.getDeliveryPartnerId() != null) {
                        List<Review> partnerReviews = reviewRepository
                                        .findByDeliveryPartner_DeliveryPartnerId(dto.getDeliveryPartnerId());
                        double avg = partnerReviews.stream().mapToInt(r -> r.getRating() != null ? r.getRating() : 0)
                                        .average().orElse(0.0);
                        DeliveryPartner partner = deliveryPartnerRepository.findById(dto.getDeliveryPartnerId()).get();
                        partner.setAverageRating(avg);
                        deliveryPartnerRepository.save(partner);
                }
                // Evict cached reviews for restaurant (if any) so next read is fresh
                if (dto.getRestaurantId() != null) {
                        // Use cache name 'reviewsByRestaurant' configured in ehcache.xml
                        // Eviction done via annotation below using @CacheEvict on this method
                }
                return mapper.toReviewDTO(saved);
        }

        @Cacheable(value = "reviewsByRestaurant", key = "#restaurantId")
        public List<ReviewDTO> getReviewsByRestaurantId(Long restaurantId) {
                restaurantRepository.findById(restaurantId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Restaurant not found with id: " + restaurantId));
                return reviewRepository.findByRestaurant_RestaurantId(restaurantId).stream()
                                .map(mapper::toReviewDTO)
                                .collect(Collectors.toList());
        }

        public ReviewDTO getReviewById(Long id) {
                Review review = reviewRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));
                return mapper.toReviewDTO(review);
        }
}