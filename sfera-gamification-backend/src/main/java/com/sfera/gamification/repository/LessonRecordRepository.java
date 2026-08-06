package com.sfera.gamification.repository;

import com.sfera.gamification.entity.LessonRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface LessonRecordRepository extends JpaRepository<LessonRecord, Long> {
    List<LessonRecord> findByLessonId(Long lessonId);
    List<LessonRecord> findByStudentId(Long studentId);

    // All records for a group (via lesson->group)
    @Query("SELECT lr FROM LessonRecord lr JOIN lr.lesson l WHERE l.group.id = :groupId ORDER BY l.lessonDate DESC")
    List<LessonRecord> findByGroupId(@Param("groupId") Long groupId);

    // All records for a mentor's lessons
    @Query("SELECT lr FROM LessonRecord lr JOIN lr.lesson l WHERE l.mentor.id = :mentorId ORDER BY l.lessonDate DESC")
    List<LessonRecord> findByMentorUserId(@Param("mentorId") Long mentorId);

    // All records for a group AND mentor
    @Query("SELECT lr FROM LessonRecord lr JOIN lr.lesson l WHERE l.group.id = :groupId AND l.mentor.id = :mentorId ORDER BY l.lessonDate DESC")
    List<LessonRecord> findByGroupIdAndMentorId(@Param("groupId") Long groupId, @Param("mentorId") Long mentorId);
}

