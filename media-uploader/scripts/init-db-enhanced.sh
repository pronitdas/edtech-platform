#!/bin/bash
set -e

# Enhanced database initialization for Kratos
echo "Starting enhanced database initialization..."

# Function to check if database exists
database_exists() {
    local db_name=$1
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'" 2>/dev/null | grep -q 1 || return 1
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
    ALTER USER postgres CREATEDB;
EOSQL

# Test kratos database connection
echo "Testing kratos database connection..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "kratos" -c "
    -- Create a simple test table to verify database is working
    CREATE TABLE IF NOT EXISTS _init_test (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Insert a test record
    INSERT INTO _init_test DEFAULT VALUES;
    
    -- Verify the test worked
    SELECT 'Kratos database is ready and functional!' as status, created_at from _init_test LIMIT 1;
    
    -- Clean up test table
    DROP TABLE _init_test;
"

echo "Database initialization completed successfully!"
echo "Final verification - listing all databases:"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "\l"

echo "Database setup completed!"
echo "NOTE: To seed the database with test data, run: python scripts/seed_simple.py"
