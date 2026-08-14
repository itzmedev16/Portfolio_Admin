let selectedLogoFile = null;
let allTechnologies = [];
let activeModalMode = 'add';
let editingTechId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadTechnologies();
    setupModals();
});

async function loadTechnologies() {
    try {
        const technologies = await apiFetch('/admin/technologies');
        allTechnologies = technologies || [];
        renderTechnologiesTable(allTechnologies);
    } catch (error) {
        console.error('Failed to load technologies', error);
        const tbody = document.getElementById('tech-tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500 font-medium">Failed to load technologies data.</td></tr>`;
        }
    }
}

function renderTechnologiesTable(technologies) {
    const tbody = document.getElementById('tech-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (technologies.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400 text-sm">No technologies found. Click "Add Technology" to create one.</td></tr>`;
        return;
    }
    
    // Sort by displayOrder
    technologies.sort((a, b) => a.displayOrder - b.displayOrder);
    
    technologies.forEach(tech => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition';
        
        const hostUrl = API_BASE_URL.replace('/api', '');
        const imgPath = tech.logoUrl ? (tech.logoUrl.startsWith('http') ? tech.logoUrl : `${hostUrl}${tech.logoUrl}`) : 'https://placehold.co/100x100/0f172a/38bdf8?text=Logo';
        
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-800 p-1.5">
                    <img src="${imgPath}" alt="${tech.name}" class="w-full h-full object-contain">
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">${tech.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600 dark:text-slate-400">${tech.displayOrder}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="toggleTechStatus(${tech.id}, ${tech.isActive})" class="px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider transition ${
                    tech.isActive 
                        ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' 
                        : 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'
                }">
                    ${tech.isActive ? 'Active' : 'Inactive'}
                </button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                <button onclick="openEditTechModal(${tech.id})" class="text-blue-600 dark:text-sky-400 hover:text-blue-900 dark:hover:text-sky-300 font-bold"><i class="fas fa-edit mr-1"></i>Edit</button>
                <button onclick="deleteTechnology(${tech.id})" class="text-red-600 hover:text-red-900 transition font-bold"><i class="fas fa-trash mr-1"></i>Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function setupModals() {
    const modal = document.getElementById('tech-modal');
    const closeBtn = document.getElementById('close-tech-modal');
    const form = document.getElementById('tech-form');
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }
    
    // Toggle source logic
    const sourceRadios = document.getElementsByName('logo-source');
    const uploadContainer = document.getElementById('logo-upload-container');
    const urlContainer = document.getElementById('logo-url-container');
    const onlineUrlInput = document.getElementById('tech-online-url');
    const preview = document.getElementById('tech-logo-preview');
    
    sourceRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'url') {
                uploadContainer.classList.add('hidden');
                urlContainer.classList.remove('hidden');
                preview.src = onlineUrlInput.value.trim() || 'https://placehold.co/100x100/0f172a/38bdf8?text=Logo';
            } else {
                uploadContainer.classList.remove('hidden');
                urlContainer.classList.add('hidden');
                if (selectedLogoFile) {
                    preview.src = URL.createObjectURL(selectedLogoFile);
                } else {
                    const savedUrl = document.getElementById('tech-logo-url').value;
                    const hostUrl = API_BASE_URL.replace('/api', '');
                    preview.src = savedUrl ? (savedUrl.startsWith('http') ? savedUrl : `${hostUrl}${savedUrl}`) : 'https://placehold.co/100x100/0f172a/38bdf8?text=Logo';
                }
            }
        });
    });

    onlineUrlInput.addEventListener('input', () => {
        const isUrlSelected = document.querySelector('input[name="logo-source"]:checked').value === 'url';
        if (isUrlSelected) {
            preview.src = onlineUrlInput.value.trim() || 'https://placehold.co/100x100/0f172a/38bdf8?text=Logo';
        }
    });
    
    setupLogoUpload('tech-logo-input', 'tech-logo-preview');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const origText = submitBtn.innerHTML;
            submitBtn.setAttribute('disabled', 'true');
            submitBtn.innerHTML = `<i class="fas fa-spinner animate-spin mr-1.5"></i> Saving...`;
            
            try {
                const logoSource = document.querySelector('input[name="logo-source"]:checked').value;
                let logoUrl = '';
                
                if (logoSource === 'url') {
                    logoUrl = onlineUrlInput.value.trim();
                    if (!logoUrl) {
                        throw new Error("Please enter a valid online logo URL.");
                    }
                    selectedLogoFile = null; // Clear file since URL is preferred
                } else {
                    logoUrl = document.getElementById('tech-logo-url').value;
                    // If a new logo file was selected, upload it first
                    if (selectedLogoFile) {
                        const formData = new FormData();
                        formData.append("file", selectedLogoFile);
                        
                        const uploadResult = await apiFetch("/admin/technologies/upload", {
                            method: "POST",
                            body: formData
                        });
                        
                        if (uploadResult && uploadResult.fileUrl) {
                            logoUrl = uploadResult.fileUrl;
                        } else {
                            throw new Error("Failed to retrieve uploaded logo URL");
                        }
                    }
                    
                    if (!logoUrl) {
                        throw new Error("Please choose a logo file to upload first.");
                    }
                }
                
                const payload = {
                    name: document.getElementById('tech-name').value.trim(),
                    logoUrl: logoUrl,
                    displayOrder: parseInt(document.getElementById('tech-display-order').value, 10),
                    isActive: document.getElementById('tech-active').checked
                };
                
                if (activeModalMode === 'add') {
                    await apiFetch('/admin/technologies', {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                } else {
                    await apiFetch(`/admin/technologies/${editingTechId}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload)
                    });
                }
                
                modal.classList.add("hidden");
                await loadTechnologies();
                
                Swal.fire({
                    icon: "success",
                    title: activeModalMode === "add" ? "Technology Created" : "Technology Updated",
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                    color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
                });
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Action Failed',
                    text: error.message || 'Unable to save technology.',
                    confirmButtonColor: '#ef4444',
                    background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                    color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
                });
            } finally {
                submitBtn.removeAttribute('disabled');
                submitBtn.innerHTML = origText;
            }
        });
    }
}

function setupLogoUpload(inputId, previewId) {
    const fileInput = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!fileInput || !preview) return;
    
    fileInput.onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;
        
        selectedLogoFile = file;
        preview.src = URL.createObjectURL(file);
    };
}

function openAddTechModal() {
    activeModalMode = 'add';
    editingTechId = null;
    selectedLogoFile = null;
    
    document.getElementById('modal-title').textContent = 'Add New Technology';
    document.getElementById('tech-name').value = '';
    document.getElementById('tech-logo-url').value = '';
    document.getElementById('tech-logo-input').value = '';
    document.getElementById('tech-online-url').value = '';
    document.getElementById('tech-logo-preview').src = 'https://placehold.co/100x100/0f172a/38bdf8?text=Logo';
    document.getElementById('tech-active').checked = true;
    
    // Reset to upload mode
    const uploadRadio = document.querySelector('input[name="logo-source"][value="upload"]');
    if (uploadRadio) {
        uploadRadio.checked = true;
        document.getElementById('logo-upload-container').classList.remove('hidden');
        document.getElementById('logo-url-container').classList.add('hidden');
    }
    
    // Auto-calculate next display order
    let maxOrder = 0;
    allTechnologies.forEach(t => {
        if (t.displayOrder > maxOrder) maxOrder = t.displayOrder;
    });
    document.getElementById('tech-display-order').value = maxOrder + 1;
    
    document.getElementById('tech-modal').classList.remove('hidden');
}

function openEditTechModal(id) {
    const tech = allTechnologies.find(t => t.id === id);
    if (!tech) return;
    
    activeModalMode = 'edit';
    editingTechId = id;
    selectedLogoFile = null;
    
    document.getElementById('modal-title').textContent = 'Edit Technology';
    document.getElementById('tech-name').value = tech.name;
    document.getElementById('tech-logo-url').value = tech.logoUrl;
    document.getElementById('tech-logo-input').value = '';
    
    const hostUrl = API_BASE_URL.replace('/api', '');
    const imgPath = tech.logoUrl ? (tech.logoUrl.startsWith('http') ? tech.logoUrl : `${hostUrl}${tech.logoUrl}`) : 'https://placehold.co/100x100/0f172a/38bdf8?text=Logo';
    document.getElementById('tech-logo-preview').src = imgPath;
    
    // Check if URL is an external link
    const isExternalUrl = tech.logoUrl && tech.logoUrl.startsWith('http');
    
    const radioToSelect = document.querySelector(`input[name="logo-source"][value="${isExternalUrl ? 'url' : 'upload'}"]`);
    if (radioToSelect) radioToSelect.checked = true;
    
    if (isExternalUrl) {
        document.getElementById('logo-upload-container').classList.add('hidden');
        document.getElementById('logo-url-container').classList.remove('hidden');
        document.getElementById('tech-online-url').value = tech.logoUrl;
    } else {
        document.getElementById('logo-upload-container').classList.remove('hidden');
        document.getElementById('logo-url-container').classList.add('hidden');
        document.getElementById('tech-online-url').value = '';
    }
    
    document.getElementById('tech-display-order').value = tech.displayOrder;
    document.getElementById('tech-active').checked = tech.isActive;
    
    document.getElementById('tech-modal').classList.remove('hidden');
}

async function toggleTechStatus(id, currentStatus) {
    try {
        const nextStatus = !currentStatus;
        await apiFetch(`/admin/technologies/${id}/status?isActive=${nextStatus}`, {
            method: 'PATCH'
        });
        await loadTechnologies();
        Swal.fire({
            icon: 'success',
            title: 'Status Updated',
            timer: 1000,
            showConfirmButton: false,
            background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Failed to update status',
            text: error.message,
            confirmButtonColor: '#ef4444',
            background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
        });
    }
}

async function deleteTechnology(id) {
    const result = await Swal.fire({
        title: 'Delete Technology?',
        text: "This will remove the technology and its logo permanently!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#3b82f6',
        confirmButtonText: 'Yes, delete it!',
        background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
    });
    
    if (result.isConfirmed) {
        try {
            await apiFetch(`/admin/technologies/${id}`, {
                method: 'DELETE'
            });
            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Technology has been deleted.',
                timer: 1500,
                showConfirmButton: false,
                background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
            });
            loadTechnologies();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: error.message || 'Could not delete technology.',
                confirmButtonColor: '#ef4444',
                background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
            });
        }
    }
}
