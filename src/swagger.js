import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.1',
    info: {
      title: 'Auto Article API',
      version: '1.0.0',
      description: 'API documentation for Auto Article service',
    },
    servers: [
      { url: '/', description: 'Current server' },
    ],
    components: {
      schemas: {
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            slug: { type: 'string' },
          },
          required: ['id', 'name', 'slug'],
        },
        ArticleSummary: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            slug: { type: 'string' },
            summary: { type: 'string' },
            image_url: { type: 'string', nullable: true, description: 'Public image URL', format: 'uri' },
            language_code: { type: 'string' },
            meta_title: { type: 'string', nullable: true },
            meta_description: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'title', 'slug', 'language_code', 'created_at'],
        },
      },
    },
  },
  // Looks for configuration in source files.
  apis: ['./src/server.js', './src/routes/*.js'],
};

export const swaggerSpec = swaggerJSDoc(options);


