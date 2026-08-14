document.addEventListener('DOMContentLoaded', () => {
    loadSkills();
    setupModals();
});

let allSkills = [];

async function loadSkills() {
    try {
        const skills = await apiFetch('/admin/skills');
        allSkills = skills || [];
        renderSkillsTable(allSkills);
    } catch (error) {
        console.error('Failed to load skills', error);
    }
}

function renderSkillsTable(skills) {
    const tbody = document.getElementById('skills-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (skills.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">No skills found. Click "Add Skill" to create one.</td></tr>`;
        return;
    }
    
    // Sort skills by displayOrder
    skills.sort((a, b) => a.displayOrder - b.displayOrder);
    
    skills.forEach(skill => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition';
        
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">${skill.skillName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">${skill.category}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                    <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 w-8 text-right">${skill.percentage}%</span>
                    <div class="w-24 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 hidden sm:block">
                        <div class="bg-blue-600 h-1.5 rounded-full" style="width: ${skill.percentage}%"></div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-400">${skill.displayOrder}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                <button onclick="openEditSkillModal(${skill.id})" class="text-blue-600 dark:text-sky-400 hover:text-blue-900 dark:hover:text-sky-300 transition font-bold"><i class="fas fa-edit mr-1"></i>Edit</button>
                <button onclick="deleteSkill(${skill.id})" class="text-red-600 hover:text-red-900 transition font-bold"><i class="fas fa-trash mr-1"></i>Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Global modal triggers
let activeModalMode = 'add'; // 'add' or 'edit'
let editingSkillId = null;

function setupModals() {
    const modal = document.getElementById('skill-modal');
    const closeBtn = document.getElementById('close-skill-modal');
    const form = document.getElementById('skill-form');
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }
    
    // Sliders event listener
    const slider = document.getElementById('skill-percentage');
    const sliderVal = document.getElementById('skill-percentage-val');
    if (slider && sliderVal) {
        slider.addEventListener('input', () => {
            sliderVal.textContent = `${slider.value}%`;
        });
    }
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const origText = submitBtn.innerHTML;
            
            const skillName = document.getElementById('skill-name').value.trim();
            const category = document.getElementById('skill-category').value.trim();
            const percentageVal = document.getElementById('skill-percentage').value;
            const displayOrderVal = document.getElementById('skill-display-order').value;

            // Form validations
            if (!skillName) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Validation Error',
                    text: 'Skill Name is required.',
                    confirmButtonColor: '#3b82f6'
                });
                return;
            }
            if (!category) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Validation Error',
                    text: 'Category is required. Please select TECHNICAL or SOFT_SKILL.',
                    confirmButtonColor: '#3b82f6'
                });
                return;
            }
            if (category !== 'TECHNICAL' && category !== 'SOFT_SKILL') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Validation Error',
                    text: 'Please select a valid category (TECHNICAL or SOFT_SKILL).',
                    confirmButtonColor: '#3b82f6'
                });
                return;
            }
            const percentage = parseInt(percentageVal, 10);
            if (isNaN(percentage) || percentage < 0 || percentage > 100) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Validation Error',
                    text: 'Proficiency must be between 0 and 100.',
                    confirmButtonColor: '#3b82f6'
                });
                return;
            }
            const displayOrder = parseInt(displayOrderVal, 10);
            if (isNaN(displayOrder) || displayOrder <= 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Validation Error',
                    text: 'Display Order must be a positive integer.',
                    confirmButtonColor: '#3b82f6'
                });
                return;
            }

            submitBtn.setAttribute('disabled', 'true');

            // Build payload preserving original fields where appropriate for API compatibility
            const existingSkill = activeModalMode === 'edit' ? allSkills.find(s => s.id === editingSkillId) : null;
            const payload = {
                skillName: skillName,
                category: category,
                percentage: percentage,
                displayOrder: displayOrder,
                icon: existingSkill ? (existingSkill.icon || '') : '',
                enabled: existingSkill ? (existingSkill.enabled ?? true) : true
            };
            
            try {
                if (activeModalMode === 'add') {
                    await apiFetch('/admin/skills', {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                } else {
                    await apiFetch(`/admin/skills/${editingSkillId}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload)
                    });
                }
                
                modal.classList.add('hidden');
                Swal.fire({
                    icon: 'success',
                    title: activeModalMode === 'add' ? 'Skill Created' : 'Skill Updated',
                    text: 'Skill records saved successfully.',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                    color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
                });
                loadSkills();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Action Failed',
                    text: error.message || 'Unable to save skill.',
                    confirmButtonColor: '#ef4444'
                });
            } finally {
                submitBtn.removeAttribute('disabled');
                submitBtn.innerHTML = origText;
            }
        });
    }
}

function openAddSkillModal() {
    activeModalMode = 'add';
    editingSkillId = null;
    
    document.getElementById('modal-title').textContent = 'Add New Skill';
    document.getElementById('skill-name').value = '';
    document.getElementById('skill-category').value = ''; // Placeholder option: empty value
    document.getElementById('skill-percentage').value = '80';
    document.getElementById('skill-percentage-val').textContent = '80%';
    document.getElementById('skill-display-order').value = (allSkills.length + 1).toString();
    
    document.getElementById('skill-modal').classList.remove('hidden');
}

function openEditSkillModal(id) {
    const skill = allSkills.find(s => s.id === id);
    if (!skill) return;
    
    activeModalMode = 'edit';
    editingSkillId = id;
    
    document.getElementById('modal-title').textContent = 'Edit Skill';
    document.getElementById('skill-name').value = skill.skillName;
    document.getElementById('skill-category').value = skill.category;
    document.getElementById('skill-percentage').value = skill.percentage;
    document.getElementById('skill-percentage-val').textContent = `${skill.percentage}%`;
    document.getElementById('skill-display-order').value = skill.displayOrder;
    
    document.getElementById('skill-modal').classList.remove('hidden');
}

async function toggleSkillStatus(id, currentStatus) {
    const skill = allSkills.find(s => s.id === id);
    if (!skill) return;
    
    const payload = {
        ...skill,
        enabled: !currentStatus
    };
    
    try {
        await apiFetch(`/admin/skills/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        loadSkills();
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error updating state',
            text: error.message
        });
    }
}

async function deleteSkill(id) {
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
            await apiFetch(`/admin/skills/${id}`, {
                method: 'DELETE'
            });
            Swal.fire('Deleted!', 'Skill has been removed.', 'success');
            loadSkills();
        } catch (error) {
            Swal.fire('Error!', error.message || 'Could not delete skill.', 'error');
        }
    }
}
