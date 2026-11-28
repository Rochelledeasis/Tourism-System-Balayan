CREATE DATABASE IF NOT EXISTS visit_balayan CHARACTER SET utf8mb4;
USE visit_balayan;

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  operating_days VARCHAR(20) NOT NULL,      -- 0=Sun ... 6=Sat
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  slot_minutes INT NOT NULL DEFAULT 60,
  capacity INT NOT NULL DEFAULT 1,
  break_start TIME NOT NULL DEFAULT '12:00:00',
  break_end TIME NOT NULL DEFAULT '13:00:00',
  active TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS blocked_dates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  date DATE NOT NULL,
  label VARCHAR(60) NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(20) UNIQUE NULL,
  visitor_type ENUM('Citizen','Student','Government','Business') NOT NULL,
  service_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  purpose TEXT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NULL,
  mobile VARCHAR(20) NOT NULL,
  status ENUM('Pending','Confirmed','Rescheduled','Declined','Cancelled','Completed') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slot (service_id, date, time),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- WBS 1.1.3: record ng bawat pagbabago ng status
CREATE TABLE IF NOT EXISTS appointment_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  status ENUM('Pending','Confirmed','Rescheduled','Declined','Cancelled','Completed') NOT NULL,
  title VARCHAR(80) NOT NULL,
  remarks TEXT NULL,
  actor VARCHAR(40) NOT NULL DEFAULT 'Client',   -- 'Client' or 'Tourism Office'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_history (appointment_id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

INSERT INTO services (name, operating_days, open_time, close_time, capacity, active) VALUES
 ('Tourist information & assistance','1,2,3,4,5','08:00:00','17:00:00',5,1),
 ('Tour guide accreditation','2,4','09:00:00','15:00:00',2,1),
 ('Tourism establishment accreditation','1,2,3,4,5','08:00:00','17:00:00',3,1),
 ('Event or venue inquiry','1,2,3,4,5','08:00:00','17:00:00',2,1),
 ('Tourism data or statistics request','3','13:00:00','16:00:00',3,0);

INSERT INTO blocked_dates (service_id, date, label)
SELECT s.id, d.date, d.label FROM services s
JOIN (SELECT '2026-12-08' date,'Holiday' label UNION SELECT '2026-12-24',NULL
      UNION SELECT '2026-12-25','Holiday' UNION SELECT '2026-12-30','Holiday'
      UNION SELECT '2026-12-31',NULL) d;


CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  username VARCHAR(40) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role ENUM('Admin','Staff') NOT NULL DEFAULT 'Staff',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Survey (CSM) responses: dati nasa hiwalay na SurveyBackend, ngayon nasa iisang database na
CREATE TABLE IF NOT EXISTS survey_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_type VARCHAR(100) NOT NULL,
  survey_date DATE NULL,
  sex VARCHAR(20) NULL,
  age INT NULL,
  region VARCHAR(100) NULL,
  service VARCHAR(150) NOT NULL,
  cc1 TEXT NOT NULL,
  cc2 TEXT NULL,
  cc3 TEXT NULL,
  sqd0 TINYINT NOT NULL,
  sqd1 TINYINT NOT NULL,
  sqd2 TINYINT NOT NULL,
  sqd3 TINYINT NOT NULL,
  sqd4 TINYINT NOT NULL,
  sqd5 TINYINT NOT NULL,
  sqd6 TINYINT NOT NULL,
  sqd7 TINYINT NOT NULL,
  sqd8 TINYINT NOT NULL,
  suggestions VARCHAR(1000) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
