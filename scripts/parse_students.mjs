import XLSX from 'xlsx';
import path from 'path';

const filePath = path.resolve('DAFTAR_SISWA_2026_2027.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Sheet Names:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\n--- Sheet: ${sheetName} (Rows: ${data.length}) ---`);
  // Print first 8 rows
  data.slice(0, 8).forEach((row, i) => {
    console.log(`Row ${i + 1}:`, row);
  });
});
