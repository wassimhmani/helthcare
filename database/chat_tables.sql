-- Chat messages table for internal communication between users
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sender_id` VARCHAR(100) NOT NULL,
  `receiver_id` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_sender` (`sender_id`),
  KEY `idx_receiver` (`receiver_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Chat conversations view helper (optional, for getting conversation summaries)
CREATE TABLE IF NOT EXISTS `chat_conversations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user1_id` VARCHAR(100) NOT NULL,
  `user2_id` VARCHAR(100) NOT NULL,
  `last_message_id` INT DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_conversation` (`user1_id`, `user2_id`),
  KEY `idx_user1` (`user1_id`),
  KEY `idx_user2` (`user2_id`),
  KEY `idx_updated` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
