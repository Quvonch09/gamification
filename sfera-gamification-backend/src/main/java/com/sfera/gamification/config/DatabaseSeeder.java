package com.sfera.gamification.config;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MentorRepository mentorRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupStudentRepository groupStudentRepository;

    @Autowired
    private PointRuleRepository pointRuleRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private LessonRecordRepository lessonRecordRepository;

    @Autowired
    private PointTransactionRepository pointTransactionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Migration: ensure all existing students have a User account
        for (Student s : studentRepository.findAll()) {
            if (!userRepository.existsByStudentId(s.getId())) {
                String genUsername = (s.getFirstName().replaceAll("[^a-zA-Z0-9]", "").toLowerCase() + "_" + s.getLastName().replaceAll("[^a-zA-Z0-9]", "").toLowerCase());
                if (userRepository.findByUsername(genUsername).isPresent()) {
                    genUsername += (int)(Math.random() * 100);
                }
                User studentUser = User.builder()
                        .fullName(s.getFirstName() + " " + s.getLastName())
                        .username(genUsername)
                        .password(passwordEncoder.encode("student123"))
                        .role("STUDENT")
                        .student(s)
                        .createdAt(LocalDateTime.now())
                        .build();
                userRepository.save(studentUser);
            }
        }

        if (userRepository.count() > 0) {
            // Ensure INITIAL_POINTS rule exists
            if (pointRuleRepository.findByCode("INITIAL_POINTS").isEmpty()) {
                PointRule initialPoints = PointRule.builder().code("INITIAL_POINTS").name("Tizimdan oldingi yig'ilgan ballar").points(0).type("POSITIVE").active(true).build();
                pointRuleRepository.save(initialPoints);
            }
            // Ensure limited admin exists
            if (userRepository.findByUsername("admin_limited").isEmpty()) {
                User adminLimited = User.builder()
                        .username("admin_limited")
                        .password(passwordEncoder.encode("admin123"))
                        .fullName("Sfera Limited Admin")
                        .role("ADMIN")
                        .createdAt(LocalDateTime.now())
                        .build();
                userRepository.save(adminLimited);
            }
            // FORCE upgrade: ensure 'admin' user always has SUPER_ADMIN role
            // (old DB may have stored it as ADMIN before the role rename)
            userRepository.findByUsername("admin").ifPresent(existingAdmin -> {
                if (!"SUPER_ADMIN".equals(existingAdmin.getRole())) {
                    existingAdmin.setRole("SUPER_ADMIN");
                    userRepository.save(existingAdmin);
                }
            });
            return; // Database already seeded
        }

        // 1. Seed Point Rules
        PointRule present = PointRule.builder().code("ATTENDANCE_PRESENT").name("Darsga keldi").points(3).type("POSITIVE").active(true).build();
        PointRule excused = PointRule.builder().code("ATTENDANCE_EXCUSED").name("Sababli darsga kelmadi").points(-5).type("NEGATIVE").active(true).build();
        PointRule absent = PointRule.builder().code("ATTENDANCE_ABSENT").name("Sababsiz darsga kelmadi").points(-10).type("NEGATIVE").active(true).build();
        PointRule hwDone = PointRule.builder().code("HOMEWORK_DONE").name("Uyga vazifa bajarildi").points(10).type("POSITIVE").active(true).build();
        PointRule hwNotDone = PointRule.builder().code("HOMEWORK_NOT_DONE").name("Uyga vazifa bajarilmadi").points(-10).type("NEGATIVE").active(true).build();
        PointRule project = PointRule.builder().code("PROJECT").name("Darsdan tashqari loyiha").points(15).type("POSITIVE").active(true).build();
        PointRule qa = PointRule.builder().code("QUESTION_ANSWER").name("Savol-javob").points(7).type("POSITIVE").active(true).build();
        PointRule activity = PointRule.builder().code("ACTIVITY").name("Aktivlik").points(5).type("POSITIVE").active(true).build();
        PointRule phone = PointRule.builder().code("PHONE_GAME").name("Markaz ichida telefon yoki o'yin o'ynadi").points(-25).type("NEGATIVE").active(true).build();
        PointRule initialPoints = PointRule.builder().code("INITIAL_POINTS").name("Tizimdan oldingi yig'ilgan ballar").points(0).type("POSITIVE").active(true).build();

        pointRuleRepository.saveAll(Arrays.asList(present, excused, absent, hwDone, hwNotDone, project, qa, activity, phone, initialPoints));

        // 2. Seed Users
        User admin = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .fullName("Sfera Super Admin")
                .role("SUPER_ADMIN")
                .createdAt(LocalDateTime.now())
                .build();

        User adminLimited = User.builder()
                .username("admin_limited")
                .password(passwordEncoder.encode("admin123"))
                .fullName("Sfera Limited Admin")
                .role("ADMIN")
                .createdAt(LocalDateTime.now())
                .build();

        User userQuvonchbek = User.builder()
                .username("quvonchbek")
                .password(passwordEncoder.encode("mentor123"))
                .fullName("Quvonchbek Mentor")
                .role("MENTOR")
                .createdAt(LocalDateTime.now())
                .build();

        User userMuhammad = User.builder()
                .username("muhammad")
                .password(passwordEncoder.encode("mentor123"))
                .fullName("Muhammad Mentor")
                .role("MENTOR")
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.saveAll(Arrays.asList(admin, adminLimited, userQuvonchbek, userMuhammad));

        // 3. Seed Mentors
        Mentor mentorQuvonchbek = Mentor.builder().user(userQuvonchbek).createdAt(LocalDateTime.now()).build();
        Mentor mentorMuhammad = Mentor.builder().user(userMuhammad).createdAt(LocalDateTime.now()).build();
        mentorRepository.saveAll(Arrays.asList(mentorQuvonchbek, mentorMuhammad));

        // 4. Seed Courses
        Course foundationCourse = Course.builder().name("FOUNDATION").createdAt(LocalDateTime.now()).build();
        Course javaCourse = Course.builder().name("JAVA").createdAt(LocalDateTime.now()).build();
        Course pythonCourse = Course.builder().name("PYTHON").createdAt(LocalDateTime.now()).build();
        courseRepository.saveAll(Arrays.asList(foundationCourse, javaCourse, pythonCourse));

        // 5. Seed Groups
        Group javaGroup = Group.builder().name("JAVA 18:00").course(javaCourse).mentor(mentorQuvonchbek).status("ACTIVE").createdAt(LocalDateTime.now()).build();
        Group pythonGroup = Group.builder().name("PYTHON 15:00").course(pythonCourse).mentor(mentorMuhammad).status("ACTIVE").createdAt(LocalDateTime.now()).build();
        Group foundationGroup = Group.builder().name("FOUNDATION 17:00").course(foundationCourse).mentor(mentorQuvonchbek).status("ACTIVE").createdAt(LocalDateTime.now()).build();
        groupRepository.saveAll(Arrays.asList(javaGroup, pythonGroup, foundationGroup));

        // 6. Seed Students
        Student studentBekzod = Student.builder().firstName("Bekzod").lastName("Nuriddinov").status("ACTIVE").createdAt(LocalDateTime.now()).build();
        Student studentFayoza = Student.builder().firstName("Fayoza").lastName("Sirojova").status("ACTIVE").createdAt(LocalDateTime.now()).build();
        Student studentXurshid = Student.builder().firstName("Xurshid").lastName("Tolibjonov").status("ACTIVE").createdAt(LocalDateTime.now()).build();
        studentRepository.saveAll(Arrays.asList(studentBekzod, studentFayoza, studentXurshid));

        // 7. Seed GroupStudent memberships
        GroupStudent gsBekzod = GroupStudent.builder().group(javaGroup).student(studentBekzod).status("ACTIVE").joinedAt(LocalDateTime.now()).build();
        GroupStudent gsFayoza = GroupStudent.builder().group(javaGroup).student(studentFayoza).status("ACTIVE").joinedAt(LocalDateTime.now()).build();
        GroupStudent gsXurshid = GroupStudent.builder().group(javaGroup).student(studentXurshid).status("ACTIVE").joinedAt(LocalDateTime.now()).build();
        groupStudentRepository.saveAll(Arrays.asList(gsBekzod, gsFayoza, gsXurshid));

        // 8. Seed Student History (from TXT file data)
        // Bekzod: 3, 10, 3, 10 (Total: 26)
        // Fayoza: 3, 10, 3, 10, 30 (Total: 56)
        // Xurshid: 3, 10, 3, 10, 60 (Total: 86)
        
        // Let's record Lesson 1: 2026-07-09
        Lesson lesson1 = Lesson.builder()
                .group(javaGroup)
                .lessonDate(LocalDate.of(2026, 7, 9))
                .mentor(userQuvonchbek)
                .status("ACTIVE")
                .createdAt(LocalDateTime.now().minusDays(2))
                .build();
        lessonRepository.save(lesson1);

        // Lesson 1 records & transactions
        // Bekzod: Present (+3), Homework Done (+10) -> calculated_points = 13
        LessonRecord lrBekzod1 = LessonRecord.builder().lesson(lesson1).student(studentBekzod).attendanceStatus("KELDI").homeworkStatus("BAJARDI").projectCount(0).questionAnswer(false).activity(false).phoneGame(false).calculatedPoints(13).createdAt(LocalDateTime.now().minusDays(2)).build();
        // Fayoza: Present (+3), Homework Done (+10) -> 13
        LessonRecord lrFayoza1 = LessonRecord.builder().lesson(lesson1).student(studentFayoza).attendanceStatus("KELDI").homeworkStatus("BAJARDI").projectCount(0).questionAnswer(false).activity(false).phoneGame(false).calculatedPoints(13).createdAt(LocalDateTime.now().minusDays(2)).build();
        // Xurshid: Present (+3), Homework Done (+10) -> 13
        LessonRecord lrXurshid1 = LessonRecord.builder().lesson(lesson1).student(studentXurshid).attendanceStatus("KELDI").homeworkStatus("BAJARDI").projectCount(0).questionAnswer(false).activity(false).phoneGame(false).calculatedPoints(13).createdAt(LocalDateTime.now().minusDays(2)).build();
        lessonRecordRepository.saveAll(Arrays.asList(lrBekzod1, lrFayoza1, lrXurshid1));

        // Save Point Transactions for Lesson 1
        createTransaction(studentBekzod, lesson1, userQuvonchbek, present, 3, 1, "Darsga keldi");
        createTransaction(studentBekzod, lesson1, userQuvonchbek, hwDone, 10, 1, "Uyga vazifa bajarildi");

        createTransaction(studentFayoza, lesson1, userQuvonchbek, present, 3, 1, "Darsga keldi");
        createTransaction(studentFayoza, lesson1, userQuvonchbek, hwDone, 10, 1, "Uyga vazifa bajarildi");

        createTransaction(studentXurshid, lesson1, userQuvonchbek, present, 3, 1, "Darsga keldi");
        createTransaction(studentXurshid, lesson1, userQuvonchbek, hwDone, 10, 1, "Uyga vazifa bajarildi");

        // Let's record Lesson 2: 2026-07-10
        Lesson lesson2 = Lesson.builder()
                .group(javaGroup)
                .lessonDate(LocalDate.of(2026, 7, 10))
                .mentor(userQuvonchbek)
                .status("ACTIVE")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();
        lessonRepository.save(lesson2);

        // Lesson 2 records & transactions
        // Bekzod: Present (+3), Homework Done (+10) -> calculated_points = 13
        LessonRecord lrBekzod2 = LessonRecord.builder().lesson(lesson2).student(studentBekzod).attendanceStatus("KELDI").homeworkStatus("BAJARDI").projectCount(0).questionAnswer(false).activity(false).phoneGame(false).calculatedPoints(13).createdAt(LocalDateTime.now().minusDays(1)).build();
        // Fayoza: Present (+3), Homework Done (+10), 2 Projects (+30) -> calculated_points = 43
        LessonRecord lrFayoza2 = LessonRecord.builder().lesson(lesson2).student(studentFayoza).attendanceStatus("KELDI").homeworkStatus("BAJARDI").projectCount(2).questionAnswer(false).activity(false).phoneGame(false).calculatedPoints(43).createdAt(LocalDateTime.now().minusDays(1)).build();
        // Xurshid: Present (+3), Homework Done (+10), 4 Projects (+60) -> calculated_points = 73
        LessonRecord lrXurshid2 = LessonRecord.builder().lesson(lesson2).student(studentXurshid).attendanceStatus("KELDI").homeworkStatus("BAJARDI").projectCount(4).questionAnswer(false).activity(false).phoneGame(false).calculatedPoints(73).createdAt(LocalDateTime.now().minusDays(1)).build();
        lessonRecordRepository.saveAll(Arrays.asList(lrBekzod2, lrFayoza2, lrXurshid2));

        // Save Point Transactions for Lesson 2
        createTransaction(studentBekzod, lesson2, userQuvonchbek, present, 3, 1, "Darsga keldi");
        createTransaction(studentBekzod, lesson2, userQuvonchbek, hwDone, 10, 1, "Uyga vazifa bajarildi");

        createTransaction(studentFayoza, lesson2, userQuvonchbek, present, 3, 1, "Darsga keldi");
        createTransaction(studentFayoza, lesson2, userQuvonchbek, hwDone, 10, 1, "Uyga vazifa bajarildi");
        createTransaction(studentFayoza, lesson2, userQuvonchbek, project, 30, 2, "Darsdan tashqari loyiha x2");

        createTransaction(studentXurshid, lesson2, userQuvonchbek, present, 3, 1, "Darsga keldi");
        createTransaction(studentXurshid, lesson2, userQuvonchbek, hwDone, 10, 1, "Uyga vazifa bajarildi");
        createTransaction(studentXurshid, lesson2, userQuvonchbek, project, 60, 4, "Darsdan tashqari loyiha x4");
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
                .createdAt(lesson.getCreatedAt())
                .build();
        pointTransactionRepository.save(t);
    }
}
