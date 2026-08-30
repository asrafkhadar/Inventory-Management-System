# Inventory Management System - Complete Setup Guide

## Project Overview
A comprehensive inventory management system with real-time tracking, warehouse operations, reporting, and forecasting capabilities.

## Technical Stack
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla + Chart.js)
- **Backend:** Python (Django + Django REST Framework)
- **Database:** PostgreSQL
- **Additional:** AWS S3 for file storage, scikit-learn for forecasting

## Prerequisites
- Python 3.8+
- PostgreSQL 12+
- pip / pipenv
- Node.js (optional, for development)
- Git

## Installation & Setup

### 1. Backend Setup

#### Step 1: Create Virtual Environment
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

#### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step 3: Create .env file
Create a `.env` file in the backend directory:
```
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production
DB_ENGINE=django.db.backends.postgresql
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_STORAGE_BUCKET_NAME=inventory-system
AWS_S3_REGION_NAME=us-east-1
```

#### Step 4: Setup PostgreSQL Database
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE inventory_db;

-- Create user (if not exists)
CREATE USER inventory_user WITH PASSWORD 'your_password';

-- Grant privileges
ALTER ROLE inventory_user SET client_encoding TO 'utf8';
ALTER ROLE inventory_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE inventory_user SET default_transaction_deferrable TO on;
ALTER ROLE inventory_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;
```

#### Step 5: Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

#### Step 6: Create Superuser
```bash
python manage.py createsuperuser
# Enter username, email, password when prompted
```

#### Step 7: Load Sample Data (Optional)
```bash
python manage.py shell
```

### 2. Frontend Setup

No build process required for the frontend - just serve the HTML files.

#### Option A: Simple HTTP Server
```bash
cd frontend
python -m http.server 8001
```

#### Option B: Using Python (Recommended for development)
```bash
cd frontend
# Python 3
python -m http.server 8001

# Python 2
python -m SimpleHTTPServer 8001
```

### 3. Running the Application

#### Start Backend (Django Development Server)
```bash
cd backend
python manage.py runserver 8000
```

#### Access the Application
- **Frontend:** http://localhost:8001
- **Admin Panel:** http://localhost:8000/admin
- **API:** http://localhost:8000/api

#### Default Credentials
- Username: admin
- Password: (whatever you set during createsuperuser)

## API Endpoints

### Suppliers
- `GET /api/suppliers/` - List all suppliers
- `POST /api/suppliers/` - Create supplier
- `PUT /api/suppliers/{id}/` - Update supplier
- `DELETE /api/suppliers/{id}/` - Delete supplier
- `GET /api/suppliers/export_csv/` - Export as CSV
- `GET /api/suppliers/export_pdf/` - Export as PDF

### Products
- `GET /api/products/` - List all products
- `POST /api/products/` - Create product
- `PUT /api/products/{id}/` - Update product
- `DELETE /api/products/{id}/` - Delete product
- `GET /api/products/barcode_lookup/?barcode=VALUE` - Lookup by barcode
- `GET /api/products/low_stock/` - Get low stock products
- `GET /api/products/export_csv/` - Export as CSV
- `GET /api/products/export_xlsx/` - Export as XLSX

### Warehouses
- `GET /api/warehouses/` - List all warehouses
- `POST /api/warehouses/` - Create warehouse
- `PUT /api/warehouses/{id}/` - Update warehouse
- `DELETE /api/warehouses/{id}/` - Delete warehouse
- `GET /api/warehouses/export_csv/` - Export as CSV

### Inventory Locations
- `GET /api/inventory-locations/` - List inventory
- `GET /api/inventory-locations/warehouse_summary/` - Summary by warehouse
- `GET /api/inventory-locations/export_csv/` - Export as CSV

### Movements
- `GET /api/movements/` - List movements
- `POST /api/movements/` - Create movement
- `GET /api/movements/movement_history/?product_id=ID` - Get product history
- `GET /api/movements/export_csv/` - Export as CSV

### Purchase Orders
- `GET /api/purchase-orders/` - List POs
- `POST /api/purchase-orders/create_po/` - Create PO
- `POST /api/purchase-orders/mark_received/` - Mark as received
- `GET /api/purchase-orders/export_csv/` - Export as CSV

### Sales Orders
- `GET /api/sales-orders/` - List SOs
- `POST /api/sales-orders/create_so/` - Create SO
- `GET /api/sales-orders/export_csv/` - Export as CSV

### Analytics
- `GET /api/sales-analytics/` - List analytics
- `GET /api/sales-analytics/sales_trends/` - Get trends
- `GET /api/sales-analytics/top_products/` - Get top products
- `GET /api/sales-analytics/export_csv/` - Export as CSV

### Forecasts
- `GET /api/forecasts/` - List forecasts
- `POST /api/forecasts/generate_forecast/` - Generate forecast
- `GET /api/forecasts/export_csv/` - Export as CSV

## Features & Functionality

### 1. Inventory Control
- **Stock Tracking:** Real-time inventory updates
- **Product Management:** Add, edit, delete products
- **Barcode System:** Scan and lookup products instantly
- **Reorder Levels:** Automatic low-stock alerts

### 2. Warehouse Management
- **Location Tracking:** Track items by warehouse, aisle, rack, shelf, bin
- **Movement History:** Complete audit trail of all movements
- **Batch Management:** Track items by batch number
- **Expiry Dates:** Monitor expiration dates

### 3. Order Management
- **Purchase Orders:** Create and track supplier orders
- **Sales Orders:** Manage customer orders
- **Order Status:** Track order lifecycle
- **Order History:** Complete order records

### 4. Reporting & Analytics
- **Sales Trends:** Visualize sales over time
- **Top Products:** Identify best-selling items
- **Low Stock Alerts:** Automatic alerts for low inventory
- **Inventory Summary:** Warehouse capacity and utilization

### 5. Forecasting
- **Demand Forecasting:** ML-based demand prediction
- **Confidence Scores:** Accuracy indicators for forecasts
- **Historical Analysis:** Learn from past sales data

### 6. Export Capabilities
- **CSV Export:** Export any table to CSV
- **PDF Export:** Generate PDF reports
- **Excel Export:** Export to XLSX format
- **Custom Reports:** Create user-defined reports

## File Structure
```
INVENTORY/
├── backend/
│   ├── inventory_system/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── inventory_app/
│   │   ├── migrations/
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── tests.py
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── login.html
    └── assets/
        ├── css/
        │   └── style.css
        └── js/
            ├── app.js
            ├── api.js
            ├── auth.js
            ├── config.js
            └── ui.js
