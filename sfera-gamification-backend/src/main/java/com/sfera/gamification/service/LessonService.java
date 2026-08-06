package com.sfera.gamification.service;

import com.sfera.gamification.dto.LessonRecordDto;
import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LessonService {

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private LessonRecordRepository lessonRecordRepository;

    @Autowired
    private PointTransactionRepository pointTransactionRepository;

    @Autowired
    private PointRuleRepository pointRuleRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Transactional
    public Lesson saveLessonJournal(Long groupId, LocalDate date, String username, List<LessonRecordDto> records) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new IllegalArgumentException("Group not found"));
        User mentor = userRepository.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));

        Lesson lesson = Lesson.builder()
                .group(group)
                .lessonDate(date)
                .mentor(mentor)
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();
        lesson = lessonRepository.save(lesson);

        // Fetch point rules
        PointRule rulePresent = pointRuleRepository.findByCode("ATTENDANCE_PRESENT").orElse(null);
        PointRule ruleExcused = pointRuleRepository.findByCode("ATTENDANCE_EXCUSED").orElse(null);
        PointRule ruleAbsent = pointRuleRepository.findByCode("ATTENDANCE_ABSENT").orElse(null);
        PointRule ruleHwDone = pointRuleRepository.findByCode("HOMEWORK_DONE").orElse(null);
        PointRule ruleHwNotDone = pointRuleRepository.findByCode("HOMEWORK_NOT_DONE").orElse(null);
        PointRule ruleProject = pointRuleRepository.findByCode("PROJECT").orElse(null);
        PointRule ruleQa = pointRuleRepository.findByCode("QUESTION_ANSWER").orElse(null);
        PointRule ruleActivity = pointRuleRepository.findByCode("ACTIVITY").orElse(null);
        PointRule rulePhone = pointRuleRepository.findByCode("PHONE_GAME").orElse(null);

        for (LessonRecordDto dto : records) {
            Student student = studentRepository.findById(dto.studentId()).orElseThrow(() -> new IllegalArgumentException("Student not found"));

            int studentTotalPoints = 0;
            boolean present = "KELDI".equals(dto.attendanceStatus());

            // 1. Attendance points
            PointRule attRule = null;
            if ("KELDI".equals(dto.attendanceStatus())) {
                attRule = rulePresent;
            } else if ("SABABLI".equals(dto.attendanceStatus())) {
                attRule = ruleExcused;
            } else if ("SABABSIZ".equals(dto.attendanceStatus())) {
                attRule = ruleAbsent;
            }

            if (attRule != null) {
                studentTotalPoints += attRule.getPoints();
                createTransaction(student, lesson, mentor, attRule, attRule.getPoints(), 1, attRule.getName());
            }

            // Only record homework, projects, Q&A, and activity if student was present
            String hwStatus = "NONE";
            int projects = 0;
            boolean hasQa = false;
            boolean hasAct = false;
            boolean hasPhone = false;

            if (present) {
                // Homework
                if ("BAJARDI".equals(dto.homeworkStatus())) {
                    hwStatus = "BAJARDI";
                    studentTotalPoints += ruleHwDone.getPoints();
                    createTransaction(student, lesson, mentor, ruleHwDone, ruleHwDone.getPoints(), 1, ruleHwDone.getName());
                } else if ("BAJARMADI".equals(dto.homeworkStatus())) {
                    hwStatus = "BAJARMADI";
                    studentTotalPoints += ruleHwNotDone.getPoints();
                    createTransaction(student, lesson, mentor, ruleHwNotDone, ruleHwNotDone.getPoints(), 1, ruleHwNotDone.getName());
                } else if ("BERILMAGAN".equals(dto.homeworkStatus())) {
                    // Homework was not assigned — no points added or deducted
                    hwStatus = "BERILMAGAN";
                }

                // Projects
                if (dto.projectCount() != null && dto.projectCount() > 0) {
                    projects = dto.projectCount();
                    int pts = projects * ruleProject.getPoints();
                    studentTotalPoints += pts;
                    createTransaction(student, lesson, mentor, ruleProject, pts, projects, ruleProject.getName() + " x" + projects);
                }

                // Q&A
                if (dto.questionAnswer() != null && dto.questionAnswer()) {
                    hasQa = true;
                    studentTotalPoints += ruleQa.getPoints();
                    createTransaction(student, lesson, mentor, ruleQa, ruleQa.getPoints(), 1, ruleQa.getName());
                }

                // Activity
                if (dto.activity() != null && dto.activity()) {
                    hasAct = true;
                    studentTotalPoints += ruleActivity.getPoints();
                    createTransaction(student, lesson, mentor, ruleActivity, ruleActivity.getPoints(), 1, ruleActivity.getName());
                }

                // Phone penalty
                if (dto.phoneGame() != null && dto.phoneGame()) {
                    hasPhone = true;
                    studentTotalPoints += rulePhone.getPoints();
                    createTransaction(student, lesson, mentor, rulePhone, rulePhone.getPoints(), 1, rulePhone.getName());
                }
            } else {
                // If not present, check phone penalty (just in case)
                if (dto.phoneGame() != null && dto.phoneGame()) {
                    hasPhone = true;
                    studentTotalPoints += rulePhone.getPoints();
                    createTransaction(student, lesson, mentor, rulePhone, rulePhone.getPoints(), 1, rulePhone.getName());
                }
            }

            // Create LessonRecord
            LessonRecord lr = LessonRecord.builder()
                    .lesson(lesson)
                    .student(student)
                    .attendanceStatus(dto.attendanceStatus())
                    .attendanceNote(dto.attendanceNote())
                    .homeworkStatus(hwStatus)
                    .projectCount(projects)
                    .questionAnswer(hasQa)
                    .activity(hasAct)
                    .phoneGame(hasPhone)
                    .calculatedPoints(studentTotalPoints)
                    .createdAt(LocalDateTime.now())
                    .build();
            lessonRecordRepository.save(lr);
        }

        return lesson;
    }

    private void createTransaction(Student student, Lesson lesson, User mentor, PointRule rule, int points, int qty, String desc) {
        PointTransaction t = PointTransaction.builder()
                .student(student)
                .lesson(lesson)
                .mentor(mentor)
                .pointRule(rule)
                .points(points)
                .quantity(qty)
                .description(desc)
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();
        pointTransactionRepository.save(t);
    }
}
