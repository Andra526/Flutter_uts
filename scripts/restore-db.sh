#!/usr/bin/env bash
# Pulihkan database dari file backup. PERHATIAN: dijalankan pada database yang masih KOSONG
# (setelah `docker compose up -d db migrate`), karena data yang bentrok akan menyebabkan error.
#   ./scripts/restore-db.sh backups/gymfit-db-2026-11-04-0300.sql.gz
set -euo pipefail
cd "$(dirname "$0")/.."
[ $# -eq 1 ] && [ -f "$1" ] || { echo "Pemakaian: $0 <file .sql.gz>"; exit 1; }
read -r -p "Pulihkan $1 ke database sekarang? Ketik YA: " ok
[ "$ok" = "YA" ] || { echo "Dibatalkan."; exit 1; }
gunzip -c "$1" | docker compose exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" "$POSTGRES_DB"'
echo "Selesai."
