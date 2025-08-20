import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '../config.js';

const servers = ['https://chato-app.com'];

servers.push({ url: `http://localhost:${config.port}` });

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Auto Article API',
      version: '1.0.0',
      description:
        'API for categories and articles with multilingual support and scheduled content generation.',
    },
    servers,
    tags: [
      { name: 'Health', description: 'Service health endpoints' },
      { name: 'Categories', description: 'Browse and query categories' },
      { name: 'Articles', description: 'Browse and query articles' },
      { name: 'Generation', description: 'On-demand content generation endpoints' },
    ],
    components: {
      schemas: {
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            env: { type: 'string', example: 'development' },
            timestamp: { type: 'string', format: 'date-time' },
          },
          required: ['status', 'timestamp'],
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
          required: ['error'],
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer', format: 'int64' },
            name: { type: 'string' },
            slug: { type: 'string' },
          },
          required: ['id', 'name', 'slug'],
        },
        Article: {
          type: 'object',
          properties: {
            id: { type: 'integer', format: 'int64' },
            title: { type: 'string' },
            slug: { type: 'string' },
            content: { type: 'string' },
            summary: { type: 'string', nullable: true },
            image_url: { type: 'string', nullable: true },
            language_code: { type: 'string', example: 'en' },
            meta_title: { type: 'string', nullable: true },
            meta_description: { type: 'string', nullable: true },
            canonical_url: { type: 'string', nullable: true },
            reading_time_minutes: { type: 'integer', nullable: true },
            ai_model: { type: 'string', nullable: true },
            ai_prompt: { type: 'string', nullable: true },
            ai_tokens_input: { type: 'integer', nullable: true },
            ai_tokens_output: { type: 'integer', nullable: true },
            total_tokens: { type: 'integer', nullable: true },
            source_url: { type: 'string', nullable: true },
            content_hash: { type: 'string', nullable: true },
            category_id: { type: 'integer', format: 'int64' },
            published_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'title', 'slug', 'content', 'language_code', 'category_id', 'created_at'],
        },
        ApiResponseCategoryList: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
            language: { type: 'string', example: 'en' },
          },
          required: ['data', 'language'],
        },
        ApiResponseArticleList: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Article' } },
            language: { type: 'string', example: 'en' },
          },
          required: ['data', 'language'],
        },
        ApiResponseArticleFullList: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Article' } },
            language: { type: 'string', example: 'en' },
          },
          required: ['data', 'language'],
        },
        GenerationRequest: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              example: 'technology',
              description: 'Category slug for article generation'
            },
          },
          required: ['category'],
        },
        TranslationRequest: {
          type: 'object',
          properties: {
            slug: {
              type: 'string',
              example: 'how-to-fix-computer-wont-start-troubleshooting-guide',
              description: 'Slug of the English article to translate'
            },
            language: {
              type: 'string',
              example: 'de',
              description: 'Target language code (de, fr, es, pt, ar, hi)'
            },
            maxChunks: {
              type: 'integer',
              minimum: 0,
              maximum: 10,
              example: 3,
              description: 'Optional: Maximum number of chunks to split the article into for translation. If not specified, uses the configured default (TRANSLATION_DEFAULT_CHUNK_COUNT). Set to 0 for automatic chunking based on content length, or 1-10 for fixed chunk count. Useful for testing different chunking strategies to optimize translation quality and performance.'
            },
          },
          required: ['slug', 'language'],
        },
        CategoryGenerationDetails: {
          type: 'object',
          properties: {
            category: { type: 'string', example: 'technology' },
            articlesGenerated: { type: 'integer', example: 2 },
            translationsCompleted: { type: 'integer', example: 12 },
            languages: {
              type: 'array',
              items: { type: 'string' },
              example: ['de', 'fr', 'es', 'pt', 'ar', 'hi']
            }
          },
          required: ['category', 'articlesGenerated', 'translationsCompleted', 'languages'],
        },
        GenerationRunResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['complete', 'partial', 'error'],
              example: 'complete'
            },
            message: {
              type: 'string',
              example: 'Generation complete for today'
            },
            details: {
              type: 'object',
              properties: {
                categoriesProcessed: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CategoryGenerationDetails' }
                },
                totalArticlesGenerated: { type: 'integer', example: 6 },
                totalTranslationsCompleted: { type: 'integer', example: 36 },
                executionTimeMs: { type: 'integer', example: 45000 },
                timestamp: { type: 'string', format: 'date-time' }
              },
              required: ['categoriesProcessed', 'totalArticlesGenerated', 'totalTranslationsCompleted', 'executionTimeMs', 'timestamp'],
            }
          },
          required: ['status', 'message', 'details'],
        },
        ApiResponseSingleArticle: {
          type: 'object',
          properties: {
            data: { $ref: '#/components/schemas/Article' },
          },
          required: ['data'],
        },
        ApiResponseGenerationRun: {
          type: 'object',
          properties: {
            data: { $ref: '#/components/schemas/GenerationRunResponse' },
          },
          required: ['data'],
        },
      },
      parameters: {
        AcceptLanguage: {
          name: 'Accept-Language',
          in: 'header',
          description:
            'Preferred language (e.g., en, de, fr). If unsupported, falls back to default.',
          required: false,
          schema: { type: 'string', example: 'en' },
        },
      },
    },
  },
  apis: ['src/**/*.js'],
};

export const openapiSpecification = swaggerJSDoc(options);



