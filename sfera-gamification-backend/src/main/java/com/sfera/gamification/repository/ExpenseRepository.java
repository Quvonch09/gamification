package com.sfera.gamification.repository;

import com.sfera.gamification.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(LocalDate startDate, LocalDate endDate);

    List<Expense> findByCategoryOrderByExpenseDateDesc(String category);

    @Query("SELECT e FROM Expense e WHERE e.expenseDate >= :startDate AND e.expenseDate <= :endDate AND (:category IS NULL OR e.category = :category) ORDER BY e.expenseDate DESC, e.createdAt DESC")
    List<Expense> findFilteredExpenses(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("category") String category);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.expenseDate >= :startDate AND e.expenseDate <= :endDate")
    Double sumAmountBetweenDates(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
