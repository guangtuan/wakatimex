#!/usr/bin/env bash
set -euo pipefail

compose_file="${COMPOSE_FILE:-compose.yaml}"
service_name="${MYSQL_SERVICE_NAME:-mysql}"
output_dir="${EXPORT_DIR:-exports}"
timestamp="$(date +%Y%m%d-%H%M%S)"
default_output="${output_dir}/wakatime_sync-${timestamp}.sql"
output_path="${1:-$default_output}"

mkdir -p "$(dirname "$output_path")"

echo "Exporting MySQL data from service '${service_name}'..."
docker compose -f "$compose_file" exec -T "$service_name" sh -lc '
  exec mysqldump \
    -uroot \
    -p"$MYSQL_ROOT_PASSWORD" \
    --databases "$MYSQL_DATABASE" \
    --single-transaction \
    --skip-lock-tables \
    --set-gtid-purged=OFF
' > "$output_path"

echo "SQL export written to: $output_path"
