package com.sfera.gamification.controller;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.UserRepository;
import com.sfera.gamification.service.LeadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leads")
public class LeadController {

    @Autowired
    private LeadService leadService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAllLeads(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(leadService.getAllLeads());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLeadById(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        Lead lead = leadService.getLeadById(id);
        if (lead == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(lead);
    }

    @PostMapping
    public ResponseEntity<?> createOrUpdateLead(@RequestBody Lead lead, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        lead.setOperator(user);
        Lead saved = leadService.saveLead(lead, user);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}/events")
    public ResponseEntity<?> getLeadEvents(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(leadService.getLeadEvents(id));
    }

    @PostMapping("/{id}/events")
    public ResponseEntity<?> addLeadEvent(@PathVariable Long id, @RequestBody Map<String, String> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        String eventType = request.get("eventType");
        String description = request.get("description");

        if (eventType == null || description == null) {
            return ResponseEntity.badRequest().body("eventType va description majburiy");
        }

        try {
            LeadEvent event = leadService.addLeadEvent(id, eventType, description, user);
            return ResponseEntity.ok(event);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateLeadStatus(@PathVariable Long id, @RequestBody Map<String, String> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        String status = request.get("status");
        String note = request.get("note");
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Status majburiy");
        }

        try {
            Lead updated = leadService.updateLeadStatus(id, status.trim().toUpperCase(), note, user);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<?> convertLead(@PathVariable Long id, @RequestBody Map<String, String> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        String groupIdStr = request.get("groupId");
        String pricePlanIdStr = request.get("pricePlanId");

        if (pricePlanIdStr == null || pricePlanIdStr.isEmpty()) {
            return ResponseEntity.badRequest().body("pricePlanId majburiy");
        }

        Long groupId = (groupIdStr != null && !groupIdStr.isEmpty()) ? Long.parseLong(groupIdStr) : null;
        Long pricePlanId = Long.parseLong(pricePlanIdStr);

        try {
            Student student = leadService.convertLeadToStudent(id, groupId, pricePlanId, user);
            return ResponseEntity.ok(student);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
