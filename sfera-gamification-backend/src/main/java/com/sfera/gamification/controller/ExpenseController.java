package com.sfera.gamification.controller;

import com.sfera.gamification.entity.Expense;
import com.sfera.gamification.entity.User;
import com.sfera.gamification.repository.ExpenseRepository;
import com.sfera.gamification.repository.UserRepository;
import com.sfera.gamification.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/finance/expenses")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ACCOUNTANT')")
public class ExpenseController {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditService auditService;

    @GetMapping
    public ResponseEntity<?> getExpenses(
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String category) {

        YearMonth ym = (month != null && !month.trim().isEmpty()) ? YearMonth.parse(month) : YearMonth.now();
        LocalDate startDate = ym.atDay(1);
        LocalDate endDate = ym.atEndOfMonth();

        String catFilter = (category != null && !category.trim().isEmpty() && !"ALL".equalsIgnoreCase(category)) ? category.trim() : null;

        List<Expense> expenses = expenseRepository.findFilteredExpenses(startDate, endDate, catFilter);

        List<Map<String, Object>> response = expenses.stream().map(this::mapExpense).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getExpensesSummary(@RequestParam(required = false) String month) {
        YearMonth ym = (month != null && !month.trim().isEmpty()) ? YearMonth.parse(month) : YearMonth.now();
        LocalDate startDate = ym.atDay(1);
        LocalDate endDate = ym.atEndOfMonth();

        List<Expense> expenses = expenseRepository.findByExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(startDate, endDate);

        BigDecimal totalAmount = BigDecimal.ZERO;
        Map<String, BigDecimal> byCategory = new HashMap<>();
        Map<String, BigDecimal> byPaymentMethod = new HashMap<>();

        for (Expense e : expenses) {
            totalAmount = totalAmount.add(e.getAmount());

            String cat = e.getCategory() != null ? e.getCategory() : "OTHER";
            byCategory.put(cat, byCategory.getOrDefault(cat, BigDecimal.ZERO).add(e.getAmount()));

            String method = e.getPaymentMethod() != null ? e.getPaymentMethod() : "CASH";
            byPaymentMethod.put(method, byPaymentMethod.getOrDefault(method, BigDecimal.ZERO).add(e.getAmount()));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("month", ym.toString());
        result.put("totalExpenses", totalAmount);
        result.put("count", expenses.size());
        result.put("byCategory", byCategory);
        result.put("byPaymentMethod", byPaymentMethod);

        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> createExpense(@RequestBody Map<String, Object> req, Principal principal) {
        String title = (String) req.get("title");
        Object amountObj = req.get("amount");
        String category = (String) req.get("category");
        String paymentMethod = (String) req.get("paymentMethod");
        String dateStr = (String) req.get("expenseDate");
        String notes = (String) req.get("notes");

        if (title == null || title.trim().isEmpty() || amountObj == null) {
            return ResponseEntity.badRequest().body("Xarajat nomi va summasi majburiy!");
        }

        BigDecimal amount = new BigDecimal(amountObj.toString());
        LocalDate expenseDate = (dateStr != null && !dateStr.trim().isEmpty()) ? LocalDate.parse(dateStr) : LocalDate.now();

        User actor = principal != null ? userRepository.findByUsername(principal.getName()).orElse(null) : null;

        Expense expense = Expense.builder()
                .title(title.trim())
                .amount(amount)
                .category(category != null ? category.trim() : "OTHER")
                .paymentMethod(paymentMethod != null ? paymentMethod.trim() : "CASH")
                .expenseDate(expenseDate)
                .notes(notes)
                .createdBy(actor)
                .createdAt(LocalDateTime.now())
                .build();

        expense = expenseRepository.save(expense);

        auditService.log("EXPENSE_CREATED", "Expense", expense.getId(), null,
                String.format("Xarajat: %s (%s UZS, Kategoriya: %s)", expense.getTitle(), expense.getAmount(), expense.getCategory()), actor);

        return ResponseEntity.ok(mapExpense(expense));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExpense(@PathVariable Long id, @RequestBody Map<String, Object> req, Principal principal) {
        Expense expense = expenseRepository.findById(id).orElse(null);
        if (expense == null) {
            return ResponseEntity.notFound().build();
        }

        String oldVal = String.format("%s (%s UZS)", expense.getTitle(), expense.getAmount());

        if (req.containsKey("title")) expense.setTitle(((String) req.get("title")).trim());
        if (req.containsKey("amount")) expense.setAmount(new BigDecimal(req.get("amount").toString()));
        if (req.containsKey("category")) expense.setCategory(((String) req.get("category")).trim());
        if (req.containsKey("paymentMethod")) expense.setPaymentMethod(((String) req.get("paymentMethod")).trim());
        if (req.containsKey("expenseDate")) expense.setExpenseDate(LocalDate.parse((String) req.get("expenseDate")));
        if (req.containsKey("notes")) expense.setNotes((String) req.get("notes"));

        expense = expenseRepository.save(expense);

        User actor = principal != null ? userRepository.findByUsername(principal.getName()).orElse(null) : null;
        auditService.log("EXPENSE_UPDATED", "Expense", expense.getId(), oldVal,
                String.format("%s (%s UZS)", expense.getTitle(), expense.getAmount()), actor);

        return ResponseEntity.ok(mapExpense(expense));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id, Principal principal) {
        Expense expense = expenseRepository.findById(id).orElse(null);
        if (expense == null) {
            return ResponseEntity.notFound().build();
        }

        User actor = principal != null ? userRepository.findByUsername(principal.getName()).orElse(null) : null;
        auditService.log("EXPENSE_DELETED", "Expense", expense.getId(),
                String.format("%s (%s UZS)", expense.getTitle(), expense.getAmount()), null, actor);

        expenseRepository.delete(expense);
        return ResponseEntity.ok().build();
    }

    private Map<String, Object> mapExpense(Expense e) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", e.getId());
        map.put("title", e.getTitle());
        map.put("amount", e.getAmount());
        map.put("category", e.getCategory());
        map.put("paymentMethod", e.getPaymentMethod());
        map.put("expenseDate", e.getExpenseDate().toString());
        map.put("notes", e.getNotes());
        map.put("createdByName", e.getCreatedBy() != null ? e.getCreatedBy().getFullName() : "Tizim");
        map.put("createdAt", e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        return map;
    }
}
