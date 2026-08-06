package com.sfera.gamification.repository;

import com.sfera.gamification.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByGroupId(Long groupId);
    List<Lesson> findByMentorId(Long mentorId);
}
