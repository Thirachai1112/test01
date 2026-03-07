const CONFIG = {
    API_BASE: window.location.origin
};

let state = {
    allLogs: [],
    filteredLogs: [],
    currentPage: 1,
    rowsPerPage: 10
};

function parseUtcDateTime(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;

    const normalized = raw.replace(' ', 'T');
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
    const isoValue = hasTimezone ? normalized : `${normalized}Z`;
    const parsed = new Date(isoValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDueReturnDisplayFromLog(log) {
    const directValue = String(log.return_due_date || '').trim();
    if (directValue) {
        const parsed = parseUtcDateTime(directValue);
        if (parsed) {
            return parsed.toLocaleString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        return directValue;
    }

    const note = String(log.note || '').trim();
    const match = note.match(/^กำหนดคืน:\s*(.+)$/i);
    if (!match) return '-';

    const raw = match[1].trim();
    const parsed = parseUtcDateTime(raw);
    return !parsed
        ? raw
        : parsed.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
}

async function loadBorrowedItems() {
    try {
        const response = await fetch(`${CONFIG.API_BASE}/borrowing-logs?page=1&limit=999`);
        const data = await response.json();
        
        // กรองเฉพาะรายการที่ยังไม่คืน (return_date เป็น null)
        state.allLogs = (data.logs || []).filter(log => !log.return_date);
        state.filteredLogs = [...state.allLogs];
        
        const countElem = document.getElementById('borrowed-count');
        if (countElem) countElem.textContent = state.allLogs.length;

        renderTable();
    } catch (err) {
        console.error("Error:", err);
        document.getElementById('logs-list').innerHTML = '<tr><td colspan="10" class="text-center text-danger">ไม่สามารถโหลดข้อมูลได้</td></tr>';
    }
}

function renderTable() {
    const tbody = document.getElementById('logs-list');
    const start = (state.currentPage - 1) * state.rowsPerPage;
    const end = start + state.rowsPerPage;
    const offset = (state.currentPage - 1) * state.rowsPerPage;
    const paginatedItems = state.filteredLogs.slice(start, end);
    

    tbody.innerHTML = '';

    if (paginatedItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted p-4">ไม่พบรายการยืม</td></tr>';
        renderPagination(0);
        return;
    }

    paginatedItems.forEach((log, index) => {
        const borrowDate = log.borrow_date ? new Date(log.borrow_date).toLocaleDateString('th-TH') : '-';
        const dueDate = getDueReturnDisplayFromLog(log);
        const phoneNumber = log.employee_phone || log.phone_number || '-';
        
        // จัดการไฟล์แนบ
        let fileHtml = '-';
        if (Array.isArray(log.file_paths) && log.file_paths.length > 0) {
            const files = log.file_paths;
            fileHtml = files.map(file => {
                const filename = file.split('/').pop();
                const normalizedPath = String(file || '').startsWith('/') ? file : `/${file}`;
                return `<a href="${CONFIG.API_BASE}${normalizedPath}" target="_blank" class="btn btn-sm btn-outline-primary p-1 me-1" title="${filename}"><i class="fas fa-file-alt"></i></a>`;
            }).join('');
        }

        tbody.innerHTML += `
            <tr>
                <td><small>#${offset + index + 1}</small></td>
                <td>${log.employee_name || '-'}</td>
                <td><small>${phoneNumber}</small></td>
                <td><small>${log.Affiliation || '-'}</small></td>
                <td>${log.item_name || '-'}</td>
                <td><code>${log.serial_number || '-'}</code></td>
                <td><small>${borrowDate}</small></td>
                <td><small>${dueDate}</small></td>
                <td><span class="badge bg-warning text-dark">กำลังยืม</span></td>
                <td>${fileHtml}</td>
            </tr>`;
    });

    renderPagination(state.filteredLogs.length);
}

function renderPagination(totalItems) {
    const container = document.getElementById('pagination-container');
    const totalPages = Math.ceil(totalItems / state.rowsPerPage);
    container.innerHTML = '';
    if (totalPages <= 1) return;

    // Logic 1 2 3...
    for (let i = 1; i <= totalPages; i++) {
        container.innerHTML += `
            <li class="page-item ${state.currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>`;
    }
}

function changePage(page) {
    state.currentPage = page;
    renderTable();
}

function searchInventory() {
    const searchTerm = document.getElementById('inventory-search').value.toLowerCase();
    state.filteredLogs = state.allLogs.filter(log => 
        (log.employee_name && log.employee_name.toLowerCase().includes(searchTerm)) || 
        ((log.employee_phone || log.phone_number || '').toLowerCase().includes(searchTerm)) ||
        (log.item_name && log.item_name.toLowerCase().includes(searchTerm)) ||
        (log.serial_number && log.serial_number.toLowerCase().includes(searchTerm))
    );
    state.currentPage = 1;
    renderTable();
}

document.addEventListener('DOMContentLoaded', loadBorrowedItems);