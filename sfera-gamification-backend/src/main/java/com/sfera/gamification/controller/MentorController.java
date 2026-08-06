package com.sfera.gamification.controller;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.*;
import com.sfera.gamification.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mentors")
public class MentorController {

    @Autowired
    private MentorRepository mentorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private PointTransactionRepository pointTransactionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<?> getAllMentors() {
        List<Mentor> mentors = mentorRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();
        
        for (Mentor m : mentors) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("fullName", m.getUser().getFullName());
            map.put("username", m.getUser().getUsername());
            
            // Get groups
            List<Group> groups = groupRepository.findByMentorId(m.getId());
            map.put("groups", groups.stream().map(Group::getName).collect(Collectors.toList()));
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createMentor(@RequestBody Map<String, String> request) {
        String fullName = request.get("fullName");
        String username = request.get("username");
        String password = request.get("password");

        if (fullName == null || username == null || password == null) {
            return ResponseEntity.badRequest().body("Ism, username va parol majburiy");
        }

        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body("Ushbu username band");
        }

        User user = User.builder()
                .fullName(fullName)
                .username(username)
                .password(passwordEncoder.encode(password))
                .role("MENTOR")
                .createdAt(LocalDateTime.now())
                .build();
        user = userRepository.save(user);

        Mentor mentor = Mentor.builder()
                .user(user)
                .createdAt(LocalDateTime.now())
                .build();
        mentor = mentorRepository.save(mentor);

        return ResponseEntity.ok(mentor);
    }

    @GetMapping("/monitor")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> monitorMentors() {
        List<Mentor> mentors = mentorRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();

        LocalDateTime startOfToday = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);

        for (Mentor m : mentors) {
            User u = m.getUser();
            Map<String, Object> stats = new HashMap<>();
            stats.put("id", m.getId());
            stats.put("fullName", u.getFullName());

            // Assigned groups
            List<Group> groups = groupRepository.findByMentorIdAndStatus(m.getId(), "ACTIVE");
            stats.put("groups", groups.stream().map(Group::getName).collect(Collectors.toList()));

            // Points given today
            Long positivePoints = pointTransactionRepository.sumPositivePointsByMentorSince(u.getId(), startOfToday);
            Long negativePoints = pointTransactionRepository.sumNegativePointsByMentorSince(u.getId(), startOfToday);
            stats.put("positivePoints", positivePoints);
            stats.put("negativePoints", Math.abs(negativePoints)); // Display absolute

            // Graded students today
            Long gradedStudents = pointTransactionRepository.countGradedStudentsByMentorSince(u.getId(), startOfToday);
            stats.put("gradedStudents", gradedStudents);

            // Last active time
            LocalDateTime lastTime = pointTransactionRepository.findLastTransactionTimeByMentor(u.getId());
            stats.put("lastActiveTime", lastTime != null ? lastTime.toString() : "Faoliyat yo'q");

            // Warning check: if mentor gave >850 positive points in last 20 minutes
            LocalDateTime twentyMinsAgo = LocalDateTime.now().minusMinutes(20);
            List<PointTransaction> recentTrans = pointTransactionRepository.findByMentorIdAndCreatedAtAfter(u.getId(), twentyMinsAgo);
            long recentPointsSum = recentTrans.stream()
                    .filter(t -> "ACTIVE".equals(t.getStatus()))
                    .filter(t -> t.getPoints() > 0)
                    .mapToLong(PointTransaction::getPoints)
                    .sum();

            if (recentPointsSum > 850) {
                stats.put("warning", true);
                stats.put("warningMessage", "WARNING: " + u.getFullName() + " mentor 20 daqiqa ichida " + recentPointsSum + " ball berdi. Tekshirish tavsiya etiladi.");
            } else {
                stats.put("warning", false);
                stats.put("warningMessage", null);
            }

            response.add(stats);
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateMentor(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Mentor mentor = mentorRepository.findById(id).orElse(null);
        if (mentor == null) {
            return ResponseEntity.notFound().build();
        }

        String fullName = request.get("fullName");
        String username = request.get("username");
        String password = request.get("password");

        User user = mentor.getUser();
        if (user != null) {
            if (fullName != null && !fullName.trim().isEmpty()) {
                user.setFullName(fullName.trim());
            }
            if (username != null && !username.trim().isEmpty()) {
                if (!username.trim().equals(user.getUsername()) && userRepository.findByUsername(username.trim()).isPresent()) {
                    return ResponseEntity.badRequest().body("Ushbu username band");
                }
                user.setUsername(username.trim());
            }
            if (password != null && !password.trim().isEmpty()) {
                user.setPassword(passwordEncoder.encode(password.trim()));
            }
            userRepository.save(user);
        }

        return ResponseEntity.ok(mentor);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteMentor(@PathVariable Long id) {
        Mentor mentor = mentorRepository.findById(id).orElse(null);
        if (mentor == null) {
            return ResponseEntity.notFound().build();
        }

        // 1. Unassign all groups linked to this mentor
        List<Group> groups = groupRepository.findByMentorId(mentor.getId());
        for (Group g : groups) {
            g.setMentor(null);
            groupRepository.save(g);
        }

        // 2. Fetch the linked user and set their role to ARCHIVED_MENTOR to prevent login
        User user = mentor.getUser();
        if (user != null) {
            user.setRole("ARCHIVED_MENTOR");
            userRepository.save(user);
        }

        // 3. Delete the mentor
        mentorRepository.delete(mentor);

        return ResponseEntity.ok().build();
    }
}
