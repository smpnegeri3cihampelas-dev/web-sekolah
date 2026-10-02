import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const filePath = path.resolve('DAFTAR_SISWA_2026_2027.xlsx');
const workbook = XLSX.readFile(filePath);

const sheet = workbook.Sheets['7A-9E'];
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const students = [];
const classCounts = {};

// Skip headers up to row 9 (0-indexed: 9)
for (let i = 9; i < rawData.length; i++) {
  const row = rawData[i];
  if (!row || !row[2]) continue; // Must have name

  const rawNo = row[0];
  const rawNisnNis = String(row[1] || '').trim();
  const rawName = String(row[2] || '').trim();
  const rawClass = String(row[3] || '').trim().toUpperCase();

  if (!rawName || rawName === 'Nama Siswa') continue;
  if (!rawClass) continue;

  // Format class name, e.g. 7A -> 7-A
  const matchClass = rawClass.match(/^([789])([A-F])$/);
  const formattedClass = matchClass ? `${matchClass[1]}-${matchClass[2]}` : rawClass;

  // Split NISN and NIS if format is "0133138158 / 262707001"
  let nisn = rawNisnNis;
  let nis = '';
  if (rawNisnNis.includes('/')) {
    const parts = rawNisnNis.split('/').map(p => p.trim());
    nisn = parts[0] || '';
    nis = parts[1] || '';
  }

  classCounts[formattedClass] = (classCounts[formattedClass] || 0) + 1;
  const countInClass = classCounts[formattedClass];
  const studentId = `${formattedClass.replace('-', '')}-${String(countInClass).padStart(2, '0')}`;

  students.push({
    id: studentId,
    nisn: nisn || `00${Date.now().toString().slice(-8)}`,
    nis: nis,
    name: rawName,
    classId: formattedClass,
    gender: '-' // No gender column in source
  });
}

console.log('Total students parsed:', students.length);
console.log('Classes and counts:', classCounts);

// Write to a json for inspection
fs.writeFileSync('scripts/parsed_students.json', JSON.stringify({ classCounts, students }, null, 2));
