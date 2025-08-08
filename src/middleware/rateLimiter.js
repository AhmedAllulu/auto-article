import { RateLimiterMemory } from 'rate-limiter-flexible';
import config from '../config/env.js';

const rateLimiter = new RateLimiterMemory({
  points: config.rateLimit.points,
  duration: config.rateLimit.duration,
});

export function rateLimiterMiddleware(req, res, next) {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => res.status(429).json({ error: 'Too Many Requests' }));
}


