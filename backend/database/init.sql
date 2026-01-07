-- Coffee Roulette Database Schema
-- MySQL 8.0

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS coffee_roulette;
USE coffee_roulette;

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  microsoft_id VARCHAR(255),
  is_active BOOLEAN DEFAULT FALSE COMMENT 'Whether department is enrolled in Coffee Roulette',
  enrollment_date DATE COMMENT 'Date when department was enabled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  microsoft_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  department_id INT,
  role VARCHAR(100) COMMENT 'Job title/role',
  seniority_level ENUM('junior', 'mid', 'senior', 'lead', 'executive') DEFAULT 'mid',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether user account is active',
  is_opted_in BOOLEAN DEFAULT TRUE COMMENT 'Whether user opted into Coffee Roulette',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP COMMENT 'Last time user data was synced from Microsoft',
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  INDEX idx_microsoft_id (microsoft_id),
  INDEX idx_email (email),
  INDEX idx_department_id (department_id),
  INDEX idx_is_opted_in (is_opted_in),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Matching Rounds Table
CREATE TABLE IF NOT EXISTS matching_rounds (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) COMMENT 'Optional name for the round, e.g., "January 2026"',
  scheduled_date DATE NOT NULL COMMENT 'Date when matching is scheduled to run',
  executed_at TIMESTAMP COMMENT 'Actual timestamp when matching algorithm ran',
  status ENUM('scheduled', 'in_progress', 'completed', 'failed') DEFAULT 'scheduled',
  total_participants INT DEFAULT 0 COMMENT 'Number of users included in this round',
  total_pairings INT DEFAULT 0 COMMENT 'Number of pairings created',
  error_message TEXT COMMENT 'Error details if status is failed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_scheduled_date (scheduled_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pairings Table
