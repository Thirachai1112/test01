 let currentItemData = null;
        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('id');
        const SERVER_IP = window.location.hostname;

async function submitRepairForm(event) {
    event.preventDefault(); // ป้องกันการรีโหลดหน้าจอ

    const form = event.target;
    const formData = new FormData();

    // 1. ดึงข้อมูลจาก Input ทั่วไปใส่ FormData
    formData.append('item_id', form.item_id.value);
    formData.append('employee_name', form.employee_name.value);
    formData.append('employees_code', form.employees_code.value);
    formData.append('affiliation', form.affiliation.value);
    formData.append('phone_number', form.phone_number.value);
    formData.append('problem', form.problem.value);

    // 2. ดึงไฟล์จาก Input (กรณีเลือกหลายไฟล์)
    const fileInput = form.querySelector('input[type="file"]');
    for (let i = 0; i < fileInput.files.length; i++) {
        // ชื่อฟิลด์ 'files' ต้องตรงกับ upload.array('files', 5) ใน Backend
        formData.append('files', fileInput.files[i]); 
    }

    try {
        // 3. ส่งข้อมูลไปที่ Backend API
        const response = await fetch(`http://${SERVER_IP}:5000/api/repair`, {
            method: 'POST',
            body: formData, // ไม่ต้องตั้ง Header Content-Type เอง Browser จะจัดการให้พร้อม Boundary
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ แจ้งซ่อมสำเร็จ!');
            form.reset(); // ล้างข้อมูลในฟอร์ม
        } else {
            alert('❌ เกิดข้อผิดพลาด: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
}

// วิธีใช้งาน: นำไปผูกกับ Form ใน HTML
// <form onsubmit="submitRepairForm(event)"> ... </form>