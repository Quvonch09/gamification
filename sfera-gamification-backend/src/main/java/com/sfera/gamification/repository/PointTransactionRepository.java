package com.sfera.gamification.repository;

import com.sfera.gamification.entity.PointTransaction;
import com.sfera.gamification.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {

    List<PointTransaction> findByStudentId(Long studentId);

    List<PointTransaction> findByStatus(String status);

    @Query("SELECT COALESCE(SUM(t.points), 0) FROM PointTransaction t WHERE t.student.id = :studentId AND t.status = 'ACTIVE'")
    Long getStudentXp(@Param("studentId") Long studentId);

    // Leaderboard Queries
    @Query("SELECT t.student, COALESCE(SUM(t.points), 0) FROM PointTransaction t " +
           "WHERE t.student.status = 'ACTIVE' AND t.status = 'ACTIVE' " +
           "GROUP BY t.student " +
           "ORDER BY SUM(t.points) DESC")
    List<Object[]> findLeaderboard();

    @Query("SELECT t.student, COALESCE(SUM(t.points), 0) FROM PointTransaction t " +
           "JOIN GroupStudent gs ON gs.student = t.student " +
           "WHERE gs.group.id = :groupId AND gs.status = 'ACTIVE' AND t.student.status = 'ACTIVE' AND t.status = 'ACTIVE' " +
           "GROUP BY t.student " +
           "ORDER BY SUM(t.points) DESC")
    List<Object[]> findLeaderboardByGroup(@Param("groupId") Long groupId);

    @Query("SELECT t.student, COALESCE(SUM(t.points), 0) FROM PointTransaction t " +
           "JOIN GroupStudent gs ON gs.student = t.student " +
           "JOIN Group g ON g = gs.group " +
           "WHERE g.mentor.id = :mentorId AND gs.status = 'ACTIVE' AND t.student.status = 'ACTIVE' AND t.status = 'ACTIVE' " +
           "GROUP BY t.student " +
           "ORDER BY SUM(t.points) DESC")
    List<Object[]> findLeaderboardByMentor(@Param("mentorId") Long mentorId);

    @Query("SELECT t.student, COALESCE(SUM(t.points), 0) FROM PointTransaction t " +
           "JOIN GroupStudent gs ON gs.student = t.student " +
           "JOIN Group g ON g = gs.group " +
           "WHERE g.course.id = :courseId AND gs.status = 'ACTIVE' AND t.student.status = 'ACTIVE' AND t.status = 'ACTIVE' " +
           "GROUP BY t.student " +
           "ORDER BY SUM(t.points) DESC")
    List<Object[]> findLeaderboardByCourse(@Param("courseId") Long courseId);

    // Profile breakdown queries
    @Query("SELECT COALESCE(SUM(t.points), 0) FROM PointTransaction t " +
           "WHERE t.student.id = :studentId AND t.pointRule.code = :ruleCode AND t.status = 'ACTIVE'")
    Long sumPointsByStudentIdAndRuleCode(@Param("studentId") Long studentId, @Param("ruleCode") String ruleCode);

    @Query("SELECT COUNT(t) FROM PointTransaction t " +
           "WHERE t.student.id = :studentId AND t.pointRule.code = :ruleCode AND t.status = 'ACTIVE'")
    Long countByStudentIdAndRuleCode(@Param("studentId") Long studentId, @Param("ruleCode") String ruleCode);

    @Query("SELECT COALESCE(SUM(t.points), 0) FROM PointTransaction t " +
           "WHERE t.student.id = :studentId AND t.pointRule.type = :type AND t.status = 'ACTIVE'")
    Long sumPointsByStudentIdAndType(@Param("studentId") Long studentId, @Param("type") String type);

    // Mentor monitoring queries
    @Query("SELECT COALESCE(SUM(t.points), 0) FROM PointTransaction t " +
           "WHERE t.mentor.id = :mentorId AND t.createdAt >= :since AND t.status = 'ACTIVE' AND t.points > 0")
    Long sumPositivePointsByMentorSince(@Param("mentorId") Long mentorId, @Param("since") LocalDateTime since);

    @Query("SELECT COALESCE(SUM(t.points), 0) FROM PointTransaction t " +
           "WHERE t.mentor.id = :mentorId AND t.createdAt >= :since AND t.status = 'ACTIVE' AND t.points < 0")
    Long sumNegativePointsByMentorSince(@Param("mentorId") Long mentorId, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(DISTINCT t.student.id) FROM PointTransaction t " +
           "WHERE t.mentor.id = :mentorId AND t.createdAt >= :since AND t.status = 'ACTIVE'")
    Long countGradedStudentsByMentorSince(@Param("mentorId") Long mentorId, @Param("since") LocalDateTime since);

    @Query("SELECT MAX(t.createdAt) FROM PointTransaction t WHERE t.mentor.id = :mentorId")
    LocalDateTime findLastTransactionTimeByMentor(@Param("mentorId") Long mentorId);

    // Helper for Rate warning checks (find all transactions by mentor in a time window)
    List<PointTransaction> findByMentorIdAndCreatedAtAfter(Long mentorId, LocalDateTime since);
}
