CREATE EXTENSION IF NOT EXISTS vector;

-- Basic user table with vector embedding support
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    embedding VECTOR(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);