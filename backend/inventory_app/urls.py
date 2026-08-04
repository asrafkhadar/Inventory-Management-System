from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SupplierViewSet, ProductViewSet, WarehouseViewSet,
    InventoryLocationViewSet, MovementViewSet, QualityControlViewSet,
    PurchaseOrderViewSet, SalesOrderViewSet, SalesAnalyticsViewSet, ForecastViewSet
)

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet)
router.register(r'products', ProductViewSet)
router.register(r'warehouses', WarehouseViewSet)
router.register(r'inventory-locations', InventoryLocationViewSet)
router.register(r'movements', MovementViewSet)
router.register(r'quality-control', QualityControlViewSet)
router.register(r'purchase-orders', PurchaseOrderViewSet)
router.register(r'sales-orders', SalesOrderViewSet)
router.register(r'sales-analytics', SalesAnalyticsViewSet)
router.register(r'forecasts', ForecastViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
