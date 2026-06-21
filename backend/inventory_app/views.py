from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q, Sum, F, Count
from django.http import HttpResponse
from django.utils import timezone
from datetime import timedelta
import csv
import json
import logging
from io import BytesIO
# from reportlab.lib.pagesizes import letter, A4
# from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
# from reportlab.lib.styles import getSampleStyleSheet
# from reportlab.lib import colors
# import pandas as pd
# from sklearn.linear_model import LinearRegression
# import numpy as np

from .models import (
    Supplier, Product, Warehouse, InventoryLocation, Movement,
    QualityControl, PurchaseOrder, SalesOrder, SalesAnalytics, Forecast
)
from .serializers import (
    SupplierSerializer, ProductSerializer, WarehouseSerializer,
    InventoryLocationSerializer, MovementSerializer, QualityControlSerializer,
    PurchaseOrderSerializer, SalesOrderSerializer, SalesAnalyticsSerializer,
    ForecastSerializer
)
from .api_utils import APIResponse, validate_required_fields, validate_numeric_range

logger = logging.getLogger(__name__)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'city', 'country']
    ordering_fields = ['name', 'created_at']

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export suppliers as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="suppliers.csv"'
        writer = csv.writer(response)
        writer.writerow(['Name', 'Email', 'Phone', 'Address', 'City', 'Country', 'Created At'])
        
        suppliers = self.get_queryset()
        for supplier in suppliers:
            writer.writerow([
                supplier.name, supplier.email, supplier.phone, 
                supplier.address, supplier.city, supplier.country, supplier.created_at
            ])
        return response

    @action(detail=False, methods=['get'])
    def export_pdf(self, request):
        """Export suppliers as PDF"""
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="suppliers.pdf"'
        
        doc = SimpleDocTemplate(response, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        elements.append(Paragraph("Supplier Report", styles['Title']))
        elements.append(Spacer(1, 12))
        
        suppliers = self.get_queryset()
        data = [['Name', 'Email', 'Phone', 'City', 'Country']]
        for supplier in suppliers:
            data.append([supplier.name, supplier.email, supplier.phone, supplier.city, supplier.country])
        
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(table)
        doc.build(elements)
        return response


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'barcode', 'category', 'supplier__name']
    ordering_fields = ['name', 'unit_price', 'created_at']

    @action(detail=False, methods=['get'])
    def barcode_lookup(self, request):
        """Look up product by barcode"""
        barcode = request.query_params.get('barcode')
        if not barcode:
            return Response({'error': 'Barcode is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            product = Product.objects.get(barcode=barcode)
            serializer = self.get_serializer(product)
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock"""
        locations = InventoryLocation.objects.select_related('product').filter(
            quantity__lt=F('product__reorder_level')
        )
        serializer = InventoryLocationSerializer(locations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export products as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="products.csv"'
        writer = csv.writer(response)
        writer.writerow(['Barcode', 'Name', 'Category', 'Unit Cost', 'Unit Price', 'Supplier', 'Status'])
        
        products = self.get_queryset()
        for product in products:
            writer.writerow([
                product.barcode, product.name, product.category,
                product.unit_cost, product.unit_price,
                product.supplier.name if product.supplier else '',
                product.status
            ])
        return response

    @action(detail=False, methods=['get'])
    def export_xlsx(self, request):
        """Export products as Excel"""
        products = self.get_queryset().values(
            'barcode', 'name', 'category', 'unit_cost', 'unit_price', 'status'
        )
        df = pd.DataFrame(products)
        
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="products.xlsx"'
        
        df.to_excel(response, index=False, sheet_name='Products')
        return response


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'city', 'country']
    ordering_fields = ['name', 'capacity']

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export warehouses as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="warehouses.csv"'
        writer = csv.writer(response)
        writer.writerow(['Name', 'Address', 'City', 'Country', 'Manager', 'Capacity'])
        
        warehouses = self.get_queryset()
        for warehouse in warehouses:
            writer.writerow([
                warehouse.name, warehouse.address, warehouse.city,
                warehouse.country, warehouse.manager_name, warehouse.capacity
            ])
        return response


class InventoryLocationViewSet(viewsets.ModelViewSet):
    queryset = InventoryLocation.objects.select_related('warehouse', 'product')
    serializer_class = InventoryLocationSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['warehouse__name', 'product__name', 'aisle', 'rack']
    ordering_fields = ['quantity', 'last_counted']

    @action(detail=False, methods=['get'])
    def warehouse_summary(self, request):
        """Get inventory summary by warehouse"""
        warehouse_id = request.query_params.get('warehouse_id')
        
        query = InventoryLocation.objects.select_related('warehouse', 'product')
        if warehouse_id:
            query = query.filter(warehouse_id=warehouse_id)
        
        summary = query.values('warehouse__name').annotate(
            total_items=Sum('quantity'),
            unique_products=Count('product', distinct=True)
        )
        return Response(summary)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export inventory locations as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="inventory.csv"'
        writer = csv.writer(response)
        writer.writerow(['Product', 'Warehouse', 'Aisle', 'Rack', 'Shelf', 'Bin', 'Quantity', 'Batch', 'Expiry'])
        
        locations = self.get_queryset()
        for location in locations:
            writer.writerow([
                location.product.name, location.warehouse.name,
                location.aisle, location.rack, location.shelf, location.bin,
                location.quantity, location.batch_number, location.expiry_date
            ])
        return response


class MovementViewSet(viewsets.ModelViewSet):
    queryset = Movement.objects.select_related('inventory_location', 'created_by')
    serializer_class = MovementSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['movement_type', 'reference_number']
    ordering_fields = ['created_at', 'movement_type']

    def perform_create(self, serializer):
        """Record user who created movement"""
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def movement_history(self, request):
        """Get movement history for a product"""
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        movements = self.get_queryset().filter(inventory_location__product_id=product_id)
        serializer = self.get_serializer(movements, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export movements as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="movements.csv"'
        writer = csv.writer(response)
        writer.writerow(['Type', 'Product', 'Quantity', 'Reference', 'Created By', 'Date'])
        
        movements = self.get_queryset()
        for movement in movements:
            writer.writerow([
                movement.movement_type,
                movement.inventory_location.product.name,
                movement.quantity,
                movement.reference_number,
                movement.created_by.username if movement.created_by else '',
                movement.created_at
            ])
        return response


class QualityControlViewSet(viewsets.ModelViewSet):
    queryset = QualityControl.objects.select_related('inventory_location', 'checked_by')
    serializer_class = QualityControlSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['status', 'inventory_location__product__name']
    ordering_fields = ['status', 'created_at']

    def perform_create(self, serializer):
        """Record user who checked quality"""
        serializer.save(checked_by=self.request.user)

    @action(detail=False, methods=['get'])
    def pending_checks(self, request):
        """Get pending quality control checks"""
        checks = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(checks, many=True)
        return Response(serializer.data)


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related('supplier', 'product', 'created_by')
    serializer_class = PurchaseOrderSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['po_number', 'supplier__name', 'product__name']
    ordering_fields = ['created_at', 'status', 'expected_delivery']

    def perform_create(self, serializer):
        """Record user who created PO"""
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'])
    def create_po(self, request):
        """
        Create purchase order with comprehensive validation
        
        Expected payload:
        {
            "supplier_id": "uuid",
            "product_id": "uuid",
            "quantity": 10,
            "expected_delivery": "2025-03-15"
        }
        """
        try:
            # Validate required fields
            required_fields = {'supplier_id', 'product_id', 'quantity', 'expected_delivery'}
            errors = validate_required_fields(request.data, required_fields)
            
            if errors:
                return APIResponse.validation_error(errors)
            
            supplier_id = request.data.get('supplier_id')
            product_id = request.data.get('product_id')
            quantity = request.data.get('quantity')
            expected_delivery = request.data.get('expected_delivery')
            
            # Validate quantity is a positive integer
            quantity_error = validate_numeric_range(
                {'quantity': quantity}, 
                'quantity', 
                min_val=1,
                field_name='Quantity'
            )
            if quantity_error:
                return APIResponse.validation_error({'quantity': quantity_error})
            
            quantity = int(quantity)
            
            # Fetch supplier
            try:
                supplier = Supplier.objects.get(id=supplier_id)
            except Supplier.DoesNotExist:
                return APIResponse.error(
                    'Supplier not found',
                    errors={'supplier_id': f'Supplier with ID {supplier_id} does not exist'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Fetch product
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                return APIResponse.error(
                    'Product not found',
                    errors={'product_id': f'Product with ID {product_id} does not exist'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Verify product-supplier relationship
            if product.supplier_id and product.supplier_id != supplier.id:
                return APIResponse.error(
                    'Invalid product-supplier combination',
                    errors={'supplier_id': f'Product {product.name} is supplied by {product.supplier.name}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate PO number and calculate total cost
            po_number = f"PO-{timezone.now().strftime('%Y%m%d%H%M%S')}"
            total_cost = quantity * product.unit_cost
            
            # Create PO
            po = PurchaseOrder.objects.create(
                po_number=po_number,
                supplier=supplier,
                product=product,
                quantity=quantity,
                unit_cost=product.unit_cost,
                total_cost=total_cost,
                expected_delivery=expected_delivery,
                created_by=request.user,
                status='draft'
            )
            
            serializer = self.get_serializer(po)
            return APIResponse.success(
                data=serializer.data,
                message=f'Purchase order {po_number} created successfully',
                status=status.HTTP_201_CREATED
            )
            
        except ValueError as e:
            logger.error(f'Validation error in create_po: {str(e)}')
            return APIResponse.error(
                'Invalid data format',
                errors={'general': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f'Error creating PO: {str(e)}', exc_info=True)
            return APIResponse.server_error(
                message='Failed to create purchase order',
                context='create_po'
            )

    @action(detail=False, methods=['post'])
    def mark_received(self, request):
        """Mark PO as received"""
        po_id = request.data.get('po_id')
        try:
            po = PurchaseOrder.objects.get(id=po_id)
            po.status = 'received'
            po.actual_delivery = timezone.now().date()
            po.save()
            
            # Update inventory
            locations = InventoryLocation.objects.filter(product=po.product)
            if locations.exists():
                location = locations.first()
                location.quantity += po.quantity
                location.save()
            
            serializer = self.get_serializer(po)
            return Response(serializer.data)
        except PurchaseOrder.DoesNotExist:
            return Response({'error': 'PO not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export POs as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="purchase_orders.csv"'
        writer = csv.writer(response)
        writer.writerow(['PO Number', 'Supplier', 'Product', 'Quantity', 'Total Cost', 'Status', 'Expected Delivery'])
        
        pos = self.get_queryset()
        for po in pos:
            writer.writerow([
                po.po_number, po.supplier.name, po.product.name,
                po.quantity, po.total_cost, po.status, po.expected_delivery
            ])
        return response


class SalesOrderViewSet(viewsets.ModelViewSet):
    queryset = SalesOrder.objects.select_related('product', 'created_by')
    serializer_class = SalesOrderSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['so_number', 'product__name', 'customer_name']
    ordering_fields = ['created_at', 'status', 'ship_date']

    def perform_create(self, serializer):
        """Record user who created SO"""
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'])
    def create_so(self, request):
        """Create sales order"""
        try:
            product_id = request.data.get('product_id')
            quantity = int(request.data.get('quantity'))
            customer_name = request.data.get('customer_name')
            customer_email = request.data.get('customer_email')
            customer_phone = request.data.get('customer_phone')
            ship_date = request.data.get('ship_date')
            
            product = Product.objects.get(id=product_id)
            
            so_number = f"SO-{timezone.now().strftime('%Y%m%d%H%M%S')}"
            total_price = quantity * product.unit_price
            
            so = SalesOrder.objects.create(
                so_number=so_number,
                product=product,
                quantity=quantity,
                unit_price=product.unit_price,
                total_price=total_price,
                customer_name=customer_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
                ship_date=ship_date,
                created_by=request.user
            )
            
            # Update inventory
            locations = InventoryLocation.objects.filter(product=product)
            if locations.exists():
                location = locations.first()
                location.quantity -= quantity
                location.save()
            
            # Record sales analytics
            today = timezone.now().date()
            analytics, created = SalesAnalytics.objects.get_or_create(
                product=product,
                date=today,
                defaults={'units_sold': quantity, 'revenue': total_price}
            )
            if not created:
                analytics.units_sold += quantity
                analytics.revenue += total_price
                analytics.save()
            
            serializer = self.get_serializer(so)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export SOs as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="sales_orders.csv"'
        writer = csv.writer(response)
        writer.writerow(['SO Number', 'Product', 'Quantity', 'Total Price', 'Customer', 'Status', 'Ship Date'])
        
        sos = self.get_queryset()
        for so in sos:
            writer.writerow([
                so.so_number, so.product.name, so.quantity, so.total_price,
                so.customer_name, so.status, so.ship_date
            ])
        return response


class SalesAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SalesAnalytics.objects.select_related('product')
    serializer_class = SalesAnalyticsSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name']
    ordering_fields = ['date', 'units_sold', 'revenue']

    @action(detail=False, methods=['get'])
    def sales_trends(self, request):
        """Get sales trends for last 30 days"""
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        analytics = self.get_queryset().filter(date__gte=thirty_days_ago)

        # If there is no recent data for the last 30 calendar days,
        # fall back to the latest available 30-day range in the dataset.
        if not analytics.exists():
            latest_date = self.get_queryset().order_by('-date').values_list('date', flat=True).first()
            if latest_date:
                thirty_days_ago = latest_date - timedelta(days=29)
                analytics = self.get_queryset().filter(date__gte=thirty_days_ago)
        
        data = analytics.values('date').annotate(
            total_units=Sum('units_sold'),
            total_revenue=Sum('revenue')
        ).order_by('date')
        return Response(data)

    @action(detail=False, methods=['get'])
    def top_products(self, request):
        """Get top selling products"""
        top_products = self.get_queryset().values('product__name').annotate(
            total_units=Sum('units_sold'),
            total_revenue=Sum('revenue')
        ).order_by('-total_units')[:10]
        return Response(top_products)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export sales analytics as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="sales_analytics.csv"'
        writer = csv.writer(response)
        writer.writerow(['Product', 'Date', 'Units Sold', 'Revenue'])
        
        analytics = self.get_queryset()
        for entry in analytics:
            writer.writerow([
                entry.product.name, entry.date, entry.units_sold, entry.revenue
            ])
        return response


class ForecastViewSet(viewsets.ModelViewSet):
    queryset = Forecast.objects.select_related('product')
    serializer_class = ForecastSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name']
    ordering_fields = ['forecast_date', 'predicted_demand']

    @action(detail=False, methods=['post'])
    def generate_forecast(self, request):
        """Generate demand forecast for a product"""
        try:
            product_id = request.data.get('product_id')
            days_ahead = int(request.data.get('days_ahead', 30))
            
            product = Product.objects.get(id=product_id)
            
            # Get historical data
            analytics = SalesAnalytics.objects.filter(product=product).order_by('date')
            
            if analytics.count() < 1:
                return Response(
                    {'error': 'Insufficient historical data for forecasting'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            dates = [entry.date.toordinal() for entry in analytics]
            units = [entry.units_sold for entry in analytics]
            average_units = sum(units) / len(units)
            trend = 0
            if len(units) > 1:
                trend = (units[-1] - units[0]) / max(1, len(units) - 1)

            forecasts = []
            today = timezone.now().date()
            for i in range(1, days_ahead + 1):
                forecast_date = today + timedelta(days=i)
                predicted_units = max(0, int(round(average_units + trend * i)))
                confidence = min(0.95, 0.5 + len(analytics) * 0.05)

                forecast, created = Forecast.objects.update_or_create(
                    product=product,
                    forecast_date=forecast_date,
                    defaults={
                        'predicted_demand': predicted_units,
                        'confidence_score': confidence
                    }
                )
                forecasts.append(forecast)
            
            serializer = self.get_serializer(forecasts, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export forecasts as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="forecasts.csv"'
        writer = csv.writer(response)
        writer.writerow(['Product', 'Forecast Date', 'Predicted Demand', 'Confidence'])
        
        forecasts = self.get_queryset()
        for forecast in forecasts:
            writer.writerow([
                forecast.product.name,
                forecast.forecast_date,
                forecast.predicted_demand,
                forecast.confidence_score
            ])
        return response
