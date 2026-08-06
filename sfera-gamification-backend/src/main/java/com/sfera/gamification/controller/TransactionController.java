package com.sfera.gamification.controller;

import com.sfera.gamification.entity.PointTransaction;
import com.sfera.gamification.service.TransactionService;
import com.sfera.gamification.repository.UserRepository;
import com.sfera.gamification.repository.StudentRepository;
import com.sfera.gamification.repository.PointRuleRepository;
import com.sfera.gamification.repository.PointTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private PointRuleRepository pointRuleRepository;

    @Autowired
    private PointTransactionRepository pointTransactionRepository;

    @GetMapping("/rules")
    public ResponseEntity<?> getPointRules() {
        return ResponseEntity.ok(pointRuleRepository.findByActive(true));
    }

    @GetMapping
    public ResponseEntity<?> getAllTransactions(Principal principal) {
        List<PointTransaction> list;
        if (principal != null) {
            com.sfera.gamification.entity.User authUser = userRepository.findByUsername(principal.getName()).orElse(null);
            if (authUser != null && "STUDENT".equals(authUser.getRole()) && authUser.getStudent() != null) {
                list = pointTransactionRepository.findByStudentId(authUser.getStudent().getId());
            } else {
                list = transactionService.getAllTransactions();
            }
        } else {
            list = transactionService.getAllTransactions();
        }
        List<Map<String, Object>> response = new ArrayList<>();
        
        for (PointTransaction t : list) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", t.getId());
            map.put("studentId", t.getStudent().getId());
            map.put("studentName", t.getStudent().getFirstName() + " " + t.getStudent().getLastName());
            map.put("date", t.getCreatedAt().toLocalDate().toString());
            map.put("dateTime", t.getCreatedAt().toString());
            map.put("description", t.getDescription());
            map.put("points", t.getPoints());
            map.put("status", t.getStatus());
            map.put("mentorName", t.getMentor().getFullName());
            
            if (t.getCancelledAt() != null) {
                map.put("cancelledAt", t.getCancelledAt().toString());
            }
            if (t.getCancelledBy() != null) {
                map.put("cancelledByName", t.getCancelledBy().getFullName());
            }
            
            response.add(map);
        }
        
        // Sort descending by dateTime
        response.sort((t1, t2) -> t2.get("dateTime").toString().compareTo(t1.get("dateTime").toString()));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cancelTransaction(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        try {
            PointTransaction t = transactionService.cancelTransaction(id, principal.getName());
            return ResponseEntity.ok(t);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MENTOR')")
    public ResponseEntity<?> createTransaction(@RequestBody Map<String, Object> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        try {
            Long studentId = Long.valueOf(request.get("studentId").toString());
            Long pointRuleId = Long.valueOf(request.get("pointRuleId").toString());
            Integer customPoints = request.get("points") != null && !request.get("points").toString().isEmpty() 
                    ? Integer.valueOf(request.get("points").toString()) 
                    : null;
            String description = request.get("description") != null ? request.get("description").toString() : null;
            Integer quantity = request.get("quantity") != null && !request.get("quantity").toString().isEmpty() 
                    ? Integer.valueOf(request.get("quantity").toString()) 
                    : 1;

            com.sfera.gamification.entity.Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new IllegalArgumentException("Student not found"));
            
            com.sfera.gamification.entity.PointRule rule = pointRuleRepository.findById(pointRuleId)
                    .orElseThrow(() -> new IllegalArgumentException("Point rule not found"));

            com.sfera.gamification.entity.User mentor = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new IllegalArgumentException("Mentor not found"));

            int finalPoints = customPoints != null ? customPoints : (rule.getPoints() * quantity);
            String finalDescription;
            if (description != null && !description.trim().isEmpty()) {
                finalDescription = description.trim();
            } else {
                finalDescription = quantity > 1 ? (rule.getName() + " x" + quantity) : rule.getName();
            }

            PointTransaction transaction = PointTransaction.builder()
                    .student(student)
                    .pointRule(rule)
                    .mentor(mentor)
                    .points(finalPoints)
                    .quantity(quantity)
                    .description(finalDescription)
                    .status("ACTIVE")
                    .createdAt(java.time.LocalDateTime.now())
                    .build();

            pointTransactionRepository.save(transaction);
            return ResponseEntity.ok(transaction);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
