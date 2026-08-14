let selectedCertificateImage = null;
document.addEventListener('DOMContentLoaded', () => {
    loadCertificates();
    setupModals();
});

let allCertificates = [];

async function loadCertificates() {
    try {
        const certs = await apiFetch('/admin/certificates');
        allCertificates = certs || [];
        renderCertificatesTable(allCertificates);
    } catch (error) {
        console.error('Failed to load certificates', error);
    }
}

function renderCertificatesTable(certs) {
    const tbody = document.getElementById('certs-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (certs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">No certificates found. Click "Add Certificate" to create one.</td></tr>`;
        return;
    }
    
    // Sort certs by displayOrder
    certs.sort((a, b) => a.displayOrder - b.displayOrder);
    
    certs.forEach(cert => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition';
        
        const imgPath = cert.certificateImage ? (cert.certificateImage.startsWith('http') ? cert.certificateImage : `${API_BASE_URL.replace('/api', '')}${cert.certificateImage}`) : 'https://placehold.co/100x70/0f172a/38bdf8?text=Cert';
        
        // Format Date
        let formattedDate = 'N/A';
        if (cert.issueDate) {
            const dateObj = new Date(cert.issueDate);
            formattedDate = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
        }
        
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <img src="${imgPath}" alt="${cert.certificateName}" class="w-12 h-8 object-cover rounded-lg border border-slate-200 dark:border-slate-800/80">
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white text-ellipsis overflow-hidden max-w-xs">${cert.certificateName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">${cert.organization}</td>
            <td class="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">${formattedDate}</td>
            <td class="px-6 py-4 text-xs text-blue-600 dark:text-sky-400 max-w-xs truncate">
                ${cert.credentialUrl ? `<a href="${cert.credentialUrl}" target="_blank" class="hover:underline">${cert.credentialUrl}</a>` : '<span class="text-slate-400">None</span>'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-400">${cert.displayOrder}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                <button onclick="openEditCertModal(${cert.id})" class="text-blue-600 dark:text-sky-400 hover:text-blue-900 dark:hover:text-sky-300 font-bold"><i class="fas fa-edit mr-1"></i>Edit</button>
                <button onclick="deleteCert(${cert.id})" class="text-red-600 hover:text-red-900 transition font-bold"><i class="fas fa-trash mr-1"></i>Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

let activeModalMode = 'add';
let editingCertId = null;

function setupModals() {
    const modal = document.getElementById('cert-modal');
    const closeBtn = document.getElementById('close-cert-modal');
    const form = document.getElementById('cert-form');
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }
    
    setupImageUpload('cert-img-input', 'cert-img-preview', 'cert-img-url');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const origText = submitBtn.innerHTML;
            submitBtn.setAttribute('disabled', 'true');
            
            const payload = {
                certificateName: document.getElementById('cert-name').value.trim(),
                organization: document.getElementById('cert-org').value.trim(),
                issueDate: document.getElementById('cert-date').value || null,
                credentialUrl: document.getElementById('cert-url-field').value.trim(),
                certificateImage: "",
                displayOrder: parseInt(document.getElementById('cert-display-order').value, 10)
            };
            if (selectedCertificateImage) {
                const formData = new FormData();
                formData.append("file", selectedCertificateImage);
                const upload = await apiFetch("/admin/upload", {
                    method: "POST",
                    body: formData
    });

    payload.certificateImage = upload.fileUrl;
}
            try {
                if (activeModalMode === 'add') {
                    await apiFetch('/admin/certificates', {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                } else {
                    await apiFetch(`/admin/certificates/${editingCertId}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload)
                    });
                }
                
                modal.classList.add('hidden');
                Swal.fire({
                    icon: 'success',
                    title: activeModalMode === 'add' ? 'Certificate Created' : 'Certificate Updated',
                    text: 'Certificate saved successfully.',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                    color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
                });
                loadCertificates();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Action Failed',
                    text: error.message || 'Unable to save certificate.',
                    confirmButtonColor: '#ef4444'
                });
            } finally {
                submitBtn.removeAttribute('disabled');
                submitBtn.innerHTML = origText;
            }
        });
    }
}
function setupImageUpload(inputId, previewId) {

    const fileInput = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (!fileInput || !preview) return;

    fileInput.onchange = function (e) {

        const file = e.target.files[0];

        if (!file) return;

        selectedCertificateImage = file;

        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
    };
}

function openAddCertModal() {
    activeModalMode = 'add';
    editingCertId = null;
    selectedCertificateImage = null;
    
    document.getElementById('modal-title').textContent = 'Add Certificate';
    document.getElementById('cert-name').value = '';
    document.getElementById('cert-org').value = '';
    document.getElementById('cert-date').value = '';
    document.getElementById('cert-url-field').value = '';
    document.getElementById('cert-img-url').value = '';
    document.getElementById("cert-img-input").value = "";
    document.getElementById('cert-display-order').value = (allCertificates.length + 1).toString();
    document.getElementById('cert-modal').classList.remove('hidden');
}

function openEditCertModal(id) {
    const cert = allCertificates.find(c => c.id === id);
    if (!cert) return;
    
    activeModalMode = 'edit';
    editingCertId = id;
    selectedCertificateImage = null;
    document.getElementById("cert-img-input").value = "";
    
    document.getElementById('modal-title').textContent = 'Edit Certificate';
    document.getElementById('cert-name').value = cert.certificateName;
    document.getElementById('cert-org').value = cert.organization;
    
    if (cert.issueDate) {
        const dateObj = new Date(cert.issueDate);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        document.getElementById('cert-date').value = `${yyyy}-${mm}-${dd}`;
    } else {
        document.getElementById('cert-date').value = '';
    }
    
    document.getElementById('cert-url-field').value = cert.credentialUrl || '';
    document.getElementById('cert-img-url').value = cert.certificateImage || '';
    
    const imgPath = cert.certificateImage ? (cert.certificateImage.startsWith('http') ? cert.certificateImage : `${API_BASE_URL.replace('/api', '')}${cert.certificateImage}`) : 'https://placehold.co/600x400/0f172a/38bdf8?text=Upload+Certificate+Image';
    document.getElementById('cert-img-preview').src = imgPath;
    
    document.getElementById('cert-display-order').value = cert.displayOrder;
    
    document.getElementById('cert-modal').classList.remove('hidden');
}

async function deleteCert(id) {
    const result = await Swal.fire({
        title: 'Delete Certificate?',
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
            await apiFetch(`/admin/certificates/${id}`, {
                method: 'DELETE'
            });
            Swal.fire('Deleted!', 'Certificate has been removed.', 'success');
            loadCertificates();
        } catch (error) {
            Swal.fire('Error!', error.message || 'Could not delete certificate.', 'error');
        }
    }
}
