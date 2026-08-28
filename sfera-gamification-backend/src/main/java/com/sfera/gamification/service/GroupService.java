package com.sfera.gamification.service;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private GroupStudentRepository groupStudentRepository;

    public List<Group> getAllGroups() {
        return groupRepository.findAll();
    }

    public List<Group> getActiveGroups() {
        return groupRepository.findByStatus("ACTIVE");
    }

    public List<Group> getGroupsByMentor(Long mentorId) {
        return groupRepository.findByMentorIdAndStatus(mentorId, "ACTIVE");
    }

    public Group saveGroup(Group group) {
        if (group.getStatus() == null) {
            group.setStatus("ACTIVE");
        }
        if (group.getCreatedAt() == null) {
            group.setCreatedAt(LocalDateTime.now());
        }
        return groupRepository.save(group);
    }

    public Group getGroupById(Long id) {
        return groupRepository.findById(id).orElse(null);
    }

    public void archiveGroup(Long id) {
        groupRepository.findById(id).ifPresent(g -> {
            g.setStatus("ARCHIVED");
            groupRepository.save(g);
        });
    }

    public List<Student> getGroupStudents(Long groupId) {
        return groupStudentRepository.findByGroupIdAndStatus(groupId, "ACTIVE")
                .stream()
                .map(GroupStudent::getStudent)
                .collect(Collectors.toList());
    }

    public GroupStudent enrollStudent(Group group, Student student) {
        // Deactivate old group memberships first
        List<GroupStudent> existing = groupStudentRepository.findByStudentIdAndStatus(student.getId(), "ACTIVE");
        for (GroupStudent gs : existing) {
            gs.setStatus("LEFT");
            gs.setLeftAt(LocalDateTime.now());
            groupStudentRepository.save(gs);
        }

        GroupStudent gs = GroupStudent.builder()
                .group(group)
                .student(student)
                .status("ACTIVE")
                .joinedAt(LocalDateTime.now())
                .build();
        return groupStudentRepository.save(gs);
    }

    // Courses
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Course getCourseById(Long id) {
        return courseRepository.findById(id).orElse(null);
    }

    public Course saveCourse(Course course) {
        if (course.getCreatedAt() == null) {
            course.setCreatedAt(LocalDateTime.now());
        }
        return courseRepository.save(course);
    }

    public void deleteCourse(Long id) {
        courseRepository.deleteById(id);
    }
}
