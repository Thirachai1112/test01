async function handleFinishAndGeneratePDF(apiData) {
    const { value: formValues } = await Swal.fire({
        title: 'บันทึกรายละเอียดรายงาน',
        html: `
            <style>
                .swal-container {
                    display: grid;
                    grid-template-columns: 180px 1fr;
                    gap: 12px;
                    align-items: center;
                    text-align: left;
                    font-family: 'Sarabun', sans-serif;
                    padding: 10px;
                }
                .swal-container label { font-weight: bold; font-size: 15px; color: #333; }
                .swal-container input, .swal-container select {
                    width: 100% !important;
                    height: 38px !important;
                    margin: 0 !important;
                    font-size: 15px !important;
                    border: 1px solid #ccc !important;
                    border-radius: 4px !important;
                }
            </style>
            <div class="swal-container">
                <label>1. อนุมัติเลขที่:</label> <input id="swal-input-approve" class="swal2-input" placeholder="เช่น 420/2569">
                <label>2. วันที่อนุมัติ:</label> <input id="swal-input-date" class="swal2-input" placeholder="เช่น 19 ก.พ. 2569">
                <label>3. วงเงินเบิกจ่าย (บาท):</label> <input id="swal-input-payment" class="swal2-input">
                
                <label>4. ผู้ตรวจรับ:</label>
                <select id="swal-input-inspector" class="swal2-input">
                    <option value="" disabled selected>เลือกผู้ตรวจรับ</option>
                    <option>(นายวีรภัทร ทวิศักดิ์)</option>
                    <option>(นายธนทัต บูระพันธ์)</option>
                    <option>(น.ส.ธนาภา สอนสวาท)</option>
                    <option>(นายกฤติเดช เกษอาสา)</option>
                    <option>(นายสุทธิศักดิ์ สรรพสาร)</option>
                </select>

                <label>5. ตำแหน่ง:</label>
                <select id="swal-input-position" class="swal2-input">
                    <option value="" disabled selected>เลือกตำแหน่ง</option>
                    <option>นรค.5 ผคข.กดส.ฉ.2</option>
                    <option>นรค.6 ผคข.กดส.ฉ.2</option>
                    <option>นรค.7 ผคข.กดส.ฉ.2</option>
                    <option>พคค.6 ผคข.กดส.ฉ.2</option>
                    <option>ชผ. ผคข.กดส.ฉ.2</option>
                    <option>หผ. ผคข.กดส.ฉ.2</option>
                </select>

                <label>6. เหตุผลการจ้าง:</label> <input id="swal-input-reason" class="swal2-input">
                <label>7. จำนวน:</label> <input id="swal-input-quantity" class="swal2-input" value="1">
                <label>8. เงินไม่รวม VAT:</label> <input id="swal-input-amount" type="number" class="swal2-input" placeholder="0.00">
                <label>9. VAT 7%:</label> <input id="swal-input-vat" class="swal2-input" readonly style="background: #f4f4f4">
                <label>10. ยอดรวม:</label> <input id="swal-input-total" class="swal2-input" readonly style="background: #f4f4f4">
                <label>11. ยอดตัวอักษร:</label> <input id="swal-input-total-text" class="swal2-input">
            </div>`,
        didOpen: () => {
            const amountInput = document.getElementById('swal-input-amount');
            const vatInput = document.getElementById('swal-input-vat');
            const totalInput = document.getElementById('swal-input-total');

            amountInput.addEventListener('input', () => {
                let amt = parseFloat(amountInput.value) || 0;
                let vat = amt * 0.07;
                let total = amt + vat;
                vatInput.value = vat.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                totalInput.value = total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            });
        },
        preConfirm: () => {
            return {
                approveId: document.getElementById('swal-input-approve').value,
                date: document.getElementById('swal-input-date').value,
                paymentDetails: document.getElementById('swal-input-payment').value,
                inspector: document.getElementById('swal-input-inspector').value,
                position: document.getElementById('swal-input-position').value,
                reason: document.getElementById('swal-input-reason').value,
                quantity: document.getElementById('swal-input-quantity').value,
                amount: document.getElementById('swal-input-amount').value,
                vat: document.getElementById('swal-input-vat').value,
                total: document.getElementById('swal-input-total').value,
                totalText: document.getElementById('swal-input-total-text').value
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
    
    if (typeof font === 'undefined') {
        Swal.fire('Error', 'ไม่พบข้อมูลฟอนต์ในระบบ', 'error');
        return;
    }

    doc.addFileToVFS("THSarabun-Bold.ttf", font);
    doc.addFont("THSarabun-Bold.ttf", "THSarabun", "bold");
    doc.setFont("THSarabun", "bold");

    let yPos = 10;

    // ===== HEADER =====
    doc.setFontSize(18);
    doc.text("การไฟฟ้าส่วนภูมิภาค", 105, yPos, { align: 'center' });
    
    yPos += 7;
    doc.setFontSize(13);
    doc.text("รายงานขอซื้อ/ขอจ้าง และอนุมัติดำเนินการสั่งจ้าง", 105, yPos, { align: 'center' });
    
    yPos += 5;
    doc.setFontSize(11);
    doc.text("เลขที่ ฉ.2กดส.(ผคข.)                 /2569", 105, yPos, { align: 'center' });
    yPos += 5;
    doc.text("ปีงบประมาณ 2568", 105, yPos, { align: 'center' });
    
    yPos += 12;

    // ===== MAIN TABLE (2 COLUMNS) =====
    doc.autoTable({
        startY: yPos,
        body: [[
            // LEFT COLUMN
            `เรียน หผ.คข.กดส.ฉ.2

ด้วย ผคข.กดส.ฉ.2 มีความประสงค์ขอซื้อ/ขอจ้าง ดำเนินการ ดังนี้

1. ค่าซ่อมเครื่อง ${apiData.brand || 'HPE PRODESSK 600 G2 MT'}
   สัญญาเลขที่ ${apiData.contract_number || '-'}
   Serial Number ${apiData.serial_number || '-'}
   อาการ: ${apiData.problem || '-'}

2. เบิกจ่ายจากรหัสบัญชี 53051060 ศูนย์ต้นทุน
   E301023000 วงเงิน ${formValues.paymentDetails || '0.00'} บาท
   (ราคารวมภาษีมูลค่าเพิ่ม)`,

            // RIGHT COLUMN
            `เรียน อก.ดส.ฉ.2

เพื่อโปรดเห็นชอบรายงานขอ
จัดซื้อ/จัดจ้าง ดำเนินการตาม
รายการดังกล่าวข้างต้น ต่อไป



                    ......................................
                    (นายวีรภัทร ทวิศักดิ์)
                    บรค.5 ผคข.กดส.ฉ.2
                    วันที่ .........................`
        ]],
        didParseCell: (data) => {
            data.cell.halign = 'left';
            data.cell.valign = 'top';
        },
        styles: { 
            font: 'THSarabun', 
            fontSize: 11, 
            lineColor: [0, 0, 0], 
            lineWidth: 0.5, 
            cellPadding: 5, 
            valign: 'top' 
        },
        columnStyles: { 
            0: { cellWidth: 95 }, 
            1: { cellWidth: 95 } 
        },
        rowStyles: { 0: { minCellHeight: 85 } },
        theme: 'grid'
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // ===== MONEY DETAILS SECTION =====
    doc.setFont("THSarabun", "bold");
    doc.setFontSize(11);
    doc.text("เรียน อก.ดส.ฉ.2", 15, yPos);
    
    yPos += 6;
    doc.setFont("THSarabun", "normal");
    doc.setFontSize(10);
    const reasonText = `ด้วย ผคข.กดส.ฉ.2 มีความประสงค์ขอซื้อ/ขอจ้าง ${formValues.reason || 'ค่าซ่อม'} ซึ่งดำเนินการแล้ว ปรากฏว่ามีค่าใช้จ่าย ตามรายการ ดังต่อไปนี้`;
    const splitReason = doc.splitTextToSize(reasonText, 180);
    doc.text(splitReason, 15, yPos);
    yPos += (splitReason.length * 4) + 4;

    // Item line
    doc.setFontSize(10);
    doc.text(`1. ค่าซ่อม ${apiData.brand || '-'} จำนวน ${formValues.quantity || '1'} เครื่อง`, 20, yPos);
    yPos += 5;

    // Money detail table
    const xLeft = 75;
    const xAmount = 165;
    const xBaht = 190;

    doc.text("( ราคาต่อหน่วย " + (formValues.amount || '0.00') + " บาท ไม่รวมภาษี )", 20, yPos);
    doc.text("เป็นเงิน", xLeft, yPos);
    doc.text(formValues.amount || '0.00', xAmount, yPos, { align: 'right' });
    doc.text("บาท", xBaht, yPos);

    yPos += 5;
    doc.text("มูลค่าเพิ่ม");
    doc.text("vat 7% เป็นเงิน", xLeft, yPos);
    doc.text(formValues.vat || '0.00', xAmount, yPos, { align: 'right' });
    doc.text("บาท", xBaht, yPos);

    yPos += 5;
    doc.setFont("THSarabun", "bold");
    doc.text("รวมเป็นเงิน", xLeft, yPos);
    doc.text(formValues.total || '0.00', xAmount, yPos, { align: 'right' });
    doc.text("บาท", xBaht, yPos);

    yPos += 8;
    doc.setFont("THSarabun", "normal");
    const finalText = `จึงเรียนมาเพื่อโปรดลงนามอนุมัติจ่ายเงินในใบสำคัญจ่ายเงินหมุนเวียนที่แนบมาพร้อมนี้จำนวน 1 ฉบับ
รวมเป็นเงิน ${formValues.total || '0.00'} บาท (${formValues.totalText || '-'}) ต่อไปด้วย`;
    const splitFinal = doc.splitTextToSize(finalText, 180);
    doc.text(splitFinal, 15, yPos);

    yPos += (splitFinal.length * 4) + 12;

    // Signature
    const sigX = 105;
    doc.setFontSize(10);
    doc.text("......................................", sigX, yPos, { align: 'center' });
    yPos += 5;
    doc.text("( นายสุทธิศักดิ์ สรรพสาร )", sigX, yPos, { align: 'center' });
    yPos += 5;
    doc.text("หผ.คข.กดส.ฉ.2", sigX, yPos, { align: 'center' });
    yPos += 5;
    doc.text("วันที่ .............................", sigX, yPos, { align: 'center' });

    // ===== UPLOAD TO SERVER =====
    const pdfBlob = doc.output('blob');
    const fileName = `report_${apiData.repair_id}_${Date.now()}.pdf`;
    const formData = new FormData();
    formData.append('report_file', pdfBlob, fileName);

    try {
        if (typeof API_BASE === 'undefined') {
            throw new Error('API_BASE is not defined');
        }

        console.log("Uploading to:", `${API_BASE}/api/upload-report`);
        
        const uploadRes = await fetch(`${API_BASE}/api/upload-report`, {
            method: 'POST',
            body: formData
        });

        if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            throw new Error(`Upload failed: ${uploadRes.status} - ${errorText}`);
        }

        const uploadResult = await uploadRes.json();

        if (uploadResult.success) {
            const updateRes = await fetch(`${API_BASE}/api/repair/status/${apiData.repair_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'Fixed',
                    item_id: apiData.item_id,
                    procedure: apiData.Procedure,
                    report_url: uploadResult.file_name
                })
            });

            if (updateRes.ok) {
                Swal.fire('สำเร็จ!', 'บันทึกข้อมูลและรายงานเรียบร้อยแล้ว', 'success');
                doc.save(fileName);
                if (typeof loadRepairData === 'function') loadRepairData();
            }
        }
    } catch (err) {
        console.error("Upload Error:", err);
        Swal.fire('Error', `ไม่สามารถเชื่อมต่อ Server\n\nDetails: ${err.message}`, 'error');
    }
}
