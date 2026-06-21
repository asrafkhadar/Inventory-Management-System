// Global Configuration
const CONFIG = {
    APP_NAME: 'Inventory Management System',
    API_BASE_URL: window.location.origin + '/api',
    TIMEOUT: 30000,
    NOTIFICATION_DURATION: 5000,
    ITEMS_PER_PAGE: 20,
    CHARTS: {
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 2,
        tension: 0.4
    }
};

// Show notification
function showNotification(message, type = 'info', duration = CONFIG.NOTIFICATION_DURATION) {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.className = `notification show ${type}`;
    notification.textContent = message;

    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// Show success notification
function showSuccess(message) {
    showNotification(message, 'success');
}

// Show error notification
function showError(message) {
    showNotification(message, 'error');
}

// Show warning notification
function showWarning(message) {
    showNotification(message, 'warning');
}

// Show info notification
function showInfo(message) {
    showNotification(message, 'info');
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format datetime
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get status badge color
function getStatusColor(status) {
    const colors = {
        'active': '#10b981',
        'inactive': '#6b7280',
        'discontinued': '#ef4444',
        'pending': '#f59e0b',
        'confirmed': '#3b82f6',
        'packed': '#8b5cf6',
        'shipped': '#6366f1',
        'delivered': '#10b981',
        'cancelled': '#ef4444',
        'draft': '#9ca3af',
        'submitted': '#3b82f6',
        'received': '#10b981',
        'passed': '#10b981',
        'failed': '#ef4444',
        'in-stock': '#10b981',
        'low-stock': '#f59e0b',
        'out-of-stock': '#ef4444'
    };
    return colors[status] || '#6b7280';
}

// Create status badge
function createStatusBadge(status) {
    const badge = document.createElement('span');
    badge.className = 'status-badge';
    badge.textContent = status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
    badge.style.backgroundColor = getStatusColor(status);
    badge.style.color = 'white';
    badge.style.padding = '4px 8px';
    badge.style.borderRadius = '4px';
    badge.style.fontSize = '12px';
    badge.style.fontWeight = 'bold';
    return badge;
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Deep clone object
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone
function validatePhone(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Empty element
function emptyElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

// Create element helper
function createElement(tag, className = '', content = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.textContent = content;
    return element;
}

// Parse form data
function parseFormData(form) {
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        if (value) {
            data[key] = value;
        }
    }
    return data;
}

// Initialize charts options
function getChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'top'
            }
        }
    };
}
