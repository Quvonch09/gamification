package com.sfera.gamification.repository;

import com.sfera.gamification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE (n.targetRole IS NULL OR n.targetRole = :role OR (n.targetUser IS NOT NULL AND n.targetUser.id = :userId)) ORDER BY n.createdAt DESC")
    List<Notification> findForUser(@Param("role") String role, @Param("userId") Long userId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.read = false AND (n.targetRole IS NULL OR n.targetRole = :role OR (n.targetUser IS NOT NULL AND n.targetUser.id = :userId))")
    long countUnreadForUser(@Param("role") String role, @Param("userId") Long userId);
}
