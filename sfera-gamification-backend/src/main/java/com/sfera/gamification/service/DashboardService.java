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

    public Map<String, Object> getDashboardStats() {
        List<Student> activeStudents = studentRepository.findByStatus("ACTIVE");
        List<Group> activeGroups = groupRepository.findByStatus("ACTIVE");

        LocalDateTime startOfToday = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfToday = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        // Calculate Points Given Today (Positive)
        long pointsGivenToday = pointTransactionRepository.findAll().stream()
                .filter(t -> "ACTIVE".equals(t.getStatus()))
                .filter(t -> t.getCreatedAt().isAfter(startOfToday) && t.getCreatedAt().isBefore(endOfToday))
                .filter(t -> t.getPoints() > 0)
                .mapToLong(PointTransaction::getPoints)
                .sum();

        // Calculate Penalties Given Today (Negative)
        long penaltiesGivenToday = pointTransactionRepository.findAll().stream()
                .filter(t -> "ACTIVE".equals(t.getStatus()))
                .filter(t -> t.getCreatedAt().isAfter(startOfToday) && t.getCreatedAt().isBefore(endOfToday))
                .filter(t -> t.getPoints() < 0)
                .mapToLong(PointTransaction::getPoints)
                .sum(); // This will be a negative number, e.g. -25

        // Get Top 5 Students
        List<Object[]> leaderboard = pointTransactionRepository.findLeaderboard();
        List<Map<String, Object>> top5 = leaderboard.stream()
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

        Map<String, Object> result = new HashMap<>();
        result.put("totalStudents", activeStudents.size());
        result.put("totalGroups", activeGroups.size());
        result.put("pointsGivenToday", pointsGivenToday);
        result.put("penaltiesGivenToday", Math.abs(penaltiesGivenToday)); // Show as positive absolute jarima count or negative? Let's show as absolute value, and frontend can display with a minus sign if preferred, or direct count.
        result.put("top5", top5);
        result.put("groupRatings", groupRatings);

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
