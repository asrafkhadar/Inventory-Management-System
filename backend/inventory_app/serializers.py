from rest_framework import serializers
from .models import (
    Supplier, Product, Warehouse, InventoryLocation, Movement,
    QualityControl, PurchaseOrder, SalesOrder, SalesAnalytics, Forecast
)


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'


class InventoryLocationSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    
    class Meta:
        model = InventoryLocation
        fields = '__all__'


class MovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='inventory_location.product.name', read_only=True)
    warehouse_name = serializers.CharField(source='inventory_location.warehouse.name', read_only=True)
    
    class Meta:
        model = Movement
        fields = '__all__'


class QualityControlSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='inventory_location.product.name', read_only=True)
    
    class Meta:
        model = QualityControl
        fields = '__all__'


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = '__all__'


class SalesOrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = SalesOrder
        fields = '__all__'


class SalesAnalyticsSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = SalesAnalytics
        fields = '__all__'


class ForecastSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = Forecast
        fields = '__all__'
