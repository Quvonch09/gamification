package com.sfera.gamification.repository;

import com.sfera.gamification.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByStatus(String status);
}
