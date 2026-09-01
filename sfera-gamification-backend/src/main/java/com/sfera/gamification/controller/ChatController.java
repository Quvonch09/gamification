package com.sfera.gamification.controller;

import com.sfera.gamification.entity.User;
import com.sfera.gamification.repository.UserRepository;
import com.sfera.gamification.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthUser(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByUsername(principal.getName()).orElse(null);
    }

    // Get user's chat rooms
    @GetMapping("/rooms")
    public ResponseEntity<?> getMyRooms(Principal principal) {
        User user = getAuthUser(principal);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(chatService.getUserChatRooms(user));
    }

    // Admin Oversight: Get ALL chat rooms in system
    @GetMapping("/admin/all-rooms")
    public ResponseEntity<?> getAllRoomsForAdmin(Principal principal) {
        User user = getAuthUser(principal);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        boolean isAdmin = "SUPER_ADMIN".equals(user.getRole()) || "ADMIN".equals(user.getRole()) || "BRANCH_ADMIN".equals(user.getRole());
        if (!isAdmin) {
            return ResponseEntity.status(403).body("Faqat administratorlar uchun nazorat rejimi");
        }
        return ResponseEntity.ok(chatService.getAllChatRoomsForAdmin());
    }

    // Start 1-on-1 Direct Chat
    @PostMapping("/direct")
    public ResponseEntity<?> getOrCreateDirectChat(@RequestBody Map<String, Object> body, Principal principal) {
        User user = getAuthUser(principal);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        Object targetIdObj = body.get("targetUserId");
        if (targetIdObj == null) {
            return ResponseEntity.badRequest().body("targetUserId kiritilishi shart");
        }
        Long targetUserId = Long.valueOf(targetIdObj.toString());
        return ResponseEntity.ok(chatService.getOrCreateDirectChat(user, targetUserId));
    }

    // Create Custom Group Chat
    @PostMapping("/group")
    public ResponseEntity<?> createGroupChat(@RequestBody Map<String, Object> body, Principal principal) {
        User user = getAuthUser(principal);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        String title = (String) body.get("title");
        List<Integer> rawIds = (List<Integer>) body.get("participantUserIds");
        List<Long> participantIds = rawIds != null ? rawIds.stream().map(Long::valueOf).toList() : List.of();
        Long academicGroupId = body.get("academicGroupId") != null ? Long.valueOf(body.get("academicGroupId").toString()) : null;

        return ResponseEntity.ok(chatService.createGroupChat(user, title, participantIds, academicGroupId));
    }

    // Get Messages in Room
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<?> getMessages(@PathVariable Long roomId, Principal principal) {
        User user = getAuthUser(principal);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        try {
            return ResponseEntity.ok(chatService.getMessages(roomId, user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    // Send Message
    @PostMapping("/rooms/{roomId}/messages")
    public ResponseEntity<?> sendMessage(@PathVariable Long roomId, @RequestBody Map<String, String> body, Principal principal) {
        User user = getAuthUser(principal);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        String content = body.get("content");
        try {
            return ResponseEntity.ok(chatService.sendMessage(roomId, user, content));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get Available Contacts for Starting Chat
    @GetMapping("/contacts")
    public ResponseEntity<?> getContacts(Principal principal) {
        User user = getAuthUser(principal);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(chatService.getAvailableContacts(user));
    }
}
