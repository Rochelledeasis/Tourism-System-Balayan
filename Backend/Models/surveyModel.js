// Models: SQL queries lang para sa survey_responses.
import { pool } from '../Config/db.js';

export const insertResponse = async (values) =>
  (await pool.query(
    `INSERT INTO survey_responses
      (client_type, survey_date, sex, age, region, service, cc1, cc2, cc3,
       sqd0, sqd1, sqd2, sqd3, sqd4, sqd5, sqd6, sqd7, sqd8, suggestions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    values
  ))[0].insertId;

export const listResponses = async (clause = '', params = []) =>
  (await pool.query(`SELECT * FROM survey_responses ${clause} ORDER BY id DESC`, params))[0];

export const findResponse = async (id) =>
  (await pool.query('SELECT * FROM survey_responses WHERE id = ?', [id]))[0][0] || null;
