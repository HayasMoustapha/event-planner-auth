# 📁 ARBORESCENCE COMPLÈTE - EVENT PLANNER AUTH SERVICE

## 🎯 Vue d'ensemble

Le **Auth Service** est le service central d'authentification et d'autorisation de la plateforme Event Planner SaaS. Il gère les identités, les permissions, les rôles et les sessions.

```
📁 event-planner-auth/
├── 📁 src/                    # Code source principal
├── 📁 database/               # Gestion base de données
├── 📁 tests/                  # Tests automatisés
├── 📁 docs/                   # Documentation
├── 📁 postman/                # Collections API
├── 📁 scripts/                # Scripts utilitaires
├── 📁 logs/                   # Logs applicatifs
├── 📁 tmp/                    # Fichiers temporaires
└── 📄 Configuration files     # Fichiers de config
```

---

## 📁 DÉTAIL DE L'ARBORESCENCE

### 📁 src/ - Code source principal

```
📁 src/
├── 📁 config/                 # Configuration application
│   ├── 📄 database.js         # Configuration BDD
│   ├── 📄 redis.js            # Configuration Redis
│   ├── 📄 jwt.js              # Configuration JWT
│   └── 📄 index.js            # Configuration principale
│
├── 📁 modules/                # Modules métier
│   ├── 📁 auth/               # Module authentification
│   │   ├── 📄 auth.controller.js
│   │   ├── 📄 auth.service.js
│   │   ├── 📄 auth.routes.js
│   │   └── 📄 auth.middleware.js
│   │
│   ├── 📁 users/              # Gestion utilisateurs
│   │   ├── 📄 users.controller.js
│   │   ├── 📄 users.service.js
│   │   ├── 📄 users.routes.js
│   │   └── 📄 users.model.js
│   │
│   ├── 📁 roles/              # Gestion rôles
│   │   ├── 📄 roles.controller.js
│   │   ├── 📄 roles.service.js
│   │   └── 📄 roles.routes.js
│   │
│   ├── 📁 permissions/        # Gestion permissions
│   │   ├── 📄 permissions.controller.js
│   │   ├── 📄 permissions.service.js
│   │   └── 📄 permissions.routes.js
│   │
│   ├── 📁 sessions/           # Gestion sessions
│   │   ├── 📄 sessions.controller.js
│   │   ├── 📄 sessions.service.js
│   │   └── 📄 sessions.routes.js
│   │
│   ├── 📁 passwords/          # Gestion mots de passe
│   │   ├── 📄 passwords.controller.js
│   │   ├── 📄 passwords.service.js
│   │   └── 📄 passwords.routes.js
│   │
│   ├── 📁 oauth/              # OAuth2 integration
│   │   ├── 📄 oauth.controller.js
│   │   ├── 📄 oauth.service.js
│   │   └── 📄 oauth.routes.js
│   │
│   ├── 📁 menus/              # Gestion menus
│   │   ├── 📄 menus.controller.js
│   │   ├── 📄 menus.service.js
│   │   └── 📄 menus.routes.js
│   │
│   ├── 📁 accesses/           # Contrôle d'accès
│   │   ├── 📄 accesses.controller.js
│   │   ├── 📄 accesses.service.js
│   │   └── 📄 accesses.routes.js
│   │
│   ├── 📁 authorizations/     # Autorisations
│   │   ├── 📄 authorizations.controller.js
│   │   ├── 📄 authorizations.service.js
│   │   └── 📄 authorizations.routes.js
│   │
│   ├── 📁 identities/          # Identités utilisateurs
│   │   ├── 📄 identities.controller.js
│   │   ├── 📄 identities.service.js
│   │   └── 📄 identities.routes.js
│   │
│   ├── 📁 people/             # Informations personnelles
│   │   ├── 📄 people.controller.js
│   │   ├── 📄 people.service.js
│   │   └── 📄 people.routes.js
│   │
│   ├── 📁 realtime/           # Temps réel
│   │   ├── 📄 realtime.controller.js
│   │   ├── 📄 realtime.service.js
│   │   └── 📄 realtime.routes.js
│   │
│   ├── 📁 system/             # Administration système
│   │   ├── 📄 system.controller.js
│   │   ├── 📄 system.service.js
│   │   └── 📄 system.routes.js
│   │
│   ├── 📁 admin/              # Administration
│   │   ├── 📄 admin.controller.js
│   │   ├── 📄 admin.service.js
│   │   └── 📄 admin.routes.js
│   │
│   └── 📁 test/               # Tests modules
│       ├── 📄 test.controller.js
│       ├── 📄 test.service.js
│       └── 📄 test.routes.js
│
├── 📁 middlewares/            # Middlewares globaux
│   ├── 📄 auth.middleware.js   # Vérification auth
│   ├── 📄 rbac.middleware.js  # Contrôle permissions
│   ├── 📄 validation.middleware.js
│   ├── 📄 rate-limit.middleware.js
│   ├── 📄 error.middleware.js
│   └── 📄 logging.middleware.js
│
├── 📁 services/               # Services partagés
│   ├── 📄 database.service.js  # Service BDD
│   ├── 📄 redis.service.js    # Service Redis
│   ├── 📄 jwt.service.js      # Service JWT
│   ├── 📄 email.service.js    # Service Email
│   ├── 📄 sms.service.js      # Service SMS
│   └── 📄 audit.service.js    # Service Audit
│
├── 📁 utils/                  # Utilitaires
│   ├── 📄 logger.js           # Logger Winston
│   ├── 📄 crypto.js           # Utilitaires crypto
│   ├── 📄 validator.js        # Validation données
│   ├── 📄 helpers.js          # Fonctions helpers
│   └── 📄 constants.js        # Constantes
│
├── 📁 security/               # Sécurité
│   ├── 📄 password.js         # Gestion mots de passe
│   ├── 📄 encryption.js       # Chiffrement
│   ├── 📄 tokens.js           # Gestion tokens
│   └── 📄 security.js         # Configuration sécurité
│
├── 📁 health/                 # Health checks
│   ├── 📄 health.controller.js
│   ├── 📄 health.routes.js
│   └── 📄 health.service.js
│
├── 📁 metrics/                # Métriques
│   ├── 📄 metrics.controller.js
│   ├── 📄 metrics.routes.js
│   └── 📄 metrics.service.js
│
├── 📁 dashboard/              # Dashboard admin
│   ├── 📄 dashboard.controller.js
│   ├── 📄 dashboard.routes.js
│   └── 📄 dashboard.service.js
│
├── 📄 server.js               # Point d'entrée serveur
├── 📄 app.js                  # Configuration Express
├── 📄 bootstrap.js            # Initialisation application
└── 📄 index.js                # Export principal
```

