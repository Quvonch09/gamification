package com.sfera.gamification.dto;

public record LoginResponse(String token, String username, String fullName, String role, Long userId) {}
