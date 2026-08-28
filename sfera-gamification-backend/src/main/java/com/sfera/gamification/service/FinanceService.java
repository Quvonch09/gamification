package com.sfera.gamification.service;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FinanceService {

    @Autowired
    private PricePlanRepository pricePlanRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private AuditService auditService;

    // Price Plans
    public List<PricePlan> getAllPricePlans() {
        return pricePlanRepository.findAll();
    }

    public PricePlan savePricePlan(PricePlan plan, User actor) {
        boolean isNew = plan.getId() == null;
        if (isNew) {
            plan.setCreatedAt(LocalDateTime.now());
        }
        PricePlan saved = pricePlanRepository.save(plan);
        auditService.log(
                isNew ? "CREATE_PRICE_PLAN" : "UPDATE_PRICE_PLAN",
                "PricePlan",
                saved.getId(),
                null,
                saved.getName() + " (" + saved.getAmount() + " UZS)",
                actor
        );
        return saved;
    }

    public void deletePricePlan(Long id, User actor) {
        pricePlanRepository.findById(id).ifPresent(plan -> {
            pricePlanRepository.delete(plan);
            auditService.log("DELETE_PRICE_PLAN", "PricePlan", id, plan.getName(), null, actor);
        });
    }

    // Invoices
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    public List<Invoice> getInvoicesByStudent(Long studentId) {
        return invoiceRepository.findByEnrollmentStudentId(studentId);
    }

    public Invoice saveInvoice(Invoice invoice, User actor) {
        boolean isNew = invoice.getId() == null;
        if (isNew) {
            invoice.setCreatedAt(LocalDateTime.now());
            if (invoice.getPaidAmount() == null) {
                invoice.setPaidAmount(BigDecimal.ZERO);
            }
            if (invoice.getStatus() == null) {
                invoice.setStatus("UNPAID");
            }
        }
        Invoice saved = invoiceRepository.save(invoice);
        auditService.log(
                isNew ? "CREATE_INVOICE" : "UPDATE_INVOICE",
                "Invoice",
                saved.getId(),
                null,
                "Amount: " + saved.getAmount() + ", Student ID: " + saved.getEnrollment().getStudent().getId(),
                actor
        );
        return saved;
    }

    // Payments
    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public List<Payment> getPaymentsByStudent(Long studentId) {
        return paymentRepository.findByInvoiceEnrollmentStudentId(studentId);
    }

    @Transactional
    public Payment processPayment(Long invoiceId, BigDecimal amount, String method, String notes, User actor) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        if ("PAID".equals(invoice.getStatus())) {
            throw new IllegalStateException("Invoice is already fully paid");
        }

        BigDecimal oldPaid = invoice.getPaidAmount();
        BigDecimal newPaid = oldPaid.add(amount);

        if (newPaid.compareTo(invoice.getAmount()) > 0) {
            invoice.setAmount(newPaid);
        }

        invoice.setPaidAmount(newPaid);
        if (newPaid.compareTo(invoice.getAmount()) == 0) {
            invoice.setStatus("PAID");
        } else {
            invoice.setStatus("PARTIALLY_PAID");
        }
        invoiceRepository.save(invoice);

        Payment payment = Payment.builder()
                .invoice(invoice)
                .amount(amount)
                .paymentMethod(method)
                .notes(notes)
                .createdAt(LocalDateTime.now())
                .receivedBy(actor)
                .build();
        payment = paymentRepository.save(payment);

        auditService.log(
                "PROCESS_PAYMENT",
                "Invoice",
                invoice.getId(),
                "Paid: " + oldPaid + " (" + invoice.getStatus() + ")",
                "Paid: " + newPaid + " (" + invoice.getStatus() + ")",
                actor
        );

        return payment;
    }
}
