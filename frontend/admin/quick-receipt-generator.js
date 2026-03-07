function formatThaiDateTime(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function handleQuickFinishAndGenerateReceipt(apiData) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
        Swal.fire('Error', 'ไม่พบไลบรารี jsPDF', 'error');
        return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    if (typeof font === 'undefined') {
        Swal.fire('Error', 'ไม่พบข้อมูลฟอนต์ในระบบ (font variable not found)', 'error');
        return;
    }

    doc.addFileToVFS('THSarabun-Bold.ttf', font);
    doc.addFont('THSarabun-Bold.ttf', 'THSarabun', 'normal');
    doc.addFont('THSarabun-Bold.ttf', 'THSarabun', 'bold');
    doc.setFont('THSarabun', 'normal');

    doc.setFont('THSarabun', 'bold');
    const reportNo = `RC-${apiData.repair_id}-${Date.now().toString().slice(-6)}`;
    const createdAtText = formatThaiDateTime(apiData.created_at);
    const closedAtText = formatThaiDateTime(new Date());
    const receiveName = apiData.employee_name || '-';
    const receiveCode = apiData.employee_id || apiData.employees_code || '-';
    const receivePhone = apiData.phone_number || '-';
    const department = apiData.department || apiData.affiliation || '-';
    const deviceName = apiData.brand || '-';
    const serialNumber = apiData.serial_number || '-';
    const assetNumber = apiData.asset_number || '-';
    const contractNumber = apiData.contract_number || '-';
    const issueText = apiData.problem || '-';
    const methodText = apiData.Procedure || apiData.repair_method || '-';

    doc.setFontSize(20);
    doc.text('ใบรับเครื่อง (ปิดงานด่วน)', 105, 18, { align: 'center' });

    doc.setFontSize(14);
    doc.text(`เลขที่เอกสาร: ${reportNo}`, 15, 30);
    doc.text(`วันที่รับแจ้ง: ${createdAtText}`, 15, 38);
    doc.text(`วันที่ปิดงาน: ${closedAtText}`, 15, 46);

    doc.setLineWidth(0.3);
    doc.line(15, 52, 195, 52);

    doc.setFontSize(16);
    doc.text('ข้อมูลผู้แจ้ง', 15, 61);
    doc.setFontSize(14);
    doc.text(`ชื่อผู้แจ้ง: ${receiveName}`, 15, 69);
    doc.text(`รหัสพนักงาน: ${receiveCode}`, 15, 77);
    doc.text(`เบอร์โทร: ${receivePhone}`, 110, 77);
    doc.text(`หน่วยงาน: ${department}`, 15, 85);

    doc.setFontSize(16);
    doc.text('ข้อมูลอุปกรณ์', 15, 97);
    doc.setFontSize(14);
    doc.text(`อุปกรณ์/รุ่น: ${deviceName}`, 15, 105);
    doc.text(`Serial Number: ${serialNumber}`, 15, 113);
    doc.text(`เลขทรัพย์สิน: ${assetNumber}`, 110, 113);
    doc.text(`เลขสัญญา: ${contractNumber}`, 15, 121);

    doc.setFontSize(16);
    doc.text('รายละเอียดงานซ่อม', 15, 133);
    doc.setFontSize(14);

    const issueLines = doc.splitTextToSize(`อาการเสีย: ${issueText}`, 180);
    doc.text(issueLines, 15, 141);

    const methodStartY = 141 + (issueLines.length * 7) + 2;
    const methodLines = doc.splitTextToSize(`วิธีการซ่อม: ${methodText}`, 180);
    doc.text(methodLines, 15, methodStartY);

    const signStartY = Math.min(250, methodStartY + (methodLines.length * 7) + 20);
    doc.line(25, signStartY, 85, signStartY);
    doc.line(125, signStartY, 185, signStartY);

    doc.text('ผู้รับเครื่อง/ผู้แจ้ง', 43, signStartY + 7, { align: 'center' });
    doc.text('ผู้ดำเนินการซ่อม', 153, signStartY + 7, { align: 'center' });

    const pdfBlob = doc.output('blob');
    const fileName = `quick_receive_${apiData.repair_id}_${Date.now()}.pdf`;
    const formData = new FormData();
    formData.append('report_file', pdfBlob, fileName);

    const base = window.ACTIVE_API_BASE || window.API_BASE || window.location.origin;

    try {
        const uploadRes = await fetch(`${base}/api/upload-report`, {
            method: 'POST',
            body: formData
        });

        if (!uploadRes.ok) {
            const uploadError = await uploadRes.json().catch(() => ({}));
            throw new Error(uploadError.message || `Upload failed: HTTP ${uploadRes.status}`);
        }

        const uploadResult = await uploadRes.json();
        const updateRes = await fetch(`${base}/api/repair/status/${apiData.repair_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'Fixed',
                item_id: apiData.item_id,
                procedure: methodText,
                report_url: uploadResult.file_name
            })
        });

        if (!updateRes.ok) {
            const updateError = await updateRes.json().catch(() => ({}));
            throw new Error(updateError.error || `Update failed: HTTP ${updateRes.status}`);
        }

        await Swal.fire('สำเร็จ', 'ปิดงานด่วนและสร้างใบรับเครื่องเรียบร้อยแล้ว', 'success');
        doc.save(fileName);
        if (typeof loadRepairData === 'function') {
            loadRepairData();
        }
    } catch (error) {
        console.error('Quick receipt generation error:', error);
        Swal.fire('Error', `ไม่สามารถปิดงานด่วนได้: ${error.message}`, 'error');
    }
}
