import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

/**
 * Export services data as PDF
 */
export const exportServicesAsPDF = (services, fileName = 'Services_Report') => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('Velvet Luxury Salon', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Services Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    // Table Headers
    const tableHeaders = ['S.No', 'Service Name', 'Category', 'Price', 'Gender', 'Status'];
    const columnWidths = [12, 50, 30, 25, 25, 25];
    let xPosition = 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(102, 126, 234);
    doc.setTextColor(255, 255, 255);

    tableHeaders.forEach((header, i) => {
      doc.rect(xPosition, yPosition - 5, columnWidths[i], 8, 'F');
      doc.text(header, xPosition + 1, yPosition + 1, { maxWidth: columnWidths[i] - 2 });
      xPosition += columnWidths[i];
    });

    yPosition += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');

    // Table Data
    services.forEach((service, index) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
        xPosition = 10;

        // Repeat headers on new page
        doc.setFont(undefined, 'bold');
        doc.setFillColor(102, 126, 234);
        doc.setTextColor(255, 255, 255);
        tableHeaders.forEach((header, i) => {
          doc.rect(xPosition, yPosition - 5, columnWidths[i], 8, 'F');
          doc.text(header, xPosition + 1, yPosition + 1, { maxWidth: columnWidths[i] - 2 });
          xPosition += columnWidths[i];
        });
        yPosition += 10;
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        xPosition = 10;
      }

      const rowData = [
        (index + 1).toString(),
        service.name || 'N/A',
        service.category || 'General',
        `₹${service.price || 0}`,
        service.gender || 'Unisex',
        service.deletedAt ? 'Deleted' : 'Active'
      ];

      rowData.forEach((data, i) => {
        const text = String(data).length > 20 ? String(data).substring(0, 17) + '...' : String(data);
        doc.text(text, xPosition + 1, yPosition + 1, { maxWidth: columnWidths[i] - 2 });
        xPosition += columnWidths[i];
      });

      // Add alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(10, yPosition - 4, pageWidth - 20, 8, 'F');
      }

      yPosition += 8;
      xPosition = 10;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Total Services: ${services.length}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save PDF
    doc.save(`${fileName}_${new Date().getTime()}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Export services data as Excel
 */
export const exportServicesAsExcel = (services, fileName = 'Services_Report') => {
  try {
    const excelData = services.map((service, index) => ({
      'S.No': index + 1,
      'Service Name': service.name || 'N/A',
      'Category': service.category || 'General',
      'Price (₹)': service.price || 0,
      'Gender': service.gender || 'Unisex',
      'Description': service.description || 'N/A',
      'Status': service.deletedAt ? 'Deleted' : 'Active',
      'Created Date': service.createdAt ? new Date(service.createdAt.seconds * 1000).toLocaleDateString() : 'N/A',
      'Duration (mins)': service.duration || 'N/A'
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Services');

    // Auto-adjust column widths
    const colWidths = [
      { wch: 6 },
      { wch: 25 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 30 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 }
    ];
    worksheet['!cols'] = colWidths;

    // Style header row
    const headerStyle = {
      fill: { fgColor: { rgb: 'FF667EEA' } },
      font: { bold: true, color: { rgb: 'FFFFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    };

    // Apply header style
    Object.keys(worksheet).forEach(key => {
      if (key.startsWith('!')) return;
      if (key.match(/^[A-Z]+1$/)) {
        worksheet[key].s = headerStyle;
      }
    });

    // Save Excel file
    XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
    return true;
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw error;
  }
};

/**
 * Get export summary statistics
 */
export const getExportSummary = (services) => {
  return {
    totalServices: services.length,
    activeServices: services.filter(s => !s.deletedAt).length,
    deletedServices: services.filter(s => s.deletedAt).length,
    categories: [...new Set(services.map(s => s.category || 'General'))].length,
    totalValue: services.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0),
    averagePrice: services.length > 0 
      ? (services.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0) / services.length).toFixed(2)
      : 0
  };
};
