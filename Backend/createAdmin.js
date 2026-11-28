import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './Config/db.js';
import { describeDbError } from './Utils/dbError.js';

const [username, password, roleArg = 'Admin', ...nameParts] = process.argv.slice(2);
const role = /^staff$/i.test(roleArg) ? 'Staff' : 'Admin';
const fullName = nameParts.join(' ') || username;

if (!username || !password || password.length < 8) {
  console.log('Usage: node createAdmin.js <username> <password (8+ chars)> <Admin|Staff> <full name>');
  process.exit(1);
}

try {
  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    `INSERT INTO admins (full_name, username, password_hash, role, active) VALUES (?,?,?,?,1)
     ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), role=VALUES(role), full_name=VALUES(full_name), active=1`,
    [fullName, username.trim(), hash, role]
  );
  console.log(result.affectedRows === 1 ? `Created ${role}: ${username}` : `Updated existing account (password reset): ${username} [${role}]`);
  process.exit(0);
} catch (e) {
  console.error(describeDbError(e)?.message || e.message);
  process.exit(1);
}
