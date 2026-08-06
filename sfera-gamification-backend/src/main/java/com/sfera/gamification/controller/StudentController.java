package com.sfera.gamification.controller;

import com.sfera.gamification.entity.Student;
import com.sfera.gamification.entity.Group;
import com.sfera.gamification.entity.GroupStudent;
import com.sfera.gamification.entity.User;
import com.sfera.gamification.entity.PointRule;
import com.sfera.gamification.entity.PointTransaction;
import com.sfera.gamification.repository.PointTransactionRepository;
import com.sfera.gamification.repository.GroupStudentRepository;
import com.sfera.gamification.repository.GroupRepository;
import com.sfera.gamification.repository.UserRepository;
import com.sfera.gamification.repository.PointRuleRepository;
import com.sfera.gamification.service.StudentService;
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
import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private GroupService groupService;

    @Autowired
    private PointTransactionRepository pointTransactionRepository;

    @Autowired
    private GroupStudentRepository groupStudentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PointRuleRepository pointRuleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<?> getAllStudents() {
        List<Student> students = studentService.getActiveStudents();
        List<Map<String, Object>> response = new ArrayList<>();
        
        for (Student s : students) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("firstName", s.getFirstName());
            map.put("lastName", s.getLastName());
            map.put("fullName", s.getFirstName() + " " + s.getLastName());
            map.put("status", s.getStatus());
            map.put("createdAt", s.getCreatedAt());
            
            // Get total XP
            map.put("xp", pointTransactionRepository.getStudentXp(s.getId()));
            
            // Get username
            User studentUser = userRepository.findByStudentId(s.getId()).orElse(null);
            if (studentUser != null) {
                map.put("username", studentUser.getUsername());
            } else {
                map.put("username", "");
            }

            // Get group details
            List<GroupStudent> list = groupStudentRepository.findByStudentIdAndStatus(s.getId(), "ACTIVE");
            if (!list.isEmpty()) {
                map.put("groupId", list.get(0).getGroup().getId());
                map.put("groupName", list.get(0).getGroup().getName());
            } else {
                map.put("groupId", null);
                map.put("groupName", "Guruhsiz");
            }
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard(
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) Long mentorId,
            @RequestParam(required = false) Long courseId) {
        
        List<Object[]> data;
        if (groupId != null) {
            data = pointTransactionRepository.findLeaderboardByGroup(groupId);
        } else if (mentorId != null) {
            data = pointTransactionRepository.findLeaderboardByMentor(mentorId);
        } else if (courseId != null) {
            data = pointTransactionRepository.findLeaderboardByCourse(courseId);
        } else {
            data = pointTransactionRepository.findLeaderboard();
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < data.size(); i++) {
            Student s = (Student) data.get(i)[0];
            Long xp = (Long) data.get(i)[1];
            
            Map<String, Object> map = new HashMap<>();
            map.put("rank", i + 1);
            map.put("id", s.getId());
            map.put("firstName", s.getFirstName());
            map.put("lastName", s.getLastName());
            map.put("fullName", s.getFirstName() + " " + s.getLastName());
            map.put("xp", xp);

            // Group name
            List<GroupStudent> gsList = groupStudentRepository.findByStudentIdAndStatus(s.getId(), "ACTIVE");
            if (!gsList.isEmpty()) {
                map.put("groupName", gsList.get(0).getGroup().getName());
            } else {
                map.put("groupName", "Guruhsiz");
            }

            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createStudent(@RequestBody Map<String, String> request, Principal principal) {
        String firstName = request.get("firstName");
        String lastName = request.get("lastName");
        String groupIdStr = request.get("groupId");
        String initialPointsStr = request.get("initialPoints");
        
        String username = request.get("username");
        String password = request.get("password");

        if (firstName == null || lastName == null) {
            return ResponseEntity.badRequest().body("Ism va Familiya majburiy");
        }

        Student student = Student.builder()
                .firstName(firstName)
                .lastName(lastName)
                .status("ACTIVE")
                .createdAt(java.time.LocalDateTime.now())
                .build();
        student = studentService.saveStudent(student);

        // Save User credentials
        String genUsername = (username != null && !username.trim().isEmpty()) 
            ? username.trim() 
            : (firstName.replaceAll("[^a-zA-Z0-9]", "").toLowerCase() + "_" + lastName.replaceAll("[^a-zA-Z0-9]", "").toLowerCase());
        
        if (userRepository.findByUsername(genUsername).isPresent()) {
            genUsername += (int)(Math.random() * 100);
        }

        User studentUser = User.builder()
                .fullName(firstName + " " + lastName)
                .username(genUsername)
                .password(passwordEncoder.encode((password != null && !password.trim().isEmpty()) ? password.trim() : "student123"))
                .role("STUDENT")
                .student(student)
                .createdAt(java.time.LocalDateTime.now())
                .build();
        userRepository.save(studentUser);

        if (groupIdStr != null && !groupIdStr.isEmpty()) {
            Long groupId = Long.parseLong(groupIdStr);
            Group group = groupService.getGroupById(groupId);
            if (group != null) {
                groupService.enrollStudent(group, student);
            }
        }

        if (initialPointsStr != null && !initialPointsStr.isEmpty()) {
            try {
                int initialPoints = Integer.parseInt(initialPointsStr.trim());
                if (initialPoints != 0 && principal != null) {
                    User adminUser = userRepository.findByUsername(principal.getName()).orElse(null);
                    PointRule initialRule = pointRuleRepository.findByCode("INITIAL_POINTS").orElse(null);
                    if (adminUser != null && initialRule != null) {
                        PointTransaction trans = PointTransaction.builder()
                                .student(student)
                                .mentor(adminUser)
                                .pointRule(initialRule)
                                .points(initialPoints)
                                .quantity(1)
                                .description("Tizimdan oldingi yig'ilgan ballar")
                                .status("ACTIVE")
                                .createdAt(java.time.LocalDateTime.now())
                                .build();
                        pointTransactionRepository.save(trans);
                    }
                }
            } catch (NumberFormatException e) {
                // Ignore invalid number format
            }
        }

        return ResponseEntity.ok(student);
    }

    @PostMapping("/bulk-import")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> bulkImportStudents(@RequestBody Map<String, String> request, Principal principal) {
        String groupIdStr = request.get("groupId");
        String text = request.get("text");

        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Import qilish uchun matn kiritilishi shart");
        }

        Group group = null;
        if (groupIdStr != null && !groupIdStr.isEmpty()) {
            group = groupService.getGroupById(Long.parseLong(groupIdStr));
        }

        User adminUser = principal != null ? userRepository.findByUsername(principal.getName()).orElse(null) : null;
        PointRule initialRule = pointRuleRepository.findByCode("INITIAL_POINTS").orElse(null);

        String[] lines = text.split("\n");
        List<Student> importedStudents = new ArrayList<>();

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;

            String namePart = line;
            String pointsPart = "";

            if (line.contains("->")) {
                String[] parts = line.split("->", 2);
                namePart = parts[0].trim();
                pointsPart = parts[1].trim();
            }

            String[] nameWords = namePart.split("\\s+");
            String firstName = "";
            String lastName = "";

            if (nameWords.length == 0) continue;
            
            if (nameWords.length >= 2) {
                firstName = nameWords[0];
                StringBuilder sb = new StringBuilder();
                for (int i = 1; i < nameWords.length; i++) {
                    sb.append(nameWords[i]).append(" ");
                }
                lastName = sb.toString().trim();
            } else {
                firstName = nameWords[0];
                lastName = "O'quvchi";
            }

            Student student = Student.builder()
                    .firstName(firstName)
                    .lastName(lastName)
                    .status("ACTIVE")
                    .createdAt(java.time.LocalDateTime.now())
                    .build();
            student = studentService.saveStudent(student);

            // Auto-generate credentials for bulk import
            String genUsername = (firstName.replaceAll("[^a-zA-Z0-9]", "").toLowerCase() + "_" + lastName.replaceAll("[^a-zA-Z0-9]", "").toLowerCase());
            if (userRepository.findByUsername(genUsername).isPresent()) {
                genUsername += (int)(Math.random() * 100);
            }
            User studentUser = User.builder()
                    .fullName(firstName + " " + lastName)
                    .username(genUsername)
                    .password(passwordEncoder.encode("student123"))
                    .role("STUDENT")
                    .student(student)
                    .createdAt(java.time.LocalDateTime.now())
                    .build();
            userRepository.save(studentUser);

            if (group != null) {
                groupService.enrollStudent(group, student);
            }

            int totalPoints = 0;
            if (!pointsPart.isEmpty()) {
                String[] pointsArr = pointsPart.split(",");
                for (String pStr : pointsArr) {
                    try {
                        totalPoints += Integer.parseInt(pStr.trim());
                    } catch (NumberFormatException e) {
                        // ignore bad format
                    }
                }
            }

            if (totalPoints != 0 && adminUser != null && initialRule != null) {
                PointTransaction trans = PointTransaction.builder()
                        .student(student)
                        .mentor(adminUser)
                        .pointRule(initialRule)
                        .points(totalPoints)
                        .quantity(1)
                        .description("Tizimdan oldingi yig'ilgan ballar")
                        .status("ACTIVE")
                        .createdAt(java.time.LocalDateTime.now())
                        .build();
                pointTransactionRepository.save(trans);
            }

            importedStudents.add(student);
        }

        return ResponseEntity.ok(importedStudents);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Student student = studentService.getStudentById(id);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }

        String firstName = request.get("firstName");
        String lastName = request.get("lastName");
        String groupIdStr = request.get("groupId");
        String username = request.get("username");
        String password = request.get("password");

        if (firstName != null) student.setFirstName(firstName);
        if (lastName != null) student.setLastName(lastName);
        studentService.saveStudent(student);

        // Update User credentials
        User studentUser = userRepository.findByStudentId(id).orElse(null);
        if (studentUser == null) {
            studentUser = User.builder()
                    .fullName(student.getFirstName() + " " + student.getLastName())
                    .username(username != null && !username.trim().isEmpty() ? username.trim() : (student.getFirstName().replaceAll("[^a-zA-Z0-9]", "").toLowerCase() + "_" + student.getLastName().replaceAll("[^a-zA-Z0-9]", "").toLowerCase()))
                    .password(passwordEncoder.encode(password != null && !password.trim().isEmpty() ? password.trim() : "student123"))
                    .role("STUDENT")
                    .student(student)
                    .createdAt(java.time.LocalDateTime.now())
                    .build();
        } else {
            studentUser.setFullName(student.getFirstName() + " " + student.getLastName());
            if (username != null && !username.trim().isEmpty()) {
                studentUser.setUsername(username.trim());
            }
            if (password != null && !password.trim().isEmpty()) {
                studentUser.setPassword(passwordEncoder.encode(password.trim()));
            }
        }
        userRepository.save(studentUser);

        if (groupIdStr != null && !groupIdStr.isEmpty()) {
            Long groupId = Long.parseLong(groupIdStr);
            Group group = groupService.getGroupById(groupId);
            if (group != null) {
                groupService.enrollStudent(group, student);
            }
        }

        return ResponseEntity.ok(student);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteOrArchiveStudent(@PathVariable Long id) {
        studentService.archiveStudent(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<?> getStudentProfile(@PathVariable Long id) {
        Map<String, Object> profile = studentService.getStudentProfile(id);
        if (profile == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(profile);
    }
}
