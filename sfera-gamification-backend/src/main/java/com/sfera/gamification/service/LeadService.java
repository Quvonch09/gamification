package com.sfera.gamification.service;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LeadService {

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private LeadEventRepository leadEventRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupStudentRepository groupStudentRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private PricePlanRepository pricePlanRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditService auditService;

    public List<Lead> getAllLeads() {
        return leadRepository.findAll();
    }

    public Lead getLeadById(Long id) {
        return leadRepository.findById(id).orElse(null);
    }

    public Lead saveLead(Lead lead, User actor) {
        boolean isNew = lead.getId() == null;
        if (isNew) {
            lead.setCreatedAt(LocalDateTime.now());
            if (lead.getStatus() == null) {
                lead.setStatus("NEW");
            }
        }
        Lead saved = leadRepository.save(lead);
        auditService.log(
                isNew ? "CREATE_LEAD" : "UPDATE_LEAD",
                "Lead",
                saved.getId(),
                null,
                saved.getFirstName() + " " + saved.getLastName() + " (" + saved.getStatus() + ")",
                actor
        );
        return saved;
    }

    public List<LeadEvent> getLeadEvents(Long leadId) {
        return leadEventRepository.findByLeadIdOrderByCreatedAtDesc(leadId);
    }

    public LeadEvent addLeadEvent(Long leadId, String eventType, String description, User actor) {
        Lead lead = leadRepository.findById(leadId).orElseThrow(() -> new IllegalArgumentException("Lead not found"));
        LeadEvent event = LeadEvent.builder()
                .lead(lead)
                .eventType(eventType)
                .description(description)
                .createdAt(LocalDateTime.now())
                .createdBy(actor)
                .build();
        LeadEvent savedEvent = leadEventRepository.save(event);

        // Update lead status if status change event
        if ("STATUS_CHANGE".equals(eventType)) {
            String oldStatus = lead.getStatus();
            lead.setStatus(description);
            leadRepository.save(lead);
            auditService.log("LEAD_STATUS_CHANGE", "Lead", lead.getId(), oldStatus, description, actor);
        } else {
            auditService.log("ADD_LEAD_EVENT", "Lead", lead.getId(), null, eventType + ": " + description, actor);
        }
        return savedEvent;
    }

    public Lead updateLeadStatus(Long leadId, String newStatus, String note, User actor) {
        Lead lead = leadRepository.findById(leadId).orElseThrow(() -> new IllegalArgumentException("Lead topilmadi"));
        String oldStatus = lead.getStatus();
        if (!newStatus.equals(oldStatus)) {
            lead.setStatus(newStatus);
            leadRepository.save(lead);
            String fullDesc = "Status o'zgartirildi: " + oldStatus + " -> " + newStatus;
            if (note != null && !note.trim().isEmpty()) {
                fullDesc += " | Izoh: " + note.trim();
            }
            LeadEvent event = LeadEvent.builder()
                    .lead(lead)
                    .eventType("STATUS_CHANGE")
                    .description(fullDesc)
                    .createdAt(LocalDateTime.now())
                    .createdBy(actor)
                    .build();
            leadEventRepository.save(event);
            auditService.log("LEAD_STATUS_CHANGE", "Lead", lead.getId(), oldStatus, newStatus + (note != null ? " (" + note + ")" : ""), actor);
        }
        return lead;
    }

    @Transactional
    public Student convertLeadToStudent(Long leadId, Long groupId, Long pricePlanId, User actor) {
        Lead lead = leadRepository.findById(leadId).orElseThrow(() -> new IllegalArgumentException("Lead not found"));
        if ("CONVERTED".equals(lead.getStatus())) {
            throw new IllegalStateException("Lead is already converted");
        }

        // 1. Create Student
        Student student = Student.builder()
                .firstName(lead.getFirstName())
                .lastName(lead.getLastName() != null ? lead.getLastName() : "")
                .phone(lead.getPhone())
                .status("ACTIVE")
                .branch(lead.getBranch())
                .createdAt(LocalDateTime.now())
                .build();
        student = studentRepository.save(student);

        // 2. Create Student User Account
        String genUsername = (lead.getFirstName().replaceAll("[^a-zA-Z0-9]", "").toLowerCase() + "_" + 
                (lead.getLastName() != null ? lead.getLastName().replaceAll("[^a-zA-Z0-9]", "").toLowerCase() : "stud"));
        if (userRepository.findByUsername(genUsername).isPresent()) {
            genUsername += (int)(Math.random() * 100);
        }
        User studentUser = User.builder()
                .fullName(student.getFirstName() + " " + student.getLastName())
                .username(genUsername)
                .password(passwordEncoder.encode("student123"))
                .role("STUDENT")
                .student(student)
                .branch(lead.getBranch())
                .createdAt(LocalDateTime.now())
                .build();
        userRepository.save(studentUser);

        // 3. Setup Enrollment & Group Membership if groupId is provided
        Group group = null;
        if (groupId != null) {
            group = groupRepository.findById(groupId).orElse(null);
            if (group != null) {
                GroupStudent gs = GroupStudent.builder()
                        .group(group)
                        .student(student)
                        .joinedAt(LocalDateTime.now())
                        .status("ACTIVE")
                        .build();
                groupStudentRepository.save(gs);
            }
        }

        // 4. Setup PricePlan & Billing
        PricePlan pricePlan = pricePlanRepository.findById(pricePlanId)
                .orElseThrow(() -> new IllegalArgumentException("Price Plan not found"));
        
        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .group(group)
                .pricePlan(pricePlan)
                .status("ACTIVE")
                .discountAmount(BigDecimal.ZERO)
                .joinedAt(LocalDateTime.now())
                .build();
        enrollment = enrollmentRepository.save(enrollment);

        // 5. Generate Initial Invoice
        Invoice invoice = Invoice.builder()
                .enrollment(enrollment)
                .amount(pricePlan.getAmount())
                .paidAmount(BigDecimal.ZERO)
                .dueDate(LocalDate.now().plusDays(10)) // due in 10 days
                .status("UNPAID")
                .createdAt(LocalDateTime.now())
                .build();
        invoiceRepository.save(invoice);

        // 6. Log Lead History & Update Status
        lead.setStatus("CONVERTED");
        leadRepository.save(lead);

        LeadEvent event = LeadEvent.builder()
                .lead(lead)
                .eventType("CONVERTED")
                .description("Lead converted to student. Created student ID: " + student.getId())
                .createdAt(LocalDateTime.now())
                .createdBy(actor)
                .build();
        leadEventRepository.save(event);

        auditService.log("CONVERT_LEAD", "Lead", lead.getId(), "NEW/CONTACTED", "CONVERTED (Student ID: " + student.getId() + ")", actor);

        return student;
    }
}
