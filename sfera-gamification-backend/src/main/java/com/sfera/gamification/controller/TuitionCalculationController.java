package com.sfera.gamification.controller;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.*;
import com.sfera.gamification.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

@RestController
@RequestMapping("/api/finance/tuition")
public class TuitionCalculationController {

    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonRecordRepository lessonRecordRepository;
    private final GroupRepository groupRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public TuitionCalculationController(
            StudentRepository studentRepository,
            EnrollmentRepository enrollmentRepository,
            LessonRecordRepository lessonRecordRepository,
            GroupRepository groupRepository,
            PaymentRepository paymentRepository,
            InvoiceRepository invoiceRepository,
            UserRepository userRepository,
            AuditService auditService
    ) {
        this.studentRepository = studentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.lessonRecordRepository = lessonRecordRepository;
        this.groupRepository = groupRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @GetMapping("/calculate")
    public ResponseEntity<?> calculateStudentTuition(
            @RequestParam Long studentId,
            @RequestParam(required = false) String month
    ) {
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }

        YearMonth targetMonth;
        try {
            targetMonth = (month != null && !month.trim().isEmpty()) 
                    ? YearMonth.parse(month.trim()) 
                    : YearMonth.now();
        } catch (Exception e) {
            targetMonth = YearMonth.now();
        }

        LocalDate startDate = targetMonth.atDay(1);
        LocalDate endDate = targetMonth.atEndOfMonth();

        // Find active enrollment
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
        Enrollment activeEnrollment = enrollments.stream()
                .filter(e -> "ACTIVE".equals(e.getStatus()))
                .findFirst()
                .orElse(enrollments.isEmpty() ? null : enrollments.get(0));

        Group group = activeEnrollment != null ? activeEnrollment.getGroup() : null;
        BigDecimal monthlyPrice = BigDecimal.ZERO;
        if (activeEnrollment != null && activeEnrollment.getPricePlan() != null) {
            monthlyPrice = activeEnrollment.getPricePlan().getAmount();
        } else if (group != null && group.getCourse() != null && group.getCourse().getPrice() != null) {
            monthlyPrice = group.getCourse().getPrice();
        }

        int plannedLessons = (group != null && group.getLessonsPerMonth() != null) ? group.getLessonsPerMonth() : 12;
        if (plannedLessons <= 0) plannedLessons = 12;

        BigDecimal pricePerLesson = monthlyPrice.divide(BigDecimal.valueOf(plannedLessons), 0, RoundingMode.HALF_UP);

        // Attendance records in month
        List<LessonRecord> records = lessonRecordRepository.findByStudentIdAndDateRange(studentId, startDate, endDate);

        int attendedCount = 0;
        int excusedCount = 0;
        int absentCount = 0;
        List<Map<String, Object>> lessonDetails = new ArrayList<>();

        for (LessonRecord r : records) {
            Map<String, Object> item = new HashMap<>();
            item.put("lessonId", r.getLesson().getId());
            item.put("lessonDate", r.getLesson().getLessonDate());
            item.put("status", r.getAttendanceStatus());
            item.put("note", r.getAttendanceNote());
            item.put("mentorName", r.getLesson().getMentor() != null ? r.getLesson().getMentor().getFullName() : "Mentor");
            lessonDetails.add(item);

            if ("KELDI".equalsIgnoreCase(r.getAttendanceStatus())) {
                attendedCount++;
            } else if ("SABABLI".equalsIgnoreCase(r.getAttendanceStatus())) {
                excusedCount++;
            } else {
                absentCount++;
            }
        }

        // Calculations
        BigDecimal attendedTuition = pricePerLesson.multiply(BigDecimal.valueOf(attendedCount));
        // Deduction for excused absences from monthly price:
        BigDecimal excusedDeduction = pricePerLesson.multiply(BigDecimal.valueOf(excusedCount));
        BigDecimal standardTuitionMinusExcused = monthlyPrice.subtract(excusedDeduction);
        if (standardTuitionMinusExcused.compareTo(BigDecimal.ZERO) < 0) {
            standardTuitionMinusExcused = BigDecimal.ZERO;
        }

        // Payments in month
        List<Payment> payments = paymentRepository.findByInvoiceEnrollmentStudentId(studentId);
        BigDecimal totalPaid = BigDecimal.ZERO;
        for (Payment p : payments) {
            if (p.getCreatedAt() != null) {
                LocalDate payDate = p.getCreatedAt().toLocalDate();
                if (!payDate.isBefore(startDate) && !payDate.isAfter(endDate)) {
                    totalPaid = totalPaid.add(p.getAmount());
                }
            }
        }

        BigDecimal balanceDue = attendedTuition.subtract(totalPaid);

        Map<String, Object> result = new HashMap<>();
        result.put("studentId", student.getId());
        result.put("studentName", student.getFirstName() + " " + student.getLastName());
        result.put("phone", student.getPhone());
        result.put("parentPhone", student.getParentPhone());
        result.put("groupName", group != null ? group.getName() : "Guruhsiz");
        result.put("courseName", group != null && group.getCourse() != null ? group.getCourse().getName() : "Kurs");
        result.put("month", targetMonth.toString());
        result.put("monthlyStandardPrice", monthlyPrice);
        result.put("plannedLessonsPerMonth", plannedLessons);
        result.put("pricePerLesson", pricePerLesson);
        
        result.put("totalLessonsConducted", records.size());
        result.put("attendedCount", attendedCount);
        result.put("excusedCount", excusedCount);
        result.put("absentCount", absentCount);
        result.put("attendancePercentage", records.isEmpty() ? 0 : Math.round((float) attendedCount / records.size() * 100));

        result.put("calculatedTuition", attendedTuition);
        result.put("standardTuitionMinusExcused", standardTuitionMinusExcused);
        result.put("totalPaidInMonth", totalPaid);
        result.put("balanceDue", balanceDue);
        result.put("lessonRecords", lessonDetails);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/group-report")
    public ResponseEntity<?> calculateGroupTuitionReport(
            @RequestParam Long groupId,
            @RequestParam(required = false) String month
    ) {
        Group group = groupRepository.findById(groupId).orElse(null);
        if (group == null) {
            return ResponseEntity.notFound().build();
        }

        YearMonth targetMonth;
        try {
            targetMonth = (month != null && !month.trim().isEmpty()) 
                    ? YearMonth.parse(month.trim()) 
                    : YearMonth.now();
        } catch (Exception e) {
            targetMonth = YearMonth.now();
        }

        LocalDate startDate = targetMonth.atDay(1);
        LocalDate endDate = targetMonth.atEndOfMonth();

        BigDecimal monthlyPrice = (group.getCourse() != null && group.getCourse().getPrice() != null) 
                ? group.getCourse().getPrice() 
                : BigDecimal.valueOf(800000);
        int plannedLessons = group.getLessonsPerMonth() != null ? group.getLessonsPerMonth() : 12;
        if (plannedLessons <= 0) plannedLessons = 12;
        BigDecimal pricePerLesson = monthlyPrice.divide(BigDecimal.valueOf(plannedLessons), 0, RoundingMode.HALF_UP);

        List<Enrollment> enrollments = enrollmentRepository.findByGroupId(groupId);
        List<Map<String, Object>> studentReports = new ArrayList<>();

        BigDecimal groupTotalCalculated = BigDecimal.ZERO;
        BigDecimal groupTotalPaid = BigDecimal.ZERO;

        for (Enrollment enr : enrollments) {
            Student st = enr.getStudent();
            List<LessonRecord> records = lessonRecordRepository.findByStudentIdAndDateRange(st.getId(), startDate, endDate);

            int attended = 0;
            int excused = 0;
            int absent = 0;

            for (LessonRecord r : records) {
                if ("KELDI".equalsIgnoreCase(r.getAttendanceStatus())) attended++;
                else if ("SABABLI".equalsIgnoreCase(r.getAttendanceStatus())) excused++;
                else absent++;
            }

            BigDecimal tuition = pricePerLesson.multiply(BigDecimal.valueOf(attended));
            groupTotalCalculated = groupTotalCalculated.add(tuition);

            // Payments
            List<Payment> payments = paymentRepository.findByInvoiceEnrollmentStudentId(st.getId());
            BigDecimal paid = BigDecimal.ZERO;
            for (Payment p : payments) {
                if (p.getCreatedAt() != null) {
                    LocalDate payDate = p.getCreatedAt().toLocalDate();
                    if (!payDate.isBefore(startDate) && !payDate.isAfter(endDate)) {
                        paid = paid.add(p.getAmount());
                    }
                }
            }
            groupTotalPaid = groupTotalPaid.add(paid);

            Map<String, Object> item = new HashMap<>();
            item.put("studentId", st.getId());
            item.put("studentName", st.getFirstName() + " " + st.getLastName());
            item.put("phone", st.getPhone());
            item.put("parentPhone", st.getParentPhone());
            item.put("conductedLessons", records.size());
            item.put("attendedCount", attended);
            item.put("excusedCount", excused);
            item.put("absentCount", absent);
            item.put("calculatedTuition", tuition);
            item.put("paidAmount", paid);
            item.put("balanceDue", tuition.subtract(paid));
            studentReports.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("groupId", group.getId());
        response.put("groupName", group.getName());
        response.put("courseName", group.getCourse() != null ? group.getCourse().getName() : "");
        response.put("roomName", group.getRoomRef() != null ? group.getRoomRef().getName() : group.getRoom());
        response.put("month", targetMonth.toString());
        response.put("pricePerLesson", pricePerLesson);
        response.put("studentsCount", studentReports.size());
        response.put("totalCalculatedTuition", groupTotalCalculated);
        response.put("totalPaid", groupTotalPaid);
        response.put("totalBalanceDue", groupTotalCalculated.subtract(groupTotalPaid));
        response.put("students", studentReports);

        return ResponseEntity.ok(response);
    }
}
