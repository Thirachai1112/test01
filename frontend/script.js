const API_URL = 'http://localhost:5000'; // ปรับให้ตรงกับ Port ของ Backend
let currentSearch = ''; // ตัวแปรเก็บคำค้นหาปัจจุบัน
let currentPage = 1;
let selectedItemId = null;
let actionButton = '';
const itemsPerPage = 6;

// 1. ฟังก์ชันโหลดข้อมูล
async function fetchItems(page = 1) {
    try {
        const response = await fetch(`${API_URL}/items?page=${page}&limit=${itemsPerPage}&search=${currentSearch}`);
        const data = await response.json();

        // สำคัญมาก: ต้องส่ง data.items (ที่เป็น Array) เข้าไป
        // และชื่อฟังก์ชันต้องตรงกับข้างล่าง (displayItems)
        displayItems(data.items);

        // อัปเดตตัวเลขหน้า
        const pagination = data.pagination;
        document.getElementById('pageInfo').innerText = `หน้า ${pagination.currentPage} จาก ${pagination.totalPages}`;
        currentPage = pagination.currentPage;

        // จัดการเปิด-ปิดปุ่ม
        document.getElementById('prevPage').disabled = (currentPage === 1);
        document.getElementById('nextPage').disabled = (currentPage >= pagination.totalPages);
    } catch (error) {
        console.error("Error:", error);
    }
}

// 2. ฟังก์ชันสร้างการ์ดอุปกรณ์
function displayItems(items) {
    const container = document.getElementById('itemContainer');
    container.innerHTML = '';

    items.forEach(item => {
        let actionButton = ''; // ประกาศตัวแปรไว้ก่อน

        if (item.status === 'Available') {
            // ปุ่มตอนสถานะ "ว่าง"
            actionButton = `<button class="btn btn-outline-primary w-100" onclick="openBorrowModal('${item.item_id}')">ทำรายการยืม</button>`;
        } else {
            // ปุ่มตอนสถานะ "ถูกยืม" (เพิ่ม findLogAndReturn)
            actionButton = `
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="badge bg-danger">ถูกยืม</span>
                    <button class="btn btn-link btn-sm p-0 text-decoration-none text-warning" 
                        onclick="findLogAndReturn('${item.item_id}')">คืนของตรงนี้</button>
                </div>
                <button class="btn btn-outline-secondary w-100" disabled>ทำรายการยืม</button>
            `;
        }

        // จัดการเรื่อง Path รูปภาพ
        const imageUrl = item.image_url.startsWith('http')
            ? item.image_url
            : `${API_URL}/uploads/${item.image_url}`;

        const cardHtml = `
            <div class="col-md-4 mb-4">
                <div class="card h-100 shadow-sm border-0">
                    <img src="${imageUrl}" class="card-img-top p-3" alt="Device Image" style="height: 200px; object-fit: contain;">
                    <div class="card-body">
                        <h5 class="card-title text-primary">${item.item_name}</h5>
                        <p class="card-text text-muted mb-1">ประเภท: ${item.item_type || 'ไม่ระบุ'}</p>
                        <p class="card-text small mb-0">Asset: ${item.asset_number || '-'}</p>
                        <p class="card-text small mb-0">Serial: ${item.serial_number || '-'}</p>
                        
                        <p class="card-text mb-1" style="font-size: 0.9rem; color: #000000 !important;">
                            <b style="color: #000000;">เลขที่สัญญา:</b> 
                            <span style="color: #000000 !important; text-decoration: none;">
                                ${item.contract_number || 'ไม่มีข้อมูล'}
                            </span>
                        </p>
                    </div>
                    <div class="card-footer bg-white border-top-0">
                        ${actionButton}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += cardHtml;
    });
}

const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');

if (prevBtn && nextBtn) {
    prevBtn.onclick = () => {
        if (currentPage > 1) fetchItems(currentPage - 1);
    };

    nextBtn.onclick = () => {
        fetchItems(currentPage + 1);
    };
}
// 3. Event Listeners สำหรับปุ่มแบ่งหน้า
document.getElementById('prevPage').onclick = () => {
    if (currentPage > 1) fetchItems(currentPage - 1);
};

document.getElementById('nextPage').onclick = () => {
    fetchItems(currentPage + 1);
};


async function findLogAndReturn(itemId) {
    // 1. เปลี่ยนจาก confirm เป็น Swal.fire (แบบถามยืนยัน)
    const result = await Swal.fire({
        title: 'ยืนยันการคืนอุปกรณ์?',
        text: `คุณต้องการคืนอุปกรณ์ใช่หรือไม่?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ใช่, คืนอุปกรณ์!',
        cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
        try {
            // โชว์ Loading สั้นๆ ระหว่างดึงข้อมูล
            Swal.showLoading();

            // 2. ดึงข้อมูลประวัติการยืม
            const resList = await fetch('http://localhost:5000/borrowing-active');
            if (!resList.ok) throw new Error("ไม่สามารถเชื่อมต่อ API ได้");
            const activeBorrows = await resList.json();
            
            const borrowEntry = activeBorrows.find(log => log.item_id == itemId);

            if (!borrowEntry) {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่พบข้อมูล',
                    text: 'ไม่พบประวัติการยืมอุปกรณ์นี้ หรืออาจถูกคืนไปแล้ว'
                }).then(() => location.reload());
                return;
            }

            // 3. ส่งข้อมูลไปที่ Backend
            const resReturn = await fetch('http://localhost:5000/return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    log_id: borrowEntry.log_id, 
                    item_id: itemId 
                })
            });

            const responseData = await resReturn.json();

            if (resReturn.ok) {
                // แจ้งเตือนเมื่อสำเร็จแบบสวยงาม
                Swal.fire({
                    icon: 'success',
                    title: 'คืนอุปกรณ์สำเร็จ!',
                    text: responseData.message,
                    timer: 2000, // ปิดเองใน 2 วินาที
                    showConfirmButton: false
                }).then(() => {
                    location.reload();
                });
            } else {
                throw new Error(responseData.error || "เกิดข้อผิดพลาดในการคืน");
            }

        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: err.message
            });
        }
    }
}

