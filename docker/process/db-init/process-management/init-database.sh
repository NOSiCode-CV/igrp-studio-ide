#!/bin/sh

set -eu

echo "Initializing database '${TARGET_DATABASE}' for process-management-api..."

export PGPASSWORD="${IGRP_DATABASE_PASSWORD}"

until pg_isready -h "${IGRP_LOCAL_DATABASE_HOSTNAME}" -U "${IGRP_DATABASE_USER}" -d postgres >/dev/null 2>&1; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

psql \
  -v ON_ERROR_STOP=1 \
  -h "${IGRP_LOCAL_DATABASE_HOSTNAME}" \
  -U "${IGRP_DATABASE_USER}" \
  -d postgres \
  --set db_name="${TARGET_DATABASE}" \
  --set db_user="${IGRP_DATABASE_USER}" <<'EOSQL'
SELECT format('CREATE DATABASE %I', :'db_name')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'db_name') \gexec

SELECT format('GRANT ALL PRIVILEGES ON DATABASE %I TO %I', :'db_name', :'db_user') \gexec
EOSQL

echo "Database '${TARGET_DATABASE}' is ready."
