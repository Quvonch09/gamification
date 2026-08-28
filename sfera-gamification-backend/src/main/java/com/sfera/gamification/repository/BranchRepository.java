package com.sfera.gamification.repository;

import com.sfera.gamification.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BranchRepository extends JpaRepository<Branch, Long> {
    List<Branch> findByStatus(String status);
}
