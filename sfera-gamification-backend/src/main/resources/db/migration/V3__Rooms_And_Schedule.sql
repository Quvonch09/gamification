-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    capacity INT NOT NULL DEFAULT 15,
    description VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add scheduling columns to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS days_of_week VARCHAR(100);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS start_time VARCHAR(50);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS end_time VARCHAR(50);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS room_id BIGINT REFERENCES rooms(id) ON DELETE SET NULL;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS lessons_per_month INT DEFAULT 12;

-- Insert initial classrooms if table is empty
INSERT INTO rooms (name, capacity, description, status, created_at)
VALUES 
('101-xona (Frontend Lab)', 16, '16 ta zamonaviy kompyuter va proyektor bilan jihozlangan', 'ACTIVE', NOW()),
('102-xona (Backend & Python)', 14, 'Dasturlash va server texnologiyalari uchun mo''ljallangan lab', 'ACTIVE', NOW()),
('201-xona (Grafik Dizayn)', 12, 'Grafik planshetlar va yuqori quvvatli monitorlar', 'ACTIVE', NOW()),
('202-xona (Robototexnika & Kids)', 10, 'Robototexnika to''plamlari va amaliy tajriba xonasi', 'ACTIVE', NOW())
ON CONFLICT (name) DO NOTHING;
