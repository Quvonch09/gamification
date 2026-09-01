package com.sfera.gamification.repository;

import com.sfera.gamification.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    
    @Query("SELECT r FROM ChatRoom r WHERE r.id IN (SELECT p.chatRoom.id FROM ChatParticipant p WHERE p.user.id = :userId) ORDER BY r.updatedAt DESC")
    List<ChatRoom> findRoomsByUserId(@Param("userId") Long userId);

    @Query("SELECT r FROM ChatRoom r ORDER BY r.updatedAt DESC")
    List<ChatRoom> findAllRoomsForAdmin();

    Optional<ChatRoom> findByAcademicGroupId(Long academicGroupId);

    @Query("SELECT p1.chatRoom FROM ChatParticipant p1 JOIN ChatParticipant p2 ON p1.chatRoom.id = p2.chatRoom.id WHERE p1.chatRoom.type = 'DIRECT' AND p1.user.id = :u1Id AND p2.user.id = :u2Id")
    List<ChatRoom> findDirectChatBetweenUsers(@Param("u1Id") Long u1Id, @Param("u2Id") Long u2Id);
}
