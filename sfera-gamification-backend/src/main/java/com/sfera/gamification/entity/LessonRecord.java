package com.sfera.gamification.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "attendance_status", nullable = false)
    private String attendanceStatus; // KELDI, SABABLI, SABABSIZ

    @Column(name = "attendance_note", length = 500)
    private String attendanceNote; // Izoh (faqat SABABLI holatda)

    @Column(name = "homework_status")
    private String homeworkStatus; // BAJARDI, BAJARMADI, NONE, BERILMAGAN

    @Column(name = "project_count")
    private Integer projectCount;

    @Column(name = "question_answer")
    private Boolean questionAnswer;

    @Column(name = "activity")
    private Boolean activity;

    @Column(name = "phone_game")
    private Boolean phoneGame;

    @Column(name = "calculated_points")
    private Integer calculatedPoints;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
