#!/bin/bash
set -e

# Initialize databases for the application
# This script runs when the PostgreSQL container starts for the first time

echo "Starting database initialization..."

# Create the kratos database for Ory Kratos identity management
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create kratos database if it doesn't exist
    SELECT 'CREATE DATABASE kratos'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kratos')\gexec
    
    -- Grant necessary permissions
    GRANT ALL PRIVILEGES ON DATABASE kratos TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE development TO postgres;
EOSQL

echo "Kratos database created successfully!"

# Verify databases exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "
SELECT 
    datname as database_name, 
    datcollate as collation,
    datconnlimit as connection_limit
FROM pg_database 
WHERE datname IN ('development', 'kratos', 'postgres')
ORDER BY datname;
"

echo "Database initialization completed!"
