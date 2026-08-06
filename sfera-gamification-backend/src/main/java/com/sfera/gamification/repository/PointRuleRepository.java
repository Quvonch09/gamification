package com.sfera.gamification.repository;

import com.sfera.gamification.entity.PointRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PointRuleRepository extends JpaRepository<PointRule, Long> {
    Optional<PointRule> findByCode(String code);
    List<PointRule> findByActive(Boolean active);
}
