package com.sfera.gamification.service;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private PointTransactionRepository pointTransactionRepository;

    @Autowired
    private GroupStudentRepository groupStudentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PointRuleRepository pointRuleRepository;

    @Autowired
    private GroupRepository groupRepository;

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public List<Student> getActiveStudents() {
        return studentRepository.findByStatus("ACTIVE");
    }

    public Student saveStudent(Student student) {
        if (student.getStatus() == null) {
            student.setStatus("ACTIVE");
        }
        if (student.getCreatedAt() == null) {
            student.setCreatedAt(LocalDateTime.now());
        }
        return studentRepository.save(student);
    }

    public Student getStudentById(Long id) {
        return studentRepository.findById(id).orElse(null);
    }

    public void archiveStudent(Long id) {
        studentRepository.findById(id).ifPresent(s -> {
            s.setStatus("ARCHIVED");
            studentRepository.save(s);

            // Archive all point transactions so they don't count anywhere
            List<PointTransaction> transactions = pointTransactionRepository.findByStudentId(id);
            for (PointTransaction pt : transactions) {
                pt.setStatus("ARCHIVED");
                pointTransactionRepository.save(pt);
            }

            // Archive active group memberships
            List<GroupStudent> gsList = groupStudentRepository.findByStudentId(id);
            for (GroupStudent gs : gsList) {
                gs.setStatus("ARCHIVED");
                groupStudentRepository.save(gs);
            }

            // Remove associated user login account
            userRepository.findByStudentId(id).ifPresent(userRepository::delete);
        });
    }

    public void deleteStudent(Long id) {
        archiveStudent(id);
    }

    public Map<String, Object> getStudentProfile(Long studentId) {
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) {
            return null;
        }

        // Get student groups
        List<GroupStudent> groupStudents = groupStudentRepository.findByStudentIdAndStatus(studentId, "ACTIVE");
        String groupName = "Guruhsiz";
        String courseName = "Kursiz";
        String mentorName = "Mentorsiz";
        
        if (!groupStudents.isEmpty()) {
            Group group = groupStudents.get(0).getGroup();
            groupName = group.getName();
            courseName = group.getCourse().getName();
            if (group.getMentor() != null && group.getMentor().getUser() != null) {
                mentorName = group.getMentor().getUser().getFullName();
            }
        }

        // Fetch all active transactions for student
        List<PointTransaction> transactions = pointTransactionRepository.findByStudentId(studentId)
                .stream()
                .filter(t -> "ACTIVE".equals(t.getStatus()))
                .sorted(Comparator.comparing(PointTransaction::getCreatedAt))
                .collect(Collectors.toList());

        // Sum overall XP
        long totalXp = transactions.stream().mapToLong(PointTransaction::getPoints).sum();

        // Calculate Rank
        List<Object[]> leaderboard = pointTransactionRepository.findLeaderboard();
        int rank = 0;
        for (int i = 0; i < leaderboard.size(); i++) {
            Student s = (Student) leaderboard.get(i)[0];
            if (s.getId().equals(studentId)) {
                rank = i + 1;
                break;
            }
        }

        // Calculate Group Rank
        int groupRank = 0;
        if (!groupStudents.isEmpty()) {
            Long groupId = groupStudents.get(0).getGroup().getId();
            List<Object[]> groupLeaderboard = pointTransactionRepository.findLeaderboardByGroup(groupId);
            for (int i = 0; i < groupLeaderboard.size(); i++) {
                Student s = (Student) groupLeaderboard.get(i)[0];
                if (s.getId().equals(studentId)) {
                    groupRank = i + 1;
                    break;
                }
            }
        }

        // Calculate Category Breakdowns
        long homeworkXp = 0;
        long attendanceXp = 0;
        long projectsXp = 0;
        long qaXp = 0;
        long activityXp = 0;
        long penaltiesXp = 0;

        for (PointTransaction t : transactions) {
            int pts = t.getPoints();
            if (pts < 0) {
                penaltiesXp += pts; // Will be negative, e.g. -75
            } else {
                String code = t.getPointRule().getCode();
                if ("HOMEWORK_DONE".equals(code)) {
                    homeworkXp += pts;
                } else if ("ATTENDANCE_PRESENT".equals(code)) {
                    attendanceXp += pts;
                } else if ("PROJECT".equals(code)) {
                    projectsXp += pts;
                } else if ("QUESTION_ANSWER".equals(code)) {
                    qaXp += pts;
                } else if ("ACTIVITY".equals(code)) {
                    activityXp += pts;
                }
            }
        }

        // Generate XP History chart data (running sum over time)
        List<Map<String, Object>> chartData = new ArrayList<>();
        long runningSum = 0;
        
        // Add initial 0 point entry
        Map<String, Object> initialEntry = new HashMap<>();
        initialEntry.put("date", student.getCreatedAt().toLocalDate().toString());
        initialEntry.put("xp", 0);
        chartData.add(initialEntry);

        for (PointTransaction t : transactions) {
            runningSum += t.getPoints();
            Map<String, Object> entry = new HashMap<>();
            entry.put("date", t.getCreatedAt().toLocalDate().toString());
            entry.put("xp", runningSum);
            chartData.add(entry);
        }

        // Response map
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", student.getId());
        profile.put("firstName", student.getFirstName());
        profile.put("lastName", student.getLastName());
        profile.put("fullName", student.getFirstName() + " " + student.getLastName());
        profile.put("groupName", groupName);
        profile.put("courseName", courseName);
        profile.put("mentorName", mentorName);
        profile.put("totalXp", totalXp);
        profile.put("rank", rank > 0 ? rank : "Leaderboardda yo'q");
        profile.put("groupRank", groupRank > 0 ? groupRank : "N/A");
        
        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("homework", homeworkXp);
        breakdown.put("attendance", attendanceXp);
        breakdown.put("projects", projectsXp);
        breakdown.put("qa", qaXp);
        breakdown.put("activity", activityXp);
        breakdown.put("penalties", penaltiesXp);
        profile.put("breakdown", breakdown);
        
        profile.put("history", chartData);
        profile.put("transactions", transactions.stream().map(t -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", t.getId());
            m.put("date", t.getCreatedAt().toLocalDate().toString());
            m.put("description", t.getDescription());
            m.put("points", t.getPoints());
            m.put("status", t.getStatus());
            m.put("mentorName", t.getMentor().getFullName());
            return m;
        }).collect(Collectors.toList()));

        return profile;
    }

    public List<Student> getStudentsByMentor(Long mentorId) {
        List<GroupStudent> list = groupStudentRepository.findByGroupMentorIdAndStatus(mentorId, "ACTIVE");
        return list.stream()
                .map(GroupStudent::getStudent)
                .filter(s -> "ACTIVE".equals(s.getStatus()))
                .distinct()
                .collect(Collectors.toList());
    }

    /**
     * Resets a student's active points to 0 while preserving 100% of historical transactions.
     * It adds an adjustment record offsetting current points.
     */
    public void resetStudentPoints(Long studentId, String reason, User adminUser) {
        Long currentXp = pointTransactionRepository.getStudentXp(studentId);
        if (currentXp == null || currentXp == 0) {
            return;
        }

        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) return;

        User author = adminUser;
        if (author == null) {
            author = userRepository.findAll().stream()
                    .filter(u -> "SUPER_ADMIN".equals(u.getRole()))
                    .findFirst()
                    .orElseGet(() -> userRepository.findAll().stream().findFirst().orElse(null));
        }
        if (author == null) return;

        PointRule resetRule = pointRuleRepository.findByCode("MONTHLY_RESET").orElseGet(() -> {
            return pointRuleRepository.save(PointRule.builder()
                    .code("MONTHLY_RESET")
                    .name("Oylik Reyting Yangilanishi")
                    .type("NEGATIVE")
                    .points(0)
                    .active(true)
                    .build());
        });

        PointTransaction resetTx = PointTransaction.builder()
                .student(student)
                .mentor(author)
                .pointRule(resetRule)
                .points(-currentXp.intValue())
                .quantity(1)
                .description(reason != null && !reason.trim().isEmpty() ? reason.trim() : ("Ballar 0 ga tushirildi (Oldingi ball: " + currentXp + " XP arxivlandi)"))
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();
        pointTransactionRepository.save(resetTx);
    }

    /**
     * Resets all active students' points to 0 on a scheduled basis or manual trigger.
     */
    public void resetAllActiveStudentsPoints(String reason) {
        User author = userRepository.findAll().stream()
                .filter(u -> "SUPER_ADMIN".equals(u.getRole()))
                .findFirst()
                .orElseGet(() -> userRepository.findAll().stream().findFirst().orElse(null));

        List<Student> active = getActiveStudents();
        for (Student s : active) {
            try {
                resetStudentPoints(s.getId(), reason, author);
            } catch (Exception e) {
                System.err.println("Error resetting points for student " + s.getId() + ": " + e.getMessage());
            }
        }
    }

    /**
     * Bulk deletes (archives) multiple students at once.
     */
    public void bulkDeleteStudents(List<Long> studentIds) {
        if (studentIds == null) return;
        for (Long id : studentIds) {
            try {
                archiveStudent(id);
            } catch (Exception e) {
                System.err.println("Error archiving student " + id + ": " + e.getMessage());
            }
        }
    }

    /**
     * Transfers or assigns a student to a new group, preserving all existing points.
     */
    public void changeStudentGroup(Long studentId, Long newGroupId) {
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) return;

        Group newGroup = groupRepository.findById(newGroupId).orElse(null);
        if (newGroup == null) return;

        // Deactivate existing active memberships
        List<GroupStudent> existing = groupStudentRepository.findByStudentIdAndStatus(studentId, "ACTIVE");
        for (GroupStudent gs : existing) {
            gs.setStatus("LEFT");
            gs.setLeftAt(LocalDateTime.now());
            groupStudentRepository.save(gs);
        }

        // Enroll in new group
        GroupStudent newGs = GroupStudent.builder()
                .group(newGroup)
                .student(student)
                .status("ACTIVE")
                .joinedAt(LocalDateTime.now())
                .build();
        groupStudentRepository.save(newGs);
    }

    /**
     * Bulk assigns multiple students to a target group.
     */
    public void bulkAssignGroup(List<Long> studentIds, Long targetGroupId) {
        if (studentIds == null || targetGroupId == null) return;
        for (Long id : studentIds) {
            try {
                changeStudentGroup(id, targetGroupId);
            } catch (Exception e) {
                System.err.println("Error moving student " + id + " to group " + targetGroupId + ": " + e.getMessage());
            }
        }
    }
}
