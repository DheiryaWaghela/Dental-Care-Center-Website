-- Dental Care Center: secure patient and prescription records.
-- Run this against the existing dental_care_center database. It is safe to rerun.
USE dental_care_center;

CREATE TABLE IF NOT EXISTS patients (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(180) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  date_of_birth DATE NULL,
  gender VARCHAR(40) NULL,
  medical_history TEXT NULL,
  allergies TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_patients_phone (phone),
  UNIQUE KEY uq_patients_email (email),
  INDEX idx_patients_name (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS medicines (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  generic_name VARCHAR(180) NULL,
  brand_name VARCHAR(180) NULL,
  strength VARCHAR(100) NULL,
  dosage_form VARCHAR(100) NULL,
  notes TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_medicines_name (name),
  INDEX idx_medicines_generic (generic_name),
  INDEX idx_medicines_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prescriptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  prescription_number VARCHAR(40) NOT NULL,
  patient_id INT UNSIGNED NOT NULL,
  doctor_id INT UNSIGNED NULL,
  doctor_name VARCHAR(180) NOT NULL,
  doctor_qualification VARCHAR(255) NULL,
  prescription_date DATE NOT NULL,
  chief_complaint TEXT NULL,
  clinical_observations TEXT NULL,
  diagnosis TEXT NULL,
  treatment_plan TEXT NULL,
  additional_notes TEXT NULL,
  follow_up_date DATE NULL,
  created_by VARCHAR(150) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_prescription_number (prescription_number),
  INDEX idx_prescriptions_patient_date (patient_id, prescription_date),
  CONSTRAINT fk_prescriptions_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  CONSTRAINT fk_prescriptions_doctor FOREIGN KEY (doctor_id) REFERENCES dentists(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prescription_medicines (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  prescription_id INT UNSIGNED NOT NULL,
  medicine_id INT UNSIGNED NULL,
  medicine_name VARCHAR(180) NOT NULL,
  strength VARCHAR(100) NULL,
  dose VARCHAR(100) NULL,
  route VARCHAR(80) NULL,
  frequency VARCHAR(180) NULL,
  duration VARCHAR(100) NULL,
  quantity VARCHAR(100) NULL,
  instructions TEXT NULL,
  notes TEXT NULL,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_prescription_medicines_prescription (prescription_id, display_order),
  CONSTRAINT fk_prescription_medicines_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
  CONSTRAINT fk_prescription_medicines_catalogue FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
