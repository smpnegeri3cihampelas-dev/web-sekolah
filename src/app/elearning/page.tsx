'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  SCHOOL_CLASSES, 
  INITIAL_STUDENTS, 
  DEMO_TEACHERS, 
  DEMO_STUDENT, 
  ClassSessionAttendance, 
  AttendanceStatus, 
  getStoredAttendance, 
  saveStoredAttendance,
  Student
} from '@/lib/elearningData';

export default function ELearningPage() {
  // Current user role state: 'login' | 'guru_mapel' | 'guru_piket' | 'siswa'
  const [currentRole, setCurrentRole] = useState<'login' | 'guru_mapel' | 'guru_piket' | 'siswa'>('guru_mapel');
  
  // Realtime Attendance State (synced via localStorage)
  const [attendanceData, setAttendanceData] = useState<Record<string, ClassSessionAttendance>>({});
  
  // Active Tab inside Teacher / Piket view
  const [activeMenu, setActiveMenu] = useState<'presensi' | 'materi' | 'cbt'>('presensi');
  
  // Mapel Teacher State
  const [selectedClassId, setSelectedClassId] = useState<string>('7-A');
  const [selectedSubject, setSelectedSubject] = useState<string>('Ilmu Pengetahuan Alam (IPA)');
  
  // Temporary working records for the selected class (before clicking save)
  const [workingRecords, setWorkingRecords] = useState<Record<string, AttendanceStatus>>({});
  const [workingNotes, setWorkingNotes] = useState<Record<string, string>>({});
  
  // Piket Quick Action Form State
  const [piketSelectedClass, setPiketSelectedClass] = useState<string>('7-A');
  const [piketSelectedStudentId, setPiketSelectedStudentId] = useState<string>('7A-01');
  const [piketActionStatus, setPiketActionStatus] = useState<AttendanceStatus>('T');
  const [piketActionNote, setPiketActionNote] = useState<string>('Terlambat 15 menit');

  // Modal detail view for Piket
  const [detailModalClassId, setDetailModalClassId] = useState<string | null>(null);
  
  // Piket Interactive Class Attendance State (so duty teacher can take / edit attendance for any class)
  const [piketModalRecords, setPiketModalRecords] = useState<Record<string, AttendanceStatus>>({});
  const [piketModalNotes, setPiketModalNotes] = useState<Record<string, string>>({});

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warn' } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
        ' • ' +
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load attendance data from storage
  useEffect(() => {
    const loadData = () => {
      const stored = getStoredAttendance();
      setAttendanceData(stored);
    };
    loadData();

    const handleDataUpdate = () => {
      loadData();
    };
    window.addEventListener('elearningAttendanceUpdated', handleDataUpdate);
    return () => window.removeEventListener('elearningAttendanceUpdated', handleDataUpdate);
  }, []);

  // Sync working records when selected class changes
  useEffect(() => {
    const classSession = attendanceData[selectedClassId];
    const studentsInClass = INITIAL_STUDENTS.filter(s => s.classId === selectedClassId);
    
    const records: Record<string, AttendanceStatus> = {};
    const notes: Record<string, string> = {};

    studentsInClass.forEach(student => {
      if (classSession?.records?.[student.id]) {
        records[student.id] = classSession.records[student.id];
        if (classSession.notes?.[student.id]) {
          notes[student.id] = classSession.notes[student.id];
        }
      } else {
        records[student.id] = 'H'; // Default hadir
      }
    });

    setWorkingRecords(records);
    setWorkingNotes(notes);
  }, [selectedClassId, attendanceData]);

  // Update a single student status
  const handleSetStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setWorkingRecords(prev => ({ ...prev, [studentId]: status }));
  };

  // Update a student's note
  const handleSetStudentNote = (studentId: string, note: string) => {
    setWorkingNotes(prev => ({ ...prev, [studentId]: note }));
  };

  // Quick Action: Set all students to Hadir
  const handleSetAllHadir = () => {
    const studentsInClass = INITIAL_STUDENTS.filter(s => s.classId === selectedClassId);
    const updated: Record<string, AttendanceStatus> = {};
    studentsInClass.forEach(s => {
      updated[s.id] = 'H';
    });
    setWorkingRecords(updated);
    showToast('Seluruh siswa berhasil ditandai HADIR (H)', 'info');
  };

  // Save attendance from Guru Mapel
  const handleSaveAttendance = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const today = now.toISOString().split('T')[0];

    const updatedData = { ...attendanceData };
    updatedData[selectedClassId] = {
      classId: selectedClassId,
      date: today,
      subject: selectedSubject,
      teacherName: 'Hendra Gunawan, S.Pd',
      teacherNip: '19850615 201001 1 012',
      isSubmitted: true,
      submittedAt: timeString,
      records: workingRecords,
      notes: workingNotes,
    };

    saveStoredAttendance(updatedData);
    setAttendanceData(updatedData);
    showToast(`Presensi ${selectedClassId} berhasil disimpan & disinkronkan ke Meja Piket (${timeString})!`, 'success');
  };

  // Piket action: Update student status (e.g. Terlambat at the gate)
  const handlePiketActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const today = now.toISOString().split('T')[0];

    const currentSession = attendanceData[piketSelectedClass] || {
      classId: piketSelectedClass,
      date: today,
      subject: 'Jam Pelajaran',
      teacherName: 'Guru Jam Pertama',
      teacherNip: '-',
      isSubmitted: true,
      records: {},
      notes: {},
    };

    const updatedRecords = { ...currentSession.records, [piketSelectedStudentId]: piketActionStatus };
    const updatedNotes = { ...currentSession.notes, [piketSelectedStudentId]: `${piketActionNote} (via Meja Piket jam ${timeString})` };

    const updatedData = {
      ...attendanceData,
      [piketSelectedClass]: {
        ...currentSession,
        records: updatedRecords,
        notes: updatedNotes,
        isSubmitted: true,
        submittedAt: currentSession.submittedAt || timeString,
      }
    };

    saveStoredAttendance(updatedData);
    setAttendanceData(updatedData);
    showToast(`Status siswa berhasil diubah via Meja Piket & terupdate otomatis di kelas!`, 'success');
  };

  // Open class modal with interactive state for Piket
  const handleOpenPiketClassModal = (classId: string) => {
    setDetailModalClassId(classId);
    const session = attendanceData[classId];
    const studentsInClass = INITIAL_STUDENTS.filter(s => s.classId === classId);
    const records: Record<string, AttendanceStatus> = {};
    const notes: Record<string, string> = {};

    studentsInClass.forEach(student => {
      if (session?.records?.[student.id]) {
        records[student.id] = session.records[student.id];
        if (session.notes?.[student.id]) {
          notes[student.id] = session.notes[student.id];
        }
      } else {
        records[student.id] = 'H'; // Default hadir
      }
    });

    setPiketModalRecords(records);
    setPiketModalNotes(notes);
  };

  // Set single student status from Piket modal
  const handleSetPiketStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setPiketModalRecords(prev => ({ ...prev, [studentId]: status }));
  };

  // Set single student note from Piket modal
  const handleSetPiketStudentNote = (studentId: string, note: string) => {
    setPiketModalNotes(prev => ({ ...prev, [studentId]: note }));
  };

  // Quick action: Set all students to Hadir from Piket modal
  const handleSetPiketAllHadir = () => {
    if (!detailModalClassId) return;
    const students = INITIAL_STUDENTS.filter(s => s.classId === detailModalClassId);
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach(s => {
      updated[s.id] = 'H';
    });
    setPiketModalRecords(updated);
    showToast('Seluruh siswa berhasil ditandai HADIR oleh Guru Piket', 'info');
  };

  // Save class attendance as Guru Piket / Inval
  const handleSavePiketAttendance = () => {
    if (!detailModalClassId) return;
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const today = now.toISOString().split('T')[0];

    const currentSession = attendanceData[detailModalClassId];
    const subject = currentSession?.subject || 'Jam Pertama (Inval)';

    const updatedData = {
      ...attendanceData,
      [detailModalClassId]: {
        classId: detailModalClassId,
        date: today,
        subject: subject,
        teacherName: 'Dra. Siti Aminah, M.Pd (Guru Piket / Inval)',
        teacherNip: '19780214 200501 2 008',
        isSubmitted: true,
        submittedAt: timeString,
        records: piketModalRecords,
        notes: piketModalNotes,
      }
    };

    saveStoredAttendance(updatedData);
    setAttendanceData(updatedData);
    showToast(`Presensi Kelas ${detailModalClassId} berhasil disimpan & disahkan oleh Guru Piket!`, 'success');
  };

  // Calculate stats for Piket Dashboard
  const calculateSchoolStats = () => {
    let totalAssigned = 0;
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    let terlambat = 0;

    SCHOOL_CLASSES.forEach(cls => {
      const session = attendanceData[cls.id];
      const students = INITIAL_STUDENTS.filter(s => s.classId === cls.id);
      
      students.forEach(st => {
        totalAssigned++;
        const status = session?.records?.[st.id] || (session?.isSubmitted ? 'H' : null);
        if (status === 'H') hadir++;
        else if (status === 'S') sakit++;
        else if (status === 'I') izin++;
        else if (status === 'A') alpa++;
        else if (status === 'T') terlambat++;
        else hadir++; // Assume default present if not yet fully marked
      });
    });

    return { totalAssigned, hadir, sakit, izin, alpa, terlambat };
  };

  const schoolStats = calculateSchoolStats();
  const currentClassStudents = INITIAL_STUDENTS.filter(s => s.classId === selectedClassId);
  const currentClassSession = attendanceData[selectedClassId];

  return (
    <div className="min-h-screen bg-[#07090e] text-stone-200 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border text-sm font-medium flex items-center gap-3 ${
            toast.type === 'success' 
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-900/30' 
              : toast.type === 'warn'
              ? 'bg-amber-950/90 text-amber-200 border-amber-500/40 shadow-amber-900/30'
              : 'bg-cyan-950/90 text-cyan-200 border-cyan-500/40 shadow-cyan-900/30'
          }`}>
            <span className="w-2.5 h-2.5 rounded-full animate-ping bg-current" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#0c1017]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Logo & School Identity */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-white/10 group-hover:border-cyan-400/50 transition">
                <Image src="/logo.jpg" alt="Logo SMPN 3 Cihampelas" fill className="object-cover" />
              </div>
              <div>
                <div className="text-sm font-bold text-white tracking-wide group-hover:text-cyan-300 transition flex items-center gap-2">
                  PORTAL E-LEARNING
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono">SPENTIC</span>
                </div>
                <div className="text-[11px] text-stone-400">SMP Negeri 3 Cihampelas</div>
              </div>
            </Link>

            {/* Back to Home Link (Mobile) */}
            <Link 
              href="/" 
              className="md:hidden text-xs text-stone-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10"
            >
              ← Web Utama
            </Link>
          </div>

          {/* Quick Demo Switcher Bar (Crucial for the user to try different roles easily!) */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
            <span className="text-[11px] font-semibold text-stone-400 px-2 uppercase tracking-wider hidden sm:inline">
              Mode Uji Coba:
            </span>
            
            <button
              onClick={() => { setCurrentRole('guru_mapel'); setActiveMenu('presensi'); showToast('Beralih ke: Pak Hendra (Guru Mapel IPA)', 'info'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                currentRole === 'guru_mapel'
                  ? 'bg-cyan-500 text-black font-semibold shadow-lg shadow-cyan-500/20'
                  : 'text-stone-300 hover:bg-white/5'
              }`}
            >
              <span>👨‍🏫</span>
              <span>Guru Mapel (IPA)</span>
            </button>

            <button
              onClick={() => { setCurrentRole('guru_piket'); showToast('Beralih ke: Ibu Siti (Pusat Meja Piket)', 'info'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                currentRole === 'guru_piket'
                  ? 'bg-emerald-500 text-black font-semibold shadow-lg shadow-emerald-500/20'
                  : 'text-stone-300 hover:bg-white/5'
              }`}
            >
              <span>🏢</span>
              <span>Meja Piket (Kontrol)</span>
            </button>

            <button
              onClick={() => { setCurrentRole('siswa'); showToast('Beralih ke: Aditia Pratama (Siswa 8-A)', 'info'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                currentRole === 'siswa'
                  ? 'bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/20'
                  : 'text-stone-300 hover:bg-white/5'
              }`}
            >
              <span>🎓</span>
              <span>Siswa (Aditia 8A)</span>
            </button>

            <button
              onClick={() => { setCurrentRole('login'); showToast('Beralih ke Formulir Login', 'info'); }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 whitespace-nowrap ${
                currentRole === 'login'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
              }`}
            >
              <span>🔑</span>
              <span>Layar Login</span>
            </button>
          </div>

          {/* Clock & Back link (Desktop) */}
          <div className="hidden lg:flex items-center gap-4 text-xs">
            <span className="text-stone-400 font-mono bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
              {currentTime}
            </span>
            <Link 
              href="/" 
              className="text-stone-300 hover:text-cyan-400 transition flex items-center gap-1 font-medium"
            >
              ← Kembali ke Web Sekolah
            </Link>
          </div>

        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">

        {/* ----------------- 1. VIEW: LAYAR LOGIN ----------------- */}
        {currentRole === 'login' && (
          <div className="max-w-md mx-auto my-8">
            <div className="bg-[#0f141f] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 mb-3">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-white">Masuk E-Learning & Presensi</h1>
                <p className="text-xs text-stone-400 mt-1">SMP Negeri 3 Cihampelas (SPENTIC)</p>
              </div>

              {/* Login Method Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 mb-6 text-xs font-semibold">
                <button 
                  onClick={() => setCurrentRole('guru_mapel')}
                  className="py-2 rounded-lg bg-cyan-500 text-black shadow transition text-center"
                >
                  Dewan Guru (NIP)
                </button>
                <button 
                  onClick={() => setCurrentRole('siswa')}
                  className="py-2 rounded-lg text-stone-300 hover:text-white transition text-center"
                >
                  Siswa (NISN)
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setCurrentRole('guru_mapel'); }} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    Nomor Induk Pegawai (NIP) / NISN
                  </label>
                  <input
                    type="text"
                    defaultValue="19850615 201001 1 012"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition"
                    placeholder="Masukkan NIP atau NISN"
                  />
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    *Akun terintegrasi otomatis dari data pokok Dapodik
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    Kata Sandi
                  </label>
                  <input
                    type="password"
                    defaultValue="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-sm hover:opacity-90 transition shadow-lg shadow-cyan-500/25 mt-2"
                >
                  Masuk ke Portal
                </button>
              </form>

              {/* Quick Jump Box */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-xs font-semibold text-stone-400 mb-3 text-center uppercase tracking-wider">
                  ⚡ Atau Masuk Cepat (Klik Salah Satu):
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => setCurrentRole('guru_mapel')}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-stone-200 group-hover:text-cyan-300">
                        👨‍🏫 Pak Hendra (Guru Mapel IPA)
                      </div>
                      <div className="text-[11px] text-stone-400">Untuk mengabsen kelas & tayang modul</div>
                    </div>
                    <span className="text-xs text-cyan-400 font-mono">Buka →</span>
                  </button>

                  <button
                    onClick={() => setCurrentRole('guru_piket')}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-stone-200 group-hover:text-emerald-300">
                        🏢 Ibu Siti (Pusat Meja Piket)
                      </div>
                      <div className="text-[11px] text-stone-400">Pantau seluruh kelas tanpa keliling</div>
                    </div>
                    <span className="text-xs text-emerald-400 font-mono">Buka →</span>
                  </button>

                  <button
                    onClick={() => setCurrentRole('siswa')}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-stone-200 group-hover:text-purple-300">
                        🎓 Aditia Pratama (Siswa Kelas 8-A)
                      </div>
                      <div className="text-[11px] text-stone-400">Lihat status kehadiran & bahan ajar</div>
                    </div>
                    <span className="text-xs text-purple-400 font-mono">Buka →</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ----------------- 2. VIEW: GURU MATA PELAJARAN (Presensi Kelas) ----------------- */}
        {currentRole === 'guru_mapel' && (
          <div className="space-y-6">
            
            {/* Header Greeting & Session Card */}
            <div className="bg-gradient-to-r from-cyan-950/40 via-[#0d1424] to-[#0a0f1d] border border-cyan-500/20 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      GURU MATA PELAJARAN
                    </span>
                    <span className="text-xs text-stone-400">NIP: 19850615 201001 1 012</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    Selamat Mengajar, Pak Hendra Gunawan, S.Pd
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-300 mt-1">
                    Mata Pelajaran: <span className="text-cyan-300 font-medium">{selectedSubject}</span> • SMPN 3 Cihampelas
                  </p>
                </div>

                {/* Sub-menu tabs for Guru */}
                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10 self-start md:self-auto">
                  <button
                    onClick={() => setActiveMenu('presensi')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      activeMenu === 'presensi' 
                        ? 'bg-cyan-500 text-black font-semibold' 
                        : 'text-stone-300 hover:bg-white/5'
                    }`}
                  >
                    <span>📋</span>
                    <span>Presensi Kelas</span>
                  </button>
                  <button
                    onClick={() => setActiveMenu('materi')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      activeMenu === 'materi' 
                        ? 'bg-cyan-500 text-black font-semibold' 
                        : 'text-stone-300 hover:bg-white/5'
                    }`}
                  >
                    <span>📚</span>
                    <span>Bahan Ajar (Proyektor)</span>
                  </button>
                  <button
                    onClick={() => setActiveMenu('cbt')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      activeMenu === 'cbt' 
                        ? 'bg-cyan-500 text-black font-semibold' 
                        : 'text-stone-300 hover:bg-white/5'
                    }`}
                  >
                    <span>💻</span>
                    <span>Bank Soal CBT</span>
                  </button>
                </div>
              </div>
            </div>

            {/* TAB: PRESENSI KELAS */}
            {activeMenu === 'presensi' && (
              <div className="space-y-6">
                
                {/* Selector Bar: Pilih Kelas & Status Sync */}
                <div className="bg-[#0c101a] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Select Rombel */}
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                      Pilih Kelas / Rombel:
                    </label>
                    <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                      {['7-A', '7-B', '8-A', '9-A'].map(clsId => (
                        <button
                          key={clsId}
                          onClick={() => setSelectedClassId(clsId)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                            selectedClassId === clsId
                              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                              : 'text-stone-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          Kelas {clsId}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sync Status Badge */}
                  <div className="flex items-center gap-3">
                    {currentClassSession?.isSubmitted ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Tersimpan & Terkirim ke Meja Piket ({currentClassSession.submittedAt})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>Belum Diabsen Hari Ini</span>
                      </div>
                    )}

                    {/* Quick Button: Semua Hadir */}
                    <button
                      onClick={handleSetAllHadir}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-stone-200 transition flex items-center gap-1.5"
                      title="Tandai seluruh siswa di kelas ini menjadi HADIR"
                    >
                      <span>⚡</span>
                      <span>Tandai Semua Hadir</span>
                    </button>
                  </div>
                </div>

                {/* LEGEND STATUS (Penjelasan Warna yang Jelas untuk Guru) */}
                <div className="flex flex-wrap items-center gap-2 text-xs bg-black/20 p-3 rounded-xl border border-white/5">
                  <span className="text-stone-400 font-semibold mr-1">Petunjuk Status:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">H = Hadir</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold">S = Sakit</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">I = Izin</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold">A = Alpa</span>
                  <span className="px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-orange-300 font-bold">T = Terlambat</span>
                  <span className="text-stone-400 ml-auto hidden sm:inline text-[11px]">
                    *Klik tombol huruf pada siswa untuk mengganti status
                  </span>
                </div>

                {/* DAFTAR SISWA (Besar, Ramah Sentuhan Layar HP / Laptop Guru) */}
                <div className="bg-[#0b0f17] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Daftar Siswa {selectedClassId}</span>
                      <span className="text-xs font-normal text-stone-400">
                        ({currentClassStudents.length} Siswa Terdaftar)
                      </span>
                    </div>

                    <div className="text-xs text-stone-400">
                      Wali Kelas: <span className="text-stone-200 font-medium">
                        {SCHOOL_CLASSES.find(c => c.id === selectedClassId)?.waliKelas}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-white/5">
                    {currentClassStudents.map((student, idx) => {
                      const currentStatus = workingRecords[student.id] || 'H';
                      const currentNote = workingNotes[student.id] || '';

                      return (
                        <div 
                          key={student.id} 
                          className={`p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition ${
                            currentStatus !== 'H' ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'
                          }`}
                        >
                          {/* Student Identity */}
                          <div className="flex items-center gap-3 min-w-[240px]">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-cyan-300">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white flex items-center gap-2">
                                {student.name}
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                  student.gender === 'L' ? 'bg-blue-500/10 text-blue-300' : 'bg-pink-500/10 text-pink-300'
                                }`}>
                                  {student.gender === 'L' ? 'L' : 'P'}
                                </span>
                              </div>
                              <div className="text-[11px] text-stone-400 font-mono">
                                NISN: {student.nisn}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons for Status (H, S, I, A, T) */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* HADIR */}
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, 'H')}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                currentStatus === 'H'
                                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400'
                                  : 'bg-white/5 text-stone-300 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/5'
                              }`}
                            >
                              <span>Hadir</span>
                              {currentStatus === 'H' && <span>✓</span>}
                            </button>

                            {/* SAKIT */}
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, 'S')}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                currentStatus === 'S'
                                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                                  : 'bg-white/5 text-stone-300 hover:bg-blue-500/20 hover:text-blue-300 border border-white/5'
                              }`}
                            >
                              <span>Sakit</span>
                              {currentStatus === 'S' && <span>✓</span>}
                            </button>

                            {/* IZIN */}
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, 'I')}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                currentStatus === 'I'
                                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-400'
                                  : 'bg-white/5 text-stone-300 hover:bg-amber-500/20 hover:text-amber-300 border border-white/5'
                              }`}
                            >
                              <span>Izin</span>
                              {currentStatus === 'I' && <span>✓</span>}
                            </button>

                            {/* ALPA */}
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, 'A')}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                currentStatus === 'A'
                                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400'
                                  : 'bg-white/5 text-stone-300 hover:bg-rose-500/20 hover:text-rose-300 border border-white/5'
                              }`}
                            >
                              <span>Alpa</span>
                              {currentStatus === 'A' && <span>✓</span>}
                            </button>

                            {/* TERLAMBAT */}
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, 'T')}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                currentStatus === 'T'
                                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/30 ring-2 ring-orange-400'
                                  : 'bg-white/5 text-stone-300 hover:bg-orange-500/20 hover:text-orange-300 border border-white/5'
                              }`}
                            >
                              <span>Telat</span>
                              {currentStatus === 'T' && <span>✓</span>}
                            </button>
                          </div>

                          {/* Keterangan / Note (Otomatis muncul jika tidak hadir) */}
                          <div className="w-full md:w-64">
                            <input
                              type="text"
                              value={currentNote}
                              onChange={(e) => handleSetStudentNote(student.id, e.target.value)}
                              placeholder={
                                currentStatus === 'S' ? 'Contoh: Surat dokter ada' :
                                currentStatus === 'I' ? 'Contoh: Izin acara keluarga' :
                                currentStatus === 'T' ? 'Contoh: Ban motor bocor' :
                                currentStatus === 'A' ? 'Tanpa kabar' :
                                'Catatan (opsional)...'
                              }
                              className={`w-full px-3 py-1.5 text-xs rounded-xl bg-black/40 border text-stone-200 focus:outline-none transition ${
                                currentStatus !== 'H' 
                                  ? 'border-white/20 focus:border-cyan-400 bg-white/[0.03]' 
                                  : 'border-white/5 opacity-60 focus:opacity-100'
                              }`}
                            />
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* BOTTOM STICKY ACTION BAR */}
                  <div className="p-4 sm:p-5 bg-[#090d15] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-stone-400 text-center sm:text-left">
                      💡 Setelah selesai memeriksa kehadiran, klik tombol <span className="text-cyan-300 font-semibold">Simpan</span> agar data otomatis masuk ke Meja Piket.
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={handleSaveAttendance}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-sm hover:opacity-95 transition shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Simpan & Sinkronkan ke Meja Piket</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB: BAHAN AJAR / MODUL TAYANG PROYEKTOR */}
            {activeMenu === 'materi' && (
              <div className="bg-[#0c101a] border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">Bahan Ajar & Modul Tayang Proyektor</h2>
                    <p className="text-xs text-stone-400">
                      Tampilkan slide materi ini di layar proyektor kelas atau bagikan ke siswa untuk belajar di rumah.
                    </p>
                  </div>
                  <button 
                    onClick={() => showToast('Fitur unggah modul ajar baru siap dikembangkan!', 'info')}
                    className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/20 transition"
                  >
                    + Tambah Modul Baru
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      title: 'Bab 1: Struktur Sel & Mikroskop',
                      mapel: 'IPA Kelas 7',
                      fileType: 'PDF Presentation (14 Slide)',
                      size: '4.2 MB',
                      date: '24 Sep 2026',
                    },
                    {
                      title: 'Bab 2: Interaksi Antar Makhluk Hidup',
                      mapel: 'IPA Kelas 7',
                      fileType: 'Video Edukasi YouTube & Kuis',
                      size: '15 Menit',
                      date: '20 Sep 2026',
                    },
                    {
                      title: 'BSE Resmi Kurikulum Merdeka (Buku Pegangan)',
                      mapel: 'IPA Kelas 7 & 8',
                      fileType: 'E-Book Kemendikbud Lengkap',
                      size: '28 MB',
                      date: '10 Sep 2026',
                    }
                  ].map((m, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-400/30 transition flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">
                          {m.mapel}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-2">{m.title}</h3>
                        <p className="text-xs text-stone-400 mt-1">{m.fileType}</p>
                      </div>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-stone-400">{m.size}</span>
                        <button 
                          onClick={() => showToast('Membuka bahan ajar di mode layar penuh proyektor...', 'success')}
                          className="text-cyan-400 hover:underline font-semibold"
                        >
                          Tayangkan ↗
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: BANK SOAL & CBT */}
            {activeMenu === 'cbt' && (
              <div className="bg-[#0c101a] border border-white/10 rounded-2xl p-6 text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 mx-auto flex items-center justify-center text-2xl">
                  💻
                </div>
                <h3 className="text-lg font-bold text-white">Bank Soal & Asesmen CBT Lab Komputer</h3>
                <p className="text-xs text-stone-400 max-w-lg mx-auto leading-relaxed">
                  Modul ini disiapkan untuk Asesmen Sumatif (STS/SAS) di Laboratorium Komputer sekolah. Siswa dapat login menggunakan NISN di komputer lab tanpa memerlukan handphone.
                </p>
                <div className="pt-2">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-semibold border border-cyan-500/20">
                    Fase Berikutnya: Siap Terhubung ke Bank Soal
                  </span>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ----------------- 3. VIEW: GURU PIKET (RUANG KONTROL MEJA PIKET) ----------------- */}
        {currentRole === 'guru_piket' && (
          <div className="space-y-6">

            {/* Piket Header Banner */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-[#0d1d17] to-[#0a1310] border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      PUSAT KONTROL PIKET SEKOLAH
                    </span>
                    <span className="text-xs text-stone-400">Petugas: Dra. Siti Aminah, M.Pd</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    Monitoring Kehadiran Seluruh Kelas
                  </h1>
                  <p className="text-xs sm:text-sm text-emerald-300/80 mt-1 font-medium">
                    ✨ Guru piket <span className="text-white font-bold underline">tidak perlu berkeliling kelas</span>. Data kehadiran otomatis terisi begitu guru mapel mengabsen di ruang kelas.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const stored = getStoredAttendance();
                      setAttendanceData(stored);
                      showToast('Data kehadiran seluruh kelas berhasil diperbarui!', 'success');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                  >
                    <span>🔄 Refresh Data Live</span>
                  </button>
                </div>
              </div>
            </div>

            {/* TOP STATS CARDS: REKAP SATU SEKOLAH DALAM DETIK ITU JUGA */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 rounded-xl bg-[#0c1017] border border-white/10">
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Total Siswa</div>
                <div className="text-2xl font-black text-white mt-1">288</div>
                <div className="text-[10px] text-stone-400 mt-0.5">9 Rombel Terdata</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Hadir (H)</div>
                <div className="text-2xl font-black text-emerald-300 mt-1">{schoolStats.hadir}</div>
                <div className="text-[10px] text-emerald-400/80 mt-0.5">Siswa di Kelas</div>
              </div>

              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30">
                <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">Sakit (S)</div>
                <div className="text-2xl font-black text-blue-300 mt-1">{schoolStats.sakit}</div>
                <div className="text-[10px] text-blue-400/80 mt-0.5">Ada Keterangan</div>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Izin (I)</div>
                <div className="text-2xl font-black text-amber-300 mt-1">{schoolStats.izin}</div>
                <div className="text-[10px] text-amber-400/80 mt-0.5">Ada Surat/Izin</div>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
                <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Alpa (A)</div>
                <div className="text-2xl font-black text-rose-300 mt-1">{schoolStats.alpa}</div>
                <div className="text-[10px] text-rose-400/80 mt-0.5">Tanpa Keterangan</div>
              </div>

              <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-500/30">
                <div className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">Terlambat (T)</div>
                <div className="text-2xl font-black text-orange-300 mt-1">{schoolStats.terlambat}</div>
                <div className="text-[10px] text-orange-400/80 mt-0.5">Dicatat di Gerbang</div>
              </div>
            </div>

            {/* DUA KOLOM: PETA KELAS (KIRI) & POS MEJA PIKET / SISWA TELAT (KANAN) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* KOLOM KIRI (2/3): PETA KELAS (LIVE GRID MONITORING) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Peta Status Seluruh Rombel</span>
                    <span className="text-xs font-normal text-stone-400">(Live Status Hari Ini)</span>
                  </h2>
                  <div className="text-xs flex items-center gap-2">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Sudah Diabsen
                    </span>
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Belum Diabsen
                    </span>
                  </div>
                </div>

                {/* Grid Rombel Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {SCHOOL_CLASSES.map(cls => {
                    const session = attendanceData[cls.id];
                    const isDone = session?.isSubmitted;
                    const students = INITIAL_STUDENTS.filter(s => s.classId === cls.id);
                    
                    // Count anomalies (S, I, A, T)
                    let sick = 0, leave = 0, absent = 0, late = 0;
                    students.forEach(st => {
                      const stStatus = session?.records?.[st.id];
                      if (stStatus === 'S') sick++;
                      if (stStatus === 'I') leave++;
                      if (stStatus === 'A') absent++;
                      if (stStatus === 'T') late++;
                    });

                    return (
                      <div
                        key={cls.id}
                        onClick={() => handleOpenPiketClassModal(cls.id)}
                        className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden group ${
                          isDone 
                            ? 'bg-[#0a1310] border-emerald-500/30 hover:border-emerald-400/60 shadow-lg shadow-emerald-950/20' 
                            : 'bg-[#15120a] border-amber-500/30 hover:border-amber-400/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                            {cls.name}
                          </span>
                          {isDone ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              🟢 Selesai Diabsen
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                              🟡 Belum Diabsen
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-stone-400 mb-3">
                          Wali: <span className="text-stone-300">{cls.waliKelas}</span>
                        </div>

                        {/* Summary Numbers inside Class Card */}
                        {isDone ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-black/40">
                              <span className="text-stone-400">Guru:</span>
                              <span className="font-semibold text-stone-200 truncate max-w-[130px]">
                                {session.teacherName.split(',')[0]}
                              </span>
                            </div>

                            <div className="grid grid-cols-4 gap-1 text-center font-mono text-[11px]">
                              <div className="p-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                S: {sick}
                              </div>
                              <div className="p-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                I: {leave}
                              </div>
                              <div className="p-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                                A: {absent}
                              </div>
                              <div className="p-1 rounded bg-orange-500/10 text-orange-300 border border-orange-500/20">
                                T: {late}
                              </div>
                            </div>
                            <div className="text-[10px] text-stone-400 text-right">
                              Diabsen jam: <span className="font-mono text-stone-300">{session.submittedAt}</span>
                            </div>
                            <div className="pt-1 flex items-center justify-between text-[11px]">
                              <span className="text-cyan-400 font-semibold group-hover:underline">
                                ✏️ Periksa / Koreksi →
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-2 text-center space-y-2.5">
                            <span className="text-xs text-amber-400/90 font-medium block">
                              Guru Belum Hadir / Jam Kosong
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPiketClassModal(cls.id);
                              }}
                              className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>📝</span>
                              <span>Absenkan sbg Piket</span>
                            </button>
                          </div>
                        )}

                        <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-center text-stone-400 group-hover:text-cyan-300 transition">
                          Klik kartu untuk buka presensi kelas ini
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KOLOM KANAN (1/3): POS MEJA PIKET (AKSI SISWA TELAT & SURAT IZIN) */}
              <div className="space-y-4">
                <div className="bg-[#0e131d] border border-white/10 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-300 flex items-center justify-center font-bold text-xs">
                      ⏱️
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">Pos Cepat Meja Piket</h3>
                      <p className="text-[11px] text-stone-400">Catat Siswa Terlambat & Titipan Surat Sakit</p>
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 mb-4 leading-relaxed">
                    Jika ada siswa baru datang di gerbang atau orang tua menitipkan surat dokter, petugas piket langsung input di sini. <span className="text-emerald-300 font-medium">Status di kelas otomatis berubah detik itu juga!</span>
                  </p>

                  <form onSubmit={handlePiketActionSubmit} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-stone-300 font-semibold mb-1">
                        1. Pilih Kelas Siswa:
                      </label>
                      <select
                        value={piketSelectedClass}
                        onChange={(e) => {
                          setPiketSelectedClass(e.target.value);
                          const firstStudent = INITIAL_STUDENTS.find(s => s.classId === e.target.value);
                          if (firstStudent) setPiketSelectedStudentId(firstStudent.id);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-emerald-400 transition"
                      >
                        {SCHOOL_CLASSES.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.waliKelas})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-300 font-semibold mb-1">
                        2. Pilih Nama Siswa:
                      </label>
                      <select
                        value={piketSelectedStudentId}
                        onChange={(e) => setPiketSelectedStudentId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-emerald-400 transition"
                      >
                        {INITIAL_STUDENTS.filter(s => s.classId === piketSelectedClass).map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.gender})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-300 font-semibold mb-1">
                        3. Status yang Dicatat:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setPiketActionStatus('T'); setPiketActionNote('Terlambat sampai gerbang'); }}
                          className={`py-2 rounded-lg font-bold text-center border transition ${
                            piketActionStatus === 'T'
                              ? 'bg-orange-500 text-black border-orange-400 shadow-md shadow-orange-500/20'
                              : 'bg-white/5 text-stone-300 border-white/5 hover:bg-white/10'
                          }`}
                        >
                          Terlambat (T)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPiketActionStatus('S'); setPiketActionNote('Surat dokter diserahkan ke piket'); }}
                          className={`py-2 rounded-lg font-bold text-center border transition ${
                            piketActionStatus === 'S'
                              ? 'bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/20'
                              : 'bg-white/5 text-stone-300 border-white/5 hover:bg-white/10'
                          }`}
                        >
                          Sakit (S)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPiketActionStatus('I'); setPiketActionNote('Surat izin dari orang tua'); }}
                          className={`py-2 rounded-lg font-bold text-center border transition ${
                            piketActionStatus === 'I'
                              ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                              : 'bg-white/5 text-stone-300 border-white/5 hover:bg-white/10'
                          }`}
                        >
                          Izin (I)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-300 font-semibold mb-1">
                        4. Catatan Piket:
                      </label>
                      <input
                        type="text"
                        value={piketActionNote}
                        onChange={(e) => setPiketActionNote(e.target.value)}
                        placeholder="Contoh: Terlambat karena kendaraan mogok..."
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-emerald-400 transition"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Update Status via Meja Piket</span>
                      <span>→</span>
                    </button>
                  </form>
                </div>

                {/* Info Card for Duty Teachers */}
                <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs space-y-2">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <span>💡 Tips Efisiensi Jam Piket:</span>
                  </div>
                  <p className="text-stone-300 text-[11px] leading-relaxed">
                    Jika ada kelas yang masih berwarna kuning setelah jam 07.30, guru piket bisa langsung mengonfirmasi ketua kelas atau menugaskan guru pengganti (inval).
                  </p>
                </div>
              </div>

            </div>

            {/* MODAL DETAIL & INPUT PRESENSI KELAS OLEH GURU PIKET */}
            {detailModalClassId && (
              <div 
                data-lenis-prevent="true"
                data-lenis-prevent-wheel="true"
                data-lenis-prevent-touch="true"
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-text"
                onClick={() => setDetailModalClassId(null)}
              >
                <div 
                  data-lenis-prevent="true"
                  data-lenis-prevent-wheel="true"
                  data-lenis-prevent-touch="true"
                  className="bg-[#0f141f] border border-white/20 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  
                  {/* Modal Header */}
                  <div className="p-5 border-b border-white/10 bg-white/[0.02] flex-shrink-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          🏢 MODE PIKET
                        </span>
                        <h3 className="text-lg font-bold text-white">
                          Presensi & Rincian {detailModalClassId}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          attendanceData[detailModalClassId]?.isSubmitted 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {attendanceData[detailModalClassId]?.isSubmitted ? 'Sudah Diabsen' : 'Belum Diabsen (Bisa Diabsenkan Piket)'}
                        </span>
                      </div>
                      <button
                        onClick={() => setDetailModalClassId(null)}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-300 pt-1">
                      <p>
                        Wali Kelas: <span className="font-semibold text-white">{SCHOOL_CLASSES.find(c => c.id === detailModalClassId)?.waliKelas}</span>
                        {attendanceData[detailModalClassId]?.teacherName && (
                          <span> • Pengabsen sebelumnya: <span className="text-cyan-300">{attendanceData[detailModalClassId]?.teacherName}</span></span>
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={handleSetPiketAllHadir}
                        className="self-start sm:self-auto px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-stone-200 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>⚡</span>
                        <span>Tandai Semua Hadir</span>
                      </button>
                    </div>
                  </div>

                  {/* Petunjuk Guru Piket */}
                  <div className="px-5 py-2.5 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-400">
                    <span className="text-emerald-300 font-medium">
                      💡 Klik tombol status pada siswa jika ada yang Sakit/Izin/Alpa/Telat, lalu klik "Simpan Presensi".
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <span className="text-emerald-400">H: Hadir</span> •
                      <span className="text-blue-400">S: Sakit</span> •
                      <span className="text-amber-400">I: Izin</span> •
                      <span className="text-rose-400">A: Alpa</span> •
                      <span className="text-orange-400">T: Telat</span>
                    </div>
                  </div>

                  {/* Modal Content (Daftar Siswa Interaktif untuk Piket) */}
                  <div 
                    data-lenis-prevent="true"
                    data-lenis-prevent-wheel="true"
                    data-lenis-prevent-touch="true"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    className="p-5 overflow-y-auto overscroll-contain flex-1 min-h-0 space-y-3 divide-y divide-white/5 text-xs select-text [scrollbar-width:thin] [scrollbar-color:rgba(56,189,248,0.5)_rgba(255,255,255,0.04)] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-white/[0.02] [&::-webkit-scrollbar-thumb]:bg-cyan-500/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400"
                  >
                    {INITIAL_STUDENTS.filter(s => s.classId === detailModalClassId).map((student, idx) => {
                      const currentStatus = piketModalRecords[student.id] || 'H';
                      const currentNote = piketModalNotes[student.id] || '';

                      return (
                        <div key={student.id} className="pt-3 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          {/* Nama Siswa */}
                          <div className="flex items-center gap-2.5 min-w-[200px]">
                            <span className="w-5 text-stone-400 font-mono">{idx + 1}.</span>
                            <div>
                              <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                                <span>{student.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                  student.gender === 'L' ? 'bg-blue-500/10 text-blue-300' : 'bg-pink-500/10 text-pink-300'
                                }`}>
                                  {student.gender}
                                </span>
                              </div>
                              <span className="text-stone-400 text-[10px] font-mono">NISN: {student.nisn}</span>
                            </div>
                          </div>

                          {/* Tombol Status Interaktif untuk Piket */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* H */}
                            <button
                              type="button"
                              onClick={() => handleSetPiketStudentStatus(student.id, 'H')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                currentStatus === 'H'
                                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                                  : 'bg-white/5 text-stone-300 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/5'
                              }`}
                            >
                              <span>Hadir</span>
                              {currentStatus === 'H' && <span>✓</span>}
                            </button>

                            {/* S */}
                            <button
                              type="button"
                              onClick={() => handleSetPiketStudentStatus(student.id, 'S')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                currentStatus === 'S'
                                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400'
                                  : 'bg-white/5 text-stone-300 hover:bg-blue-500/20 hover:text-blue-300 border border-white/5'
                              }`}
                            >
                              <span>Sakit</span>
                              {currentStatus === 'S' && <span>✓</span>}
                            </button>

                            {/* I */}
                            <button
                              type="button"
                              onClick={() => handleSetPiketStudentStatus(student.id, 'I')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                currentStatus === 'I'
                                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30 ring-2 ring-amber-400'
                                  : 'bg-white/5 text-stone-300 hover:bg-amber-500/20 hover:text-amber-300 border border-white/5'
                              }`}
                            >
                              <span>Izin</span>
                              {currentStatus === 'I' && <span>✓</span>}
                            </button>

                            {/* A */}
                            <button
                              type="button"
                              onClick={() => handleSetPiketStudentStatus(student.id, 'A')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                currentStatus === 'A'
                                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-400'
                                  : 'bg-white/5 text-stone-300 hover:bg-rose-500/20 hover:text-rose-300 border border-white/5'
                              }`}
                            >
                              <span>Alpa</span>
                              {currentStatus === 'A' && <span>✓</span>}
                            </button>

                            {/* T */}
                            <button
                              type="button"
                              onClick={() => handleSetPiketStudentStatus(student.id, 'T')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                currentStatus === 'T'
                                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/30 ring-2 ring-orange-400'
                                  : 'bg-white/5 text-stone-300 hover:bg-orange-500/20 hover:text-orange-300 border border-white/5'
                              }`}
                            >
                              <span>Telat</span>
                              {currentStatus === 'T' && <span>✓</span>}
                            </button>
                          </div>

                          {/* Kolom Catatan Piket */}
                          <div className="w-full md:w-56">
                            <input
                              type="text"
                              value={currentNote}
                              onChange={(e) => handleSetPiketStudentNote(student.id, e.target.value)}
                              placeholder={
                                currentStatus === 'S' ? 'Catatan sakit...' :
                                currentStatus === 'I' ? 'Catatan izin...' :
                                currentStatus === 'T' ? 'Alasan telat...' :
                                currentStatus === 'A' ? 'Tanpa kabar...' :
                                'Catatan (opsional)...'
                              }
                              className={`w-full px-2.5 py-1.5 text-xs rounded-xl bg-black/40 border text-stone-200 focus:outline-none transition ${
                                currentStatus !== 'H' 
                                  ? 'border-white/20 focus:border-emerald-400 bg-white/[0.03]' 
                                  : 'border-white/5 opacity-60 focus:opacity-100'
                              }`}
                            />
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* Modal Footer (Simpan oleh Guru Piket) */}
                  <div className="p-4 border-t border-white/10 bg-black/50 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                    <div className="text-xs text-stone-400 text-center sm:text-left">
                      Petugas pengesah: <span className="text-emerald-300 font-semibold">Dra. Siti Aminah, M.Pd (Piket)</span>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setDetailModalClassId(null)}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-xs hover:bg-white/15 transition cursor-pointer"
                      >
                        Tutup
                      </button>

                      <button
                        type="button"
                        onClick={handleSavePiketAttendance}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-xs transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>💾 Simpan Presensi (sbg Guru Piket)</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* ----------------- 4. VIEW: SISWA (PORTAL BELAJAR & NILAI) ----------------- */}
        {currentRole === 'siswa' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* Student Profile Card */}
            <div className="bg-gradient-to-r from-purple-950/40 via-[#160d24] to-[#0d0a17] border border-purple-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-2xl font-bold text-purple-300">
                    🎓
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        SISWA AKTIF
                      </span>
                      <span className="text-xs text-stone-400">Kelas 8-A • Rombel Pagi</span>
                    </div>
                    <h1 className="text-xl font-bold text-white">Aditia Pratama</h1>
                    <p className="text-xs text-stone-300 font-mono">NISN: 0084920192 • SMPN 3 Cihampelas</p>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-right">
                  <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Kehadiran Kamu</div>
                  <div className="text-lg font-black text-emerald-300">98.5% (Sangat Baik)</div>
                </div>
              </div>
            </div>

            {/* Quick Cards: Status Hari Ini & Materi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card Kehadiran Hari Ini */}
              <div className="p-5 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📅 Status Kehadiran Hari Ini</span>
                </h3>
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>✓</span> Terdaftar HADIR di Jam Pelajaran
                  </div>
                  <p className="text-stone-300 text-[11px]">
                    Diabsen oleh Bpk. Hendra Gunawan, S.Pd (Mapel IPA) dan tersinkron ke buku piket sekolah.
                  </p>
                </div>
                <div className="text-[11px] text-stone-400">
                  Total semester ini: Hadir 42x • Sakit 1x • Izin 0x • Alpa 0x
                </div>
              </div>

              {/* Card Bahan Ajar Mandiri di Rumah */}
              <div className="p-5 rounded-2xl bg-[#0c101a] border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📖 Buku & Modul Pelajaran</span>
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Buku Sekolah Elektronik (BSE) Kurikulum Merdeka resmi dapat diakses dan diunduh gratis untuk belajar di rumah bersama orang tua.
                </p>
                <div className="pt-1">
                  <button 
                    onClick={() => showToast('Membuka koleksi buku digital Kurikulum Merdeka...', 'info')}
                    className="w-full py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <span>📚 Buka Perpustakaan Digital</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Jadwal Pelajaran Hari Ini */}
            <div className="bg-[#0b0f17] border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">Jadwal Kelas 8-A Hari Ini</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-stone-400 font-mono">07.15 - 08.35 WIB</span>
                  <div className="font-bold text-white mt-1">Ilmu Pengetahuan Alam</div>
                  <div className="text-[11px] text-stone-400">Hendra Gunawan, S.Pd</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-stone-400 font-mono">08.35 - 09.55 WIB</span>
                  <div className="font-bold text-white mt-1">Matematika</div>
                  <div className="text-[11px] text-stone-400">Dra. Siti Aminah, M.Pd</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-stone-400 font-mono">10.15 - 11.35 WIB</span>
                  <div className="font-bold text-white mt-1">Bahasa Indonesia</div>
                  <div className="text-[11px] text-stone-400">Dra. Eni Rohaeni</div>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-white/5 bg-[#05070a] px-4 py-4 text-center text-xs text-stone-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 SMP Negeri 3 Cihampelas. Sistem Terpadu E-Learning & Presensi Sekolah.</span>
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-medium">Buku Piket Digital</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">CBT Lab Komputer</span>
            <span>•</span>
            <span className="text-purple-400 font-medium">Kurikulum Merdeka</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
