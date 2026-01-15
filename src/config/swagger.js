const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * Configuration Swagger/OpenAPI pour la documentation de l'API
 * Génère automatiquement la documentation à partir des commentaires JSDoc
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Planner Auth API',
      version: '1.0.0',
      description: `
        API d'authentification et d'autorisation pour Event Planner.
        
        ## Fonctionnalités
        - Authentification multi-méthodes (email/password, OTP)
        - Gestion des utilisateurs et rôles
        - Contrôle d'accès basé sur les permissions (RBAC)
        - Sécurité avancée avec détection d'attaques
        - Monitoring et métriques en temps réel
        
        ## Sécurité
        - JWT tokens avec refresh tokens
        - Rate limiting et protection brute force
        - Détection automatique d'attaques (SQL injection, XSS, etc.)
        - Sanitisation des entrées
        - Headers de sécurité enrichis
        
        ## Monitoring
        - Health checks détaillés
        - Métriques Prometheus
        - Logs structurés
        - Dashboard de monitoring
      `,
      contact: {
        name: 'API Support',
        email: 'support@eventplanner.com',
        url: 'https://eventplanner.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement'
      },
      {
        url: 'https://api.eventplanner.com',
        description: 'Serveur de production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT d\'authentification'
        }
      },
      schemas: {
        /**
         * Réponse standard de l'API
         */
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indique si la requête a réussi'
            },
            message: {
              type: 'string',
              description: 'Message décrivant le résultat'
            },
            data: {
              type: 'object',
              description: 'Données de réponse (si applicable)'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp de la réponse'
            }
          }
        },
        
        /**
         * Erreur de validation
         */
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Validation failed'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Champ concerné'
                  },
                  message: {
                    type: 'string',
                    description: 'Message d\'erreur'
                  }
                }
              }
            }
          }
        },
        
        /**
         * Utilisateur
         */
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique de l\'utilisateur'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email de l\'utilisateur'
            },
            username: {
              type: 'string',
              description: 'Nom d\'utilisateur'
            },
            first_name: {
              type: 'string',
              description: 'Prénom'
            },
            last_name: {
              type: 'string',
              description: 'Nom de famille'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'locked'],
              description: 'Statut du compte'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date de dernière mise à jour'
            }
          }
        },
        
        /**
         * Token d'authentification
         */
        AuthToken: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'Token JWT d\'accès'
            },
            refreshToken: {
              type: 'string',
              description: 'Token de rafraîchissement'
            },
            expiresIn: {
              type: 'integer',
              description: 'Durée de vie du token en secondes'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        
        /**
         * Permission
         */
        Permission: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID de la permission'
            },
            code: {
              type: 'string',
              description: 'Code unique de la permission'
            },
            label: {
              type: 'object',
              description: 'Libellé multilingue'
            },
            description: {
              type: 'object',
              description: 'Description multilingue'
            },
            module: {
              type: 'string',
              description: 'Module associé'
            }
          }
        },
        
        /**
         * Rôle
         */
        Role: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID du rôle'
            },
            code: {
              type: 'string',
              description: 'Code unique du rôle'
            },
            label: {
              type: 'object',
              description: 'Libellé multilingue'
            },
            description: {
              type: 'object',
              description: 'Description multilingue'
            },
            is_system: {
              type: 'boolean',
              description: 'Indique si c\'est un rôle système'
            },
            permissions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Permission'
              },
              description: 'Permissions associées'
            }
          }
        },
        
        /**
         * Health Check Response
         */
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['OK', 'WARNING', 'ERROR'],
              description: 'Statut de santé'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp du check'
            },
            uptime: {
              type: 'integer',
              description: 'Uptime en secondes'
            },
            environment: {
              type: 'string',
              description: 'Environnement'
            },
            checks: {
              type: 'object',
              description: 'Résultats des vérifications détaillées'
            }
          }
        },
        
        /**
         * Metrics Response
         */
        MetricsResponse: {
          type: 'object',
          properties: {
            connected: {
              type: 'boolean',
              description: 'État de connexion'
            },
            keys: {
              type: 'integer',
              description: 'Nombre de clés'
            },
            memory: {
              type: 'string',
              description: 'Mémoire utilisée'
            },
            uptime: {
              type: 'string',
              description: 'Uptime'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Opérations d\'authentification et de gestion des sessions'
      },
      {
        name: 'Users',
        description: 'Gestion des utilisateurs'
      },
      {
        name: 'Roles',
        description: 'Gestion des rôles et permissions'
      },
      {
        name: 'People',
        description: 'Données publiques des personnes'
      },
      {
        name: 'Health',
        description: 'Health checks et monitoring'
      },
      {
        name: 'Metrics',
        description: 'Métriques et monitoring avancé'
      },
      {
        name: 'Security',
        description: 'Informations sur la sécurité et les attaques détectées'
      }
    ]
  },
  apis: [
    './src/modules/auth/auth.routes.js',
    './src/modules/users/users.routes.js',
    './src/modules/roles/roles.routes.js',
    './src/modules/people/people.routes.js',
    './src/health/health.routes.js',
    './src/metrics/metrics.routes.js',
    './src/app.js'
  ]
};

/**
 * Génère la spécification Swagger/OpenAPI
 */
const specs = swaggerJsdoc(swaggerOptions);

/**
 * Options pour l'interface Swagger UI
 */
const uiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    tryItOutEnabled: true,
    requestInterceptor: (request) => {
      // Ajouter automatiquement le token d'authentification
      const token = localStorage.getItem('jwt_token');
      if (token) {
        request.headers.Authorization = `Bearer ${token}`;
      }
      return request;
    },
    responseInterceptor: (response) => {
      // Logger les réponses pour debugging
      console.log('Swagger Response:', response);
      return response;
    }
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .scheme-container { margin: 20px 0 }
    .swagger-ui .opblock { margin: 10px 0 }
    .swagger-ui .opblock .opblock-summary { 
      border-radius: 4px;
      background: #4CAF50;
      color: white;
    }
    .swagger-ui .opblock.opblock-post { 
      border-color: #4CAF50;
      background: #4CAF50;
    }
    .swagger-ui .opblock.opblock-get { 
      border-color: #61affe;
      background: #61affe;
    }
    .swagger-ui .opblock.opblock-put { 
      border-color: #fca130;
      background: #fca130;
    }
    .swagger-ui .opblock.opblock-delete { 
      border-color: #f93e3e;
      background: #f93e3e;
    }
  `,
  customSiteTitle: 'Event Planner Auth API Documentation'
};

module.exports = {
  specs,
  uiOptions,
  swaggerUi
};
