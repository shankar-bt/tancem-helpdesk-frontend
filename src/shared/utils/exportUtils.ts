import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn<T = any> {
  header: string;
  key: string;
  getValue?: (item: T, index: number) => string | number | null | undefined;
}

export interface ExportOptions<T = any> {
  filename?: string;
  title?: string;
  subtitle?: string;
  columns: ExportColumn<T>[];
  data: T[];
}

export function exportToCsv<T>({
  filename = 'export',
  columns,
  data,
}: ExportOptions<T>) {
  // CSV Header
  const headers = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`);

  // CSV Rows
  const rows = data.map((item, index) => {
    return columns
      .map((col) => {
        const val = col.getValue ? col.getValue(item, index) : (item as any)[col.key];
        const str = val === null || val === undefined ? '' : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  // UTF-8 BOM for Excel compatibility
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

export async function exportToExcel<T>({
  filename = 'export',
  columns,
  data,
  title,
}: ExportOptions<T>) {
  const workbook = new ExcelJS.Workbook();
  const sheetName = (title?.slice(0, 31) || 'Sheet1').replace(/[*?:/\\\[\]]/g, ' ');
  const worksheet = workbook.addWorksheet(sheetName);

  // Configure columns with headers, keys, and dynamic auto-fit width
  worksheet.columns = columns.map((col) => {
    let maxLen = col.header.length;
    data.forEach((item, index) => {
      const val = col.getValue ? col.getValue(item, index) : (item as any)[col.key];
      const strLen = val !== null && val !== undefined ? String(val).length : 0;
      if (strLen > maxLen) maxLen = strLen;
    });

    return {
      header: col.header,
      key: col.key,
      width: Math.min(Math.max(maxLen + 4, 12), 45),
    };
  });

  // Add data rows
  data.forEach((item, index) => {
    const row: Record<string, any> = {};
    columns.forEach((col) => {
      const val = col.getValue ? col.getValue(item, index) : (item as any)[col.key];
      row[col.key] = val === null || val === undefined ? '' : val;
    });
    worksheet.addRow(row);
  });

  // Header row styling - clean professional corporate theme
  const headerRow = worksheet.getRow(1);
  headerRow.height = 24;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' }, // Slate 900
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };

  // Write buffer and download as xlsx file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, `${filename}.xlsx`);
}

export function exportToPdf<T>({
  filename = 'export',
  columns,
  data,
  title = 'Export Report',
  subtitle,
}: ExportOptions<T>) {
  const isLandscape = columns.length > 5;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const headers = [columns.map((col) => col.header)];
  const rows = data.map((item, index) => {
    return columns.map((col) => {
      const val = col.getValue ? col.getValue(item, index) : (item as any)[col.key];
      return val === null || val === undefined ? '' : String(val);
    });
  });

  // Header Title
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(title, 40, 40);

  // Subtitle / Date
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  const generatedText =
    subtitle || `Generated on: ${new Date().toLocaleString()} | Total records: ${data.length}`;
  doc.text(generatedText, 40, 56);

  // AutoTable
  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 68,
    margin: { left: 40, right: 40 },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 5,
      textColor: [51, 65, 85], // slate-700
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [15, 23, 42], // deep dark corporate slate
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    didDrawPage: (dataObj) => {
      const str = `Page ${dataObj.pageNumber}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height || pageSize.getHeight();
      doc.text(str, 40, pageHeight - 20);
    },
  });

  doc.save(`${filename}.pdf`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
