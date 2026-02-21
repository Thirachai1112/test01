async function handleFinishAndGeneratePDF(apiData) {
    // 1. รับค่าที่ต้อง "กรอกเพิ่ม" (เลขที่อนุมัติ, วันที่, วงเงิน)
    const { value: formValues } = await Swal.fire({
        title: 'บันทึกรายละเอียดรายงาน',
        html: `
            <div style="text-align: left; font-family: 'Sarabun', sans-serif;">
                <label class="mb-1">1. อนุมัติเลขที่:</label>
                <input id="swal-input-approve" class="swal2-input" placeholder="เช่น 420/2569">
                
                <label class="mb-1">2. วันที่อนุมัติ:</label>
                <input id="swal-input-date" class="swal2-input" placeholder="เช่น 19 ก.พ. 2569">
                
                <label class="mb-1">3. วงเงินเบิกจ่าย (บาท):</label>
                <input id="swal-input-payment" class="swal2-input" placeholder="เช่น 5,000.00">
            </div>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'สร้าง PDF',
        preConfirm: () => {
            return {
                approveId: document.getElementById('swal-input-approve').value,
                date: document.getElementById('swal-input-date').value,
                paymentDetails: document.getElementById('swal-input-payment').value
            }
        }
    });

    if (formValues) {
        generateThaiPDF(formValues, apiData);
    }
}

async function generateThaiPDF(formValues, apiData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const centerSpace = " ".repeat(20);
    // 1. ตรวจสอบว่ามีตัวแปร font (จากไฟล์ THSarabun-Bold.js) หรือไม่
    if (typeof font === 'undefined') {
        Swal.fire('Error', 'ไม่พบข้อมูลฟอนต์ในระบบ (font variable not found)', 'error');
        return;
    }

    // ตั้งค่าฟอนต์
   doc.addFileToVFS("THSarabun-Bold.ttf", font); 
    doc.addFont("THSarabun-Bold.ttf", "THSarabun", "bold");
    doc.setFont("THSarabun", "bold");

    doc.setFontSize(20);
    doc.text("การไฟฟ้าส่วนภูมิภาค", 105, 15, { align: 'center' });
    doc.setFontSize(16);
    doc.text("รายงานขอซื้อ/ขอจ้าง และอนุมัติดำเนินการสั่งจ้าง", 105, 22, { align: 'center' });
    doc.setFontSize(16);
    doc.text("เลขที่ ฉ.2กดส.(ผคข.)                 /2569", 105, 29, { align: 'center' });
    

    const introText = 
`เรียน หผ.คข.กดส.ฉ.2
      ด้วย ผคข.กดส.ฉ.2 มีความประสงค์ขอซื้อ/ขอจ้าง ดำเนินการ โดยวิธีเฉพาะเจาะจงตามรายการ ดังนี้
1. ค่าซ่อมเครื่อง ${apiData.brand || '-'}  S/N ${apiData.serial_number || '-'} สัญญาเลขที่ ${apiData.contract_number || '-'} อาการ ((${apiData.problem || 'รอระบุอาการ'})) ตามอนุมัติเลขที่ ${formValues.approveId} ลงวันที่ ${formValues.date}
2. เบิกจ่ายจากรหัสบัญชี 53051060 ศูนย์ต้นทุน E301023000 วงเงิน ${formValues.paymentDetails} บาท (ราคารวมภาษีมูลค่าเพิ่ม) โดยมีคณะกรรมการตรวจรับตามคำสั่ง เลขที่ ฉ.2 กดส.(พ.)01/2569 ลงวันที่ 5 มกราคม 2569
เป็นผู้ตรวจรับการจัดซ่อม/จัดซจ้าง ในวาระนี้.- \n\n\n\n\n\n\n
${centerSpace}...................................
${centerSpace}...................................
${centerSpace}วันที่ ..........................
`
; 

    doc.autoTable({
        startY: 30,
        body: [
            [introText, ''], 
            ['', ''], 
            [`เบิกจ่ายจากรหัสบัญชี ${apiData.account_code || '-'} ศูนย์ต้นทุน ${apiData.cost_center || '-'} วงเงิน ${formValues.paymentDetails} บาท`, '']
        ],
        didParseCell: function (data) {
            if (data.column.index === 0 && data.row.index === 0) data.cell.rowSpan = 2;
            if (data.row.index === 2 && data.column.index === 0) {
                data.cell.colSpan = 2;
                data.cell.styles.halign = 'left';
            }
        },
        styles: { font: 'THSarabun', fontSize: 16, lineColor: [0, 0, 0], lineWidth: 0.1, cellPadding: 4 },
        columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 80 } },
        theme: 'grid'
    });

    // --- ส่วนการ Upload ไฟล์ขึ้น Server ---
    const pdfBlob = doc.output('blob'); // แปลง PDF เป็น Blob
    const fileName = `report_${apiData.repair_id}_${Date.now()}.pdf`;
    const formData = new FormData();
    formData.append('report_file', pdfBlob, fileName); // ชื่อ field ต้องตรงกับ multer 'report_file'

    try {
        // 1. ส่งไฟล์ไปเก็บที่ Server
        const uploadRes = await fetch(`${API_BASE}/api/upload-report`, {
            method: 'POST',
            body: formData
        });
        const uploadResult = await uploadRes.json();

        if (uploadResult.success) {
            // 2. อัปเดตชื่อไฟล์ลง Database (Column: report_url) และปิดงาน
            const updateRes = await fetch(`${API_BASE}/api/repair/status/${apiData.repair_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: 'Fixed', 
                    item_id: apiData.item_id,
                    procedure: apiData.Procedure, 
                    report_url: uploadResult.file_name // เก็บชื่อไฟล์จาก Server
                })
            });

            if (updateRes.ok) {
                Swal.fire('สำเร็จ!', 'บันทึกข้อมูลและรายงานเรียบร้อยแล้ว', 'success');
                doc.save(fileName); // โหลดไฟล์ลงเครื่องผู้ใช้ด้วยเป็นสำเนา
                if (typeof loadRepairData === 'function') loadRepairData(); 
            }
        }
    } catch (err) {
        console.error("Upload Error:", err);
        Swal.fire('Error', 'ไม่สามารถเชื่อมต่อ Server เพื่อบันทึกรายงานได้', 'error');
    }
}