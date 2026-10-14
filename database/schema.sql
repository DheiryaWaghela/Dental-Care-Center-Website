CREATE DATABASE IF NOT EXISTS dental_care_center CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dental_care_center;

CREATE TABLE IF NOT EXISTS dentists (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  image TEXT NOT NULL,
  qualification VARCHAR(255) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  experience VARCHAR(100) NOT NULL,
  description TEXT,
  timing VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  image_icon VARCHAR(100),
  price VARCHAR(100),
  bg VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  image TEXT NOT NULL,
  title VARCHAR(255),
  caption TEXT,
  category VARCHAR(80) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(150) NOT NULL,
  review_text TEXT NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  treatment VARCHAR(180),
  image_avatar VARCHAR(255),
  location VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS appointments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  service VARCHAR(180) NOT NULL,
  dentist VARCHAR(180) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time VARCHAR(20) NOT NULL,
  additional_details TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_appointment_slot (dentist, appointment_date, appointment_time),
  INDEX idx_appointment_date (appointment_date)
);

-- Prescription management tables (also available as database/migrations/001_prescription_system.sql).
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
