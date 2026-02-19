 let currentItemData = null;
        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('id');
        const SERVER_IP = window.location.hostname;

async function submitRepairForm(event) {
    event.preventDefault(); // ป้องกันการรีโหลดหน้าจอทันที

    const form = event.target;
    const formData = new FormData(form); // ใช้ FormData ดึงค่าจากฟอร์มทั้งหมด

    try {
        const SERVER_IP = window.location.hostname;
        const response = await fetch(`http://${SERVER_IP}:5000/api/repair`, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            // ใช้ SweetAlert2 แสดงป็อปอัพแจ้งเตือน
            Swal.fire({
                icon: 'success',
                title: 'ส่งข้อมูลสำเร็จ!',
                text: 'ระบบได้รับข้อมูลการแจ้งซ่อมเรียบร้อยแล้ว',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#3085d6'
            }).then((result) => {
                if (result.isConfirmed) {
                    // รีเซ็ตหน้าจอ (ล้างข้อมูลในฟอร์ม)
                    form.reset();
                    // หรือถ้าต้องการ Refresh หน้าใหม่ทั้งหมดให้ใช้:
                    window.location.reload();
                }
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: result.message || 'ไม่สามารถบันทึกข้อมูลได้',
            });
        }
    } catch (err) {
        console.error(err);
        Swal.fire({
            icon: 'error',
            title: 'เชื่อมต่อล้มเหลว',
            text: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง',
        });
    }
}

  