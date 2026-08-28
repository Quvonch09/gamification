package com.sfera.gamification.repository;

import com.sfera.gamification.entity.PricePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PricePlanRepository extends JpaRepository<PricePlan, Long> {
    List<PricePlan> findByCourseId(Long courseId);
}
