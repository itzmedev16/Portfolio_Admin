let selectedResumeFile = null;
let activeResumeDetails = null;

document.addEventListener('DOMContentLoaded', () => {
    loadResumeDetails();
    setupResumeForm();
});

async function loadResumeDetails() {
    try {
        const resume = await apiFetch('/admin/resume');
        activeResumeDetails = resume;
        renderResumeUI(resume);
    } catch (error) {
        console.error('Failed to load resume details', error);
        // If 404 is thrown (no resume found), handle it gracefully
        activeResumeDetails = null;
        renderResumeUI(null);
    }
}

function renderResumeUI(resume) {
    const previewContainer = document.getElementById('resume-preview-container');
    const uploadBox = document.getElementById('resume-upload-box');
    if (!previewContainer || !uploadBox) return;

    // Reset Save/Cancel buttons visibility and file inputs
    resetPendingState();

    if (resume && (resume.fileUrl || resume.filePath)) {
        const fileUrl = resume.fileUrl || resume.filePath;
        const fileName = resume.fileName || 'resume.pdf';
        
        document.getElementById('resume-filename').textContent = fileName;
        
        let uploadDateStr = 'Unknown';
        if (resume.uploadDate) {
            const dateObj = new Date(resume.uploadDate);
            uploadDateStr = dateObj.toLocaleDateString(undefined, { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        document.getElementById('resume-uploaddate').textContent = `Uploaded on: ${uploadDateStr}`;
        
        const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${API_BASE_URL.replace('/api', '')}${fileUrl}`;
        document.getElementById('resume-iframe').src = fullUrl;
        document.getElementById('download-link').href = fullUrl;
        
        // Show/hide default controls
        document.getElementById('download-link').classList.remove('hidden');
        document.getElementById('replace-label').classList.remove('hidden');
        document.getElementById('delete-btn').classList.remove('hidden');
        
        previewContainer.classList.remove('hidden');
        uploadBox.classList.add('hidden');
    } else {
        // Reset default text in upload box
        const h3 = uploadBox.querySelector('h3');
        const p = uploadBox.querySelector('p');
        if (h3) h3.textContent = 'Upload Your Active Resume';
        if (p) p.textContent = 'Drag and drop your resume PDF file here, or click to browse files. The uploaded document will be available for download on the public portfolio.';
        
        document.getElementById('browse-label').classList.remove('hidden');
        
        previewContainer.classList.add('hidden');
        uploadBox.classList.remove('hidden');
    }
}

function resetPendingState() {
    selectedResumeFile = null;
    
    const fileInput = document.getElementById('resume-file-input');
    const replaceInput = document.getElementById('replace-input-file');
    if (fileInput) fileInput.value = '';
    if (replaceInput) replaceInput.value = '';

    // Hide save/cancel buttons
    const uploadSaveBtn = document.getElementById('upload-save-btn');
    const uploadCancelBtn = document.getElementById('upload-cancel-btn');
    const previewSaveBtn = document.getElementById('preview-save-btn');
    const previewCancelBtn = document.getElementById('preview-cancel-btn');

    if (uploadSaveBtn) uploadSaveBtn.classList.add('hidden');
    if (uploadCancelBtn) uploadCancelBtn.classList.add('hidden');
    if (previewSaveBtn) previewSaveBtn.classList.add('hidden');
    if (previewCancelBtn) previewCancelBtn.classList.add('hidden');
}

function setupResumeForm() {
    const fileInput = document.getElementById('resume-file-input');
    const replaceInput = document.getElementById('replace-input-file');
    
    if (fileInput) {
        fileInput.addEventListener('change', () => handleFileSelect(fileInput.files[0]));
    }
    if (replaceInput) {
        replaceInput.addEventListener('change', () => handleFileSelect(replaceInput.files[0]));
    }
    
    // Drag and drop events
    const dropZone = document.getElementById('resume-upload-box');
    if (dropZone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.add('border-blue-500', 'bg-blue-500/5', 'dark:bg-sky-400/5');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-blue-500', 'bg-blue-500/5', 'dark:bg-sky-400/5');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            handleFileSelect(file);
        });
    }
}

function handleFileSelect(file) {
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
        Swal.fire({
            icon: 'warning',
            title: 'Invalid File Type',
            text: 'Only PDF files are supported.',
            confirmButtonColor: '#3b82f6',
            background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
        });
        
        // Reset file inputs
        const fileInput = document.getElementById('resume-file-input');
        const replaceInput = document.getElementById('replace-input-file');
        if (fileInput) fileInput.value = '';
        if (replaceInput) replaceInput.value = '';
        return;
    }
    
    selectedResumeFile = file;
    
    const previewContainer = document.getElementById('resume-preview-container');
    const uploadBox = document.getElementById('resume-upload-box');
    
    if (activeResumeDetails && (activeResumeDetails.fileUrl || activeResumeDetails.filePath)) {
        // Replacing an existing resume
        document.getElementById('resume-filename').textContent = `${file.name} (Pending save)`;
        
        const localUrl = URL.createObjectURL(file);
        document.getElementById('resume-iframe').src = localUrl;
        
        // Hide standard actions, show Save/Cancel
        document.getElementById('download-link').classList.add('hidden');
        document.getElementById('replace-label').classList.add('hidden');
        document.getElementById('delete-btn').classList.add('hidden');
        
        document.getElementById('preview-save-btn').classList.remove('hidden');
        document.getElementById('preview-cancel-btn').classList.remove('hidden');
    } else {
        // Adding a new resume
        const h3 = uploadBox.querySelector('h3');
        const p = uploadBox.querySelector('p');
        if (h3) h3.textContent = `Selected File: ${file.name}`;
        if (p) p.textContent = 'Click "Save Resume" to upload and activate this resume.';
        
        document.getElementById('browse-label').classList.add('hidden');
        document.getElementById('upload-save-btn').classList.remove('hidden');
        document.getElementById('upload-cancel-btn').classList.remove('hidden');
    }
}

function cancelUploadSelection() {
    selectedResumeFile = null;
    renderResumeUI(activeResumeDetails);
}

async function saveResume() {
    if (!selectedResumeFile) {
        Swal.fire({
            icon: 'warning',
            title: 'No File Selected',
            text: 'Please select a resume file first.',
            confirmButtonColor: '#3b82f6'
        });
        return;
    }
    
    const formData = new FormData();
    formData.append('file', selectedResumeFile);
    
    Swal.fire({
        title: 'Saving Resume...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        await apiFetch('/admin/resume', {
            method: 'POST',
            body: formData
        });
        
        Swal.fire({
            icon: 'success',
            title: 'Saved!',
            text: 'Resume has been uploaded and activated successfully.',
            timer: 1500,
            showConfirmButton: false,
            background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
        });
        
        selectedResumeFile = null;
        loadResumeDetails();
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Save Failed',
            text: error.message || 'Something went wrong.',
            confirmButtonColor: '#ef4444'
        });
    }
}

async function deleteResume() {
    const result = await Swal.fire({
        title: 'Delete Resume?',
        text: "This will remove the resume record and delete the file permanently.",
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
            await apiFetch('/admin/resume', {
                method: 'DELETE'
            });
            Swal.fire('Deleted!', 'Resume record has been deleted.', 'success');
            loadResumeDetails();
        } catch (error) {
            Swal.fire('Error!', error.message || 'Could not delete resume.', 'error');
        }
    }
}
