DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone VARCHAR(40) NOT NULL,
  city VARCHAR(120) NOT NULL,
  specialty VARCHAR(120),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

INSERT INTO users (role, first_name, last_name, email, password_hash, phone, city, specialty)
VALUES
  ('patient', 'Salim', 'Ben Youssef', 'patient@medirdv.tn', '1f4d8d14ce6a2f5c647efac6ff5a9b10:009b6dbe04e31867343a8872a56cdfd9d8082631cabbeeb84b3d031ae3c4f1ade8d3544317bfacbeb9a8b525b54f53d64ae13cdf4e747d2252409f5e0f6a3e34', '22 111 222', 'Tunis', NULL),
  ('doctor', 'Amine', 'Gharbi', 'doctor@medirdv.tn', '8c1de2250d047afb3de7811ea5d5ee19:02e982391ad1360fb9b684a831cc8eae1a3b9fe566eb68c287409077fadc5a5b1915993fe0f63d72a3a1323105ac8e8baafe7f528fb54c472a573e646ed40136', '55 999 000', 'Tunis', 'Cardiologue');

INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, notes, status)
VALUES
  (1, 2, CURRENT_DATE + INTERVAL '2 day', '09:30', 'Contrôle annuel', 'Apporter les anciens examens', 'pending'),
  (1, 2, CURRENT_DATE + INTERVAL '5 day', '11:00', 'Douleur thoracique légère', 'Patient demande un avis médical', 'confirmed');
