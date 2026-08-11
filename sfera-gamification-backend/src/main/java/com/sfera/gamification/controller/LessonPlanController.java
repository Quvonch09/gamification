package com.sfera.gamification.controller;

import com.sfera.gamification.entity.Course;
import com.sfera.gamification.entity.LessonPlan;
import com.sfera.gamification.repository.CourseRepository;
import com.sfera.gamification.repository.LessonPlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/lesson-plans")
public class LessonPlanController {

    @Autowired
    private LessonPlanRepository lessonPlanRepository;

    @Autowired
    private CourseRepository courseRepository;

    @GetMapping
    public ResponseEntity<List<LessonPlan>> getLessonPlans(@RequestParam(required = false) Long courseId) {
        if (courseId != null) {
            return ResponseEntity.ok(lessonPlanRepository.findByCourseIdOrderBySequenceOrderAsc(courseId));
        }
        return ResponseEntity.ok(lessonPlanRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MENTOR')")
    public ResponseEntity<?> createLessonPlan(@RequestBody LessonPlanDto dto) {
        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

        LessonPlan plan = LessonPlan.builder()
                .course(course)
                .title(dto.getTitle())
                .content(dto.getContent())
                .sequenceOrder(dto.getSequenceOrder())
                .createdAt(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(lessonPlanRepository.save(plan));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MENTOR')")
    public ResponseEntity<?> updateLessonPlan(@PathVariable Long id, @RequestBody LessonPlanDto dto) {
        LessonPlan plan = lessonPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson plan not found"));

        if (dto.getCourseId() != null) {
            Course course = courseRepository.findById(dto.getCourseId())
                    .orElseThrow(() -> new RuntimeException("Course not found"));
            plan.setCourse(course);
        }

        plan.setTitle(dto.getTitle());
        plan.setContent(dto.getContent());
        plan.setSequenceOrder(dto.getSequenceOrder());

        return ResponseEntity.ok(lessonPlanRepository.save(plan));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MENTOR')")
    public ResponseEntity<?> deleteLessonPlan(@PathVariable Long id) {
        LessonPlan plan = lessonPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson plan not found"));
        lessonPlanRepository.delete(plan);
        return ResponseEntity.ok().build();
    }

    // Helper DTO
    public static class LessonPlanDto {
        private Long courseId;
        private String title;
        private String content;
        private Integer sequenceOrder;

        public Long getCourseId() { return courseId; }
        public void setCourseId(Long courseId) { this.courseId = courseId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public Integer getSequenceOrder() { return sequenceOrder; }
        public void setSequenceOrder(Integer sequenceOrder) { this.sequenceOrder = sequenceOrder; }
    }
}
