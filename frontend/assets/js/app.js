// Main Application Module
const App = {
    data: {
        suppliers: [],
        products: [],
        warehouses: [],
        inventory: [],
        purchaseOrders: [],
        salesOrders: [],
        analytics: [],
        forecasts: []
    },

    init() {
        try {
            // Check if user is logged in
            const user = localStorage.getItem('user');
            if (!user) {
                console.log('No user found in localStorage, redirecting to login');
                window.location.href = '/login.html';
                return;
            }

            console.log('User found:', user);
            
            // Initialize Auth module
            Auth.init();
            
            // Setup all event listeners
            this.setupEventListeners();
            
            // Load dashboard data
            console.log('Loading dashboard...');
            this.loadDashboard();
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
            showError('Failed to initialize application: ' + error.message);
            // Redirect to login on error
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        }
    },

    setupEventListeners() {
        try {
            // Navigation Links
            document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                UI.navigateToSection(section);
            });
        });

        // Menu Toggle
        document.querySelector('.menu-toggle')?.addEventListener('click', () => {
            document.querySelector('.sidebar')?.classList.toggle('collapsed');
        });

        // Modal Close Buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = btn.closest('.modal');
                if (modal) {
                    modal.classList.remove('show');
                }
            });
        });

        // Dashboard
        document.getElementById('refreshDashboard')?.addEventListener('click', () => this.loadDashboard());

        // Inventory
        document.getElementById('addInventoryBtn')?.addEventListener('click', () => this.openInventoryModal());
        document.getElementById('exportInventoryBtn')?.addEventListener('click', () => this.exportInventoryData());
        document.getElementById('inventorySearch')?.addEventListener('input', debounce(() => this.searchInventory(), 300));
        document.getElementById('warehouseFilter')?.addEventListener('change', () => this.filterInventory());
        document.getElementById('statusFilter')?.addEventListener('change', () => this.filterInventory());
        document.getElementById('inventoryForm')?.addEventListener('submit', (e) => this.handleInventoryFormSubmit(e));

        // Products
        document.getElementById('addProductBtn')?.addEventListener('click', () => this.openProductModal());
        document.getElementById('exportProductsBtn')?.addEventListener('click', () => this.exportProductData());
        document.getElementById('barcodeSearchBtn')?.addEventListener('click', () => UI.openModal('barcodeModal'));
        document.getElementById('productSearch')?.addEventListener('input', debounce(() => this.searchProducts(), 300));
        document.getElementById('categoryFilter')?.addEventListener('change', () => this.filterProducts());
        document.getElementById('productForm')?.addEventListener('submit', (e) => this.handleProductFormSubmit(e));

        // Suppliers
        document.getElementById('addSupplierBtn')?.addEventListener('click', () => this.openSupplierModal());
        document.getElementById('exportSuppliersBtn')?.addEventListener('click', () => this.exportSupplierData());
        document.getElementById('supplierSearch')?.addEventListener('input', debounce(() => this.searchSuppliers(), 300));
        document.getElementById('supplierForm')?.addEventListener('submit', (e) => this.handleSupplierFormSubmit(e));

        // Warehouses
        document.getElementById('addWarehouseBtn')?.addEventListener('click', () => this.openWarehouseModal());
        document.getElementById('exportWarehousesBtn')?.addEventListener('click', () => this.exportWarehouseData());
        document.getElementById('warehouseSearch')?.addEventListener('input', debounce(() => this.searchWarehouses(), 300));
        document.getElementById('warehouseForm')?.addEventListener('submit', (e) => this.handleWarehouseFormSubmit(e));

        // Purchase Orders
        document.getElementById('createPOBtn')?.addEventListener('click', () => this.openPOModal());
        document.getElementById('exportPOsBtn')?.addEventListener('click', () => this.exportPOData());
        document.getElementById('poSearch')?.addEventListener('input', debounce(() => this.searchPurchaseOrders(), 300));
        document.getElementById('poForm')?.addEventListener('submit', (e) => this.handlePOFormSubmit(e));

        // Sales Orders
        document.getElementById('createSOBtn')?.addEventListener('click', () => this.openSOModal());
        document.getElementById('exportSOsBtn')?.addEventListener('click', () => this.exportSOData());
        document.getElementById('soSearch')?.addEventListener('input', debounce(() => this.searchSalesOrders(), 300));
        document.getElementById('soForm')?.addEventListener('submit', (e) => this.handleSOFormSubmit(e));

        // Reports
        document.getElementById('viewSalesTrends')?.addEventListener('click', () => this.showSalesTrends());
        document.getElementById('viewTopProducts')?.addEventListener('click', () => this.showTopProducts());
        document.getElementById('viewLowStock')?.addEventListener('click', () => this.showLowStock());
        document.getElementById('viewInventorySummary')?.addEventListener('click', () => this.showInventorySummary());
        document.getElementById('generateReportBtn')?.addEventListener('click', () => this.generateReport());

        // Forecasts
        document.getElementById('generateForecastBtn')?.addEventListener('click', () => this.openForecastModal());
        document.getElementById('exportForecastsBtn')?.addEventListener('click', () => this.exportForecastData());

        // Barcode
        document.getElementById('barcodeForm')?.addEventListener('submit', (e) => this.handleBarcodeSearch(e));

        // Global search
        document.getElementById('searchBtn')?.addEventListener('click', () => this.globalSearch());
        document.getElementById('globalSearch')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.globalSearch();
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
        } catch (error) {
            console.error('Error setting up event listeners:', error);
            showError('Failed to setup event listeners: ' + error.message);
        }
    },

    // Logout handler
    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        window.location.href = '/login.html';
    },

    // Dashboard
    async loadDashboard() {
        try {
            const [suppliers, products, warehouses, pos, sos, lowStock] = await Promise.all([
                apiGet(API_ENDPOINTS.suppliers),
                apiGet(API_ENDPOINTS.products),
                apiGet(API_ENDPOINTS.warehouses),
                apiGet(API_ENDPOINTS.purchaseOrders),
                apiGet(API_ENDPOINTS.salesOrders),
                apiGet(`${API_ENDPOINTS.products}low_stock/`)
            ]);

            document.getElementById('totalSuppliers').textContent = suppliers.count || 0;
            document.getElementById('totalProducts').textContent = products.count || 0;
            document.getElementById('totalWarehouses').textContent = warehouses.count || 0;
            document.getElementById('totalPOs').textContent = pos.count || 0;
            document.getElementById('totalSOs').textContent = sos.count || 0;
            document.getElementById('lowStockCount').textContent = lowStock.length || 0;

            // Load charts
            this.loadCharts();
            showSuccess('Dashboard updated successfully');
        } catch (error) {
            console.error('Dashboard load error:', error);
            showError('Failed to load dashboard: ' + (error.message || 'Unknown error'));
        }
    },

    async loadCharts() {
        try {
            const trends = await apiGet(`${API_ENDPOINTS.analytics}sales_trends/`);
            const topProducts = await apiGet(`${API_ENDPOINTS.analytics}top_products/`);

            // Sales trends chart
            const salesTrendCard = document.getElementById('salesTrendChart')?.closest('.card');
            if (trends && trends.length > 0) {
                const labels = trends.map(t => formatDate(t.date));
                const data = trends.map(t => t.total_units);
                salesTrendCard?.querySelector('.no-data')?.remove();
                UI.renderLineChart('salesTrendChart', labels, [{
                    label: 'Units Sold',
                    data
                }], 'Sales Trends (30 Days)');
            } else {
                if (salesTrendCard) {
                    let noDataMessage = salesTrendCard.querySelector('.no-data');
                    if (!noDataMessage) {
                        noDataMessage = document.createElement('p');
                        noDataMessage.className = 'no-data';
                        salesTrendCard.appendChild(noDataMessage);
                    }
                    noDataMessage.textContent = 'No sales trend data is available for the last 30 days.';
                }
            }

            // Top products chart
            if (topProducts && topProducts.length > 0) {
                const labels = topProducts.map(p => p.product__name);
                const data = topProducts.map(p => p.total_units);
                UI.renderBarChart('topProductsChart', labels, [{
                    label: 'Units Sold',
                    data
                }], 'Top Products');
            }
        } catch (error) {
            console.error('Charts load error:', error);
        }
    },

    // Product Management
    async openProductModal(productId = null) {
        UI.openModal('productModal');
        
        if (productId) {
            document.getElementById('productModalTitle').textContent = 'Edit Product';
            const product = await apiGet(`${API_ENDPOINTS.products}${productId}/`);
            UI.populateForm('productForm', product);
            document.getElementById('productForm').dataset.id = productId;
        } else {
            document.getElementById('productModalTitle').textContent = 'Add Product';
            UI.clearForm('productForm');
            delete document.getElementById('productForm').dataset.id;
        }

        // Load suppliers
        const suppliers = await apiGet(API_ENDPOINTS.suppliers);
        UI.populateSelect('productSupplier', suppliers.results || suppliers, 'id', 'name');
    },

    async handleProductFormSubmit(e) {
        e.preventDefault();
        try {
            const data = parseFormData(document.getElementById('productForm'));
            const formId = document.getElementById('productForm').dataset.id;

            if (formId) {
                await apiPut(`${API_ENDPOINTS.products}${formId}/`, data);
                showSuccess('Product updated successfully');
            } else {
                await apiPost(API_ENDPOINTS.products, data);
                showSuccess('Product created successfully');
            }

            UI.closeModal('productModal');
            this.loadProducts();
        } catch (error) {
            showError('Failed to save product: ' + error.message);
        }
    },

    async loadProducts() {
        try {
            this.data.products = await apiGet(API_ENDPOINTS.products);
            this.renderProductsTable(this.data.products.results || this.data.products);
        } catch (error) {
            showError('Failed to load products: ' + error.message);
        }
    },

    renderProductsTable(products) {
        const tbody = document.getElementById('productsTableBody');
        emptyElement(tbody);

        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.barcode}</td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.supplier_name || '-'}</td>
                <td>${formatCurrency(product.unit_price)}</td>
                <td>${createStatusBadge(product.status).outerHTML}</td>
                <td>
                    <button class="btn-warning" onclick="App.openProductModal('${product.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-danger" onclick="App.deleteProduct('${product.id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    async deleteProduct(productId) {
        if (!confirm('Are you sure?')) return;
        try {
            await apiDelete(`${API_ENDPOINTS.products}${productId}/`);
            showSuccess('Product deleted successfully');
            this.loadProducts();
        } catch (error) {
            showError('Failed to delete product: ' + error.message);
        }
    },

    async searchProducts() {
        const query = document.getElementById('productSearch').value;
        if (!query) {
            this.loadProducts();
            return;
        }
        try {
            const results = await apiSearch(API_ENDPOINTS.products, query);
            this.renderProductsTable(results.results || results);
        } catch (error) {
            showError('Search failed: ' + error.message);
        }
    },

    filterProducts() {
        const category = document.getElementById('categoryFilter').value;
        const status = document.getElementById('statusFilter').value;
        let products = this.data.products.results || this.data.products;

        if (category) {
            products = products.filter(p => p.category === category);
        }
        if (status) {
            products = products.filter(p => p.status === status);
        }

        this.renderProductsTable(products);
    },

    async exportProductData() {
        try {
            const format = prompt('Export as: csv (type csv)');
            if (format === 'csv') {
                const response = await apiCall(`${API_ENDPOINTS.products}export_csv/`, 'GET');
                downloadFile(response, 'products.csv', 'text/csv');
                showSuccess('Products exported as CSV');
            } else {
                showError('Only CSV export is supported at this time.');
            }
        } catch (error) {
            showError('Export failed: ' + error.message);
        }
    },

    // Supplier Management
    async openSupplierModal(supplierId = null) {
        UI.openModal('supplierModal');

        if (supplierId) {
            document.getElementById('supplierModalTitle').textContent = 'Edit Supplier';
            const supplier = await apiGet(`${API_ENDPOINTS.suppliers}${supplierId}/`);
            UI.populateForm('supplierForm', supplier);
            document.getElementById('supplierForm').dataset.id = supplierId;
        } else {
            document.getElementById('supplierModalTitle').textContent = 'Add Supplier';
            UI.clearForm('supplierForm');
            delete document.getElementById('supplierForm').dataset.id;
        }
    },

    async handleSupplierFormSubmit(e) {
        e.preventDefault();
        try {
            const data = parseFormData(document.getElementById('supplierForm'));
            const formId = document.getElementById('supplierForm').dataset.id;

            if (formId) {
                await apiPut(`${API_ENDPOINTS.suppliers}${formId}/`, data);
                showSuccess('Supplier updated successfully');
            } else {
                await apiPost(API_ENDPOINTS.suppliers, data);
                showSuccess('Supplier created successfully');
            }

            UI.closeModal('supplierModal');
            this.loadSuppliers();
        } catch (error) {
            showError('Failed to save supplier: ' + error.message);
        }
    },

    async loadSuppliers() {
        try {
            this.data.suppliers = await apiGet(API_ENDPOINTS.suppliers);
            this.renderSuppliersTable(this.data.suppliers.results || this.data.suppliers);
        } catch (error) {
            showError('Failed to load suppliers: ' + error.message);
        }
    },

    renderSuppliersTable(suppliers) {
        const tbody = document.getElementById('suppliersTableBody');
        emptyElement(tbody);

        suppliers.forEach(supplier => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${supplier.name}</td>
                <td>${supplier.email}</td>
                <td>${supplier.phone}</td>
                <td>${supplier.city}</td>
                <td>${supplier.country}</td>
                <td>
                    <button class="btn-warning" onclick="App.openSupplierModal('${supplier.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-danger" onclick="App.deleteSupplier('${supplier.id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    async deleteSupplier(supplierId) {
        if (!confirm('Are you sure?')) return;
        try {
            await apiDelete(`${API_ENDPOINTS.suppliers}${supplierId}/`);
            showSuccess('Supplier deleted successfully');
            this.loadSuppliers();
        } catch (error) {
            showError('Failed to delete supplier: ' + error.message);
        }
    },

    async searchSuppliers() {
        const query = document.getElementById('supplierSearch').value;
        if (!query) {
            this.loadSuppliers();
            return;
        }
        try {
            const results = await apiSearch(API_ENDPOINTS.suppliers, query);
            this.renderSuppliersTable(results.results || results);
        } catch (error) {
            showError('Search failed: ' + error.message);
        }
    },

    async exportSupplierData() {
        try {
            const response = await apiCall(`${API_ENDPOINTS.suppliers}export_csv/`, 'GET');
            downloadFile(response, 'suppliers.csv', 'text/csv');
            showSuccess('Suppliers exported as CSV');
        } catch (error) {
            showError('Export failed: ' + error.message);
        }
    },

    // Warehouse Management
    async openWarehouseModal(warehouseId = null) {
        UI.openModal('warehouseModal');

        if (warehouseId) {
            document.getElementById('warehouseModalTitle').textContent = 'Edit Warehouse';
            const warehouse = await apiGet(`${API_ENDPOINTS.warehouses}${warehouseId}/`);
            UI.populateForm('warehouseForm', warehouse);
            document.getElementById('warehouseForm').dataset.id = warehouseId;
        } else {
            document.getElementById('warehouseModalTitle').textContent = 'Add Warehouse';
            UI.clearForm('warehouseForm');
            delete document.getElementById('warehouseForm').dataset.id;
        }
    },

    async handleWarehouseFormSubmit(e) {
        e.preventDefault();
        try {
            const data = parseFormData(document.getElementById('warehouseForm'));
            const formId = document.getElementById('warehouseForm').dataset.id;

            if (formId) {
                await apiPut(`${API_ENDPOINTS.warehouses}${formId}/`, data);
                showSuccess('Warehouse updated successfully');
            } else {
                await apiPost(API_ENDPOINTS.warehouses, data);
                showSuccess('Warehouse created successfully');
            }

            UI.closeModal('warehouseModal');
            this.loadWarehouses();
        } catch (error) {
            showError('Failed to save warehouse: ' + error.message);
        }
    },

    async loadWarehouses() {
        try {
            this.data.warehouses = await apiGet(API_ENDPOINTS.warehouses);
            this.renderWarehousesTable(this.data.warehouses.results || this.data.warehouses);
            
            // Update warehouse filters
            const warehouseFilter = document.getElementById('warehouseFilter');
            if (warehouseFilter) {
                emptyElement(warehouseFilter);
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'All Warehouses';
                warehouseFilter.appendChild(option);
                
                (this.data.warehouses.results || this.data.warehouses).forEach(wh => {
                    const opt = document.createElement('option');
                    opt.value = wh.id;
                    opt.textContent = wh.name;
                    warehouseFilter.appendChild(opt);
                });
            }
        } catch (error) {
            showError('Failed to load warehouses: ' + error.message);
        }
    },

    renderWarehousesTable(warehouses) {
        const tbody = document.getElementById('warehousesTableBody');
        emptyElement(tbody);

        warehouses.forEach(warehouse => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${warehouse.name}</td>
                <td>${warehouse.address}</td>
                <td>${warehouse.city}</td>
                <td>${warehouse.manager_name}</td>
                <td>${warehouse.capacity}</td>
                <td>
                    <button class="btn-warning" onclick="App.openWarehouseModal('${warehouse.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-danger" onclick="App.deleteWarehouse('${warehouse.id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    async deleteWarehouse(warehouseId) {
        if (!confirm('Are you sure?')) return;
        try {
            await apiDelete(`${API_ENDPOINTS.warehouses}${warehouseId}/`);
            showSuccess('Warehouse deleted successfully');
            this.loadWarehouses();
        } catch (error) {
            showError('Failed to delete warehouse: ' + error.message);
        }
    },

    async searchWarehouses() {
        const query = document.getElementById('warehouseSearch').value;
        if (!query) {
            this.loadWarehouses();
            return;
        }
        try {
            const results = await apiSearch(API_ENDPOINTS.warehouses, query);
            this.renderWarehousesTable(results.results || results);
        } catch (error) {
            showError('Search failed: ' + error.message);
        }
    },

    async exportWarehouseData() {
        try {
            const response = await apiCall(`${API_ENDPOINTS.warehouses}export_csv/`, 'GET');
            downloadFile(response, 'warehouses.csv', 'text/csv');
            showSuccess('Warehouses exported as CSV');
        } catch (error) {
            showError('Export failed: ' + error.message);
        }
    },

    // Inventory Management
    async loadInventory() {
        try {
            this.data.inventory = await apiGet(API_ENDPOINTS.inventory);
            this.renderInventoryTable(this.data.inventory.results || this.data.inventory);
        } catch (error) {
            showError('Failed to load inventory: ' + error.message);
        }
    },

    renderInventoryTable(inventory) {
        const tbody = document.getElementById('inventoryTableBody');
        emptyElement(tbody);

        inventory.forEach(item => {
            const status = item.quantity <= 10 ? 'low-stock' : 'in-stock';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.product_name}</td>
                <td>${item.warehouse_name}</td>
                <td>${item.aisle}-${item.rack}-${item.shelf}-${item.bin}</td>
                <td>${item.quantity}</td>
                <td>${item.batch_number || '-'}</td>
                <td>${formatDate(item.expiry_date) || '-'}</td>
                <td>
                    <button class="btn-warning"><i class="fas fa-edit"></i></button>
                    <button class="btn-info"><i class="fas fa-history"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    async searchInventory() {
        const query = document.getElementById('inventorySearch').value;
        if (!query) {
            this.loadInventory();
            return;
        }
        try {
            const results = await apiSearch(API_ENDPOINTS.inventory, query);
            this.renderInventoryTable(results.results || results);
        } catch (error) {
            showError('Search failed: ' + error.message);
        }
    },

    filterInventory() {
        const warehouseId = document.getElementById('warehouseFilter')?.value;
        const status = document.getElementById('statusFilter')?.value;
        let inventory = this.data.inventory?.results || this.data.inventory || [];

        if (warehouseId) {
            inventory = inventory.filter(item => {
                return String(item.warehouse || item.warehouse_id || item.warehouse_name) === String(warehouseId) ||
                       String(item.warehouse_name) === String(warehouseId);
            });
        }

        if (status) {
            inventory = inventory.filter(item => {
                if (status === 'low-stock') return item.quantity <= 10;
                if (status === 'out-of-stock') return item.quantity === 0;
                return item.quantity > 10;
            });
        }

        this.renderInventoryTable(inventory);
    },

    async exportInventoryData() {
        try {
            const response = await apiCall(`${API_ENDPOINTS.inventory}export_csv/`, 'GET');
            downloadFile(response, 'inventory.csv', 'text/csv');
            showSuccess('Inventory exported as CSV');
        } catch (error) {
            showError('Export failed: ' + error.message);
        }
    },

    // Purchase Orders
    async openInventoryModal() {
        UI.openModal('inventoryModal');
        UI.clearForm('inventoryForm');

        const products = await apiGet(API_ENDPOINTS.products);
        const warehouses = await apiGet(API_ENDPOINTS.warehouses);

        UI.populateSelect('inventoryProduct', products.results || products, 'id', 'name');
        UI.populateSelect('inventoryWarehouse', warehouses.results || warehouses, 'id', 'name');
    },

    async handleInventoryFormSubmit(e) {
        e.preventDefault();
        try {
            const data = parseFormData(document.getElementById('inventoryForm'));
            await apiPost(API_ENDPOINTS.inventory, data);
            showSuccess('Inventory item added successfully');
            UI.closeModal('inventoryModal');
            this.loadInventory();
        } catch (error) {
            showError('Failed to save inventory item: ' + error.message);
        }
    },

    async openPOModal() {
        UI.openModal('poModal');
        UI.clearForm('poForm');

        const suppliers = await apiGet(API_ENDPOINTS.suppliers);
        const products = await apiGet(API_ENDPOINTS.products);

        UI.populateSelect('poSupplier', suppliers.results || suppliers, 'id', 'name');
        UI.populateSelect('poProduct', products.results || products, 'id', 'name');
    },

    async handlePOFormSubmit(e) {
        e.preventDefault();
        try {
            const data = parseFormData(document.getElementById('poForm'));
            const response = await apiPost(`${API_ENDPOINTS.purchaseOrders}create_po/`, data);
            
            showSuccess('Purchase order created successfully');
            UI.closeModal('poModal');
            this.loadPurchaseOrders();
        } catch (error) {
            // Extract detailed error message and validation errors
            let errorMsg = error.message || 'Failed to create PO';
            
            // Show validation errors if present
            if (error.errors && Object.keys(error.errors).length > 0) {
                const fieldErrors = Object.entries(error.errors)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join(', ');
                errorMsg = `${errorMsg} - ${fieldErrors}`;
            } else if (error.data && error.data.errors) {
                const fieldErrors = Object.entries(error.data.errors)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join(', ');
                errorMsg = `${errorMsg} - ${fieldErrors}`;
            }
            
            showError(errorMsg);
            console.error('PO Creation Error:', error);
        }
    },

    async loadPurchaseOrders() {
        try {
            this.data.purchaseOrders = await apiGet(API_ENDPOINTS.purchaseOrders);
            this.renderPOTable(this.data.purchaseOrders.results || this.data.purchaseOrders);
        } catch (error) {
            showError('Failed to load purchase orders: ' + error.message);
        }
    },

    renderPOTable(pos) {
        const tbody = document.getElementById('posTableBody');
        emptyElement(tbody);

        pos.forEach(po => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${po.po_number}</td>
                <td>${po.supplier_name}</td>
                <td>${po.product_name}</td>
                <td>${po.quantity}</td>
                <td>${formatCurrency(po.total_cost)}</td>
                <td>${createStatusBadge(po.status).outerHTML}</td>
                <td>${formatDate(po.expected_delivery)}</td>
                <td>
                    <button class="btn-success" onclick="App.markPOReceived('${po.id}')"><i class="fas fa-check"></i></button>
                    <button class="btn-danger" onclick="App.deletePO('${po.id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    async markPOReceived(poId) {
        try {
            await apiPost(`${API_ENDPOINTS.purchaseOrders}mark_received/`, { po_id: poId });
            showSuccess('PO marked as received');
            this.loadPurchaseOrders();
        } catch (error) {
            showError('Failed to mark PO: ' + error.message);
        }
    },

    async deletePO(poId) {
        if (!confirm('Are you sure?')) return;
        try {
            await apiDelete(`${API_ENDPOINTS.purchaseOrders}${poId}/`);
            showSuccess('PO deleted successfully');
            this.loadPurchaseOrders();
        } catch (error) {
            showError('Failed to delete PO: ' + error.message);
        }
    },

    async searchPurchaseOrders() {
        const query = document.getElementById('poSearch').value;
        if (!query) {
            this.loadPurchaseOrders();
            return;
        }
        try {
            const results = await apiSearch(API_ENDPOINTS.purchaseOrders, query);
            this.renderPOTable(results.results || results);
        } catch (error) {
            showError('Search failed: ' + error.message);
        }
    },

    async exportPOData() {
        try {
            const response = await apiCall(`${API_ENDPOINTS.purchaseOrders}export_csv/`, 'GET');
            downloadFile(response, 'purchase_orders.csv', 'text/csv');
            showSuccess('POs exported as CSV');
        } catch (error) {
            showError('Export failed: ' + error.message);
        }
    },

    // Sales Orders
    async openSOModal() {
        UI.openModal('soModal');
        UI.clearForm('soForm');

        const products = await apiGet(API_ENDPOINTS.products);
        UI.populateSelect('soProduct', products.results || products, 'id', 'name');
    },

    async handleSOFormSubmit(e) {
        e.preventDefault();
        try {
            const data = parseFormData(document.getElementById('soForm'));
            await apiPost(`${API_ENDPOINTS.salesOrders}create_so/`, data);
            showSuccess('Sales order created successfully');
            UI.closeModal('soModal');
            this.loadSalesOrders();
        } catch (error) {
            showError('Failed to create SO: ' + error.message);
        }
    },

    async loadSalesOrders() {
        try {
            this.data.salesOrders = await apiGet(API_ENDPOINTS.salesOrders);
            this.renderSOTable(this.data.salesOrders.results || this.data.salesOrders);
        } catch (error) {
            showError('Failed to load sales orders: ' + error.message);
        }
    },

    renderSOTable(sos) {
        const tbody = document.getElementById('sosTableBody');
        emptyElement(tbody);

        sos.forEach(so => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${so.so_number}</td>
                <td>${so.product_name}</td>
                <td>${so.customer_name}</td>
                <td>${so.quantity}</td>
                <td>${formatCurrency(so.total_price)}</td>
                <td>${createStatusBadge(so.status).outerHTML}</td>
                <td>${formatDate(so.ship_date)}</td>
                <td>
                    <button class="btn-danger" onclick="App.deleteSO('${so.id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    async deleteSO(soId) {
        if (!confirm('Are you sure?')) return;
        try {
            await apiDelete(`${API_ENDPOINTS.salesOrders}${soId}/`);
            showSuccess('SO deleted successfully');
            this.loadSalesOrders();
        } catch (error) {
            showError('Failed to delete SO: ' + error.message);
        }
    },

    async searchSalesOrders() {
        const query = document.getElementById('soSearch').value;
        if (!query) {
            this.loadSalesOrders();
            return;
        }
        try {
            const results = await apiSearch(API_ENDPOINTS.salesOrders, query);
            this.renderSOTable(results.results || results);
        } catch (error) {
            showError('Search failed: ' + error.message);
        }
    },

    async exportSOData() {
        try {
            const response = await apiCall(`${API_ENDPOINTS.salesOrders}export_csv/`, 'GET');
            downloadFile(response, 'sales_orders.csv', 'text/csv');
            showSuccess('SOs exported as CSV');
        } catch (error) {
            showError('Export failed: ' + error.message);
        }
    },

    // Reports
    async showSalesTrends() {
        try {
            const trends = await apiGet(`${API_ENDPOINTS.analytics}sales_trends/`);
            document.getElementById('reportContainer').style.display = 'block';
            document.getElementById('reportTitle').textContent = 'Sales Trends (30 Days)';

            const labels = trends.map(t => formatDate(t.date));
            const data = trends.map(t => t.total_units);

            UI.renderLineChart('reportChart', labels, [{
                label: 'Units Sold',
                data
            }]);

            showSuccess('Report loaded successfully');
        } catch (error) {
            showError('Failed to load report: ' + error.message);
        }
    },

    async showTopProducts() {
        try {
            const topProducts = await apiGet(`${API_ENDPOINTS.analytics}top_products/`);
            document.getElementById('reportContainer').style.display = 'block';
            document.getElementById('reportTitle').textContent = 'Top 10 Products';

            const labels = topProducts.map(p => p.product__name);
            const data = topProducts.map(p => p.total_units);

            UI.renderBarChart('reportChart', labels, [{
                label: 'Units Sold',
                data
            }]);

            showSuccess('Report loaded successfully');
        } catch (error) {
            showError('Failed to load report: ' + error.message);
        }
    },

    async showLowStock() {
        try {
            const lowStock = await apiGet(`${API_ENDPOINTS.products}low_stock/`);
            document.getElementById('reportContainer').style.display = 'block';
            document.getElementById('reportTitle').textContent = 'Low Stock Items';

            const tbody = document.getElementById('reportData');
            emptyElement(tbody);

            let html = '<table class="data-table" style="width:100%;"><thead><tr><th>Product</th><th>Current Qty</th><th>Reorder Level</th></tr></thead><tbody>';
            lowStock.forEach(item => {
                html += `<tr><td>${item.product_name}</td><td>${item.quantity}</td><td>${item.quantity}</td></tr>`;
            });
            html += '</tbody></table>';
            tbody.innerHTML = html;

            showSuccess('Report loaded successfully');
        } catch (error) {
            showError('Failed to load report: ' + error.message);
        }
    },

    async showInventorySummary() {
        try {
            const summary = await getInventorySummary();
            document.getElementById('reportContainer').style.display = 'block';
            document.getElementById('reportTitle').textContent = 'Inventory Summary by Warehouse';

            const tbody = document.getElementById('reportData');
            emptyElement(tbody);

            let html = '<table class="data-table" style="width:100%;"><thead><tr><th>Warehouse</th><th>Total Items</th><th>Unique Products</th></tr></thead><tbody>';
            summary.forEach(item => {
                html += `<tr><td>${item.warehouse__name}</td><td>${item.total_items}</td><td>${item.unique_products}</td></tr>`;
            });
            html += '</tbody></table>';
            tbody.innerHTML = html;

            showSuccess('Report loaded successfully');
        } catch (error) {
            showError('Failed to load report: ' + error.message);
        }
    },

    generateReport() {
        UI.navigateToSection('reports');
        showInfo('Select a report type above');
    },

    // Forecasts
    async openForecastModal() {
        const products = await apiGet(API_ENDPOINTS.products);
        UI.populateSelect('forecastProductFilter', products.results || products, 'id', 'name');

        const productId = document.getElementById('forecastProductFilter').value;
        if (!productId) {
            showError('Please select a product before generating a forecast.');
            return;
        }

        if (confirm('Generate forecast for selected product?')) {
            const daysAhead = parseInt(document.getElementById('forecastDays').value) || 30;
            await this.generateForecast(productId, daysAhead);
        }
    },

    async generateForecast(productId, daysAhead) {
        try {
            const forecasts = await generateForecast(productId, daysAhead);
            showSuccess('Forecast generated successfully');
            this.loadForecasts();
        } catch (error) {
            showError('Failed to generate forecast: ' + error.message);
        }
    },

    async loadForecasts() {
        try {
            this.data.forecasts = await apiGet(API_ENDPOINTS.forecasts);
            this.renderForecastTable(this.data.forecasts.results || this.data.forecasts);
        } catch (error) {
            showError('Failed to load forecasts: ' + error.message);
        }
    },

    renderForecastTable(forecasts) {
        const tbody = document.getElementById('forecastsTableBody');
        emptyElement(tbody);

        forecasts.forEach(forecast => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${forecast.product_name}</td>
                <td>${formatDate(forecast.forecast_date)}</td>
                <td>${forecast.predicted_demand}</td>
                <td>${(forecast.confidence_score * 100).toFixed(2)}%</td>
                <td>
                    <button class="btn-danger" onclick="App.deleteForecast('${forecast.id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    async deleteForecast(forecastId) {
        if (!confirm('Are you sure?')) return;
        try {
            await apiDelete(`${API_ENDPOINTS.forecasts}${forecastId}/`);
            showSuccess('Forecast deleted successfully');
            this.loadForecasts();
        } catch (error) {
            showError('Failed to delete forecast: ' + error.message);
        }
    },

    async exportForecastData() {
        try {
            const response = await apiCall(`${API_ENDPOINTS.forecasts}export_csv/`, 'GET');
            downloadFile(response, 'forecasts.csv', 'text/csv');
            showSuccess('Forecasts exported as CSV');
        } catch (error) {
            showError('Export failed: ' + error.message);
        }
    },

    // Barcode Scanning
    async handleBarcodeSearch(e) {
        e.preventDefault();
        const barcode = document.getElementById('barcodeInput').value;
        if (!barcode) return;

        try {
            const product = await lookupBarcode(barcode);
            const resultDiv = document.getElementById('barcodeResult');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <h4>${product.name}</h4>
                <p><strong>Barcode:</strong> ${product.barcode}</p>
                <p><strong>Category:</strong> ${product.category}</p>
                <p><strong>Unit Price:</strong> ${formatCurrency(product.unit_price)}</p>
                <p><strong>Supplier:</strong> ${product.supplier_name || 'N/A'}</p>
                <p><strong>Status:</strong> ${product.status}</p>
            `;
            showSuccess('Product found');
            document.getElementById('barcodeInput').value = '';
        } catch (error) {
            showError('Product not found: ' + error.message);
        }
    },

    // Global Search
    async globalSearch() {
        const query = document.getElementById('globalSearch').value;
        if (!query) return;

        try {
            const [suppliers, products, warehouses] = await Promise.all([
                apiSearch(API_ENDPOINTS.suppliers, query),
                apiSearch(API_ENDPOINTS.products, query),
                apiSearch(API_ENDPOINTS.warehouses, query)
            ]);

            // Show results in a modal or navigate to results
            showSuccess(`Found ${(suppliers.results?.length || 0) + (products.results?.length || 0) + (warehouses.results?.length || 0)} results`);
        } catch (error) {
            showError('Search failed: ' + error.message);
        }
    }
};

// Initialize app on DOM load
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    
    // Load all data on init
    setTimeout(() => {
        App.loadSuppliers();
        App.loadProducts();
        App.loadWarehouses();
        App.loadInventory();
        App.loadPurchaseOrders();
        App.loadSalesOrders();
        App.loadForecasts();
    }, 500);
});
