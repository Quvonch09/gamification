package com.sfera.gamification.controller;

import com.sfera.gamification.config.JwtUtils;
import com.sfera.gamification.dto.LoginRequest;
import com.sfera.gamification.dto.LoginResponse;
import com.sfera.gamification.entity.GroupStudent;
import com.sfera.gamification.entity.User;
import com.sfera.gamification.repository.GroupStudentRepository;
import com.sfera.gamification.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupStudentRepository groupStudentRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private com.sfera.gamification.repository.StudentRepository studentRepository;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.username(), loginRequest.password()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        String jwt = jwtUtils.generateJwtToken(user.getUsername(), user.getRole());

        return ResponseEntity.ok(new LoginResponse(
                jwt,
                user.getUsername(),
                user.getFullName(),
                user.getRole(),
                user.getId()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("fullName", user.getFullName());
        map.put("role", user.getRole());
        map.put("phone", user.getPhone());
        map.put("avatarUrl", user.getAvatarUrl());

        // If student, include studentId and groupId for frontend dashboard/leaderboard
        if ("STUDENT".equals(user.getRole()) && user.getStudent() != null) {
            Long studentId = user.getStudent().getId();
            map.put("studentId", studentId);

            List<GroupStudent> groups = groupStudentRepository.findByStudentIdAndStatus(studentId, "ACTIVE");
            if (!groups.isEmpty()) {
                map.put("groupId", groups.get(0).getGroup().getId());
                map.put("groupName", groups.get(0).getGroup().getName());
            }
        }

        return ResponseEntity.ok(map);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        String fullName = request.get("fullName");
        String phone = request.get("phone");
        String avatarUrl = request.get("avatarUrl");
        String password = request.get("password");

        if (fullName != null && !fullName.trim().isEmpty()) {
            user.setFullName(fullName.trim());
        }
        if (phone != null) {
            user.setPhone(phone.trim());
        }
        if (avatarUrl != null) {
            user.setAvatarUrl(avatarUrl);
        }
        if (password != null && !password.trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(password.trim()));
        }

        // If user is a student, sync fullName and phone to student entity as well
        if ("STUDENT".equals(user.getRole()) && user.getStudent() != null) {
            com.sfera.gamification.entity.Student student = user.getStudent();
            if (fullName != null && !fullName.trim().isEmpty()) {
                String[] parts = fullName.trim().split("\\s+", 2);
                student.setFirstName(parts[0]);
                student.setLastName(parts.length > 1 ? parts[1] : "");
            }
            if (phone != null) {
                student.setPhone(phone.trim());
            }
            studentRepository.save(student);
        }

        userRepository.save(user);

        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("fullName", user.getFullName());
        map.put("role", user.getRole());
        map.put("phone", user.getPhone());
        map.put("avatarUrl", user.getAvatarUrl());

        return ResponseEntity.ok(map);
    }
}
