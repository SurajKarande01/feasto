package com.feasto.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.feasto.dto.NotificationDTO;
import com.feasto.entity.Notification;
import com.feasto.mapper.CustomMapper;
import com.feasto.repository.NotificationRepository;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private CustomMapper mapper;

    // Get unread count
    @GetMapping("/{role}/{id}/unread-count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable String role, @PathVariable Long id) {
        long cnt = notificationRepository.countByRecipientIdAndRecipientRoleAndIsReadFalse(id, role);
        return ResponseEntity.ok(cnt);
    }

    // Get notifications for a recipient (role must be CUSTOMER, RESTAURANT or
    // DELIVERY_PARTNER)
    @GetMapping("/{role}/{id}")
    public ResponseEntity<List<NotificationDTO>> getNotifications(@PathVariable String role, @PathVariable Long id) {
        List<Notification> list = notificationRepository.findByRecipientIdAndRecipientRoleOrderByTimestampDesc(id,
                role);
        List<NotificationDTO> dtos = list.stream().map(n -> mapper.toNotificationDTO(n)).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // Get unread notifications only
    @GetMapping("/{role}/{id}/unread")
    public ResponseEntity<List<NotificationDTO>> getUnread(@PathVariable String role, @PathVariable Long id) {
        List<Notification> list = notificationRepository
                .findByRecipientIdAndRecipientRoleAndIsReadFalseOrderByTimestampDesc(id, role);
        List<NotificationDTO> dtos = list.stream().map(n -> mapper.toNotificationDTO(n)).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // Mark a notification as read
    @PostMapping("/mark-read/{notificationId}")
    public ResponseEntity<Void> markRead(@PathVariable Long notificationId) {
        Notification n = notificationRepository.findById(notificationId).orElse(null);
        if (n != null) {
            n.setIsRead(true);
            notificationRepository.save(n);
        }
        return ResponseEntity.noContent().build();
    }

    // Mark all notifications for a recipient as read
    @PostMapping("/{role}/{id}/mark-all-read")
    public ResponseEntity<Void> markAllRead(@PathVariable String role, @PathVariable Long id) {
        List<Notification> list = notificationRepository.findByRecipientIdAndRecipientRole(id, role);
        for (Notification n : list) {
            if (Boolean.FALSE.equals(n.getIsRead())) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        }
        return ResponseEntity.noContent().build();
    }
}