### 📁 database/ - Gestion base de données

```
📁 database/
├── 📁 bootstrap/              # Scripts bootstrap
│   ├── 📄 001_create_database.sql
│   ├── 📄 002_create_extensions.sql
│   └── 📄 003_create_functions.sql
│
├── 📁 migrations/             # Migrations SQL
│   ├── 📄 001_initial_schema.sql
│   ├── 📄 002_add_rbac_tables.sql
│   ├── 📄 003_add_oauth_tables.sql
│   ├── 📄 004_add_audit_tables.sql
│   └── 📄 005_add_indexes.sql
│
├── 📁 seeds/                  # Données initiales
│   ├── 📄 001_roles.sql
│   ├── 📄 002_permissions.sql
│   ├── 📄 003_admin_user.sql
│   └── 📄 004_default_menus.sql
│
├── 📁 schema/                 # Schéma documentation
│   ├── 📄 users.sql
│   ├── 📄 roles.sql
│   ├── 📄 permissions.sql
│   ├── 📄 sessions.sql
│   └── 📄 audit.sql
│
├── 📄 DATABASE_BOOTSTRAP.md   # Documentation BDD
├── 📄 README.md               # README database
└── 📄 connection.js           # Configuration connexion
```

### 📁 tests/ - Tests automatisés

