#!/bin/sh

set -o errexit
set -o pipefail
set -o nounset




if [ -z "${SQL_USER}" ]; then
    base_postgres_image_default_user='postgres'
    export POSTGRES_USER="${base_postgres_image_default_user}"
fi
export DATABASE_URL="postgres://${SQL_USER}:${SQL_PASSWORD}@${SQL_HOST}:${SQL_PORT}/${SQL_DATABASE}"

postgres_ready() {
python << END
import sys

import psycopg2

try:
    psycopg2.connect(
        dbname="${SQL_DATABASE}",
        user="${SQL_USER}",
        password="${SQL_PASSWORD}",
        host="${SQL_HOST}",
        port="${SQL_PORT}",
    )
except psycopg2.OperationalError:
    sys.exit(-1)
sys.exit(0)

END
}
until postgres_ready; do
  >&2 echo 'Waiting for PostgreSQL to become available...'
  sleep 1
done
>&2 echo 'PostgreSQL is available'

exec "$@"


python manage.py flush --no-input
echo "Migrating..."
python manage.py migrate --noinput

echo "Generating dummy dataset..."
python manage.py generate_dummy_dataset

echo "Starting the server..."
gunicorn cybele_advanced_query_builder.wsgi:application --bind 0.0.0.0:80 --workers=${WEB_CONCURRENCY}
