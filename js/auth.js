/**
 * Authentication and Token Management Service
 */
const AuthService = {
    /**
     * Log in admin with credentials.
     * @param {string} email 
     * @param {string} password 
     */
    async login(email, password) {
        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            if (data && data.token) {
                localStorage.setItem('jwtToken', data.token);
                return data;
            } else {
                throw new Error('Authentication failed. No token received.');
            }
        } catch (error) {
            throw error;
        }
    },

    /**
     * Check if a valid JWT is saved.
     * Parses the payload to check expiration date.
     */
    isAuthenticated() {
        const token = localStorage.getItem('jwtToken');
        if (!token) return false;
        
        try {
            // Decodes JWT payload
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            // Check if expired (exp is in seconds, Date.now() is in milliseconds)
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                this.logoutSilently();
                return false;
            }
            return true;
        } catch (e) {
            console.error("Token decoding failed", e);
            this.logoutSilently();
            return false;
        }
    },

    /**
     * Remove token and redirect to login page.
     */
    logout() {
        localStorage.removeItem('jwtToken');
        window.location.href = 'login.html';
    },

    /**
     * Helper to clear credentials without immediate redirection loop.
     */
    logoutSilently() {
        localStorage.removeItem('jwtToken');
    }
};
