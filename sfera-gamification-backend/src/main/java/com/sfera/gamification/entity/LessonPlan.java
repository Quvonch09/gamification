package com.sfera.gamification.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "module_title")
    private String moduleTitle;  // "1-module", "2-module" va h.k.

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "homework_task", columnDefinition = "TEXT")
    private String homeworkTask;  // Uyga vazifa

    @Column(name = "sequence_order", nullable = false)
    private Integer sequenceOrder;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
