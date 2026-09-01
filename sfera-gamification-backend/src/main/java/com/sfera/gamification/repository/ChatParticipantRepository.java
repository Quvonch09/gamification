package com.sfera.gamification.repository;

import com.sfera.gamification.entity.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, Long> {
    List<ChatParticipant> findByChatRoomId(Long chatRoomId);
    List<ChatParticipant> findByUserId(Long userId);
    Optional<ChatParticipant> findByChatRoomIdAndUserId(Long chatRoomId, Long userId);
    boolean existsByChatRoomIdAndUserId(Long chatRoomId, Long userId);
    void deleteByChatRoomId(Long chatRoomId);
}
