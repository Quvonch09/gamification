package com.sfera.gamification.service;

import com.sfera.gamification.entity.*;
import com.sfera.gamification.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<Notification> getNotificationsForUser(User user) {
        if (user == null) return List.of();
        return notificationRepository.findForUser(user.getRole(), user.getId());
    }

    public long getUnreadCount(User user) {
        if (user == null) return 0;
        return notificationRepository.countUnreadForUser(user.getRole(), user.getId());
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(User user) {
        if (user == null) return;
        List<Notification> list = notificationRepository.findForUser(user.getRole(), user.getId());
        for (Notification n : list) {
            if (Boolean.FALSE.equals(n.getRead())) {
                n.setRead(true);
            }
        }
        notificationRepository.saveAll(list);
    }

    @Transactional
    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }

    @Transactional
    public Notification notifyPaymentReceived(Payment payment, User cashier, Student student, String groupName) {
        String cashierName = cashier != null ? cashier.getFullName() : "Kassa";
        String stdName = student != null ? student.getFirstName() + " " + student.getLastName() : "O'quvchi";
        String amountFormatted = payment.getAmount() != null ? String.format("%,d", payment.getAmount().longValue()) : "0";

        String title = "💰 Yangi To'lov: " + amountFormatted + " UZS";
        String message = String.format("O'quvchi: %s (%s). Summa: %s UZS. To'lov turi: %s. Qabul qildi: %s.",
                stdName, groupName != null ? groupName : "Noma'lum guruh", amountFormatted, payment.getPaymentMethod(), cashierName);

        // Send to SUPER_ADMIN
        Notification nSuper = Notification.builder()
                .title(title)
                .message(message)
                .type("PAYMENT")
                .targetRole("SUPER_ADMIN")
                .read(false)
                .createdAt(LocalDateTime.now())
                .metadataJson(String.format("{\"paymentId\":%d,\"amount\":\"%s\",\"studentName\":\"%s\"}",
                        payment.getId(), amountFormatted, stdName))
                .build();
        notificationRepository.save(nSuper);

        // Send to ACCOUNTANT
        Notification nAcc = Notification.builder()
                .title(title)
                .message(message)
                .type("PAYMENT")
                .targetRole("ACCOUNTANT")
                .read(false)
                .createdAt(LocalDateTime.now())
                .metadataJson(String.format("{\"paymentId\":%d,\"amount\":\"%s\",\"studentName\":\"%s\"}",
                        payment.getId(), amountFormatted, stdName))
                .build();
        return notificationRepository.save(nAcc);
    }

    @Transactional
    public Notification notifyAbsentStudent(Student student, Group group, String attendanceStatus, String note) {
        String stdName = student != null ? student.getFirstName() + " " + student.getLastName() : "O'quvchi";
        String grpName = group != null ? group.getName() : "Guruh";
        String phone = student != null && student.getPhone() != null ? student.getPhone() : "";
        String parentPhone = student != null && student.getParentPhone() != null ? student.getParentPhone() : "";
        String contact = !parentPhone.isEmpty() ? parentPhone : phone;

        String title = "📞 Darsga Kelmadi: " + stdName;
        String message = String.format("O'quvchi: %s (%s). Holati: %s%s. Bog'lanish telefoni: %s. Iltimos ota-onasiga telefon qilib sababini aniqlang.",
                stdName, grpName, attendanceStatus, (note != null && !note.isEmpty()) ? " (" + note + ")" : "",
                !contact.isEmpty() ? contact : "Telefon ko'rsatilmagan");

        Notification notif = Notification.builder()
                .title(title)
                .message(message)
                .type("ABSENT_STUDENT_CALL")
                .targetRole("BRANCH_ADMIN")
                .read(false)
                .createdAt(LocalDateTime.now())
                .metadataJson(String.format("{\"studentId\":%d,\"studentName\":\"%s\",\"phone\":\"%s\",\"parentPhone\":\"%s\",\"group\":\"%s\"}",
                        student != null ? student.getId() : 0, stdName, phone, parentPhone, grpName))
                .build();
        return notificationRepository.save(notif);
    }

    @Transactional
    public Notification notifyLessonReminder(User mentorUser, String groupName, String roomName) {
        String title = "⏰ Dars Eslatmasi: " + groupName;
        String message = String.format("%s guruhi bilan darsingiz boshlanmoqda (Xona: %s). Darsga kirish, davomat belgilash va o'quvchilarni baholashni unutmang!",
                groupName, roomName != null ? roomName : "Belgilanmagan");

        Notification notif = Notification.builder()
                .title(title)
                .message(message)
                .type("ATTENDANCE_REMINDER")
                .targetRole("MENTOR")
                .targetUser(mentorUser)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        return notificationRepository.save(notif);
    }

    @Transactional
    public Notification notifyAdminOngoingLesson(String groupName, String roomName, String mentorName) {
        String title = "🏫 Dars Jarayonda: " + groupName;
        String message = String.format("%s guruhida dars boshlandi. Xona: %s, Ustoz: %s.",
                groupName, roomName != null ? roomName : "-", mentorName != null ? mentorName : "-");

        Notification notif = Notification.builder()
                .title(title)
                .message(message)
                .type("LESSON")
                .targetRole("BRANCH_ADMIN")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        return notificationRepository.save(notif);
    }
}
