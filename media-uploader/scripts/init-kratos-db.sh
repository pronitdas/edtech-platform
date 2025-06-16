#!/bin/bash
set -e

# This script runs after PostgreSQL is initialized
# It ensures the kratos database exists

echo "Creating kratos database if it doesn't exist..."

# Connect to postgres database and create kratos database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE kratos'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kratos');
    
    -- If the above returns a row, it means we need to create the database
    \gexec
    
    -- Grant permissions
    GRANT ALL PRIVILEGES ON DATABASE kratos TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE development TO postgres;
    
    \echo 'Kratos database setup completed!'
EOSQL

echo "Database initialization completed successfully!"
