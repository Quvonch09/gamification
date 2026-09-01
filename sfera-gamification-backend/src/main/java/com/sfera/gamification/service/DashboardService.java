package com.sfera.gamification.service;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupStudentRepository groupStudentRepository;

    @Autowired
    private PointTransactionRepository pointTransactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MentorRepository mentorRepository;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    public Map<String, Object> getDashboardStats(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return new HashMap<>();
        }

        List<Student> activeStudents;
        List<Group> activeGroups;

        if ("SUPER_ADMIN".equals(user.getRole()) || "ADMIN".equals(user.getRole())) {
            activeStudents = studentRepository.findByStatus("ACTIVE");
            activeGroups = groupRepository.findByStatus("ACTIVE");
        } else if ("MENTOR".equals(user.getRole())) {
            Mentor mentor = mentorRepository.findByUserId(user.getId()).orElse(null);
            if (mentor == null) {
                activeStudents = new ArrayList<>();
                activeGroups = new ArrayList<>();
            } else {
                activeGroups = groupRepository.findByStatus("ACTIVE").stream()
                        .filter(g -> g.getMentor() != null && g.getMentor().getId().equals(mentor.getId()))
                        .collect(Collectors.toList());
                activeStudents = activeGroups.stream()
                        .flatMap(g -> groupStudentRepository.findByGroupIdAndStatus(g.getId(), "ACTIVE").stream())
                        .map(GroupStudent::getStudent)
                        .filter(s -> "ACTIVE".equals(s.getStatus()))
                        .distinct()
                        .collect(Collectors.toList());
            }
        } else {
            activeStudents = new ArrayList<>();
            activeGroups = new ArrayList<>();
        }

        Set<Long> mentorStudentIds = activeStudents.stream().map(Student::getId).collect(Collectors.toSet());

        LocalDateTime startOfToday = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfToday = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        // Calculate Points Given Today (Positive)
        long pointsGivenToday = pointTransactionRepository.findAll().stream()
                .filter(t -> "ACTIVE".equals(t.getStatus()))
                .filter(t -> mentorStudentIds.contains(t.getStudent().getId()))
                .filter(t -> t.getCreatedAt().isAfter(startOfToday) && t.getCreatedAt().isBefore(endOfToday))
                .filter(t -> t.getPoints() > 0)
                .mapToLong(PointTransaction::getPoints)
                .sum();

        // Calculate Penalties Given Today (Negative)
        long penaltiesGivenToday = pointTransactionRepository.findAll().stream()
                .filter(t -> "ACTIVE".equals(t.getStatus()))
                .filter(t -> mentorStudentIds.contains(t.getStudent().getId()))
                .filter(t -> t.getCreatedAt().isAfter(startOfToday) && t.getCreatedAt().isBefore(endOfToday))
                .filter(t -> t.getPoints() < 0)
                .mapToLong(PointTransaction::getPoints)
                .sum(); // This will be a negative number, e.g. -25

        // Get Top 5 Students
        List<Object[]> leaderboard = pointTransactionRepository.findLeaderboard();
        List<Map<String, Object>> top5 = leaderboard.stream()
                .filter(row -> mentorStudentIds.contains(((Student) row[0]).getId()))
                .limit(5)
                .map(row -> {
                    Student s = (Student) row[0];
                    Long xp = (Long) row[1];
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", s.getId());
                    map.put("fullName", s.getFirstName() + " " + s.getLastName());
                    map.put("xp", xp);
                    return map;
                })
                .collect(Collectors.toList());

        // Compute Leaders for Special Categories
        List<PointTransaction> activeTransactions = pointTransactionRepository.findAll().stream()
                .filter(t -> "ACTIVE".equals(t.getStatus()))
                .filter(t -> mentorStudentIds.contains(t.getStudent().getId()))
                .collect(Collectors.toList());

        Map<Long, StudentStats> statsMap = new HashMap<>();
        for (Student s : activeStudents) {
            statsMap.put(s.getId(), new StudentStats(s));
        }

        for (PointTransaction t : activeTransactions) {
            StudentStats stats = statsMap.get(t.getStudent().getId());
            if (stats == null) continue; // Skip archived students

            int pts = t.getPoints();
            if (pts < 0) {
                stats.totalPenalties += Math.abs(pts);
            } else {
                String code = t.getPointRule().getCode();
                if ("ACTIVITY".equals(code)) {
                    stats.activityCount++;
                } else if ("PROJECT".equals(code)) {
                    stats.projectCount += t.getQuantity();
                } else if ("QUESTION_ANSWER".equals(code)) {
                    stats.qaCount++;
                } else if ("HOMEWORK_DONE".equals(code)) {
                    stats.homeworkCount++;
                }
            }
        }

        // Find Leaders
        StudentStats activityLeader = statsMap.values().stream().max(Comparator.comparingLong(s -> s.activityCount)).orElse(null);
        StudentStats projectLeader = statsMap.values().stream().max(Comparator.comparingLong(s -> s.projectCount)).orElse(null);
        StudentStats qaLeader = statsMap.values().stream().max(Comparator.comparingLong(s -> s.qaCount)).orElse(null);
        StudentStats homeworkLeader = statsMap.values().stream().max(Comparator.comparingLong(s -> s.homeworkCount)).orElse(null);
        StudentStats penaltyLeader = statsMap.values().stream().max(Comparator.comparingLong(s -> s.totalPenalties)).orElse(null);

        // Group ratings (Average XP)
        List<Map<String, Object>> groupRatings = new ArrayList<>();
        for (Group group : activeGroups) {
            List<GroupStudent> enrollments = groupStudentRepository.findByGroupIdAndStatus(group.getId(), "ACTIVE");
            long groupTotalXp = 0;
            long activeCount = enrollments.size();

            for (GroupStudent gs : enrollments) {
                groupTotalXp += pointTransactionRepository.getStudentXp(gs.getStudent().getId());
            }

            double averageXp = activeCount == 0 ? 0.0 : (double) groupTotalXp / activeCount;
            // Round to 1 decimal place
            averageXp = Math.round(averageXp * 10.0) / 10.0;

            Map<String, Object> grMap = new HashMap<>();
            grMap.put("id", group.getId());
            grMap.put("name", group.getName());
            grMap.put("averageXp", averageXp);
            grMap.put("studentCount", activeCount);
            groupRatings.add(grMap);
        }

        // Sort groups by average XP descending
        groupRatings.sort((g1, g2) -> Double.compare((double) g2.get("averageXp"), (double) g1.get("averageXp")));

        // Extra stats for SUPER_ADMIN and ADMIN roles
        long staffCount = 0;
        long newLeadsCount = 0;
        long paidStudentsCount = 0;
        long debtorStudentsCount = 0;

        if ("SUPER_ADMIN".equals(user.getRole()) || "ADMIN".equals(user.getRole()) || "BRANCH_ADMIN".equals(user.getRole())) {
            // Staff count: all users except students
            staffCount = userRepository.findAll().stream()
                    .filter(u -> u.getRole() != null && !u.getRole().equals("STUDENT"))
                    .count();

            // Leads count (NEW status)
            newLeadsCount = leadRepository.findByStatus("NEW").size();

            // Paid vs debtor students - optimized: 1 single query instead of N+1
            List<Student> allStudents = studentRepository.findByStatus("ACTIVE");
            List<Payment> allPayments = paymentRepository.findAll();
            Set<Long> paidStudentIds = allPayments.stream()
                    .filter(p -> p.getInvoice() != null && p.getInvoice().getEnrollment() != null && p.getInvoice().getEnrollment().getStudent() != null)
                    .map(p -> p.getInvoice().getEnrollment().getStudent().getId())
                    .collect(Collectors.toSet());

            for (Student s : allStudents) {
                if (paidStudentIds.contains(s.getId())) {
                    paidStudentsCount++;
                } else {
                    debtorStudentsCount++;
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalStudents", activeStudents.size());
        result.put("totalGroups", activeGroups.size());
        result.put("pointsGivenToday", pointsGivenToday);
        result.put("penaltiesGivenToday", Math.abs(penaltiesGivenToday));
        result.put("top5", top5);
        result.put("groupRatings", groupRatings);
        result.put("staffCount", staffCount);
        result.put("newLeadsCount", newLeadsCount);
        result.put("paidStudentsCount", paidStudentsCount);
        result.put("debtorStudentsCount", debtorStudentsCount);

        result.put("activityLeader", getLeaderInfo(activityLeader, activityLeader != null ? activityLeader.activityCount : 0));
        result.put("projectLeader", getLeaderInfo(projectLeader, projectLeader != null ? projectLeader.projectCount : 0));
        result.put("qaLeader", getLeaderInfo(qaLeader, qaLeader != null ? qaLeader.qaCount : 0));
        result.put("homeworkLeader", getLeaderInfo(homeworkLeader, homeworkLeader != null ? homeworkLeader.homeworkCount : 0));
        result.put("penaltyLeader", getLeaderInfo(penaltyLeader, penaltyLeader != null ? penaltyLeader.totalPenalties : 0));

        return result;
    }

    private Map<String, Object> getLeaderInfo(StudentStats stats, long value) {
        Map<String, Object> map = new HashMap<>();
        if (stats != null && value > 0) {
            map.put("fullName", stats.student.getFirstName() + " " + stats.student.getLastName());
            map.put("value", value);
        } else {
            map.put("fullName", "Yo'q");
            map.put("value", 0);
        }
        return map;
    }

    private static class StudentStats {
        Student student;
        long activityCount = 0;
        long projectCount = 0;
        long qaCount = 0;
        long homeworkCount = 0;
        long totalPenalties = 0;

        StudentStats(Student student) {
            this.student = student;
        }
    }
}
