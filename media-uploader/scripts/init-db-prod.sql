-- Initialize databases for the production application
-- This script runs when the PostgreSQL container starts for the first time

-- Create the kratos database for Ory Kratos identity management
CREATE DATABASE kratos;

-- Grant necessary permissions
-- Note: In production, POSTGRES_USER and POSTGRES_PASSWORD are set via environment variables
GRANT ALL PRIVILEGES ON DATABASE kratos TO postgres;

-- Display information about created databases
\l
