// API_BASE_URL is loaded globally from config.js

/**
 * Perform an HTTP request to the backend API.
 * Automatically injects the JWT auth token if it is saved in local storage.
 * Handles unauthorized responses by logging out the user.
 * 
 * @param {string} endpoint - The API endpoint (e.g., "/profile" or "/admin/dashboard").
 * @param {object} options - Fetch options (method, body, headers, etc.).
 * @returns {Promise<any>} - Resolved response data (usually JSON).
 */
async function apiFetch(endpoint, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${cleanEndpoint}`;
    
    options.headers = options.headers || {};
    
    // Check if token exists in localStorage
    const token = localStorage.getItem('jwtToken');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Set default headers for JSON payload (excluding FormData)
    if (options.body && !(options.body instanceof FormData)) {
        if (!options.headers['Content-Type']) {
            options.headers['Content-Type'] = 'application/json';
        }
    }
    
    try {
        const response = await fetch(url, options);
        
        // Handle 401 Unauthorized (invalid or expired token)
        if (response.status === 401) {
            localStorage.removeItem('jwtToken');
            // If the user is currently on an admin dashboard page, redirect them to login
            const currentPath = window.location.pathname;
            if (!currentPath.endsWith('index.html') && 
                !currentPath.endsWith('login.html') && 
                currentPath.includes('.html')) {
                window.location.href = 'login.html?session=expired';
            }
            throw new Error('Unauthorized access. Please login again.');
        }
        
        // Handle other HTTP errors
        if (!response.ok) {
            let errorMessage = `Request failed with status ${response.status}`;
            try {
                const text = await response.text();
                try {
                    const errData = JSON.parse(text);
                    errorMessage = errData.message || errorMessage;
                } catch (jsonErr) {
                    if (text) errorMessage = text;
                }
            } catch (readErr) {
                console.error("Failed to read response body", readErr);
            }
            throw new Error(errorMessage);
        }
        
        // Parse and return JSON response if body is present
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return null;
    } catch (error) {
        console.error(`API Fetch Error [${url}]:`, error);
        throw error;
    }
}
