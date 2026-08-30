#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
pip install -r backend/requirements.txt

echo "Setting up database..."
cd backend

# Ensure we're using the correct settings module
export DJANGO_SETTINGS_MODULE=inventory_system.settings_production
export DEBUG=False

echo "Running migrations..."
python manage.py migrate --noinput --verbosity 2

echo "Collecting static files..."
python manage.py collectstatic --noinput --verbosity 2

echo "Creating admin user..."
python setup_admin.py || echo "Admin user already exists or setup skipped"

echo "Database setup complete!"
cd ..
