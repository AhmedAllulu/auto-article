import express from 'express';
import { query } from '../db.js';

const router = express.Router();

/**
 * @openapi
 * /jobs/today:
 *   get:
 *     tags: [Jobs]
 *     summary: Get statistics for today’s generation job
 *     responses:
 *       '200':
 *         description: Today stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     job:
 *                       type: object
 *                     totals:
 *                       type: object
 *                       properties:
 *                         masters:
 *                           type: integer
 *                         translations:
 *                           type: integer
 *                         tokens_input:
 *                           type: integer
 *                         tokens_output:
 *                           type: integer
 *                         total_tokens:
 *                           type: integer
 *       '500':
 *         description: Failed to load stats
 */
router.get('/today', async (_req, res) => {
  try {
    // Today's job row
    const { rows: jobRows } = await query(
      `SELECT * FROM generation_jobs WHERE job_date = CURRENT_DATE LIMIT 1`
    );
    const job = jobRows[0] || null;

    // Counts for masters and translations published today
    const { rows: mastersRows } = await query(
      `SELECT COUNT(*)::int AS count FROM articles_en WHERE published_at::date = CURRENT_DATE`
    );
    const masters = mastersRows[0]?.count || 0;

    // Count translations from all language-specific tables except English
    const { rows: transRows } = await query(
      `SELECT COUNT(*)::int AS count FROM (
        SELECT 1 FROM articles_de WHERE published_at::date = CURRENT_DATE
        UNION ALL
        SELECT 1 FROM articles_fr WHERE published_at::date = CURRENT_DATE
        UNION ALL
        SELECT 1 FROM articles_es WHERE published_at::date = CURRENT_DATE
        UNION ALL
        SELECT 1 FROM articles_pt WHERE published_at::date = CURRENT_DATE
        UNION ALL
        SELECT 1 FROM articles_ar WHERE published_at::date = CURRENT_DATE
        UNION ALL
        SELECT 1 FROM articles_hi WHERE published_at::date = CURRENT_DATE
      ) AS translations`
    );
    const translations = transRows[0]?.count || 0;

    // Token usage for today
    const { rows: tokRows } = await query(
      `SELECT tokens_input, tokens_output FROM token_usage WHERE day = CURRENT_DATE`
    );
    const tokens_input = Number(tokRows[0]?.tokens_input || 0);
    const tokens_output = Number(tokRows[0]?.tokens_output || 0);

    res.json({
      data: {
        job,
        totals: {
          masters,
          translations,
          tokens_input,
          tokens_output,
          total_tokens: tokens_input + tokens_output,
        },
      },
    });
  } catch (err) {
    console.error('Failed to fetch today job stats', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

export default router;
