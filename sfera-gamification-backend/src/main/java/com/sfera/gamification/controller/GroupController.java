package com.sfera.gamification.controller;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.MentorRepository;
import com.sfera.gamification.repository.UserRepository;
import com.sfera.gamification.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MentorRepository mentorRepository;

    @GetMapping
    public ResponseEntity<?> getAllGroups() {
        List<Group> groups = groupService.getActiveGroups();
        List<Map<String, Object>> response = new ArrayList<>();
        for (Group g : groups) {
            response.add(mapGroup(g));
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyGroups(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        List<Group> groups;
        if ("ADMIN".equals(user.getRole())) {
            groups = groupService.getActiveGroups();
        } else {
            Mentor mentor = mentorRepository.findByUserId(user.getId()).orElse(null);
            if (mentor == null) {
                groups = new ArrayList<>();
            } else {
                groups = groupService.getGroupsByMentor(mentor.getId());
            }
        }

        List<Map<String, Object>> response = new ArrayList<>();
        for (Group g : groups) {
            response.add(mapGroup(g));
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getGroupById(@PathVariable Long id) {
        Group group = groupService.getGroupById(id);
        if (group == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(mapGroup(group));
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<?> getGroupStudents(@PathVariable Long id) {
        List<Student> students = groupService.getGroupStudents(id);
        List<Map<String, Object>> list = new ArrayList<>();
        for (Student s : students) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("firstName", s.getFirstName());
            map.put("lastName", s.getLastName());
            map.put("fullName", s.getFirstName() + " " + s.getLastName());
            list.add(map);
        }
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createGroup(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String courseIdStr = request.get("courseId");
        String mentorIdStr = request.get("mentorId");

        if (name == null || courseIdStr == null) {
            return ResponseEntity.badRequest().body("Guruh nomi va kurs majburiy");
        }

        Group group = new Group();
        group.setName(name);
        
        Course course = groupService.getAllCourses().stream()
                .filter(c -> c.getId().equals(Long.parseLong(courseIdStr)))
                .findFirst().orElse(null);
        if (course == null) {
            return ResponseEntity.badRequest().body("Kurs topilmadi");
        }
        group.setCourse(course);

        if (mentorIdStr != null && !mentorIdStr.isEmpty()) {
            Mentor mentor = mentorRepository.findById(Long.parseLong(mentorIdStr)).orElse(null);
            group.setMentor(mentor);
        }

        group = groupService.saveGroup(group);
        return ResponseEntity.ok(mapGroup(group));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateGroup(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Group group = groupService.getGroupById(id);
        if (group == null) {
            return ResponseEntity.notFound().build();
        }

        String name = request.get("name");
        String courseIdStr = request.get("courseId");
        String mentorIdStr = request.get("mentorId");

        if (name != null) group.setName(name);
        
        if (courseIdStr != null && !courseIdStr.isEmpty()) {
            Course course = groupService.getAllCourses().stream()
                    .filter(c -> c.getId().equals(Long.parseLong(courseIdStr)))
                    .findFirst().orElse(null);
            if (course != null) {
                group.setCourse(course);
            }
        }

        if (mentorIdStr != null && !mentorIdStr.isEmpty()) {
            Mentor mentor = mentorRepository.findById(Long.parseLong(mentorIdStr)).orElse(null);
            group.setMentor(mentor);
        } else if (mentorIdStr != null) {
            group.setMentor(null);
        }

        group = groupService.saveGroup(group);
        return ResponseEntity.ok(mapGroup(group));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteGroup(@PathVariable Long id) {
        groupService.archiveGroup(id);
        return ResponseEntity.ok().build();
    }

    private Map<String, Object> mapGroup(Group g) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", g.getId());
        map.put("name", g.getName());
        map.put("status", g.getStatus());
        map.put("createdAt", g.getCreatedAt());
        map.put("courseId", g.getCourse().getId());
        map.put("courseName", g.getCourse().getName());
        if (g.getMentor() != null) {
            map.put("mentorId", g.getMentor().getId());
            map.put("mentorName", g.getMentor().getUser().getFullName());
        } else {
            map.put("mentorId", null);
            map.put("mentorName", "Mentorsiz");
        }
        return map;
    }
}
