package com.sfera.gamification.controller;

import com.sfera.gamification.service.AiChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    @Autowired
    private AiChatService aiChatService;

    @PostMapping("/chat")
    @PreAuthorize("hasAnyRole('STUDENT', 'SUPER_ADMIN', 'ADMIN', 'MENTOR')")
    public ResponseEntity<?> chatWithAi(@RequestBody ChatRequest request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Message cannot be empty");
        }

        String reply = aiChatService.generateResponse(principal.getName(), request.getMessage());
        return ResponseEntity.ok(Map.of("reply", reply));
    }

    @GetMapping("/daily-briefing")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getDailyBriefing(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        String briefing = aiChatService.generateDailyBriefing(principal.getName());
        return ResponseEntity.ok(Map.of("briefing", briefing));
    }

    public static class ChatRequest {
        private String message;
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
