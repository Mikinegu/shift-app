-- ==========================================================
-- Shift Platform - PostgreSQL Schema
-- ==========================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) DEFAULT 'student',
  is_verified BOOLEAN DEFAULT FALSE,
  otp_code VARCHAR(10),
  otp_expires_at TIMESTAMP,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Student Profiles Table
CREATE TABLE IF NOT EXISTS student_profiles (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  university VARCHAR(255),
  major VARCHAR(255),
  year_of_study VARCHAR(50),
  graduation_date VARCHAR(100),
  student_id VARCHAR(100),
  phone VARCHAR(50),
  skills JSONB DEFAULT '[]',
  experience TEXT,
  employment_type VARCHAR(100),
  job_field VARCHAR(100),
  location VARCHAR(255),
  cv_url TEXT,
  verification_docs JSONB DEFAULT '[]',
  verification_status VARCHAR(32) DEFAULT 'pending',
  admin_notes TEXT,
  photo_url TEXT,
  bio TEXT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Company Profiles Table
CREATE TABLE IF NOT EXISTS company_profiles (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  industry VARCHAR(255),
  org_type VARCHAR(100),
  location VARCHAR(255),
  website TEXT,
  logo_url TEXT,
  contact_person VARCHAR(255),
  contact_position VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  legal_info TEXT,
  description TEXT,
  verification_status VARCHAR(32) DEFAULT 'pending',
  admin_notes TEXT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64),
  company_name VARCHAR(255),
  company_logo TEXT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  responsibilities TEXT,
  requirements TEXT,
  employment_type VARCHAR(50),
  work_mode VARCHAR(50),
  location VARCHAR(255),
  salary VARCHAR(100),
  positions INT DEFAULT 1,
  deadline VARCHAR(100),
  required_major VARCHAR(255),
  required_education VARCHAR(255),
  year_preference VARCHAR(100),
  org_type VARCHAR(100),
  required_skills JSONB DEFAULT '[]',
  status VARCHAR(32) DEFAULT 'approved',
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(64) PRIMARY KEY,
  job_id VARCHAR(64) NOT NULL,
  job_title VARCHAR(255),
  company_id VARCHAR(64) NOT NULL,
  company_name VARCHAR(255),
  student_id VARCHAR(64) NOT NULL,
  student_name VARCHAR(255),
  student_major VARCHAR(255),
  student_university VARCHAR(255),
  cv_url TEXT,
  cover_message TEXT,
  status VARCHAR(32) DEFAULT 'applied',
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Saved Jobs Table
CREATE TABLE IF NOT EXISTS saved_jobs (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  job_id VARCHAR(64) NOT NULL,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
  id VARCHAR(64) PRIMARY KEY,
  application_id VARCHAR(64),
  job_id VARCHAR(64),
  job_title VARCHAR(255),
  student_id VARCHAR(64) NOT NULL,
  student_name VARCHAR(255),
  company_id VARCHAR(64) NOT NULL,
  company_name VARCHAR(255),
  scheduled_at TIMESTAMP,
  status VARCHAR(32) DEFAULT 'scheduled',
  meeting_link TEXT,
  notes TEXT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  student_name VARCHAR(255),
  company_id VARCHAR(64) NOT NULL,
  company_name VARCHAR(255),
  last_message TEXT,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(64) PRIMARY KEY,
  conversation_id VARCHAR(64) NOT NULL,
  sender_id VARCHAR(64) NOT NULL,
  sender_name VARCHAR(255),
  sender_role VARCHAR(32),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50),
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Admin Notifications Table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id VARCHAR(64) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  target_type VARCHAR(50),
  target_id VARCHAR(64),
  status VARCHAR(32) DEFAULT 'unread',
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  admin_id VARCHAR(64),
  admin_name VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id VARCHAR(64),
  details TEXT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(64) PRIMARY KEY,
  reporter_id VARCHAR(64),
  target_type VARCHAR(50),
  target_id VARCHAR(64),
  reason TEXT,
  status VARCHAR(32) DEFAULT 'pending',
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Safely add any new columns to existing tables
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS graduation_date VARCHAR(100);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS employment_type VARCHAR(100);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS job_field VARCHAR(100);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Create indexes for performant lookups
CREATE INDEX IF NOT EXISTS idx_student_user ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_company_user ON company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_apps_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_apps_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_apps_company ON applications(company_id);
CREATE INDEX IF NOT EXISTS idx_saved_student ON saved_jobs(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications(user_id);
