let allDevices = [];
let filteredDevices = [];
let currentPage = 1;
const itemsPerPage = 100;

// Load all devices on page load
async function loadAllDevices() {
    try {
        const response = await fetch(`${CONFIG.API_BASE}/items?page=1&limit=999`);
        const data = await response.json();
        allDevices = data.items || [];
        filteredDevices = allDevices;
        
        // Update total count
        const countElement = document.getElementById('total-count');
        if (countElement) {
            countElement.textContent = allDevices.length;
        }
        
        displayAllDevices(filteredDevices);
    } catch (error) {
        console.error('Error loading devices:', error);
        alert('ไม่สามารถโหลดข้อมูลอุปกรณ์');
    }
}

// Search devices by filtering local array
function searchAllDevices() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    if (searchTerm === '') {
        filteredDevices = allDevices;
    } else {
        filteredDevices = allDevices.filter(item => {
            const searchableText = `
                ${item.item_name || ''} 
                ${item.contract_number || ''} 
                ${item.asset_number || ''} 
                ${item.serial_number || ''} 
                ${item.status || ''}
                ${item.category_display_name || ''}
            `.toLowerCase();
            return searchableText.includes(searchTerm);
        });
    }
    
    currentPage = 1;
    displayAllDevices(filteredDevices);
}

// Display devices in table
function displayAllDevices(items) {
    const listElement = document.getElementById('inventory-list');
    listElement.innerHTML = '';

    if (items.length === 0) {
        listElement.innerHTML = '<tr><td colspan="9" class="text-center text-muted">ไม่พบข้อมูล</td></tr>';
        return;
    }

    // Pagination
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const offset = (currentPage - 1) * itemsPerPage;
    const pageItems = items.slice(offset, offset + itemsPerPage);

    pageItems.forEach(item => {
        const fullImageUrl = item.image_url
            ? `${CONFIG.API_BASE}/uploads/${item.image_url}`
            : 'https://via.placeholder.com/50';

        const qrUrl = `${CONFIG.API_BASE}/qrcodes/qr_${item.item_id}.png`;

        const statusBadgeClass = item.status === 'Available' ? 'bg-success' : 
                               item.status === 'Borrowed' ? 'bg-warning text-dark' :
                               item.status === 'Maintenance' ? 'bg-danger' :
                               'bg-secondary';

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
                    <span class="badge ${statusBadgeClass}">
                        ${item.status || 'N/A'}
                    </span>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-dark" onclick="showQR('${qrUrl}', '${item.item_name.replace(/'/g, "\\'")}')">
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
            </tr>
        `;
    });

    // Render pagination
    renderPagination(totalPages);
}

// Render pagination
function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    // Previous button
    const prevBtn = document.createElement('li');
    prevBtn.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="goToPage(${currentPage - 1})">ก่อนหน้า</a>`;
    paginationContainer.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('li');
        pageBtn.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageBtn.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="goToPage(${i})">${i}</a>`;
        paginationContainer.appendChild(pageBtn);
    }

    // Next button
    const nextBtn = document.createElement('li');
    nextBtn.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="goToPage(${currentPage + 1})">ถัดไป</a>`;
    paginationContainer.appendChild(nextBtn);
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayAllDevices(filteredDevices);
    }
}

// Show QR modal
function showQR(qrUrl, itemName) {
    const qrImage = document.getElementById('qrDisplayImage');
    const downloadBtn = document.getElementById('qrDownloadBtn');

    qrImage.src = qrUrl;
    downloadBtn.href = qrUrl;
    downloadBtn.download = `QR_${itemName}.png`;

    const qrModal = new bootstrap.Modal(document.getElementById('qrModal'));
    qrModal.show();
}

// Edit item
async function editItem(itemId) {
    const item = allDevices.find(i => i.item_id === itemId);
    if (!item) return;

    document.getElementById('edit_item_id').value = itemId;
    document.getElementById('edit_item_name').value = item.item_name;
    document.getElementById('edit_cat_id').value = item.cat_id || 1;
    document.getElementById('edit_status').value = item.status;
    document.getElementById('edit_asset_number').value = item.asset_number || '';
    document.getElementById('edit_serial_number').value = item.serial_number || '';
    document.getElementById('edit_contract_number').value = item.contract_number || '';

    const imgUrl = item.image_url 
        ? `${CONFIG.API_BASE}/uploads/${item.image_url}` 
        : 'https://via.placeholder.com/150';
    document.getElementById('edit_preview').src = imgUrl;

    const editModal = new bootstrap.Modal(document.getElementById('editItemModal'));
    editModal.show();
}

function previewImageEdit(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('edit_preview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Update item
async function updateItem() {
    const itemId = document.getElementById('edit_item_id').value;
    const formData = new FormData();
    
    formData.append('item_id', itemId);
    formData.append('item_name', document.getElementById('edit_item_name').value);
    formData.append('cat_id', document.getElementById('edit_cat_id').value);
    formData.append('status', document.getElementById('edit_status').value);
    formData.append('asset_number', document.getElementById('edit_asset_number').value);
    formData.append('serial_number', document.getElementById('edit_serial_number').value);
    formData.append('contract_number', document.getElementById('edit_contract_number').value);

    const imageInput = document.getElementById('edit_imageInput');
    if (imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        const response = await fetch(`${CONFIG.API_BASE}/items/${itemId}`, {
            method: 'PUT',
            body: formData
        });

        if (response.ok) {
            Swal.fire('สำเร็จ', 'บันทึกการแก้ไขแล้ว', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editItemModal')).hide();
            loadAllDevices();
        } else {
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถบันทึกได้', 'error');
        }
    } catch (error) {
        console.error('Error updating item:', error);
        Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
}

// Delete item
async function deleteItem(itemId) {
    const result = await Swal.fire({
        title: 'ยืนยันการลบ?',
        text: "รายการนี้จะถูกลบออกจากระบบ",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก'
    });

    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`${CONFIG.API_BASE}/items/${itemId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            Swal.fire('สำเร็จ', 'ลบข้อมูลแล้ว', 'success');
            loadAllDevices();
        } else {
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถลบได้', 'error');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
}

// Load on page ready
document.addEventListener('DOMContentLoaded', function() {
    loadAllDevices();
});
