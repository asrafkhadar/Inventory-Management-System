#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r backend/requirements.txt

cd backend
python manage.py collectstatic --noinput
python manage.py migrate --noinput
cd ..
