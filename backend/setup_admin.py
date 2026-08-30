#!/usr/bin/env python
"""Setup admin user for testing"""
import os
import sys
import django

# Use production settings on Render, development settings locally
if os.environ.get('DEBUG') == 'False' or os.environ.get('RENDER'):
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory_system.settings_production')
else:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory_system.settings')

try:
    django.setup()
except Exception as e:
    print(f"✗ Error initializing Django: {str(e)}")
    sys.exit(1)

from django.contrib.auth.models import User

try:
    # Check if admin already exists
    if User.objects.filter(username='admin').exists():
        print("✓ Admin user already exists!")
        admin = User.objects.get(username='admin')
        print(f"  Username: {admin.username}")
        print(f"  Email: {admin.email}")
        sys.exit(0)
    
    # Create admin user
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@inventory.com',
        password='admin'
    )
    print("✓ Admin user created successfully!")
    print(f"  Username: {admin.username}")
    print(f"  Email: {admin.email}")
    print(f"  Password: admin")
    sys.exit(0)
    
except Exception as e:
    print(f"✗ Error setting up admin user: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
