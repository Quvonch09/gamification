package com.sfera.gamification.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "point_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor; // Who awarded the points (System User)

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "point_rule_id", nullable = false)
    private PointRule pointRule;

    @Column(nullable = false)
    private Integer points; // Total points for this transaction

    @Column(nullable = false)
    private Integer quantity; // Number of items (e.g., 2 projects -> quantity 2)

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String status; // ACTIVE, CANCELLED

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cancelled_by")
    private User cancelledBy; // Admin who cancelled the transaction
}