```
📁 tests/
├── 📁 unit/                   # Tests unitaires
│   ├── 📁 modules/
│   │   ├── 📄 auth.test.js
│   │   ├── 📄 users.test.js
│   │   ├── 📄 roles.test.js
│   │   └── 📄 permissions.test.js
│   ├── 📁 services/
│   │   ├── 📄 database.test.js
│   │   ├── 📄 redis.test.js
│   │   └── 📄 jwt.test.js
│   └── 📁 utils/
│       ├── 📄 crypto.test.js
│       └── 📄 validator.test.js
│
├── 📁 integration/            # Tests d'intégration
│   ├── 📄 auth.integration.test.js
│   ├── 📄 users.integration.test.js
│   ├── 📄 rbac.integration.test.js
│   └── 📄 oauth.integration.test.js
│
├── 📁 e2e/                    # Tests end-to-end
│   ├── 📄 login.e2e.test.js
│   ├── 📄 registration.e2e.test.js
│   ├── 📄 password-reset.e2e.test.js
│   └── 📄 rbac.e2e.test.js
│
├── 📁 fixtures/               # Données de test
│   ├── 📄 users.json
│   ├── 📄 roles.json
│   └── 📄 permissions.json
│
├── 📁 helpers/                # Helpers de test
│   ├── 📄 database.helper.js
│   ├── 📄 auth.helper.js
│   └── 📄 mock.helper.js
│
├── 📄 setup.js                # Configuration tests
├── 📄 teardown.js             # Nettoyage tests
└── 📄 test.config.js          # Config tests
```

### 📁 docs/ - Documentation

```
📁 docs/
├── 📄 README.md               # Documentation principale
├── 📄 API_ROUTES.md           # Routes API
├── 📄 RBAC_GUIDE.md           # Guide RBAC
├── 📄 DEPLOYMENT.md           # Guide déploiement
├── 📄 SECURITY.md             # Sécurité
└── 📄 TROUBLESHOOTING.md      # Dépannage
```

### 📁 postman/ - Collections API

```
📁 postman/
├── 📄 Auth-Service.postman_collection.json
├── 📄 Auth-Service.postman_environment.json
├── 📄 Auth-Service.postman_globals.json
└── 📁 examples/
    ├── 📄 login-example.json
    ├── 📄 register-example.json
    └── 📄 rbac-example.json
```

### 📁 scripts/ - Scripts utilitaires

```
📁 scripts/
├── 📄 setup.sh               # Setup environnement
├── 📄 build.sh               # Build application
├── 📄 deploy.sh              # Déploiement
├── 📄 backup.sh              # Backup BDD
├── 📄 restore.sh             # Restore BDD
├── 📄 migrate.sh             # Migrations
├── 📄 seed.sh                # Seeding
├── 📄 test.sh                # Lancer tests
├── 📄 lint.sh                # Linting
├── 📄 security-audit.sh       # Audit sécurité
├── 📄 performance-test.sh     # Tests performance
├── 📄 health-check.sh        # Health checks
├── 📄 log-rotation.sh        # Rotation logs
├── 📄 cleanup.sh             # Nettoyage
├── 📄 update-dependencies.sh # Mise à jour dépendances
├── 📄 generate-keys.sh       # Génération clés
├── 📄 create-admin.sh        # Création admin
├── 📄 reset-password.sh      # Reset mot de passe
├── 📄 backup-users.sh        # Backup utilisateurs
├── 📄 audit-report.sh        # Rapport audit
├── 📄 health-monitor.sh      # Monitoring santé
├── 📄 security-scan.sh       # Scan sécurité
├── 📄 load-test.sh           # Test charge
├── 📄 stress-test.sh         # Test stress
├── 📄 integration-test.sh    # Tests intégration
└── 📄 e2e-test.sh            # Tests E2E
```

