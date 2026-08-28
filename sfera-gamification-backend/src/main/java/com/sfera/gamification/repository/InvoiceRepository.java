package com.sfera.gamification.repository;

import com.sfera.gamification.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByEnrollmentId(Long enrollmentId);
    List<Invoice> findByEnrollmentStudentId(Long studentId);
    List<Invoice> findByStatus(String status);
}
