import { query } from '../db/pool.js';

export async function recordTokenUsage({ day, tokensInput, tokensOutput }) {
  await query(
    `INSERT INTO token_usage (day, tokens_input, tokens_output)
     VALUES ($1, $2, $3)
     ON CONFLICT (day) DO UPDATE SET
       tokens_input = token_usage.tokens_input + EXCLUDED.tokens_input,
       tokens_output = token_usage.tokens_output + EXCLUDED.tokens_output`,
    [day, tokensInput, tokensOutput]
  );
}

export async function getMonthlyTokenUsage(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const { rows } = await query(
    `SELECT COALESCE(SUM(tokens_input + tokens_output), 0) AS total
     FROM token_usage WHERE day >= $1 AND day < $2`,
    [start, end]
  );
  return Number(rows[0]?.total || 0);
}


