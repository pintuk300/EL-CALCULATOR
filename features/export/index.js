/**
 * Export Feature
 * Handles PDF generation and HTML saving
 */

export function exportAsHTML(data) {
    // This requires the original template or a way to inject data
    // For now, let's implement the logic to create a portable HTML
    console.log('Exporting as HTML...', data);
    // Implementation would be similar to the original saveAsHTML
}

export function downloadPDF(docData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const pageW = 297;
    const margin = 10;
    const contentW = pageW - 2 * margin;
    const yellowFill = [255, 240, 160];
    const whiteFill = [255, 255, 255];
    const blueFill = [173, 216, 230];

    let y = margin;

    // Header
    doc.setFillColor(192, 192, 192);
    doc.setDrawColor(0);
    doc.setLineWidth(0.4);
    doc.rect(margin, y, contentW, 10, 'FD');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('UNUTILIZED EARN LEAVE CALCULATOR', pageW / 2, y + 7, { align: 'center' });
    y += 11;

    const baseStyle = {
        font: 'helvetica', fontSize: 9,
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
        lineColor: [0, 0, 0], lineWidth: 0.3,
        textColor: [0, 0, 0], valign: 'middle',
    };

    // User Info Table
    doc.autoTable({
        startY: y,
        margin: { left: margin, right: margin },
        theme: 'grid',
        tableWidth: contentW,
        styles: baseStyle,
        columnStyles: {
            0: { cellWidth: 22, fontStyle: 'bold', fillColor: whiteFill },
            1: { fontStyle: 'bold', fillColor: yellowFill },
            2: { cellWidth: 18, fontStyle: 'bold', fillColor: whiteFill },
            3: { cellWidth: 28, fontStyle: 'bold', fillColor: yellowFill },
            4: { cellWidth: 18, fontStyle: 'bold', fillColor: whiteFill },
            5: { cellWidth: 28, fontStyle: 'bold', fillColor: yellowFill },
            6: { cellWidth: 22, fontStyle: 'bold', fillColor: whiteFill },
            7: { fontStyle: 'bold', fillColor: yellowFill },
        },
        body: [
            ['NAME', docData.user.name, 'D.O.B', docData.user.dob, 'D.O.J', docData.user.doj, '3 YRS COMP', docData.user.threeYrComp],
            ['DESIGNATION', docData.user.designation, 'LEAVE FROM', docData.user.leaveFrom, 'TO', docData.user.leaveTo, 'BALANCE EL', docData.user.balance],
        ],
    });

    y = doc.lastAutoTable.finalY + 2;

    // Leave Table
    doc.autoTable({
        startY: y,
        margin: { left: margin, right: margin },
        theme: 'grid',
        tableWidth: contentW,
        styles: {
            font: 'helvetica', fontSize: 7.5,
            cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
            lineColor: [0, 0, 0], lineWidth: 0.3,
            halign: 'center', valign: 'middle', textColor: [0, 0, 0],
        },
        columnStyles: {
            0: { cellWidth: 22 }, 1: { cellWidth: 22 }, 2: { cellWidth: 14 },
            3: { cellWidth: 26 }, 4: { cellWidth: 14 }, 5: { cellWidth: 18 },
            6: { cellWidth: 22 }, 7: { cellWidth: 22 }, 8: { cellWidth: 18 },
            9: { cellWidth: 'auto' },
        },
        head: [
            [
                { content: 'DUTY PERIOD', colSpan: 2, styles: { fillColor: blueFill, fontStyle: 'bold' } },
                { content: 'ABSENT\n(IN DAYS)', rowSpan: 2, styles: { fillColor: blueFill, fontStyle: 'bold' } },
                { content: 'TOTAL NO. OF\nDAYS', rowSpan: 2, styles: { fillColor: blueFill, fontStyle: 'bold' } },
                { content: 'LEAVE\nEARNED\n(IN DAYS)', rowSpan: 2, styles: { fillColor: blueFill, fontStyle: 'bold' } },
                { content: 'EARNED\nLEAVE AT\nCREDIT\n(10+5)', rowSpan: 2, styles: { fillColor: blueFill, fontStyle: 'bold' } },
                { content: 'UNUTILIZED LEAVE TAKEN PERIOD', colSpan: 2, styles: { fillColor: blueFill, fontStyle: 'bold' } },
                { content: 'NO. OF DAYS\nUNUTILIZED\nLEAVE TAKEN', rowSpan: 2, styles: { fillColor: blueFill, fontStyle: 'bold' } },
                { content: 'BALANCE OF\nUNUTILIZED EARN\nLEAVE ON RETURN\nFROM LEAVE TAKEN\n(6-9)', rowSpan: 2, styles: { fillColor: blueFill, fontStyle: 'bold' } },
            ],
            [
                { content: 'FROM', styles: { fillColor: blueFill, fontStyle: 'bold' } },
                { content: 'TO', styles: { fillColor: blueFill, fontStyle: 'bold' } },
                { content: 'FROM', styles: { fillColor: blueFill, fontStyle: 'bold' } },
                { content: 'TO', styles: { fillColor: blueFill, fontStyle: 'bold' } },
            ],
            ['1','2','3','4','5','6','7','8','9','10'].map(n => ({ content: n, styles: { fillColor: blueFill, fontStyle: 'bold' } })),
        ],
        body: docData.rows.map(row => row.map((cell, idx) => ({
            content: cell,
            styles: {
                textColor: (typeof cell === 'string' && cell.startsWith('-')) ? [200, 0, 0] : [0, 0, 0],
                fillColor: (idx === 6 || idx === 7) ? yellowFill : whiteFill,
                fontStyle: 'bold',
            }
        }))),
    });

    doc.save('earn-leave-calculator.pdf');
}
