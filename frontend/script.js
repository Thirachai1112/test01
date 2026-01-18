const API_URL = 'http://localhost:3000';

// ฟังก์ชันดึงข้อมูลจาก Backend
async function fetchItems() {
    try {
        const response = await fetch(`${API_URL}/items`);
        const items = await response.json();
        displayItems(items);
    } catch (error) {
        console.error('Error fetching items:', error);
    }
}

// ฟังก์ชันสร้างการ์ดอุปกรณ์
function displayItems(items) {
    const container = document.getElementById('itemContainer');
    container.innerHTML = ''; // ล้างข้อมูลเก่า

    items.forEach(item => {
        const imageUrl = item.image_url.startsWith('http')
            ? item.image_url
            : `${API_URL}/uploads/${item.image_url}`;

        const cardHtml = `
            <div class="col-md-4 mb-4">
                <div class="card h-100 shadow-sm">
                    <img src="${imageUrl}" class="card-img-top p-3" alt="Device Image" style="height: 200px; object-fit: contain;">
                    <div class="card-body">
                        <h5 class="card-title">${item.item_name}</h5>
                        <p class="card-text text-muted mb-1">ประเภท: ${item.cat_name || 'ไม่ระบุ'}</p>
                        <p class="card-text small mb-0">Asset: ${item.asset_number || '-'}</p>
                        <p class="card-text small">Serial: ${item.serial_number || '-'}</p>
                        <span class="badge ${item.status === 'available' ? 'bg-success' : 'bg-danger'}">
                            ${item.status === 'available' ? 'ว่าง' : 'ถูกยืม'}
                        </span>
                    </div>
                    <div class="card-footer bg-white border-top-0">
                        <button class="btn btn-outline-primary w-100" onclick="borrowItem(${item.item_id})">
                            ทำรายการยืม
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += cardHtml;
    });
}

// เรียกใช้งานเมื่อโหลดหน้าเว็บ
fetchItems();