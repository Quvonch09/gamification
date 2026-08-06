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
}
