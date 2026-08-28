package com.sfera.gamification.controller;

import com.sfera.gamification.entity.User;
import com.sfera.gamification.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin-users")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminUserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final Set<String> ALLOWED_ROLES = Set.of(
            "SUPER_ADMIN", "ADMIN", "BRANCH_ADMIN", "OPERATOR", "CASHIER", "ACCOUNTANT", "MENTOR"
    );

    @GetMapping
    public ResponseEntity<?> getAllAdmins() {
        List<User> allUsers = userRepository.findAll();
        List<Map<String, Object>> staffUsers = new ArrayList<>();
        for (User u : allUsers) {
            if (u.getRole() != null && !u.getRole().equals("STUDENT")) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", u.getId());
                map.put("fullName", u.getFullName());
                map.put("username", u.getUsername());
                map.put("role", u.getRole());
                map.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
                staffUsers.add(map);
            }
        }
        return ResponseEntity.ok(staffUsers);
    }

    @PostMapping
    public ResponseEntity<?> createAdmin(@RequestBody Map<String, String> request) {
        String fullName = request.get("fullName");
        String username = request.get("username");
        String password = request.get("password");
        String role = request.get("role");

        if (fullName == null || username == null || password == null) {
            return ResponseEntity.badRequest().body("Ism, username va parol majburiy");
        }

        if (role == null || role.trim().isEmpty()) {
            role = "ADMIN";
        } else {
            role = role.trim().toUpperCase();
        }

        if (!ALLOWED_ROLES.contains(role)) {
            return ResponseEntity.badRequest().body("Noto'g'ri rol kiritildi: " + role);
        }

        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body("Ushbu username band");
        }

        User user = User.builder()
                .fullName(fullName)
                .username(username)
                .password(passwordEncoder.encode(password))
                .role(role)
                .createdAt(LocalDateTime.now())
                .build();
        user = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("fullName", user.getFullName());
        response.put("username", user.getUsername());
        response.put("role", user.getRole());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAdmin(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = optionalUser.get();
        String fullName = request.get("fullName");
        String username = request.get("username");
        String password = request.get("password");
        String role = request.get("role");

        if (fullName != null && !fullName.trim().isEmpty()) user.setFullName(fullName);
        if (role != null && !role.trim().isEmpty()) {
            String cleanRole = role.trim().toUpperCase();
            if (ALLOWED_ROLES.contains(cleanRole)) {
                user.setRole(cleanRole);
            }
        }

        if (username != null && !username.trim().isEmpty()) {
            Optional<User> existing = userRepository.findByUsername(username);
            if (existing.isPresent() && !existing.get().getId().equals(id)) {
                return ResponseEntity.badRequest().body("Ushbu username band");
            }
            user.setUsername(username);
        }
        if (password != null && !password.trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(password));
        }

        user = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("fullName", user.getFullName());
        response.put("username", user.getUsername());
        response.put("role", user.getRole());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAdmin(@PathVariable Long id) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = optionalUser.get();
        if ("admin".equalsIgnoreCase(user.getUsername())) {
            return ResponseEntity.badRequest().body("Asosiy tizim administratorini o'chirish mumkin emas");
        }
        userRepository.delete(user);
        return ResponseEntity.ok().build();
    }
}
