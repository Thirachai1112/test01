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
                <label>12. รหัสบัญชี:</label> <input id="swal-input-account-code" class="swal2-input" value="53051060">
                <label>13. ศูนย์ต้นทุน:</label> <input id="swal-input-cost-center" class="swal2-input" value="E30102300">
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
                totalText: document.getElementById('swal-input-total-text').value,
                accountCode: document.getElementById('swal-input-account-code').value,
                costCenter: document.getElementById('swal-input-cost-center').value
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
    const PDF_TEMPLATE_VERSION = '20260303p';
    const RIGHT_SIGNATURE_X_OFFSET = 6;
    const { jsPDF } = window.jspdf;
    // กำหนด A4 แนวตั้ง
    const doc = new jsPDF('p', 'mm', 'a4'); 
    
    // 1. ตั้งค่า Font และตรวจสอบ
    if (typeof font === 'undefined') {
        Swal.fire('Error', 'ไม่พบข้อมูลฟอนต์ในระบบ', 'error');
        return;
    }
    doc.addFileToVFS("THSarabun-Bold.ttf", font);
    doc.addFont("THSarabun-Bold.ttf", "THSarabun", "normal");
    doc.addFont("THSarabun-Bold.ttf", "THSarabun", "bold");
    doc.setFont("THSarabun", "bold");

    // 2. ส่วนหัวกระดาษ (บีบระยะ Y ลงมาเพื่อเพิ่มพื้นที่ด้านล่าง)
    doc.setFontSize(16);
    doc.text("การไฟฟ้าส่วนภูมิภาค", 105, 10, { align: 'center' });
    doc.setFontSize(14);
    doc.text("รายงานขอซื้อ/ขอจ้าง และอนุมัติดำเนินการสั่งจ้าง", 105, 16, { align: 'center' });
    doc.text(`เลขที่ ฉ.2กดส.(ผคข.)                /2569`, 105, 22, { align: 'center' });

    // เตรียม Format ตัวเลข
    const amountVal = parseFloat(formValues.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const vatVal = formValues.vat || '0.00';
    const totalVal = formValues.total || '0.00';
    const contractNumber = formValues.contractNumber || apiData.contract_number || apiData.contractNumber || '_';
    const assetCode = formValues.assetCode || apiData.asset_number || apiData.assetCode || '_';
    const serialNumber = formValues.serialNumber || apiData.serial_number || apiData.serialNumber || '_';
    const quantity = formValues.quantity || apiData.quantity || '1';
    const accountCode = formValues.accountCode || '53051060';
    const costCenter = formValues.costCenter || 'E30102300';
    const inspectorName = formValues.inspector || '( นายสุทธิศักดิ์ สรรพสาร )';
    const inspectorPosition = formValues.position || 'หผ.คข.กดส.ฉ.2';
    const introText1 = [
    'เรียน หผ.คข.กดส.ฉ.2',
        '        ด้วยแผนก ผคข.กดส.ฉ.2 มีความประสงค์ขอซื้อ/จัดจ้าง',
    'ดำเนินการ โดยวิธีเฉพาะเจาะจงตามรายการ ดังนี้',
        `        1. ค่าซ่อมเครื่อง ${apiData.brand || '_'} เลขที่สัญญา ${contractNumber} รหัสทรัพย์สิน ${assetCode} Serial Number ${serialNumber} จำนวน ${quantity} เครื่อง ดังนี้`,
        `        2. เบิกจ่ายจาก รหัสบัญชี ${accountCode} ศูนย์ต้นทุน ${costCenter} วงเงิน ${formValues.amount || '_'} บาท(ราคารวมภาษีมูลค่าเพิ่ม) `,
    `โดยมีคณะกรรมการตรวจรับตามคำสั่ง ฉ.2 กดส.(พ.)01/2569 ลงวันที่ 5 มกราคม 2569 เป็นผู้ตรวจรับการจัดซื้อ/จัดจ้าง ในวาระนี้.-`,


        
    ].join('\n');
    const rightTopText = [
        'เรียน อก.ดย.ฉ.2',
        '      เพื่อโปรดเห็นชอบรายงานขอจัดซื้อดำเนินการตาม',
        'รายการดังกล่าวข้างต้นต่อไป'
    ].join('\n');
    const rightBottomText = [
        '      เห็นชอบรายงานขอซื้อ/ขอจ้างและอนุมัติสั่งซื้อ/สั่งจ้าง ดำเนินการได้โดยปฏิบัติให้ถูกต้องตามระเบียบ',
    ].join('\n');
    const introPreviewLines = doc.splitTextToSize(introText1, 92);
    const introMinHeight = Math.max(120, (introPreviewLines.length * 4.6) + 36);
    const topRowMinHeight = Math.max(48, Math.ceil(introMinHeight / 2.2));

    // 3. สร้างตารางเดียวที่คุมเนื้อหาทั้งหมด
    doc.autoTable({
        startY: 24,
        theme: 'grid',
        margin: { left: 8, right: 15, bottom: 5 }, // ลด margin ล่างสุด
        pageBreak: 'avoid',
        rowPageBreak: 'avoid',
        body: [
            // ส่วนที่ 1: หัวรายงาน (เรียน หผ. / เรียน อก.)
            [
                '',
                rightTopText,
                ''
            ],
            [
                '', 
                rightBottomText,
                ''
            ],
            // ส่วนที่ 2: เนื้อหาหลัก
            [
                `เรียน อก.ดย.ฉ.2\n       ด้วย ผคข.กดส.ฉ.2 มีความประสงค์ขอซื้อ/ขอจ้าง ${formValues.reason || '-'} ที่ใช้งานใน กฟฉ.2 ซึ่งดำเนินการแล้ว ปรากฏว่ามีค่าใช้จ่ายตามรายการ ดังต่อไปนี้`,
                '',
                ''
            ],
            // ส่วนที่ 3: รายการเงิน (กั้นหลังตรงเป๊ะตามภาพ)
            [`      1. ค่าซ่อม ${apiData.brand || '-'} จำนวน ${formValues.quantity || '1'} เครื่อง`, ` เป็นเงิน   ${amountVal}`, 'บาท'],
            [`       ( ราคาต่อหน่วย ${amountVal} บาท )     vat 7%`,`เป็นเงิน   ${vatVal}`, 'บาท'],
            ['', `รวมเป็นเงิน   ${totalVal}`, 'บาท'],
            

            [`      จึงเรียนมาเพื่อโปรดลงนามอนุมัติจ่ายเงินในใบสำคัญจ่ายเงินหมุนเวียนที่แนบมาพร้อมนี้จำนวน               1      ฉบับ`, '', ''],
            // ส่วนที่ 4: ลายเซ็นท้ายตาราง (บีบระยะบรรทัดในก้อนเดียว)
            [
                ` รวมเป็นเงิน  ${totalVal} บาท ( ${formValues.totalText || '-'} )  ต่อไปด้วย`,
                '',
                ''
            ]
        ],
        didParseCell: function (data) {
            const rowIndex = data.row.index;
            const colIndex = data.column.index;

            // การ Merge เซลล์
            if (rowIndex === 0 && colIndex === 0) {
                data.cell.rowSpan = 2; // ฝั่งซ้าย
                data.cell.styles.minCellHeight = introMinHeight;
                data.cell.styles.overflow = 'linebreak';
            }
            if (rowIndex === 0 && colIndex === 1) data.cell.colSpan = 2; // ฝั่งขวาบน
            if (rowIndex === 1 && colIndex === 1) data.cell.colSpan = 2; // ฝั่งขวาล่าง
            if (rowIndex === 2 || rowIndex === 7) data.cell.colSpan = 3; // แถวเนื้อหาและลายเซ็นขยายเต็ม
            if (rowIndex === 6 && colIndex === 0) data.cell.colSpan = 2; // แถวตัวอักษร

            // ฝั่งขวาบน/ขวาล่างมีการวาดข้อความเองใน didDrawCell อยู่แล้ว
            // เคลียร์ข้อความอัตโนมัติเพื่อกันตัวอักษรซ้อน
            if ((rowIndex === 0 || rowIndex === 1) && colIndex === 1) {
                data.cell.text = [''];
            }
        },
didDrawCell: function (data) {
    const padding = 4;
    const xPos = data.cell.x + padding;
    
    // คำนวณจุดกึ่งกลางของแต่ละ Cell ไว้รอเลย
    const centerX = data.cell.x + (data.cell.width / 2);

    // 1. ฝั่งซ้ายบน (ลายเซ็นผู้ตรวจรับ)
    if (data.row.index === 0 && data.column.index === 0) {
        doc.setFont('THSarabun', 'normal');
        doc.setFontSize(14); 
        const splitIntro = doc.splitTextToSize(introText1, data.cell.width - 8);
        doc.text(splitIntro, xPos, data.cell.y + 6);

        const signY = data.cell.y + data.cell.height - 22;
        // ใช้ align: 'center' เพื่อให้ข้อความทุกบรรทัดเล็งกึ่งกลางช่องพอดี
        doc.text('................................................', centerX, signY, { align: 'center' });
        doc.text(inspectorName, centerX, signY + 7, { align: 'center' });
        doc.text(inspectorPosition, centerX, signY + 14, { align: 'center' });
        doc.text('วันที่ ..............................', centerX, signY + 21, { align: 'center' });
    }

    // 2. ฝั่งขวาบน (เรียน อก. / ลายเซ็นผู้เห็นชอบ)
    if (data.row.index === 0 && data.column.index === 1) {
        doc.setFont('THSarabun', 'normal');
        doc.setFontSize(14); 
        
        // ใช้ splitTextToSize เพื่อกันข้อความยาวเกินจนทับลายเซ็น
        const rightTopLines = doc.splitTextToSize(rightTopText, data.cell.width - 8);
        doc.text(rightTopLines, xPos, data.cell.y + 6);

        const signY = data.cell.y + data.cell.height - 22;
        doc.text('................................................', centerX, signY, { align: 'center' });
        doc.text('( นายสุทธิศักดิ์ สรรพสาร )', centerX, signY + 7, { align: 'center' });
        doc.text('หผ.คข.กดส.ฉ.2', centerX, signY + 14, { align: 'center' });
        doc.text('วันที่ ..............................', centerX, signY + 21, { align: 'center' });
    }

    // 3. ฝั่งขวาล่าง (ผู้อนุมัติ)
    if (data.row.index === 1 && data.column.index === 1) {
        doc.setFont('THSarabun', 'normal');
        doc.setFontSize(14);
        
        const rightBottomLines = doc.splitTextToSize(rightBottomText, data.cell.width - 8);
        doc.text(rightBottomLines, xPos, data.cell.y + 6);

        doc.setFontSize(12);
        const signY = data.cell.y + data.cell.height - 18;
        
        // จัดกลางช่องขวาล่าง
        doc.text('................................................', centerX, signY, { align: 'center' });
        doc.text('(................................................)', centerX, signY + 6, { align: 'center' });
        doc.text('................................................', centerX, signY + 12, { align: 'center' });
        doc.text('วันที่ ..............................', centerX, signY + 18, { align: 'center' });
    }
},
        styles: {
            font: 'THSarabun', 
            fontSize: 14, // ลดขนาดตัวอักษรเพื่อให้จบในหน้าเดียว
            lineColor: [0, 0, 0], 
            lineWidth: 0.1, 
            cellPadding: 0.6, // ลด Padding เพื่อให้บรรทัดชิดกันขึ้น
            overflow: 'linebreak',
            valign: 'top'
        },
        rowStyles: {
            0: { minCellHeight: topRowMinHeight },
            1: { minCellHeight: topRowMinHeight },
            2: { minCellHeight: 10 },
            3: { minCellHeight: 8 },
            4: { minCellHeight: 8 },
            5: { minCellHeight: 8 },
            6: { minCellHeight: 8 },
            7: { minCellHeight: 22 }
        },
        columnStyles: { 
            0: { cellWidth: 100 },               // คอลัมน์ข้อความ
            1: { cellWidth: 72, halign: 'right' }, // คอลัมน์ตัวเลข (ชิดขวา)
            2: { cellWidth: 15, halign: 'center' } // คอลัมน์หน่วย "บาท"
        }
    });

    const continuationStartY = (doc.lastAutoTable?.finalY || 24) + 2;
    doc.autoTable({
        startY: continuationStartY,
        theme: 'grid',
        margin: { left: 8, right: 15, bottom: 5 },
        pageBreak: 'auto',
        body: [
            ['', '', ''],
            
        ],
        didParseCell: function (data) {
            if (data.row.index === 0 && data.column.index === 0) {
                data.cell.colSpan = 3;
            }
        },
        styles: {
            font: 'THSarabun',
            fontSize: 14,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            cellPadding: 0.6,
            overflow: 'linebreak',
            valign: 'top'
        },
        rowStyles: {
            0: { minCellHeight: 8 },
            1: { minCellHeight: 16 },
            2: { minCellHeight: 16 }
        },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 72 },
            2: { cellWidth: 15 }
        }
    });

    doc.setFont('THSarabun', 'normal');
    doc.setFontSize(8);
    doc.text(`template ${PDF_TEMPLATE_VERSION}`, 200, 292, { align: 'right' });
    doc.setFont('THSarabun', 'bold');

    // 4. การ Upload และ Save
    const pdfBlob = doc.output('blob');
    const fileName = `report_${apiData.repair_id}_${PDF_TEMPLATE_VERSION}_${Date.now()}.pdf`;
    const formData = new FormData();
    formData.append('report_file', pdfBlob, fileName);

    try {
        if (typeof API_BASE === 'undefined') throw new Error('API_BASE is not defined');

        const uploadRes = await fetch(`${API_BASE}/api/upload-report`, {
            method: 'POST',
            body: formData
        });

        if (uploadRes.ok) {
            const uploadResult = await uploadRes.json();
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
        Swal.fire('Error', `บันทึกลง Server ไม่สำเร็จ: ${err.message}`, 'error');
    }
}
