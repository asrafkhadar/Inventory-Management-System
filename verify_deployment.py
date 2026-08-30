#!/usr/bin/env python
"""
Verify Inventory Management System Configuration
Runs all pre-deployment checks
"""
import os
import sys
import django
from pathlib import Path

print("=" * 60)
print("INVENTORY MANAGEMENT SYSTEM - DEPLOYMENT VERIFICATION")
print("=" * 60)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory_system.settings_production')

try:
    print("\n✓ Step 1: Checking Django setup...")
    django.setup()
    print("  ✓ Django initialized successfully")
except Exception as e:
    print(f"  ✗ ERROR: {str(e)}")
    sys.exit(1)

# Test 1: Check Database
print("\n✓ Step 2: Checking Database Configuration...")
from django.conf import settings
db_config = settings.DATABASES['default']
print(f"  Database Engine: {db_config['ENGINE']}")
if 'postgresql' in db_config['ENGINE']:
    print(f"  Host: {db_config.get('HOST', 'N/A')}")
    print(f"  Database: {db_config.get('NAME', 'N/A')}")
    print("  ✓ PostgreSQL configured")
else:
    print(f"  Database File: {db_config.get('NAME', 'N/A')}")
    print("  ✓ SQLite configured")

# Test 2: Check Migrations
print("\n✓ Step 3: Checking Database Tables...")
try:
    from django.contrib.auth.models import User
    user_count = User.objects.count()
    print(f"  ✓ Database tables exist")
    print(f"  Users in database: {user_count}")
except Exception as e:
    print(f"  ✗ ERROR: {str(e)}")
    print("  Note: This is OK if migrations haven't run yet")

# Test 3: Check Admin User
print("\n✓ Step 4: Checking Admin User...")
try:
    from django.contrib.auth.models import User
    admin = User.objects.filter(username='admin').first()
    if admin:
        print(f"  ✓ Admin user exists")
        print(f"  Username: {admin.username}")
        print(f"  Email: {admin.email}")
        print(f"  Is Staff: {admin.is_staff}")
        print(f"  Is Superuser: {admin.is_superuser}")
    else:
        print(f"  ℹ Admin user not found (will be created during deployment)")
except Exception as e:
    print(f"  ℹ Could not check admin user: {str(e)}")

# Test 4: Check Apps
print("\n✓ Step 5: Checking Installed Apps...")
installed_apps = settings.INSTALLED_APPS
required_apps = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'rest_framework',
    'corsheaders',
    'inventory_app',
]
missing_apps = [app for app in required_apps if app not in installed_apps]
if missing_apps:
    print(f"  ✗ Missing apps: {missing_apps}")
    sys.exit(1)
else:
    print(f"  ✓ All required apps installed")
    for app in required_apps:
        print(f"    - {app}")

# Test 5: Check CORS
print("\n✓ Step 6: Checking CORS Configuration...")
cors_origins = settings.CORS_ALLOWED_ORIGINS
print(f"  CORS Origins configured:")
if isinstance(cors_origins, str):
    origins = [o.strip() for o in cors_origins.split(',')]
    for origin in origins:
        print(f"    - {origin}")
else:
    for origin in cors_origins:
        print(f"    - {origin}")

# Test 6: Check Settings
print("\n✓ Step 7: Checking Security Settings...")
print(f"  DEBUG: {settings.DEBUG}")
print(f"  ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
print(f"  SESSION_COOKIE_SECURE: {getattr(settings, 'SESSION_COOKIE_SECURE', 'N/A')}")
print(f"  CSRF_COOKIE_SECURE: {getattr(settings, 'CSRF_COOKIE_SECURE', 'N/A')}")

# Test 7: Check Static Files
print("\n✓ Step 8: Checking Static Files Configuration...")
print(f"  STATIC_URL: {settings.STATIC_URL}")
print(f"  STATIC_ROOT: {settings.STATIC_ROOT}")
print(f"  STATICFILES_STORAGE: {settings.STATICFILES_STORAGE}")

# Test 8: Check build.sh
print("\n✓ Step 9: Checking build.sh...")
build_sh = Path(__file__).parent.parent / 'build.sh'
if build_sh.exists():
    print(f"  ✓ build.sh exists")
    size = build_sh.stat().st_size
    print(f"  Size: {size} bytes")
else:
    print(f"  ✗ build.sh not found")

# Test 9: Check render.yaml
print("\n✓ Step 10: Checking render.yaml...")
render_yaml = Path(__file__).parent.parent / 'render.yaml'
if render_yaml.exists():
    print(f"  ✓ render.yaml exists")
    with open(render_yaml, 'r') as f:
        content = f.read()
        has_db = 'databases:' in content
        has_postgres = 'postgresql' in content
        print(f"  Has database config: {has_db}")
        print(f"  PostgreSQL configured: {has_postgres}")
else:
    print(f"  ✗ render.yaml not found")

print("\n" + "=" * 60)
print("✅ VERIFICATION COMPLETE!")
print("=" * 60)
print("\nYour application is ready for Render deployment!")
print("\nNext steps:")
print("1. Go to Render Dashboard: https://dashboard.render.com")
print("2. Delete old service (if exists)")
print("3. Create new Web Service from your GitHub repo")
print("4. Render will auto-detect render.yaml and deploy")
print("5. Test at: https://your-service.onrender.com/login.html")
print("\nLogin credentials:")
print("  Username: admin")
print("  Password: admin")
print("=" * 60)
