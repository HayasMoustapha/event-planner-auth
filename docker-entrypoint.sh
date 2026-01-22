#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] DOCKER-ENTRYPOINT:${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] DOCKER-ENTRYPOINT ERROR:${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] DOCKER-ENTRYPOINT SUCCESS:${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] DOCKER-ENTRYPOINT WARNING:${NC} $1"
}

# Function to wait for PostgreSQL
wait_for_postgres() {
    log "Waiting for PostgreSQL to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
            log_success "PostgreSQL is ready!"
            return 0
        fi
        
        log_warning "PostgreSQL not ready (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    log_error "PostgreSQL failed to start after $max_attempts attempts"
    exit 1
}

# Function to wait for Redis
wait_for_redis() {
    log "Waiting for Redis to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping >/dev/null 2>&1; then
            log_success "Redis is ready!"
            return 0
        fi
        
        log_warning "Redis not ready (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    log_error "Redis failed to start after $max_attempts attempts"
    exit 1
}

# Function to check if database is already initialized
is_database_initialized() {
    log "Checking if database is already initialized..."
    
    local result=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users';" 2>/dev/null | xargs)
    
    if [ "$result" -gt 0 ]; then
        log_success "Database is already initialized"
        return 0
    else
        log_warning "Database is not initialized"
        return 1
    fi
}

# Function to initialize database schema
initialize_database_schema() {
    log "Initializing database schema..."
    
    # Apply schema if exists
    if [ -f "/docker-entrypoint-initdb.d/schema/auth_schema.sql" ]; then
        log "Applying schema file..."
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "/docker-entrypoint-initdb.d/schema/auth_schema.sql"
        log_success "Schema applied successfully"
    else
        log_warning "Schema file not found, relying on application bootstrap"
    fi
}

# Function to run migrations
run_migrations() {
    log "Running database migrations..."
    
    local migrations_dir="/docker-entrypoint-initdb.d/migrations"
    if [ -d "$migrations_dir" ] && [ "$(ls -A $migrations_dir 2>/dev/null)" ]; then
        for migration in $migrations_dir/*.sql; do
            if [ -f "$migration" ]; then
                local migration_name=$(basename "$migration")
                log "Running migration: $migration_name"
                
                # Check if migration already exists
                local migration_exists=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = '$migration_name';" 2>/dev/null | xargs)
                
                if [ "$migration_exists" -eq 0 ]; then
                    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration"
                    
                    # Record migration
                    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO schema_migrations (migration_name, executed_at, checksum, file_size, execution_time_ms) VALUES ('$migration_name', CURRENT_TIMESTAMP, 'docker_checksum', $(stat -c%s "$migration"), 0);" 2>/dev/null || true
                    
                    log_success "Migration $migration_name completed"
                else
                    log_warning "Migration $migration_name already executed, skipping"
                fi
            fi
        done
        log_success "All migrations completed"
    else
        log_warning "No migrations found"
    fi
}

# Function to run seeds
run_seeds() {
    log "Running database seeds..."
    
    local seeds_dir="/docker-entrypoint-initdb.d/seeds"
    if [ -d "$seeds_dir" ] && [ "$(ls -A $seeds_dir 2>/dev/null)" ]; then
        for seed in $seeds_dir/*.sql; do
            if [ -f "$seed" ]; then
                local seed_name=$(basename "$seed")
                log "Running seed: $seed_name"
                PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$seed"
                log_success "Seed $seed_name completed"
            fi
        done
        log_success "All seeds completed"
    else
        log_warning "No seeds found"
    fi
}

# Function to create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p /app/logs
    mkdir -p /app/tmp
    
    # Set correct permissions
    chown -R nodejs:nodejs /app/logs
    chown -R nodejs:nodejs /app/tmp
    
    log_success "Directories created and permissions set"
}

# Function to validate environment
validate_environment() {
    log "Validating environment variables..."
    
    local required_vars=("DB_HOST" "DB_PORT" "DB_NAME" "DB_USER" "DB_PASSWORD")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# Main execution
main() {
    log "Starting Event Planner Auth Docker Entrypoint..."
    
    # Validate environment first
    validate_environment
    
    # Create directories
    create_directories
    
    # Wait for dependencies
    wait_for_postgres
    wait_for_redis
    
    # Initialize database if needed
    if ! is_database_initialized; then
        log "Database not initialized, running setup..."
        initialize_database_schema
        run_migrations
        run_seeds
        log_success "Database initialization completed"
    else
        log "Database already initialized, skipping setup"
    fi
    
    log "Starting application..."
    
    # Switch to nodejs user and start the application
    exec gosu nodejs node src/server.js
}

# Trap signals for graceful shutdown
trap 'log "Received shutdown signal, exiting gracefully..."; exit 0' SIGTERM SIGINT

# Execute main function
main "$@"
