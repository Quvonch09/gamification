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
}
