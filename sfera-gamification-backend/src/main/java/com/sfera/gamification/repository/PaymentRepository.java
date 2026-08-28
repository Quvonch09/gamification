package com.sfera.gamification.repository;

import com.sfera.gamification.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByInvoiceId(Long invoiceId);
    List<Payment> findByInvoiceEnrollmentStudentId(Long studentId);
}
