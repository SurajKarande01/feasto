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

    /**
     * Constructor injection for SimpMessagingTemplate to handle WebSocket messages.
     */
    public NotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Persists and sends a notification to a specific customer.
     * Saves the event in the database for history and publishes to their private WebSocket queue.
     */
    public void notifyUser(Long userId, NotificationDTO notification) {
        notification.setTimestamp(LocalDateTime.now());
        notification.setRecipientRole("CUSTOMER");
        // Save to DB
        Notification entity = new Notification(null, notification.getType(), notification.getMessage(),
                userId, "CUSTOMER", notification.getTimestamp(), false);
        notificationRepository.save(entity);
        messagingTemplate.convertAndSend("/user/" + userId + "/queue/notifications", notification);
    }

    /**
     * Persists and sends a notification to a specific restaurant owner.
     * Publishes to their specific restaurant WebSocket queue to update their dashboard immediately.
     */
    public void notifyRestaurant(Long restaurantId, NotificationDTO notification) {
        notification.setTimestamp(LocalDateTime.now());
        notification.setRecipientRole("RESTAURANT");
        Notification entity = new Notification(null, notification.getType(), notification.getMessage(),
                restaurantId, "RESTAURANT", notification.getTimestamp(), false);
        notificationRepository.save(entity);
        messagingTemplate.convertAndSend("/user/restaurant-" + restaurantId + "/queue/notifications", notification);
    }

    /**
     * Persists and sends a notification to a specific delivery rider.
     * Triggers their mobile/web portal with order alerts.
     */
    public void notifyDeliveryPartner(Long deliveryPartnerId, NotificationDTO notification) {
        notification.setTimestamp(LocalDateTime.now());
        notification.setRecipientRole("DELIVERY_PARTNER");
        Notification entity = new Notification(null, notification.getType(), notification.getMessage(),
                deliveryPartnerId, "DELIVERY_PARTNER", notification.getTimestamp(), false);
        notificationRepository.save(entity);
        messagingTemplate.convertAndSend("/user/delivery-" + deliveryPartnerId + "/queue/notifications", notification);
    }

    /**
     * Broadcasts a notification to all active connections in the system (global system alerts).
     */
    public void broadcast(NotificationDTO notification) {
        notification.setTimestamp(LocalDateTime.now());
        notificationRepository.save(new Notification(null, notification.getType(), notification.getMessage(),
                null, "ALL", notification.getTimestamp(), false));
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }

    /**
     * Publishes a raw notification payload to an arbitrary WebSocket destination topic.
     */
    public void publishToTopic(String topic, NotificationDTO notification) {
        notification.setTimestamp(LocalDateTime.now());
        messagingTemplate.convertAndSend(topic, notification);
    }
}
