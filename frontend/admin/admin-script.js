let currentInventory = [];
let currentPage = 1;
let filteredInventory = []; // เก็บผลลัพธ์ค้นหา inventory

let currentLogsPage = 1;
const logsPerPage = 10;
let allBorrowingLogs = []; // เก็บข้อมูลทั้งหมด
let filteredLogs = []; // เก็บผลลัพธ์ค้นหา logs

// Repair Logs
let currentRepairPage = 1;
const repairLogsPerPage = 10;
let allRepairLogs = [];
let filteredRepairLogs = [];
const API_BASE = 'https://test01-production-1af7.up.railway.app';

const NOTIFICATION_POLL_MS = 15000;
const NOTIFICATION_STORAGE_KEY = 'adminRealtimeNotificationStateV1';
let notificationTimer = null;
let notificationState = {
    initialized: false,
    lastBorrowLogId: 0,
    lastRepairId: 0,
    unreadBorrow: 0,
    unreadRepair: 0,
    unreadDue: 0,
    alertedDueLogIds: [],
    newBorrowLogIds: [],
    newRepairIds: [],
    newDueLogIds: []
};

function mergeRecentIds(existingIds, incomingIds, limit = 20) {
    const base = Array.isArray(existingIds) ? existingIds.map(normalizeId).filter(Boolean) : [];
    const incoming = Array.isArray(incomingIds) ? incomingIds.map(normalizeId).filter(Boolean) : [];
    return Array.from(new Set([...incoming, ...base])).slice(0, limit);
}

function loadNotificationState() {
    try {
        const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        notificationState = {
            ...notificationState,
            ...parsed
        };
    } catch (error) {
        console.warn('Unable to load notification state:', error);
    }
}

function saveNotificationState() {
    try {
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notificationState));
    } catch (error) {
        console.warn('Unable to save notification state:', error);
    }
}

function updateNotificationBadge() {
    const badge = document.getElementById('admin-notification-badge');
    if (!badge) return;
    const totalUnread = Number(notificationState.unreadBorrow || 0)
        + Number(notificationState.unreadRepair || 0)
        + Number(notificationState.unreadDue || 0);
    badge.textContent = String(totalUnread);
    badge.style.background = totalUnread > 0 ? '#ffcc00' : '#c9d3df';
}

function showNotificationToast(title, text) {
    if (typeof Swal === 'undefined') return;
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title,
        text,
        showConfirmButton: false,
        timer: 4500,
        timerProgressBar: true
    });
}

function normalizeId(value) {
    const id = Number(value);
    return Number.isFinite(id) && id > 0 ? id : 0;
}

