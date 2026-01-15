const express = require('express');
const { specs, uiOptions, swaggerUi } = require('../config/swagger');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

/**
 * Routes de documentation API Swagger/OpenAPI
 */

// Documentation Swagger UI (publique)
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(specs, uiOptions));

// Spécification OpenAPI JSON (publique)
router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Documentation OpenAPI YAML (publique)
router.get('/yaml', (req, res) => {
  const yaml = require('js-yaml');
  const yamlSpec = yaml.dump(specs, {
    indent: 2,
    lineWidth: 120,
    noRefs: true
  });
  
  res.setHeader('Content-Type', 'application/x-yaml');
  res.send(yamlSpec);
});

// Documentation pour les développeurs (protégée)
router.get('/developer', 
  authenticate, 
  requirePermission('developer.docs.read'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Developer documentation access granted',
      data: {
        endpoints: {
          swagger_ui: '/docs',
          openapi_json: '/docs/json',
          openapi_yaml: '/docs/yaml',
          postman_collection: '/docs/postman',
          api_examples: '/docs/examples'
        },
        authentication: {
          type: 'Bearer JWT',
          description: 'Include JWT token in Authorization header',
          example: 'Authorization: Bearer <your_jwt_token>'
        },
        rate_limiting: {
          enabled: true,
          limits: {
            global: '100 requests per 15 minutes',
            auth: '5 requests per minute per IP',
            brute_force: '5 attempts per 15 minutes'
          }
        },
        security: {
          input_validation: true,
          sql_injection_protection: true,
          xss_protection: true,
          csrf_protection: true,
          rate_limiting: true,
          brute_force_protection: true
        }
      }
    });
  }
);

// Export Postman collection (protégé)
router.get('/postman', 
  authenticate, 
  requirePermission('developer.docs.read'),
  (req, res) => {
    const collection = {
      info: {
        name: 'Event Planner Auth API',
        description: 'Collection Postman pour l\'API Event Planner Auth',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'Authentication',
          item: [
            {
              name: 'Login',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/json'
                  }
                ],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    email: 'user@example.com',
                    password: 'password123'
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/auth/login',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'auth', 'login']
                }
              }
            },
            {
              name: 'Refresh Token',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/json'
                  }
                ],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    refreshToken: '{{refreshToken}}'
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/auth/refresh',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'auth', 'refresh']
                }
              }
            }
          ]
        },
        {
          name: 'Users',
          item: [
            {
              name: 'Get Current User',
              request: {
                method: 'GET',
                header: [
                  {
                    key: 'Authorization',
                    value: 'Bearer {{accessToken}}'
                  }
                ],
                url: {
                  raw: '{{baseUrl}}/api/users/me',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'users', 'me']
                }
              }
            }
          ]
        },
        {
          name: 'Health',
          item: [
            {
              name: 'Basic Health Check',
              request: {
                method: 'GET',
                url: {
                  raw: '{{baseUrl}}/health',
                  host: ['{{baseUrl}}'],
                  path: ['health']
                }
              }
            },
            {
              name: 'Detailed Health Check',
              request: {
                method: 'GET',
                url: {
                  raw: '{{baseUrl}}/health/detailed',
                  host: ['{{baseUrl}}'],
                  path: ['health', 'detailed']
                }
              }
            }
          ]
        }
      ],
      variable: [
        {
          key: 'baseUrl',
          value: 'http://localhost:3000',
          type: 'string'
        },
        {
          key: 'accessToken',
          value: '',
          type: 'string'
        },
        {
          key: 'refreshToken',
          value: '',
          type: 'string'
        }
      ]
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="event-planner-auth-api.postman_collection.json"');
    res.send(collection);
  }
);

// Exemples d'utilisation (protégé)
router.get('/examples', 
  authenticate, 
  requirePermission('developer.docs.read'),
  (req, res) => {
    const examples = {
      authentication: {
        login: {
          description: 'Authentification avec email et mot de passe',
          request: {
            method: 'POST',
            url: '/api/auth/login',
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              email: 'user@example.com',
              password: 'password123'
            }
          },
          response: {
            success: true,
            message: 'Authentication successful',
            data: {
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              refreshToken: 'def50200...',
              expiresIn: 86400,
              user: {
                id: 1,
                email: 'user@example.com',
                username: 'user',
                status: 'active'
              }
            }
          }
        },
        protected_request: {
          description: 'Requête protégée avec JWT',
          request: {
            method: 'GET',
            url: '/api/users/me',
            headers: {
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
          },
          response: {
            success: true,
            message: 'User retrieved successfully',
            data: {
              id: 1,
              email: 'user@example.com',
              username: 'user',
              first_name: 'John',
              last_name: 'Doe',
              status: 'active'
            }
          }
        }
      },
      error_handling: {
        validation_error: {
          description: 'Erreur de validation',
          request: {
            method: 'POST',
            url: '/api/auth/login',
            body: {
              email: 'invalid-email',
              password: ''
            }
          },
          response: {
            success: false,
            message: 'Validation failed',
            errors: [
              {
                field: 'email',
                message: 'Invalid email format'
              },
              {
                field: 'password',
                message: 'Password is required'
              }
            ]
          }
        },
        authentication_error: {
          description: 'Erreur d\'authentification',
          request: {
            method: 'POST',
            url: '/api/auth/login',
            body: {
              email: 'user@example.com',
              password: 'wrongpassword'
            }
          },
          response: {
            success: false,
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
          }
        },
        rate_limit_error: {
          description: 'Erreur de rate limiting',
          request: {
            method: 'POST',
            url: '/api/auth/login',
            body: {
              email: 'user@example.com',
              password: 'password123'
            }
          },
          response: {
            success: false,
            message: 'Too many attempts - Please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: 900
          }
        }
      },
      security_examples: {
        sql_injection_blocked: {
          description: 'Tentative d\'injection SQL bloquée',
          request: {
            method: 'POST',
            url: '/api/auth/login',
            body: {
              email: "user@example.com'; DROP TABLE users; --",
              password: 'password123'
            }
          },
          response: {
            success: false,
            message: 'Invalid content detected',
            code: 'CONTENT_VALIDATION_FAILED',
            violations: [
              {
                field: 'email',
                violation: 'dangerous_content',
                pattern: '/(\\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\\b)/gi'
              }
            ]
          }
        },
        xss_blocked: {
          description: 'Tentative XSS bloquée',
          request: {
            method: 'POST',
            url: '/api/users/profile',
            headers: {
              'Authorization': 'Bearer <token>'
            },
            body: {
              bio: '<script>alert("xss")</script>'
            }
          },
          response: {
            success: false,
            message: 'Invalid content detected',
            code: 'CONTENT_VALIDATION_FAILED',
            violations: [
              {
                field: 'bio',
                violation: 'dangerous_content',
                pattern: '/<script[^>]*>.*?<\\/script>/gi'
              }
            ]
          }
        }
      }
    };

    res.json({
      success: true,
      message: 'API examples retrieved successfully',
      data: examples
    });
  }
);

module.exports = router;
