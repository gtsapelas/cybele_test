#!/bin/sh

set -o errexit
set -o pipefail
set -o nounset


echo "Waiting for postgres..."

while ! nc -z $SQL_HOST $SQL_PORT; do
  sleep 0.1
done

echo "PostgreSQL started"


python manage.py flush --no-input
echo "Migrating..."
python manage.py migrate --noinput

echo "Generating dummy dataset..."
python manage.py generate_dummy_dataset

echo "Starting the server..."
python manage.py runserver 0.0.0.0:8000