function parseUtcDateTime(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;

    const normalized = raw.replace(' ', 'T');
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
    const isoValue = hasTimezone ? normalized : `${normalized}Z`;
    const parsed = new Date(isoValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDueDateFromLog(log) {
    const directValue = String(log.return_due_date || '').trim();
    if (directValue) {
        const directParsed = parseUtcDateTime(directValue);
        if (directParsed) {
            return directParsed;
        }
    }

    const noteText = String(log.note || '').trim();
    const dateMatch = noteText.match(/(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?)/);
    if (!dateMatch) return null;

    const parsedFromNote = parseUtcDateTime(dateMatch[1]);
    return parsedFromNote || null;
}

async function pollRealtimeNotifications() {
    try {
        const [borrowRes, repairRes] = await Promise.all([
            fetch(`${API_BASE}/borrowing-logs`),
            fetch(`${API_BASE}/api/repair?page=1&limit=50`)
        ]);

        if (!borrowRes.ok || !repairRes.ok) return;

        const [borrowData, repairData] = await Promise.all([
            borrowRes.json(),
            repairRes.json()
        ]);

        const borrowLogs = Array.isArray(borrowData.logs) ? borrowData.logs : [];
        const repairLogs = repairData && repairData.success && Array.isArray(repairData.data)
            ? repairData.data
            : [];

        const newestBorrowId = borrowLogs.reduce((maxId, log) => Math.max(maxId, normalizeId(log.log_id)), 0);
        const newestRepairId = repairLogs.reduce((maxId, repair) => Math.max(maxId, normalizeId(repair.repair_id)), 0);

        if (!notificationState.initialized) {
            notificationState.initialized = true;
            notificationState.lastBorrowLogId = newestBorrowId;
            notificationState.lastRepairId = newestRepairId;
            updateNotificationBadge();
            saveNotificationState();
            return;
        }

        const newBorrowCount = borrowLogs.filter((log) => normalizeId(log.log_id) > notificationState.lastBorrowLogId).length;
        const newRepairCount = repairLogs.filter((repair) => normalizeId(repair.repair_id) > notificationState.lastRepairId).length;
        const newBorrowIds = borrowLogs
            .filter((log) => normalizeId(log.log_id) > notificationState.lastBorrowLogId)
            .map((log) => normalizeId(log.log_id))
            .filter(Boolean);
        const newRepairIds = repairLogs
            .filter((repair) => normalizeId(repair.repair_id) > notificationState.lastRepairId)
            .map((repair) => normalizeId(repair.repair_id))
            .filter(Boolean);

        const activeBorrowLogs = borrowLogs.filter((log) => !log.return_date);
        const activeBorrowIds = new Set(activeBorrowLogs.map((log) => normalizeId(log.log_id)).filter(Boolean));
        const existingAlertedIds = Array.isArray(notificationState.alertedDueLogIds)
            ? notificationState.alertedDueLogIds.map(normalizeId).filter(Boolean)
            : [];
        const activeAlertedIds = existingAlertedIds.filter((id) => activeBorrowIds.has(id));
        const alertedIdSet = new Set(activeAlertedIds);

        const nowTs = Date.now();
        const dueReachedLogs = activeBorrowLogs.filter((log) => {
            const dueDate = parseDueDateFromLog(log);
            return dueDate && dueDate.getTime() <= nowTs;
        });

        const newlyDueLogs = dueReachedLogs.filter((log) => !alertedIdSet.has(normalizeId(log.log_id)));

        if (newBorrowCount > 0) {
            notificationState.unreadBorrow += newBorrowCount;
            notificationState.newBorrowLogIds = mergeRecentIds(notificationState.newBorrowLogIds, newBorrowIds);
            showNotificationToast('มีรายการยืมใหม่', `พบ ${newBorrowCount} รายการใหม่`);
        }

        if (newRepairCount > 0) {
            notificationState.unreadRepair += newRepairCount;
            notificationState.newRepairIds = mergeRecentIds(notificationState.newRepairIds, newRepairIds);
            showNotificationToast('มีการแจ้งซ่อมใหม่', `พบ ${newRepairCount} รายการใหม่`);
        }

        if (newlyDueLogs.length > 0) {
            notificationState.unreadDue += newlyDueLogs.length;
            notificationState.newDueLogIds = mergeRecentIds(
                notificationState.newDueLogIds,
                newlyDueLogs.map((log) => normalizeId(log.log_id)).filter(Boolean)
            );
            showNotificationToast('มีอุปกรณ์ครบกำหนดคืน', `พบ ${newlyDueLogs.length} รายการที่ครบกำหนด`);
        }

        notificationState.lastBorrowLogId = Math.max(notificationState.lastBorrowLogId, newestBorrowId);
        notificationState.lastRepairId = Math.max(notificationState.lastRepairId, newestRepairId);
        const newDueIds = newlyDueLogs.map((log) => normalizeId(log.log_id)).filter(Boolean);
        notificationState.alertedDueLogIds = Array.from(new Set([...activeAlertedIds, ...newDueIds])).slice(-500);
        updateNotificationBadge();
        saveNotificationState();
    } catch (error) {
        console.error('Realtime notification poll error:', error);
    }
}

function startRealtimeNotifications() {
    loadNotificationState();
    updateNotificationBadge();
    pollRealtimeNotifications();

    if (notificationTimer) {
        clearInterval(notificationTimer);
    }

    notificationTimer = setInterval(() => {
        pollRealtimeNotifications();
    }, NOTIFICATION_POLL_MS);
}

window.openNotificationCenter = function openNotificationCenter() {
    const borrow = Number(notificationState.unreadBorrow || 0);
    const repair = Number(notificationState.unreadRepair || 0);
    const due = Number(notificationState.unreadDue || 0);
    const total = borrow + repair + due;

    const renderItemButtons = (kind, ids) => {
        if (!Array.isArray(ids) || ids.length === 0) {
            return '<div class="text-muted small">- ไม่มีรายการใหม่ -</div>';
        }

        return ids.slice(0, 8).map((id) => (
            `<button type="button" class="btn btn-sm btn-outline-primary me-1 mb-1" onclick="openNotificationItem('${kind}', ${id})">#${id}</button>`
        )).join('');
    };

    const renderMenuLink = (kind, label, count) => {
        if (kind === 'repair') {
            return `<a href="status_repair.html" style="text-decoration: underline; font-weight: 700;">${label}: ${count} รายการ</a>`;
        }

        if (count <= 0) {
            return `<strong>${label}:</strong> ${count} รายการ`;
        }
        return `<a href="javascript:void(0)" onclick="openNotificationMenu('${kind}')" style="text-decoration: underline; font-weight: 700;">${label}: ${count} รายการ</a>`;
    };

    if (typeof Swal === 'undefined') return;

    Swal.fire({
        title: 'ศูนย์แจ้งเตือน Admin',
        html: `
            <div class="text-start" style="font-size: 0.95rem;">
                <div class="mb-2">${renderMenuLink('borrow', 'รายการยืมใหม่', borrow)}</div>
                <div class="mb-2">${renderItemButtons('borrow', notificationState.newBorrowLogIds)}</div>
                <div class="mb-2">${renderMenuLink('repair', 'รายการแจ้งซ่อมใหม่', repair)}</div>
                <div class="mb-2">${renderItemButtons('repair', notificationState.newRepairIds)}</div>
                <div class="mb-2">${renderMenuLink('due', 'รายการครบกำหนดคืน', due)}</div>
                <div class="mb-2">${renderItemButtons('due', notificationState.newDueLogIds)}</div>
                <hr>
                <div><strong>รวมทั้งหมด:</strong> ${total} รายการ</div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'ล้างแจ้งเตือน',
        cancelButtonText: 'ปิด',
        confirmButtonColor: '#0d9488'
    }).then((result) => {
        if (!result.isConfirmed) return;
        notificationState.unreadBorrow = 0;
        notificationState.unreadRepair = 0;
        notificationState.unreadDue = 0;
        notificationState.newBorrowLogIds = [];
        notificationState.newRepairIds = [];
        notificationState.newDueLogIds = [];
        updateNotificationBadge();
        saveNotificationState();
    });
};

window.openNotificationMenu = async function openNotificationMenu(kind) {
    if (typeof Swal !== 'undefined') {
        Swal.close();
    }

    if (kind === 'repair') {
        showSection('repair-logs');
        loadRepairLogs(1);
        return;
    }

    // borrow and due both point to borrowed list page
    window.location.href = 'borrowed.html';
};

window.openNotificationItem = async function openNotificationItem(kind, id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return;

    if (kind === 'borrow' || kind === 'due') {
        window.location.href = 'borrowed.html';
        return;
    }

    if (kind === 'repair') {
        showSection('repair-logs');
        const repairSearchInput = document.getElementById('repair-search');
        if (repairSearchInput) {
            repairSearchInput.value = String(normalizedId);
        }
        loadRepairLogs(1);
    }
};

// ฟังก์ชันค้นหาอุปกรณ์
function searchInventory() {
    const searchTerm = document.getElementById('inventory-search').value.toLowerCase();
    // ส่งคำค้นหาไปยัง Backend เพื่อค้นหาทั้งฐานข้อมูล
    loadInventory(1, searchTerm);
}

// ฟังก์ชันแสดง inventory (ใช้สำหรับค้นหา)
function displayInventory(data) {
    const listElement = document.getElementById('inventory-list');
    listElement.innerHTML = '';

    if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
            const fullImageUrl = item.image_url
                ? `${API_BASE}/uploads/${item.image_url}`
                : 'https://via.placeholder.com/50';

            listElement.innerHTML += `
                <tr>
                    <td class="text-center">
                        <img src="${fullImageUrl}" class="rounded border" width="50" height="50" style="object-fit: contain;">
                    </td>
                    <td><strong>${item.item_name}</strong></td>
                    <td><code>${item.contract_number || '-'}</code></td>
                    <td><code>${item.asset_number || '-'}</code></td>
                    <td><code>${item.serial_number || '-'}</code></td>
                    
                    <td><span class="text-muted">${item.category_display_name || 'ไม่ระบุ'}</span></td>
                    <td>
                        <span class="badge ${item.status === 'Available' ? 'bg-success' : 'bg-warning text-dark'}">
                            ${item.status || 'N/A'}
                        </span>
                    </td>
<td class="text-center">
                        <button class="btn btn-sm btn-outline-dark" onclick="showQR(${item.item_id}, '${item.item_name}')">
                            <i class="fas fa-qrcode"></i>
                        </button>
                    </td>

                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary" onclick="editItem(${item.item_id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    

                        <button class="btn btn-sm btn-outline-danger" onclick="deleteItem(${item.item_id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
        });
        if (data.pagination) renderPagination(data.pagination);
    } else {
        listElement.innerHTML = '<tr><td colspan="8" class="text-center text-muted">ไม่พบข้อมูล</td></tr>';
    }
}


async function showQR(itemId, itemName) {
    const qrImage = document.getElementById('qrDisplayImage');
    const downloadBtn = document.getElementById('qrDownloadBtn');

    let qrUrl = `${API_BASE}/qrcodes/qr_${itemId}.png`;

    try {
        const response = await fetch(`${API_BASE}/api/qrcode/${itemId}`);
        if (response.ok) {
            const data = await response.json();
            if (data?.success && data?.qr_url) {
                qrUrl = `${API_BASE}${data.qr_url}`;
            }
        }
    } catch (error) {
        console.warn('QR API fallback to static path:', error);
    }

    qrImage.src = qrUrl;
    downloadBtn.href = qrUrl;
    downloadBtn.download = `QR_${itemName}.png`;

    const qrModal = new bootstrap.Modal(document.getElementById('qrModal'));
    qrModal.show();
}

// ฟังก์ชันค้นหาประวัติการยืม-คืน
function searchBorrowingLogs() {
    const searchTerm = document.getElementById('logs-search').value.toLowerCase();
    currentLogsPage = 1;

    if (searchTerm === '') {
        filteredLogs = allBorrowingLogs;
    } else {
        filteredLogs = allBorrowingLogs.filter(log =>
            (log.employee_name && log.employee_name.toLowerCase().includes(searchTerm)) ||
            (log.item_name && log.item_name.toLowerCase().includes(searchTerm)) ||
            (log.Affiliation && log.Affiliation.toLowerCase().includes(searchTerm))
        );
    }

    displayBorrowingLogs(filteredLogs, currentLogsPage);
}

// ฟังก์ชันดึงข้อมูลประวัติการยืม-คืน
async function loadBorrowingLogs(page = 1) {
    currentLogsPage = page;
    try {
        const response = await fetch(`${API_BASE}/borrowing-logs`);
        const data = await response.json();
        allBorrowingLogs = data.logs || [];
        filteredLogs = allBorrowingLogs;

        displayBorrowingLogs(filteredLogs, page);
    } catch (error) {
        console.error('Error loading borrowing logs:', error);
    }
}

function getDueReturnDisplayFromLog(log) {
    const rawFromField = String(log.return_due_date || '').trim();
    if (rawFromField) {
        const parsed = parseUtcDateTime(rawFromField);
        if (parsed) {
            return parsed.toLocaleString('th-TH', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }
        return rawFromField;
    }

    const noteText = String(log.note || '').trim();
    const match = noteText.match(/^กำหนดคืน:\s*(.+)$/i);
    if (!match) return '-';

    const raw = match[1].trim();
    const normalized = raw.replace(' ', 'T');
    const parsed = parseUtcDateTime(normalized);
    if (parsed) {
        return parsed.toLocaleString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    return raw;
}

// ฟังก์ชันแสดงข้อมูล borrowing logs
function displayBorrowingLogs(logs, page) {
    const totalPages = Math.ceil(logs.length / logsPerPage);
    const offset = (page - 1) * logsPerPage;
    const pageItems = logs.slice(offset, offset + logsPerPage);

    const listElement = document.getElementById('logs-list');
    listElement.innerHTML = '';

    if (pageItems.length > 0) {
        pageItems.forEach((log, index) => {
            const borrowDate = new Date(log.borrow_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
            const returnDate = log.return_date
                ? new Date(log.return_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
                : '-';
            const status = log.return_date ? 'คืนแล้ว' : 'ยืมอยู่';
            const statusBadge = log.return_date ? 'bg-success' : 'bg-warning text-dark';
            const serialNumber = log.serial_number || '-';
            const serialColor = log.serial_number ? 'badge bg-info' : '';
            const purpose = log.purpose ? `<small>${log.purpose}</small>` : '<small class="text-muted">-</small>';
            const dueReturnDate = getDueReturnDisplayFromLog(log);

            // --- ส่วนที่เพิ่ม: จัดการแสดงผลรูปภาพ/ไฟล์ ---
            let filesHtml = '';
            if (log.file_paths && log.file_paths.length > 0) {
                log.file_paths.forEach(path => {
                    const fileUrl = `${API_BASE}${path}`;
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(path);

                    if (isImage) {
                        filesHtml += `
                            <a href="${fileUrl}" target="_blank" title="คลิกเพื่อดูรูปใหญ่">
                                <img src="${fileUrl}" class="img-thumbnail" 
                                     style="width: 100px; height: 50px; object-fit: cover; cursor: pointer; margin: 2px;">
                            </a>`;
                    } else {
                        filesHtml += `
                            <a href="${fileUrl}" target="_blank" class="btn btn-sm btn-outline-secondary" style="margin: 5px;">
                                <i class="bi bi-file-earmark-pdf"></i> เอกสารแนทในการยืม
                            </a>`;
                    }
                });
            } else {
                filesHtml = '<small class="text-muted">ไม่มี</small>';
            }

            const row = `
                <tr>
                    <td>${offset + index + 1}</td>
                    <td>${log.employee_name || '-'}</td>
                    <td><small>${log.Affiliation || '-'}</small></td>
                    <td>${log.item_name || '-'}</td>
                    <td><span class="${serialColor}">${serialNumber}</span></td>
                    <td>${borrowDate}</td>
                    <td><small>${dueReturnDate}</small></td>
                    <td>${returnDate}</td>
                    <td>${purpose}</td>
                    <td><span class="badge ${statusBadge}">${status}</span></td>
                    <td>${filesHtml}</td>
                </tr>
            `;
            listElement.innerHTML += row;
        });
        renderLogsPagination(totalPages, page);
    } else {
        listElement.innerHTML = '<tr><td colspan="11" class="text-center text-muted">ไม่พบข้อมูล</td></tr>';
    }
}

// ฟังก์ชัน render pagination สำหรับ logs
function renderLogsPagination(totalPages, currentPage) {
    const paginationElement = document.getElementById('logs-pagination');
    if (!paginationElement) return;

    let html = '';
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="loadBorrowingLogs(${currentPage - 1})">ก่อนหน้า</a>
             </li>`;

    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="javascript:void(0)" onclick="loadBorrowingLogs(${i})">${i}</a>
                 </li>`;
    }

    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="loadBorrowingLogs(${currentPage + 1})">ถัดไป</a>
             </li>`;

    paginationElement.innerHTML = html;
}

// ฟังก์ชันอัปเดตสรุปข้อมูล (เรียกเมื่อเพิ่ม/ลบ)
async function updateDashboardStats() {
    try {
        const response = await fetch(`${API_BASE}/items?page=1&limit=999`);
        const data = await response.json();
        const allItems = data.items || [];

        const totalItems = allItems.length;
        const availableCount = allItems.filter(i => i.status === 'Available').length;
        const borrowedCount = allItems.filter(i => i.status === 'Borrowed').length;
        
        // ดึงข้อมูลจำนวนอุปกรณ์ที่นำไปซ่อม จากตาราง item_repair
        const repairResponse = await fetch(`${API_BASE}/api/repair-items`);
        const repairData = await repairResponse.json();
        const repairCount = repairData.success ? repairData.data.length : 0;

        // ฟังก์ชันช่วยเช็ค ID ก่อนอัปเดตค่า
        const updateIfExist = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        };

        updateIfExist('total-items', totalItems);
        updateIfExist('total-available', availableCount);
        updateIfExist('total-borrowed', borrowedCount);
        updateIfExist('total-repair', repairCount);
        // สำหรับหน้าจอซ่อมที่คุณใช้อยู่
        updateIfExist('repair-count', repairCount);

    } catch (error) {
        console.error("Dashboard Error:", error);
    }
}


// // 1. ฟังก์ชันแปลง ID เป็นชื่อประเภท (วางไว้นอก loadInventory)
// function getCategoryName(catId) {
//     const id = Number(catId);
//     const categories = {
//         1: 'Laptop / Computer',
//         2: 'เครื่องเย็บกระดาษ / อุปกรณ์สำนักงาน',
//         3: 'Switch / Network',
//         4: 'อื่นๆ'
//     };
//     return categories[id] || 'ทั่วไป';
// }

// 2. ปรับปรุงฟังก์ชัน loadInventory
async function loadInventory(page = 1, search = '') {
    currentPage = page;
    try {
        const response = await fetch(`${API_BASE}/items?page=${page}&limit=6&search=${encodeURIComponent(search)}`);
        const data = await response.json();

        // ✅ เก็บข้อมูลลงในตัวแปร global เพื่อใช้ในการแก้ไขโดยไม่ต้องดึง API รายชิ้นที่พังอยู่
        currentInventory = data.items;

        // อัปเดตเฉพาะ total items จาก pagination
        if (data.pagination) {
            const totalElement = document.getElementById('total-items');
            if (totalElement) { // ต้องเช็คเสมอว่ามี ID นี้ไหม
                totalElement.innerText = data.pagination.totalItems || 0;
            }
        }

        displayInventory(data);
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

// async function updateDashboardNumbers() {
//     try {
//         // ดึงข้อมูลทั้งหมดแบบไม่แบ่งหน้าเพื่อมานับสรุป
//         const response = await fetch(`${API_BASE}/items?limit=999`); 
//         const data = await response.json();
//         const items = data.items;

//         const total = items.length;
//         const borrowed = items.filter(i => i.status === 'Borrowed').length;
//         const available = items.filter(i => i.status === 'Available').length;

//         // ใส่ค่าลงใน HTML ID ที่คุณมีอยู่
//         document.getElementById('total-items').innerText = total;
//         document.getElementById('total-borrowed').innerText = borrowed;
//         document.getElementById('total-available').innerText = available;
//     } catch (err) {
//         console.error("Dashboard Error:", err);
//     }
// }

// เรียกใช้ฟังก์ชันนี้ใน showSection('dashboard')

async function deleteItem(id) {
    const result = await Swal.fire({
        title: 'ยืนยันการลบ?',
        text: "รายการนี้จะถูกซ่อนออกจากระบบ (ประวัติการยืมยังคงอยู่)",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'ใช่, ลบเลย!',
        cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
        try {
            // แสดง loading ให้ผู้ใช้รู้ว่ากำลังทำงาน
            Swal.fire({
                title: 'กำลังลบ...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            const response = await fetch(`${API_BASE}/delete-item/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            const data = await response.json();

            if (response.ok) {
                await Swal.fire('สำเร็จ!', data.message || 'ลบรายการเรียบร้อยแล้ว', 'success');
                loadInventory(currentPage);
                updateDashboardStats(); // อัปเดตสรุปข้อมูล
            } else {
                throw new Error(data.error || `ลบไม่สำเร็จ`);
            }
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }
}


function renderPagination(pagination) {
    const { totalPages, currentPage } = pagination;
    const paginationElement = document.getElementById('pagination-container');
    if (!paginationElement) return;

    let html = '';
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="loadInventory(${currentPage - 1})">ก่อนหน้า</a>
             </li>`;

    const range = 3; // จำนวนหน้าที่จะแสดงก่อนและหลังหน้าปัจจุบัน

    for (let i = 1; i <= totalPages; i++) {
        // เงื่อนไข: แสดงหน้าแรก, หน้าสุดท้าย, และหน้ารอบๆ หน้าปัจจุบัน
        if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {

            html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="javascript:void(0)" onclick="loadInventory(${i})">${i}</a>
                 </li>`;

        } else if (i === currentPage - range - 1 || i === currentPage + range + 1) {
            // แสดง "..." เพื่อย่อเลขหน้า
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="loadInventory(${currentPage + 1})">ถัดไป</a>
             </li>`;

    paginationElement.innerHTML = html;
}

// 1. ฟังก์ชันเปิด Modal สำหรับเพิ่มใหม่
function openAddModal() {
    document.getElementById('modalTitle').innerText = "เพิ่มอุปกรณ์ใหม่";
    document.getElementById('itemForm').reset();
    document.getElementById('edit_item_id').value = "";
    document.getElementById('preview').src = "https://via.placeholder.com/150";
    new bootstrap.Modal(document.getElementById('itemModal')).show();
}

// 2. ฟังก์ชันบันทึกข้อมูล (ทั้งเพิ่มและแก้ไข)
async function saveItem(event) {
    if (event) event.preventDefault();

    Swal.fire({
        title: 'กำลังบันทึก...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const formData = new FormData();
        formData.append('item_name', document.getElementById('item_name').value);
        formData.append('cat_id', document.getElementById('cat_id').value);
        formData.append('status', document.getElementById('status').value);
        formData.append('asset_number', document.getElementById('asset_number').value);
        formData.append('serial_number', document.getElementById('serial_number').value);
        formData.append('contract_number', document.getElementById('contract_number').value);

        const imageInput = document.getElementById('imageInput');
        if (imageInput && imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }

        const response = await fetch(`${API_BASE}/add-item`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // 🚩 แสดงผลสำเร็จพร้อมรูป QR Code ทันที
            await Swal.fire({
                icon: 'success',
                title: 'บันทึกสำเร็จ!',
                html: `
                    <div class="text-center">
                        <p>สร้าง QR Code สำหรับอุปกรณ์เรียบร้อยแล้ว</p>
                        <img src="${API_BASE}${data.qr_url}" 
                             style="width:200px; height:200px; border:1px solid #ddd; padding:10px; margin:10px 0;">
                        <br>
                        <a href="${API_BASE}${data.qr_url}" download class="btn btn-primary btn-sm">
                            <i class="fas fa-download"></i> ดาวน์โหลดภาพ QR
                        </a>
                    </div>
                `,
                confirmButtonText: 'ตกลง'
            });

            bootstrap.Modal.getInstance(document.getElementById('itemModal')).hide();
            loadInventory(1); // โหลดตารางใหม่
            if (typeof updateDashboardStats === 'function') updateDashboardStats();

        } else {
            throw new Error(data.error || 'บันทึกไม่สำเร็จ');
        }

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message
        });
    }
}

function editItem(id) {
    const item = currentInventory.find(i => i.item_id == id);

    if (item) {
        // นำข้อมูลไปใส่ใน Input ของ Modal แก้ไข (เช็ค ID ให้ตรงกับ HTML)
        document.getElementById('edit_item_id').value = item.item_id;
        document.getElementById('edit_item_name').value = item.item_name;
        document.getElementById('edit_cat_id').value = item.cat_id || "";
        document.getElementById('edit_asset_number').value = item.asset_number || "";
        document.getElementById('edit_serial_number').value = item.serial_number || "";
        document.getElementById('edit_contract_number').value = item.contract_number || "";
        document.getElementById('edit_status').value = item.status;

        // แสดงรูปภาพตัวอย่าง
        const previewImg = document.getElementById('edit_preview');
        if (previewImg) {
            previewImg.src = item.image_url
                ? `${API_BASE}/uploads/${item.image_url}`
                : "https://via.placeholder.com/150";
        }

        const qrPreviewImg = document.getElementById('edit_qr_preview');
        if (qrPreviewImg) {
            qrPreviewImg.src = `${API_BASE}/qrcodes/qr_${item.item_id}.png`;

            fetch(`${API_BASE}/api/qrcode/${item.item_id}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data?.success && data?.qr_url) {
                        qrPreviewImg.src = `${API_BASE}${data.qr_url}`;
                    }
                })
                .catch(() => {
                });

            // ถ้ายังไม่มีรูป QR ให้โชว์ Placeholder
            qrPreviewImg.onerror = function () {
                this.src = "https://via.placeholder.com/100?text=No+QR";
            };
        }
        // เปิด Modal
        const editModal = new bootstrap.Modal(document.getElementById('editItemModal'));
        editModal.show();
    } else {
        console.error("ReferenceError: item is not defined - ID:", id); // แก้ปัญหาที่เคยเจอ
        Swal.fire('ผิดพลาด', 'ไม่พบข้อมูลในรายการปัจจุบัน', 'error');
    }
}

