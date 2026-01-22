# Multi-stage build pour optimiser la taille de l'image
FROM node:18-alpine AS base

# Installer les utilitaires nécessaires pour le bootstrap
RUN apk add --no-cache \
    postgresql-client \
    redis \
    bash \
    curl \
    wget \
    coreutils \
    && apk add --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/edge/community gosu

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de package
COPY package*.json ./

# Installer les dépendances de production uniquement
RUN npm ci --only=production && npm cache clean --force

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Stage de développement (optionnel pour les tests)
FROM base AS development
RUN npm ci
COPY . .
USER nodejs
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage de production
FROM base AS production

# Copier le script d'entrée
COPY --chown=nodejs:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copier le code source
COPY --chown=nodejs:nodejs . .

# Créer les répertoires nécessaires avec les bons permissions
RUN mkdir -p logs tmp && \
    chown -R nodejs:nodejs /app

# Basculer vers l'utilisateur non-root
USER nodejs

# Exposer le port de l'application
EXPOSE 3000

# Healthcheck pour vérifier que l'application fonctionne
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Point d'entrée personnalisé
ENTRYPOINT ["docker-entrypoint.sh"]

# Labels pour l'organisation
LABEL maintainer="Event Planner Auth Team" \
      version="1.0.0" \
      description="Event Planner Auth Service - Production Ready" \
      org.opencontainers.image.source="https://github.com/HayasMoustapha/event-planner-auth"
