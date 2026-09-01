package com.sfera.gamification.repository;

import com.sfera.gamification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE (n.targetUser IS NOT NULL AND n.targetUser.id = :userId) OR (n.targetUser IS NULL AND (n.targetRole IS NULL OR n.targetRole = 'ALL' OR n.targetRole = :role OR (:role IN ('ADMIN', 'BRANCH_ADMIN', 'SUPER_ADMIN') AND n.targetRole IN ('ADMIN', 'BRANCH_ADMIN', 'SUPER_ADMIN')))) ORDER BY n.createdAt DESC")
    List<Notification> findForUser(@Param("role") String role, @Param("userId") Long userId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE (n.read IS NULL OR n.read = false) AND ((n.targetUser IS NOT NULL AND n.targetUser.id = :userId) OR (n.targetUser IS NULL AND (n.targetRole IS NULL OR n.targetRole = 'ALL' OR n.targetRole = :role OR (:role IN ('ADMIN', 'BRANCH_ADMIN', 'SUPER_ADMIN') AND n.targetRole IN ('ADMIN', 'BRANCH_ADMIN', 'SUPER_ADMIN')))))")
    long countUnreadForUser(@Param("role") String role, @Param("userId") Long userId);
}