// ฟังก์ชันสำหรับโชว์ตัวอย่างรูปภาพก่อนอัปโหลด
function previewImage(event) {
    const reader = new FileReader();
    reader.onload = function () {
        const output = document.getElementById('preview');
        output.src = reader.result;
    };
    if (event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
    }
}

// 1. ฟังก์ชันเปิด Modal และดึงข้อมูลเดิมมาแสดง
function openEditModal(itemId) {
    // ค้นหาข้อมูลจากตัวแปร currentInventory ที่เราเก็บไว้ตอน loadInventory
    const item = currentInventory.find(i => i.item_id == itemId);

    if (item) {
        // ยัดข้อมูลลง Input (เช็ค ID ให้ตรงกับใน HTML นะครับ)
        document.getElementById('edit_item_id').value = item.item_id;
        document.getElementById('edit_item_name').value = item.item_name;
        document.getElementById('edit_cat_id').value = item.cat_id;
        document.getElementById('edit_status').value = item.status;
        document.getElementById('edit_asset_number').value = item.asset_number || '';
        document.getElementById('edit_serial_number').value = item.serial_number || '';
        document.getElementById('edit_contract_number').value = item.contract_number || '';

        // เปิด Modal
        const previewImg = document.getElementById('edit_preview');
        if (previewImg) {
            previewImg.src = item.image_url
                ? `${API_BASE}/uploads/${item.image_url}`
                : "https://via.placeholder.com/150";
        }

        // 4. สั่งเปิด Modal
        const editModal = new bootstrap.Modal(document.getElementById('editItemModal'));
        editModal.show();
    } else {
        console.error("ไม่พบข้อมูลอุปกรณ์ ID:", itemId);
        Swal.fire('ผิดพลาด', 'ไม่พบข้อมูลอุปกรณ์ในระบบ', 'error');
    }
}

