-- ReMind AI Database Schema (PostgreSQL DDL)
-- Reference schema matching SQLAlchemy models

-- 1. users
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_role ON users(role);

-- 2. patients
CREATE TABLE patients (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NULL REFERENCES users(id),
    caregiver_id VARCHAR(36) NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    dob VARCHAR(50) NULL,
    medical_notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_patients_user_id ON patients(user_id);
CREATE INDEX ix_patients_caregiver_id ON patients(caregiver_id);

-- 3. family_members
CREATE TABLE family_members (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_family_members_patient_id ON family_members(patient_id);
CREATE INDEX ix_family_members_user_id ON family_members(user_id);

-- 4. face_embeddings
CREATE TABLE face_embeddings (
    id VARCHAR(36) PRIMARY KEY,
    family_member_id VARCHAR(36) NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    embedding JSONB NOT NULL,
    photo_url VARCHAR(1024) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_face_embeddings_family_member_id ON face_embeddings(family_member_id);

-- 5. reminders
CREATE TABLE reminders (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_by VARCHAR(36) NOT NULL REFERENCES users(id),
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1024) NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    recurrence VARCHAR(50) NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'normal',
    status VARCHAR(50) NOT NULL DEFAULT 'upcoming',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_reminders_patient_id ON reminders(patient_id);
CREATE INDEX ix_reminders_created_by ON reminders(created_by);
CREATE INDEX ix_reminders_category ON reminders(category);
CREATE INDEX ix_reminders_scheduled_at ON reminders(scheduled_at);
CREATE INDEX ix_reminders_status ON reminders(status);

-- 6. recognitions
CREATE TABLE recognitions (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    matched_member_id VARCHAR(36) NULL REFERENCES family_members(id),
    confidence FLOAT NOT NULL DEFAULT 0.0,
    is_unknown BOOLEAN NOT NULL DEFAULT FALSE,
    image_url VARCHAR(1024) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_recognitions_patient_id ON recognitions(patient_id);
CREATE INDEX ix_recognitions_matched_member_id ON recognitions(matched_member_id);

-- 7. emergency_events
CREATE TABLE emergency_events (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    trigger_method VARCHAR(50) NOT NULL,
    contacts_notified INTEGER NOT NULL DEFAULT 0,
    resolved_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_emergency_events_patient_id ON emergency_events(patient_id);

-- 8. notifications
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_notifications_user_id ON notifications(user_id);
CREATE INDEX ix_notifications_type ON notifications(type);
CREATE INDEX ix_notifications_read_at ON notifications(read_at);

-- 9. activity_logs
CREATE TABLE activity_logs (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    detail JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_activity_logs_patient_id ON activity_logs(patient_id);
CREATE INDEX ix_activity_logs_action_type ON activity_logs(action_type);
