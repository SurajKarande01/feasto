package com.feasto.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.feasto.entity.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientIdAndRecipientRole(Long recipientId, String recipientRole);

    List<Notification> findByRecipientIdAndRecipientRoleOrderByTimestampDesc(Long recipientId, String recipientRole);

    List<Notification> findByRecipientIdAndRecipientRoleAndIsReadFalseOrderByTimestampDesc(Long recipientId,
            String recipientRole);

    long countByRecipientIdAndRecipientRoleAndIsReadFalse(Long recipientId, String recipientRole);
}