// 2. ฟังก์ชันส่งข้อมูลที่แก้ไขแล้วไปบันทึกที่ Server (PUT)
async function updateItem() {
    const itemId = document.getElementById('edit_item_id').value;
    const formData = new FormData();

    formData.append('item_name', document.getElementById('edit_item_name').value);
    formData.append('cat_id', document.getElementById('edit_cat_id').value);
    formData.append('asset_number', document.getElementById('edit_asset_number').value);
    formData.append('serial_number', document.getElementById('edit_serial_number').value);
    formData.append('contract_number', document.getElementById('edit_contract_number').value);
    formData.append('status', document.getElementById('edit_status').value);

    const imageInput = document.getElementById('edit_imageInput');
    if (imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        Swal.fire({ title: 'กำลังอัปเดต...', didOpen: () => Swal.showLoading() });

        const response = await fetch(`${API_BASE}/update-item-all/${itemId}`, {
            method: 'PUT',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            await Swal.fire({ icon: 'success', title: 'สำเร็จ', text: result.message, timer: 1500, showConfirmButton: false });

            // ปิด Modal และโหลดข้อมูลหน้าเดิมใหม่โดยไม่ต้องรีโหลดหน้าเว็บทั้งหมด
            bootstrap.Modal.getInstance(document.getElementById('editItemModal')).hide();
            loadInventory(currentPage);
            updateDashboardStats(); // อัปเดตสรุปข้อมูล
        } else {
            Swal.fire('ล้มเหลว', result.error, 'error');
        }
    } catch (error) {
        console.error("Update error:", error);
        Swal.fire('Error', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
    }
}

function previewImageEdit(event) {
    const reader = new FileReader();
    reader.onload = function () {
        const output = document.getElementById('edit_preview');
        output.src = reader.result;
    }
    reader.readAsDataURL(event.target.files[0]);
}

function renderPagination(pagination) {
    const { totalPages, currentPage } = pagination;
    const paginationElement = document.getElementById('pagination-container');
    if (!paginationElement) return;

    let html = '';
    // ปุ่ม Previous
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="loadInventory(${currentPage - 1})">ก่อนหน้า</a>
             </li>`;

    // ปุ่มเลขหน้า
    const range = 3; // จำนวนหน้าที่จะแสดงก่อนและหลังหน้าปัจจุบัน

    for (let i = 1; i <= totalPages; i++) {
        // เงื่อนไข: แสดงหน้าแรก, หน้าสุดท้าย, และหน้ารอบๆ หน้าปัจจุบัน
        if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {

            html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="javascript:void(0)" onclick="loadInventory(${i})">${i}</a>
                 </li>`;

        } else if (i === currentPage - range - 1 || i === currentPage + range + 1) {
            // แสดง "..." เพื่อย่อเลขหน้า
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // ปุ่ม Next
    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="loadInventory(${currentPage + 1})">ถัดไป</a>
             </li>`;

    paginationElement.innerHTML = html;
}

// ฟังก์ชัน Logout
function logout() {
    Swal.fire({
        title: 'ยืนยันการออกจากระบบ?',
        text: 'คุณแน่ใจหรือไม่ที่จะออกจากระบบ',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ออก',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/login.html';
        }
    });
}

// ตรวจสอบ session เมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const adminUser = localStorage.getItem('adminUser');
    const userDisplay = document.getElementById('usernameDisplay');

    // ✅ ตรวจสอบก่อนว่ามี element นี้ในหน้านี้ไหม
    if (userDisplay && adminUser) {
        userDisplay.textContent = 'Admin ' + adminUser;
    }

    // ✅ ตรวจสอบว่าอยู่หน้า Inventory หรือไม่
    if (document.getElementById('inventory-list')) {
        await loadInventory();
    }

    // ✅ ตรวจสอบว่าอยู่หน้า Dashboard (ที่มีสรุปยอด) หรือไม่
    if (document.getElementById('total-items')) {
        updateDashboardStats();
    }

    // ✅ ตรวจสอบว่าอยู่หน้า status_repair.html หรือไม่
    if (document.getElementById('     ')) {
        await loadRepairData(); // เรียกฟังก์ชันโหลดข้อมูลซ่อม
    }

    startRealtimeNotifications();
});

// ===================== REPAIR LOGS FUNCTIONS =====================

function loadRepairLogs(page = 1) {
    const searchTerm = document.getElementById('repair-search')?.value || '';
    const numericRepairId = Number(searchTerm);
    if (Number.isFinite(numericRepairId) && numericRepairId > 0) {
        const localMatches = (allRepairLogs || []).filter((repair) => Number(repair.repair_id) === numericRepairId);
        if (localMatches.length > 0) {
            displayRepairLogs(localMatches);
            displayRepairPagination({ currentPage: 1, totalPages: 1 });
            const totalRepairsEl = document.getElementById('totalRepairs');
            if (totalRepairsEl) totalRepairsEl.textContent = String(localMatches.length);
            return;
        }
    }
    const url = `${API_BASE}/api/repair?page=${page}&limit=${repairLogsPerPage}&search=${searchTerm}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                allRepairLogs = data.data;
                displayRepairLogs(data.data);
                displayRepairPagination(data.pagination);
                document.getElementById('totalRepairs').textContent = data.pagination.totalRecords;
            }
        })
        .catch(err => {
            console.error('Error loading repair logs:', err);
            document.getElementById('repair-logs-list').innerHTML = '<tr><td colspan="14" class="text-center text-danger">เกิดข้อผิดพลาด</td></tr>';
        });
}

