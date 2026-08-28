package com.sfera.gamification.controller;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.MentorRepository;
import com.sfera.gamification.repository.RoomRepository;
import com.sfera.gamification.repository.UserRepository;
import com.sfera.gamification.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MentorRepository mentorRepository;

    @Autowired
    private RoomRepository roomRepository;

    @GetMapping
    public ResponseEntity<?> getAllGroups(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        List<Group> groups;
        if ("MENTOR".equals(user.getRole())) {
            Mentor mentor = mentorRepository.findByUserId(user.getId()).orElse(null);
            if (mentor == null) {
                groups = new ArrayList<>();
            } else {
                groups = groupService.getGroupsByMentor(mentor.getId());
            }
        } else {
            // Admins, Super Admin, Operators, Cashiers, Accountants see all active groups
            groups = groupService.getActiveGroups();
        }

        List<Map<String, Object>> response = new ArrayList<>();
        for (Group g : groups) {
            response.add(mapGroup(g));
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyGroups(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        List<Group> groups;
        if ("MENTOR".equals(user.getRole())) {
            Mentor mentor = mentorRepository.findByUserId(user.getId()).orElse(null);
            if (mentor == null) {
                groups = new ArrayList<>();
            } else {
                groups = groupService.getGroupsByMentor(mentor.getId());
            }
        } else {
            groups = groupService.getActiveGroups();
        }

        List<Map<String, Object>> response = new ArrayList<>();
        for (Group g : groups) {
            response.add(mapGroup(g));
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getGroupById(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        Group group = groupService.getGroupById(id);
        if (group == null) {
            return ResponseEntity.notFound().build();
        }

        if ("MENTOR".equals(user.getRole())) {
            Mentor mentor = mentorRepository.findByUserId(user.getId()).orElse(null);
            if (mentor == null || group.getMentor() == null || !group.getMentor().getId().equals(mentor.getId())) {
                return ResponseEntity.status(403).body("Access Denied - Not your group");
            }
        }

        return ResponseEntity.ok(mapGroup(group));
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<?> getGroupStudents(@PathVariable Long id) {
        List<Student> students = groupService.getGroupStudents(id);
        List<Map<String, Object>> list = new ArrayList<>();
        for (Student s : students) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("firstName", s.getFirstName());
            map.put("lastName", s.getLastName());
            map.put("fullName", s.getFirstName() + " " + s.getLastName());
            map.put("phone", s.getPhone());
            map.put("parentName", s.getParentName());
            map.put("parentPhone", s.getParentPhone());
            map.put("status", s.getStatus());
            list.add(map);
        }
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> createGroup(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        Object courseIdObj = request.get("courseId");
        Object mentorIdObj = request.get("mentorId");
        Object roomIdObj = request.get("roomId");
        String daysOfWeek = (String) request.get("daysOfWeek");
        String startTime = (String) request.get("startTime");
        String endTime = (String) request.get("endTime");
        String schedule = (String) request.get("schedule");
        Object lessonsPerMonthObj = request.get("lessonsPerMonth");

        if (name == null || courseIdObj == null) {
            return ResponseEntity.badRequest().body("Guruh nomi va kurs majburiy");
        }

        Long mentorId = (mentorIdObj != null && !mentorIdObj.toString().isEmpty()) ? Long.parseLong(mentorIdObj.toString()) : null;
        Long roomId = (roomIdObj != null && !roomIdObj.toString().isEmpty()) ? Long.parseLong(roomIdObj.toString()) : null;

        // Conflict check
        String conflictError = checkScheduleConflict(null, roomId, mentorId, daysOfWeek, startTime, endTime);
        if (conflictError != null) {
            return ResponseEntity.badRequest().body(conflictError);
        }

        Group group = new Group();
        group.setName(name);
        
        Long courseId = Long.parseLong(courseIdObj.toString());
        Course course = groupService.getAllCourses().stream()
                .filter(c -> c.getId().equals(courseId))
                .findFirst().orElse(null);
        if (course == null) {
            return ResponseEntity.badRequest().body("Kurs topilmadi");
        }
        group.setCourse(course);

        if (mentorId != null) {
            Mentor mentor = mentorRepository.findById(mentorId).orElse(null);
            group.setMentor(mentor);
        }

        if (roomId != null) {
            Room room = roomRepository.findById(roomId).orElse(null);
            group.setRoomRef(room);
            if (room != null) {
                group.setRoom(room.getName());
            }
        } else if (request.get("room") != null) {
            group.setRoom((String) request.get("room"));
        }

        group.setDaysOfWeek(daysOfWeek);
        group.setStartTime(startTime);
        group.setEndTime(endTime);
        group.setSchedule(schedule);
        if (lessonsPerMonthObj != null && !lessonsPerMonthObj.toString().isEmpty()) {
            group.setLessonsPerMonth(Integer.parseInt(lessonsPerMonthObj.toString()));
        } else {
            group.setLessonsPerMonth(12);
        }

        group = groupService.saveGroup(group);
        return ResponseEntity.ok(mapGroup(group));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> updateGroup(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Group group = groupService.getGroupById(id);
        if (group == null) {
            return ResponseEntity.notFound().build();
        }

        String name = (String) request.get("name");
        Object courseIdObj = request.get("courseId");
        Object mentorIdObj = request.get("mentorId");
        Object roomIdObj = request.get("roomId");
        String daysOfWeek = (String) request.get("daysOfWeek");
        String startTime = (String) request.get("startTime");
        String endTime = (String) request.get("endTime");
        String schedule = (String) request.get("schedule");
        Object lessonsPerMonthObj = request.get("lessonsPerMonth");

        Long mentorId = (mentorIdObj != null && !mentorIdObj.toString().isEmpty()) ? Long.parseLong(mentorIdObj.toString()) : (group.getMentor() != null ? group.getMentor().getId() : null);
        Long roomId = (roomIdObj != null && !roomIdObj.toString().isEmpty()) ? Long.parseLong(roomIdObj.toString()) : (group.getRoomRef() != null ? group.getRoomRef().getId() : null);
        String effDays = daysOfWeek != null ? daysOfWeek : group.getDaysOfWeek();
        String effStart = startTime != null ? startTime : group.getStartTime();
        String effEnd = endTime != null ? endTime : group.getEndTime();

        // Conflict check
        String conflictError = checkScheduleConflict(id, roomId, mentorId, effDays, effStart, effEnd);
        if (conflictError != null) {
            return ResponseEntity.badRequest().body(conflictError);
        }

        if (name != null) group.setName(name);
        
        if (courseIdObj != null && !courseIdObj.toString().isEmpty()) {
            Long courseId = Long.parseLong(courseIdObj.toString());
            Course course = groupService.getAllCourses().stream()
                    .filter(c -> c.getId().equals(courseId))
                    .findFirst().orElse(null);
            if (course != null) {
                group.setCourse(course);
            }
        }

        if (mentorIdObj != null && !mentorIdObj.toString().isEmpty()) {
            Mentor mentor = mentorRepository.findById(Long.parseLong(mentorIdObj.toString())).orElse(null);
            group.setMentor(mentor);
        } else if (mentorIdObj != null) {
            group.setMentor(null);
        }

        if (roomIdObj != null && !roomIdObj.toString().isEmpty()) {
            Room room = roomRepository.findById(Long.parseLong(roomIdObj.toString())).orElse(null);
            group.setRoomRef(room);
            if (room != null) {
                group.setRoom(room.getName());
            }
        } else if (roomIdObj != null) {
            group.setRoomRef(null);
        }

        if (request.containsKey("room")) {
            group.setRoom((String) request.get("room"));
        }
        if (daysOfWeek != null) group.setDaysOfWeek(daysOfWeek);
        if (startTime != null) group.setStartTime(startTime);
        if (endTime != null) group.setEndTime(endTime);
        if (schedule != null) group.setSchedule(schedule);
        if (lessonsPerMonthObj != null) {
            group.setLessonsPerMonth(Integer.parseInt(lessonsPerMonthObj.toString()));
        }

        group = groupService.saveGroup(group);
        return ResponseEntity.ok(mapGroup(group));
    }

    private String checkScheduleConflict(Long groupId, Long roomId, Long mentorId, String daysOfWeek, String startTime, String endTime) {
        if (startTime == null || endTime == null || daysOfWeek == null) {
            return null;
        }

        int newStart = parseTimeToMinutes(startTime);
        int newEnd = parseTimeToMinutes(endTime);
        if (newEnd <= newStart) {
            return "Dars tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak!";
        }

        List<Group> allGroups = groupService.getAllGroups();

        for (Group g : allGroups) {
            if ("ARCHIVED".equalsIgnoreCase(g.getStatus()) || (groupId != null && g.getId().equals(groupId))) {
                continue;
            }

            if (g.getStartTime() == null || g.getEndTime() == null || g.getDaysOfWeek() == null) {
                continue;
            }

            if (!daysOverlap(daysOfWeek, g.getDaysOfWeek())) {
                continue;
            }

            int gStart = parseTimeToMinutes(g.getStartTime());
            int gEnd = parseTimeToMinutes(g.getEndTime());

            boolean timeOverlaps = newStart < gEnd && newEnd > gStart;
            if (!timeOverlaps) {
                continue;
            }

            if (roomId != null && g.getRoomRef() != null && g.getRoomRef().getId().equals(roomId)) {
                return String.format("XONA BAND: '%s' xonasida ushbu vaqtda (%s - %s) '%s' guruhi dars o'tadi!",
                        g.getRoomRef().getName(), g.getStartTime(), g.getEndTime(), g.getName());
            }

            if (mentorId != null && g.getMentor() != null && g.getMentor().getId().equals(mentorId)) {
                String mentorName = (g.getMentor().getUser() != null) ? g.getMentor().getUser().getFullName() : "Mentor";
                return String.format("USTOZ BAND: %s ushbu vaqtda (%s - %s) '%s' guruhida dars o'tadi!",
                        mentorName, g.getStartTime(), g.getEndTime(), g.getName());
            }
        }
        return null;
    }

    private boolean daysOverlap(String days1, String days2) {
        if (days1 == null || days2 == null) return false;
        String d1 = days1.toUpperCase();
        String d2 = days2.toUpperCase();

        if (d1.equals("HAR_KUNI") || d2.equals("HAR_KUNI")) return true;
        if (d1.equals(d2)) return true;

        boolean d1Toq = d1.contains("DUSHANBA") || d1.contains("CHORSHANBA") || d1.contains("JUMA") || d1.contains("TOQ");
        boolean d2Toq = d2.contains("DUSHANBA") || d2.contains("CHORSHANBA") || d2.contains("JUMA") || d2.contains("TOQ");
        if (d1Toq && d2Toq) return true;

        boolean d1Juft = d1.contains("SESHANBA") || d1.contains("PAYSHANBA") || d1.contains("SHANBA") || d1.contains("JUFT");
        boolean d2Juft = d2.contains("SESHANBA") || d2.contains("PAYSHANBA") || d2.contains("SHANBA") || d2.contains("JUFT");
        if (d1Juft && d2Juft) return true;

        return false;
    }

    private int parseTimeToMinutes(String timeStr) {
        if (timeStr == null) return 0;
        try {
            String[] parts = timeStr.split(":");
            return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
        } catch (Exception e) {
            return 0;
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> deleteGroup(@PathVariable Long id) {
        groupService.archiveGroup(id);
        return ResponseEntity.ok().build();
    }

    private Map<String, Object> mapGroup(Group g) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", g.getId());
        map.put("name", g.getName());
        map.put("status", g.getStatus());
        map.put("createdAt", g.getCreatedAt());
        map.put("daysOfWeek", g.getDaysOfWeek());
        map.put("startTime", g.getStartTime());
        map.put("endTime", g.getEndTime());
        map.put("schedule", g.getSchedule());
        map.put("lessonsPerMonth", g.getLessonsPerMonth() != null ? g.getLessonsPerMonth() : 12);
        
        if (g.getRoomRef() != null) {
            map.put("roomId", g.getRoomRef().getId());
            map.put("roomName", g.getRoomRef().getName());
        } else {
            map.put("roomId", null);
            map.put("roomName", g.getRoom() != null ? g.getRoom() : "Xona biriktirilmagan");
        }

        if (g.getCourse() != null) {
            map.put("courseId", g.getCourse().getId());
            map.put("courseName", g.getCourse().getName());
            map.put("coursePrice", g.getCourse().getPrice());
        }

        if (g.getMentor() != null) {
            map.put("mentorId", g.getMentor().getId());
            map.put("mentorName", g.getMentor().getUser() != null ? g.getMentor().getUser().getFullName() : "Mentor");
            map.put("mentorColor", g.getMentor().getColor() != null ? g.getMentor().getColor() : "#3b82f6");
        } else {
            map.put("mentorId", null);
            map.put("mentorName", "Mentorsiz");
            map.put("mentorColor", "#64748b");
        }
        return map;
    }
}
