## Auto Article Backend

Node.js + Express + PostgreSQL backend for automated, SEO-friendly multi-language articles.

### Features
- 7 languages (default: en, es, de, fr, ar, hi, pt)
- Categories (default: technology, finance, health, sports, entertainment, travel, business)
- AI-driven article generation (1min.AI client), 100/day scheduler
- Monthly token cap enforcement (default 4,000,000)
- SEO-ready article schema (meta, OpenGraph, Twitter)
- Public endpoints only with rate limiting

### Environment
Set the following env vars (example values):

```
PORT=8080
DATABASE_URL=postgres://user:pass@localhost:5432/auto_article
ONE_MIN_AI_API_KEY=your_key_here
ONE_MIN_AI_BASE_URL=https://api.1min.ai
DAILY_ARTICLE_TARGET=100
MONTHLY_TOKEN_CAP=4000000
SUPPORTED_LANGUAGES=en,es,de,fr,ar,hi,pt
TOP_CATEGORIES=technology,finance,health,sports,entertainment,travel,business
RATE_LIMIT_POINTS=300
RATE_LIMIT_DURATION=60
```

### Scripts
- `npm run migrate` – create tables and seed categories
- `npm run dev` – start API and scheduler

### API
- GET `/v1/health`
- GET `/v1/categories`
- GET `/v1/articles?language=en&category=technology&search=ai&page=1&pageSize=20`
- GET `/v1/articles/:slug`

### Notes
- Without `ONE_MIN_AI_API_KEY`, the generator uses a mock response to keep the system runnable.
- Scheduler runs every 15 minutes, generating a small batch while respecting token caps and daily targets.


# auto-article
