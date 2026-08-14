document.addEventListener('DOMContentLoaded', () => {
    loadMessages();
});

let allMessages = [];

async function loadMessages() {
    try {
        const messages = await apiFetch('/admin/messages');
        allMessages = messages || [];
        renderMessagesTable(allMessages);
    } catch (error) {
        console.error('Failed to load messages', error);
    }
}

function renderMessagesTable(messages) {
    const tbody = document.getElementById('messages-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (messages.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400">No contact messages found.</td></tr>`;
        return;
    }
    
    // Sort messages: unread first, then newest first
    messages.sort((a, b) => {
        if (a.isRead !== b.isRead) {
            return a.isRead ? 1 : -1;
        }
        return new Date(b.submittedAt) - new Date(a.submittedAt);
    });
    
    messages.forEach(msg => {
        const tr = document.createElement('tr');
        tr.className = `border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition ${msg.isRead ? 'opacity-85' : 'font-semibold bg-blue-50/10 dark:bg-sky-400/5'}`;
        
        let dateStr = 'N/A';
        if (msg.submittedAt) {
            const dateObj = new Date(msg.submittedAt);
            dateStr = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        }
        
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                ${msg.isRead ? 
                    '<span class="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold border border-slate-200/50 dark:border-slate-700/50">Read</span>' : 
                    '<span class="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">New</span>'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">${msg.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400"><a href="mailto:${msg.email}" class="hover:underline">${msg.email}</a></td>
            <td class="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate">${msg.subject || '(No Subject)'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-medium">${dateStr}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                <button onclick="viewMessageDetails(${msg.id})" class="text-blue-600 dark:text-sky-400 hover:text-blue-900 dark:hover:text-sky-300 font-bold"><i class="fas fa-eye mr-1"></i>View</button>
                ${!msg.isRead ? `<button onclick="markMessageAsRead(${msg.id})" class="text-green-600 hover:text-green-900 font-bold"><i class="fas fa-check mr-1"></i>Mark Read</button>` : ''}
                <button onclick="deleteMessage(${msg.id})" class="text-red-600 hover:text-red-900 transition font-bold"><i class="fas fa-trash mr-1"></i>Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function viewMessageDetails(id) {
    const msg = allMessages.find(m => m.id === id);
    if (!msg) return;
    
    // Automatically trigger mark read on backend
    if (!msg.isRead) {
        try {
            await apiFetch(`/admin/messages/${id}/read`, {
                method: 'PUT'
            });
            msg.isRead = true;
            renderMessagesTable(allMessages);
        } catch (e) {
            console.error("Failed to mark message read on backend", e);
        }
    }
    
    let dateStr = 'Unknown';
    if (msg.submittedAt) {
        const dateObj = new Date(msg.submittedAt);
        dateStr = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    const modalHtml = `
        <div id="msg-detail-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
            <div class="glass-card rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-fade-in-up" onclick="event.stopPropagation()">
                <button onclick="closeMsgModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition duration-150">
                    <i class="fas fa-times text-xs"></i>
                </button>
                
                <h3 class="text-base font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Contact Message Details</h3>
                
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4 text-xs bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/30">
                        <div>
                            <span class="text-slate-400 block mb-0.5">Sender Name</span>
                            <span class="font-bold text-slate-800 dark:text-slate-200">${msg.name}</span>
                        </div>
                        <div>
                            <span class="text-slate-400 block mb-0.5">Submitted Date</span>
                            <span class="font-bold text-slate-800 dark:text-slate-200">${dateStr}</span>
                        </div>
                        <div class="col-span-2 border-t border-slate-200/30 pt-2">
                            <span class="text-slate-400 block mb-0.5">Email Address</span>
                            <a href="mailto:${msg.email}" class="font-bold text-blue-600 dark:text-sky-400 hover:underline">${msg.email}</a>
                        </div>
                    </div>
                    
                    <div>
                        <span class="text-xs text-slate-400 block mb-1">Subject</span>
                        <h4 class="text-sm font-bold text-slate-800 dark:text-white p-3 bg-white/30 dark:bg-slate-900/30 border border-slate-200/30 rounded-xl">${msg.subject || '(No Subject)'}</h4>
                    </div>
                    
                    <div>
                        <span class="text-xs text-slate-400 block mb-1">Message Content</span>
                        <div class="text-sm text-slate-700 dark:text-slate-300 p-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200/30 rounded-xl min-h-[120px] whitespace-pre-wrap leading-relaxed">${msg.message}</div>
                    </div>
                    
                    <div class="flex justify-end gap-3 pt-2">
                        <button onclick="closeMsgModal()" class="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-lg shadow-blue-500/20 text-xs">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    
    const modal = document.getElementById('msg-detail-modal');
    modal.addEventListener('click', closeMsgModal);
}

function closeMsgModal() {
    const modal = document.getElementById('msg-detail-modal');
    if (modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 200);
    }
}

async function markMessageAsRead(id) {
    try {
        await apiFetch(`/admin/messages/${id}/read`, {
            method: 'PUT'
        });
        loadMessages();
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Action Failed',
            text: error.message
        });
    }
}

async function deleteMessage(id) {
    const result = await Swal.fire({
        title: 'Delete Message?',
        text: "Are you sure you want to delete this message permanently?",
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
            await apiFetch(`/admin/messages/${id}`, {
                method: 'DELETE'
            });
            Swal.fire('Deleted!', 'Message has been deleted.', 'success');
            loadMessages();
        } catch (error) {
            Swal.fire('Error!', error.message || 'Could not delete message.', 'error');
        }
    }
}
