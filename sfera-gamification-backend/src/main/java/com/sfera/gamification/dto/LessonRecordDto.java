package com.sfera.gamification.dto;

public record LessonRecordDto(
    Long studentId,
    String attendanceStatus,
    String attendanceNote,
    String homeworkStatus,
    Integer projectCount,
    Boolean questionAnswer,
    Boolean activity,
    Boolean phoneGame
) {}

