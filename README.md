# Backend Express - Event Planner

Projet backend Node.js avec Express pour l'application Event Planner.

## Installation

1. Clonez le repository
2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Copiez le fichier d'environnement :
   ```bash
   cp .env.example .env
   ```

4. Configurez vos variables d'environnement dans le fichier `.env`

## Démarrage

### Mode développement
```bash
npm run dev
```
Le serveur redémarrera automatiquement lors des modifications.

### Mode production
```bash
npm start
```

## API Endpoints

### Base
- `GET /` - Message de bienvenue
- `GET /api/health` - Vérification de l'état du serveur

## Structure du projet

```
├── server.js          # Fichier principal du serveur
├── package.json       # Dépendances et scripts
├── .env.example       # Exemple de configuration
├── .gitignore         # Fichiers ignorés par Git
└── README.md          # Documentation du projet
```

## Technologies utilisées

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Helmet** - Sécurité HTTP
- **CORS** - Gestion des requêtes cross-origin
- **Morgan** - Logging des requêtes
- **Dotenv** - Gestion des variables d'environnement
- **Nodemon** - Redémarrage automatique en développement

## Développement

Le serveur écoute par défaut sur le port 3000. Vous pouvez modifier ce port dans le fichier `.env`.

## Licence

MIT
