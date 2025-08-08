import { query } from '../db/pool.js';

export async function upsertDailyJobTarget({ day, target }) {
  await query(
    `INSERT INTO generation_jobs (job_date, status, num_articles_target, num_articles_generated)
     VALUES ($1, 'scheduled', $2, 0)
     ON CONFLICT (job_date) DO NOTHING`,
    [day, target]
  );
}

export async function incrementJobProgress({ day, count }) {
  await query(
    `UPDATE generation_jobs SET num_articles_generated = num_articles_generated + $2
     WHERE job_date = $1`,
    [day, count]
  );
}

export async function getJobForDay(day) {
  const { rows } = await query(
    `SELECT * FROM generation_jobs WHERE job_date = $1 LIMIT 1`,
    [day]
  );
  return rows[0] || null;
}