function displayRepairLogs(repairs) {
    const listElement = document.getElementById('repair-logs-list');
    listElement.innerHTML = '';

    if (!repairs || repairs.length === 0) {
        listElement.innerHTML = '<tr><td colspan="14" class="text-center text-muted p-4">ไม่พบข้อมูลการซ่อม</td></tr>';
        return;
    }

    repairs.forEach((repair) => {
        const repairMethod = repair.repair_method || repair.Procedure || '-';

        // 1. จัดการข้อความปัญหา (ตัดข้อความ)
        const problemText = repair.problem ? repair.problem.substring(0, 20) + (repair.problem.length > 20 ? '...' : '') : '-';

        // 2. จัดการ Format วันที่ (แบบสั้น อ่านง่าย)
        const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };

        const createdDate = repair.created_at
            ? new Date(repair.created_at).toLocaleString('th-TH', dateOptions)
            : '-';

        // วันที่รับคืน (ตรวจสอบว่าถ้า updated_at เหมือนกับ created_at แสดงว่ายังไม่เสร็จ)
        const updatedDate = (repair.updated_at && repair.updated_at !== repair.created_at)
            ? new Date(repair.updated_at).toLocaleString('th-TH', dateOptions)
            : '<span class="badge bg-light text-warning fw-normal border">รอดำเนินการ</span>';

        const repairPrice = Number(repair.price);
        const repairPriceText = Number.isFinite(repairPrice) && repairPrice >= 0
            ? repairPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '-';

        // 3. จัดการไฟล์แนบ
        let fileHtml = '<small class="text-muted">ไม่มี</small>';

        // เปลี่ยนจาก file_paths เป็น repair_url ตามชื่อใน DB
        if (repair.repair_url) {
            // แยกชื่อไฟล์ด้วยคอมมา (,) เผื่อกรณีมีหลายไฟล์
            const files = repair.repair_url.split(',');

            fileHtml = files.map(filename => {
                let cleanName = filename.trim();
                if (!cleanName) return '';

                // 1. กำจัดสแลชที่อาจติดมาข้างหน้าชื่อไฟล์ (เพื่อป้องกันปัญหา // สแลชซ้ำ)
                cleanName = cleanName.replace(/^\/+/, '');

                // 2. ตรวจสอบชื่อไฟล์: 
                // ถ้าใน DB บันทึกว่า "uploads/repairs/ชื่อไฟล์.jpg" อยู่แล้ว -> ใช้ได้เลย
                // ถ้าใน DB บันทึกแค่ "ชื่อไฟล์.jpg" -> ต้องเติม /uploads/repairs/ เข้าไป
                let finalPath = cleanName.includes('uploads/')
                    ? cleanName
                    : `uploads/repairs/${cleanName}`;

                // 3. สร้าง URL เต็มจากโดเมนปัจจุบัน
                // และลบสแลชซ้ำซ้อนด้วย Regex อีกชั้นเพื่อความชัวร์
                let fullUrl = `${API_BASE}/${finalPath}`.replace(/([^:]\/)\/+/g, "$1");

                return `<a href="${fullUrl}" target="_blank" class="btn btn-sm btn-outline-primary py-0 px-2 me-1">
                <i class="fas fa-image"></i>
            </a>`;
            }).join('');
        }

        // 4. Render HTML ตามโครงสร้าง Table Header ใน HTML ของคุณ
        listElement.innerHTML += `
            <tr>
                <td><strong>#${repair.repair_id}</strong></td>
                <td><strong>${repair.employee_name ? repair.employee_name.trim() : '-'}</strong></td>
                <td><small>${repair.employees_code || '-'}</small></td>
                <td>${repair.phone_number || '-'}</td>
                <td>${repair.brand || '-'}</td>
                <td><code>${repair.serial_number || '-'}</code></td>
                <td><code>${repair.asset_number || '-'}</code></td>
                <td>${repair.affiliation || '-'}</td>
                <td title="${repair.problem || ''}">${problemText}</td>
                <td title="${repairMethod}">${repairMethod}</td>
                <td class="text-end">${repairPriceText}</td>
                <td class="text-nowrap"><small>${createdDate}</small></td>
                <td class="text-nowrap"><small>${updatedDate}</small></td>
                <td>${fileHtml}</td>
            </tr>
        `;
    });
}

