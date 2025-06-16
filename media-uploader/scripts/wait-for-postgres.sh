#!/bin/bash
# wait-for-postgres.sh
# Script to wait for PostgreSQL to be ready with the kratos database

set -e

host="$1"
shift
cmd="$@"

until PGPASSWORD=postgres psql -h "$host" -U "postgres" -d "kratos" -c '\q'; do
  >&2 echo "Postgres kratos database is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres kratos database is up - executing command"
exec $cmd
