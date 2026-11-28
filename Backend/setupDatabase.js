import 'dotenv/config';
import mysql from 'mysql2/promise';

const DB = process.env.DB_NAME || 'visit_balayan';
const STATUSES = ['Pending', 'Confirmed', 'Rescheduled', 'Declined', 'Cancelled', 'Completed'];
const VISITOR_TYPES = ['Citizen', 'Student', 'Government', 'Business'];
const TABLES = ['services', 'blocked_dates', 'appointments', 'appointment_history', 'admins', 'survey_responses'];
const importFrom = (process.argv.find((a) => a.startsWith('--import-from=')) || '').split('=')[1];

let conn;
try {
  conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? '',
  });
} catch (e) {
  console.error(`Cannot connect to MySQL (${e.code || e.message}). Start MySQL in XAMPP and check DB_USER / DB_PASSWORD in Backend/.env.`);
  process.exit(1);
}

const q = (sql, params) => conn.query(sql, params);
const tableExists = async (db, name) =>
  (await q('SELECT COUNT(*) c FROM information_schema.tables WHERE table_schema=? AND table_name=?', [db, name]))[0][0].c > 0;
const columns = async (db, table) =>
  (await q('SELECT column_name n, column_type t FROM information_schema.columns WHERE table_schema=? AND table_name=? ORDER BY ordinal_position', [db, table]))[0]
    .map((r) => ({ name: r.n, type: r.t }));
const columnMap = async (db, table) => Object.fromEntries((await columns(db, table)).map((c) => [c.name.toLowerCase(), c.type]));
const ensureColumn = async (table, cols, name, definition) => {
  if (cols[name]) return;
  await q(`ALTER TABLE \`${table}\` ADD COLUMN ${name} ${definition}`);
  console.log(`  + added ${table}.${name}`);
};

await q(`CREATE DATABASE IF NOT EXISTS \`${DB}\` CHARACTER SET utf8mb4`);
await q(`USE \`${DB}\``);
console.log(`Database: ${DB}`);

const servicesWasNew = !(await tableExists(DB, 'services'));
const statusList = STATUSES.map((s) => `'${s}'`).join(',');

// ---- services ----
await q(`CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  operating_days VARCHAR(20) NOT NULL,
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  slot_minutes INT NOT NULL DEFAULT 60,
  capacity INT NOT NULL DEFAULT 1,
  break_start TIME NOT NULL DEFAULT '12:00:00',
  break_end TIME NOT NULL DEFAULT '13:00:00',
  active TINYINT(1) NOT NULL DEFAULT 1
)`);
{
  const c = await columnMap(DB, 'services');
  await ensureColumn('services', c, 'slot_minutes', 'INT NOT NULL DEFAULT 60');
  await ensureColumn('services', c, 'capacity', 'INT NOT NULL DEFAULT 1');
  await ensureColumn('services', c, 'break_start', "TIME NOT NULL DEFAULT '12:00:00'");
  await ensureColumn('services', c, 'break_end', "TIME NOT NULL DEFAULT '13:00:00'");
  await ensureColumn('services', c, 'active', 'TINYINT(1) NOT NULL DEFAULT 1');
}

// ---- blocked_dates ----
await q(`CREATE TABLE IF NOT EXISTS blocked_dates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  date DATE NOT NULL,
  label VARCHAR(60) NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
)`);

