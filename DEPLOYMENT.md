# Déploiement — Auth Service

**Service**: `event-planner-auth`  
**Port**: `3000`

---

## 1. Prérequis

1. PostgreSQL (DB: `event_planner_auth`)
2. Redis (optionnel, cache)
3. Node.js LTS + npm

---

## 2. Variables d’Environnement

1. Copier `.env.example` → `.env`
2. Renseigner:
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
   - `JWT_SECRET`
   - `AUTH_MOCKS` (dev)
   - OAuth (Google/Apple) si activé

---

## 3. Installation

```
npm install
```

---

## 4. Démarrage

```
npm run start
```

---

## 5. Healthcheck

```
GET http://localhost:3000/api/health
```

---

## 6. Notes

1. Le bootstrap DB est automatique si activé.
2. Les seeds RBAC sont appliqués lors du bootstrap.

