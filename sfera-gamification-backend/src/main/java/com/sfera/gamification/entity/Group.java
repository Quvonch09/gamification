package com.sfera.gamification.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "groups")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Group {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mentor_id")
    private Mentor mentor;

    @Column(nullable = false)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, ARCHIVED

    @Column(name = "schedule")
    private String schedule; // e.g. "Dushanba, Chorshanba, Juma 14:00 - 16:00"

    @Column(name = "days_of_week")
    private String daysOfWeek; // DUSH_CHOR_JUMA, SE_PAY_SHAN, HAR_KUNI, SHAN_YAK, MAXSUS

    @Column(name = "start_time")
    private String startTime; // "14:00"

    @Column(name = "end_time")
    private String endTime; // "16:00"

    @Column(name = "room")
    private String room;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_id")
    private Room roomRef;

    @Column(name = "lessons_per_month")
    @Builder.Default
    private Integer lessonsPerMonth = 12;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
