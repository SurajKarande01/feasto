package com.feasto.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.feasto.dto.NotificationDTO;
import com.feasto.entity.Notification;
import com.feasto.repository.NotificationRepository;

@Service
public class NotificationService {
    private final SimpMessagingTemplate messagingTemplate;
    @Autowired
    private NotificationRepository notificationRepository;

    public NotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Send notification to a specific user (by userId)
    public void notifyUser(Long userId, NotificationDTO notification) {
        notification.setTimestamp(LocalDateTime.now());
        notification.setRecipientRole("CUSTOMER");
        // Save to DB
        Notification entity = new Notification(null, notification.getType(), notification.getMessage(),
                userId, "CUSTOMER", notification.getTimestamp(), false);
        notificationRepository.save(entity);
        messagingTemplate.convertAndSend("/user/" + userId + "/queue/notifications", notification);
    }

    // Send notification to a specific restaurant (by restaurantId)
    public void notifyRestaurant(Long restaurantId, NotificationDTO notification) {
        notification.setTimestamp(LocalDateTime.now());
        notification.setRecipientRole("RESTAURANT");
        Notification entity = new Notification(null, notification.getType(), notification.getMessage(),
                restaurantId, "RESTAURANT", notification.getTimestamp(), false);
        notificationRepository.save(entity);
        messagingTemplate.convertAndSend("/user/restaurant-" + restaurantId + "/queue/notifications", notification);
    }

    // Send notification to a specific delivery partner (by deliveryPartnerId)
    public void notifyDeliveryPartner(Long deliveryPartnerId, NotificationDTO notification) {
        notification.setTimestamp(LocalDateTime.now());
        notification.setRecipientRole("DELIVERY_PARTNER");
        Notification entity = new Notification(null, notification.getType(), notification.getMessage(),
                deliveryPartnerId, "DELIVERY_PARTNER", notification.getTimestamp(), false);
        notificationRepository.save(entity);
        messagingTemplate.convertAndSend("/user/delivery-" + deliveryPartnerId + "/queue/notifications", notification);
    }

    // Optionally, broadcast to all (for admin or system-wide messages)
    public void broadcast(NotificationDTO notification) {
        notification.setTimestamp(LocalDateTime.now());
        notificationRepository.save(new Notification(null, notification.getType(), notification.getMessage(),
                null, "ALL", notification.getTimestamp(), false));
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }

    // Publish to arbitrary topic (useful for React subscriptions on specific
    // channels)
    public void publishToTopic(String topic, NotificationDTO notification) {
        notification.setTimestamp(LocalDateTime.now());
        messagingTemplate.convertAndSend(topic, notification);
    }
}
