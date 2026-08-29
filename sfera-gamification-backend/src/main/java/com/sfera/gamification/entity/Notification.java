package com.sfera.gamification.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 50)
    private String type; // PAYMENT, LESSON, ATTENDANCE_REMINDER, ABSENT_STUDENT_CALL, SYSTEM

    @Column(name = "target_role", length = 50)
    private String targetRole; // SUPER_ADMIN, BRANCH_ADMIN, ACCOUNTANT, MENTOR, etc.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id")
    private User targetUser;

    @Column(name = "is_read")
    private Boolean read;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
