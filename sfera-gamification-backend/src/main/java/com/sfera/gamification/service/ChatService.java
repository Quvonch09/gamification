package com.sfera.gamification.service;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private ChatParticipantRepository chatParticipantRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupStudentRepository groupStudentRepository;

    @Autowired
    private MentorRepository mentorRepository;

    @Autowired
    private NotificationService notificationService;

    // Get rooms for a specific user
    @Transactional
    public List<Map<String, Object>> getUserChatRooms(User user) {
        if (user == null) return Collections.emptyList();
        
        // Also auto-sync student academic group chat if not created yet
        autoSyncAcademicGroupChat(user);

        List<ChatRoom> rooms = chatRoomRepository.findRoomsByUserId(user.getId());
        List<Map<String, Object>> result = new ArrayList<>();

        for (ChatRoom room : rooms) {
            result.add(formatChatRoom(room, user));
        }
        return result;
    }

    // Admin Monitoring: Get ALL rooms in system
    @Transactional
    public List<Map<String, Object>> getAllChatRoomsForAdmin() {
        List<ChatRoom> rooms = chatRoomRepository.findAllRoomsForAdmin();
        List<Map<String, Object>> result = new ArrayList<>();

        for (ChatRoom room : rooms) {
            result.add(formatChatRoom(room, null));
        }
        return result;
    }

    // Auto-create/join academic group chat if student/mentor belongs to group
    private void autoSyncAcademicGroupChat(User user) {
        if (user.getStudent() != null) {
            List<GroupStudent> list = groupStudentRepository.findByStudentIdAndStatus(user.getStudent().getId(), "ACTIVE");
            for (GroupStudent gs : list) {
                if (gs.getGroup() != null) {
                    getOrCreateAcademicGroupChat(gs.getGroup());
                    ensureUserInRoom(gs.getGroup(), user);
                }
            }
        } else if ("MENTOR".equals(user.getRole())) {
            Mentor mentor = mentorRepository.findByUserId(user.getId()).orElse(null);
            if (mentor != null) {
                List<Group> mentorGroups = groupRepository.findByMentorId(mentor.getId());
                for (Group g : mentorGroups) {
                    getOrCreateAcademicGroupChat(g);
                    ensureUserInRoom(g, user);
                }
            }
        }
    }

    private synchronized ChatRoom getOrCreateAcademicGroupChat(Group g) {
        return chatRoomRepository.findByAcademicGroupId(g.getId()).orElseGet(() -> {
            ChatRoom room = ChatRoom.builder()
                    .type("GROUP")
                    .title("Guruh: " + g.getName())
                    .academicGroupId(g.getId())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            final ChatRoom savedRoom = chatRoomRepository.save(room);

            // Add mentor if available
            if (g.getMentor() != null && g.getMentor().getUser() != null) {
                ChatParticipant p = ChatParticipant.builder()
                        .chatRoom(savedRoom)
                        .user(g.getMentor().getUser())
                        .role("ADMIN")
                        .joinedAt(LocalDateTime.now())
                        .build();
                chatParticipantRepository.save(p);
            }

            // Add active students
            List<GroupStudent> gsList = groupStudentRepository.findByGroupIdAndStatus(g.getId(), "ACTIVE");
            for (GroupStudent gs : gsList) {
                if (gs.getStudent() != null) {
                    User stdUser = userRepository.findByStudentId(gs.getStudent().getId()).orElse(null);
                    if (stdUser != null && !chatParticipantRepository.existsByChatRoomIdAndUserId(savedRoom.getId(), stdUser.getId())) {
                        ChatParticipant p = ChatParticipant.builder()
                                .chatRoom(savedRoom)
                                .user(stdUser)
                                .role("MEMBER")
                                .joinedAt(LocalDateTime.now())
                                .build();
                        chatParticipantRepository.save(p);
                    }
                }
            }
            return savedRoom;
        });
    }

    private void ensureUserInRoom(Group g, User u) {
        chatRoomRepository.findByAcademicGroupId(g.getId()).ifPresent(room -> {
            if (!chatParticipantRepository.existsByChatRoomIdAndUserId(room.getId(), u.getId())) {
                ChatParticipant p = ChatParticipant.builder()
                        .chatRoom(room)
                        .user(u)
                        .role("MEMBER")
                        .joinedAt(LocalDateTime.now())
                        .build();
                chatParticipantRepository.save(p);
            }
        });
    }

    // Get or Create 1-on-1 Direct Chat
    @Transactional
    public Map<String, Object> getOrCreateDirectChat(User currentUser, Long targetUserId) {
        if (currentUser.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("O'zingiz bilan chat ocholmaysiz");
        }
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Foydalanuvchi topilmadi"));

        List<ChatRoom> existing = chatRoomRepository.findDirectChatBetweenUsers(currentUser.getId(), targetUserId);
        ChatRoom room;
        if (!existing.isEmpty()) {
            room = existing.get(0);
        } else {
            room = ChatRoom.builder()
                    .type("DIRECT")
                    .createdBy(currentUser)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            room = chatRoomRepository.save(room);

            ChatParticipant p1 = ChatParticipant.builder()
                    .chatRoom(room)
                    .user(currentUser)
                    .role("MEMBER")
                    .joinedAt(LocalDateTime.now())
                    .build();

            ChatParticipant p2 = ChatParticipant.builder()
                    .chatRoom(room)
                    .user(targetUser)
                    .role("MEMBER")
                    .joinedAt(LocalDateTime.now())
                    .build();

            chatParticipantRepository.saveAll(List.of(p1, p2));
        }

        return formatChatRoom(room, currentUser);
    }

    // Create Custom Group Chat
    @Transactional
    public Map<String, Object> createGroupChat(User creator, String title, List<Long> participantUserIds, Long academicGroupId) {
        if (title == null || title.trim().isEmpty()) {
            title = "Yangi Guruh";
        }
        ChatRoom room = ChatRoom.builder()
                .type("GROUP")
                .title(title.trim())
                .academicGroupId(academicGroupId)
                .createdBy(creator)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        final ChatRoom savedRoom = chatRoomRepository.save(room);

        Set<Long> uniqueIds = new HashSet<>(participantUserIds != null ? participantUserIds : Collections.emptyList());
        uniqueIds.add(creator.getId());

        List<ChatParticipant> participants = new ArrayList<>();
        for (Long uid : uniqueIds) {
            userRepository.findById(uid).ifPresent(u -> {
                participants.add(ChatParticipant.builder()
                        .chatRoom(savedRoom)
                        .user(u)
                        .role(u.getId().equals(creator.getId()) ? "ADMIN" : "MEMBER")
                        .joinedAt(LocalDateTime.now())
                        .build());
            });
        }
        chatParticipantRepository.saveAll(participants);

        return formatChatRoom(savedRoom, creator);
    }

    // Send Message
    @Transactional
    public Map<String, Object> sendMessage(Long roomId, User sender, String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Xabar matni bo'sh bo'lishi mumkin emas");
        }
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Chat xonasi topilmadi"));

        boolean isAdmin = "SUPER_ADMIN".equals(sender.getRole()) || "ADMIN".equals(sender.getRole()) || "BRANCH_ADMIN".equals(sender.getRole());
        boolean isParticipant = chatParticipantRepository.existsByChatRoomIdAndUserId(roomId, sender.getId());

        if (!isParticipant && !isAdmin) {
            throw new IllegalArgumentException("Siz ushbu chat a'zosi emassiz");
        }

        // If admin is sending message in a chat they were not yet in, auto-add as admin observer
        if (!isParticipant && isAdmin) {
            ChatParticipant adminPart = ChatParticipant.builder()
                    .chatRoom(room)
                    .user(sender)
                    .role("ADMIN")
                    .joinedAt(LocalDateTime.now())
                    .build();
            chatParticipantRepository.save(adminPart);
        }

        ChatMessage msg = ChatMessage.builder()
                .chatRoom(room)
                .sender(sender)
                .content(content.trim())
                .createdAt(LocalDateTime.now())
                .build();
        msg = chatMessageRepository.save(msg);

        room.setUpdatedAt(LocalDateTime.now());
        chatRoomRepository.save(room);

        // Update sender's lastReadAt
        chatParticipantRepository.findByChatRoomIdAndUserId(roomId, sender.getId()).ifPresent(p -> {
            p.setLastReadAt(LocalDateTime.now());
            chatParticipantRepository.save(p);
        });

        // Notify other participants
        List<ChatParticipant> participants = chatParticipantRepository.findByChatRoomId(roomId);
        String roomTitleForNotif = "GROUP".equals(room.getType()) ? room.getTitle() : null;

        for (ChatParticipant p : participants) {
            if (!p.getUser().getId().equals(sender.getId())) {
                notificationService.notifyChatMessage(sender, p.getUser(), roomTitleForNotif, content, roomId);
            }
        }

        Map<String, Object> map = new HashMap<>();
        map.put("id", msg.getId());
        map.put("chatRoomId", room.getId());
        map.put("senderId", sender.getId());
        map.put("senderName", sender.getFullName());
        map.put("senderRole", sender.getRole());
        map.put("senderAvatar", sender.getAvatarUrl());
        map.put("content", msg.getContent());
        map.put("createdAt", msg.getCreatedAt().toString());
        return map;
    }

    // Get Messages in Room
    @Transactional
    public List<Map<String, Object>> getMessages(Long roomId, User requester) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Chat xonasi topilmadi"));

        boolean isAdmin = "SUPER_ADMIN".equals(requester.getRole()) || "ADMIN".equals(requester.getRole()) || "BRANCH_ADMIN".equals(requester.getRole());
        boolean isParticipant = chatParticipantRepository.existsByChatRoomIdAndUserId(roomId, requester.getId());

        if (!isParticipant && !isAdmin) {
            throw new IllegalArgumentException("Ruxsat berilmagan");
        }

        // Update lastReadAt for requester if participant
        chatParticipantRepository.findByChatRoomIdAndUserId(roomId, requester.getId()).ifPresent(p -> {
            p.setLastReadAt(LocalDateTime.now());
            chatParticipantRepository.save(p);
        });

        List<ChatMessage> list = chatMessageRepository.findByChatRoomIdOrderByCreatedAtAsc(roomId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (ChatMessage m : list) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("chatRoomId", roomId);
            map.put("senderId", m.getSender().getId());
            map.put("senderName", m.getSender().getFullName());
            map.put("senderRole", m.getSender().getRole());
            map.put("senderAvatar", m.getSender().getAvatarUrl());
            map.put("content", m.getContent());
            map.put("createdAt", m.getCreatedAt().toString());
            result.add(map);
        }
        return result;
    }

    // Format chat room map
    private Map<String, Object> formatChatRoom(ChatRoom room, User currentUser) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", room.getId());
        map.put("type", room.getType());
        map.put("academicGroupId", room.getAcademicGroupId());
        map.put("createdAt", room.getCreatedAt() != null ? room.getCreatedAt().toString() : null);
        map.put("updatedAt", room.getUpdatedAt() != null ? room.getUpdatedAt().toString() : null);

        List<ChatParticipant> participants = chatParticipantRepository.findByChatRoomId(room.getId());
        List<Map<String, Object>> partList = new ArrayList<>();
        User otherDirectUser = null;

        for (ChatParticipant p : participants) {
            Map<String, Object> pm = new HashMap<>();
            pm.put("id", p.getUser().getId());
            pm.put("fullName", p.getUser().getFullName());
            pm.put("username", p.getUser().getUsername());
            pm.put("role", p.getUser().getRole());
            pm.put("avatarUrl", p.getUser().getAvatarUrl());
            pm.put("participantRole", p.getRole());
            partList.add(pm);

            if ("DIRECT".equals(room.getType()) && currentUser != null && !p.getUser().getId().equals(currentUser.getId())) {
                otherDirectUser = p.getUser();
            }
        }
        map.put("participants", partList);

        // Display title calculation
        if ("DIRECT".equals(room.getType())) {
            if (otherDirectUser != null) {
                map.put("title", otherDirectUser.getFullName());
                map.put("subtitle", otherDirectUser.getRole());
                map.put("avatarUrl", otherDirectUser.getAvatarUrl());
                map.put("otherUserId", otherDirectUser.getId());
            } else if (!partList.isEmpty()) {
                map.put("title", partList.get(0).get("fullName"));
                map.put("subtitle", partList.get(0).get("role"));
                map.put("avatarUrl", partList.get(0).get("avatarUrl"));
                map.put("otherUserId", partList.get(0).get("id"));
            } else {
                map.put("title", "Shaxsiy Chat");
            }
        } else {
            map.put("title", room.getTitle() != null ? room.getTitle() : "Guruh Chati");
            map.put("subtitle", partList.size() + " ta a'zo");
        }

        // Last message
        ChatMessage lastMsg = chatMessageRepository.findTopByChatRoomIdOrderByCreatedAtDesc(room.getId()).orElse(null);
        if (lastMsg != null) {
            Map<String, Object> lm = new HashMap<>();
            lm.put("id", lastMsg.getId());
            lm.put("senderName", lastMsg.getSender().getFullName());
            lm.put("senderId", lastMsg.getSender().getId());
            lm.put("content", lastMsg.getContent());
            lm.put("createdAt", lastMsg.getCreatedAt().toString());
            map.put("lastMessage", lm);
        } else {
            map.put("lastMessage", null);
        }

        // Unread count for current user
        if (currentUser != null) {
            ChatParticipant cp = participants.stream()
                    .filter(p -> p.getUser().getId().equals(currentUser.getId()))
                    .findFirst().orElse(null);
            LocalDateTime lastRead = (cp != null && cp.getLastReadAt() != null) ? cp.getLastReadAt() : LocalDateTime.of(2000, 1, 1, 0, 0);
            long unread = chatMessageRepository.countUnreadMessages(room.getId(), lastRead, currentUser.getId());
            map.put("unreadCount", unread);
        } else {
            map.put("unreadCount", 0L);
        }

        return map;
    }

    // Get Available Contacts for Starting Chat
    @Transactional(readOnly = true)
    public Map<String, Object> getAvailableContacts(User currentUser) {
        List<User> allUsers = userRepository.findAll();
        
        List<Map<String, Object>> students = new ArrayList<>();
        List<Map<String, Object>> mentors = new ArrayList<>();
        List<Map<String, Object>> admins = new ArrayList<>();

        for (User u : allUsers) {
            if (u.getId().equals(currentUser.getId())) continue;

            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("fullName", u.getFullName());
            m.put("username", u.getUsername());
            m.put("role", u.getRole());
            m.put("avatarUrl", u.getAvatarUrl());

            if ("STUDENT".equals(u.getRole())) {
                if (u.getStudent() != null) {
                    m.put("phone", u.getStudent().getPhone());
                    List<GroupStudent> gs = groupStudentRepository.findByStudentIdAndStatus(u.getStudent().getId(), "ACTIVE");
                    if (!gs.isEmpty()) {
                        m.put("groupName", gs.get(0).getGroup().getName());
                    }
                }
                students.add(m);
            } else if ("MENTOR".equals(u.getRole())) {
                mentors.add(m);
            } else if ("SUPER_ADMIN".equals(u.getRole()) || "ADMIN".equals(u.getRole()) || "BRANCH_ADMIN".equals(u.getRole())) {
                admins.add(m);
            }
        }

        Map<String, Object> res = new HashMap<>();
        res.put("students", students);
        res.put("mentors", mentors);
        res.put("admins", admins);

        return res;
    }
}