async function updateRepairStatusCount() {
    try {
        const res = await fetch(`${API_BASE}/api/repair-status`);
        const result = await res.json();

        const countElement = document.getElementById('total-repair-status');
        if (countElement && result.success) {
            // แสดงจำนวนรายการที่ค้างซ่อมทั้งหมด
            countElement.innerText = result.data.length;
        }
    } catch (error) {
        console.error("Error updating dashboard count:", error);
    }
}

// เรียกใช้ฟังก์ชันนี้ในตอนโหลดหน้า Dashboard
document.addEventListener('DOMContentLoaded', function () {
    updateRepairStatusCount();
});

// ฟังก์ชันดึงยอดรวมงานค้างซ่อมไปโชว์ที่ Dashboard
async function syncRepairDashboard() {
    try {
        const res = await fetch(`${API_BASE}/api/repair-management`);
        const result = await res.json();
        const countEl = document.getElementById('total-repair-status');

        if (countEl && result.success) {
            countEl.innerText = result.data.length; // แสดงจำนวนงานที่ Pending + In Progress
        }
    } catch (error) {
        console.error("Sync Dashboard Error:", error);
    }
}

function displayRepairPagination(pagination) {
    const paginationElement = document.getElementById('repair-logs-pagination');
    let html = '';

    html += `<li class="page-item ${pagination.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="loadRepairLogs(${pagination.currentPage - 1})">ก่อนหน้า</a>
             </li>`;

    for (let i = 1; i <= pagination.totalPages; i++) {
        html += `<li class="page-item ${i === pagination.currentPage ? 'active' : ''}">
                    <a class="page-link" href="javascript:void(0)" onclick="loadRepairLogs(${i})">${i}</a>
                 </li>`;
    }

    html += `<li class="page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="loadRepairLogs(${pagination.currentPage + 1})">ถัดไป</a>
             </li>`;

    paginationElement.innerHTML = html;
}


