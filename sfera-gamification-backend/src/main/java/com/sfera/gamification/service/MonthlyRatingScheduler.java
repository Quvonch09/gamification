package com.sfera.gamification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MonthlyRatingScheduler {

    private static final Logger log = LoggerFactory.getLogger(MonthlyRatingScheduler.class);

    @Autowired
    private StudentService studentService;

    /**
     * Runs automatically on the 1st of every month at 00:00:00.
     * Resets active points of all students to 0 and logs an archived transaction in history.
     */
    @Scheduled(cron = "0 0 0 1 * ?")
    public void executeMonthlyPointsReset() {
        log.info("Executing monthly student points reset scheduler for the 1st of the month at 00:00...");
        try {
            studentService.resetAllActiveStudentsPoints("Har oylik avtomatik reyting yangilanishi: Ballar yangi oy uchun arxivlandi");
            log.info("Monthly student points reset completed successfully.");
        } catch (Exception e) {
            log.error("Failed to execute monthly student points reset: {}", e.getMessage(), e);
        }
    }
}