// ฟังก์ชันนี้เรียกเมื่อมีการพิมพ์ในช่องค้นหา หรือกดปุ่มค้นหา
function handleSearch() {
    currentSearch = document.getElementById('searchInput').value;
    fetchItems(1); // ค้นหาใหม่ให้เริ่มหน้า 1 เสมอ
}

async function fetchItems(page = 1) {
    try {
        // ส่งคำค้นหาไปใน URL ด้วย
        const response = await fetch(`${API_URL}/items?page=${page}&limit=${itemsPerPage}&search=${currentSearch}`);
        const data = await response.json();

        displayItems(data.items);

        const pagination = data.pagination;
        document.getElementById('pageInfo').innerText = `หน้า ${pagination.currentPage} จาก ${pagination.totalPages}`;
        currentPage = pagination.currentPage;

        document.getElementById('prevPage').disabled = (currentPage === 1);
        document.getElementById('nextPage').disabled = (currentPage >= pagination.totalPages || pagination.totalPages === 0);
    } catch (error) {
        console.error("Error:", error);
    }
}

function openBorrowModal(itemId) {
    selectedItemId = itemId; // เก็บ ID อุปกรณ์ที่เลือก
    
    // ล้างข้อมูลเก่า
    const fields = ['first_name', 'last_name', 'employees_code', 'phone_number', 'affiliation'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const borrowModal = new bootstrap.Modal(document.getElementById('borrowModal'));
    borrowModal.show();
}

async function submitBorrow() {
    const fName = document.getElementById('first_name')?.value;
    const lName = document.getElementById('last_name')?.value;
    const eCode = document.getElementById('employees_code')?.value;
    const phone = document.getElementById('phone_number')?.value;
    const affil = document.getElementById('affiliation')?.value;

    // 1. ใช้ Swal แจ้งเตือนเมื่อกรอกข้อมูลไม่ครบ
    if (!fName || !eCode || !selectedItemId) {
        Swal.fire({
            icon: 'warning',
            title: 'ข้อมูลไม่ครบถ้วน',
            text: 'กรุณากรอกชื่อและรหัสพนักงานเป็นอย่างน้อย',
            confirmButtonColor: '#f8bb86'
        });
        return;
    }

    const data = {
        first_name: fName,
        last_name: lName,
        employees_code: eCode,
        phone_number: phone,
        affiliation: affil,
        item_id: selectedItemId,
        note: "ยืมผ่านระบบ"
    };

    try {
        // แสดง Loading ระหว่างส่งข้อมูล
        Swal.fire({
            title: 'กำลังบันทึกข้อมูล...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const res = await fetch('http://localhost:5000/borrow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();

        if (res.ok) {
            // 2. แจ้งเตือนเมื่อยืมสำเร็จ
            Swal.fire({
                icon: 'success',
                title: 'ยืมอุปกรณ์สำเร็จ!',
                text: result.message,
                confirmButtonColor: '#3085d6'
            }).then(() => {
                location.reload();
            });
        } else {
            // 3. แจ้งเตือนเมื่อ Backend ส่ง Error กลับมา
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: result.error || 'ไม่สามารถทำรายการได้'
            });
        }
    } catch (err) {
        // 4. แจ้งเตือนเมื่อเชื่อมต่อ Server ไม่ได้
        Swal.fire({
            icon: 'error',
            title: 'การเชื่อมต่อล้มเหลว',
            text: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง'
        });
    }
}


// 4. เริ่มทำงาน
fetchItems(1);