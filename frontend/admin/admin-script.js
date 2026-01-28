let currentInventory = [];
let currentPage = 1;
let filteredInventory = []; // เก็บผลลัพธ์ค้นหา inventory

let currentLogsPage = 1;
const logsPerPage = 10;
let allBorrowingLogs = []; // เก็บข้อมูลทั้งหมด
let filteredLogs = []; // เก็บผลลัพธ์ค้นหา logs

// ฟังก์ชันค้นหาอุปกรณ์
function searchInventory() {
    const searchTerm = document.getElementById('inventory-search').value.toLowerCase();
    
    if (searchTerm === '') {
        loadInventory(1);
    } else {
        // ค้นหาจาก currentInventory ที่ดึงมาแล้ว
        const searchResponse = {
            items: currentInventory.filter(item => 
                item.item_name.toLowerCase().includes(searchTerm) ||
                (item.serial_number && item.serial_number.toLowerCase().includes(searchTerm)) ||
                (item.asset_number && item.asset_number.toLowerCase().includes(searchTerm))
            ),
            pagination: { totalItems: 0, totalPages: 1, currentPage: 1 }
        };
        
        displayInventory(searchResponse);
    }
}

// ฟังก์ชันแสดง inventory (ใช้สำหรับค้นหา)
function displayInventory(data) {
    const listElement = document.getElementById('inventory-list');
    listElement.innerHTML = '';

    if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
            const fullImageUrl = item.image_url
                ? `http://localhost:5000/uploads/${item.image_url}`
                : 'https://via.placeholder.com/50';

            listElement.innerHTML += `
                <tr>
                    <td class="text-center">
                        <img src="${fullImageUrl}" class="rounded border" width="50" height="50" style="object-fit: contain;">
                    </td>
                    <td><strong>${item.item_name}</strong></td>
                    <td><code>${item.asset_number || '-'}</code></td>
                    <td><code>${item.serial_number || '-'}</code></td>
                    <td><span class="text-muted">${item.category_display_name || 'ไม่ระบุ'}</span></td>
                    <td>
                        <span class="badge ${item.status === 'Available' ? 'bg-success' : 'bg-warning text-dark'}">
                            ${item.status || 'N/A'}
                        </span>
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
        listElement.innerHTML = '<tr><td colspan="7" class="text-center text-muted">ไม่พบข้อมูล</td></tr>';
    }
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
        const response = await fetch(`http://localhost:5000/borrowing-logs`);
        const data = await response.json();
        allBorrowingLogs = data.logs || [];
        filteredLogs = allBorrowingLogs;
        
        displayBorrowingLogs(filteredLogs, page);
    } catch (error) {
        console.error('Error loading borrowing logs:', error);
    }
}

