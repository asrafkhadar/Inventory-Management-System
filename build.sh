#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
pip install -r backend/requirements.txt

echo "Setting up database..."
cd backend
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Creating admin user..."
python setup_admin.py || echo "Admin user setup skipped"

cd ..
