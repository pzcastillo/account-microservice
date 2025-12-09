const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Account Management Microservice',
      version: '1.0.0',
      description: `Account Management Microservice with Multi-Tenant RBAC and Employee ID Support`
    },
    servers: [
      { url: 'http://localhost:3000/api', description: 'Local API' },
      { url: 'https://api.yourcompany.com/accounts', description: 'Production' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /auth/login'
        }
      },
      schemas: {
        Account: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Internal surrogate key' },
            emp_id: { type: 'string', example: 'EMP00123', description: 'Business employee ID (unique per company)' },
            fullname: { type: 'string', example: 'John Doe' },
            username: { type: 'string', example: 'john.doe' },
            email: { type: 'string', format: 'email', example: 'john@company.com' },
            department_id: { type: 'string', format: 'uuid', nullable: true },
            role_id: { type: 'string', format: 'uuid', nullable: true },
            user_type_id: { type: 'string', format: 'uuid', nullable: true },
            status: { type: 'string', enum: ['active', 'disabled', 'inactive'], default: 'active' },
            comp_code: { type: 'string', example: 'ACME' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateAccountRequest: {
          type: 'object',
          required: ['emp_id', 'fullname', 'username', 'email', 'password'],
          properties: {
            emp_id: { type: 'string', pattern: '^[A-Z0-9\\-_]+$', example: 'EMP00123' },
            fullname: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password', minLength: 8 },
            department_id: { type: 'string', format: 'uuid', nullable: true },
            role_id: { type: 'string', format: 'uuid', nullable: true },
            user_type_id: { type: 'string', format: 'uuid', nullable: true }
          }
        },
        UpdateAccountRequest: {
          type: 'object',
          properties: {
            emp_id: { type: 'string', pattern: '^[A-Z0-9\\-_]+$', example: 'EMP00999' },
            fullname: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password', minLength: 8 },
            department_id: { type: 'string', format: 'uuid', nullable: true },
            role_id: { type: 'string', format: 'uuid', nullable: true },
            user_type_id: { type: 'string', format: 'uuid', nullable: true },
            status: { type: 'string', enum: ['active', 'disabled', 'inactive'] }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const spec = swaggerJSDoc(options);

function setupSwagger(app) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true
    },
    customCss: '.swagger-ui .topbar { background-color: #2c3e50; }',
    customSiteTitle: 'Accounts Microservice API'
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(spec);
  });

  console.log('Swagger UI available at http://localhost:3000/docs');
}

module.exports = setupSwagger;