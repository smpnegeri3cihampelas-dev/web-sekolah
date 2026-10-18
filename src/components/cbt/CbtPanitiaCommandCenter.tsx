'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CbtExamPackage,
  CbtRoomPresetType,
  CbtExamRoomConfig,
  CbtPanitiaConfig,
  generateRoomsForPreset,
  getStoredCbtPanitiaConfig,
  saveStoredCbtPanitiaConfig,
  getStoredCbtPackages,
  saveStoredCbtPackages,
  getStoredStudentCbtSessions,
  resetStoredStudentCbtSession,
  getStoredCbtRoomAttendances
} from '@/lib/cbtData';
import { Student, SCHOOL_CLASSES } from '@/lib/elearningData';

interface CbtPanitiaCommandCenterProps {
  activeStudents: Student[];
  onOpenRoomView?: (roomLabel: string) => void;
}

export default function CbtPanitiaCommandCenter({
  activeStudents,
  onOpenRoomView
}: CbtPanitiaCommandCenterProps) {
  // Panitia Config State (Presets & Rooms)
  const [config, setConfig] = useState<CbtPanitiaConfig>(() => getStoredCbtPanitiaConfig());

  // Packages & Sessions
  const [packages, setPackages] = useState<CbtExamPackage[]>([]);
  const [studentSessions, setStudentSessions] = useState(() => getStoredStudentCbtSessions());
  const [roomAttendances, setRoomAttendances] = useState(() => getStoredCbtRoomAttendances());

  // Active Tab: 'monitoring' | 'presets' | 'bap' | 'search'
  const [activeTab, setActiveTab] = useState<'monitoring' | 'presets' | 'bap' | 'search'>('monitoring');

  // Room Custom Edit Modal State
  const [editingRoom, setEditingRoom] = useState<CbtExamRoomConfig | null>(null);
  const [editRoomClasses, setEditRoomClasses] = useState<string[]>([]);
  const [editRoomSupervisor, setEditRoomSupervisor] = useState<string>('');

  // Student Search / Reset State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast / Notification
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showAlert = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 3500);
  };

  // Sync data on mount and updates
  useEffect(() => {
    setPackages(getStoredCbtPackages());
    setConfig(getStoredCbtPanitiaConfig());

    const handlePkgs = () => setPackages(getStoredCbtPackages());
    const handleSessions = () => setStudentSessions(getStoredStudentCbtSessions());
    const handleConfig = () => setConfig(getStoredCbtPanitiaConfig());
    const handleAttendances = () => setRoomAttendances(getStoredCbtRoomAttendances());

    window.addEventListener('cbtPackagesUpdated', handlePkgs);
    window.addEventListener('cbtSessionsUpdated', handleSessions);
    window.addEventListener('cbtPanitiaConfigUpdated', handleConfig);
    window.addEventListener('cbtRoomAttendancesUpdated', handleAttendances);

    return () => {
      window.removeEventListener('cbtPackagesUpdated', handlePkgs);
      window.removeEventListener('cbtSessionsUpdated', handleSessions);
      window.removeEventListener('cbtPanitiaConfigUpdated', handleConfig);
      window.removeEventListener('cbtRoomAttendancesUpdated', handleAttendances);
    };
  }, []);

  // Handle Preset Switching
  const handleSelectPreset = (preset: CbtRoomPresetType) => {
    const newRooms = generateRoomsForPreset(preset);
    const updated: CbtPanitiaConfig = {
      ...config,
      activePreset: preset,
      rooms: newRooms
    };
    saveStoredCbtPanitiaConfig(updated);
    setConfig(updated);
    showAlert(`Komposisi Ruangan berhasil diubah ke: ${
      preset === 'campur_7_8' ? 'Campuran Kelas 7 & 8' :
      preset === 'campur_8_9' ? 'Campuran Kelas 8 & 9' :
      preset === 'campur_7_9' ? 'Campuran Kelas 7 & 9' : 'Satu Tingkat Murni'
    }!`);
  };

  // Open Edit Modal for a Room
  const handleOpenEditRoom = (room: CbtExamRoomConfig) => {
    setEditingRoom(room);
    setEditRoomClasses([...room.classes]);
    setEditRoomSupervisor(room.supervisorName || 'Guru Pengawas');
  };

  // Save Room Custom Edit
  const handleSaveRoomEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    if (editRoomClasses.length === 0) {
      alert('Pilih minimal 1 kelas untuk ruangan ini!');
      return;
    }

    const updatedRooms = config.rooms.map(r => {
      if (r.id === editingRoom.id) {
        return {
          ...r,
          classes: editRoomClasses,
          supervisorName: editRoomSupervisor.trim() || 'Guru Pengawas',
          label: `${r.name} (${editRoomClasses.join(' & ')})`
        };
      }
      return r;
    });

    const updatedConfig: CbtPanitiaConfig = {
      ...config,
      activePreset: 'custom',
      rooms: updatedRooms
    };

    saveStoredCbtPanitiaConfig(updatedConfig);
    setConfig(updatedConfig);
    setEditingRoom(null);
    showAlert(`Pengaturan ${editingRoom.name} berhasil diperbarui!`);
  };

  // Toggle All Exam Packages Status (Master Start / Pause)
  const handleToggleAllPackages = (newStatus: 'active' | 'draft') => {
    const updated = packages.map(p => ({ ...p, status: newStatus }));
    saveStoredCbtPackages(updated);
    setPackages(updated);
    showAlert(
      newStatus === 'active'
        ? '▶️ Seluruh paket ujian CBT berhasil DIAKTIFKAN serentak!'
        : '⏸️ Seluruh paket ujian CBT berhasil DIJEDA (Draft) serentak!'
    );
  };

  // Macro Statistics
  const macroStats = useMemo(() => {
    const totalStudents = activeStudents.length;
    let submittedCount = 0;
    let inProgressCount = 0;
    let totalViolations = 0;

    Object.values(studentSessions).forEach(sess => {
      if (sess.isSubmitted) submittedCount++;
      else inProgressCount++;
      if (sess.violationCount) totalViolations += sess.violationCount;
    });

    const activePackagesCount = packages.filter(p => p.status === 'active').length;

    return {
      totalStudents,
      submittedCount,
      inProgressCount,
      totalViolations,
      activePackagesCount,
      totalPackages: packages.length
    };
  }, [activeStudents, studentSessions, packages]);

  // Filtered Students for Emergency Reset Search
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return activeStudents.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.nisn.includes(query) ||
      s.classId.toLowerCase().includes(query)
    ).slice(0, 15);
  }, [activeStudents, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {alertMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between animate-fade-in ${
          alertMsg.type === 'success'
            ? 'bg-emerald-600 text-white'
            : alertMsg.type === 'warning'
            ? 'bg-amber-500 text-slate-950'
            : 'bg-indigo-600 text-white'
        }`}>
          <span>{alertMsg.text}</span>
          <button type="button" onClick={() => setAlertMsg(null)} className="ml-3 font-mono font-black text-sm">✕</button>
        </div>
      )}

      {/* 1. HEADER PUSAT KOMANDO PANITIA */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-500/30 relative overflow-hidden space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg shadow-amber-400/20">
                🏛️
              </span>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  POSKO PUSAT CBT • {config.academicYear}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Pusat Komando Panitia Ujian CBT
                </h1>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              SMP Negeri 3 Cihampelas • Panel Pengendali Asesmen Sekolah. Pengaturan Denah Ruang Campuran (7-8 / 8-9 / 7-9), Monitoring Live Seluruh Ruangan, dan Rekap Berita Acara (BAP).
            </p>
          </div>

          {/* Quick Master Controls */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-right pr-2 border-r border-white/10 hidden sm:block">
              <span className="block text-[10px] text-slate-400">Status Master CBT:</span>
              <span className="text-xs font-bold text-amber-300">
                {macroStats.activePackagesCount} / {macroStats.totalPackages} Paket Aktif
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggleAllPackages('active')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Aktifkan seluruh paket soal ujian serentak"
            >
              <span>▶️</span>
              <span>Aktifkan Semua</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleAllPackages('draft')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white font-bold text-xs transition border border-white/15 flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Jeda seluruh ujian serentak"
            >
              <span>⏸️</span>
              <span>Jeda Semua</span>
            </button>
          </div>
        </div>

        {/* Macro Scoreboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10 pt-2 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px] font-semibold">Total Peserta Terdaftar</span>
            <span className="text-xl font-black text-white">{macroStats.totalStudents}</span>
            <span className="text-[10px] text-slate-400 block">Siswa (Kelas 7, 8, 9)</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px] font-semibold">Sedang Mengerjakan</span>
            <span className="text-xl font-black text-amber-300">{macroStats.inProgressCount}</span>
            <span className="text-[10px] text-amber-200/80 block">Live di Ruang Ujian</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px] font-semibold">Sudah Mengumpulkan</span>
            <span className="text-xl font-black text-emerald-300">{macroStats.submittedCount}</span>
            <span className="text-[10px] text-emerald-200/80 block">Selesai Dinilai</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px] font-semibold">Preset Denah Aktif</span>
            <span className="text-sm font-black text-white capitalize">
              {config.activePreset.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] text-indigo-300 block">{config.rooms.length} Ruang Ujian</span>
          </div>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/10 relative z-10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('monitoring')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'monitoring'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <span>📺</span>
            <span>Monitoring 18 Ruangan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <span>🎛️</span>
            <span>Pengaturan Komposisi Ruang Campur</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'search'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <span>🛠️</span>
            <span>Pencarian Siswa & Reset Sesi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bap')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bap'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <span>📋</span>
            <span>Rekapitulasi BAP Sekolah</span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT: PENGATURAN KOMPOSISI RUANG CAMPUR (PRESET) */}
      {activeTab === 'presets' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>🎛️</span>
              <span>Pilihan Preset Denah Ruangan Campur</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Pilih salah satu preset di bawah ini untuk mengubah komposisi pembagian rombel di seluruh ruangan secara instan.
            </p>
          </div>

          {/* 4 Preset Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Preset 1: Campur 7 & 8 */}
            <div
              onClick={() => handleSelectPreset('campur_7_8')}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                config.activePreset === 'campur_7_8'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-600/10'
                  : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">👥</span>
                  {config.activePreset === 'campur_7_8' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white">
                      AKTIF SEKARANG
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Campur Kelas 7 & 8
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ruang 01 s.d 06 diisi gabungan siswa Kelas 7 & 8 (duduk bersilangan). Kelas 9 di Ruang 07 s.d 12.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-indigo-700 bg-white p-2 rounded-xl border border-indigo-100">
                Cocok untuk: PTS / PAS Ganjil
              </div>
            </div>

            {/* Preset 2: Campur 8 & 9 */}
            <div
              onClick={() => handleSelectPreset('campur_8_9')}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                config.activePreset === 'campur_8_9'
                  ? 'border-purple-600 bg-purple-50/50 shadow-md shadow-purple-600/10'
                  : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">🤝</span>
                  {config.activePreset === 'campur_8_9' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white">
                      AKTIF SEKARANG
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Campur Kelas 8 & 9
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ruang 01 s.d 06 diisi gabungan siswa Kelas 8 & 9. Kelas 7 menempati Ruang 07 s.d 12.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-purple-700 bg-white p-2 rounded-xl border border-purple-100">
                Cocok untuk: Asesmen Semester Genap
              </div>
            </div>

            {/* Preset 3: Campur 7 & 9 */}
            <div
              onClick={() => handleSelectPreset('campur_7_9')}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                config.activePreset === 'campur_7_9'
                  ? 'border-teal-600 bg-teal-50/50 shadow-md shadow-teal-600/10'
                  : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">🔀</span>
                  {config.activePreset === 'campur_7_9' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-600 text-white">
                      AKTIF SEKARANG
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Campur Kelas 7 & 9
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ruang 01 s.d 06 diisi gabungan siswa Kelas 7 & 9. Kelas 8 di Ruang 07 s.d 12.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-teal-700 bg-white p-2 rounded-xl border border-teal-100">
                Cocok untuk: Penataan Rombel Ganjil
              </div>
            </div>

            {/* Preset 4: Satu Tingkat Murni */}
            <div
              onClick={() => handleSelectPreset('murni')}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                config.activePreset === 'murni'
                  ? 'border-slate-800 bg-slate-100 shadow-md shadow-slate-800/10'
                  : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">🏛️</span>
                  {config.activePreset === 'murni' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-white">
                      AKTIF SEKARANG
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Satu Tingkat / Murni
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Setiap ruangan hanya diisi oleh 1 kelas murni (tanpa digabung dengan tingkat lain).
                </p>
              </div>
              <div className="text-[11px] font-semibold text-slate-700 bg-white p-2 rounded-xl border border-slate-200">
                Cocok untuk: Ujian Harian / Simulasi
              </div>
            </div>
          </div>

          {/* Tabel Rincian Alokasi Ruangan */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Rincian Alokasi {config.rooms.length} Ruang Ujian:
              </h3>
              <span className="text-xs text-slate-500">
                Klik tombol <strong className="text-indigo-600">✏️ Edit</strong> jika ingin mengubah kelas khusus untuk ruangan tertentu.
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Ruangan</th>
                    <th className="py-3 px-4">Rombel Gabungan / Sasaran</th>
                    <th className="py-3 px-4 text-center">Estimasi Peserta</th>
                    <th className="py-3 px-4">Pengawas Terjadwal</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {config.rooms.map(room => {
                    const studentCount = room.classes.includes('Semua')
                      ? activeStudents.length
                      : activeStudents.filter(s => room.classes.includes(s.classId)).length;

                    return (
                      <tr key={room.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {room.name}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {room.classes.map(c => (
                              <span
                                key={c}
                                className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                  c.startsWith('7')
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : c.startsWith('8')
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : c.startsWith('9')
                                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {c === 'Semua' ? 'Semua Kelas' : `Kelas ${c}`}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {studentCount} Siswa
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {room.supervisorName || 'Guru Pengawas'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRoom(room)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 font-bold transition cursor-pointer"
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT: MONITORING 18 RUANGAN LIVE GRID */}
      {activeTab === 'monitoring' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>📺</span>
                <span>Monitoring Live Ruang Ujian CBT ({config.rooms.length} Ruang)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Pemantauan realtime pengerjaan siswa di seluruh ruangan. Data tersinkronisasi otomatis.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.rooms.map(room => {
              const studentsInRoom = room.classes.includes('Semua')
                ? activeStudents
                : activeStudents.filter(s => room.classes.includes(s.classId));

              let roomSubmitted = 0;
              let roomInProgress = 0;
              let roomNotStarted = 0;

              studentsInRoom.forEach(st => {
                const sessions = Object.values(studentSessions).filter(sess => sess.studentId === st.id);
                if (sessions.some(s => s.isSubmitted)) {
                  roomSubmitted++;
                } else if (sessions.length > 0) {
                  roomInProgress++;
                } else {
                  roomNotStarted++;
                }
              });

              const total = studentsInRoom.length;
              const percent = total > 0 ? Math.round((roomSubmitted / total) * 100) : 0;

              return (
                <div
                  key={room.id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                          {room.name}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm mt-1 line-clamp-1">
                          {room.classes.join(' & ')}
                        </h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        percent === 100
                          ? 'bg-emerald-100 text-emerald-800'
                          : percent > 0
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {percent}% Selesai
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${percent}%` }}
                          className="bg-emerald-500 transition-all duration-500"
                        />
                        <div
                          style={{ width: `${total > 0 ? (roomInProgress / total) * 100 : 0}%` }}
                          className="bg-amber-400 transition-all duration-500"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>✅ {roomSubmitted} Selesai</span>
                        <span>⏳ {roomInProgress} Mengerjakan</span>
                        <span>⚪ {roomNotStarted} Belum</span>
                      </div>
                    </div>

                    {/* Classes Breakdown Pills */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {room.classes.map(c => (
                        <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-100 font-semibold">
                          Kelas {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
                      👤 {room.supervisorName || 'Pengawas Ruang'}
                    </span>
                    {onOpenRoomView && (
                      <button
                        type="button"
                        onClick={() => onOpenRoomView(room.label || room.name)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold text-xs cursor-pointer"
                      >
                        Pantau Ruang ➔
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: PENCARIAN SISWA & RESET SESI MANDIRI */}
      {activeTab === 'search' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>🛠️</span>
              <span>Pencarian Peserta & Reset Sesi Mandiri (Posko)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan fitur ini jika ada siswa yang mengalami kendala teknis (HP restart, mati lampu, keluar aplikasi) untuk membuka kunci sesi pengerjaannya secara instan tanpa harus mendatangi ruang kelas.
            </p>
          </div>

          <div className="relative max-w-lg">
            <input
              type="text"
              placeholder="Cari Nama Siswa, NISN, atau Kelas (misal: Abdul, 0133..., 7-A)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          {searchQuery && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700">
                Hasil Pencarian ({searchResults.length} Siswa):
              </span>

              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  Tidak ditemukan siswa dengan kata kunci "{searchQuery}".
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Nama Siswa</th>
                        <th className="py-3 px-4">NISN / Kelas</th>
                        <th className="py-3 px-4">Status Ujian CBT</th>
                        <th className="py-3 px-4 text-right">Tindakan Panitia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {searchResults.map(st => {
                        const sessions = Object.values(studentSessions).filter(s => s.studentId === st.id);
                        const hasSubmitted = sessions.some(s => s.isSubmitted);
                        const hasInProgress = sessions.length > 0 && !hasSubmitted;

                        return (
                          <tr key={st.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {st.name}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {st.nisn} ({st.classId})
                            </td>
                            <td className="py-3 px-4">
                              {hasSubmitted ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  ✓ Sudah Selesai
                                </span>
                              ) : hasInProgress ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                                  ⏳ Sedang Mengerjakan
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                  ⚪ Belum Masuk
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {sessions.map(sess => (
                                <button
                                  key={sess.examId}
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Yakin ingin mereset sesi ujian siswa "${st.name}"? Siswa akan dapat mengerjakan kembali dari awal.`)) {
                                      resetStoredStudentCbtSession(sess.examId, st.id);
                                      showAlert(`Sesi ujian untuk ${st.name} berhasil di-reset!`);
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition cursor-pointer"
                                >
                                  🔄 Reset Sesi Ujian
                                </button>
                              ))}
                              {sessions.length === 0 && (
                                <span className="text-slate-400 text-[11px]">Tidak ada sesi aktif</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB CONTENT: REKAPITULASI BAP SEKOLAH */}
      {activeTab === 'bap' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>📋</span>
              <span>Rekapitulasi Berita Acara Pelaksanaan (BAP) Sekolah</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Pantau kelengkapan Berita Acara Pelaksanaan ujian dari seluruh ruangan pengawas untuk keperluan arsip administrasi panitia.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ruang Ujian</th>
                  <th className="py-3 px-4">Kelas Campuran</th>
                  <th className="py-3 px-4">Pengawas Ruang</th>
                  <th className="py-3 px-4">Status BAP</th>
                  <th className="py-3 px-4">Catatan Pengawas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {config.rooms.map(room => {
                  // Check if any BAP recorded for this room
                  const attendances = Object.values(roomAttendances).filter(a => a.roomName?.includes(room.name));
                  const isSubmitted = attendances.some(a => a.isBapSubmitted);
                  const latestNote = attendances[0]?.notes || '-';

                  return (
                    <tr key={room.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {room.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700">{room.classes.join(' & ')}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {room.supervisorName || 'Guru Pengawas'}
                      </td>
                      <td className="py-3 px-4">
                        {isSubmitted ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ BAP Terkirim
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            ⏳ Belum Diserahkan
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                        {latestNote}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. MODAL EDIT KUSTOM KELAS RUANGAN */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-indigo-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 block uppercase">Pengaturan Khusus Ruangan</span>
                <h3 className="text-base font-bold text-slate-900">{editingRoom.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoomEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Guru Pengawas:
                </label>
                <input
                  type="text"
                  value={editRoomSupervisor}
                  onChange={(e) => setEditRoomSupervisor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                  placeholder="Contoh: Dani Ramdani, S.Pd."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Pilih Rombel yang Dialokasikan ke {editingRoom.name}:
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 max-h-48 overflow-y-auto">
                  {SCHOOL_CLASSES.map(c => {
                    const isSelected = editRoomClasses.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (editRoomClasses.length === 1) {
                              alert('Ruangan minimal harus memiliki 1 kelas!');
                              return;
                            }
                            setEditRoomClasses(editRoomClasses.filter(id => id !== c.id));
                          } else {
                            setEditRoomClasses([...editRoomClasses, c.id].sort());
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{isSelected ? '✓' : '+'}</span>
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-md shadow-indigo-600/20"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
