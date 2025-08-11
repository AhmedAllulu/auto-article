import { query } from '../src/db.js';

async function main() {
  // Ensure today's generation job row exists
  await query(
    `INSERT INTO generation_jobs (job_date) VALUES (CURRENT_DATE)
     ON CONFLICT (job_date) DO NOTHING`
  );
  console.log('Migration seed completed.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


