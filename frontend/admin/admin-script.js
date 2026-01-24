
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

        const listElement = document.getElementById('inventory-list');
        listElement.innerHTML = '';

        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                // แปลงค่าประเภทอุปกรณ์จาก ID
                const categoryDisplay = item.category_display_name || 'ไม่ระบุ';
                
                
                const fullImageUrl = item.image_url
                    ? `http://localhost:5000/uploads/${item.image_url}`
                    : 'https://via.placeholder.com/50';

                // จัดลำดับคอลัมน์ให้ตรงกับ <thead> ใน HTML
                listElement.innerHTML += `
                    <tr>
                        <td class="text-center">
                            <img src="${fullImageUrl}" class="rounded border" width="50" height="50" style="object-fit: contain;">
                        </td>
                        <td><strong>${item.item_name}</strong></td>
                        <td><code>${item.serial_number || item.asset_number || '-'}</code></td>
                        
                        <td><span class="text-muted">${categoryDisplay}</span></td>
                        
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
            listElement.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-muted">ไม่พบข้อมูลอุปกรณ์</td></tr>';
        }

        // อัปเดต Dashboard
        if (data.pagination && document.getElementById('total-items')) {
            document.getElementById('total-items').innerText = data.pagination.totalItems;
        }

    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

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

async function editItem(id) {
    try {
        const response = await fetch(`http://localhost:5000/item/${id}`); // แก้ URL ให้ตรงกับ API ของคุณ
        const item = await response.json();

        // ใส่ข้อมูลลงในฟอร์ม
        document.getElementById('edit_item_id').value = item.item_id;
        document.getElementById('item_name').value = item.item_name;
        document.getElementById('cat_id').value = item.cat_id || "";
        document.getElementById('asset_number').value = item.asset_number;
        document.getElementById('serial_number').value = item.serial_number;
        document.getElementById('contract_number').value = item.contract_number;
        document.getElementById('status').value = item.status;

        // 🖼️ แสดงรูปภาพปัจจุบันใน Modal
        const previewImg = document.getElementById('preview');
        if (item.image_url) {
            previewImg.src = `http://localhost:5000/uploads/${item.image_url}`;
        } else {
            previewImg.src = "https://via.placeholder.com/150";
        }

        // เปลี่ยนหัวข้อ Modal และสั่งเปิด
        document.getElementById('modalTitle').innerText = "แก้ไขข้อมูลอุปกรณ์";
        new bootstrap.Modal(document.getElementById('itemModal')).show();
    } catch (error) {
        console.error("Error loading item for edit:", error);
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
