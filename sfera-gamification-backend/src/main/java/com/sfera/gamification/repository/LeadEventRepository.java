package com.sfera.gamification.repository;

import com.sfera.gamification.entity.LeadEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeadEventRepository extends JpaRepository<LeadEvent, Long> {
    List<LeadEvent> findByLeadIdOrderByCreatedAtDesc(Long leadId);
}
