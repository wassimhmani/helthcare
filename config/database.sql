-- phpMyAdmin SQL Dump
-- version 5.0.3
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mer. 12 nov. 2025 à 23:05
-- Version du serveur :  10.4.14-MariaDB
-- Version de PHP : 7.4.11

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET GLOBAL max_allowed_packet = 268435456; -- 256M


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `helthcaredb`
--
CREATE DATABASE IF NOT EXISTS `helthcaredb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `helthcaredb`;

-- --------------------------------------------------------

--
-- Structure de la table `patient`
--

DROP TABLE IF EXISTS `patient`;

CREATE TABLE `patient` (
  `id` text NOT NULL,
  `file_number` text NOT NULL,
  `cin_passport` text NOT NULL,
  `full_name` text NOT NULL,
  `email` text NOT NULL,
  `phone` text NOT NULL,
  `date_of_birth` text NOT NULL,
  `gender` text NOT NULL,
  `address` text NOT NULL,
  `medical_history` text NOT NULL,
  `patient_doc` LONGTEXT NOT NULL,
  `created_at` text NOT NULL,
  `updated_At` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `patient`
--

INSERT INTO `patient` (`id`, `file_number`, `cin_passport`, `full_name`, `email`, `phone`, `date_of_birth`, `gender`, `address`, `medical_history`, `patient_doc`, `created_at`, `updated_At`) VALUES
('patient-1757629471207', '66', '1102740866', 'Wassim Hmani', 'hmani@gmail.com', '0214303225', '2014-01-06', 'Male', 'remla-kerkennah-sfax-tunisie', 'Hypertension (5 years), Hyperlipidemia', '', '2025-09-11T22:24:31.207Z', '2025-11-09T21:15:21.857Z'),
('patient-1762894833980', 'P-2025-008', '333333', 'hassen hassen', 'hassen@gmail.com', '26585555', '2010-02-10', 'Male', 'sfax', '', '', '2025-11-11T21:00:33.980Z', '2025-11-11T21:12:46.745Z');

-- --------------------------------------------------------

--
-- Structure de la table `appointment`
--

DROP TABLE IF EXISTS `appointment`;

CREATE TABLE `appointment` (
  `id` VARCHAR(100) NOT NULL,
  `date` DATE NOT NULL,
  `time` TIME NOT NULL,
  `duration` INT NOT NULL DEFAULT 30,
  `client_name` VARCHAR(255) NOT NULL,
  `client_phone` VARCHAR(50) NOT NULL,
  `client_email` VARCHAR(255) DEFAULT NULL,
  `type` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pre-validation',
  `notes` TEXT DEFAULT NULL,
  `doctor` VARCHAR(255) DEFAULT NULL,
  `patient_id` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `patient`
--
ALTER TABLE `patient`
  ADD PRIMARY KEY (`id`(60));

--
-- Structure de la table `consultation`
--

DROP TABLE IF EXISTS `consultation`;

CREATE TABLE `consultation` (
  `id` VARCHAR(100) NOT NULL,
  `patient_id` VARCHAR(100) NOT NULL,
  `height` DECIMAL(5,2) DEFAULT NULL,
  `weight` DECIMAL(5,2) DEFAULT NULL,
  `temperature` DECIMAL(4,2) DEFAULT NULL,
  `heart_rate` INT DEFAULT NULL,
  `blood_sugar` INT DEFAULT NULL,
  `blood_pressure` VARCHAR(20) DEFAULT NULL,
  `imc` DECIMAL(4,2) DEFAULT NULL,
  `bmi_category` VARCHAR(50) DEFAULT NULL,
  `consultation_act` VARCHAR(255) DEFAULT NULL,
  `clinical_note` TEXT DEFAULT NULL,
  `radiology_result` TEXT DEFAULT NULL,
  `radiology_diagnostics` TEXT DEFAULT NULL,
  `lab_results` TEXT DEFAULT NULL,
  `lab_notes` TEXT DEFAULT NULL,
  `prescription` TEXT DEFAULT NULL,
  `payment_status` VARCHAR(50) DEFAULT 'paying',
  `documents` LONGTEXT DEFAULT NULL,
  `doctor` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_patient_id` (`patient_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_doctor` (`doctor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Structure de la table `radiology_result`
--

DROP TABLE IF EXISTS `radiology_result`;

CREATE TABLE `radiology_result` (
  `id` VARCHAR(100) NOT NULL,
  `consultation_id` VARCHAR(100) DEFAULT NULL,
  `patient_id` VARCHAR(100) DEFAULT NULL,
  `exam_type` VARCHAR(255) DEFAULT NULL,
  `exam_date` DATE DEFAULT NULL,
  `radiology_result` TEXT DEFAULT NULL,
  `radiology_diagnostics` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `documents` LONGTEXT DEFAULT NULL,
  `doctor` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_radiology_result_patient_id` (`patient_id`),
  KEY `idx_radiology_result_consultation_id` (`consultation_id`),
  KEY `idx_radiology_result_exam_date` (`exam_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Structure de la table `lab_assessment`
--

DROP TABLE IF EXISTS `lab_assessment`;

CREATE TABLE `lab_assessment` (
  `id` VARCHAR(100) NOT NULL,
  `consultation_id` VARCHAR(100) DEFAULT NULL,
  `patient_id` VARCHAR(100) DEFAULT NULL,
  `assessment_type` VARCHAR(255) DEFAULT NULL,
  `lab_date` DATE DEFAULT NULL,
  `results` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `documents` LONGTEXT DEFAULT NULL,
  `doctor` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lab_assessment_patient_id` (`patient_id`),
  KEY `idx_lab_assessment_consultation_id` (`consultation_id`),
  KEY `idx_lab_assessment_lab_date` (`lab_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Structure de la table `certificate`
--

DROP TABLE IF EXISTS `certificate`;

CREATE TABLE `certificate` (
  `id` VARCHAR(100) NOT NULL,
  `consultation_id` VARCHAR(100) NOT NULL,
  `patient_id` VARCHAR(100) NOT NULL,
  `cert_type` VARCHAR(100) DEFAULT NULL,
  `rest_period` INT DEFAULT NULL,
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `doctor_name` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_certificate_patient_id` (`patient_id`),
  KEY `idx_certificate_consultation_id` (`consultation_id`),
  KEY `idx_certificate_start_date` (`start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Index pour la table `appointment`
--
ALTER TABLE `appointment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_patient_id` (`patient_id`);

--
-- Structure de la table `bill`
--

DROP TABLE IF EXISTS `bill`;

CREATE TABLE `bill` (
  `id` VARCHAR(100) NOT NULL,
  `patient_id` VARCHAR(100) NOT NULL,
  `patient_name` VARCHAR(255) NOT NULL,
  `patient_email` VARCHAR(255) DEFAULT NULL,
  `patient_phone` VARCHAR(50) DEFAULT NULL,
  `bill_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `items` LONGTEXT NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `tax` DECIMAL(10,2) NOT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Paid',
  `consultation_id` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_patient_id` (`patient_id`),
  KEY `idx_bill_date` (`bill_date`),
  KEY `idx_status` (`status`),
  KEY `idx_consultation_id` (`consultation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Structure de la table `bill_description`
--

DROP TABLE IF EXISTS `bill_description`;

CREATE TABLE `bill_description` (
  `id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `default_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Default billable services
INSERT INTO `bill_description` (`id`, `name`, `default_price`, `notes`)
VALUES
  ('svc_consultation_standard', 'Consultation', 50.00, 'Standard medical consultation'),
  ('svc_consultation_followup', 'Follow-up consultation', 40.00, 'Short follow-up visit'),
  ('svc_emergency_visit', 'Emergency visit', 80.00, 'Urgent, unscheduled consultation'),
  ('svc_blood_pressure_check', 'Blood pressure check', 10.00, 'Quick blood pressure measurement and advice'),
  ('svc_injection_im', 'Intramuscular injection', 15.00, 'IM injection (drug not included)'),
  ('svc_vaccination', 'Vaccination', 30.00, 'Routine vaccination (vaccine not included)'),
  ('svc_wound_dressing', 'Wound dressing', 25.00, 'Cleaning and dressing of wound'),
  ('svc_ecg', 'ECG', 35.00, '12-lead electrocardiogram'),
  ('svc_ultrasound_abdomen', 'Abdominal ultrasound', 90.00, 'Ultrasound examination of the abdomen'),
  ('svc_lab_basic_panel', 'Basic lab panel', 60.00, 'Standard blood tests panel')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `default_price` = VALUES(`default_price`),
  `notes` = VALUES(`notes`);

-- Structure de la table `expenses`
--

DROP TABLE IF EXISTS `expenses`;

CREATE TABLE `expenses` (
  `id` VARCHAR(100) NOT NULL,
  `expense_date` DATE NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expense_date` (`expense_date`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Structure de la table `medicine`
--

DROP TABLE IF EXISTS `medicine`;

CREATE TABLE `medicine` (
  `id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `dosage` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default medicines
INSERT INTO `medicine` (`id`, `name`, `dosage`, `notes`)
VALUES
  ('med_paracetamol_500', 'Paracetamol', '500 mg tablet', 'Analgesic and antipyretic'),
  ('med_ibuprofen_400', 'Ibuprofen', '400 mg tablet', 'NSAID for pain and inflammation'),
  ('med_amoxicillin_500', 'Amoxicillin', '500 mg capsule', 'Broad-spectrum antibiotic'),
  ('med_metformin_850', 'Metformin', '850 mg tablet', 'Oral antidiabetic (biguanide)'),
  ('med_omeprazole_20', 'Omeprazole', '20 mg capsule', 'Proton pump inhibitor for gastric acid reduction')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `dosage` = VALUES(`dosage`),
  `notes` = VALUES(`notes`);

-- --------------------------------------------------------

--
-- Structure de la table `cabinet_info`
--

DROP TABLE IF EXISTS `cabinet_info`;

CREATE TABLE `cabinet_info` (
  `id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `address` TEXT DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `logo_path` LONGTEXT DEFAULT NULL,
  `working_hours` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default cabinet row
INSERT INTO `cabinet_info` (`id`, `name`, `address`, `phone`, `logo_path`, `working_hours`)
VALUES (
  'cabinet-default',
  'My Medical Cabinet',
  'Tunis, Tunisia',
  '00 000 000',
  NULL,
  '{"monday":{"enabled":true,"open":"09:00","close":"17:00"},"tuesday":{"enabled":true,"open":"09:00","close":"17:00"},"wednesday":{"enabled":true,"open":"09:00","close":"17:00"},"thursday":{"enabled":true,"open":"09:00","close":"17:00"},"friday":{"enabled":true,"open":"09:00","close":"17:00"},"saturday":{"enabled":false,"open":"09:00","close":"13:00"},"sunday":{"enabled":false,"open":"09:00","close":"13:00"}}'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  address = VALUES(address),
  phone = VALUES(phone),
  logo_path = VALUES(logo_path),
  working_hours = VALUES(working_hours);

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` VARCHAR(100) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `permissions` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  UNIQUE KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default application users
INSERT INTO `users` (`id`, `username`, `password`, `role`, `name`, `email`, `status`, `permissions`)
VALUES
  ('user_default_1', 'doctor', 'doctor123', 'doctor', 'Dr. John Smith', 'doctor@clinic.com', 'active', NULL),
  ('user_default_2', 'secretary', 'secretary123', 'secretary', 'Alice Johnson', 'secretary@clinic.com', 'active', NULL)
ON DUPLICATE KEY UPDATE
  username = VALUES(username),
  password = VALUES(password),
  role = VALUES(role),
  name = VALUES(name),
  email = VALUES(email),
  status = VALUES(status),
  permissions = VALUES(permissions);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
