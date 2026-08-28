-- Alter existing tables to add CRM columns
ALTER TABLE courses ADD COLUMN price NUMERIC(19, 2);
ALTER TABLE courses ADD COLUMN duration_months INTEGER;
ALTER TABLE courses ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE';

ALTER TABLE groups ADD COLUMN schedule VARCHAR(255);
ALTER TABLE groups ADD COLUMN room VARCHAR(100);
ALTER TABLE groups ADD COLUMN capacity INTEGER;
ALTER TABLE groups ADD COLUMN start_date DATE;
ALTER TABLE groups ADD COLUMN end_date DATE;
ALTER TABLE groups ADD COLUMN branch_id BIGINT;

ALTER TABLE students ADD COLUMN phone VARCHAR(50);
ALTER TABLE students ADD COLUMN telegram VARCHAR(100);
ALTER TABLE students ADD COLUMN parent_name VARCHAR(150);
ALTER TABLE students ADD COLUMN parent_phone VARCHAR(50);
ALTER TABLE students ADD COLUMN birth_date DATE;
ALTER TABLE students ADD COLUMN address VARCHAR(255);
ALTER TABLE students ADD COLUMN gender VARCHAR(10);
ALTER TABLE students ADD COLUMN branch_id BIGINT;

ALTER TABLE users ADD COLUMN branch_id BIGINT;

-- Create new CRM tables
CREATE TABLE branches (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leads (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    source VARCHAR(100),
    branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL,
    course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL,
    operator_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    next_contact_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lead_events (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE price_plans (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    amount NUMERIC(19, 2) NOT NULL,
    duration_months INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE enrollments (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id BIGINT REFERENCES groups(id) ON DELETE SET NULL,
    price_plan_id BIGINT NOT NULL REFERENCES price_plans(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    discount_amount NUMERIC(19, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP
);

CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    enrollment_id BIGINT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    amount NUMERIC(19, 2) NOT NULL,
    paid_amount NUMERIC(19, 2) NOT NULL DEFAULT 0.00,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UNPAID',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(19, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    received_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id BIGINT,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45)
);

-- Add Foreign Key constraints
ALTER TABLE groups ADD CONSTRAINT fk_groups_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE students ADD CONSTRAINT fk_students_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
