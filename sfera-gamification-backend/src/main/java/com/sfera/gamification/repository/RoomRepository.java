package com.sfera.gamification.repository;

import com.sfera.gamification.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByStatusOrderByCreatedAtDesc(String status);
    List<Room> findAllByOrderByCreatedAtDesc();
}
