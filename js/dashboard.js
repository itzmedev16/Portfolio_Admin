document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
});

async function loadDashboardStats() {
    try {
        const stats = await apiFetch('/admin/dashboard');
        if (!stats) return;
        
        // Update DOM elements
        document.getElementById('stat-skills').textContent = stats.totalSkills;
        document.getElementById('stat-projects').textContent = stats.totalProjects;
        document.getElementById('stat-certificates').textContent = stats.totalCertificates;
        
        const msgEl = document.getElementById('stat-messages');
        if (msgEl) {
            msgEl.textContent = stats.unreadMessages;
            // Highlight if there are unread messages
            const msgCard = document.getElementById('stat-messages-card');
            if (msgCard && stats.unreadMessages > 0) {
                msgCard.classList.add('ring-2', 'ring-amber-500/40', 'dark:ring-amber-400/40');
                const badge = document.getElementById('stat-messages-badge');
                if (badge) badge.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Failed to load dashboard stats', error);
        // Do not pop up error if unauthorized since common.js will already redirect them
        if (localStorage.getItem('jwtToken')) {
            Swal.fire({
                icon: 'error',
                title: 'Data Load Error',
                text: error.message || 'Could not retrieve stats from the server.',
                confirmButtonColor: '#ef4444'
            });
        }
    }
}
