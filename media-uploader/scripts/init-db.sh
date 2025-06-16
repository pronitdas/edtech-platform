#!/bin/bash
set -e

# Initialize databases for the application
# This script runs when the PostgreSQL container starts for the first time

echo "Starting database initialization..."

# Function to check if database exists
database_exists() {
    local db_name=$1
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'" | grep -q 1
}

# Create kratos database if it doesn't exist
if database_exists "kratos"; then
    echo "Kratos database already exists, skipping creation..."
else
    echo "Creating kratos database..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "CREATE DATABASE kratos;"
    echo "Kratos database created successfully!"
fi

# Grant permissions
echo "Setting up permissions..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    GRANT ALL PRIVILEGES ON DATABASE kratos TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE development TO postgres;
EOSQL

# Verify databases exist and are accessible
echo "Verifying database setup..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "
SELECT 
    datname as database_name, 
    datcollate as collation,
    datconnlimit as connection_limit
FROM pg_database 
WHERE datname IN ('development', 'kratos', 'postgres')
ORDER BY datname;
"

# Test connection to kratos database specifically
echo "Testing kratos database connection..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "kratos" -c "SELECT 'Kratos database is accessible and ready!' as status;"

echo "Database initialization completed successfully!"
echo "Available databases:"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "\l"
