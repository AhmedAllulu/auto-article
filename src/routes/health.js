import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /v1/health:
 *   get:
 *     summary: Health check
 *     description: Basic health check endpoint for the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   description: Health status
 *                 time:
 *                   type: string
 *                   format: date-time
 *                   description: Current server time
 */
router.get('/', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

export default router;


