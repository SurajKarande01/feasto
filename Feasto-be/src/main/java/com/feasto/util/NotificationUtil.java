package com.feasto.util;

import com.feasto.dto.NotificationDTO;

public class NotificationUtil {
    public static NotificationDTO buildNotification(String type, String message, Long recipientId) {
        NotificationDTO notification = new NotificationDTO();
        notification.setType(type);
        notification.setMessage(message);
        notification.setRecipientId(recipientId);
        return notification;
    }
}
