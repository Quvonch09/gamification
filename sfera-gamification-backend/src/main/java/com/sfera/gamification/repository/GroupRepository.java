package com.sfera.gamification.repository;

import com.sfera.gamification.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {
    List<Group> findByStatus(String status);
    List<Group> findByMentorIdAndStatus(Long mentorId, String status);
    List<Group> findByMentorId(Long mentorId);
}