// ---- appointments ----
const statusColumn = `ENUM(${statusList}) NOT NULL DEFAULT 'Pending'`;
await q(`CREATE TABLE IF NOT EXISTS appointments (
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
  status ${statusColumn},
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slot (service_id, date, time),
  FOREIGN KEY (service_id) REFERENCES services(id)
)`);
{
  const c = await columnMap(DB, 'appointments');
  await ensureColumn('appointments', c, 'reference', 'VARCHAR(20) NULL');
  await ensureColumn('appointments', c, 'email', 'VARCHAR(120) NULL');
  await ensureColumn('appointments', c, 'status', statusColumn);
  await ensureColumn('appointments', c, 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  const fresh = await columnMap(DB, 'appointments');
  // Kailangan ng admin ang Declined / Cancelled / Completed na status
  if (fresh.status?.toLowerCase().startsWith('enum(') && STATUSES.some((s) => !fresh.status.includes(`'${s}'`))) {
    await q(`ALTER TABLE appointments MODIFY status ${statusColumn}`);
    console.log('  ~ appointments.status now accepts all statuses');
  }
  if (fresh.visitor_type?.toLowerCase().startsWith('enum(') && VISITOR_TYPES.some((v) => !fresh.visitor_type.includes(`'${v}'`))) {
    await q("ALTER TABLE appointments MODIFY visitor_type VARCHAR(30) NOT NULL DEFAULT 'Citizen'");
    console.log('  ~ appointments.visitor_type is now VARCHAR(30)');
  }
}

// ---- appointment_history ----
await q(`CREATE TABLE IF NOT EXISTS appointment_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  status ENUM(${statusList}) NOT NULL,
  title VARCHAR(80) NOT NULL,
  remarks TEXT NULL,
  actor VARCHAR(40) NOT NULL DEFAULT 'Client',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_history (appointment_id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
)`);

// ---- admins ----
await q(`CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  username VARCHAR(40) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin','Staff') NOT NULL DEFAULT 'Staff',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);
{
  const c = await columnMap(DB, 'admins');
  await ensureColumn('admins', c, 'active', 'TINYINT(1) NOT NULL DEFAULT 1');
}

// ---- survey_responses (dati ay nasa hiwalay na SurveyBackend) ----
await q(`CREATE TABLE IF NOT EXISTS survey_responses (
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
)`);

// Sample na services/blocked dates (galing sa schema.sql) para sa bagong database lang
if (servicesWasNew) {
  await q(`INSERT INTO services (name, operating_days, open_time, close_time, capacity, active) VALUES
    ('Tourist information & assistance','1,2,3,4,5','08:00:00','17:00:00',5,1),
    ('Tour guide accreditation','2,4','09:00:00','15:00:00',2,1),
    ('Tourism establishment accreditation','1,2,3,4,5','08:00:00','17:00:00',3,1),
    ('Event or venue inquiry','1,2,3,4,5','08:00:00','17:00:00',2,1),
    ('Tourism data or statistics request','3','13:00:00','16:00:00',3,0)`);
  await q(`INSERT INTO blocked_dates (service_id, date, label)
    SELECT s.id, d.date, d.label FROM services s
    JOIN (SELECT '2026-12-08' date,'Holiday' label UNION SELECT '2026-12-24',NULL
          UNION SELECT '2026-12-25','Holiday' UNION SELECT '2026-12-30','Holiday'
          UNION SELECT '2026-12-31',NULL) d`);
  console.log('  + added starter services (edit them in Admin > Services & availability)');
}

// ---- opsyonal: kopyahin ang data mula sa ibang database (hal. lumang tourismdb) ----
if (importFrom) {
  if (importFrom.toLowerCase() === DB.toLowerCase()) {
    console.log(`\nSkipped import: "${importFrom}" is the same database as DB_NAME.`);
  } else {
    console.log(`\nImporting data from "${importFrom}" into "${DB}" (existing rows are kept)...`);
    await q('SET FOREIGN_KEY_CHECKS=0');
    for (const t of TABLES) {
      if (!(await tableExists(importFrom, t))) continue;
      const source = new Set((await columns(importFrom, t)).map((c) => c.name.toLowerCase()));
      const common = (await columns(DB, t)).map((c) => c.name).filter((n) => source.has(n.toLowerCase()));
      if (!common.length) continue;
      const list = common.map((n) => `\`${n}\``).join(',');
      try {
        const [r] = await q(`INSERT IGNORE INTO \`${DB}\`.\`${t}\` (${list}) SELECT ${list} FROM \`${importFrom}\`.\`${t}\``);
        console.log(`  ${t}: ${r.affectedRows} row(s) copied`);
      } catch (e) {
        console.log(`  ${t}: skipped (${e.code || e.message})`);
      }
    }
    await q('SET FOREIGN_KEY_CHECKS=1');
  }
}

console.log('\nTables:');
for (const t of TABLES) {
  const ok = await tableExists(DB, t);
  const count = ok ? (await q(`SELECT COUNT(*) c FROM \`${t}\``))[0][0].c : 0;
  console.log(`  ${ok ? 'OK     ' : 'MISSING'} ${t}${ok ? ` (${count} rows)` : ''}`);
}

// Paalala kung may ibang database na may data pa (hal. dating hiwalay na backend)
if (!importFrom) {
  for (const other of ['tourismdb', 'visit_balayan']) {
    if (other.toLowerCase() === DB.toLowerCase() || !(await q('SELECT 1 FROM information_schema.schemata WHERE schema_name=?', [other]))[0].length) continue;
    const withRows = [];
    for (const t of TABLES) {
      if (await tableExists(other, t)) {
        const n = (await q(`SELECT COUNT(*) c FROM \`${other}\`.\`${t}\``))[0][0].c;
        if (n > 0) withRows.push(`${t} (${n})`);
      }
    }
    if (withRows.length) {
      console.log(`\nNote: database "${other}" also has data: ${withRows.join(', ')}.`);
      console.log(`To copy it into "${DB}": npm run setup -- --import-from=${other}`);
    }
  }
}

const [[adm]] = await q('SELECT COUNT(*) c FROM admins WHERE active=1');
if (!adm.c) console.log('\nNext: node createAdmin.js <username> <password> Admin "<Full Name>"');

await conn.end();
