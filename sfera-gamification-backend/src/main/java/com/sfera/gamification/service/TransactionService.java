package com.sfera.gamification.service;

import com.sfera.gamification.entity.PointTransaction;
import com.sfera.gamification.entity.User;
import com.sfera.gamification.repository.PointTransactionRepository;
import com.sfera.gamification.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransactionService {

    @Autowired
    private PointTransactionRepository pointTransactionRepository;

    @Autowired
    private UserRepository userRepository;

    public List<PointTransaction> getAllTransactions() {
        return pointTransactionRepository.findAll();
    }

    public PointTransaction cancelTransaction(Long transactionId, String adminUsername) {
        PointTransaction transaction = pointTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));
        User admin = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new IllegalArgumentException("Admin user not found"));

        if (!"SUPER_ADMIN".equals(admin.getRole())) {
            throw new SecurityException("Only super admins can cancel transactions");
        }

        transaction.setStatus("CANCELLED");
        transaction.setCancelledAt(LocalDateTime.now());
        transaction.setCancelledBy(admin);
        
        return pointTransactionRepository.save(transaction);
    }
}
