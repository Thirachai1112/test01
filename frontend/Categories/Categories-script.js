const API_BASE = window.location.origin;
let allItems = [];
let filteredItems = [];
let currentFilter = 'all';

// Load items on page load
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    setupEventListeners();
});

async function loadItems() {
    try {
        const response = await fetch(`${API_BASE}/items?page=1&limit=999`);
        const data = await response.json();
        allItems = data.items || [];
        filteredItems = [...allItems];
        displayItems(filteredItems);
        updateStats(allItems);
    } catch (error) {
        console.error('Error loading items:', error);
        document.getElementById('itemsContainer').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>ไม่สามารถโหลดข้อมูลได้</h3>
                <p>กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง</p>
            </div>
        `;
    }
}

function displayItems(items) {
    const container = document.getElementById('itemsContainer');
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>ไม่พบอุปกรณ์</h3>
                <p>ไม่มีอุปกรณ์ที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    container.className = 'items-grid';

    items.forEach(item => {
        const card = createItemCard(item);
        container.appendChild(card);
    });
}

function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.onclick = () => showItemDetails(item);

    const imageUrl = item.image_url 
        ? `${API_BASE}/uploads/${item.image_url}`
        : `${API_BASE}/no-image.svg`;

    const statusClass = {
        'Available': 'status-available',
        'Borrowed': 'status-borrowed'
    }[item.status] || 'status-available';

    const statusText = {
        'Available': 'ว่าง',
        'Borrowed': 'กำลังยืม'
    }[item.status] || item.status;

    card.innerHTML = `
        <img src="${imageUrl}" alt="${item.item_name}" class="item-image" onerror="this.src='${API_BASE}/no-image.svg'">
        <div class="item-content">
            <div class="category-badge">${item.cat_name || 'ไม่ระบุหมวดหมู่'}</div>
            <div class="item-title">${item.item_name}</div>
            <div class="item-details">
                <div class="item-detail-row">
                    <i class="fas fa-barcode"></i>
                    <span>S/N: ${item.serial_number || '-'}</span>
                </div>
                <div class="item-detail-row">
                    <i class="fas fa-hashtag"></i>
                    <span>Asset: ${item.asset_number || '-'}</span>
                </div>
                <div class="item-detail-row">
                    <i class="fas fa-file-contract"></i>
                    <span>Contract: ${item.contract_number || '-'}</span>
                </div>
            </div>
            <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
    `;

    return card;
}

function showItemDetails(item) {
    const modal = document.getElementById('itemModal');
    const modalBody = document.getElementById('modalBody');
    document.getElementById('modalTitle').textContent = item.item_name;

    const imageUrl = item.image_url 
        ? `${API_BASE}/uploads/${item.image_url}`
        : `${API_BASE}/no-image.svg`;

    const statusClass = {
        'Available': 'status-available',
        'Borrowed': 'status-borrowed'
    }[item.status] || 'status-available';

    const statusText = {
        'Available': 'ว่าง',
        'Borrowed': 'กำลังยืม'
    }[item.status] || item.status;

    modalBody.innerHTML = `
        <img src="${imageUrl}" alt="${item.item_name}" class="modal-image" onerror="this.src='${API_BASE}/no-image.svg'">
        <div class="modal-details">
            <div class="modal-detail-row">
                <div class="modal-detail-label">ชื่ออุปกรณ์:</div>
                <div class="modal-detail-value">${item.item_name}</div>
            </div>
            <div class="modal-detail-row">
                <div class="modal-detail-label">หมวดหมู่:</div>
                <div class="modal-detail-value">${item.item_type || '-'}</div>
            </div>
            <div class="modal-detail-row">
                <div class="modal-detail-label">Serial Number:</div>
                <div class="modal-detail-value"><code>${item.serial_number || '-'}</code></div>
            </div>
            <div class="modal-detail-row">
                <div class="modal-detail-label">หมายเลขครัพย์สิน:</div>
                <div class="modal-detail-value">${item.asset_number || '-'}</div>
            </div>
            <div class="modal-detail-row">
                <div class="modal-detail-label">เลขสัญญา:</div>
                <div class="modal-detail-value">${item.contract_number || '-'}</div>
            </div>
            <div class="modal-detail-row">
                <div class="modal-detail-label">สถานะ:</div>
                <div class="modal-detail-value">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
            </div>
            <div class="modal-detail-row">
                <div class="modal-detail-label">Item ID:</div>
                <div class="modal-detail-value">#${item.item_id}</div>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

function setupEventListeners() {
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterItems(e.target.value, currentFilter);
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.status;
            const searchValue = document.getElementById('searchInput').value;
            filterItems(searchValue, currentFilter);
        });
    });

    // Modal close
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('itemModal').style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('itemModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function filterItems(searchTerm, status) {
    let filtered = [...allItems];

    // Filter by status
    if (status !== 'all') {
        filtered = filtered.filter(item => item.status === status);
    }

    // Filter by search term
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(item => 
            item.item_name?.toLowerCase().includes(term) ||
            item.serial_number?.toLowerCase().includes(term) ||
            item.asset_number?.toLowerCase().includes(term) ||
            item.contract_number?.toLowerCase().includes(term) ||
            item.cat_name?.toLowerCase().includes(term)
        );
    }

    filteredItems = filtered;
    displayItems(filtered);
}

function updateStats(items) {
    document.getElementById('totalCount').textContent = items.length;
    document.getElementById('availableCount').textContent = 
        items.filter(i => i.status === 'Available').length;
    document.getElementById('borrowedCount').textContent = 
        items.filter(i => i.status === 'Borrowed').length;
}
