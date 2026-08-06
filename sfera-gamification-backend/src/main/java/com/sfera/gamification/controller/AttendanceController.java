package com.sfera.gamification.controller;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.*;

/**
 * Davomat (Attendance) API
 * - Admin: barcha guruhlar, filterlar bilan
 * - Mentor: faqat o'z guruhlari
 * - Student: faqat o'z davomati
 */
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private LessonRecordRepository lessonRecordRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupStudentRepository groupStudentRepository;

    @Autowired
    private MentorRepository mentorRepository;

    /**
     * GET /api/attendance?groupId=...&mentorId=...
     * Admin: barcha filtrlar
     * Mentor: faqat o'z guruhlari (mentorId parametrini e'tiborsiz qoldiradi)
     * Student: faqat o'zi
     */
    @GetMapping
    public ResponseEntity<?> getAttendance(
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) Long mentorId,
            Principal principal) {

        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");

        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(404).body("User not found");

        String role = user.getRole();
        List<LessonRecord> records = new ArrayList<>();

        if ("STUDENT".equals(role)) {
            // Student faqat o'z davomatini ko'radi
            Long studentId = null;
            if (user.getStudent() != null) {
                studentId = user.getStudent().getId();
            }
            if (studentId == null) return ResponseEntity.ok(List.of());
            records = lessonRecordRepository.findByStudentId(studentId);
        } else if ("MENTOR".equals(role)) {
            // Mentor faqat o'z guruhlarini ko'radi
            Mentor mentor = mentorRepository.findByUserId(user.getId()).orElse(null);
            if (mentor == null) return ResponseEntity.ok(List.of());

            // Mentor's lessons — optional group filter
            if (groupId != null) {
                records = lessonRecordRepository.findByGroupIdAndMentorId(groupId, user.getId());
            } else {
                records = lessonRecordRepository.findByMentorUserId(user.getId());
            }
        } else if ("SUPER_ADMIN".equals(role) || "ADMIN".equals(role)) {
            // ADMIN / SUPER_ADMIN — barcha filtrlar
            if (groupId != null && mentorId != null) {
                records = lessonRecordRepository.findByGroupIdAndMentorId(groupId, mentorId);
            } else if (groupId != null) {
                records = lessonRecordRepository.findByGroupId(groupId);
            } else if (mentorId != null) {
                records = lessonRecordRepository.findByMentorUserId(mentorId);
            } else {
                records = lessonRecordRepository.findAll();
                // Limit to avoid huge responses — sort by date desc
                records.sort((a, b) -> {
                    if (a.getLesson() == null || b.getLesson() == null) return 0;
                    return b.getLesson().getLessonDate().compareTo(a.getLesson().getLessonDate());
                });
            }
        }

        // Build response
        List<Map<String, Object>> response = new ArrayList<>();
        for (LessonRecord lr : records) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", lr.getId());
            item.put("attendanceStatus", lr.getAttendanceStatus());
            item.put("attendanceNote", lr.getAttendanceNote());

            // Student info
            Student s = lr.getStudent();
            if (s != null) {
                item.put("studentId", s.getId());
                item.put("studentName", s.getFirstName() + " " + s.getLastName());
            }

            // Lesson info
            Lesson l = lr.getLesson();
            if (l != null) {
                item.put("lessonDate", l.getLessonDate());
                item.put("lessonId", l.getId());
                if (l.getGroup() != null) {
                    item.put("groupId", l.getGroup().getId());
                    item.put("groupName", l.getGroup().getName());
                }
                if (l.getMentor() != null) {
                    item.put("mentorId", l.getMentor().getId());
                    item.put("mentorName", l.getMentor().getFullName());
                }
            }

            response.add(item);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/attendance/my-groups — Mentor yoki Admin uchun filtr uchun guruhlar
     */
    @GetMapping("/my-groups")
    public ResponseEntity<?> getMyGroupsForFilter(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");

        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(404).body("User not found");

        List<Group> groups;
        if ("SUPER_ADMIN".equals(user.getRole()) || "ADMIN".equals(user.getRole())) {
            groups = groupRepository.findAll().stream()
                    .filter(g -> "ACTIVE".equals(g.getStatus()))
                    .toList();
        } else if ("MENTOR".equals(user.getRole())) {
            // Mentor's groups — groups where mentor matches this user's mentor record
            Mentor mentor = mentorRepository.findByUserId(user.getId()).orElse(null);
            if (mentor == null) return ResponseEntity.ok(List.of());
            groups = groupRepository.findAll().stream()
                    .filter(g -> "ACTIVE".equals(g.getStatus()) && g.getMentor() != null && g.getMentor().getId().equals(mentor.getId()))
                    .toList();
        } else {
            return ResponseEntity.ok(List.of());
        }

        List<Map<String, Object>> result = groups.stream().map(g -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", g.getId());
            m.put("name", g.getName());
            if (g.getMentor() != null && g.getMentor().getUser() != null) {
                m.put("mentorId", g.getMentor().getUser().getId());
                m.put("mentorName", g.getMentor().getUser().getFullName());
            }
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }
}
