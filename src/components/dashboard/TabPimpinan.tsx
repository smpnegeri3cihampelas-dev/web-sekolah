'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Leader, Teacher, DataPokok, isTendikOrTu } from '@/lib/schoolData';
import { EditLeaderModal, AddTeacherModal, EditTeacherModal, ResetTeacherPasswordModal } from './GtkModals';
import { getTeacherUsername } from '@/lib/elearningData';

interface TabPimpinanProps {
  leadersList: Leader[];
  teachersList: Teacher[];
  dataPokok: DataPokok;
  onSaveLeader: (leaderId: number, data: Partial<Leader>) => void;
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  onSaveTeacher: (teacherId: number, data: Partial<Teacher>) => void;
  onDeleteTeacher: (id: number) => void;
  onToggleTeacherActive: (id: number) => void;
  onSaveDataPokok: (data: DataPokok) => void;
  onRefresh?: () => void;
  showToast: (msg: string) => void;
}

export function TabPimpinan({
  leadersList,
  teachersList,
  dataPokok,
  onSaveLeader,
  onAddTeacher,
  onSaveTeacher,
  onDeleteTeacher,
  onToggleTeacherActive,
  onSaveDataPokok,
  onRefresh,
  showToast
}: TabPimpinanProps) {
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherPage, setTeacherPage] = useState(1);
  const TEACHERS_PER_PAGE = 8;

  const activeTeachersCount = useMemo(() => teachersList.filter(t => t.active !== false).length, [teachersList]);
  const inactiveTeachersCount = useMemo(() => teachersList.filter(t => t.active === false).length, [teachersList]);
  const tendikCount = useMemo(() => teachersList.filter(t => isTendikOrTu(t)).length, [teachersList]);
  const guruPendidikCount = useMemo(() => teachersList.filter(t => !isTendikOrTu(t)).length, [teachersList]);
  
  // Local Data Pokok form state to avoid root lag while editing numbers
  const [localDataPokok, setLocalDataPokok] = useState<DataPokok>(dataPokok);
  useEffect(() => {
    setLocalDataPokok(dataPokok);
  }, [dataPokok]);

  // Reset page when search changes
  useEffect(() => {
    setTeacherPage(1);
  }, [teacherSearch]);

  // Modal open states
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [resetPasswordTeacher, setResetPasswordTeacher] = useState<Teacher | null>(null);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);

  // Memoized search
  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.toLowerCase().trim();
    if (!q) return teachersList;
    return teachersList.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.subject.toLowerCase().includes(q) ||
      (t.nip && t.nip.includes(q))
    );
  }, [teachersList, teacherSearch]);

  const totalTeacherPages = Math.max(1, Math.ceil(filteredTeachers.length / TEACHERS_PER_PAGE));
  const paginatedTeachers = useMemo(() => {
    const start = (teacherPage - 1) * TEACHERS_PER_PAGE;
    return filteredTeachers.slice(start, start + TEACHERS_PER_PAGE);
  }, [filteredTeachers, teacherPage]);

  const handleSaveDataPokokSubmit = () => {
    onSaveDataPokok(localDataPokok);
    showToast('✅ Angka statistik Data Pokok berhasil diperbarui ke Landing Page!');
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Compact Top Summary & CTA Bar */}
      <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200 font-black">
            {leadersList.length} Pimpinan
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-900 border border-slate-200 font-black">
            {guruPendidikCount} Guru
          </span>
          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-900 border border-purple-200 font-black">
            {tendikCount} Staf TU / Tendik
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {activeTeachersCount} Aktif
          </span>
          {inactiveTeachersCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
              {inactiveTeachersCount} Nonaktif
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsAddTeacherOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-98 self-start sm:self-auto"
        >
          <span>+ Tambah Guru / Staf TU</span>
        </button>
      </div>

      {/* --- BAGIAN 1: JAJARAN PIMPINAN SEKOLAH --- */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Jajaran Pimpinan Sekolah
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leadersList.map((leader) => (
            <div 
              key={leader.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between gap-3 shadow-xs"
            >
              <div className="flex items-start gap-3.5">
                <img 
                  src={leader.photo || '/teachers/default_avatar.svg'} 
                  alt={leader.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200 flex-shrink-0 bg-slate-100"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h4 className="text-sm sm:text-base font-black text-slate-950 truncate">{leader.name}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black border border-indigo-200 bg-indigo-50 text-indigo-800">
                      {leader.role}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-600 mb-2 font-bold">NIP/Gol: {leader.nip}</p>
                  {leader.quote && (
                    <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-200 line-clamp-2">
                      "{leader.quote}"
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-emerald-700">
                  ● {leader.status}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedLeader(leader)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-extrabold text-slate-900 transition-all flex items-center gap-1 cursor-pointer active:scale-98"
                >
                  <span>✏️ Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- BAGIAN 2: DATA POKOK BERANDA --- */}
      <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-950">Statistik Data Pokok (Tampil di Beranda)</h3>
          <button
            type="button"
            onClick={handleSaveDataPokokSubmit}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-98"
          >
            Simpan Data Pokok
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-700 font-bold block mb-1 text-xs">Siswa Aktif</label>
            <input 
              type="text" 
              value={localDataPokok.siswa}
              onChange={(e) => setLocalDataPokok({ ...localDataPokok, siswa: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 font-mono text-sm font-black focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>
          <div>
            <label className="text-slate-700 font-bold block mb-1 text-xs">Rombel</label>
            <input 
              type="text" 
              value={localDataPokok.rombel}
              onChange={(e) => setLocalDataPokok({ ...localDataPokok, rombel: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 font-mono text-sm font-black focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>
          <div>
            <label className="text-slate-700 font-bold block mb-1 text-xs">Dewan Guru</label>
            <input 
              type="text" 
              value={localDataPokok.guru}
              onChange={(e) => setLocalDataPokok({ ...localDataPokok, guru: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 font-mono text-sm font-black focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>
          <div>
            <label className="text-slate-700 font-bold block mb-1 text-xs">Tenaga Kependidikan</label>
            <input 
              type="text" 
              value={localDataPokok.staf}
              onChange={(e) => setLocalDataPokok({ ...localDataPokok, staf: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 font-mono text-sm font-black focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* --- BAGIAN 3: DAFTAR DEWAN GURU & STAF TU (GTK) --- */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Daftar Dewan Guru &amp; Staf Tata Usaha (TU)
          </h3>

          <div className="relative">
            <input
              type="text"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              placeholder="Cari nama guru, TU, atau mapel..."
              className="w-full sm:w-64 pl-8 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
              🔍
            </span>
          </div>
        </div>

        {/* Teachers Table */}
        <div className="rounded-2xl bg-white border-2 border-slate-200 overflow-hidden shadow-sm">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[650px] w-full text-left text-xs table-auto">
              <thead className="bg-slate-100 text-slate-900 font-mono uppercase text-xs tracking-wider border-b-2 border-slate-300 font-black">
                <tr>
                  <th className="py-3.5 px-4 sm:px-5">Nama &amp; Identitas</th>
                  <th className="py-3.5 px-3 sm:px-4">Mata Pelajaran / Jabatan</th>
                  <th className="py-3.5 px-3">Kepegawaian</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {paginatedTeachers.map((teacher) => {
                  const isTendik = isTendikOrTu(teacher);
                  return (
                  <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 sm:px-5">
                      <div className="flex items-center gap-3">
                        <img 
                          src={teacher.photo || '/teachers/default_avatar.svg'} 
                          alt={teacher.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-300 flex-shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0">
                          <span className="block font-black text-slate-950 truncate text-sm">{teacher.name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {teacher.nip && teacher.nip !== '-' && (
                              <span className="text-[11px] font-mono text-slate-600 truncate font-bold">
                                NIP: {teacher.nip}
                              </span>
                            )}
                            {teacher.nuptk && teacher.nuptk !== '-' && (
                              <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                                NUPTK: {teacher.nuptk}
                              </span>
                            )}
                            {isTendik ? (
                              <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">
                                Staf TU (Tanpa Akun)
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200">
                                @{getTeacherUsername(teacher)}
                              </span>
                            )}
                            {teacher.phone && (
                              <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                                📱 {teacher.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 sm:px-4 text-slate-900">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold">{teacher.subject}</span>
                        {teacher.role &&
                          teacher.role.toLowerCase() !== teacher.subject.toLowerCase() &&
                          !teacher.role.toLowerCase().startsWith('guru ') &&
                          !isTendik && (
                            <span className="inline-flex items-center self-start px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
                              🏛️ {teacher.role}
                            </span>
                          )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300">
                        {teacher.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onToggleTeacherActive(teacher.id)}
                        title={teacher.active ? 'Klik untuk ubah ke Nonaktif / Mutasi' : 'Klik untuk aktifkan kembali'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border select-none ${
                          teacher.active 
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300' 
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          teacher.active ? 'bg-emerald-600' : 'bg-slate-500'
                        }`} />
                        <span>{teacher.active ? 'Aktif' : 'Nonaktif'}</span>
                        <span className="opacity-60">⇄</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isTendik && (
                          <button
                            type="button"
                            onClick={() => setResetPasswordTeacher(teacher)}
                            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all cursor-pointer active:scale-95"
                            title="Reset Kata Sandi & Kirim WA"
                          >
                            🔑
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedTeacher(teacher)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-indigo-700 border border-slate-300 transition-all cursor-pointer active:scale-95"
                          title="Edit Data"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus data "${teacher.name}" dari sistem?`)) {
                              onDeleteTeacher(teacher.id);
                            }
                          }}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 transition-all cursor-pointer active:scale-95"
                          title="Hapus Data"
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

          {filteredTeachers.length > 0 && (
            <div className="p-3.5 bg-slate-100 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-800 font-bold">
              <div>
                Menampilkan <span className="text-slate-950 font-black">{(teacherPage - 1) * TEACHERS_PER_PAGE + 1}</span> - <span className="text-slate-950 font-black">{Math.min(teacherPage * TEACHERS_PER_PAGE, filteredTeachers.length)}</span> dari <span className="text-slate-950 font-black">{filteredTeachers.length}</span> guru
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  disabled={teacherPage <= 1}
                  onClick={() => setTeacherPage(p => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border-2 border-slate-300 text-slate-900 text-xs font-extrabold transition cursor-pointer shadow-xs active:scale-98"
                >
                  ◀ Sebelumnya
                </button>

                {Array.from({ length: totalTeacherPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setTeacherPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-black transition-all cursor-pointer border-2 ${
                      teacherPage === pageNum
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-200 border-slate-300 text-slate-900 shadow-xs'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={teacherPage >= totalTeacherPages}
                  onClick={() => setTeacherPage(p => Math.min(totalTeacherPages, p + 1))}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border-2 border-slate-300 text-slate-900 text-xs font-extrabold transition cursor-pointer shadow-xs active:scale-98"
                >
                  Selanjutnya ▶
                </button>
              </div>
            </div>
          )}

          {filteredTeachers.length === 0 && (
            <div className="py-12 text-center text-slate-700 text-xs font-bold">
              Tidak ada data guru yang cocok dengan kata kunci pencarian.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditLeaderModal
        isOpen={!!selectedLeader}
        leader={selectedLeader}
        onClose={() => setSelectedLeader(null)}
        onSave={onSaveLeader}
        showToast={showToast}
      />

      <AddTeacherModal
        isOpen={isAddTeacherOpen}
        onClose={() => setIsAddTeacherOpen(false)}
        onAdd={onAddTeacher}
        showToast={showToast}
      />

      <EditTeacherModal
        isOpen={!!selectedTeacher}
        teacher={selectedTeacher}
        onClose={() => setSelectedTeacher(null)}
        onSave={onSaveTeacher}
        onDelete={onDeleteTeacher}
        showToast={showToast}
      />

      <ResetTeacherPasswordModal
        isOpen={!!resetPasswordTeacher}
        teacher={resetPasswordTeacher}
        onClose={() => setResetPasswordTeacher(null)}
        showToast={showToast}
        onSaveTeacher={onSaveTeacher}
      />
    </div>
  );
}
