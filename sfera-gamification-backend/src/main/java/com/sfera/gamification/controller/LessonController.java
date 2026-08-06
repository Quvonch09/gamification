package com.sfera.gamification.controller;

import com.sfera.gamification.dto.LessonRecordDto;
import com.sfera.gamification.entity.Lesson;
import com.sfera.gamification.service.LessonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    @Autowired
    private LessonService lessonService;

    @PostMapping("/save")
    public ResponseEntity<?> saveLesson(@RequestBody Map<String, Object> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        Long groupId = Long.parseLong(request.get("groupId").toString());
        LocalDate date = LocalDate.parse(request.get("date").toString());
        
        // Parse records list
        List<Map<String, Object>> recordsRaw = (List<Map<String, Object>>) request.get("records");
        List<LessonRecordDto> records = recordsRaw.stream().map(m -> new LessonRecordDto(
                Long.parseLong(m.get("studentId").toString()),
                m.get("attendanceStatus").toString(),
                m.get("attendanceNote") != null ? m.get("attendanceNote").toString() : null,
                m.get("homeworkStatus") != null ? m.get("homeworkStatus").toString() : null,
                m.get("projectCount") != null ? Integer.parseInt(m.get("projectCount").toString()) : 0,
                m.get("questionAnswer") != null && Boolean.parseBoolean(m.get("questionAnswer").toString()),
                m.get("activity") != null && Boolean.parseBoolean(m.get("activity").toString()),
                m.get("phoneGame") != null && Boolean.parseBoolean(m.get("phoneGame").toString())
        )).toList();

        Lesson lesson = lessonService.saveLessonJournal(groupId, date, principal.getName(), records);
        return ResponseEntity.ok(lesson);
    }
}

