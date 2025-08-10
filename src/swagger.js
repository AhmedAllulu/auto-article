import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auto Article API',
      version: '1.0.0',
      description: 'API for automated article generation and management',
      contact: {
        name: 'API Support',
        email: 'support@auto-article.com'
      }
    },
    servers: [
      {
        url: 'https://chato-app.com:3322',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Admin API token for protected endpoints'
        }
      },
      schemas: {
        Article: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Article ID' },
            title: { type: 'string', description: 'Article title' },
            slug: { type: 'string', description: 'URL-friendly slug' },
            content: { type: 'string', description: 'Article content' },
            excerpt: { type: 'string', description: 'Article excerpt' },
            language_code: { type: 'string', description: 'Language code (e.g., en, es, fr)' },
            category_slug: { type: 'string', description: 'Category slug' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Category ID' },
            name: { type: 'string', description: 'Category name' },
            slug: { type: 'string', description: 'URL-friendly slug' },
            description: { type: 'string', description: 'Category description' },
            article_count: { type: 'integer', description: 'Number of articles in this category for the selected language' }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['HEALTHY', 'WARNING', 'CRITICAL'], description: 'Overall health status' },
            timestamp: { type: 'string', format: 'date-time', description: 'Check timestamp' },
            checks: { type: 'object', description: 'Individual health checks' },
            uptime: { type: 'number', description: 'Server uptime in seconds' }
          }
        },
        BudgetReport: {
          type: 'object',
          properties: {
            currentMonth: { type: 'string', description: 'Current month' },
            totalTokens: { type: 'number', description: 'Total tokens used this month' },
            monthlyCap: { type: 'number', description: 'Monthly token cap' },
            utilization: { type: 'number', description: 'Token utilization percentage' },
            remainingTokens: { type: 'number', description: 'Remaining tokens for the month' },
            dailyAverage: { type: 'number', description: 'Average daily token usage' },
            estimatedCost: { type: 'number', description: 'Estimated monthly cost' }
          }
        },
        GenerationRequest: {
          type: 'object',
          properties: {
            batchSize: { type: 'integer', minimum: 1, maximum: 10, default: 1, description: 'Number of articles to generate' },
            language: { type: 'string', description: 'Specific language to generate for' },
            category: { type: 'string', description: 'Specific category to generate for' },
            forceHighValue: { type: 'boolean', default: false, description: 'Force high-value article generation' }
          }
        },
        GenerationResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Whether generation was successful' },
            generated: { type: 'integer', description: 'Number of articles successfully generated' },
            failed: { type: 'integer', description: 'Number of articles that failed to generate' },
            totalTokens: { type: 'number', description: 'Total tokens used' },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', description: 'Whether this article was generated successfully' },
                  title: { type: 'string', description: 'Generated article title' },
                  language: { type: 'string', description: 'Article language' },
                  tokens: { type: 'number', description: 'Tokens used for this article' }
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' },
            errorId: { type: 'string', description: 'Error ID for tracking' }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/server.js']
};

export const specs = swaggerJsdoc(options);
