#!/usr/bin/env bash
# Backup database + foto upload ke folder ./backups. Jadwalkan dengan cron (lihat docs/docker-deploy.md).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
STAMP="$(date +%F-%H%M)"

docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "backups/gymfit-db-$STAMP.sql.gz"
docker run --rm -v gymfit_uploads:/data:ro -v "$PWD/backups":/backup alpine \
  tar czf "/backup/gymfit-uploads-$STAMP.tgz" -C /data .

# Simpan 14 hari terakhir
find backups -name 'gymfit-*' -mtime +14 -delete
echo "Backup selesai: backups/gymfit-db-$STAMP.sql.gz dan gymfit-uploads-$STAMP.tgz"
