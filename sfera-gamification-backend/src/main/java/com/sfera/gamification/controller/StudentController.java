package com.sfera.gamification.controller;

import com.sfera.gamification.entity.Student;
import com.sfera.gamification.entity.Group;
import com.sfera.gamification.entity.GroupStudent;
import com.sfera.gamification.entity.User;
import com.sfera.gamification.entity.PointRule;
import com.sfera.gamification.entity.PointTransaction;
import com.sfera.gamification.entity.Mentor;
import com.sfera.gamification.entity.Enrollment;
import com.sfera.gamification.entity.Invoice;
import com.sfera.gamification.entity.Payment;
import com.sfera.gamification.entity.LeadEvent;
import com.sfera.gamification.repository.PointTransactionRepository;
import com.sfera.gamification.repository.GroupStudentRepository;
import com.sfera.gamification.repository.GroupRepository;
import com.sfera.gamification.repository.UserRepository;
import com.sfera.gamification.repository.PointRuleRepository;
import com.sfera.gamification.repository.MentorRepository;
import com.sfera.gamification.repository.EnrollmentRepository;
import com.sfera.gamification.repository.InvoiceRepository;
import com.sfera.gamification.repository.PaymentRepository;
import com.sfera.gamification.repository.LeadRepository;
import com.sfera.gamification.repository.LeadEventRepository;
import com.sfera.gamification.service.StudentService;
import com.sfera.gamification.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private GroupService groupService;

    @Autowired
    private PointTransactionRepository pointTransactionRepository;

    @Autowired
    private GroupStudentRepository groupStudentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PointRuleRepository pointRuleRepository;

    @Autowired
    private MentorRepository mentorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private LeadEventRepository leadEventRepository;

    @GetMapping
    public ResponseEntity<?> getAllStudents(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        List<Student> students;
        if ("MENTOR".equals(user.getRole())) {
            Mentor mentor = mentorRepository.findByUserId(user.getId()).orElse(null);
            if (mentor == null) {
                students = new ArrayList<>();
            } else {
                students = studentService.getStudentsByMentor(mentor.getId());
            }
        } else {
            // Admins, Super Admin, Operators, Cashiers, Accountants
            students = studentService.getActiveStudents();
        }

        List<Map<String, Object>> response = new ArrayList<>();
        
        for (Student s : students) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("firstName", s.getFirstName());
            map.put("lastName", s.getLastName());
            map.put("fullName", s.getFirstName() + " " + s.getLastName());
            map.put("phone", s.getPhone());
            map.put("telegram", s.getTelegram());
            map.put("parentName", s.getParentName());
            map.put("parentPhone", s.getParentPhone());
            map.put("birthDate", s.getBirthDate());
            map.put("address", s.getAddress());
            map.put("gender", s.getGender());
            map.put("status", s.getStatus());
            map.put("createdAt", s.getCreatedAt());
            
            // Get total XP
            map.put("xp", pointTransactionRepository.getStudentXp(s.getId()));
            
            // Get username
            User studentUser = userRepository.findByStudentId(s.getId()).orElse(null);
            if (studentUser != null) {
                map.put("username", studentUser.getUsername());
            } else {
                map.put("username", "");
            }

            // Get group details
            List<GroupStudent> list = groupStudentRepository.findByStudentIdAndStatus(s.getId(), "ACTIVE");
            BigDecimal studentCoursePrice = BigDecimal.ZERO;
            if (s.getCustomPrice() != null) {
                studentCoursePrice = s.getCustomPrice();
            } else if (!list.isEmpty()) {
                Group grp = list.get(0).getGroup();
                if (grp.getCourse() != null && grp.getCourse().getPrice() != null) {
                    studentCoursePrice = grp.getCourse().getPrice();
                }
            }

            if (!list.isEmpty()) {
                Group grp = list.get(0).getGroup();
                map.put("groupId", grp.getId());
                map.put("groupName", grp.getName());
            } else {
                map.put("groupId", null);
                map.put("groupName", "Guruhsiz");
            }
            map.put("customPrice", s.getCustomPrice());
            map.put("coursePrice", studentCoursePrice);

            // Payments & Debt calculation
            List<Payment> payments = paymentRepository.findByInvoiceEnrollmentStudentId(s.getId());
            BigDecimal totalPaid = BigDecimal.ZERO;
            for (Payment p : payments) {
                totalPaid = totalPaid.add(p.getAmount());
            }
            map.put("totalPaid", totalPaid);

            List<Invoice> invoices = invoiceRepository.findByEnrollmentStudentId(s.getId());
            BigDecimal totalInvoiced = BigDecimal.ZERO;
            for (Invoice inv : invoices) {
                totalInvoiced = totalInvoiced.add(inv.getAmount());
            }

            BigDecimal expectedFee = totalInvoiced.compareTo(BigDecimal.ZERO) > 0 ? totalInvoiced : studentCoursePrice;
            BigDecimal balanceDue = expectedFee.subtract(totalPaid);
            if (balanceDue.compareTo(BigDecimal.ZERO) < 0) balanceDue = BigDecimal.ZERO;

            map.put("balanceDue", balanceDue);

            String paymentStatus;
            if (studentCoursePrice.compareTo(BigDecimal.ZERO) == 0 && totalInvoiced.compareTo(BigDecimal.ZERO) == 0) {
                paymentStatus = "NO_FEE";
            } else if (balanceDue.compareTo(BigDecimal.ZERO) == 0 && totalPaid.compareTo(BigDecimal.ZERO) > 0) {
                paymentStatus = "PAID";
            } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
                paymentStatus = "PARTIALLY_PAID";
            } else {
                paymentStatus = "DEBTOR";
            }
            map.put("paymentStatus", paymentStatus);

            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard(
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) Long mentorId,
            @RequestParam(required = false) Long courseId,
            Principal principal) {
        
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        List<Student> activeStudents = studentService.getActiveStudents();

        if ("MENTOR".equals(user.getRole())) {
            Mentor mentor = mentorRepository.findByUserId(user.getId()).orElse(null);
            if (mentor == null) {
                activeStudents = new ArrayList<>();
            } else {
                Long targetMentorId = mentor.getId();
                activeStudents = activeStudents.stream()
                    .filter(s -> {
                        List<GroupStudent> gsList = groupStudentRepository.findByStudentIdAndStatus(s.getId(), "ACTIVE");
                        return gsList.stream().anyMatch(gs -> {
                            if (groupId != null && !gs.getGroup().getId().equals(groupId)) return false;
                            return gs.getGroup().getMentor() != null && gs.getGroup().getMentor().getId().equals(targetMentorId);
                        });
                    })
                    .collect(java.util.stream.Collectors.toList());
            }
        } else {
            if (groupId != null) {
                activeStudents = activeStudents.stream()
                    .filter(s -> groupStudentRepository.findByStudentIdAndStatus(s.getId(), "ACTIVE").stream().anyMatch(gs -> gs.getGroup().getId().equals(groupId)))
                    .collect(java.util.stream.Collectors.toList());
            } else if (mentorId != null) {
                activeStudents = activeStudents.stream()
                    .filter(s -> groupStudentRepository.findByStudentIdAndStatus(s.getId(), "ACTIVE").stream().anyMatch(gs -> gs.getGroup().getMentor() != null && gs.getGroup().getMentor().getId().equals(mentorId)))
                    .collect(java.util.stream.Collectors.toList());
            } else if (courseId != null) {
                activeStudents = activeStudents.stream()
                    .filter(s -> groupStudentRepository.findByStudentIdAndStatus(s.getId(), "ACTIVE").stream().anyMatch(gs -> gs.getGroup().getCourse() != null && gs.getGroup().getCourse().getId().equals(courseId)))
                    .collect(java.util.stream.Collectors.toList());
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Student s : activeStudents) {
            Long xp = pointTransactionRepository.getStudentXp(s.getId());
            
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("firstName", s.getFirstName());
            map.put("lastName", s.getLastName());
            map.put("fullName", s.getFirstName() + " " + s.getLastName());
            map.put("xp", xp != null ? xp : 0L);

            // Group name
            List<GroupStudent> gsList = groupStudentRepository.findByStudentIdAndStatus(s.getId(), "ACTIVE");
            if (!gsList.isEmpty()) {
                map.put("groupName", gsList.get(0).getGroup().getName());
            } else {
                map.put("groupName", "Guruhsiz");
            }

            result.add(map);
        }

        // Sort descending by XP, then by fullName
        result.sort((a, b) -> {
            Long xpA = (Long) a.get("xp");
            Long xpB = (Long) b.get("xp");
            int cmp = xpB.compareTo(xpA);
            if (cmp != 0) return cmp;
            return ((String) a.get("fullName")).compareTo((String) b.get("fullName"));
        });

        // Set 1-indexed ranks
        for (int i = 0; i < result.size(); i++) {
            result.get(i).put("rank", i + 1);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> createStudent(@RequestBody Map<String, String> request, Principal principal) {
        String firstName = request.get("firstName");
        String lastName = request.get("lastName");
        String groupIdStr = request.get("groupId");
        String initialPointsStr = request.get("initialPoints");
        
        String username = request.get("username");
        String password = request.get("password");

        String phone = request.get("phone");
        String telegram = request.get("telegram");
        String parentName = request.get("parentName");
        String parentPhone = request.get("parentPhone");
        String birthDateStr = request.get("birthDate");
        String address = request.get("address");
        String gender = request.get("gender");

        if (firstName == null || lastName == null) {
            return ResponseEntity.badRequest().body("Ism va Familiya majburiy");
        }

        LocalDate birthDate = null;
        if (birthDateStr != null && !birthDateStr.trim().isEmpty()) {
            try {
                birthDate = LocalDate.parse(birthDateStr.trim());
            } catch (Exception e) {}
        }

        String customPriceStr = request.get("customPrice");
        BigDecimal customPrice = null;
        if (customPriceStr != null && !customPriceStr.trim().isEmpty()) {
            try {
                customPrice = new BigDecimal(customPriceStr.trim());
            } catch (Exception ignored) {}
        }

        Student student = Student.builder()
                .firstName(firstName)
                .lastName(lastName)
                .status("ACTIVE")
                .phone(phone)
                .telegram(telegram)
                .parentName(parentName)
                .parentPhone(parentPhone)
                .birthDate(birthDate)
                .address(address)
                .gender(gender)
                .customPrice(customPrice)
                .createdAt(LocalDateTime.now())
                .build();
        student = studentService.saveStudent(student);

        // Save User credentials
        String genUsername = (username != null && !username.trim().isEmpty()) 
            ? username.trim() 
            : (firstName.replaceAll("[^a-zA-Z0-9]", "").toLowerCase() + "_" + lastName.replaceAll("[^a-zA-Z0-9]", "").toLowerCase());
        
        if (userRepository.findByUsername(genUsername).isPresent()) {
            genUsername += (int)(Math.random() * 100);
        }

        User studentUser = User.builder()
                .fullName(firstName + " " + lastName)
                .username(genUsername)
                .password(passwordEncoder.encode((password != null && !password.trim().isEmpty()) ? password.trim() : "student123"))
                .role("STUDENT")
                .student(student)
                .createdAt(LocalDateTime.now())
                .build();
        userRepository.save(studentUser);

        if (groupIdStr != null && !groupIdStr.isEmpty()) {
            Long groupId = Long.parseLong(groupIdStr);
            Group group = groupService.getGroupById(groupId);
            if (group != null) {
                groupService.enrollStudent(group, student);
            }
        }

        if (initialPointsStr != null && !initialPointsStr.isEmpty()) {
            try {
                int initialPoints = Integer.parseInt(initialPointsStr.trim());
                if (initialPoints != 0 && principal != null) {
                    User adminUser = userRepository.findByUsername(principal.getName()).orElse(null);
                    PointRule initialRule = pointRuleRepository.findByCode("INITIAL_POINTS").orElse(null);
                    if (adminUser != null && initialRule != null) {
                        PointTransaction trans = PointTransaction.builder()
                                .student(student)
                                .mentor(adminUser)
                                .pointRule(initialRule)
                                .points(initialPoints)
                                .quantity(1)
                                .description("Tizimdan oldingi yig'ilgan ballar")
                                .status("ACTIVE")
                                .createdAt(java.time.LocalDateTime.now())
                                .build();
                        pointTransactionRepository.save(trans);
                    }
                }
            } catch (NumberFormatException e) {
                // Ignore invalid number format
            }
        }

        return ResponseEntity.ok(student);
    }

    @PostMapping("/bulk-import")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> bulkImportStudents(@RequestBody Map<String, String> request, Principal principal) {
        String groupIdStr = request.get("groupId");
        String text = request.get("text");

        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Import qilish uchun matn kiritilishi shart");
        }

        Group group = null;
        if (groupIdStr != null && !groupIdStr.isEmpty()) {
            group = groupService.getGroupById(Long.parseLong(groupIdStr));
        }

        User adminUser = principal != null ? userRepository.findByUsername(principal.getName()).orElse(null) : null;
        PointRule initialRule = pointRuleRepository.findByCode("INITIAL_POINTS").orElse(null);

        String[] lines = text.split("\n");
        List<Student> importedStudents = new ArrayList<>();

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;

            String namePart = line;
            String pointsPart = "";

            if (line.contains("->")) {
                String[] parts = line.split("->", 2);
                namePart = parts[0].trim();
                pointsPart = parts[1].trim();
            }

            String[] nameWords = namePart.split("\\s+");
            String firstName = "";
            String lastName = "";

            if (nameWords.length == 0) continue;
            
            if (nameWords.length >= 2) {
                firstName = nameWords[0];
                StringBuilder sb = new StringBuilder();
                for (int i = 1; i < nameWords.length; i++) {
                    sb.append(nameWords[i]).append(" ");
                }
                lastName = sb.toString().trim();
            } else {
                firstName = nameWords[0];
                lastName = "O'quvchi";
            }

            Student student = Student.builder()
                    .firstName(firstName)
                    .lastName(lastName)
                    .status("ACTIVE")
                    .createdAt(java.time.LocalDateTime.now())
                    .build();
            student = studentService.saveStudent(student);

            // Auto-generate credentials for bulk import
            String genUsername = (firstName.replaceAll("[^a-zA-Z0-9]", "").toLowerCase() + "_" + lastName.replaceAll("[^a-zA-Z0-9]", "").toLowerCase());
            if (userRepository.findByUsername(genUsername).isPresent()) {
                genUsername += (int)(Math.random() * 100);
            }
            User studentUser = User.builder()
                    .fullName(firstName + " " + lastName)
                    .username(genUsername)
                    .password(passwordEncoder.encode("student123"))
                    .role("STUDENT")
                    .student(student)
                    .createdAt(java.time.LocalDateTime.now())
                    .build();
            userRepository.save(studentUser);

            if (group != null) {
                groupService.enrollStudent(group, student);
            }

            int totalPoints = 0;
            if (!pointsPart.isEmpty()) {
                String[] pointsArr = pointsPart.split(",");
                for (String pStr : pointsArr) {
                    try {
                        totalPoints += Integer.parseInt(pStr.trim());
                    } catch (NumberFormatException e) {
                        // ignore bad format
                    }
                }
            }

            if (totalPoints != 0 && adminUser != null && initialRule != null) {
                PointTransaction trans = PointTransaction.builder()
                        .student(student)
                        .mentor(adminUser)
                        .pointRule(initialRule)
                        .points(totalPoints)
                        .quantity(1)
                        .description("Tizimdan oldingi yig'ilgan ballar")
                        .status("ACTIVE")
                        .createdAt(java.time.LocalDateTime.now())
                        .build();
                pointTransactionRepository.save(trans);
            }

            importedStudents.add(student);
        }

        return ResponseEntity.ok(importedStudents);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Student student = studentService.getStudentById(id);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }

        String firstName = request.get("firstName");
        String lastName = request.get("lastName");
        String groupIdStr = request.get("groupId");
        String username = request.get("username");
        String password = request.get("password");

        String phone = request.get("phone");
        String telegram = request.get("telegram");
        String parentName = request.get("parentName");
        String parentPhone = request.get("parentPhone");
        String birthDateStr = request.get("birthDate");
        String address = request.get("address");
        String gender = request.get("gender");

        if (firstName != null) student.setFirstName(firstName);
        if (lastName != null) student.setLastName(lastName);
        if (phone != null) student.setPhone(phone);
        if (telegram != null) student.setTelegram(telegram);
        if (parentName != null) student.setParentName(parentName);
        if (parentPhone != null) student.setParentPhone(parentPhone);
        if (birthDateStr != null) {
            if (birthDateStr.trim().isEmpty()) {
                student.setBirthDate(null);
            } else {
                try {
                    student.setBirthDate(LocalDate.parse(birthDateStr.trim()));
                } catch (Exception e) {}
            }
        }
        if (address != null) student.setAddress(address);
        if (gender != null) student.setGender(gender);

        String customPriceStr = request.get("customPrice");
        if (customPriceStr != null) {
            if (customPriceStr.trim().isEmpty()) {
                student.setCustomPrice(null);
            } else {
                try {
                    student.setCustomPrice(new BigDecimal(customPriceStr.trim()));
                } catch (Exception ignored) {}
            }
        }

        studentService.saveStudent(student);

        // Update User credentials
        User studentUser = userRepository.findByStudentId(id).orElse(null);
        if (studentUser == null) {
            studentUser = User.builder()
                    .fullName(student.getFirstName() + " " + student.getLastName())
                    .username(username != null && !username.trim().isEmpty() ? username.trim() : (student.getFirstName().replaceAll("[^a-zA-Z0-9]", "").toLowerCase() + "_" + student.getLastName().replaceAll("[^a-zA-Z0-9]", "").toLowerCase()))
                    .password(passwordEncoder.encode(password != null && !password.trim().isEmpty() ? password.trim() : "student123"))
                    .role("STUDENT")
                    .student(student)
                    .createdAt(LocalDateTime.now())
                    .build();
        } else {
            studentUser.setFullName(student.getFirstName() + " " + student.getLastName());
            if (username != null && !username.trim().isEmpty()) {
                studentUser.setUsername(username.trim());
            }
            if (password != null && !password.trim().isEmpty()) {
                studentUser.setPassword(passwordEncoder.encode(password.trim()));
            }
        }
        userRepository.save(studentUser);

        if (groupIdStr != null && !groupIdStr.isEmpty()) {
            Long groupId = Long.parseLong(groupIdStr);
            Group group = groupService.getGroupById(groupId);
            if (group != null) {
                groupService.enrollStudent(group, student);
            }
        }

        return ResponseEntity.ok(student);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> deleteOrArchiveStudent(@PathVariable Long id) {
        studentService.archiveStudent(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<?> getStudentProfile(@PathVariable Long id) {
        Map<String, Object> profile = studentService.getStudentProfile(id);
        if (profile == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/{id}/crm-profile")
    public ResponseEntity<?> getStudentCrmProfile(@PathVariable Long id) {
        Student student = studentService.getStudentById(id);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }

        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(id);
        List<Invoice> invoices = invoiceRepository.findByEnrollmentStudentId(id);
        List<Payment> payments = paymentRepository.findByInvoiceEnrollmentStudentId(id);

        // Build a unified chronological timeline
        List<Map<String, Object>> timeline = new java.util.ArrayList<>();

        // Add lead creation/conversion events
        if (student.getPhone() != null && !student.getPhone().isEmpty()) {
            leadRepository.findByPhone(student.getPhone()).ifPresent(lead -> {
                List<LeadEvent> leadEvents = leadEventRepository.findByLeadIdOrderByCreatedAtDesc(lead.getId());
                for (LeadEvent le : leadEvents) {
                    Map<String, Object> tEvent = new java.util.HashMap<>();
                    tEvent.put("date", le.getCreatedAt());
                    tEvent.put("type", "LEAD_EVENT");
                    tEvent.put("title", "Lead Tarixi: " + le.getEventType());
                    tEvent.put("description", le.getDescription());
                    tEvent.put("operator", le.getCreatedBy() != null ? le.getCreatedBy().getFullName() : "Tizim");
                    timeline.add(tEvent);
                }
            });
        }

        // Add enrollment events
        for (Enrollment e : enrollments) {
            if (e.getJoinedAt() != null) {
                Map<String, Object> tEvent = new java.util.HashMap<>();
                tEvent.put("date", e.getJoinedAt());
                tEvent.put("type", "ENROLLMENT");
                tEvent.put("title", "Guruhga Qabul");
                tEvent.put("description", "Kurs: " + e.getPricePlan().getCourse().getName() + 
                        (e.getGroup() != null ? ", Guruh: " + e.getGroup().getName() : "") + 
                        ", Tarif: " + e.getPricePlan().getName());
                tEvent.put("operator", "Tizim");
                timeline.add(tEvent);
            }
            if (e.getLeftAt() != null) {
                Map<String, Object> tEvent = new java.util.HashMap<>();
                tEvent.put("date", e.getLeftAt());
                tEvent.put("type", "ENROLLMENT_LEFT");
                tEvent.put("title", "Guruhdan Chiqish / Muzlatish");
                tEvent.put("description", "Holat: " + e.getStatus() + ", Izoh: " + e.getNotes());
                tEvent.put("operator", "Tizim");
                timeline.add(tEvent);
            }
        }

        // Add invoice events
        for (Invoice inv : invoices) {
            Map<String, Object> tEvent = new java.util.HashMap<>();
            tEvent.put("date", inv.getCreatedAt());
            tEvent.put("type", "INVOICE");
            tEvent.put("title", "Hisob-faktura Yaratildi");
            tEvent.put("description", "Summa: " + inv.getAmount() + " UZS, Muddat: " + inv.getDueDate());
            tEvent.put("operator", "Tizim");
            timeline.add(tEvent);
        }

        // Add payment events
        for (Payment pay : payments) {
            Map<String, Object> tEvent = new java.util.HashMap<>();
            tEvent.put("date", pay.getCreatedAt());
            tEvent.put("type", "PAYMENT");
            tEvent.put("title", "To'lov Qabul Qilindi");
            tEvent.put("description", "Summa: " + pay.getAmount() + " UZS, Usul: " + pay.getPaymentMethod() + 
                    (pay.getNotes() != null && !pay.getNotes().isEmpty() ? ", Izoh: " + pay.getNotes() : ""));
            tEvent.put("operator", pay.getReceivedBy() != null ? pay.getReceivedBy().getFullName() : "Kassa");
            timeline.add(tEvent);
        }

        // Add XP points events (PointTransaction)
        List<PointTransaction> transactions = pointTransactionRepository.findByStudentId(id);
        for (PointTransaction pt : transactions) {
            if ("ACTIVE".equals(pt.getStatus())) {
                Map<String, Object> tEvent = new java.util.HashMap<>();
                tEvent.put("date", pt.getCreatedAt());
                tEvent.put("type", "XP_AWARD");
                tEvent.put("title", "XP Berildi: " + pt.getPoints() + " XP");
                tEvent.put("description", pt.getDescription() + " (Qoida: " + pt.getPointRule().getName() + ", Soni: " + pt.getQuantity() + ")");
                tEvent.put("operator", pt.getMentor().getFullName());
                timeline.add(tEvent);
            }
        }

        // Sort timeline descending by date
        timeline.sort((a, b) -> ((LocalDateTime) b.get("date")).compareTo((LocalDateTime) a.get("date")));

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("student", student);
        response.put("invoices", invoices);
        response.put("payments", payments);
        response.put("enrollments", enrollments);
        response.put("timeline", timeline);

        return ResponseEntity.ok(response);
    }

    /**
     * Resets a single student's points to 0 while archiving all previous points in history.
     */
    @PostMapping("/{id}/reset-points")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'ADMIN', 'MENTOR')")
    public ResponseEntity<?> resetStudentPoints(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body, Principal principal) {
        User adminUser = principal != null ? userRepository.findByUsername(principal.getName()).orElse(null) : null;
        String reason = body != null ? body.get("reason") : null;
        studentService.resetStudentPoints(id, reason, adminUser);
        return ResponseEntity.ok(Map.of("message", "Talabaning ballari 0 ga tushirildi va tarixga arxivlandi!"));
    }

    /**
     * Bulk resets points for selected students.
     */
    @PostMapping("/bulk-reset-points")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'ADMIN')")
    public ResponseEntity<?> bulkResetPoints(@RequestBody Map<String, Object> body, Principal principal) {
        User adminUser = principal != null ? userRepository.findByUsername(principal.getName()).orElse(null) : null;
        List<?> rawIds = (List<?>) body.get("studentIds");
        String reason = (String) body.get("reason");
        if (rawIds != null) {
            for (Object item : rawIds) {
                try {
                    Long sId = Long.parseLong(item.toString());
                    studentService.resetStudentPoints(sId, reason, adminUser);
                } catch (Exception ignored) {}
            }
        }
        return ResponseEntity.ok(Map.of("message", "Tanlangan talabalarning ballari arxivlandi va 0 ga tushirildi!"));
    }

    /**
     * Changes a student's active group while preserving all earned points.
     */
    @PostMapping("/{id}/change-group")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'ADMIN')")
    public ResponseEntity<?> changeStudentGroup(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Object gIdObj = body.get("groupId");
        if (gIdObj == null) {
            return ResponseEntity.badRequest().body("Guruh identifikatori (groupId) talab qilinadi!");
        }
        Long newGroupId = Long.parseLong(gIdObj.toString());
        studentService.changeStudentGroup(id, newGroupId);
        return ResponseEntity.ok(Map.of("message", "Talaba yangi guruhga muvaffaqiyatli o'tkazildi, ballari saqlandi!"));
    }

    /**
     * Bulk deletes (archives) selected students.
     */
    @PostMapping("/bulk-delete")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'ADMIN')")
    public ResponseEntity<?> bulkDeleteStudents(@RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.get("studentIds");
        studentService.bulkDeleteStudents(ids);
        return ResponseEntity.ok(Map.of("message", "Tanlangan talabalar muvaffaqiyatli o'chirildi/arxivlandi!"));
    }

    /**
     * Bulk assigns selected students to a target group.
     */
    @PostMapping("/bulk-assign-group")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'ADMIN')")
    public ResponseEntity<?> bulkAssignGroup(@RequestBody Map<String, Object> body) {
        List<?> rawIds = (List<?>) body.get("studentIds");
        Object gIdObj = body.get("groupId");
        if (rawIds == null || gIdObj == null) {
            return ResponseEntity.badRequest().body("studentIds va groupId parametrlari talab qilinadi!");
        }
        Long targetGroupId = Long.parseLong(gIdObj.toString());
        List<Long> studentIds = new ArrayList<>();
        for (Object item : rawIds) {
            studentIds.add(Long.parseLong(item.toString()));
        }
        studentService.bulkAssignGroup(studentIds, targetGroupId);
        return ResponseEntity.ok(Map.of("message", "Tanlangan talabalar yangi guruhga muvaffaqiyatli biriktirildi!"));
    }
}
