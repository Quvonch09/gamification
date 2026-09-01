package com.sfera.gamification.controller;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.*;
import com.sfera.gamification.service.FinanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    @Autowired
    private FinanceService financeService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private GroupStudentRepository groupStudentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PricePlanRepository pricePlanRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    // Price Plans
    @GetMapping("/price-plans")
    public ResponseEntity<?> getAllPricePlans(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(financeService.getAllPricePlans());
    }

    @PostMapping("/price-plans")
    public ResponseEntity<?> savePricePlan(@RequestBody PricePlan plan, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        return ResponseEntity.ok(financeService.savePricePlan(plan, user));
    }

    @DeleteMapping("/price-plans/{id}")
    public ResponseEntity<?> deletePricePlan(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        financeService.deletePricePlan(id, user);
        return ResponseEntity.ok().build();
    }

    // Invoices
    @GetMapping("/invoices")
    public ResponseEntity<?> getAllInvoices(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(financeService.getAllInvoices());
    }

    @GetMapping("/invoices/student/{studentId}")
    public ResponseEntity<?> getInvoicesByStudent(@PathVariable Long studentId, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(financeService.getInvoicesByStudent(studentId));
    }

    @PostMapping("/invoices")
    public ResponseEntity<?> createInvoice(@RequestBody Map<String, String> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        String enrollmentIdStr = request.get("enrollmentId");
        String amountStr = request.get("amount");
        String dueDateStr = request.get("dueDate");

        if (enrollmentIdStr == null || amountStr == null || dueDateStr == null) {
            return ResponseEntity.badRequest().body("enrollmentId, amount, va dueDate majburiy");
        }

        Enrollment enrollment = enrollmentRepository.findById(Long.parseLong(enrollmentIdStr))
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found"));

        Invoice invoice = Invoice.builder()
                .enrollment(enrollment)
                .amount(new BigDecimal(amountStr))
                .dueDate(java.time.LocalDate.parse(dueDateStr))
                .paidAmount(BigDecimal.ZERO)
                .status("UNPAID")
                .build();

        return ResponseEntity.ok(financeService.saveInvoice(invoice, user));
    }

    // Payments
    @GetMapping("/payments")
    public ResponseEntity<?> getAllPayments(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        List<Payment> list = financeService.getAllPayments();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Payment p : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId());
            m.put("amount", p.getAmount());
            m.put("paymentMethod", p.getPaymentMethod());
            m.put("notes", p.getNotes());
            m.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
            m.put("paymentDate", p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
            m.put("receiptNo", "REC-" + p.getId() + (p.getId() * 7 % 900 + 100));

            // Who collected payment
            if (p.getReceivedBy() != null) {
                m.put("receivedById", p.getReceivedBy().getId());
                m.put("receivedByName", p.getReceivedBy().getFullName());
                m.put("receivedByRole", p.getReceivedBy().getRole());
            } else {
                m.put("receivedByName", "Kassa Admin");
                m.put("receivedByRole", "CASHIER");
            }

            // Student & Group info
            if (p.getInvoice() != null && p.getInvoice().getEnrollment() != null) {
                Student s = p.getInvoice().getEnrollment().getStudent();
                if (s != null) {
                    m.put("studentId", s.getId());
                    m.put("studentName", s.getFirstName() + " " + s.getLastName());
                    m.put("studentPhone", s.getPhone());
                }
                Group g = p.getInvoice().getEnrollment().getGroup();
                if (g != null) {
                    m.put("groupId", g.getId());
                    m.put("groupName", g.getName());
                }
            }
            result.add(m);
        }
        result.sort((a, b) -> {
            String da = (String) a.get("createdAt");
            String db = (String) b.get("createdAt");
            if (da == null) return 1;
            if (db == null) return -1;
            return db.compareTo(da);
        });
        return ResponseEntity.ok(result);
    }

    @GetMapping("/payments/student/{studentId}")
    public ResponseEntity<?> getPaymentsByStudent(@PathVariable Long studentId, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(financeService.getPaymentsByStudent(studentId));
    }

    @PostMapping("/payments")
    public ResponseEntity<?> processPayment(@RequestBody Map<String, String> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        if ("SUPER_ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(403).body("Super Admin to'lov kira olmaydi. Faqat Administrator yoki Kassir to'lov qabul qilishi mumkin.");
        }

        String invoiceIdStr = request.get("invoiceId");
        String amountStr = request.get("amount");
        String method = request.get("paymentMethod");
        String notes = request.get("notes");

        if (invoiceIdStr == null || amountStr == null || method == null) {
            return ResponseEntity.badRequest().body("invoiceId, amount, va paymentMethod majburiy");
        }

        try {
            Payment payment = financeService.processPayment(
                    Long.parseLong(invoiceIdStr),
                    new BigDecimal(amountStr),
                    method,
                    notes,
                    user
            );
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/quick-pay")
    public ResponseEntity<?> processQuickPayment(@RequestBody Map<String, Object> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        if ("SUPER_ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(403).body("Super Admin to'lov kira olmaydi. Faqat Administrator yoki Kassir to'lov qabul qilishi mumkin.");
        }

        Object studentIdObj = request.get("studentId");
        Object amountObj = request.get("amount");
        String method = (String) request.get("paymentMethod");
        String notes = (String) request.get("notes");

        if (studentIdObj == null || amountObj == null) {
            return ResponseEntity.badRequest().body("Talaba va summa majburiy");
        }

        Long studentId = Long.parseLong(studentIdObj.toString());
        BigDecimal amount = new BigDecimal(amountObj.toString());
        if (method == null || method.trim().isEmpty()) {
            method = "CASH";
        }

        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) {
            return ResponseEntity.badRequest().body("Talaba topilmadi");
        }

        // 1. Find or create enrollment
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
        Enrollment enrollment;
        if (!enrollments.isEmpty()) {
            enrollment = enrollments.get(0);
        } else {
            List<GroupStudent> gsList = groupStudentRepository.findByStudentIdAndStatus(studentId, "ACTIVE");
            Group group = !gsList.isEmpty() ? gsList.get(0).getGroup() : null;
            Course course = group != null ? group.getCourse() : null;
            
            List<PricePlan> plans = financeService.getAllPricePlans();
            PricePlan plan = null;
            if (course != null) {
                plan = plans.stream().filter(p -> p.getCourse() != null && p.getCourse().getId().equals(course.getId())).findFirst().orElse(null);
            }
            if (plan == null && !plans.isEmpty()) {
                plan = plans.get(0);
            }
            if (plan == null) {
                BigDecimal planAmount = (course != null && course.getPrice() != null) ? course.getPrice() : amount;
                plan = PricePlan.builder()
                        .name("Standart Tarif")
                        .course(course)
                        .amount(planAmount)
                        .durationMonths(1)
                        .createdAt(LocalDateTime.now())
                        .build();
                plan = pricePlanRepository.save(plan);
            }

            enrollment = Enrollment.builder()
                    .student(student)
                    .group(group)
                    .pricePlan(plan)
                    .status("ACTIVE")
                    .joinedAt(LocalDateTime.now())
                    .build();
            enrollment = enrollmentRepository.save(enrollment);
        }

        // 2. Find or create invoice
        List<Invoice> invoices = invoiceRepository.findByEnrollmentStudentId(studentId);
        Invoice targetInvoice = invoices.stream()
                .filter(inv -> !"PAID".equalsIgnoreCase(inv.getStatus()))
                .findFirst().orElse(null);

        if (targetInvoice == null) {
            BigDecimal invAmount = student.getCustomPrice() != null
                    ? student.getCustomPrice()
                    : (enrollment.getPricePlan() != null && enrollment.getPricePlan().getAmount() != null
                            ? enrollment.getPricePlan().getAmount()
                            : amount);
            targetInvoice = Invoice.builder()
                    .enrollment(enrollment)
                    .amount(invAmount)
                    .dueDate(LocalDate.now().plusDays(5))
                    .paidAmount(BigDecimal.ZERO)
                    .status("UNPAID")
                    .createdAt(LocalDateTime.now())
                    .build();
            targetInvoice = invoiceRepository.save(targetInvoice);
        }

        // 3. Process payment
        Payment payment = financeService.processPayment(
                targetInvoice.getId(),
                amount,
                method,
                notes != null ? notes : "Kassa to'lovi",
                user
        );

        Map<String, Object> res = new HashMap<>();
        res.put("paymentId", payment.getId());
        res.put("amount", payment.getAmount());
        res.put("method", payment.getPaymentMethod());
        res.put("paymentDate", payment.getCreatedAt() != null ? payment.getCreatedAt().toString() : LocalDateTime.now().toString());
        res.put("receiptNo", "REC-" + payment.getId() + (int)(Math.random() * 900 + 100));
        res.put("studentName", student.getFirstName() + " " + student.getLastName());
        res.put("studentPhone", student.getPhone());
        res.put("groupName", enrollment.getGroup() != null ? enrollment.getGroup().getName() : "Guruhsiz");
        res.put("cashierName", user.getFullName());
        res.put("notes", payment.getNotes());

        return ResponseEntity.ok(res);
    }
}
