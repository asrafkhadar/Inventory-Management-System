#!/usr/bin/env bash
# Exit on any error
set -o errexit

echo "=========================================="
echo "Starting Render Build Process"
echo "=========================================="

echo ""
echo "Step 1: Installing Python dependencies..."
pip install -r backend/requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi
echo "✓ Dependencies installed successfully"

echo ""
echo "Step 2: Configuring Django settings..."
export DJANGO_SETTINGS_MODULE=inventory_system.settings_production
export DEBUG=False
export PYTHONUNBUFFERED=1
cd backend

echo ""
echo "Step 3: Running database migrations..."
python manage.py migrate --noinput --verbosity 3
if [ $? -ne 0 ]; then
    echo "ERROR: Migrations failed"
    exit 1
fi
echo "✓ Migrations completed successfully"

echo ""
echo "Step 4: Collecting static files..."
python manage.py collectstatic --noinput --clear --verbosity 2
if [ $? -ne 0 ]; then
    echo "ERROR: Static files collection failed"
    exit 1
fi
echo "✓ Static files collected successfully"

echo ""
echo "Step 5: Creating admin user..."
python setup_admin.py
echo "✓ Admin setup completed"

cd ..

echo ""
echo "=========================================="
echo "Build completed successfully!"
echo "=========================================="
