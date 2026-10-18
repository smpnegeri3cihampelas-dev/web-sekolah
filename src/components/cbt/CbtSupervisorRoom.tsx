'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CbtExamPackage,
  CBT_EXAM_ROOMS,
  getStoredCbtPackages,
  getStoredCbtRoomAttendances,
  saveStoredCbtRoomAttendance,
  getStoredStudentCbtSessions,
  registerEmergencyStudentToCbt,
  resetStoredStudentCbtSession,
  getStoredCbtPanitiaConfig,
  saveStoredCbtPanitiaConfig,
  getStudentsForRoom,
  CbtPanitiaConfig,
  CbtStudentAnswerState,
  CbtRoomAttendance
} from '@/lib/cbtData';
import { Student } from '@/lib/elearningData';
import { exportCbtRoomBapToExcel } from '@/lib/elearningExport';

interface CbtSupervisorRoomProps {
  currentTeacherName: string;
  activeStudents: Student[];
  onOpenExamForStudent?: (exam: CbtExamPackage, student: Student, roomName: string) => void;
}

export default function CbtSupervisorRoom({
  currentTeacherName,
  activeStudents,
  onOpenExamForStudent
}: CbtSupervisorRoomProps) {
  const [packages, setPackages] = useState<CbtExamPackage[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>(CBT_EXAM_ROOMS[0]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  // Attendance records for current room & exam: studentId -> 'H' | 'S' | 'I' | 'A'
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'H' | 'S' | 'I' | 'A'>>({});
  const [bapNotes, setBapNotes] = useState<string>('Ujian berlangsung tertib, aman, dan lancar tanpa kendala teknis.');
  const [isBapSaved, setIsBapSaved] = useState<boolean>(false);

  // Emergency Student Modal State
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [emName, setEmName] = useState<string>('');
  const [emNisn, setEmNisn] = useState<string>('');
  const [emClass, setEmClass] = useState<string>('7-A');
  const [emGender, setEmGender] = useState<'L' | 'P'>('L');

  // Load packages & live sessions
  useEffect(() => {
    const handlePkgsUpdate = () => {
      const pkgs = getStoredCbtPackages();
      setPackages(pkgs);
      if (pkgs.length > 0 && !selectedExamId) {
        setSelectedExamId(pkgs[0].id);
      }
    };
    handlePkgsUpdate();
    window.addEventListener('cbtPackagesUpdated', handlePkgsUpdate);
    return () => window.removeEventListener('cbtPackagesUpdated', handlePkgsUpdate);
  }, [selectedExamId]);

  const selectedExam = useMemo(() => {
    return packages.find(p => p.id === selectedExamId) || packages[0];
  }, [packages, selectedExamId]);

  const [panitiaConfig, setPanitiaConfig] = useState<CbtPanitiaConfig>(() => getStoredCbtPanitiaConfig());

  useEffect(() => {
    const handleConfigUpdate = () => {
      setPanitiaConfig(getStoredCbtPanitiaConfig());
    };
    window.addEventListener('cbtPanitiaConfigUpdated', handleConfigUpdate);
    return () => window.removeEventListener('cbtPanitiaConfigUpdated', handleConfigUpdate);
  }, []);

  // Room options from Panitia Config
  const roomOptions = useMemo(() => {
    return panitiaConfig.rooms;
  }, [panitiaConfig]);

  // Selected room object
  const currentRoomObj = useMemo(() => {
    return roomOptions.find(r => r.name === selectedRoom || r.label === selectedRoom) || roomOptions[0];
  }, [roomOptions, selectedRoom]);

  // Students assigned to this room (mixed classes or custom assignments)
  const roomStudents = useMemo(() => {
    return getStudentsForRoom(currentRoomObj, activeStudents);
  }, [currentRoomObj, activeStudents]);

  // Classes in this room (can be 7-A & 8-A!)
  const roomClasses = useMemo(() => {
    if (currentRoomObj?.assignedStudentIds && currentRoomObj.assignedStudentIds.length > 0) {
      const cls = Array.from(new Set(roomStudents.map(s => s.classId))).sort();
      return cls.length > 0 ? cls : (currentRoomObj.classes || ['7-A']);
    }
    return currentRoomObj?.classes || ['7-A'];
  }, [currentRoomObj, roomStudents]);

  // Filter specific class within the room (or 'all' for mixed view)
  const [filterClassInRoom, setFilterClassInRoom] = useState<string>('all');

  const filteredRoomStudents = useMemo(() => {
    if (filterClassInRoom === 'all') return roomStudents;
    return roomStudents.filter(s => s.classId === filterClassInRoom);
  }, [roomStudents, filterClassInRoom]);

  // Load existing room attendance if any
  useEffect(() => {
    if (!selectedExam) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const all = getStoredCbtRoomAttendances();
    const key = `${selectedRoom}_${selectedExam.id}_${todayStr}`;
    const saved = all[key];

    if (saved) {
      setAttendanceRecords(saved.records || {});
      setBapNotes(saved.notes || '');
      setIsBapSaved(Boolean(saved.isBapSubmitted));
    } else {
      // Default all students to Hadir (H)
      const initial: Record<string, 'H' | 'S' | 'I' | 'A'> = {};
      roomStudents.forEach(st => {
        initial[st.id] = 'H';
      });
      setAttendanceRecords(initial);
      setIsBapSaved(false);
    }
  }, [selectedRoom, selectedExam, roomStudents]);

  // Live student exam sessions from storage
  const [studentSessions, setStudentSessions] = useState(() => getStoredStudentCbtSessions());

  useEffect(() => {
    const handleUpdate = () => {
      setStudentSessions(getStoredStudentCbtSessions());
    };
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes('cbt')) {
        handleUpdate();
        setPanitiaConfig(getStoredCbtPanitiaConfig());
        setPackages(getStoredCbtPackages());
      }
    };
    window.addEventListener('cbtSessionsUpdated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('cbtSessionsUpdated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Update student attendance status
  const handleSetStatus = (studentId: string, status: 'H' | 'S' | 'I' | 'A') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Save Room BAP and Attendance
  const handleSaveBap = () => {
    if (!selectedExam) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const data: CbtRoomAttendance = {
      roomName: selectedRoom,
      examId: selectedExam.id,
      examTitle: selectedExam.title,
      date: todayStr,
      supervisorName: currentTeacherName || 'Guru Pengawas Ruang',
      token: selectedExam.token,
      records: attendanceRecords,
      notes: bapNotes,
      isBapSubmitted: true,
      submittedAt: new Date().toISOString()
    };

    saveStoredCbtRoomAttendance(data);
    setIsBapSaved(true);
    alert('Berita Acara Pelaksanaan (BAP) dan Daftar Hadir Ruangan berhasil disimpan!');
  };

  // Export Room BAP to Excel
  const handleExportBapExcel = () => {
    if (!selectedExam) return;

    const todayStr = new Date().toISOString().split('T')[0];
    exportCbtRoomBapToExcel({
      examTitle: selectedExam.title,
      subject: selectedExam.subject,
      roomName: selectedRoom,
      supervisorName: currentTeacherName || 'Guru Pengawas Ruang',
      token: selectedExam.token,
      date: todayStr,
      notes: bapNotes,
      students: roomStudents.map(st => ({
        nisn: st.nisn,
        name: st.name,
        classId: st.classId,
        status: attendanceRecords[st.id] || 'H'
      }))
    });
  };

  // Emergency Student Registration on-the-spot
  const handleRegisterEmergencyStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emName.trim() || !emNisn.trim()) {
      alert('Nama dan NISN wajib diisi.');
      return;
    }

    const newStudent = registerEmergencyStudentToCbt({
      name: emName.trim(),
      nisn: emNisn.trim(),
      classId: emClass,
      gender: emGender
    });

    // Jika ruangan ini memiliki konfigurasi assignedStudentIds khusus, masukkan juga ID siswa baru
    if (currentRoomObj && currentRoomObj.assignedStudentIds && currentRoomObj.assignedStudentIds.length > 0) {
      const updatedRooms = panitiaConfig.rooms.map(r => {
        if (r.id === currentRoomObj.id) {
          const currentIds = r.assignedStudentIds || [];
          if (!currentIds.includes(newStudent.id)) {
            return {
              ...r,
              assignedStudentIds: [...currentIds, newStudent.id]
            };
          }
        }
        return r;
      });
      saveStoredCbtPanitiaConfig({ ...panitiaConfig, rooms: updatedRooms });
    }

    // Mark as Hadir
    setAttendanceRecords(prev => ({
      ...prev,
      [newStudent.id]: 'H'
    }));

    // Reset and close
    setEmName('');
    setEmNisn('');
    setShowEmergencyModal(false);

    alert(`Siswa ${newStudent.name} (NISN: ${newStudent.nisn}) berhasil didaftarkan dan langsung aktif di Ujian CBT serta Master Data Sekolah!`);
  };

  // Counts
  const hadirCount = roomStudents.filter(s => (attendanceRecords[s.id] || 'H') === 'H').length;
  const susulanCount = roomStudents.filter(s => {
    const st = attendanceRecords[s.id];
    return st === 'S' || st === 'I';
  }).length;
  const alpaCount = roomStudents.filter(s => attendanceRecords[s.id] === 'A').length;

  return (
    <div className="space-y-6">

      {/* 1. HEADER PENGAWAS RUANG */}
      <div className="bg-white border border-indigo-100 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-bold flex items-center justify-center text-sm">
                📋
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Mode Pengawas Ruang Ujian CBT
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pengawas: <span className="font-semibold text-slate-800">{currentTeacherName}</span> • Presensi, Berita Acara, & Pengawasan Peserta
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmergencyModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span>➕ Daftarkan Siswa di Ruangan Ini</span>
            </button>
          </div>
        </div>

        {/* Pemilih Ruangan & Pemilih Paket Ujian */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              1. Pilih Ruangan yang Anda Awasi:
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => {
                setSelectedRoom(e.target.value);
                setFilterClassInRoom('all');
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {roomOptions.map(room => (
                <option key={room.id} value={room.name}>
                  {room.label || room.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              2. Pilih Paket Ujian yang Sedang Berlangsung:
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {packages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.status === 'active' ? '🟢 [AKTIF]' : '⏸️ [DIJEDA]'} {pkg.title} ({pkg.subject})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. KARTU TOKEN SESI & STATISTIK RUANGAN */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Token Card (Besar & Jelas untuk Ditulis di Papan Tulis) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md space-y-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
            <span>Token Sesi Ruangan</span>
            {selectedExam?.status === 'active' ? (
              <span className="text-emerald-400 font-black flex items-center gap-1">🟢 AKTIF</span>
            ) : (
              <span className="text-amber-400 font-black flex items-center gap-1 animate-pulse">⏸️ DIJEDA PANITIA</span>
            )}
          </div>
          <div className="text-3xl font-mono font-black tracking-widest text-emerald-400 py-1">
            {selectedExam?.token || '---'}
          </div>
          <p className="text-[10px] text-slate-400">
            {selectedExam?.status === 'active'
              ? 'Tuliskan token ini di papan tulis agar siswa dapat memulai ujian.'
              : '⚠️ Ujian ini sedang dijeda oleh Posko Panitia Pusat.'}
          </p>
        </div>

        {/* Hadir Mengikuti Ujian */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Hadir di Ruangan
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {hadirCount} <span className="text-xs font-semibold text-slate-500">/ {roomStudents.length} Siswa</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Terverifikasi mengikuti ujian
          </div>
        </div>

        {/* Sakit / Izin (Otomatis Masuk Ujian Susulan) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Ujian Susulan (S / I)
          </div>
          <div className="text-2xl font-black text-amber-600">
            {susulanCount} <span className="text-xs font-semibold text-slate-500">Siswa</span>
          </div>
          <div className="text-[11px] text-amber-700 font-medium">
            Otomatis terdaftar ke Panitia
          </div>
        </div>

        {/* Alpa / Tanpa Keterangan */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Alpa / Tanpa Keterangan
          </div>
          <div className="text-2xl font-black text-rose-600">
            {alpaCount} <span className="text-xs font-semibold text-slate-500">Siswa</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Belum ada konfirmasi
          </div>
        </div>
      </div>

      {/* 3. TABEL DAFTAR HADIR PESERTA & MONITORING PENGERJAAN DI RUANGAN */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-0">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Daftar Hadir & Pengerjaan Peserta: {selectedRoom}
            </h3>
            <p className="text-[11px] text-slate-500">
              Total {roomStudents.length} peserta terdaftar di rombel {roomClasses.join(' & ')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportBapExcel}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Unduh Daftar Hadir & Berita Acara (.xlsx)"
            >
              <span>📥 Export BAP (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Sub-filter kelas campuran jika ruangan memiliki lebih dari 1 kelas */}
        {roomClasses.length > 1 && (
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-600 px-1">Filter Rombel di Ruangan Ini:</span>
            <button
              type="button"
              onClick={() => setFilterClassInRoom('all')}
              className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                filterClassInRoom === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua Peserta ({roomStudents.length})
            </button>
            {roomClasses.map(c => {
              const countInClass = roomStudents.filter(s => s.classId === c).length;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilterClassInRoom(c)}
                  className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    filterClassInRoom === c
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Kelas {c}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    filterClassInRoom === c ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {countInClass}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">No</th>
                <th className="px-3 py-2.5 w-28 font-mono">NISN</th>
                <th className="px-3 py-2.5">Nama Peserta Ujian</th>
                <th className="px-3 py-2.5 w-36 text-center">Status Kehadiran</th>
                <th className="px-3 py-2.5 w-40 text-center">Progres Pengerjaan</th>
                <th className="px-3 py-2.5 w-24 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoomStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Tidak ada siswa terdaftar di ruangan ini.
                  </td>
                </tr>
              ) : (
                filteredRoomStudents.map((st, idx) => {
                  const currentStatus = attendanceRecords[st.id] || 'H';
                  
                  // Check student live CBT session
                  const sessionKey = `${selectedExam?.id}_${st.id}`;
                  let session: CbtStudentAnswerState | undefined = studentSessions[sessionKey];
                  if (!session) {
                    session = Object.values(studentSessions).find(s => s.studentId === st.id);
                  }

                  return (
                    <tr key={st.id} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-2.5 text-center font-mono text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">
                        {st.nisn}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{st.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            st.classId.startsWith('7')
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : st.classId.startsWith('8')
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}>
                            {st.classId}
                          </span>
                        </div>
                        {currentStatus === 'S' && (
                          <span className="mt-1 inline-block text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Ujian Susulan
                          </span>
                        )}
                        {currentStatus === 'I' && (
                          <span className="ml-2 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            Izin
                          </span>
                        )}
                      </td>

                      {/* Selector Presensi: H, S, I, A */}
                      <td className="px-3 py-2.5 text-center">
                        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px] font-bold">
                          {(['H', 'S', 'I', 'A'] as const).map(code => (
                            <button
                              key={code}
                              type="button"
                              onClick={() => handleSetStatus(st.id, code)}
                              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                                currentStatus === code
                                  ? code === 'H' ? 'bg-emerald-600 text-white' :
                                    code === 'S' ? 'bg-blue-600 text-white' :
                                    code === 'I' ? 'bg-amber-600 text-white' :
                                    'bg-rose-600 text-white'
                                  : 'text-slate-500 hover:text-slate-900'
                              }`}
                            >
                              {code}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Live Status CBT */}
                      <td className="px-3 py-2.5 text-center">
                        {session?.isSubmitted ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ Selesai ({session.score}/100)
                          </span>
                        ) : session ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
                            Sedang Mengerjakan
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Belum Memulai
                          </span>
                        )}
                      </td>

                      {/* Test / Reset Button */}
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {session?.isSubmitted ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (!selectedExam) return;
                                if (confirm(`Reset ujian CBT untuk ${st.name}? Siswa akan dapat mengerjakan ulang ujian ini.`)) {
                                  resetStoredStudentCbtSession(selectedExam.id, st.id);
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                              title="Reset status selesai siswa ini agar bisa mengulang ujian"
                            >
                              <span>🔄</span>
                              <span>Reset</span>
                            </button>
                          ) : onOpenExamForStudent ? (
                            <button
                              type="button"
                              onClick={() => onOpenExamForStudent(selectedExam, st, selectedRoom)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition cursor-pointer"
                              title="Buka Lembar Ujian CBT untuk Siswa Ini"
                            >
                              🚀 Uji CBT
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. FORM BERITA ACARA PELAKSANAAN (BAP) DIGITAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <span>📝 Berita Acara Pelaksanaan Ujian (BAP) Ruangan</span>
          {isBapSaved && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ✓ Telah Disimpan
            </span>
          )}
        </h3>
        
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Catatan Pengawas Ruang (Kejadian Khusus / Situasi Ruang Ujian):
          </label>
          <textarea
            rows={2}
            value={bapNotes}
            onChange={(e) => setBapNotes(e.target.value)}
            placeholder="Tuliskan catatan kejadian di ruangan (misal: Ujian berjalan tertib, atau ada 1 siswa izin berobat)..."
            className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-500">
            Penandatangan: <span className="font-semibold text-slate-800">{currentTeacherName}</span> (Pengawas Ruang)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveBap}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              Simpan Berita Acara & Presensi Ruangan ✓
            </button>
          </div>
        </div>
      </div>

      {/* 5. MODAL PENDAFTARAN SISWA DARURAT DI RUANGAN */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-amber-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">➕</span>
                <h3 className="text-base font-bold text-slate-900">
                  Daftarkan Siswa di Ruangan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Gunakan fitur ini jika ada siswa yang belum terdaftar di sistem. Data yang disimpan otomatis terhubung ke Master Siswa Sekolah dan siswa bisa langsung login detik ini juga.
            </p>

            <form onSubmit={handleRegisterEmergencyStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Siswa:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian Hidayat"
                  value={emName}
                  onChange={(e) => setEmName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  NISN (10 Digit):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 0098765432"
                  value={emNisn}
                  onChange={(e) => setEmNisn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kelas / Rombel:
                  </label>
                  <select
                    value={emClass}
                    onChange={(e) => setEmClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    {['7-A', '7-B', '7-C', '7-D', '7-E', '7-F', '8-A', '8-B', '8-C', '8-D', '8-E', '8-F', '9-A', '9-B', '9-C', '9-D', '9-E'].map(c => (
                      <option key={c} value={c}>Kelas {c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Kelamin:
                  </label>
                  <select
                    value={emGender}
                    onChange={(e) => setEmGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Daftarkan & Berikan Akses Ujian →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