async function loadRecentBorrows() {
    try {
        // ใช้ Endpoint เดียวกับหน้าประวัติการยืมที่คุณมี
        const response = await fetch(`${API_BASE}/borrowing-logs`);
        const data = await response.json();
        const logs = data.logs || [];
        
        // กรองเอาเฉพาะรายการที่ "กำลังยืมอยู่" และหยิบมาแค่ 5 รายการล่าสุด
        const recentBorrows = logs
            .filter(log => !log.return_date) // เฉพาะที่ยังไม่คืน
            .slice(0, 5);

        const listElement = document.getElementById('dashboard-borrow-list');
        if (!listElement) return;

        let html = '';
        if (recentBorrows.length > 0) {
            recentBorrows.forEach(log => {
                const borrowDate = new Date(log.borrow_date).toLocaleDateString('th-TH');
                html += `
                <tr style="cursor: pointer;" onclick="showBorrowDetail(${log.log_id})" class="hover-row">
                    <td class="ps-4"><strong>${log.employee_name}</strong></td>
                    <td>${log.item_name}</td>
                    <td><span class="badge bg-info text-white font-monospace">${log.serial_number || '-'}</span></td>
                    <td><small>${log.purpose || '-'}</small></td>
                    <td><span class="badge bg-warning text-dark">กำลังยืม</span></td>
                </tr>`;
            });
        } else {
            html = '<tr><td colspan="5" class="text-center p-4 text-muted">ไม่มีรายการยืมในขณะนี้</td></tr>';
        }
        listElement.innerHTML = html;
    } catch (error) {
        console.error("Error loading dashboard borrows:", error);
    }
}

