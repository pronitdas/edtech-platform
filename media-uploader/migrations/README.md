# Database Migrations with Alembic

This directory contains database migrations for the project using Alembic.

## Configuration

- Database: PostgreSQL (configured in docker-compose.yml)
- Connection URL: `postgresql://postgres:postgres@localhost:5432/development`
- Migration Scripts Location: `migrations/versions/`

## Tables

The following tables are managed by these migrations:

1. `knowledge` - Stores core knowledge entries
   - Primary content and metadata storage
   - Includes fields for status tracking and content management

2. `chapters_v1` - Stores chapter content
   - Linked to knowledge entries via foreign key
   - Contains actual content and metadata

3. `retry_history` - Tracks processing retry attempts
   - Records error states and retry timestamps
   - Helps monitor processing issues

## Migration Commands

### Create a New Migration

To create a new migration:

```bash
# Auto-generate migration from model changes
python -m alembic revision --autogenerate -m "Description of changes"

# Create empty migration
python -m alembic revision -m "Description of changes"
```

### Apply Migrations

To apply migrations:

```bash
# Upgrade to latest version
python -m alembic upgrade head

# Upgrade to specific version
python -m alembic upgrade <revision_id>

# Downgrade to previous version
python -m alembic downgrade -1

# Downgrade to specific version
python -m alembic downgrade <revision_id>
```

### View Migration Status

To check migration status:

```bash
# Show current revision
python -m alembic current

# Show migration history
python -m alembic history
```

## Best Practices

1. Always review auto-generated migrations before applying
2. Test migrations both up and down
3. Keep migrations atomic and focused
4. Include clear descriptions in migration messages
5. Back up database before applying migrations in production

## Adding New Models

1. Define model in `models.py`
2. Create migration using `--autogenerate`
3. Review generated migration
4. Apply migration with `upgrade`

For more details on Alembic usage, see the [official documentation](https://alembic.sqlalchemy.org/en/latest/).