#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_DIR="${ROOT_DIR}/db"
COMPOSE_FILE="${DB_DIR}/docker-compose.yml"
CONTAINER_NAME="gerador-ticket-openfinance-postgres"
REDIS_CONTAINER_NAME="gerador-ticket-openfinance-redis"
DB_NAME="gerador_ticket_openfinance"
DB_USER="gerador_ticket_user"
SQL_DIR="${DB_DIR}/sql"

echo "Subindo container PostgreSQL..."
docker compose -f "${COMPOSE_FILE}" up -d

echo "Aguardando banco ficar pronto..."
until docker exec "${CONTAINER_NAME}" pg_isready -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; do
  sleep 2
done

echo "Aguardando Redis ficar pronto..."
until docker exec "${REDIS_CONTAINER_NAME}" redis-cli ping >/dev/null 2>&1; do
  sleep 2
done

echo "Aplicando scripts SQL..."
for sql_file in $(find "${SQL_DIR}" -maxdepth 1 -type f -name '*.sql' | sort); do
  echo " - $(basename "${sql_file}")"
  docker exec -i "${CONTAINER_NAME}" \
    psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${DB_NAME}" < "${sql_file}"
done

echo
echo "Banco configurado com sucesso."
echo "Host: localhost"
echo "Porta: 5440"
echo "Database: ${DB_NAME}"
echo "Usuario: ${DB_USER}"
