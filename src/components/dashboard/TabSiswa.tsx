'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Student, SCHOOL_CLASSES } from '@/lib/elearningData';
import { downloadStudentTemplateExcel } from '@/lib/elearningExport';
import { AddStudentModal, EditStudentModal } from './StudentModals';

interface TabSiswaProps {
  studentsList: Student[];
  onAddStudent: (data: { name: string; nisn: string; nis: string; classId: string }) => void;
  onEditStudent: (id: string, data: { name: string; nisn: string; nis: string; classId: string }) => void;
  onDeleteStudent: (id: string, name: string) => void;
  onImportStudents: (imported: Student[]) => void;
  onResetStudents: () => void;
  showToast: (msg: string) => void;
}

const STUDENTS_PER_PAGE = 25;

export function TabSiswa({
  studentsList,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onImportStudents,
  onResetStudents,
  showToast
}: TabSiswaProps) {
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('ALL');
  const [studentPage, setStudentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset page when filter/search changes
  useEffect(() => {
    setStudentPage(1);
  }, [studentSearch, studentClassFilter]);

  // Memoized filter for 535+ students
  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase().trim();
    return studentsList.filter(s => {
      const matchClass = studentClassFilter === 'ALL' || s.classId === studentClassFilter;
      const matchSearch = !q || 
        s.name.toLowerCase().includes(q) || 
        s.nisn.includes(q) || 
        (s.nis && s.nis.includes(q));
      return matchClass && matchSearch;
    });
  }, [studentsList, studentClassFilter, studentSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * STUDENTS_PER_PAGE;
    return filteredStudents.slice(start, start + STUDENTS_PER_PAGE);
  }, [filteredStudents, studentPage]);

  // Handle Excel upload
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('⏳ Membaca dan memproses berkas Excel...');
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });
        
          let allImported: Student[] = [];

          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (rawJson.length < 2) return;

            let headerRowIndex = 0;
            let colNISN = -1, colNIS = -1, colName = -1, colClass = -1;

            for (let r = 0; r < Math.min(rawJson.length, 6); r++) {
              const row = rawJson[r];
              if (!Array.isArray(row)) continue;
              row.forEach((cell: any, cIdx: number) => {
                const cellStr = String(cell || '').toLowerCase().trim();
                if (cellStr.includes('nisn')) colNISN = cIdx;
                else if (cellStr === 'nis') colNIS = cIdx;
                else if (cellStr.includes('nama')) colName = cIdx;
                else if (cellStr.includes('kelas') || cellStr.includes('rombel')) colClass = cIdx;
              });
              if (colName !== -1) {
                headerRowIndex = r;
                break;
              }
            }

            if (colName === -1) {
              colNISN = 1;
              colNIS = 2;
              colName = 3;
              colClass = 4;
            }

            for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
              const row = rawJson[r];
              if (!row || !row[colName]) continue;

              const rawName = String(row[colName] || '').trim();
              if (!rawName || rawName.toLowerCase() === 'nama siswa' || rawName.toLowerCase() === 'nama') continue;

              const rawNisn = String(row[colNISN] || '').replace(/[^0-9]/g, '').trim() || `01${Math.floor(10000000 + Math.random() * 90000000)}`;
              const rawNis = colNIS !== -1 && row[colNIS] ? String(row[colNIS]).trim() : '';
              
              let rawClass = colClass !== -1 && row[colClass] ? String(row[colClass]).toUpperCase().trim() : '';
              if (!rawClass) {
                rawClass = sheetName.toUpperCase().trim();
              }
              rawClass = rawClass.replace(/KELAS\s*/i, '').replace(/\s+/g, '');
              if (/^[789][A-F]$/.test(rawClass)) {
                rawClass = `${rawClass[0]}-${rawClass[1]}`;
              }
              if (!rawClass || !rawClass.includes('-')) {
                rawClass = '7-A';
              }

              allImported.push({
                id: `${rawClass.replace('-', '')}-${String(allImported.length + 1).padStart(2, '0')}`,
                nisn: rawNisn,
                nis: rawNis,
                name: rawName,
                classId: rawClass,
                gender: '-'
              });
            }
          });

          if (allImported.length === 0) {
            showToast('⚠️ Tidak ada data siswa yang valid ditemukan di file Excel!');
            return;
          }

          onImportStudents(allImported);
          showToast(`🎉 Berhasil mengimpor ${allImported.length} siswa baru ke sistem!`);
        } catch (err: any) {
          console.error('Import error:', err);
          showToast('❌ Gagal memproses file Excel: ' + (err.message || 'Format tidak sesuai'));
        } finally {
          if (e.target) e.target.value = '';
        }
      };
      reader.readAsBinaryString(file);
    } catch (err: any) {
      console.error('Import module error:', err);
      showToast('❌ Gagal memuat modul Excel: ' + (err.message || 'Error'));
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header Action Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-800 text-[10px] font-mono font-black uppercase mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            Database Peserta Didik
          </div>
          <h2 className="text-xl font-black text-slate-950 tracking-tight">
            Data Siswa & Rombongan Belajar <span className="font-extrabold text-indigo-700">(2026/2027)</span>
          </h2>
          <p className="text-xs text-slate-700 font-semibold mt-0.5">
            Kelola daftar resmi peserta didik. Seluruh data di sini otomatis tersinkronisasi ke modul Presensi & E-Learning kelas.
          </p>
        </div>

        {/* Actions: Download Template, Upload Excel, Add Student, Reset */}
        <div className="flex flex-wrap items-center gap-2.5">
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".xlsx,.xls" 
            onChange={handleExcelFileUpload} 
            className="hidden" 
          />

          <button
            type="button"
            onClick={downloadStudentTemplateExcel}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-900 text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-98"
            title="Unduh format tabel Excel kosong untuk diisi data siswa baru"
          >
            <span>📥</span>
            <span>Format Template Excel</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-98"
            title="Upload file Excel daftar siswa baru (.xlsx)"
          >
            <span>📤</span>
            <span>Import File Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
          >
            <span>+ Tambah Siswa</span>
          </button>

          <button
            type="button"
            onClick={onResetStudents}
            className="p-2.5 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 border-2 border-slate-300 transition-all text-xs cursor-pointer shadow-xs active:scale-98 font-bold"
            title="Reset kembali ke data 535 siswa awal"
          >
            🔄
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
          <div className="text-xs font-black text-slate-700 uppercase tracking-wider">Total Siswa Terdaftar</div>
          <div className="text-3xl font-black text-slate-950 mt-1">{studentsList.length}</div>
          <div className="text-xs text-slate-600 mt-1 font-semibold">Siswa Aktif Dapodik & Presensi</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
          <div className="text-xs font-black text-slate-700 uppercase tracking-wider">Rombongan Belajar</div>
          <div className="text-3xl font-black text-indigo-700 mt-1">{SCHOOL_CLASSES.length} Kelas</div>
          <div className="text-xs text-slate-600 mt-1 font-semibold">7-A s/d 7-F, 8-A s/d 8-F, 9-A s/d 9-E</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
          <div className="text-xs font-black text-slate-700 uppercase tracking-wider">Status Sinkronisasi</div>
          <div className="text-3xl font-black text-emerald-700 mt-1">Live Aktif</div>
          <div className="text-xs text-emerald-800 mt-1 font-bold">Terhubung ke Portal Presensi E-Learning</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-xs">
        {/* Select Class Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider mr-1 whitespace-nowrap">
            Pilih Kelas:
          </span>
          <select
            value={studentClassFilter}
            onChange={(e) => setStudentClassFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 text-xs font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
          >
            <option value="ALL">Semua Kelas ({studentsList.length} Siswa)</option>
            {SCHOOL_CLASSES.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({studentsList.filter(s => s.classId === cls.id).length} Siswa)
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            placeholder="Cari nama siswa atau NISN..."
            className="w-full md:w-72 pl-8 pr-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-xs font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
            🔍
          </span>
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl bg-white border-2 border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3.5 bg-slate-100 border-b-2 border-slate-200 flex items-center justify-between text-xs text-slate-800 font-bold">
          <span>
            Menampilkan <span className="font-black text-slate-950">{filteredStudents.length}</span> dari {studentsList.length} siswa
          </span>
          {studentClassFilter !== 'ALL' && (
            <span className="px-2.5 py-0.5 rounded font-mono font-black text-xs bg-indigo-100 text-indigo-900 border border-indigo-300">
              Filter: Kelas {studentClassFilter}
            </span>
          )}
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto [scrollbar-width:thin]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-900 font-mono uppercase text-xs tracking-wider border-b-2 border-slate-300 sticky top-0 font-black backdrop-blur-md">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-32">NISN</th>
                <th className="py-3.5 px-4 w-28">NIS</th>
                <th className="py-3.5 px-4">Nama Lengkap Siswa</th>
                <th className="py-3.5 px-4 w-24">Kelas</th>
                <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedStudents.map((st, idx) => {
                const absoluteIndex = (studentPage - 1) * STUDENTS_PER_PAGE + idx + 1;
                return (
                  <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-700 font-bold">{absoluteIndex}</td>
                    <td className="py-3 px-4 font-mono font-black text-indigo-700">{st.nisn}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{st.nis || '-'}</td>
                    <td className="py-3 px-4 font-black text-slate-950 text-sm">{st.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded text-xs font-black bg-indigo-100 border border-indigo-300 text-indigo-900 font-mono">
                        {st.classId}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingStudent(st)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition cursor-pointer"
                          title="Edit siswa"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteStudent(st.id, st.name)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 transition cursor-pointer"
                          title="Hapus siswa"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length > 0 && (
          <div className="p-3.5 bg-slate-100 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-800 font-bold">
            <div>
              Menampilkan <span className="text-slate-950 font-black">{(studentPage - 1) * STUDENTS_PER_PAGE + 1}</span> - <span className="text-slate-950 font-black">{Math.min(studentPage * STUDENTS_PER_PAGE, filteredStudents.length)}</span> dari <span className="text-slate-950 font-black">{filteredStudents.length}</span> siswa
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={studentPage <= 1}
                onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border-2 border-slate-300 text-slate-900 text-xs font-extrabold transition cursor-pointer shadow-xs"
              >
                ◀ Sebelumnya
              </button>
              <span className="px-3.5 py-1.5 rounded-lg bg-white border-2 border-slate-300 text-slate-950 font-mono font-black text-xs shadow-xs">
                Hal {studentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={studentPage >= totalPages}
                onClick={() => setStudentPage(p => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border-2 border-slate-300 text-slate-900 text-xs font-extrabold transition cursor-pointer shadow-xs"
              >
                Berikutnya ▶
              </button>
            </div>
          </div>
        )}

        {filteredStudents.length === 0 && (
          <div className="py-16 text-center text-slate-700 text-xs font-bold">
            Tidak ada siswa yang cocok dengan filter atau kata kunci pencarian.
          </div>
        )}
      </div>

      {/* Modals */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={onAddStudent}
        showToast={showToast}
      />

      <EditStudentModal
        isOpen={!!editingStudent}
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
        onSave={onEditStudent}
        onDelete={onDeleteStudent}
        showToast={showToast}
      />
    </div>
  );
}
