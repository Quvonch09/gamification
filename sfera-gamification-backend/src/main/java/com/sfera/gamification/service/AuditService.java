package com.sfera.gamification.service;

import com.sfera.gamification.entity.AuditLog;
import com.sfera.gamification.entity.User;
import com.sfera.gamification.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired(required = false)
    private HttpServletRequest request;

    public void log(String action, String entityName, Long entityId, String oldValue, String newValue, User actor) {
        String ipAddress = "127.0.0.1";
        try {
            if (request != null) {
                ipAddress = request.getRemoteAddr();
            }
        } catch (Exception e) {
            // Not in web request context
        }

        AuditLog log = AuditLog.builder()
                .action(action)
                .entityName(entityName)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .actor(actor)
                .ipAddress(ipAddress)
                .createdAt(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findByOrderByCreatedAtDesc();
    }
}
