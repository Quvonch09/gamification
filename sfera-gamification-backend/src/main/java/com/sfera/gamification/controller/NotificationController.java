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
}
