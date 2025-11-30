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
  `created_at` text NOT NULL,
  `updated_At` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `patient`
--

INSERT INTO `patient` (`id`, `file_number`, `cin_passport`, `full_name`, `email`, `phone`, `date_of_birth`, `gender`, `address`, `medical_history`, `created_at`, `updated_At`) VALUES
('patient-1757629471207', '66', '1102740866', 'Wassim Hmani', 'hmani@gmail.com', '0214303225', '2014-01-06', 'Male', 'remla-kerkennah-sfax-tunisie', 'Hypertension (5 years), Hyperlipidemia', '2025-09-11T22:24:31.207Z', '2025-11-09T21:15:21.857Z'),
('patient-1762894833980', 'P-2025-008', '333333', 'hassen hassen', 'hassen@gmail.com', '26585555', '2010-02-10', 'Male', 'sfax', '', '2025-11-11T21:00:33.980Z', '2025-11-11T21:12:46.745Z');

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
  `bp_systolic` INT DEFAULT NULL,
  `bp_diastolic` INT DEFAULT NULL,
  `imc` DECIMAL(4,2) DEFAULT NULL,
  `bmi_category` VARCHAR(50) DEFAULT NULL,
  `vital_notes` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
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

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
