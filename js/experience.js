document.addEventListener('DOMContentLoaded', () => {
    loadExperiences();
    setupModals();
});

let allExperiences = [];

async function loadExperiences() {
    try {
        const experiences = await apiFetch('/admin/experiences');
        allExperiences = experiences || [];
        renderExperiencesTable(allExperiences);
    } catch (error) {
        console.error('Failed to load experiences', error);
    }
}

function renderExperiencesTable(experiences) {
    const tbody = document.getElementById('experiences-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (experiences.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">No experiences or education records found. Click "Add Item" to create one.</td></tr>`;
        return;
    }
    
    // Sort experiences by displayOrder
    experiences.sort((a, b) => a.displayOrder - b.displayOrder);
    
    experiences.forEach(exp => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition';
        
        const isEdu = exp.type === 'EDUCATION';
        const typeBadge = isEdu 
            ? `<span class="px-2.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-500 border border-sky-500/20">Education</span>` 
            : `<span class="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">Work</span>`;

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${typeBadge}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">${exp.title}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">${exp.organization}</td>
            <td class="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">${exp.duration}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-400">${exp.displayOrder}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="toggleExperienceStatus(${exp.id}, ${exp.enabled})" class="relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${exp.enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}" role="switch">
                    <span class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${exp.enabled ? 'translate-x-5' : 'translate-x-0'}"></span>
                </button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                <button onclick="openEditExperienceModal(${exp.id})" class="text-blue-600 dark:text-sky-400 hover:text-blue-900 dark:hover:text-sky-300 transition font-bold"><i class="fas fa-edit mr-1"></i>Edit</button>
                <button onclick="deleteExperience(${exp.id})" class="text-red-600 hover:text-red-900 transition font-bold"><i class="fas fa-trash mr-1"></i>Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Global modal triggers
let activeModalMode = 'add'; // 'add' or 'edit'
let editingExperienceId = null;

function setupModals() {
    const modal = document.getElementById('experience-modal');
    const closeBtn = document.getElementById('close-experience-modal');
    const form = document.getElementById('experience-form');
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const origText = submitBtn.innerHTML;
            submitBtn.setAttribute('disabled', 'true');
            
            const payload = {
                type: document.getElementById('experience-type').value,
                title: document.getElementById('experience-title').value.trim(),
                organization: document.getElementById('experience-organization').value.trim(),
                duration: document.getElementById('experience-duration').value.trim(),
                description: document.getElementById('experience-description').value.trim(),
                displayOrder: parseInt(document.getElementById('experience-display-order').value, 10),
                enabled: document.getElementById('experience-enabled').checked
            };
            
            try {
                if (activeModalMode === 'add') {
                    await apiFetch('/admin/experiences', {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                } else {
                    await apiFetch(`/admin/experiences/${editingExperienceId}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload)
                    });
                }
                
                modal.classList.add('hidden');
                Swal.fire({
                    icon: 'success',
                    title: activeModalMode === 'add' ? 'Record Created' : 'Record Updated',
                    text: 'Experience timeline saved successfully.',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                    color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
                });
                loadExperiences();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Action Failed',
                    text: error.message || 'Unable to save details.',
                    confirmButtonColor: '#ef4444'
                });
            } finally {
                submitBtn.removeAttribute('disabled');
                submitBtn.innerHTML = origText;
            }
        });
    }
}

function openAddExperienceModal() {
    activeModalMode = 'add';
    editingExperienceId = null;
    
    document.getElementById('modal-title').textContent = 'Add Experience/Education';
    document.getElementById('experience-type').value = 'WORK';
    document.getElementById('experience-title').value = '';
    document.getElementById('experience-organization').value = '';
    document.getElementById('experience-duration').value = '';
    document.getElementById('experience-description').value = '';
    document.getElementById('experience-display-order').value = (allExperiences.length + 1).toString();
    document.getElementById('experience-enabled').checked = true;
    
    document.getElementById('experience-modal').classList.remove('hidden');
}

function openEditExperienceModal(id) {
    const exp = allExperiences.find(e => e.id === id);
    if (!exp) return;
    
    activeModalMode = 'edit';
    editingExperienceId = id;
    
    document.getElementById('modal-title').textContent = 'Edit Experience/Education';
    document.getElementById('experience-type').value = exp.type;
    document.getElementById('experience-title').value = exp.title;
    document.getElementById('experience-organization').value = exp.organization;
    document.getElementById('experience-duration').value = exp.duration;
    document.getElementById('experience-description').value = exp.description || '';
    document.getElementById('experience-display-order').value = exp.displayOrder;
    document.getElementById('experience-enabled').checked = exp.enabled;
    
    document.getElementById('experience-modal').classList.remove('hidden');
}

async function toggleExperienceStatus(id, currentStatus) {
    const exp = allExperiences.find(e => e.id === id);
    if (!exp) return;
    
    const payload = {
        ...exp,
        enabled: !currentStatus
    };
    
    try {
        await apiFetch(`/admin/experiences/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        loadExperiences();
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error updating state',
            text: error.message
        });
    }
}

async function deleteExperience(id) {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
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
            await apiFetch(`/admin/experiences/${id}`, {
                method: 'DELETE'
            });
            Swal.fire('Deleted!', 'Record has been removed.', 'success');
            loadExperiences();
        } catch (error) {
            Swal.fire('Error!', error.message || 'Could not delete item.', 'error');
        }
    }
}
