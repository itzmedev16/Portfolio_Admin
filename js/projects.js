let selectedProjectImage = null;
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    setupModals();
});

let allProjects = [];

async function loadProjects() {
    try {
        const projects = await apiFetch('/admin/projects');
        allProjects = projects || [];
        renderProjectsTable(allProjects);
    } catch (error) {
        console.error('Failed to load projects', error);
    }
}

function renderProjectsTable(projects) {
    const tbody = document.getElementById('projects-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (projects.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-8 text-center text-slate-400">No projects found. Click "Add Project" to create one.</td></tr>`;
        return;
    }
    
    // Sort projects by displayOrder
    projects.sort((a, b) => a.displayOrder - b.displayOrder);
    
    projects.forEach(proj => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition';
        
        const imgPath = proj.image ? (proj.image.startsWith('http') ? proj.image : `${API_BASE_URL.replace('/api', '')}${proj.image}`) : 'https://placehold.co/100x70/0f172a/38bdf8?text=Proj';
        
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <img src="${imgPath}" alt="${proj.title}" class="w-12 h-8 object-cover rounded-lg border border-slate-200 dark:border-slate-800/80">
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">${proj.title}</td>
            <td class="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">${proj.shortDescription}</td>
            <td class="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">${proj.technologies || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap text-xs">
                ${proj.featured ? `<span class="bg-amber-500/10 text-amber-500 dark:text-amber-400 px-2.5 py-0.5 rounded font-bold border border-amber-500/20"><i class="fas fa-star text-[10px]"></i> Yes</span>` : '<span class="text-slate-400">No</span>'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${proj.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}">${proj.status || 'Active'}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-400">${proj.displayOrder}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                <button onclick="openEditProjectModal(${proj.id})" class="text-blue-600 dark:text-sky-400 hover:text-blue-900 dark:hover:text-sky-300 font-bold"><i class="fas fa-edit mr-1"></i>Edit</button>
                <button onclick="deleteProject(${proj.id})" class="text-red-600 hover:text-red-900 transition font-bold"><i class="fas fa-trash mr-1"></i>Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

let activeModalMode = 'add';
let editingProjectId = null;

function setupModals() {
    const modal = document.getElementById('project-modal');
    const closeBtn = document.getElementById('close-project-modal');
    const form = document.getElementById('project-form');
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }
    
    setupImageUpload('project-img-input', 'project-img-preview', 'project-img-url');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const origText = submitBtn.innerHTML;
            submitBtn.setAttribute('disabled', 'true');
            
            const payload = {
                title: document.getElementById('project-title').value.trim(),
                shortDescription: document.getElementById('project-short-desc').value.trim(),
                detailedDescription: document.getElementById('project-detailed-desc').value.trim(),
                technologies: document.getElementById('project-technologies').value.trim(),
                githubUrl: document.getElementById('project-github').value.trim(),
                liveDemoUrl: document.getElementById('project-demo').value.trim(),
                image: "",
                featured: document.getElementById('project-featured').checked,
                status: document.getElementById('project-status').value,
                displayOrder: parseInt(document.getElementById('project-display-order').value, 10)
            };
            if (selectedProjectImage) {
                const formData = new FormData();
                formData.append("file", selectedProjectImage);
                const upload = await apiFetch("/admin/upload", {
                    method: "POST",
                    body: formData
                });
                payload.image = upload.fileUrl;
            }
            
            try {
                if (activeModalMode === 'add') {
                    await apiFetch('/admin/projects', {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                } else {
                    await apiFetch(`/admin/projects/${editingProjectId}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload)
                    });
                }
                    
                modal.classList.add("hidden");
                await loadProjects();
                Swal.fire({
                 icon: "success",
                title: activeModalMode === "add"
                ? "Project Created"
                : "Project Updated",
                timer: 1500,
                showConfirmButton: false
            });
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Action Failed',
                    text: error.message || 'Unable to save project.',
                    confirmButtonColor: '#ef4444'
                });
            } finally {
                submitBtn.removeAttribute('disabled');
                submitBtn.innerHTML = origText;
            }
        });
    }
}function setupImageUpload(inputId, previewId) {

    const fileInput = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (!fileInput || !preview) return;

    fileInput.onchange = function (e) {

        const file = e.target.files[0];

        if (!file) return;

        selectedProjectImage = file;

        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
    };

}
function openAddProjectModal() {
    activeModalMode = 'add';
    editingProjectId = null;
    selectedProjectImage = null;
    
    document.getElementById('modal-title').textContent = 'Add New Project';
    document.getElementById('project-title').value = '';
    document.getElementById('project-short-desc').value = '';
    document.getElementById('project-detailed-desc').value = '';
    document.getElementById('project-technologies').value = '';
    document.getElementById('project-github').value = '';
    document.getElementById('project-demo').value = '';
    document.getElementById('project-img-url').value = '';
    document.getElementById("project-img-input").value = "";
    document.getElementById('project-featured').checked = false;
    document.getElementById('project-status').value = 'Completed';
    document.getElementById('project-display-order').value = (allProjects.length + 1).toString();
    
    document.getElementById('project-modal').classList.remove('hidden');
}

function openEditProjectModal(id) {
    const proj = allProjects.find(p => p.id === id);
    if (!proj) return;
    
    activeModalMode = 'edit';
    editingProjectId = id;
    
    document.getElementById('modal-title').textContent = 'Edit Project';
    document.getElementById('project-title').value = proj.title;
    document.getElementById('project-short-desc').value = proj.shortDescription;
    document.getElementById('project-detailed-desc').value = proj.detailedDescription || '';
    document.getElementById('project-technologies').value = proj.technologies || '';
    document.getElementById('project-github').value = proj.githubUrl || '';
    document.getElementById('project-demo').value = proj.liveDemoUrl || '';
    document.getElementById('project-img-url').value = proj.image || '';
    
    const imgPath = proj.image ? (proj.image.startsWith('http') ? proj.image : `${API_BASE_URL.replace('/api', '')}${proj.image}`) : 'https://placehold.co/600x400/0f172a/38bdf8?text=Upload+Image';
    document.getElementById('project-img-preview').src = imgPath;
    
    document.getElementById('project-featured').checked = proj.featured;
    document.getElementById('project-status').value = proj.status || 'Completed';
    document.getElementById('project-display-order').value = proj.displayOrder;
    
    document.getElementById('project-modal').classList.remove('hidden');
}

async function deleteProject(id) {
    const result = await Swal.fire({
        title: 'Delete Project?',
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
            await apiFetch(`/admin/projects/${id}`, {
                method: 'DELETE'
            });
            Swal.fire('Deleted!', 'Project has been removed.', 'success');
            loadProjects();
        } catch (error) {
            Swal.fire('Error!', error.message || 'Could not delete project.', 'error');
        }
    }
}
