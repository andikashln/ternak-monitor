import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta'
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes} WIB`;
  } catch {
    return dateString;
  }
}

export function calculateAgeMonths(dobString?: string): number {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const now = new Date();
  if (isNaN(dob.getTime())) return 0;
  return (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
}

export function formatAgeString(ageMonths: number): string {
  if (ageMonths <= 0) return 'Baru Lahir';
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  if (years === 0) return `${months} Bulan`;
  if (months === 0) return `${years} Tahun`;
  return `${years} Thn ${months} Bln`;
}

// Export array of objects to Excel file
export async function exportToExcel(data: Record<string, any>[], filename: string) {
  const { default: writeXlsxFile } = await import('write-excel-file');
  const keys = data.length > 0 ? Object.keys(data[0]) : [];
  const rows = [
    keys.map(key => ({ value: key, fontWeight: 'bold' as const, backgroundColor: '#14532D', color: '#FFFFFF' })),
    ...data.map(row => keys.map(key => ({ value: row[key] == null ? '' : String(row[key]) }))),
  ];
  await writeXlsxFile(rows, { fileName: `${filename}.xlsx` });
}

// Export table or structured data to PDF
export function exportToPDF(title: string, headers: string[], rows: any[][], filename: string, subtitle?: string) {
  const doc = new jsPDF('landscape', 'mm', 'a4');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20, 83, 45); // Dark green
  doc.text('TERNAK MONITOR — ' + title.toUpperCase(), 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak: ${formatDateTime(new Date().toISOString())} ${subtitle ? '| ' + subtitle : ''}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [20, 83, 45],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(`${filename}.pdf`);
}
