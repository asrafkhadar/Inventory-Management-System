// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';
const API_ENDPOINTS = {
    suppliers: `${API_BASE_URL}/suppliers/`,
    products: `${API_BASE_URL}/products/`,
    warehouses: `${API_BASE_URL}/warehouses/`,
    inventory: `${API_BASE_URL}/inventory-locations/`,
    movements: `${API_BASE_URL}/movements/`,
    quality: `${API_BASE_URL}/quality-control/`,
    purchaseOrders: `${API_BASE_URL}/purchase-orders/`,
    salesOrders: `${API_BASE_URL}/sales-orders/`,
    analytics: `${API_BASE_URL}/sales-analytics/`,
    forecasts: `${API_BASE_URL}/forecasts/`
};

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('token');
}

// Set auth token
function setAuthToken(token) {
    localStorage.setItem('token', token);
}

// Remove auth token
function removeAuthToken() {
    localStorage.removeItem('token');
}

// API Helper Functions
async function apiCall(url, method = 'GET', data = null, isFormData = false) {
    const options = {
        method,
        headers: {}
    };

    // Add Authorization header if token exists
    const token = getAuthToken();
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
        if (isFormData) {
            options.body = data;
        } else {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(data);
        }
    }

    try {
        const response = await fetch(url, options);
        
        if (response.status === 401) {
            removeAuthToken();
            localStorage.removeItem('user');
            window.location.href = '/login.html';
            return null;
        }

        if (response.ok) {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                return await response.json();
            } else if (contentType.includes('text/csv') ||
                       contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
                       contentType.includes('application/pdf')) {
                return await response.blob();
            } else if (response.status === 204) {
                return { success: true };
            } else {
                return await response.text();
            }
        } else {
            // Attempt to parse error response as JSON
            let errorData = {};
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { message: response.statusText };
                }
            } else {
                errorData = { message: response.statusText };
            }

            // Create proper Error instance with detailed information
            const apiError = new Error(
                errorData.detail || 
                errorData.message || 
                errorData.error ||
                response.statusText || 
                'Unknown API Error'
            );
            
            apiError.status = response.status;
            apiError.data = errorData;
            apiError.errors = errorData.errors || {};
            
            throw apiError;
        }
    } catch (error) {
        // Enhanced error logging for debugging
        console.error('API Error Details:', {
            url,
            method,
            status: error.status,
            message: error.message,
            data: error.data,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}

// GET request
async function apiGet(url) {
    return apiCall(url, 'GET');
}

// POST request
async function apiPost(url, data) {
    return apiCall(url, 'POST', data);
}

// PUT request
async function apiPut(url, data) {
    return apiCall(url, 'PUT', data);
}

// PATCH request
async function apiPatch(url, data) {
    return apiCall(url, 'PATCH', data);
}

// DELETE request
async function apiDelete(url) {
    return apiCall(url, 'DELETE');
}

// Fetch with pagination
async function apiGetPaginated(url, page = 1) {
    return apiGet(`${url}?page=${page}`);
}

// Search API
async function apiSearch(endpoint, query) {
    return apiGet(`${endpoint}?search=${encodeURIComponent(query)}`);
}

// Export CSV
async function apiExportCSV(endpoint) {
    return apiCall(`${endpoint}export_csv/`, 'GET');
}

// Export PDF
async function apiExportPDF(endpoint) {
    return apiCall(`${endpoint}export_pdf/`, 'GET');
}

// Export XLSX
async function apiExportXLSX(endpoint) {
    return apiCall(`${endpoint}export_xlsx/`, 'GET');
}

// User Authentication
async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            setAuthToken(data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } else {
            throw new Error('Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function logout() {
    removeAuthToken();
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Specific API Functions
async function getSuppliers(page = 1) {
    return apiGetPaginated(API_ENDPOINTS.suppliers, page);
}

async function getProducts(page = 1) {
    return apiGetPaginated(API_ENDPOINTS.products, page);
}

async function getWarehouses(page = 1) {
    return apiGetPaginated(API_ENDPOINTS.warehouses, page);
}

async function getInventory(page = 1) {
    return apiGetPaginated(API_ENDPOINTS.inventory, page);
}

async function getPurchaseOrders(page = 1) {
    return apiGetPaginated(API_ENDPOINTS.purchaseOrders, page);
}

async function getSalesOrders(page = 1) {
    return apiGetPaginated(API_ENDPOINTS.salesOrders, page);
}

async function createSupplier(data) {
    return apiPost(API_ENDPOINTS.suppliers, data);
}

async function createProduct(data) {
    return apiPost(API_ENDPOINTS.products, data);
}

async function createWarehouse(data) {
    return apiPost(API_ENDPOINTS.warehouses, data);
}

async function createPurchaseOrder(data) {
    return apiPost(`${API_ENDPOINTS.purchaseOrders}create_po/`, data);
}

async function createSalesOrder(data) {
    return apiPost(`${API_ENDPOINTS.salesOrders}create_so/`, data);
}

async function updateSupplier(id, data) {
    return apiPut(`${API_ENDPOINTS.suppliers}${id}/`, data);
}

async function updateProduct(id, data) {
    return apiPut(`${API_ENDPOINTS.products}${id}/`, data);
}

async function updateWarehouse(id, data) {
    return apiPut(`${API_ENDPOINTS.warehouses}${id}/`, data);
}

async function updatePurchaseOrder(id, data) {
    return apiPut(`${API_ENDPOINTS.purchaseOrders}${id}/`, data);
}

async function updateSalesOrder(id, data) {
    return apiPut(`${API_ENDPOINTS.salesOrders}${id}/`, data);
}

async function deleteSupplier(id) {
    return apiDelete(`${API_ENDPOINTS.suppliers}${id}/`);
}

async function deleteProduct(id) {
    return apiDelete(`${API_ENDPOINTS.products}${id}/`);
}

async function deleteWarehouse(id) {
    return apiDelete(`${API_ENDPOINTS.warehouses}${id}/`);
}

async function deletePurchaseOrder(id) {
    return apiDelete(`${API_ENDPOINTS.purchaseOrders}${id}/`);
}

async function deleteSalesOrder(id) {
    return apiDelete(`${API_ENDPOINTS.salesOrders}${id}/`);
}

// Specific actions
async function lookupBarcode(barcode) {
    return apiGet(`${API_ENDPOINTS.products}barcode_lookup/?barcode=${encodeURIComponent(barcode)}`);
}

async function getLowStockProducts() {
    return apiGet(`${API_ENDPOINTS.products}low_stock/`);
}

async function getMovementHistory(productId) {
    return apiGet(`${API_ENDPOINTS.movements}movement_history/?product_id=${productId}`);
}

async function getPendingQualityChecks() {
    return apiGet(`${API_ENDPOINTS.quality}pending_checks/`);
}

async function markPOAsReceived(poId) {
    return apiPost(`${API_ENDPOINTS.purchaseOrders}mark_received/`, { po_id: poId });
}

async function getSalesTrends() {
    return apiGet(`${API_ENDPOINTS.analytics}sales_trends/`);
}

async function getTopProducts() {
    return apiGet(`${API_ENDPOINTS.analytics}top_products/`);
}

async function generateForecast(productId, daysAhead = 30) {
    return apiPost(`${API_ENDPOINTS.forecasts}generate_forecast/`, {
        product_id: productId,
        days_ahead: daysAhead
    });
}

async function getForecasts() {
    return apiGet(API_ENDPOINTS.forecasts);
}

async function getInventorySummary(warehouseId = null) {
    let url = `${API_ENDPOINTS.inventory}warehouse_summary/`;
    if (warehouseId) {
        url += `?warehouse_id=${warehouseId}`;
    }
    return apiGet(url);
}

// Export functions
async function exportSupplierCSV() {
    const response = await apiExportCSV(API_ENDPOINTS.suppliers);
    downloadFile(response, 'suppliers.csv', 'text/csv');
}

async function exportSupplierPDF() {
    const response = await apiExportPDF(API_ENDPOINTS.suppliers);
    downloadFile(response, 'suppliers.pdf', 'application/pdf');
}

async function exportProductCSV() {
    const response = await apiExportCSV(API_ENDPOINTS.products);
    downloadFile(response, 'products.csv', 'text/csv');
}

async function exportProductXLSX() {
    const response = await apiExportXLSX(API_ENDPOINTS.products);
    downloadFile(response, 'products.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

async function exportInventoryCSV() {
    const response = await apiExportCSV(API_ENDPOINTS.inventory);
    downloadFile(response, 'inventory.csv', 'text/csv');
}

async function exportPOCSV() {
    const response = await apiExportCSV(API_ENDPOINTS.purchaseOrders);
    downloadFile(response, 'purchase_orders.csv', 'text/csv');
}

async function exportSOCSV() {
    const response = await apiExportCSV(API_ENDPOINTS.salesOrders);
    downloadFile(response, 'sales_orders.csv', 'text/csv');
}

async function exportAnalyticsCSV() {
    const response = await apiExportCSV(API_ENDPOINTS.analytics);
    downloadFile(response, 'sales_analytics.csv', 'text/csv');
}

async function exportForecastCSV() {
    const response = await apiExportCSV(API_ENDPOINTS.forecasts);
    downloadFile(response, 'forecasts.csv', 'text/csv');
}

// Helper function to download files
function downloadFile(response, filename, mimeType) {
    let blob;
    if (response instanceof Blob) {
        blob = response;
    } else if (response instanceof ArrayBuffer) {
        blob = new Blob([response], { type: mimeType });
    } else {
        blob = new Blob([response], { type: mimeType });
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}