```

## Troubleshooting

### PostgreSQL Connection Error
```
Error: could not connect to server: No such file or directory
```
Solution: Ensure PostgreSQL is running
```bash
# Windows
net start PostgreSQL14

# macOS
brew services start postgresql

# Linux
sudo service postgresql start
```

### Migration Errors
```bash
# Reset migrations (careful!)
python manage.py migrate inventory_app zero
python manage.py makemigrations
python manage.py migrate
```

### Port Already in Use
```bash
# Change port
python manage.py runserver 8001

# Or kill process using port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :8000
kill -9 <PID>
```

### CORS Issues
The system is configured with CORS enabled for localhost. If accessing from a different domain, update `CORS_ALLOWED_ORIGINS` in `settings.py`.

## Production Deployment

### Security Checklist
- [ ] Change `SECRET_KEY` in settings
- [ ] Set `DEBUG = False`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Use environment variables for sensitive data
- [ ] Enable HTTPS
- [ ] Set up SSL certificates
- [ ] Configure database backups
- [ ] Set up monitoring and logging

### Deployment Options
- **Heroku:** Easy deployment with `Procfile`
- **AWS:** Use EC2, RDS, and S3
- **DigitalOcean:** VPS deployment
- **Docker:** Containerized deployment

## Database Models

### Supplier
- id (UUID)
- name, email, phone
- address, city, country
- contract_file (optional)

### Product
- id (UUID)
- barcode (unique)
- name, description
- category, supplier
- unit_cost, unit_price
- reorder_level
- status, image

### Warehouse
- id (UUID)
- name, address
- city, country
- manager info, capacity

### InventoryLocation
- id (UUID)
- warehouse, product
- Location (aisle, rack, shelf, bin)
- quantity, batch_number
- expiry_date

### Movement
- id (UUID)
- inventory_location
- movement_type (inbound/outbound/transfer/adjustment)
- quantity, reference_number
- notes, created_by

### PurchaseOrder
- id (UUID)
- po_number, supplier, product
- quantity, unit_cost, total_cost
- status, expected_delivery
- actual_delivery

### SalesOrder
- id (UUID)
- so_number, product
- quantity, unit_price, total_price
- customer info
- status, ship_date

### SalesAnalytics
- id (UUID)
- product, date
- units_sold, revenue

### Forecast
- id (UUID)
- product, forecast_date
- predicted_demand
- confidence_score

## Support & Documentation

For more information, visit:
- Django Docs: https://docs.djangoproject.com/
- DRF Docs: https://www.django-rest-framework.org/
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Chart.js Docs: https://www.chartjs.org/docs/

## License
MIT License - feel free to use and modify

## Version
1.0.0 - Initial Release
