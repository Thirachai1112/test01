async function handleFinishAndGeneratePDF(apiData) {
    const { value: formValues } = await Swal.fire({
        title: 'บันทึกรายละเอียดรายงาน',
        html: `
            <style>
                .swal-form-grid {
                    display: grid;
                    grid-template-columns: 150px 1fr;
                    gap: 10px;
                    align-items: center;
                    text-align: left;
                    font-family: 'Sarabun', sans-serif;
                    font-size: 14px;
                }
                .swal-form-grid label { font-weight: bold; }
                .swal-form-grid input, .swal-form-grid select {
                    height: 35px !important;
                    margin: 0 !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                }
                .section-title {
                    grid-column: span 2;
                    background: #f0f0f0;
                    padding: 5px;
                    margin-top: 10px;
                    font-weight: bold;
                    border-radius: 4px;
                }
            </style>
            <div class="swal-form-grid">
                <label>1. อนุมัติเลขที่:</label> <input id="swal-input-approve" class="swal2-input" placeholder="420/2569">
                <label>2. วันที่อนุมัติ:</label> <input id="swal-input-date" class="swal2-input" placeholder="19 ก.พ. 2569">
                <label>3. วงเงิน (บาท):</label> <input id="swal-input-payment" class="swal2-input" placeholder="5,000.00">
                
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
                    <option>นรค.5.ผคข.กดส.ฉ.2</option> 
                    <option>นรค.6.ผคข.กดส.ฉ.2</option>
                    <option>นรค.7.ผคข.กดส.ฉ.2</option>
                    <option>พพค.6.ผคข.กดส.ฉ.2</option>
                    <option>ชผ.ผคข.กดส.ฉ.2</option>
                    <option>หผ.ผคข.กดส.ฉ.2</option> 
                </select>

                <div class="section-title">ข้อมูลการเงินเพิ่มเติม</div>
                
                <label>6. เหตุผลการจ้าง:</label> <input id="swal-input-reason" class="swal2-input">
                <label>7. จำนวนเครื่อง:</label> <input id="swal-input-quantity" class="swal2-input" type="number" value="1">
                <label>8. เงินไม่รวม VAT:</label> <input id="swal-input-amount" class="swal2-input" type="number" placeholder="0.00">
                <label>9. VAT 7%:</label> <input id="swal-input-vat" class="swal2-input" readonly style="background-color: #eee;">
                <label>10. ยอดรวม:</label> <input id="swal-input-total" class="swal2-input" readonly style="background-color: #eee;">
                <label>11. ยอดตัวอักษร:</label> <input id="swal-input-total-text" class="swal2-input" readonly style="background-color: #eee;">
            </div>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'สร้าง PDF',
        didOpen: () => {
            const amountInput = document.getElementById('swal-input-amount');
            const vatInput = document.getElementById('swal-input-vat');
            const totalInput = document.getElementById('swal-input-total');
            const totalTextInput = document.getElementById('swal-input-total-text');

            amountInput.addEventListener('input', () => {
                const amount = parseFloat(amountInput.value) || 0;
                const vat = amount * 0.07;
                const total = amount + vat;

                // แสดงผลแบบทศนิยม 2 ตำแหน่ง พร้อมคอมม่า
                vatInput.value = vat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                totalInput.value = total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                
                // แปลงเป็นตัวอักษรไทย
                totalTextInput.value = thaiBaht(total);
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

// ฟังก์ชันแปลงเลขเป็นตัวอักษรไทย (Bahttext)
function thaiBaht(number) {
    if (number === 0) return "ศูนย์บาทถ้วน";
    const numberStr = number.toFixed(2).split(".");
    const integerPart = numberStr[0];
    const decimalPart = numberStr[1];

    const units = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
    const digits = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];

    function convert(nums) {
        let text = "";
        for (let i = 0; i < nums.length; i++) {
            let digit = parseInt(nums[nums.length - 1 - i]);
            if (digit !== 0) {
                if (i % 6 === 1 && digit === 1) text = "เอ็ด" + text; // แก้ไขกรณี 11, 21...
                else if (i % 6 === 1 && digit === 2) text = "ยี่" + units[i % 6] + text;
                else if (i % 6 === 1 && digit === 1) text = "สิบ" + text;
                else if (i % 6 === 0 && i > 0 && digit === 1) text = "เอ็ด" + text;
                else text = digits[digit] + units[i % 6] + text;
            }
            if (i % 6 === 0 && i > 0) text = units[6] + text;
        }
        return text.replace("หนึ่งสิบ", "สิบ").replace("สองสิบ", "ยี่สิบ").replace("สิบหนึ่ง", "สิบเอ็ด");
    }

    let result = convert(integerPart) + "บาท";
    if (decimalPart === "00") {
        result += "ถ้วน";
    } else {
        result += convert(decimalPart) + "สตางค์";
    }
    return result;
}

async function generateThaiPDF(formValues, apiData) {
    const { jsPDF } = window.jspdf;
    // กำหนดขนาดเป็น A4 และหน่วยเป็น mm
    const doc = new jsPDF('p', 'mm', 'a4'); 
    
    // --- จัดการเรื่อง Font ---
    // ต้องมีทั้ง Bold และ Normal เพื่อป้องกัน Error ใน Log
    if (typeof font === 'undefined') {
        Swal.fire('Error', 'ไม่พบข้อมูลฟอนต์ในระบบ', 'error');
        return;
    }
    
    doc.addFileToVFS("THSarabun-Bold.ttf", font);
    doc.addFont("THSarabun-Bold.ttf", "THSarabun", "normal");
    doc.addFont("THSarabun-Bold.ttf", "THSarabun", "bold");
    
    doc.setFont("THSarabun", "bold");

    // ส่วนหัวกระดาษ
    doc.setFontSize(18);
    doc.text("การไฟฟ้าส่วนภูมิภาค", 105, 15, { align: 'center' });
    doc.setFontSize(15);
    doc.text("รายงานขอซื้อ/ขอจ้าง และอนุมัติดำเนินการสั่งซื้อ", 105, 22, { align: 'center' });
    doc.text(`เลขที่ ฉ.2กดส.(ผคข.)            /2569`, 105, 29, { align: 'center' });

    // เตรียมข้อมูลเนื้อหา
    const sigSpace = "\n\n\n\n";
    const introText1 = `เรียน หผ.คข.กดส.ฉ.2\n       ด้วย ผคข.กดส.ฉ.2 มีความประสงค์ขอซื้อ/ขอจ้าง...`; // ย่อตามฟอร์มจริง

    doc.autoTable({
        startY: 35,
        theme: 'grid',
        // ปรับ Margin เพื่อแก้ปัญหา "10 units width could not fit page"
        margin: { left: 15, right: 15 },
        body: [
            [/* แถวที่ 1: ส่วนบนซ้าย/ขวา */],
            [/* แถวที่ 2: ส่วนอนุมัติ */],
            [{ content: '', colSpan: 2, styles: { minCellHeight: 140 } }] // แถวที่ 3 ที่คุณต้องการ
        ],
        columnStyles: {
            0: { cellWidth: 90 }, // รวมกันได้ 180 (A4 กว้าง 210 - margin 30 = 180)
            1: { cellWidth: 90 }
        },
        styles: { 
            font: 'THSarabun', 
            fontStyle: 'normal', // ป้องกัน Error: Unable to look up font label
            fontSize: 14, 
            lineColor: [0, 0, 0], 
            lineWidth: 0.2,
            cellPadding: 3
        },
        didDrawCell: function (data) {
            // ปรับแต่งแถวที่ 3 (index 2)
            if (data.row.index === 2 && data.column.index === 0) {
                const ctx = data.cell;
                const centerX = ctx.x + (ctx.width / 2); // จุดกึ่งกลางเซลล์เป๊ะๆ
                let yPos = ctx.y + 10;

                doc.setFont("THSarabun", "normal");
                doc.text(`เรียน อก.ดย.ฉ.2`, ctx.x + 5, yPos);
                
                yPos += 8;
                const detail = `        ด้วย ผคข.กดส.ฉ.2 มีความประสงค์ขอซื้อ/ขอจ้าง ${formValues.reason || '-'} ซึ่งดำเนินการแล้ว ปรากฏว่ามีค่าใช้จ่ายตามรายการ ดังต่อไปนี้`;
                const splitDetail = doc.splitTextToSize(detail, ctx.width - 15);
                doc.text(splitDetail, ctx.x + 5, yPos);
                yPos += (splitDetail.length * 7);

                // ส่วนรายการเงิน (ตั้งกั้นหลังให้ตรงกันตามรูป)
                const xUnit = ctx.x + ctx.width - 10;
                const xNumber = xUnit - 5;
                const xLabel = xNumber - 40;

                doc.text(`1. ค่าซ่อม ${apiData.brand || '-'} จำนวน ${formValues.quantity || '1'} เครื่อง`, ctx.x + 15, yPos);
                doc.text("เป็นเงิน", xLabel, yPos);
                doc.text(parseFloat(formValues.amount || 0).toLocaleString(), xNumber, yPos, { align: 'right' });
                doc.text("บาท", xUnit, yPos);

                yPos += 7;
                doc.text("รวมเป็นเงิน", xLabel, yPos);
                doc.text(formValues.total || '0.00', xNumber, yPos, { align: 'right' });
                doc.text("บาท", xUnit, yPos);

                // --- ส่วนลายเซ็น (จัดกึ่งกลางตามเส้นสีแดง) ---
                yPos += 30; 
                doc.text(`.......................................................`, centerX, yPos, { align: 'center' });
                yPos += 8;
                doc.text(`( นายสุทธิศักดิ์ สรรพสาร )`, centerX, yPos, { align: 'center' });
                yPos += 7;
                doc.text(`หผ.คข.กดส.ฉ.2`, centerX, yPos, { align: 'center' });
                yPos += 7;
                doc.text(`วันที่ .......................................................`, centerX, yPos, { align: 'center' });
            }
        }
    });

    // ส่วนการบันทึก/Upload
    const pdfBlob = doc.output('blob');
    const fileName = `report_${apiData.repair_id}_${Date.now()}.pdf`;
    const formData = new FormData();
    formData.append('report_file', pdfBlob, fileName);

    try {
        if (typeof API_BASE === 'undefined') {
            throw new Error('API_BASE is not defined. Check if status_repair.html has it defined.');
        }

        console.log("Attempting to upload to:", `${API_BASE}/api/upload-report`);
        
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
        console.error("Error details:", {
            message: err.message,
            api_base: typeof API_BASE !== 'undefined' ? API_BASE : 'NOT DEFINED',
            repair_id: apiData.repair_id
        });
        Swal.fire('Error', `ไม่สามารถเชื่อมต่อ Server เพื่อบันทึกรายงานได้\n\nDetails: ${err.message}`, 'error');
    }
}
async function generateThaiPDF(formValues, apiData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const centerSpace = ' '.repeat(25); // ใช้สำหรับเว้นวรรคตรงกลางใน introText2

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
    doc.text("เลขที่ ฉ.2กดส.(ผคข.)                 /2569", 105, 29, { align: 'center' });


    const introText = `เรียน หผ.คข.กดส.ฉ.2
       ด้วย ผคข.กดส.ฉ.2 มีความประสงค์ขอซื้อ/ขอจ้าง ดำเนินการ โดยวิธีเฉพาะเจาะจงตามรายการ ดังนี้
1. ค่าซ่อมเครื่อง ${apiData.brand || '-'} สัญญาเลขที่ ${apiData.contract_number || '-'} อาการ (${apiData.problem || 'รอระบุอาการ'}) serial number ${apiData.serial_number || '-'} ตามอนุมัติเลขที่ ${formValues.approveId} ลงวันที่ ${formValues.date}
2. เบิกจ่ายจากรหัสบัญชี 53051060 ศูนย์ต้นทุน E301023000 วงเงิน ${formValues.paymentDetails} บาท (ราคารวมภาษีมูลค่าเพิ่ม) โดยมีคณะกรรมการตรวจรับตามคำสั่ง เลขที่ ฉ.2 กดส.(พ.)01/2569 ลงวันที่ 5 มกราคม 2569
เป็นผู้ตรวจรับการจัดซ่อม/จัดซจ้าง ในวาระนี้.- \n\n\n\n\n\n\n\n\n\n\n
${centerSpace}...................................
${centerSpace}${formValues.inspector || ''}
${centerSpace}${formValues.position || ''}
${centerSpace}วันที่ ..........................`;
    const introText2 = `เรียน อก.ดส.ฉ.2
       เพื่อโปรดเห็นชอบรายงานขอจัดซื้อดำเนินการตาม
รายการดังกล่าวข้างต้นต่อไป \n\n\n\n\n
${centerSpace}............................................
${centerSpace}( นายสุทธิศักดิ์ สรรพสาร )
${centerSpace}หผ.คข.กดส.ฉ.2
${centerSpace}วันที่ ....................................`;

    const introText3 = `       เห็นชอบรายงานขอซื้อ/ขอจ้าง และอนุมัติสั่งซื้อ/สั่งจ้าง 
ดำเนินการได็โดยปฏิบัติให้ถูกต้องตามระเบียบ \n\n\n
${centerSpace}............................................
${centerSpace}(...........................................)
${centerSpace}............................................
${centerSpace}วันที่ ....................................



`;

    const introTex4 = `เรียน อก.ดส.ฉ.2
        ด้วย ผคข.กดส.ฉ.2 มีความประสงค์ขอซื้อ/ขอจ้าง ${formValues.reason || `-`} ซึ่งดำเนินการแล้ว ปรากฏว่ามีค่าใช้จ่ายตามรายการ ดังต่อไปนี้
        1. ค่าซ่อม ${apiData.brand || '-'} จำนวน ${formValues.quantity || '-'} เครื่อง                                                  เป็นเงิน       ${formValues.amount || '-'} บาท
                ( ราคาต่อหน่วย ${formValues.amount || '-'} บาท ไม่รวมภาษีมูลค่าเพิ่ม )     vat 7%                                เป็นเงิน       ${formValues.vat || `-`}   บาท
                                                                                                                      รวมเป็นเงิน       ${formValues.total || '-'}  บาท

            จึเรียนมาเพื่อโปรดลงนามอนุมัติจ่ายเงินในใบสำคัญจ่ายเงินหมุนเวียนที่แนบมาพร้อมนี้ดจำนวน                  1              ฉบับ
รวมเป็นเงิน   ${formValues.total || '-'}   บาท  (${formValues.totalText || '-'})  ต่อไปด้วย \n\n
                                            ${centerSpace}............................................
                                            ${centerSpace}( นายสุทธิศักดิ์ สรรพสาร )
                                            ${centerSpace}หผ.คข.กดส.ฉ.2
                                            ${centerSpace}วันที่ ....................................`;
    doc.autoTable({
        startY: 30,
        body: [
            [introText, introText2],
            ['', introText3],
            [introTex4]
        ],
        didParseCell: function (data) {
            if (data.column.index === 0 && data.row.index === 0) data.cell.rowSpan = 2;
            if (data.row.index === 2 && data.column.index === 0) {
                data.cell.colSpan = 2;
                data.cell.styles.halign = 'left';
            }
        },
        styles: {
            font: 'THSarabun', fontSize: 14, lineColor: [0, 0, 0], lineWidth: 0.1, cellPadding: 3, overflow: 'linebreak', // สำคัญ: เพื่อให้ \n ทำงาน
            halign: 'left', valign: 'top'
        },
        columnStyles: { 0: { cellWidth: 95 }, 1: { cellWidth: 95 } },
        rowStyles: { 0: { minCellHeight: 120 }, 1: { minCellHeight: 15 }, 2: { minCellHeight: 25 } },
        theme: 'grid'
    });

    // --- ส่วนการ Upload ไฟล์ขึ้น Server ---
    const pdfBlob = doc.output('blob'); // แปลง PDF เป็น Blob
    const fileName = `report_${apiData.repair_id}_${Date.now()}.pdf`;
    const formData = new FormData();
    formData.append('report_file', pdfBlob, fileName); // ชื่อ field ต้องตรงกับ multer 'report_file'

    try {
        // Check if API_BASE is defined
        if (typeof API_BASE === 'undefined') {
            throw new Error('API_BASE is not defined. Check if status_repair.html has it defined.');
        }

        console.log("Attempting to upload to:", `${API_BASE}/api/upload-report`);

        // 1. ส่งไฟล์ไปเก็บที่ Server
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
        console.error("Error details:", {
            message: err.message,
            api_base: typeof API_BASE !== 'undefined' ? API_BASE : 'NOT DEFINED',
            repair_id: apiData.repair_id
        });
        Swal.fire('Error', `ไม่สามารถเชื่อมต่อ Server เพื่อบันทึกรายงานได้\n\nDetails: ${err.message}`, 'error');
    }
}

