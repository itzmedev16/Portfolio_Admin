document.addEventListener('DOMContentLoaded', () => {
    loadSettingsDetails();
    setupSettingsHandlers();
});

function loadSettingsDetails() {
    // Populate API config details
    document.getElementById('api-url').textContent = API_BASE_URL;
    
    // Decode and display JWT details if active
    const token = localStorage.getItem('jwtToken');
    const tokenPreview = document.getElementById('token-preview');
    const tokenDetails = document.getElementById('token-details');
    
    if (token) {
        tokenPreview.textContent = `${token.substring(0, 20)}...${token.substring(token.length - 20)}`;
        
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const payload = JSON.parse(jsonPayload);
            const expDate = new Date(payload.exp * 1000).toLocaleString();
            
            tokenDetails.innerHTML = `
                <div class="grid grid-cols-2 gap-4 text-xs font-semibold pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4">
                    <div>
                        <span class="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Admin Subject</span>
                        <span class="text-slate-800 dark:text-slate-200">${payload.sub || 'N/A'}</span>
                    </div>
                    <div>
                        <span class="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Expiration Time</span>
                        <span class="text-slate-800 dark:text-slate-200">${expDate}</span>
                    </div>
                </div>
            `;
        } catch (e) {
            tokenDetails.innerHTML = `<div class="text-xs text-red-500 font-semibold mt-3"><i class="fas fa-exclamation-circle mr-1"></i> Unable to parse JWT payload.</div>`;
        }
    } else {
        tokenPreview.textContent = 'No Active Session Token Found';
        tokenDetails.innerHTML = '';
    }
    
    // Theme options setup
    const currentTheme = localStorage.getItem('theme') || 'system';
    const themeSelect = document.getElementById('theme-pref-select');
    if (themeSelect) {
        themeSelect.value = currentTheme;
    }
}

function setupSettingsHandlers() {
    const themeSelect = document.getElementById('theme-pref-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', () => {
            const sel = themeSelect.value;
            if (sel === 'dark') {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else if (sel === 'light') {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            } else {
                localStorage.removeItem('theme');
                // Sync with system preference
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
            
            Swal.fire({
                icon: 'success',
                title: 'Theme Preference Saved',
                text: `Preference updated to: ${sel.toUpperCase()}`,
                timer: 1200,
                showConfirmButton: false,
                background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
            });
        });
    }
}
