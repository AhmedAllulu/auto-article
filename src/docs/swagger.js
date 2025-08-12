import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '../config.js';

const servers = [];
if (config.seo?.canonicalBaseUrl) {
  servers.push({ url: config.seo.canonicalBaseUrl });
}
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
            summary: { type: 'string', nullable: true },
            image_url: { type: 'string', nullable: true },
            language_code: { type: 'string', example: 'en' },
            meta_title: { type: 'string', nullable: true },
            meta_description: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'title', 'slug', 'language_code', 'created_at'],
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



