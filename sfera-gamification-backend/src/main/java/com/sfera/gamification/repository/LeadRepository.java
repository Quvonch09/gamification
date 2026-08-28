package com.sfera.gamification.repository;

import com.sfera.gamification.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByStatus(String status);
    Optional<Lead> findByPhone(String phone);
}
