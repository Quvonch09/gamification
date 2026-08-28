package com.sfera.gamification.controller;

import com.sfera.gamification.entity.Course;
import com.sfera.gamification.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @Autowired
    private GroupService groupService;

    @GetMapping
    public ResponseEntity<?> getAllCourses() {
        return ResponseEntity.ok(groupService.getAllCourses());
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> createCourse(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Kurs nomi majburiy");
        }

        BigDecimal price = BigDecimal.ZERO;
        if (request.get("price") != null) {
            try {
                price = new BigDecimal(request.get("price").toString());
            } catch (Exception ignored) {}
        }

        Integer durationMonths = 1;
        if (request.get("durationMonths") != null) {
            try {
                durationMonths = Integer.parseInt(request.get("durationMonths").toString());
            } catch (Exception ignored) {}
        }

        Course course = Course.builder()
                .name(name.trim())
                .price(price)
                .durationMonths(durationMonths)
                .status("ACTIVE")
                .build();
        return ResponseEntity.ok(groupService.saveCourse(course));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateCourse(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Course course = groupService.getCourseById(id);
        if (course == null) {
            return ResponseEntity.notFound().build();
        }

        String name = (String) request.get("name");
        if (name != null && !name.trim().isEmpty()) {
            course.setName(name.trim());
        }

        if (request.get("price") != null) {
            try {
                course.setPrice(new BigDecimal(request.get("price").toString()));
            } catch (Exception ignored) {}
        }

        if (request.get("durationMonths") != null) {
            try {
                course.setDurationMonths(Integer.parseInt(request.get("durationMonths").toString()));
            } catch (Exception ignored) {}
        }

        if (request.get("status") != null) {
            course.setStatus(request.get("status").toString());
        }

        return ResponseEntity.ok(groupService.saveCourse(course));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        Course course = groupService.getCourseById(id);
        if (course == null) {
            return ResponseEntity.notFound().build();
        }
        groupService.deleteCourse(id);
        return ResponseEntity.ok().build();
    }
}
