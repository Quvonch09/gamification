package com.sfera.gamification.repository;

import com.sfera.gamification.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByStudentId(Long studentId);
    boolean existsByStudentId(Long studentId);
}
