// Run global startup procedures once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAdminNavigation();
    initMobileNav();
    checkAuthProtection();
});

/**
 * Initializes the theme state (Dark/Light mode) based on user preference.
 */
function initTheme() {
    const isDark = localStorage.getItem('theme') === 'dark' || 
                  (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
}

/**
 * Toggle between light and dark mode.
 */
function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

/**
 * Protects admin route pages.
 * Redirects unauthorized users.
 */
function checkAuthProtection() {
    const path = window.location.pathname;
    const adminPages = [
        'dashboard.html',
        'profile.html',
        'skills.html',
        'experience.html',
        'projects.html',
        'certificates.html',
        'resume.html',
        'contact-messages.html',
        'settings.html',
        'technologies.html'
    ];
    
    const isAdminPage = adminPages.some(page => path.endsWith(page));
    
    if (isAdminPage && typeof AuthService !== 'undefined') {
        if (!AuthService.isAuthenticated()) {
            // Get base name
            const pageName = path.substring(path.lastIndexOf('/') + 1);
            window.location.href = 'login.html?redirect=' + encodeURIComponent(pageName);
        }
    }
}

/**
 * Initializes the burger menu for mobile nav drawer.
 */
function initMobileNav() {
    const burgerBtn = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (burgerBtn && mobileMenu) {
        burgerBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

/**
 * Renders the shared admin dashboard sidebar navigation dynamically.
 * Helps prevent copy-pasting the side navigation structure in every page.
 */
function initAdminNavigation() {
    const sidebarContainer = document.getElementById('admin-sidebar-container');
    if (!sidebarContainer) return;
    
    const path = window.location.pathname;
    const getActive = (file) => path.endsWith(file) ? 'bg-slate-700 text-sky-400 font-bold border-l-4 border-sky-400 pl-3' : 'text-slate-400 hover:bg-slate-800 hover:text-white pl-4';

    sidebarContainer.innerHTML = `
        <div class="flex flex-col h-full bg-slate-900 border-r border-slate-800">
            <!-- Brand -->
            <div class="flex items-center justify-between h-16 px-6 bg-slate-950">
                <span class="text-lg font-bold text-white tracking-wider flex items-center gap-2">
                    <i class="fas fa-user-shield text-sky-400"></i> Admin Panel
                </span>
                <button id="theme-toggle" class="text-slate-400 hover:text-white transition duration-150 p-2 rounded hover:bg-slate-800">
                    <i class="fas fa-adjust"></i>
                </button>
            </div>
            
            <!-- Navigation Links -->
            <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                <a href="dashboard.html" class="flex items-center py-2.5 px-2 rounded transition duration-150 ${getActive('dashboard.html')}">
                    <i class="fas fa-chart-line w-6 text-center"></i> <span class="ml-2">Dashboard</span>
                </a>
                <a href="profile.html" class="flex items-center py-2.5 px-2 rounded transition duration-150 ${getActive('profile.html')}">
                    <i class="fas fa-user w-6 text-center"></i> <span class="ml-2">Profile</span>
                </a>
                <a href="skills.html" class="flex items-center py-2.5 px-2 rounded transition duration-150 ${getActive('skills.html')}">
                    <i class="fas fa-tools w-6 text-center"></i> <span class="ml-2">Skills</span>
                </a>
                <a href="experience.html" class="flex items-center py-2.5 px-2 rounded transition duration-150 ${getActive('experience.html')}">
                    <i class="fas fa-history w-6 text-center"></i> <span class="ml-2">Experience</span>
                </a>
                <a href="projects.html" class="flex items-center py-2.5 px-2 rounded transition duration-150 ${getActive('projects.html')}">
                    <i class="fas fa-project-diagram w-6 text-center"></i> <span class="ml-2">Projects</span>
                </a>
                <a href="certificates.html" class="flex items-center py-2.5 px-2 rounded transition duration-150 ${getActive('certificates.html')}">
                    <i class="fas fa-certificate w-6 text-center"></i> <span class="ml-2">Certificates</span>
                </a>
                <a href="resume.html" class="flex items-center py-2.5 px-2 rounded transition duration-150 ${getActive('resume.html')}">
                    <i class="fas fa-file-pdf w-6 text-center"></i> <span class="ml-2">Resume</span>
                </a>
                <a href="contact-messages.html" class="flex items-center py-2.5 px-2 rounded transition duration-150 ${getActive('contact-messages.html')}">
                    <i class="fas fa-envelope w-6 text-center"></i> <span class="ml-2">Messages</span>
                </a>
                <a href="settings.html" class="flex items-center py-2.5 px-2 rounded transition duration-150 ${getActive('settings.html')}">
                    <i class="fas fa-cog w-6 text-center"></i> <span class="ml-2">Settings</span>
                </a>
                <a href="technologies.html" class="flex items-center py-2.5 px-2 rounded transition duration-150 ${getActive('technologies.html')}">
                    <i class="fas fa-cubes w-6 text-center"></i> <span class="ml-2">Technologies</span>
                </a>
            </nav>
            
            <!-- User Control -->
            <div class="p-4 border-t border-slate-800 bg-slate-950">
                <button id="admin-logout-btn" class="w-full flex items-center justify-center gap-2 py-2 px-4 rounded bg-red-600 hover:bg-red-700 text-white font-medium transition duration-150 shadow-md">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        </div>
    `;
    
    // Add theme toggle listener to the generated button
    const generatedToggle = sidebarContainer.querySelector('#theme-toggle');
    if (generatedToggle) {
        generatedToggle.addEventListener('click', toggleTheme);
    }

    const logoutBtn = sidebarContainer.querySelector('#admin-logout-btn');
    if (logoutBtn && typeof AuthService !== 'undefined') {
        logoutBtn.addEventListener('click', () => AuthService.logout());
    }
}