---

## 📄 Fichiers de configuration

### 📄 Fichiers principaux

```
📄 package.json              # Dépendances et scripts
📄 package-lock.json          # Lock versions
📄 .env.example              # Variables environnement
📄 .env.development          # Env développement
📄 .env.local                # Env local
📄 .env                      # Env production
📄 .env.docker.example       # Env Docker
📄 .gitignore                # Fichiers ignorés Git
📄 .dockerignore             # Fichiers ignorés Docker
📄 Dockerfile                # Configuration Docker
📄 docker-compose.yml        # Docker Compose
📄 docker-entrypoint.sh      # Script entrypoint Docker
📄 jest.config.json          # Configuration Jest
📄 API_ROUTES.md             # Documentation routes API
📄 README.md                 # README principal
📄 README-RBAC.md            # Documentation RBAC
📄 PASSWORD_SECURITY_ANALYSIS.md # Analyse sécurité mots de passe
```

### 📄 Fichiers de développement

```
📄 debug-server.js           # Debug serveur
📄 debug-users.js            # Debug utilisateurs
📄 generate-token.js         # Génération tokens
📄 force-seeds.js            # Forcer seeding
📄 update-rbac.sh             # Mise à jour RBAC
📄 validate_permission_fix.js # Validation permissions
📄 bootstrap-test-report.json # Rapport bootstrap
📄 inconsistencies-report.json # Rapport incohérences
📄 auth.log                  # Logs auth
```

---

## 🎯 Rôle de chaque dossier

### 📁 src/ - Code métier
Contient toute la logique applicative, organisée en modules fonctionnels pour une meilleure maintenabilité.

### 📁 database/ - Persistance
Gère tout ce qui concerne la base de données : schéma, migrations, seeds et connexions.

### 📁 tests/ - Qualité
Assure la qualité du code avec des tests unitaires, d'intégration et end-to-end.

### 📁 docs/ - Documentation
Centralise toute la documentation technique et utilisateur.

### 📁 postman/ - API Testing
Facilite les tests manuels et l'exploration des API avec des collections Postman.

### 📁 scripts/ - Automatisation
Automatise les tâches récurrentes : déploiement, backup, monitoring, etc.

### 📁 logs/ - Logging
Centralise tous les logs applicatifs pour le debugging et le monitoring.

### 📁 tmp/ - Temporaire
Stocke les fichiers temporaires générés pendant l'exécution.

---

## 🚀 Points d'entrée principaux

### 📄 server.js
Point d'entrée principal du serveur Express. Configure et démarre l'application.

### 📄 app.js
Configuration principale de l'application Express : middlewares, routes, etc.

### 📄 bootstrap.js
Script d'initialisation : connexion BDD, migrations, démarrage services.

### 📄 index.js
Export principal pour les tests et l'utilisation comme module.

---

## 🔧 Configuration

### Variables d'environnement clés
- `NODE_ENV` : Environnement (development/production)
- `PORT` : Port d'écoute (3000)
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` : BDD
- `JWT_SECRET`, `JWT_REFRESH_SECRET` : JWT
- `REDIS_URL` : Redis
- `EMAIL_SERVICE`, `SMS_SERVICE` : Services externes

### Scripts npm principaux
- `npm start` : Démarrage production
- `npm run dev` : Développement avec nodemon
- `npm test` : Tests unitaires
- `npm run test:integration` : Tests intégration
- `npm run test:e2e` : Tests E2E
- `npm run build` : Build production
- `npm run migrate` : Migrations BDD
- `npm run seed` : Seeding BDD

---

**Version** : 1.0.0  
**Dernière mise à jour** : 29 janvier 2026