// ฟังก์ชันสร้างกราฟสถิติอุปกรณ์
let deviceChart;
function renderDeviceChart() {
    const ctx = document.getElementById('deviceDoughnutChart')?.getContext('2d');
    if (!ctx) return;

    const available = parseInt(document.getElementById('total-available').innerText) || 0;
    const borrowed = parseInt(document.getElementById('total-borrowed').innerText) || 0;
    const statusRepair = parseInt(document.getElementById('total-repair-status').innerText) || 0;

    if (deviceChart) deviceChart.destroy();

    deviceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['ว่าง','ซ่อม', 'ยืมอยู่'],
            datasets: [{
                data: [available ,statusRepair, borrowed],
                backgroundColor: ['#0C7779',  '#EA7B7B', '#E5BA41'],
                borderWidth: 0,
                hoverOffset: 15 // เพิ่ม Effect เวลาเอาเมาส์ชี้
            }]
        },
        options: {
            cutout: '70%',
            // เพิ่มส่วนการคลิกตรงนี้
            onClick: (evt, item) => {
                if (item.length > 0) {
                    const index = item[0].index;
                    const label = deviceChart.data.labels[index];
                    
                    // กำหนดเงื่อนไขว่าถ้าคลิกแต่ละสีจะให้ไปที่ไหน
                    switch (label) {
                        case 'ว่าง':
                            window.location.href = 'available.html';
                            break;
                        case 'อะไหล่คอมที่นำไปซ่อม':
                            window.location.href = 'repair.html';
                            break;
                        case 'ยืมอยู่':
                             window.location.href = 'borrowed.html';
                            break;
                        case 'ซ่อม':
                            window.location.href = 'status_repair.html';
                            break;
                    }
                }
            },
            // เปลี่ยนรูปเมาส์เป็นรูปมือเมื่อชี้บนกราฟเพื่อให้รู้ว่ากดได้
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            plugins: {
                legend: { 
                    position: 'bottom', 
                    labels: { usePointStyle: true, padding: 20 } 
                }
            }
        }
    });
}

// ฟังก์ชันแสดงรายละเอียดการยืม
async function showBorrowDetail(logId) {
    try {
        const response = await fetch(`${API_BASE}/borrowing-logs`);
        const data = await response.json();
        const log = data.logs.find(l => l.log_id === logId);
        
        if (!log) {
            Swal.fire('ไม่พบข้อมูล', 'ไม่พบรายการยืมนี้', 'error');
            return;
        }
        
        const borrowDate = new Date(log.borrow_date).toLocaleString('th-TH');
        const returnDate = log.return_date ? new Date(log.return_date).toLocaleString('th-TH') : '-';
        const dueReturnDate = getDueReturnDisplayFromLog(log);
        const status = log.return_date ? '<span class="badge bg-success">คืนแล้ว</span>' : '<span class="badge bg-warning text-dark">กำลังยืม</span>';
        
        Swal.fire({
            title: 'รายละเอียดการยืม',
            html: `
                <div class="text-start" style="font-size: 0.95rem;">
                    <div class="mb-3"><strong>ชื่อพนักงาน:</strong> ${log.employee_name}</div>
                    <div class="mb-3"><strong>หน่วยงาน:</strong> ${log.Affiliation || '-'}</div>
                    <div class="mb-3"><strong>อุปกรณ์:</strong> ${log.item_name}</div>
                    <div class="mb-3"><strong>Serial Number:</strong> <code>${log.serial_number || '-'}</code></div>
                    <div class="mb-3"><strong>วัตถุประสงค์:</strong> ${log.purpose || '-'}</div>
                    <div class="mb-3"><strong>วันที่ยืม:</strong> ${borrowDate}</div>
                    <div class="mb-3"><strong>กำหนดการคืน:</strong> ${dueReturnDate}</div>
                    <div class="mb-3"><strong>วันที่คืน:</strong> ${returnDate}</div>
                    <div class="mb-3"><strong>สถานะ:</strong> ${status}</div>
                    ${log.note ? `<div class="mb-3"><strong>หมายเหตุ:</strong> ${log.note}</div>` : ''}
                </div>
            `,
            width: 600,
            confirmButtonText: 'ปิด',
            confirmButtonColor: '#667eea'
        });
    } catch (error) {
        console.error('Error showing borrow detail:', error);
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้', 'error');
    }
}

// อัปเดตฟังก์ชัน updateDashboardStats เดิมให้เรียกข้อมูลใหม่เพิ่ม
const originalStatsFunction = updateDashboardStats;
updateDashboardStats = async function() {
    await originalStatsFunction(); // เรียกของเดิมที่อัปเดตตัวเลข
    loadRecentBorrows();           // โหลดตารางยืมล่าสุด
    setTimeout(renderDeviceChart, 600); // วาดกราฟ (รอตัวเลขโหลดเสร็จแป๊บหนึ่ง)
};


function searchRepairLogs() {
    loadRepairLogs(1);
}
