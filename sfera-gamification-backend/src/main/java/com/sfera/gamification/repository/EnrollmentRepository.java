package com.sfera.gamification.repository;

import com.sfera.gamification.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudentId(Long studentId);
    List<Enrollment> findByGroupId(Long groupId);
    Optional<Enrollment> findByStudentIdAndGroupIdAndStatus(Long studentId, Long groupId, String status);
    List<Enrollment> findByStudentIdAndStatus(Long studentId, String status);
}
