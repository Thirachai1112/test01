const SERVER_IP = window.location.hostname || 'localhost';
const CONFIG = {
    API_BASE: `http://${SERVER_IP}:5000`
};

// เก็บสถานะการแบ่งหน้า
const state = {
    allAvailableItems: [],
    filteredItems: [],
    currentPage: 1,
    rowsPerPage: 10 // แสดงหน้าละ 10 รายการ
};

async function loadAvailableItems() {
    try {
        const response = await fetch(`${CONFIG.API_BASE}/items?page=1&limit=999`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // กรองเฉพาะสถานะ Available (ว่าง)
        state.allAvailableItems = data.items.filter(item => item.status === 'Available');
        state.filteredItems = [...state.allAvailableItems]; // เริ่มต้นให้ข้อมูลค้นหาเท่ากับข้อมูลทั้งหมด
        
        const countElem = document.getElementById('available-count');
        if (countElem) countElem.textContent = state.allAvailableItems.length;

        renderTable();
    } catch (err) {
        console.error("Error:", err);
        const tbody = document.getElementById('inventory-list');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">ไม่สามารถโหลดข้อมูลได้</td></tr>';
    }
}

function renderTable() {
    const tbody = document.getElementById('inventory-list');
    if (!tbody) return;

    // คำนวณช่วงข้อมูลที่จะแสดง (Pagination Logic)
    const start = (state.currentPage - 1) * state.rowsPerPage;
    const end = start + state.rowsPerPage;
    const paginatedItems = state.filteredItems.slice(start, end);

    tbody.innerHTML = '';

    if (paginatedItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted p-4">ไม่พบข้อมูลอุปกรณ์</td></tr>';
        renderPagination(0);
        return;
    }

    paginatedItems.forEach((item) => {
        const qrUrl = `${CONFIG.API_BASE}/qrcodes/qr_${item.item_id}.png`;
        const imageUrl = item.image_url 
            ? `${CONFIG.API_BASE}/uploads/${item.image_url}` 
            : 'https://via.placeholder.com/50';

        tbody.innerHTML += `
            <tr>
                <td class="text-center">
                    <img src="${imageUrl}" class="rounded border" width="50" height="50" style="object-fit: contain;" onerror="this.src='https://via.placeholder.com/50'">
                </td>
                <td><strong>${item.item_name}</strong></td>
                <td><code>${item.asset_number || '-'}</code></td>
                <td><code>${item.serial_number || '-'}</code></td>
                <td>${item.category_display_name || 'ทั่วไป'}</td>
                <td><span class="badge bg-success">ว่างพร้อมใช้งาน</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-dark" onclick="showQR('${qrUrl}', '${item.item_name}')">
                        <i class="fas fa-qrcode"></i> ดู QR
                    </button>
                </td>
            </tr>`;
    });

    renderPagination(state.filteredItems.length);
}

function renderPagination(totalItems) {
    const container = document.getElementById('pagination-container');
    if (!container) return;

    const totalPages = Math.ceil(totalItems / state.rowsPerPage);
    container.innerHTML = '';

    if (totalPages <= 1) return;

    const currentPage = state.currentPage;
    const range = 2; // จำนวนเลขหน้าที่จะแสดงรอบๆ หน้าปัจจุบัน

    // ปุ่ม "ก่อนหน้า"
    container.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="changePage(${currentPage - 1})">ก่อนหน้า</a>
        </li>`;

    // แสดงหน้าแรกเสมอ
    addPageButton(1, currentPage, container);

    // แสดงจุดไข่ปลาด้านหน้า (ถ้าหน้าปัจจุบันอยู่ไกลจากหน้าแรก)
    if (currentPage > range + 2) {
        container.innerHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }

    // แสดงตัวเลขหน้าในช่วงปัจจุบัน (รอบๆ currentPage)
    for (let i = Math.max(2, currentPage - range); i <= Math.min(totalPages - 1, currentPage + range); i++) {
        addPageButton(i, currentPage, container);
    }

    // แสดงจุดไข่ปลาด้านหลัง (ถ้าหน้าปัจจุบันอยู่ไกลจากหน้าสุดท้าย)
    if (currentPage < totalPages - (range + 1)) {
        container.innerHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }

    // แสดงหน้าสุดท้ายเสมอ
    if (totalPages > 1) {
        addPageButton(totalPages, currentPage, container);
    }

    // ปุ่ม "ถัดไป"
    container.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="changePage(${currentPage + 1})">ถัดไป</a>
        </li>`;
}

// ฟังก์ชันเสริมสำหรับสร้างปุ่มตัวเลข
function addPageButton(i, currentPage, container) {
    container.innerHTML += `
        <li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="changePage(${i})">${i}</a>
        </li>`;
}

function changePage(page) {
    state.currentPage = page;
    renderTable();
    window.scrollTo({ top: 0, behavior: 'smooth' }); // เลื่อนขึ้นบนนุ่มนวล
}

function searchInventory() {
    const searchTerm = document.getElementById('inventory-search').value.toLowerCase();
    
    // กรองข้อมูลจาก Array หลัก
    state.filteredItems = state.allAvailableItems.filter(item => {
        return (
            item.item_name.toLowerCase().includes(searchTerm) ||
            (item.asset_number && item.asset_number.toLowerCase().includes(searchTerm)) ||
            (item.serial_number && item.serial_number.toLowerCase().includes(searchTerm))
        );
    });

    state.currentPage = 1; // เมื่อค้นหาใหม่ให้กลับไปเริ่มที่หน้า 1
    renderTable();
}

function showQR(qrUrl, itemName) {
    const modalHtml = `
        <div class="modal fade" id="qrTempModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content">
                    <div class="modal-header py-2">
                        <h6 class="modal-title small">${itemName}</h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center p-4">
                        <img src="${qrUrl}" class="img-fluid border p-2 mb-3" style="max-height: 200px;">
                        <a href="${qrUrl}" download class="btn btn-primary btn-sm w-100">โหลด QR</a>
                    </div>
                </div>
            </div>
        </div>`;
    
    const oldModal = document.getElementById('qrTempModal');
    if (oldModal) oldModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    new bootstrap.Modal(document.getElementById('qrTempModal')).show();
}

document.addEventListener('DOMContentLoaded', loadAvailableItems);