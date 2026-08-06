package com.sfera.gamification.repository;

import com.sfera.gamification.entity.GroupStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GroupStudentRepository extends JpaRepository<GroupStudent, Long> {
    List<GroupStudent> findByGroupIdAndStatus(Long groupId, String status);
    List<GroupStudent> findByStudentIdAndStatus(Long studentId, String status);
    Optional<GroupStudent> findByGroupIdAndStudentIdAndStatus(Long groupId, Long studentId, String status);
    List<GroupStudent> findByGroupMentorIdAndStatus(Long mentorId, String status);
}
