package com.sfera.gamification.service;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.GroupStudentRepository;
import com.sfera.gamification.repository.LessonPlanRepository;
import com.sfera.gamification.repository.UserRepository;
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

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateResponse(String username, String userMessage) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return "Kechirasiz, tizimda AI sozlamalari (API kalit) to'g'ri o'rnatilmagan. Iltimos, admin bilan bog'laning.";
        }

        // 1. Fetch student's course context
        User user = userRepository.findByUsername(username).orElse(null);
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

        // Fallback: if no active course/student lesson plans found, load all lesson plans for general testing
        if (lessonPlans.isEmpty()) {
            lessonPlans = lessonPlanRepository.findAll();
        }

        // 2. Build system instructions
        StringBuilder contextBuilder = new StringBuilder();
        if (lessonPlans.isEmpty()) {
            contextBuilder.append("Hozircha tizimga dars rejalari yoki mavzular kiritilmagan.\n");
        } else {
            for (LessonPlan plan : lessonPlans) {
                contextBuilder.append("- Dars: ").append(plan.getTitle()).append("\n");
                contextBuilder.append("  Tushuntirish/Mavzu: ").append(plan.getContent()).append("\n\n");
            }
        }

        String systemPrompt = "Siz Sfera IT Akademiyasining AI yordamchisiz (Sfera AI). "
                + "Siz faqat va faqat quyidagi dars rejalari va o'tilgan mavzular bo'yicha berilgan savollarga javob berishingiz shart. "
                + "Foydalanuvchi hozir o'qiyotgan kurs: " + courseName + ".\n\n"
                + "O'tiladigan dars mavzulari ro'yxati va mazmuni:\n"
                + contextBuilder.toString()
                + "Muhim qoida:\n"
                + "Agar foydalanuvchi yuqoridagi dars mavzularidan tashqari mavzularda savol bersa, boshqa dasturlash tillari yoki boshqa sohalar haqida so'rasa, xushmuomalalik bilan rad eting va faqat o'tilgan darslar bo'yicha savol berishlarini so'rang (masalan: \"Kechirasiz, men faqat Sfera IT akademiyasida siz o'tayotgan dars rejalari bo'yicha savollarga javob bera olaman.\").\n"
                + "Javobingizni har doim o'zbek tilida, aniq, sodda va tushunarli qilib bering.";

        // 3. Make HTTP request to MegaLLM
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", modelName);

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
}
