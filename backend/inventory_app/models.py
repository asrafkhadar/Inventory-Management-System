from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

class Supplier(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    contract_file = models.FileField(upload_to='contracts/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    CATEGORY_CHOICES = [
        ('electronics', 'Electronics'),
        ('textiles', 'Textiles'),
        ('furniture', 'Furniture'),
        ('food', 'Food & Beverage'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('discontinued', 'Discontinued'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    barcode = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    reorder_level = models.IntegerField()
    # image = models.ImageField(upload_to='products/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Warehouse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    address = models.TextField()
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    manager_name = models.CharField(max_length=255)
    manager_phone = models.CharField(max_length=20)
    capacity = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class InventoryLocation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    aisle = models.CharField(max_length=50)
    rack = models.CharField(max_length=50)
    shelf = models.CharField(max_length=50)
    bin = models.CharField(max_length=50)
    quantity = models.IntegerField(default=0)
    batch_number = models.CharField(max_length=100, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    last_counted = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('warehouse', 'product', 'aisle', 'rack', 'shelf', 'bin')

    def __str__(self):
        return f"{self.product.name} - {self.warehouse.name} - {self.aisle}-{self.rack}-{self.shelf}-{self.bin}"


class Movement(models.Model):
    MOVEMENT_TYPE = [
        ('inbound', 'Inbound'),
        ('outbound', 'Outbound'),
        ('transfer', 'Transfer'),
        ('adjustment', 'Adjustment'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inventory_location = models.ForeignKey(InventoryLocation, on_delete=models.CASCADE)
    movement_type = models.CharField(max_length=50, choices=MOVEMENT_TYPE)
    quantity = models.IntegerField()
    reference_number = models.CharField(max_length=100)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.movement_type} - {self.inventory_location.product.name} - {self.quantity}"


class QualityControl(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('passed', 'Passed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inventory_location = models.ForeignKey(InventoryLocation, on_delete=models.CASCADE)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    checked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"QC - {self.inventory_location.product.name} - {self.status}"


class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('confirmed', 'Confirmed'),
        ('shipped', 'Shipped'),
        ('received', 'Received'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    po_number = models.CharField(max_length=100, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='draft')
    expected_delivery = models.DateField()
    actual_delivery = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.po_number


class SalesOrder(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('packed', 'Packed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    so_number = models.CharField(max_length=100, unique=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    ship_date = models.DateField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.so_number


class SalesAnalytics(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    date = models.DateField()
    units_sold = models.IntegerField()
    revenue = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'date')

    def __str__(self):
        return f"{self.product.name} - {self.date} - {self.units_sold} units"


class Forecast(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    forecast_date = models.DateField()
    predicted_demand = models.IntegerField()
    confidence_score = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.product.name} - {self.forecast_date} - {self.predicted_demand} units"
