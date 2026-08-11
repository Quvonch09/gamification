package com.sfera.gamification.repository;

import com.sfera.gamification.entity.LessonPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LessonPlanRepository extends JpaRepository<LessonPlan, Long> {
    List<LessonPlan> findByCourseIdOrderBySequenceOrderAsc(Long courseId);
}
