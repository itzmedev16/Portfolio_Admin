document.addEventListener('DOMContentLoaded', () => {
    loadProfileDetails();
    setupProfileForm();
});

async function loadProfileDetails() {
    try {
        const profile = await apiFetch('/admin/profile');
        if (!profile) return;
        
        // Populate inputs
        document.getElementById('profile-fullname').value = profile.fullName || '';
        document.getElementById('profile-designation').value = profile.designation || '';
        document.getElementById('profile-available-for-hire').checked = profile.availableForHire || false;
        document.getElementById('profile-about').value = profile.about || '';
        const phoneInput = document.getElementById('profile-phone');
            if (phoneInput) {
                phoneInput.value = profile.phone || '';
            }
        document.getElementById('profile-email').value = profile.email || '';
        document.getElementById('profile-location').value = profile.location || '';
        document.getElementById('profile-github').value = profile.github || '';
        document.getElementById('profile-linkedin').value = profile.linkedin || '';

        
        // Populate image previews
        const getFullUrl = (path) => path.startsWith('http') ? path : `${API_BASE_URL.replace('/api', '')}${path}`;
        
        // Force static profile image
        document.getElementById('avatar-preview').src = 'assets/images/profile.png';
        document.getElementById('avatar-url').value = 'assets/images/profile.png';

        // Keep cover-url empty/clean for solid color background
        document.getElementById('cover-url').value = '';
        
    } catch (error) {
        console.error('Failed to load profile details', error);
    }
}

function setupProfileForm() {
    const form = document.getElementById('profile-form');
    if (!form) return;
    
    // File inputs selection handlers (Disabled)
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const origText = submitBtn.innerHTML;
        submitBtn.setAttribute('disabled', 'true');
        submitBtn.innerHTML = `<i class="fas fa-spinner animate-spin mr-2"></i> Saving Changes...`;
        
        const githubInput = document.getElementById('profile-github').value;
        const linkedinInput = document.getElementById('profile-linkedin').value;

        const githubRes = normalizeAndValidateUrl(githubInput, 'github');
        const linkedinRes = normalizeAndValidateUrl(linkedinInput, 'linkedin');

        if (!githubRes.isValid) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid GitHub URL',
                text: 'Please enter a valid GitHub profile URL (e.g. github.com/username).',
                confirmButtonColor: '#ef4444',
                background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
            });
            submitBtn.removeAttribute('disabled');
            submitBtn.innerHTML = origText;
            return;
        }

        if (!linkedinRes.isValid) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid LinkedIn URL',
                text: 'Please enter a valid LinkedIn profile URL (e.g. linkedin.com/in/username).',
                confirmButtonColor: '#ef4444',
                background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
            });
            submitBtn.removeAttribute('disabled');
            submitBtn.innerHTML = origText;
            return;
        }

        const payload = {
            fullName: document.getElementById('profile-fullname').value.trim(),
            designation: document.getElementById('profile-designation').value.trim(),
            about: document.getElementById('profile-about').value.trim(),
            phone: document.getElementById('profile-phone').value.trim(),
            email: document.getElementById('profile-email').value.trim(),
            location: document.getElementById('profile-location').value.trim(),
            github: githubRes.normalized,
            linkedin: linkedinRes.normalized,
            portfolio: null,
            twitter: null,
            instagram: null,
            profileImage: document.getElementById('avatar-url').value,
            backgroundImage: document.getElementById('cover-url').value,
            availableForHire: document.getElementById('profile-available-for-hire').checked
        };
        
        try {
            await apiFetch('/admin/profile', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Profile Updated',
                text: 'Your profile details have been saved successfully.',
                confirmButtonColor: '#3b82f6',
                background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
            });
            
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: error.message || 'Could not save profile changes.',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            submitBtn.removeAttribute('disabled');
            submitBtn.innerHTML = origText;
        }
    });
}

function setupImageUpload(inputId, previewId, urlFieldId, mode) {
    const fileInput = document.getElementById(inputId);
    if (!fileInput) return;
    
    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) {
            console.warn(`[Upload Debug] No file selected on input ID: ${inputId}`);
            return;
        }

        console.log(`[Upload Debug] File selected on input '${inputId}':`, {
            name: file.name,
            size: file.size,
            type: file.type
        });

        const formData = new FormData();
        formData.append('file', file);

        console.log(`[Upload Debug] Created FormData. Appended field 'file' with value:`, file);

        Swal.fire({
            title: 'Uploading...',
            text: 'Please wait while file is uploaded',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        try {
            console.log(`[Upload Debug] Sending request to POST /admin/upload...`);
            const data = await apiFetch('/admin/upload', {
                method: 'POST',
                body: formData
            });
            console.log(`[Upload Debug] Upload succeeded. Response data:`, data);
            
            if (data && data.fileUrl) {
                document.getElementById(urlFieldId).value = data.fileUrl;
                
                const fullUrl = data.fileUrl.startsWith('http') ? data.fileUrl : `${API_BASE_URL.replace('/api', '')}${data.fileUrl}`;
                
                if (mode === 'img') {
                    document.getElementById(previewId).src = fullUrl;
                } else {
                    document.getElementById(previewId).style.backgroundImage = `url('${fullUrl}')`;
                }
                
                Swal.fire({
                    icon: 'success',
                    title: 'Uploaded!',
                    text: 'Image uploaded successfully.',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                    color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
                });
            } else {
                throw new Error('Upload succeeded but no file URL was returned.');
            }
        } catch (error) {
            console.error(`[Upload Debug] Upload failed:`, error);
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: error.message || 'Something went wrong while uploading the file.',
                confirmButtonColor: '#ef4444'
            });
        }
    });
}

/**
 * Normalizes and validates GitHub and LinkedIn URLs.
 * Automatically adds https:// protocol if missing.
 * Trims whitespace before validation.
 */
function normalizeAndValidateUrl(val, type) {
    let value = val.trim();
    if (!value) return { isValid: true, normalized: "" };

    // Automatically normalize by adding https:// if protocol is missing
    if (!/^https?:\/\//i.test(value)) {
        value = "https://" + value;
    }

    let isValid = false;
    if (type === 'linkedin') {
        const regex = /^https?:\/\/([a-zA-Z0-9\-]+\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-\u00C0-\u00FF%\/\?\=\&\#\.\+]+$/i;
        isValid = regex.test(value);
    } else if (type === 'github') {
        const regex = /^https?:\/\/([a-zA-Z0-9\-]+\.)?github\.com\/[a-zA-Z0-9_\-\u00C0-\u00FF%\/\?\=\&\#\.\+]+$/i;
        isValid = regex.test(value);
    }

    return { isValid, normalized: value };
}
