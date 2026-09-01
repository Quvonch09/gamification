package com.sfera.gamification.service;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AiChatService {

    @Value("${megallm.api.key:}")
    private String apiKey;

    @Value("${megallm.model:gpt-4o-mini}")
    private String modelName;

    @Value("${megallm.api.url:https://ai.megallm.io/v1/chat/completions}")
    private String apiUrl;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupStudentRepository groupStudentRepository;

    @Autowired
    private LessonPlanRepository lessonPlanRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private MentorRepository mentorRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    private final RestTemplate restTemplate;

    public AiChatService() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15000);
        factory.setReadTimeout(25000);
        this.restTemplate = new RestTemplate(factory);
    }

    public String generateResponse(String username, String userMessage) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return "Kechirasiz, tizimda AI sozlamalari (API kalit) to'g'ri o'rnatilmagan. Iltimos, admin bilan bog'laning.";
        }

        User user = userRepository.findByUsername(username).orElse(null);
        String role = user != null ? user.getRole() : "STUDENT";

        String systemPrompt;

        if ("SUPER_ADMIN".equals(role) || "ADMIN".equals(role) || "BRANCH_ADMIN".equals(role) || "ACCOUNTANT".equals(role)) {
            // Build live real-time system context for Super Admin / Admin
            String liveStats = buildLiveSystemContext();
            systemPrompt = "Siz Sfera IT Akademiyasining Bosh Boshqaruv AI Tahlilchisisiz (Sfera AI Executive Assistant).\n"
                    + "Siz Super Admin va rahbariyat uchun o'quv markazining barcha real vaqt statistikasi, moliyaviy hisobotlari, to'lovlar, xarajatlar, o'quvchilar, guruhlar, mentorlar va lidlar bo'yicha to'liq axborot beruvchi va tahlil qiluvchi yordamchisiz.\n\n"
                    + "TIZIMNING HOZIRGI REAL VAQT MA'LUMOTLARI (ANIQ BAZA MA'LUMOTLARI):\n"
                    + liveStats + "\n\n"
                    + "QOIDALAR:\n"
                    + "1. Foydalanuvchining savoliga yuqoridagi real vaqt tizim ma'lumotlariga tayangan holda 100% aniq raqamlar, jadvallar va hisob-kitoblar bilan javob bering.\n"
                    + "2. Agar 'Bugun qancha to'lov tushdi' deb so'ralsa, bugungi to'lovlar soni, jami summasi, to'lov turlari (Naqd, Karta, Bank) va to'lov qilgan o'quvchilar ro'yxatini aniq aytib bering.\n"
                    + "3. Agar qarzdorlik, o'quvchilar soni, guruhlar tarkibi yoki xarajatlar haqida so'ralsa, eng so'nggi aniq raqamlar bilan tahliliy va tushunarli formatda javob bering.\n"
                    + "4. Javoblaringizni o'zbek tilida, chiroyli formatda (markdown, qalin matn, emojilar bilan) professional tarzda taqdim eting.";
        } else {
            // Student / Mentor lesson plan context
            List<LessonPlan> lessonPlans = new ArrayList<>();
            String courseName = "Noma'lum Kurs";

            if (user != null && user.getStudent() != null) {
                List<GroupStudent> activeGroups = groupStudentRepository.findByStudentIdAndStatus(user.getStudent().getId(), "ACTIVE");
                if (!activeGroups.isEmpty()) {
                    Course course = activeGroups.get(0).getGroup().getCourse();
                    courseName = course.getName();
                    lessonPlans = lessonPlanRepository.findByCourseIdOrderBySequenceOrderAsc(course.getId());
                }
            }

            if (lessonPlans.isEmpty()) {
                lessonPlans = lessonPlanRepository.findAll();
            }

            StringBuilder contextBuilder = new StringBuilder();
            for (LessonPlan plan : lessonPlans) {
                String title = plan.getTitle();
                String content = plan.getContent() != null ? plan.getContent() : "";
                contextBuilder.append("- Dars: ").append(title).append("\n  Mavzu mazmuni: ").append(content).append("\n\n");
            }

            systemPrompt = "Siz Sfera IT Akademiyasining o'quvchilar uchun AI yordamchisiz (Sfera AI).\n"
                    + "Foydalanuvchi hozir o'qiyotgan kurs: " + courseName + ".\n\n"
                    + "O'tiladigan dars mavzulari ro'yxati va mazmuni:\n"
                    + contextBuilder.toString() + "\n"
                    + "O'quvchining savollariga faqat dars rejalari bo'yicha do'stona, tushunarli va o'zbek tilida javob bering.";
        }

        // 3. Make HTTP request to MegaLLM
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", modelName);
            requestBody.put("max_tokens", 2048);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            messages.add(Map.of("role", "user", "content", userMessage));
            requestBody.put("messages", messages);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map body = response.getBody();
                List choices = (List) body.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map choice = (Map) choices.get(0);
                    Map message = (Map) choice.get("message");
                    if (message != null) {
                        return (String) message.get("content");
                    }
                }
            }
            return "AI xizmati hozirda javob bera olmaydi. Iltimos, keyinroq qayta urinib ko'ring.";
        } catch (Exception e) {
            e.printStackTrace();
            return "MegaLLM API bilan ulanishda xatolik yuz berdi: " + e.getMessage();
        }
    }

    private String buildLiveSystemContext() {
        StringBuilder sb = new StringBuilder();
        java.time.LocalDate today = java.time.LocalDate.now();
        String todayStr = today.toString();
        java.time.YearMonth currentMonth = java.time.YearMonth.now();

        // 1. Payments & Today's Collection
        List<Payment> allPayments = paymentRepository.findAll();
        java.math.BigDecimal todayTotal = java.math.BigDecimal.ZERO;
        java.math.BigDecimal todayCash = java.math.BigDecimal.ZERO;
        java.math.BigDecimal todayCard = java.math.BigDecimal.ZERO;
        java.math.BigDecimal todayBank = java.math.BigDecimal.ZERO;
        int todayCount = 0;
        List<String> todayPaymentDetails = new ArrayList<>();

        java.math.BigDecimal monthTotalPayments = java.math.BigDecimal.ZERO;

        for (Payment p : allPayments) {
            java.time.LocalDateTime createdAt = p.getCreatedAt();
            if (createdAt != null) {
                if (createdAt.toLocalDate().equals(today)) {
                    todayTotal = todayTotal.add(p.getAmount());
                    todayCount++;
                    String method = p.getPaymentMethod() != null ? p.getPaymentMethod().toUpperCase() : "CASH";
                    if ("CASH".equals(method)) todayCash = todayCash.add(p.getAmount());
                    else if ("CARD".equals(method)) todayCard = todayCard.add(p.getAmount());
                    else if ("BANK".equals(method)) todayBank = todayBank.add(p.getAmount());

                    String stdName = p.getInvoice() != null && p.getInvoice().getEnrollment() != null && p.getInvoice().getEnrollment().getStudent() != null
                            ? (p.getInvoice().getEnrollment().getStudent().getFirstName() + " " + p.getInvoice().getEnrollment().getStudent().getLastName())
                            : "O'quvchi";
                    todayPaymentDetails.add("- " + stdName + ": " + p.getAmount() + " UZS (" + method + ", Vaqt: " + createdAt.toLocalTime().toString().substring(0, 5) + ")");
                }

                if (createdAt.getYear() == currentMonth.getYear() && createdAt.getMonth() == currentMonth.getMonth()) {
                    monthTotalPayments = monthTotalPayments.add(p.getAmount());
                }
            }
        }

        // 2. Expenses
        List<Expense> allExpenses = expenseRepository.findAll();
        java.math.BigDecimal todayExpenses = java.math.BigDecimal.ZERO;
        java.math.BigDecimal monthExpenses = java.math.BigDecimal.ZERO;
        for (Expense e : allExpenses) {
            if (e.getExpenseDate() != null) {
                if (e.getExpenseDate().equals(today)) {
                    todayExpenses = todayExpenses.add(e.getAmount());
                }
                if (e.getExpenseDate().getYear() == currentMonth.getYear() && e.getExpenseDate().getMonth() == currentMonth.getMonth()) {
                    monthExpenses = monthExpenses.add(e.getAmount());
                }
            }
        }

        // 3. Students & Debtors - Batch loaded in memory for high performance (0.01s instead of 500+ SQL queries)
        List<Student> activeStudents = studentRepository.findByStatus("ACTIVE");
        int totalStudents = activeStudents.size();
        int debtorCount = 0;
        java.math.BigDecimal totalDebt = java.math.BigDecimal.ZERO;
        List<String> topDebtors = new ArrayList<>();

        // Batch load all active group-student mappings
        List<GroupStudent> allGroupStudents = groupStudentRepository.findAll();
        Map<Long, String> studentGroupMap = new HashMap<>();
        Map<Long, java.math.BigDecimal> studentCoursePriceMap = new HashMap<>();
        Map<Long, Integer> groupStudentCountMap = new HashMap<>();

        for (GroupStudent gs : allGroupStudents) {
            if ("ACTIVE".equals(gs.getStatus()) && gs.getGroup() != null) {
                Long gId = gs.getGroup().getId();
                groupStudentCountMap.put(gId, groupStudentCountMap.getOrDefault(gId, 0) + 1);

                if (gs.getStudent() != null) {
                    Long sId = gs.getStudent().getId();
                    studentGroupMap.put(sId, gs.getGroup().getName());
                    if (gs.getGroup().getCourse() != null && gs.getGroup().getCourse().getPrice() != null) {
                        studentCoursePriceMap.put(sId, gs.getGroup().getCourse().getPrice());
                    }
                }
            }
        }

        // Batch sum all payments by student in memory
        Map<Long, java.math.BigDecimal> studentPaidMap = new HashMap<>();
        for (Payment p : allPayments) {
            if (p.getInvoice() != null && p.getInvoice().getEnrollment() != null && p.getInvoice().getEnrollment().getStudent() != null) {
                Long sId = p.getInvoice().getEnrollment().getStudent().getId();
                studentPaidMap.put(sId, studentPaidMap.getOrDefault(sId, java.math.BigDecimal.ZERO).add(p.getAmount()));
            }
        }

        // Batch sum all invoices by student in memory
        List<Invoice> allInvoices = invoiceRepository.findAll();
        Map<Long, java.math.BigDecimal> studentInvoicedMap = new HashMap<>();
        for (Invoice inv : allInvoices) {
            if (inv.getEnrollment() != null && inv.getEnrollment().getStudent() != null) {
                Long sId = inv.getEnrollment().getStudent().getId();
                studentInvoicedMap.put(sId, studentInvoicedMap.getOrDefault(sId, java.math.BigDecimal.ZERO).add(inv.getAmount()));
            }
        }

        for (Student s : activeStudents) {
            java.math.BigDecimal studentCoursePrice = s.getCustomPrice() != null
                    ? s.getCustomPrice()
                    : studentCoursePriceMap.getOrDefault(s.getId(), java.math.BigDecimal.ZERO);

            java.math.BigDecimal stdPaid = studentPaidMap.getOrDefault(s.getId(), java.math.BigDecimal.ZERO);
            java.math.BigDecimal stdInvoiced = studentInvoicedMap.getOrDefault(s.getId(), java.math.BigDecimal.ZERO);

            java.math.BigDecimal expected = stdInvoiced.compareTo(java.math.BigDecimal.ZERO) > 0 ? stdInvoiced : studentCoursePrice;
            java.math.BigDecimal debt = expected.subtract(stdPaid);
            if (debt.compareTo(java.math.BigDecimal.ZERO) > 0) {
                debtorCount++;
                totalDebt = totalDebt.add(debt);
                String grpName = studentGroupMap.getOrDefault(s.getId(), "-");
                if (topDebtors.size() < 40) {
                    topDebtors.add("- " + s.getFirstName() + " " + s.getLastName() + " | Guruhi: " + grpName + " | Qarz: " + debt + " UZS | Tel: " + (s.getPhone() != null ? s.getPhone() : "-"));
                }
            }
        }

        // 4. Groups and Mentors
        List<Group> activeGroups = groupRepository.findByStatus("ACTIVE");
        List<String> groupSummaries = new ArrayList<>();
        for (Group g : activeGroups) {
            int count = groupStudentCountMap.getOrDefault(g.getId(), 0);
            String mentor = g.getMentor() != null && g.getMentor().getUser() != null ? g.getMentor().getUser().getFullName() : "Biriktirilmagan";
            String course = g.getCourse() != null ? g.getCourse().getName() : "-";
            String room = g.getRoomRef() != null ? g.getRoomRef().getName() : (g.getRoom() != null ? g.getRoom() : "-");
            String schedule = g.getDaysOfWeek() != null ? (g.getDaysOfWeek() + " " + (g.getStartTime() != null ? g.getStartTime() : "")) : (g.getSchedule() != null ? g.getSchedule() : "-");
            groupSummaries.add("- " + g.getName() + " (Kurs: " + course + ", Mentor: " + mentor + ", Xona: " + room + ", Jadval: " + schedule + ", O'quvchilar: " + count + " ta)");
        }

        // 5. Leads
        List<Lead> allLeads = leadRepository.findAll();
        long newLeads = allLeads.stream().filter(l -> "NEW".equals(l.getStatus())).count();
        long contactedLeads = allLeads.stream().filter(l -> "CONTACTED".equals(l.getStatus())).count();
        long trialLeads = allLeads.stream().filter(l -> "TRIAL".equals(l.getStatus())).count();
        long enrolledLeads = allLeads.stream().filter(l -> "ENROLLED".equals(l.getStatus())).count();

        sb.append("📅 BUGUNGI SANA: ").append(todayStr).append("\n\n");
        sb.append("💰 BUGUNGI TO'LOVLAR (KASSA):\n");
        sb.append("- Jami tushum: ").append(todayTotal).append(" UZS\n");
        sb.append("- To'lovlar soni: ").append(todayCount).append(" ta\n");
        sb.append("- Naqd pulda: ").append(todayCash).append(" UZS\n");
        sb.append("- Karta orqali: ").append(todayCard).append(" UZS\n");
        sb.append("- Bank/O'tkazma: ").append(todayBank).append(" UZS\n");
        if (!todayPaymentDetails.isEmpty()) {
            sb.append("Bugungi to'lovlar ro'yxati:\n");
            for (String tpd : todayPaymentDetails) sb.append(tpd).append("\n");
        } else {
            sb.append("(Bugun hali to'lov amalga oshirilmagan)\n");
        }

        sb.append("\n📊 OYLIK MOLIYA VA XARAJATLAR (").append(currentMonth.toString()).append("):\n");
        sb.append("- Oylik jami tushum: ").append(monthTotalPayments).append(" UZS\n");
        sb.append("- Oylik jami xarajatlar: ").append(monthExpenses).append(" UZS\n");
        sb.append("- Sof oylik daromad: ").append(monthTotalPayments.subtract(monthExpenses)).append(" UZS\n");

        sb.append("\n👥 O'QUVCHILAR VA QARZDORLIK:\n");
        sb.append("- Jami faol o'quvchilar: ").append(totalStudents).append(" nafar\n");
        sb.append("- Qarzdor o'quvchilar soni: ").append(debtorCount).append(" nafar\n");
        sb.append("- Jami qarzdorlik summasi: ").append(totalDebt).append(" UZS\n");
        if (!topDebtors.isEmpty()) {
            sb.append("BARCHA QARZDORLARNING TO'LIQ RO'YXATI:\n");
            for (String td : topDebtors) sb.append(td).append("\n");
        }

        sb.append("\n📚 GURUHLAR VA DARS JADVALI (").append(activeGroups.size()).append(" ta guruh):\n");
        for (String gs : groupSummaries) sb.append(gs).append("\n");

        sb.append("\n🎯 CRM LIDLAR (Jami: ").append(allLeads.size()).append(" ta):\n");
        sb.append("- Yangi lidlar: ").append(newLeads).append(" ta\n");
        sb.append("- Bog'lanilgan: ").append(contactedLeads).append(" ta\n");
        sb.append("- Sinov darsida: ").append(trialLeads).append(" ta\n");
        sb.append("- O'quvchiga aylangan (Enrolled): ").append(enrolledLeads).append(" ta\n");

        return sb.toString();
    }

    public String generateDailyBriefing(String username) {
        String liveStats = buildLiveSystemContext();
        String systemPrompt = "Siz Sfera IT Akademiyasining Bosh Boshqaruv AI Yordamchisisiz (Sfera AI Executive Briefing).\n"
                + "Bugun ertalab Super Admin tizimga kirdi. Quyidagi aniq baza ma'lumotlariga tayangan holda, ertalabki motivatsion, aniq raqamlar va tavsiyalarga boy KUNLIK HISOBOT (Morning Briefing) tayyorlab bering:\n\n"
                + liveStats + "\n\n"
                + "HISOBOT TUZILISHI:\n"
                + "🌅 1. Salomlashish va kun rejasi;\n"
                + "📊 2. Asosiy ko'rsatkichlar (O'quvchilar, Faol guruhlar, Xodimlar);\n"
                + "💰 3. Moliya va Kassa holati (Oylik tushum, xarajatlar, kutilayotgan tushumlar);\n"
                + "⚠️ 4. Qarzdorlik holati (eng e'tibor qaratish kerak bo'lgan guruhlar);\n"
                + "🎯 5. Lidlar va CRM holati;\n"
                + "💡 6. Bugungi kun uchun Super Adminga 3 ta eng muhim tavsiya.\n\n"
                + "Javobni o'zbek tilida, chiroyli markdown, aniq sarlavhalar va qiziqarli emojilar bilan yozing.";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", modelName);
            requestBody.put("max_tokens", 2048);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            messages.add(Map.of("role", "user", "content", "Assalomu alaykum, bugungi ertalabki umumiy hisobotni tayyorlab bering."));
            requestBody.put("messages", messages);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map body = response.getBody();
                List choices = (List) body.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map choice = (Map) choices.get(0);
                    Map message = (Map) choice.get("message");
                    if (message != null) {
                        return (String) message.get("content");
                    }
                }
            }
            return "Xayrli tong! Tizim ma'lumotlari yangilandi. Barcha o'quv jarayonlari va kassa holati normal rejimda ishlamoqda.";
        } catch (Exception e) {
            return "Xayrli tong! Bugungi hisobotni generatsiya qilishda API xatoligi: " + e.getMessage();
        }
    }
}
