package com.sfera.gamification.controller;

import com.sfera.gamification.entity.Room;
import com.sfera.gamification.entity.User;
import com.sfera.gamification.repository.RoomRepository;
import com.sfera.gamification.repository.UserRepository;
import com.sfera.gamification.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public RoomController(RoomRepository roomRepository, UserRepository userRepository, AuditService auditService) {
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @GetMapping
    public List<Room> getAllRooms() {
        return roomRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRoomById(@PathVariable Long id) {
        return roomRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createRoom(@RequestBody Room room, Principal principal) {
        if (room.getName() == null || room.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Xona nomi majburiy");
        }
        if (room.getCapacity() == null || room.getCapacity() <= 0) {
            room.setCapacity(15);
        }
        if (room.getStatus() == null) {
            room.setStatus("ACTIVE");
        }
        room.setCreatedAt(LocalDateTime.now());
        Room saved = roomRepository.save(room);

        User actor = principal != null ? userRepository.findByUsername(principal.getName()).orElse(null) : null;
        auditService.log("CREATE_ROOM", "Room", saved.getId(), null, "Yangi xona yaratildi: " + saved.getName(), actor);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRoom(@PathVariable Long id, @RequestBody Room req, Principal principal) {
        return roomRepository.findById(id).map(room -> {
            if (req.getName() != null && !req.getName().trim().isEmpty()) {
                room.setName(req.getName().trim());
            }
            if (req.getCapacity() != null) {
                room.setCapacity(req.getCapacity());
            }
            if (req.getDescription() != null) {
                room.setDescription(req.getDescription());
            }
            if (req.getStatus() != null) {
                room.setStatus(req.getStatus());
            }
            Room updated = roomRepository.save(room);
            User actor = principal != null ? userRepository.findByUsername(principal.getName()).orElse(null) : null;
            auditService.log("UPDATE_ROOM", "Room", updated.getId(), null, "Xona yangilandi: " + updated.getName(), actor);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRoom(@PathVariable Long id, Principal principal) {
        return roomRepository.findById(id).map(room -> {
            roomRepository.delete(room);
            User actor = principal != null ? userRepository.findByUsername(principal.getName()).orElse(null) : null;
            auditService.log("DELETE_ROOM", "Room", id, room.getName(), "Xona o'chirildi", actor);
            return ResponseEntity.ok("Xona muvaffaqiyatli o'chirildi");
        }).orElse(ResponseEntity.notFound().build());
    }
}
