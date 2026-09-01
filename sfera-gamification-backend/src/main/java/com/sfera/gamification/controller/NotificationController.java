package com.sfera.gamification.controller;

import com.sfera.gamification.entity.Notification;
import com.sfera.gamification.entity.User;
import com.sfera.gamification.repository.UserRepository;
import com.sfera.gamification.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getNotifications(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(404).body("User not found");

        List<Notification> list = notificationService.getNotificationsForUser(user);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(404).body("User not found");

        long count = notificationService.getUnreadCount(user);
        Map<String, Object> res = new HashMap<>();
        res.put("unreadCount", count);
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user != null) {
            notificationService.markAllAsRead(user);
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        notificationService.deleteNotification(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendNotificationOrTask(@RequestBody Map<String, Object> req, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        String title = (String) req.get("title");
        String message = (String) req.get("message");
        String targetRole = (String) req.get("targetRole");
        String targetUsername = (String) req.get("targetUsername");
        String type = req.get("type") != null ? req.get("type").toString() : "CUSTOM";

        if (title == null || title.trim().isEmpty() || message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Sarlavha va xabar matni bo'sh bo'lmasligi kerak"));
        }

        // Resolve targetUserId from targetUsername if provided
        Long targetUserId = null;
        if (targetUsername != null && !targetUsername.trim().isEmpty()) {
            User targetUser = userRepository.findByUsername(targetUsername).orElse(null);
            if (targetUser != null) {
                targetUserId = targetUser.getId();
            }
        }

        Notification n = notificationService.createCustomNotification(title, message, type, targetRole, targetUserId);
        return ResponseEntity.ok(Map.of("success", true, "notificationId", n.getId()));
    }
}
