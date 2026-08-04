import json
from django.test import TestCase, RequestFactory
from inventory_app.models import Supplier, Product, Forecast
from inventory_app.views import SupplierViewSet, ProductViewSet


class ExportEndpointRegressionTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.supplier = Supplier.objects.create(
            name='Acme Supplies',
            email='acme@example.com',
            phone='123456789',
            address='1 Main St',
            city='Seattle',
            country='USA',
        )
        self.product = Product.objects.create(
            barcode='SKU-001',
            name='Widget',
            description='Test product',
            category='other',
            supplier=self.supplier,
            unit_cost='10.00',
            unit_price='20.00',
            reorder_level=5,
            status='active',
        )

    def test_supplier_pdf_export_returns_successful_response(self):
        request = self.factory.get('/api/suppliers/export_pdf/')
        response = SupplierViewSet.as_view({'get': 'export_pdf'})(request)

        self.assertEqual(response.status_code, 200)

    def test_product_xlsx_export_returns_successful_response(self):
        request = self.factory.get('/api/products/export_xlsx/')
        response = ProductViewSet.as_view({'get': 'export_xlsx'})(request)

        self.assertEqual(response.status_code, 200)


class ProductAndForecastApiRegressionTests(TestCase):
    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Acme Supplies',
            email='acme@example.com',
            phone='123456789',
            address='1 Main St',
            city='Seattle',
            country='USA',
        )

    def test_product_create_allows_missing_description(self):
        response = self.client.post(
            '/api/products/',
            data=json.dumps({
                'name': 'Widget',
                'barcode': 'SKU-001',
                'category': 'other',
                'supplier': str(self.supplier.id),
                'unit_cost': '5.00',
                'unit_price': '10.00',
                'reorder_level': 1,
                'status': 'active'
            }),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 201)

    def test_forecasts_endpoint_returns_list_response(self):
        Forecast.objects.create(
            product=Product.objects.create(
                barcode='SKU-FORECAST',
                name='Forecast Product',
                description='test',
                category='other',
                supplier=self.supplier,
                unit_cost='1.00',
                unit_price='2.00',
                reorder_level=1,
                status='active',
            ),
            forecast_date='2026-08-04',
            predicted_demand=10,
            confidence_score=0.95,
        )

        response = self.client.get('/api/forecasts/')

        self.assertEqual(response.status_code, 200)
