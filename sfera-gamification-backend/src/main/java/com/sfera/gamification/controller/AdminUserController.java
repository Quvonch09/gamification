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

    @GetMapping
    public ResponseEntity<?> getAllAdmins() {
        List<User> allUsers = userRepository.findAll();
        List<Map<String, Object>> admins = new ArrayList<>();
        for (User u : allUsers) {
            if ("ADMIN".equals(u.getRole())) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", u.getId());
                map.put("fullName", u.getFullName());
                map.put("username", u.getUsername());
                map.put("role", u.getRole());
                admins.add(map);
            }
        }
        return ResponseEntity.ok(admins);
    }

    @PostMapping
    public ResponseEntity<?> createAdmin(@RequestBody Map<String, String> request) {
        String fullName = request.get("fullName");
        String username = request.get("username");
        String password = request.get("password");

        if (fullName == null || username == null || password == null) {
            return ResponseEntity.badRequest().body("Ism, username va parol majburiy");
        }

        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body("Ushbu username band");
        }

        User user = User.builder()
                .fullName(fullName)
                .username(username)
                .password(passwordEncoder.encode(password))
                .role("ADMIN")
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
        if (optionalUser.isEmpty() || !"ADMIN".equals(optionalUser.get().getRole())) {
            return ResponseEntity.notFound().build();
        }

        User user = optionalUser.get();
        String fullName = request.get("fullName");
        String username = request.get("username");
        String password = request.get("password");

        if (fullName != null) user.setFullName(fullName);
        if (username != null) {
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
        if (optionalUser.isEmpty() || !"ADMIN".equals(optionalUser.get().getRole())) {
            return ResponseEntity.notFound().build();
        }
        userRepository.delete(optionalUser.get());
        return ResponseEntity.ok().build();
    }
}