CREATE TABLE IF NOT EXISTS pairings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  matching_round_id INT NOT NULL,
  user1_id INT NOT NULL,
  user2_id INT NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending' COMMENT 'pending=just matched, confirmed=meeting scheduled, completed=meeting happened, cancelled=cancelled',
  meeting_scheduled_at TIMESTAMP COMMENT 'When the meeting is scheduled for',
  meeting_completed_at TIMESTAMP COMMENT 'When users confirmed meeting happened',
  outlook_event_id VARCHAR(255) COMMENT 'Microsoft Graph Calendar Event ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (matching_round_id) REFERENCES matching_rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_users (user1_id, user2_id),
  INDEX idx_round (matching_round_id),
  INDEX idx_status (status),
  INDEX idx_meeting_scheduled (meeting_scheduled_at),
  CONSTRAINT check_different_users CHECK (user1_id != user2_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meeting Feedback Table
CREATE TABLE IF NOT EXISTS meeting_feedback (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pairing_id INT NOT NULL,
  user_id INT NOT NULL COMMENT 'User who submitted the feedback',
  rating INT CHECK (rating >= 1 AND rating <= 5) COMMENT 'Star rating 1-5',
  comments TEXT COMMENT 'Written feedback about the meeting',
  topics_discussed TEXT COMMENT 'Topics that were discussed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pairing_id) REFERENCES pairings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_feedback (pairing_id, user_id) COMMENT 'Each user can submit feedback once per pairing',
  INDEX idx_pairing (pairing_id),
  INDEX idx_user (user_id),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Icebreaker Topics Table
CREATE TABLE IF NOT EXISTS icebreaker_topics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  topic TEXT NOT NULL,
  category VARCHAR(50) COMMENT 'e.g., work, hobbies, fun, career',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether this topic is in rotation',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pairing Icebreakers (Join Table)
CREATE TABLE IF NOT EXISTS pairing_icebreakers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pairing_id INT NOT NULL,
  icebreaker_id INT NOT NULL,
  FOREIGN KEY (pairing_id) REFERENCES pairings(id) ON DELETE CASCADE,
  FOREIGN KEY (icebreaker_id) REFERENCES icebreaker_topics(id) ON DELETE CASCADE,
  UNIQUE KEY unique_pairing_icebreaker (pairing_id, icebreaker_id),
  INDEX idx_pairing (pairing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description TEXT COMMENT 'Human-readable description of what this setting does',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT COMMENT 'User ID of admin who last updated this',
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notification Queue Table
CREATE TABLE IF NOT EXISTS notification_queue (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pairing_id INT COMMENT 'Related pairing, if applicable',
  recipient_user_id INT NOT NULL,
  notification_type ENUM('pairing', 'reminder', 'feedback_request', 'admin_alert') NOT NULL,
  channel ENUM('email', 'teams', 'both') DEFAULT 'both',
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  scheduled_for TIMESTAMP COMMENT 'When to send this notification',
  sent_at TIMESTAMP COMMENT 'When notification was actually sent',
  error_message TEXT COMMENT 'Error details if sending failed',
  retry_count INT DEFAULT 0 COMMENT 'Number of times we tried to send',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pairing_id) REFERENCES pairings(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status_scheduled (status, scheduled_for),
  INDEX idx_recipient (recipient_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role ENUM('super_admin', 'department_admin', 'viewer') DEFAULT 'viewer' COMMENT 'super_admin=full access, department_admin=limited to departments, viewer=read-only',
  permissions JSON COMMENT 'Additional granular permissions',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_admin_user (user_id),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT COMMENT 'User who performed the action',
  action VARCHAR(100) NOT NULL COMMENT 'e.g., user.created, department.enabled, matching.triggered',
  entity_type VARCHAR(50) COMMENT 'e.g., user, department, pairing, setting',
  entity_id INT COMMENT 'ID of the entity affected',
  changes JSON COMMENT 'Before/after values for updates',
  ip_address VARCHAR(45) COMMENT 'IP address of requester',
  user_agent TEXT COMMENT 'Browser/client user agent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_action (user_id, action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, data_type, description) VALUES
  ('matching.frequency', 'monthly', 'string', 'How often to run matching: daily, weekly, monthly'),
  ('matching.day_of_month', '1', 'number', 'Day of month to run matching (1-31)'),
  ('matching.time', '09:00', 'string', 'Time of day to run matching (HH:MM)'),
  ('matching.lookback_rounds', '3', 'number', 'Number of previous rounds to check for repeat pairings'),
  ('matching.cross_department_weight', '20', 'number', 'Bonus points for cross-department pairing'),
  ('matching.cross_seniority_weight', '10', 'number', 'Bonus points for cross-seniority pairing'),
  ('matching.repeat_penalty', '50', 'number', 'Penalty points per recent pairing'),
  ('notification.reminder_days_before', '7,1', 'string', 'Days before meeting to send reminders (comma-separated)'),
  ('notification.feedback_days_after', '1', 'number', 'Days after meeting to request feedback'),
  ('teams.webhook_url', '', 'string', 'Microsoft Teams incoming webhook URL'),
  ('calendar.auto_schedule', 'true', 'boolean', 'Automatically schedule meetings in Outlook'),
  ('calendar.meeting_duration_minutes', '30', 'number', 'Default meeting duration'),
  ('calendar.search_window_days', '14', 'number', 'Number of days to search for available time slots')
ON DUPLICATE KEY UPDATE setting_key=setting_key;

-- Insert sample icebreaker topics
INSERT INTO icebreaker_topics (topic, category, is_active) VALUES
  ('What project are you most excited about right now?', 'work', TRUE),
  ('If you could learn any skill instantly, what would it be?', 'career', TRUE),
  ('What''s a hobby or interest you''ve picked up recently?', 'hobbies', TRUE),
  ('What''s the best piece of advice you''ve received?', 'career', TRUE),
  ('If you could have dinner with anyone, dead or alive, who would it be?', 'fun', TRUE),
  ('What''s your favorite way to unwind after work?', 'hobbies', TRUE),
  ('What''s something you''re currently learning or trying to improve at?', 'career', TRUE),
  ('What''s a book, podcast, or show you''d recommend?', 'hobbies', TRUE),
  ('What''s your favorite thing about working at this company?', 'work', TRUE),
  ('If you could travel anywhere right now, where would you go?', 'fun', TRUE),
  ('What''s a skill you have that might surprise people?', 'fun', TRUE),
  ('What''s the most interesting problem you''ve solved recently?', 'work', TRUE),
  ('What motivates you to do your best work?', 'work', TRUE),
  ('What''s a goal you''re working towards this year?', 'career', TRUE),
  ('What''s your preferred coffee or tea order?', 'fun', TRUE),
  ('What''s something you wish you knew when you started your career?', 'career', TRUE),
  ('What''s a recent win you''re proud of?', 'work', TRUE),
  ('If you could swap jobs with anyone for a day, who would it be?', 'fun', TRUE),
  ('What''s a tradition or ritual that''s important to you?', 'hobbies', TRUE),
  ('What''s the best collaboration you''ve been part of?', 'work', TRUE)
ON DUPLICATE KEY UPDATE topic=topic;

-- Create view for easier querying of pairing details
CREATE OR REPLACE VIEW pairing_details AS
SELECT
  p.id AS pairing_id,
  p.matching_round_id,
  mr.name AS round_name,
  mr.scheduled_date AS round_date,
  p.status,
  p.meeting_scheduled_at,
  p.meeting_completed_at,
  u1.id AS user1_id,
  u1.email AS user1_email,
  CONCAT(u1.first_name, ' ', u1.last_name) AS user1_name,
  u1.department_id AS user1_department_id,
  d1.name AS user1_department,
  u1.seniority_level AS user1_seniority,
  u2.id AS user2_id,
  u2.email AS user2_email,
  CONCAT(u2.first_name, ' ', u2.last_name) AS user2_name,
  u2.department_id AS user2_department_id,
  d2.name AS user2_department,
  u2.seniority_level AS user2_seniority,
  p.created_at,
  p.updated_at
FROM pairings p
JOIN matching_rounds mr ON p.matching_round_id = mr.id
JOIN users u1 ON p.user1_id = u1.id
JOIN users u2 ON p.user2_id = u2.id
LEFT JOIN departments d1 ON u1.department_id = d1.id
LEFT JOIN departments d2 ON u2.department_id = d2.id;

-- Create view for analytics
CREATE OR REPLACE VIEW analytics_overview AS
SELECT
  (SELECT COUNT(*) FROM users WHERE is_active = TRUE) AS total_active_users,
  (SELECT COUNT(*) FROM users WHERE is_active = TRUE AND is_opted_in = TRUE) AS total_opted_in_users,
  (SELECT COUNT(*) FROM departments WHERE is_active = TRUE) AS total_active_departments,
  (SELECT COUNT(*) FROM matching_rounds WHERE status = 'completed') AS total_completed_rounds,
  (SELECT COUNT(*) FROM pairings) AS total_pairings,
  (SELECT COUNT(*) FROM pairings WHERE status = 'completed') AS total_completed_meetings,
  (SELECT AVG(rating) FROM meeting_feedback) AS average_rating,
  (SELECT COUNT(*) FROM meeting_feedback) AS total_feedback_submissions;

-- Grant permissions (adjust as needed for your MySQL user)
-- GRANT ALL PRIVILEGES ON coffee_roulette.* TO 'app_user'@'%';
-- FLUSH PRIVILEGES;
