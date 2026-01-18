# Bootstrap Automatique de Base de Données

## 🚀 Overview

Le mécanisme de bootstrap automatique initialise la base de données PostgreSQL au démarrage du serveur, de manière sécurisée et idempotente.

## 🔒 Sécurité

Le bootstrap est **désactivé par défaut** en production pour des raisons de sécurité. Pour l'activer :

```bash
# Développement / Initialisation
DB_AUTO_BOOTSTRAP=true

# Production (recommandé: false)
DB_AUTO_BOOTSTRAP=false
```

## 📋 Fonctionnalités

### ✅ Caractéristiques
- **Idempotent**: Ne ré-exécute pas les migrations déjà appliquées
- **Sécurisé**: Verrouillage PostgreSQL, transactions atomiques
- **Traçable**: Table `schema_migrations` avec checksums
- **Automatique**: Détecte la première initialisation pour les seeds
- **Robuste**: Gestion des erreurs, rollback automatique

### 🔄 Processus
1. **Vérification de sécurité** (`DB_AUTO_BOOTSTRAP=true`)
2. **Verrouillage** de la base de données
3. **Création** de la table de contrôle
4. **Application** des migrations en attente
5. **Exécution** des seeds (première fois uniquement)
6. **Validation** de l'installation

## 🛠️ Utilisation

### Automatique (au démarrage)
```bash
# Activer le bootstrap
export DB_AUTO_BOOTSTRAP=true
npm start
```

### Manuel (standalone)
```bash
# Exécuter le bootstrap manuellement
node src/bootstrap.js
```

## 📊 État des Migrations

```bash
# Vérifier l'état actuel
node -e "
const { DatabaseBootstrap } = require('./src/services/database-bootstrap.service');
const bootstrap = new DatabaseBootstrap();
bootstrap.getMigrationStatus().then(console.log);
"
```

## 🗂️ Structure des Fichiers

```
database/
├── bootstrap/
│   └── 001_create_schema_migrations.sql    # Table de contrôle
├── migrations/
│   ├── 000_initial_schema.sql
│   ├── 001_init_auth.sql
│   └── ...                                 # Vos migrations
└── seeds/
    └── seeds/
        ├── roles.seed.sql
        ├── permissions.seed.sql
        ├── menus.seed.sql
        └── admin.seed.sql                  # Seeds exécutés en ordre
```

## ⚡ Performance

- **Temps d'exécution**: 2-15 secondes selon l'état
- **Impact**: Nul si déjà initialisé
- **Parallélisation**: Non nécessaire (séquentiel pour l'intégrité)

## 🚨 Gestion des Erreurs

### En Développement
- Le serveur continue même si le bootstrap échoue
- Logs détaillés pour le débogage

### En Production
- Arrêt immédiat si le bootstrap échoue
- Protection contre la corruption des données

## 🔧 Personnalisation

### Ajouter une migration
1. Créer `database/migrations/XXX_votre_migration.sql`
2. La migration sera automatiquement détectée et appliquée

### Modifier les seeds
1. Éditer les fichiers dans `database/seeds/seeds/`
2. Les seeds ne s'exécutent qu'à la première initialisation

## 📝 Logs d'Exécution

```
🚀 Démarrage du bootstrap de la base de données...
🔒 Verrou de bootstrap acquis
✅ Table schema_migrations vérifiée/créée
✅ Migration 001_init_auth.sql appliquée
✅ Seed roles.seed.sql exécuté
✅ Validation de l'installation réussie
🔓 Verrou de bootstrap libéré
✅ Bootstrap terminé en 1234ms
```

## 🎯 Validation

Après bootstrap réussi, vous devriez avoir :
- ✅ Toutes les tables créées
- ✅ Rôles système configurés
- ✅ Permissions définies
- ✅ Menus hiérarchiques
- ✅ Admin par défaut fonctionnel
- ✅ Table `schema_migrations` à jour
