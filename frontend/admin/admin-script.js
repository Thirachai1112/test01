let currentInventory = [];
let currentPage = 1;


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

        if (data.pagination) {
            // ถ้าระบบส่งค่าสรุปมากับ pagination ให้ใช้ค่านั้น
            document.getElementById('total-items').innerText = data.pagination.totalItems || 0;

            // หรือถ้านับจากรายการที่มีอยู่ในหน้าปัจจุบัน (แบบชั่วคราว)
            const availableCount = currentInventory.filter(i => i.status === 'Available').length;
            const borrowedCount = currentInventory.filter(i => i.status === 'Borrowed').length;

            document.getElementById('total-available').innerText = availableCount;
            document.getElementById('total-borrowed').innerText = borrowedCount;
        }

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
                        <td><code>${item.serial_number || item.asset_number || '-'}</code></td>
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
        }
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

async function deleteItem(itemId) {
    // ใช้ SweetAlert2 สร้างกล่องยืนยันที่สวยงาม
    const result = await Swal.fire({
        title: 'ยืนยันการลบ?',
        text: "คุณจะไม่สามารถกู้คืนข้อมูลอุปกรณ์ชิ้นนี้ได้!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, ลบเลย!',
        cancelButtonText: 'ยกเลิก'
    });

    // ถ้าผู้ใช้กด "ใช่, ลบเลย!"
    if (result.isConfirmed) {
        try {
            // แสดง Loading ขณะกำลังลบ
            Swal.fire({
                title: 'กำลังดำเนินการ...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            // ตรวจสอบตัวพิมพ์ใหญ่-เล็กของ itemId ให้ตรงกับชื่อที่รับมา
            const response = await fetch(`http://localhost:5000/delete-item/${itemId}`, {
                method: 'DELETE'
            });

            const resData = await response.json();

            if (response.ok) {
                // แจ้งเตือนสำเร็จสวยๆ
                await Swal.fire({
                    icon: 'success',
                    title: 'ลบสำเร็จ!',
                    text: resData.message,
                    timer: 1500,
                    showConfirmButton: false
                });
                // location.reload(); 

            } else {

                // แจ้งเตือนกรณีลบไม่ได้ (เช่น ติดยืมอยู่)
                Swal.fire({
                    icon: 'error',
                    title: 'ลบไม่สำเร็จ',
                    text: resData.error || 'เกิดข้อผิดพลาดบางอย่าง'
                });

            }
            if (typeof loadInventory === 'function') {
                loadInventory();
            }
        } catch (error) {
            console.error("Delete error:", error);
            Swal.fire({
                icon: 'error',
                title: 'ผิดพลาด',
                text: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้'
            });
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
async function saveItem() {
    const formData = new FormData();

    // ตรวจสอบว่า ID เหล่านี้มีอยู่ในหน้า HTML Modal ของคุณจริงๆ
    formData.append('item_name', document.getElementById('item_name').value);
    formData.append('cat_id', document.getElementById('cat_id').value || '');
    formData.append('asset_number', document.getElementById('asset_number').value);
    formData.append('serial_number', document.getElementById('serial_number').value);
    formData.append('it', document.getElementById('serial_number').value);
    formData.append('contract_number', document.getElementById('contract_number').value);
    formData.append('status', document.getElementById('status').value);

    const imageFile = document.getElementById('imageInput').files[0];
    if (imageFile) formData.append('image', imageFile);

    try {
        const response = await fetch('http://localhost:5000/add-item', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            alert("บันทึกสำเร็จ!");
            location.reload(); // รีโหลดหน้าเพื่อดูข้อมูลใหม่ที่เพิ่มเข้ามา
        } else {
            const errData = await response.json();
            alert("บันทึกไม่สำเร็จ: " + errData.error);
        }
    } catch (error) {
        console.error("Fetch error:", error);
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

document.addEventListener('DOMContentLoaded', loadInventory);
