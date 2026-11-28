-- Para sa database na nagawa na gamit ang lumang schema.sql (WBS 1.1.3).
-- Patakbuhin nang isang beses: mysql -u root -p visit_balayan < migration_1.1.3.sql
USE visit_balayan;

CREATE TABLE IF NOT EXISTS appointment_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  status ENUM('Pending','Confirmed','Rescheduled','Declined','Cancelled','Completed') NOT NULL,
  title VARCHAR(80) NOT NULL,
  remarks TEXT NULL,
  actor VARCHAR(40) NOT NULL DEFAULT 'Client',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_history (appointment_id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

-- Bigyan ng "Request submitted" na entry ang mga dati nang appointment
INSERT INTO appointment_history (appointment_id, status, title, remarks, actor, created_at)
SELECT a.id, 'Pending', 'Request submitted', 'Status set to Pending.', 'Client', a.created_at
FROM appointments a
WHERE NOT EXISTS (SELECT 1 FROM appointment_history h WHERE h.appointment_id = a.id);
