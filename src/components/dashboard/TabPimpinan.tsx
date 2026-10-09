'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Leader, Teacher, DataPokok } from '@/lib/schoolData';
import { EditLeaderModal, AddTeacherModal, EditTeacherModal } from './GtkModals';

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
  showToast
}: TabPimpinanProps) {
  const [teacherSearch, setTeacherSearch] = useState('');
  
  // Local Data Pokok form state to avoid root lag while editing numbers
  const [localDataPokok, setLocalDataPokok] = useState<DataPokok>(dataPokok);
  useEffect(() => {
    setLocalDataPokok(dataPokok);
  }, [dataPokok]);

  // Modal open states
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
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

  const handleSaveDataPokokSubmit = () => {
    onSaveDataPokok(localDataPokok);
    showToast('✅ Angka statistik Data Pokok berhasil diperbarui ke Landing Page!');
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Header Section */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-800 text-[10px] font-mono font-black uppercase mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            Manajemen Personalia Sekolah
          </div>
          <h2 className="text-xl font-black text-slate-950 tracking-tight">
            Pimpinan & Dewan Guru <span className="font-extrabold text-indigo-700">(GTK)</span>
          </h2>
          <p className="text-xs text-slate-700 font-semibold mt-0.5">
            Kelola data Kepala Sekolah, para Wakasek, dewan guru pendidik, dan pembaruan data pokok sekolah yang tampil di website.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAddTeacherOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
          >
            <span>+ Tambah Guru / Pendidik</span>
          </button>
        </div>
      </div>

      {/* --- BAGIAN 1: JAJARAN PIMPINAN SEKOLAH --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
              <span>Pimpinan Utama & Wakil Kepala Sekolah</span>
              <span className="text-xs font-mono font-black text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-300">
                {leadersList.length} Pimpinan
              </span>
            </h3>
            <p className="text-xs text-slate-700 font-semibold">Data ini langsung disinkronkan ke tab "Pimpinan" pada halaman Profil depan.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leadersList.map((leader) => (
            <div 
              key={leader.id}
              className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between gap-4 shadow-sm group relative overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <img 
                  src={leader.photo || '/teachers/default_avatar.svg'} 
                  alt={leader.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-300 flex-shrink-0 shadow-xs bg-slate-100"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-base font-black text-slate-950 truncate">{leader.name}</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border border-indigo-300 bg-indigo-100 text-indigo-900">
                      {leader.role}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-700 mb-2 font-bold">NIP/Gol: {leader.nip}</p>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed italic bg-slate-100 p-3 rounded-xl border border-slate-300">
                    "{leader.quote}"
                  </p>
                </div>
              </div>

              {/* Leader Actions */}
              <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between">
                <span className="text-xs font-mono font-black text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  {leader.status}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedLeader(leader)}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-xs font-extrabold text-slate-900 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                >
                  <span>✏️ Ubah Profil / Ganti Pimpinan</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- BAGIAN 2: PEMBARUAN DATA POKOK PENDIDIKAN --- */}
      <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-950">Statistik Data Pokok Pendidikan</h3>
            <p className="text-xs text-slate-700 font-semibold">Angka metrik ini tampil pada kartu Data Pokok di halaman profil utama</p>
          </div>
          <button
            type="button"
            onClick={handleSaveDataPokokSubmit}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-98"
          >
            Simpan Data Pokok
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-slate-800 font-black block mb-1.5 text-xs">Siswa Aktif</label>
            <input 
              type="text" 
              value={localDataPokok.siswa}
              onChange={(e) => setLocalDataPokok({ ...localDataPokok, siswa: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-sm font-black focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
            />
          </div>
          <div>
            <label className="text-slate-800 font-black block mb-1.5 text-xs">Rombongan Belajar</label>
            <input 
              type="text" 
              value={localDataPokok.rombel}
              onChange={(e) => setLocalDataPokok({ ...localDataPokok, rombel: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-sm font-black focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
            />
          </div>
          <div>
            <label className="text-slate-800 font-black block mb-1.5 text-xs">Dewan Guru</label>
            <input 
              type="text" 
              value={localDataPokok.guru}
              onChange={(e) => setLocalDataPokok({ ...localDataPokok, guru: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-sm font-black focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
            />
          </div>
          <div>
            <label className="text-slate-800 font-black block mb-1.5 text-xs">Tenaga Kependidikan</label>
            <input 
              type="text" 
              value={localDataPokok.staf}
              onChange={(e) => setLocalDataPokok({ ...localDataPokok, staf: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-sm font-black focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* --- BAGIAN 3: DAFTAR DEWAN GURU & TENAGA PENDIDIK (GTK) --- */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
              <span>Daftar Guru & Tenaga Kependidikan</span>
              <span className="text-xs font-mono font-black text-slate-900 bg-slate-200 px-2.5 py-0.5 rounded-full border border-slate-300">
                {teachersList.length} Pendidik Terdaftar
              </span>
            </h3>
            <p className="text-xs text-slate-700 font-semibold">Status keaktifan guru dapat diubah jika ada yang mutasi atau purnabakti.</p>
          </div>

          <div className="relative">
            <input
              type="text"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              placeholder="Cari nama guru / mapel..."
              className="w-full sm:w-64 pl-8 pr-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-xs font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
              🔍
            </span>
          </div>
        </div>

        {/* Teachers Table */}
        <div className="rounded-2xl bg-white border-2 border-slate-200 overflow-hidden shadow-sm">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs table-auto">
              <thead className="bg-slate-100 text-slate-900 font-mono uppercase text-xs tracking-wider border-b-2 border-slate-300 font-black">
                <tr>
                  <th className="py-4 px-4 sm:px-5">Guru & Tenaga Pendidik</th>
                  <th className="py-4 px-3 sm:px-4">Mata Pelajaran / Tugas</th>
                  <th className="py-4 px-3">Kepegawaian</th>
                  <th className="py-4 px-3">Status Keaktifan</th>
                  <th className="py-4 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 sm:px-5">
                      <div className="flex items-center gap-3">
                        <img 
                          src={teacher.photo || '/teachers/default_avatar.svg'} 
                          alt={teacher.name}
                          className="w-11 h-11 rounded-xl object-cover border-2 border-slate-300 flex-shrink-0 shadow-xs bg-slate-100"
                        />
                        <div className="min-w-0">
                          <span className="block font-black text-slate-950 truncate text-sm">{teacher.name}</span>
                          <span className="block text-xs font-mono text-slate-700 truncate mt-0.5 font-bold">
                            {teacher.nip && teacher.nip !== '-' ? `NIP/Gol. ${teacher.nip}` : teacher.status}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-3 sm:px-4 text-slate-950">
                      <span className="font-bold leading-relaxed">{teacher.subject}</span>
                    </td>

                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-black bg-slate-100 text-slate-900 border-2 border-slate-300">
                        {teacher.status}
                      </span>
                    </td>

                    <td className="py-4 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onToggleTeacherActive(teacher.id)}
                        title={teacher.active ? 'Klik untuk mengubah status jadi Mutasi / Nonaktif' : 'Klik untuk mengaktifkan kembali mengajar'}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer border-2 select-none group shadow-xs ${
                          teacher.active 
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-400' 
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-400'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          teacher.active 
                            ? 'bg-emerald-600 animate-pulse' 
                            : 'bg-slate-500'
                        }`} />
                        <span className="font-sans">
                          {teacher.active ? 'Aktif' : 'Nonaktif'}
                        </span>
                        <span className="text-xs opacity-60 group-hover:opacity-100 transition-opacity">
                          ⇄
                        </span>
                      </button>
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTeacher(teacher)}
                          className="p-2 rounded-xl bg-white hover:bg-slate-100 text-indigo-700 border-2 border-slate-300 transition-all cursor-pointer shadow-xs"
                          title="Ubah Data & Foto Guru"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleTeacherActive(teacher.id)}
                          className={`p-2 rounded-xl border-2 transition-all cursor-pointer shadow-xs ${
                            teacher.active 
                              ? 'bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border-slate-300' 
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-400'
                          }`}
                          title={teacher.active ? 'Ubah jadi Mutasi / Nonaktif' : 'Aktifkan Kembali Mengajar'}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="m17 2 4 4-4 4" />
                            <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                            <path d="m7 22-4-4 4-4" />
                            <path d="M21 13v1a4 4 0 0 1-4 4H3" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTeacher(teacher.id)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-300 transition-all cursor-pointer shadow-xs"
                          title="Hapus Guru dari Sistem"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
    </div>
  );
}