// ฟังก์ชันแสดงข้อมูล borrowing logs
function displayBorrowingLogs(logs, page) {
    // คำนวณ pagination
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

            const row = `
                <tr>
                    <td>${offset + index + 1}</td>
                    <td>${log.employee_name || '-'}</td>
                    <td><small>${log.Affiliation || '-'}</small></td>
                    <td>${log.item_name || '-'}</td>
                    <td><span class="${serialColor}">${serialNumber}</span></td>
                    <td>${borrowDate}</td>
                    <td>${returnDate}</td>
                    <td>${purpose}</td>
                    <td><span class="badge ${statusBadge}">${status}</span></td>
                    <td><small>${log.note || '-'}</small></td>
                </tr>
            `;
            listElement.innerHTML += row;
        });
        renderLogsPagination(totalPages, page);
    } else {
        listElement.innerHTML = '<tr><td colspan="10" class="text-center text-muted">ไม่พบข้อมูล</td></tr>';
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
        // ดึงข้อมูลทั้งหมด (limit 999 แค่สำหรับนับข้อมูล)
        const response = await fetch(`http://localhost:5000/items?page=1&limit=999`);
        const data = await response.json();
        const allItems = data.items || [];

        const totalItems = allItems.length;
        const availableCount = allItems.filter(i => i.status === 'Available').length;
        const borrowedCount = allItems.filter(i => i.status === 'Borrowed').length;

        document.getElementById('total-items').innerText = totalItems;
        document.getElementById('total-available').innerText = availableCount;
        document.getElementById('total-borrowed').innerText = borrowedCount;
    } catch (err) {
        console.error("Dashboard Error:", err);
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
        const response = await fetch(`http://localhost:5000/items?page=${page}&limit=6&search=${encodeURIComponent(search)}`);
        const data = await response.json();

        // ✅ เก็บข้อมูลลงในตัวแปร global เพื่อใช้ในการแก้ไขโดยไม่ต้องดึง API รายชิ้นที่พังอยู่
        currentInventory = data.items;

        // อัปเดตเฉพาะ total items จาก pagination
        if (data.pagination) {
            document.getElementById('total-items').innerText = data.pagination.totalItems || 0;
        }

        displayInventory(data);
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

// async function updateDashboardNumbers() {
//     try {
//         // ดึงข้อมูลทั้งหมดแบบไม่แบ่งหน้าเพื่อมานับสรุป
//         const response = await fetch(`http://localhost:5000/items?limit=999`); 
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
            
            const response = await fetch(`http://localhost:5000/delete-item/${id}`, {
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

    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="javascript:void(0)" onclick="loadInventory(${i})">${i}</a>
                 </li>`;
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
    // 1. หยุดการ Refresh หน้าจอ (หัวใจสำคัญที่ทำให้ไม่เด้ง)
    if (event) event.preventDefault();

    // 2. แสดงสถานะกำลังโหลด (เพื่อให้ผู้ใช้รู้ว่าระบบกำลังทำงาน)
    Swal.fire({
        title: 'กำลังบันทึก...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const formData = new FormData();
        
        // 3. ดึงข้อมูลจาก Input ทีละตัวตาม ID ที่เราตั้งไว้ใน index.html
        formData.append('item_name', document.getElementById('item_name').value);
        formData.append('cat_id', document.getElementById('cat_id').value);
        formData.append('status', document.getElementById('status').value);
        formData.append('asset_number', document.getElementById('asset_number').value);
        formData.append('serial_number', document.getElementById('serial_number').value);
        formData.append('contract_number', document.getElementById('contract_number').value);

        // 4. จัดการเรื่องรูปภาพ (ถ้ามี)
        const imageInput = document.getElementById('imageInput');
        if (imageInput && imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }

        // 5. ส่งข้อมูลไปยัง Backend API
        const response = await fetch('http://localhost:5000/add-item', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            
            await Swal.fire({
                icon: 'success',
                title: 'สำเร็จ!',
                text: 'บันทึกข้อมูลอุปกรณ์เรียบร้อยแล้ว',
                timer: 800
            });

            const modalElement = document.getElementById('itemModal');
            const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
            modal.hide();

            // เพิ่มแถวใหม่ลงในตารางโดยตรง (ไม่ต้องโหลดหน้า)
            if (data.item) {
                const item = data.item;
                const fullImageUrl = item.image_url
                    ? `http://localhost:5000/uploads/${item.image_url}`
                    : 'https://via.placeholder.com/50';

                const newRow = `
                    <tr>
                        <td class="text-center">
                            <img src="${fullImageUrl}" class="rounded border" width="50" height="50" style="object-fit: contain;">
                        </td>
                        <td><strong>${item.item_name}</strong></td>
                        <td><code>${item.serial_number || item.asset_number || '-'}</code></td>
                        <td><span class="text-muted">${item.category_display_name || 'ไม่ระบุ'}</span></td>
                        <td>
                            <span class="badge bg-success">
                                ${item.status || 'Available'}
                            </span>
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

                const listElement = document.getElementById('inventory-list');
                listElement.insertAdjacentHTML('afterbegin', newRow);
                currentInventory.unshift(item); // เพิ่มข้อมูลลง global array
                updateDashboardStats(); // อัปเดตสรุปข้อมูล
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'บันทึกไม่สำเร็จ');
        }

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้'
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
                ? `http://localhost:5000/uploads/${item.image_url}`
                : "https://via.placeholder.com/150";
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
                ? `http://localhost:5000/uploads/${item.image_url}`
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

        const response = await fetch(`http://localhost:5000/update-item-all/${itemId}`, {
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
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="javascript:void(0)" onclick="loadInventory(${i})">${i}</a>
                 </li>`;
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
            window.location.href = 'login.html';
        }
    });
}

// ตรวจสอบ session เมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        // ไม่มี token ให้ไปหน้า login
        window.location.href = 'login.html';
        return;
    }

    // โหลดข้อมูล Admin username (ถ้าเก็บไว้)
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
        // หากต้องการให้แสดง username ต้องดึงจาก localStorage หรือ API
        // ตอนนี้แสดงเป็น "Admin" ก่อน
        document.getElementById('usernameDisplay').textContent = 'Admin ' + adminUser;
    }

    await loadInventory(); // โหลดตารางรายการก่อน
    updateDashboardStats(); // เสร็จแล้วค่อยอัปเดตสรุป
});
