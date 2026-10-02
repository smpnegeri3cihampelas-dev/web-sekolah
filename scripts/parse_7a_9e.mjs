import XLSX from 'xlsx';
import path from 'path';

const filePath = path.resolve('DAFTAR_SISWA_2026_2027.xlsx');
const workbook = XLSX.readFile(filePath);

const sheet = workbook.Sheets['7A-9E'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Total rows in 7A-9E:', data.length);
console.log('\n--- Rows 7 to 25 ---');
data.slice(6, 25).forEach((row, i) => {
  console.log(`Row ${i + 7}:`, row);
});

// Let's also check unique classes
const classes = new Set();
let validStudents = 0;
data.slice(7).forEach(row => {
  if (row && (row[2] || row[1])) {
    const className = row[3];
    if (className) classes.add(String(className).trim());
    validStudents++;
  }
});

console.log('\nUnique classes in 7A-9E:', Array.from(classes));
console.log('Total valid student entries found:', validStudents);
