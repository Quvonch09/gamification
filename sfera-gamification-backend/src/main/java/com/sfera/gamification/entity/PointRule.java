package com.sfera.gamification.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "point_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code; // ATTENDANCE_PRESENT, HOMEWORK_DONE, etc.

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer points;

    @Column(nullable = false)
    private String type; // POSITIVE, NEGATIVE

    @Column(nullable = false)
    private Boolean active;
}
