-- Flyway Migration V8: Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- PAYMENT, LESSON, ATTENDANCE_REMINDER, ABSENT_STUDENT_CALL, SYSTEM
    target_role VARCHAR(50),   -- SUPER_ADMIN, BRANCH_ADMIN, ACCOUNTANT, MENTOR, or NULL for all
    target_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    metadata_json TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
