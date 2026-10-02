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
  getStoredSessions,
  saveSubjectSession,
  getStoredStudents,
  SubjectSession,
  Student
} from '@/lib/elearningData';
import {
  exportMapelAttendanceToExcel,
  exportSemesterAttendanceToExcel,
  exportSchoolDailyAttendanceToExcel
} from '@/lib/elearningExport';

// Isolated Clock to keep re-renders local and lightweight
const ELearningClock = React.memo(function ELearningClock() {
  const [time, setTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return <span className="font-mono text-stone-300 text-xs">{time || '...'}</span>;
});

export interface AuthUserSession {
  role: 'guru_mapel' | 'guru_piket' | 'siswa';
  name: string;
  nipOrNisn: string;
  subject?: string;
  classId?: string;
  gender?: string;
}

export default function ELearningPage() {
  // Active Authenticated User Session (null = show official login portal)
  const [currentUser, setCurrentUser] = useState<AuthUserSession | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Read saved session from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('spentic_elearning_session_v2');
      if (saved) {
        const parsed: AuthUserSession = JSON.parse(saved);
        if (parsed && parsed.role) {
          setCurrentUser(parsed);
          if (parsed.classId) {
            setSelectedClassId(parsed.classId);
          }
        }
      }
    } catch (e) {
      console.error('Failed reading session', e);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // Login Form Local State
  const [loginRole, setLoginRole] = useState<'guru' | 'piket' | 'siswa'>('guru');
  const [loginIdentifier, setLoginIdentifier] = useState<string>('19720412 199703 1 002');
  const [loginPassword, setLoginPassword] = useState<string>('spentic2026');

  // Realtime Attendance State (synced via localStorage)
  const [attendanceData, setAttendanceData] = useState<Record<string, ClassSessionAttendance>>({});
  
  // Active Tab inside Teacher view
  const [activeMenu, setActiveMenu] = useState<'presensi' | 'materi' | 'cbt'>('presensi');
  
  // Mapel Teacher & Class State
  const [selectedClassId, setSelectedClassId] = useState<string>('7-A');
  
  // Current active teacher derived from logged-in session, with graceful fallback
  const currentTeacher = currentUser && currentUser.role === 'guru_mapel'
    ? {
        nip: currentUser.nipOrNisn,
        name: currentUser.name,
        role: 'mapel' as const,
        subject: currentUser.subject || 'Bahasa Inggris',
        classes: ['7-A', '7-B', '8-A', '9-A']
      }
    : DEMO_TEACHERS[0];

  // Duty officer at Pos Meja Piket for the day (from official roster)
  const [piketDutyTeacher, setPiketDutyTeacher] = useState<string>('Rohidin, S.Pd.');
  
  // Stored Subject Sessions (for multi-session per mapel logging & exports)
  const [sessions, setSessions] = useState<SubjectSession[]>([]);
  
  // Students List (dynamic, synced with getStoredStudents and dashboard imports)
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  useEffect(() => {
    setAllStudents(getStoredStudents());
    const handleStudentsUpdate = () => setAllStudents(getStoredStudents());
    window.addEventListener('elearningStudentsUpdated', handleStudentsUpdate);
    return () => window.removeEventListener('elearningStudentsUpdated', handleStudentsUpdate);
  }, []);

  const activeStudents = allStudents.length > 0 ? allStudents : INITIAL_STUDENTS;
  
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

  // Load attendance data and sessions from storage
  useEffect(() => {
    const loadData = () => {
      const stored = getStoredAttendance();
      setAttendanceData(stored);
      const storedSess = getStoredSessions();
      setSessions(storedSess);
    };
    loadData();

    const handleDataUpdate = () => loadData();
    window.addEventListener('elearningAttendanceUpdated', handleDataUpdate);
    window.addEventListener('elearningSessionsUpdated', handleDataUpdate);
    return () => {
      window.removeEventListener('elearningAttendanceUpdated', handleDataUpdate);
      window.removeEventListener('elearningSessionsUpdated', handleDataUpdate);
    };
  }, []);

  // Sync working records when selected class changes
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const classSession = attendanceData[selectedClassId];
    const isTodaySession = classSession && classSession.date === todayStr;
    const studentsInClass = activeStudents.filter(s => s.classId === selectedClassId);
    
    const records: Record<string, AttendanceStatus> = {};
    const notes: Record<string, string> = {};

    studentsInClass.forEach(student => {
      if (isTodaySession && classSession?.records?.[student.id]) {
        records[student.id] = classSession.records[student.id];
        if (classSession.notes?.[student.id]) {
          notes[student.id] = classSession.notes[student.id];
        }
      } else {
        records[student.id] = 'H'; // Default setiap hari baru: otomatis HADIR
      }
    });

    setWorkingRecords(records);
    setWorkingNotes(notes);
  }, [selectedClassId, attendanceData]);

  // Authentication & Session Management
  const handleLogin = (user: AuthUserSession) => {
    setCurrentUser(user);
    if (user.classId) {
      setSelectedClassId(user.classId);
    }
    try {
      localStorage.setItem('spentic_elearning_session_v2', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    showToast(`Selamat datang di SIAP SPENTIC, ${user.name}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('spentic_elearning_session_v2');
    } catch (e) {
      console.error(e);
    }
    showToast('Sesi Anda telah berhasil diakhiri.', 'info');
  };

  const switchLoginTab = (tab: 'guru' | 'piket' | 'siswa') => {
    setLoginRole(tab);
    if (tab === 'guru') {
      setLoginIdentifier('19720412 199703 1 002'); // Rohidin, S.Pd.
    } else if (tab === 'piket') {
      setLoginIdentifier('piketspentic');
    } else {
      setLoginIdentifier('0133138158');
    }
  };

  const handleFormLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (loginRole === 'guru') {
      const cleanId = loginIdentifier.replace(/\s+/g, '');
      const teacher = DEMO_TEACHERS.find(t => t.nip.replace(/\s+/g, '') === cleanId) || DEMO_TEACHERS[0];
      handleLogin({
        role: 'guru_mapel',
        name: teacher ? teacher.name : 'Dewan Guru SPENTIC',
        nipOrNisn: loginIdentifier,
        subject: teacher ? teacher.subject : 'Bahasa Inggris',
        classId: '7-A'
      });
    } else if (loginRole === 'piket') {
      handleLogin({
        role: 'guru_piket',
        name: 'Stasiun Meja Piket Utama',
        nipOrNisn: 'POSKO-PIKET',
        subject: 'Pusat Monitoring Rombel'
      });
    } else if (loginRole === 'siswa') {
      const cleanId = loginIdentifier.trim();
      const student = activeStudents.find(s => s.nisn === cleanId) || activeStudents[0];
      handleLogin({
        role: 'siswa',
        name: student ? student.name : 'Abdul Hanan',
        nipOrNisn: student ? student.nisn : cleanId,
        classId: student ? student.classId : '7-A'
      });
    }
  };

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
    const studentsInClass = activeStudents.filter(s => s.classId === selectedClassId);
    const updated: Record<string, AttendanceStatus> = {};
    studentsInClass.forEach(s => {
      updated[s.id] = 'H';
    });
    setWorkingRecords(updated);
    showToast('Seluruh siswa berhasil ditandai HADIR (H)', 'info');
  };

  // Save attendance from Guru Mapel (Saves to both Active Daily Attendance & Subject Sessions Log)
  const handleSaveAttendance = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const today = now.toISOString().split('T')[0];

    const updatedData = { ...attendanceData };
    updatedData[selectedClassId] = {
      classId: selectedClassId,
      date: today,
      subject: currentTeacher.subject,
      teacherName: currentTeacher.name,
      teacherNip: currentTeacher.nip,
      isSubmitted: true,
      submittedAt: timeString,
      records: workingRecords,
      notes: workingNotes,
    };

    saveStoredAttendance(updatedData);
    setAttendanceData(updatedData);

    // Save individual session log for this teacher & mapel
    const newSession: SubjectSession = {
      id: `${today}_${selectedClassId}_${encodeURIComponent(currentTeacher.subject)}`,
      classId: selectedClassId,
      date: today,
      subject: currentTeacher.subject,
      teacherName: currentTeacher.name,
      teacherNip: currentTeacher.nip,
      submittedAt: timeString,
      records: { ...workingRecords },
      notes: { ...workingNotes }
    };
    saveSubjectSession(newSession);

    showToast(`Presensi ${currentTeacher.subject} kelas ${selectedClassId} berhasil disimpan (${timeString})!`, 'success');
  };

  // Export Mapel Attendance to Excel (.xlsx) - Jurnal Harian
  const handleExportMapelExcel = () => {
    const studentsInClass = activeStudents.filter(s => s.classId === selectedClassId);
    const cls = SCHOOL_CLASSES.find(c => c.id === selectedClassId);
    const today = new Date().toISOString().split('T')[0];

    exportMapelAttendanceToExcel({
      classId: selectedClassId,
      className: cls?.name || `Kelas ${selectedClassId}`,
      subject: currentTeacher.subject,
      teacherName: currentTeacher.name,
      teacherNip: currentTeacher.nip,
      date: today,
      students: studentsInClass,
      records: workingRecords,
      notes: workingNotes
    });

    showToast(`File Excel Jurnal Presensi ${currentTeacher.subject} (${selectedClassId}) berhasil diunduh!`, 'success');
  };

  // Export Semester Attendance Recap (P1 - P16) to Excel (.xlsx)
  const handleExportSemesterExcel = () => {
    const studentsInClass = activeStudents.filter(s => s.classId === selectedClassId);
    const cls = SCHOOL_CLASSES.find(c => c.id === selectedClassId);

    exportSemesterAttendanceToExcel({
      classId: selectedClassId,
      className: cls?.name || `Kelas ${selectedClassId}`,
      subject: currentTeacher.subject,
      teacherName: currentTeacher.name,
      teacherNip: currentTeacher.nip,
      semesterName: 'Semester Ganjil TP. 2026/2027',
      students: studentsInClass,
      currentRecords: workingRecords,
      sessions: sessions
    });

    showToast(`File Rekap Semester (P1-P16) ${currentTeacher.subject} (${selectedClassId}) berhasil diunduh!`, 'success');
  };

  // Export School Daily Attendance to Excel (.xlsx) for Meja Piket
  const handleExportPiketExcel = () => {
    const today = new Date().toISOString().split('T')[0];
    exportSchoolDailyAttendanceToExcel({
      date: today,
      classes: SCHOOL_CLASSES,
      attendanceData: attendanceData,
      students: activeStudents,
      sessions: sessions
    });

    showToast(`File Rekap Harian Sekolah (.xlsx) berhasil diunduh!`, 'success');
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
    const updatedNotes = { ...currentSession.notes, [piketSelectedStudentId]: `${piketActionNote} (via Meja Piket jam ${timeString} - Petugas: ${piketDutyTeacher})` };

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
    const todayStr = new Date().toISOString().split('T')[0];
    const session = attendanceData[classId];
    const isTodaySession = session && session.date === todayStr;
    const studentsInClass = INITIAL_STUDENTS.filter(s => s.classId === classId);
    const records: Record<string, AttendanceStatus> = {};
    const notes: Record<string, string> = {};

    studentsInClass.forEach(student => {
      if (isTodaySession && session?.records?.[student.id]) {
        records[student.id] = session.records[student.id];
        if (session.notes?.[student.id]) {
          notes[student.id] = session.notes[student.id];
        }
      } else {
        records[student.id] = 'H'; // Default setiap hari baru: otomatis HADIR
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
        teacherName: `${piketDutyTeacher} (Guru Piket / Inval)`,
        teacherNip: '19780214 200501 2 008',
        isSubmitted: true,
        submittedAt: timeString,
        records: piketModalRecords,
        notes: piketModalNotes,
      }
    };

    saveStoredAttendance(updatedData);
    setAttendanceData(updatedData);
    showToast(`Presensi Kelas ${detailModalClassId} berhasil disimpan & disahkan oleh ${piketDutyTeacher}!`, 'success');
    setDetailModalClassId(null); // Tutup pop-up otomatis setelah berhasil simpan
  };

  // Calculate stats for Piket Dashboard
  const calculateSchoolStats = () => {
    let totalAssigned = 0;
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    let terlambat = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    SCHOOL_CLASSES.forEach(cls => {
      const session = attendanceData[cls.id];
      const isTodaySession = session && session.date === todayStr && session.isSubmitted;
      const students = activeStudents.filter(s => s.classId === cls.id);
      
      students.forEach(st => {
        totalAssigned++;
        const status = isTodaySession ? (session?.records?.[st.id] || 'H') : null;
        if (status === 'H') hadir++;
        else if (status === 'S') sakit++;
        else if (status === 'I') izin++;
        else if (status === 'A') alpa++;
        else if (status === 'T') terlambat++;
        else hadir++; // Default hadir jika belum ada laporan absen
      });
    });

    return { totalAssigned, hadir, sakit, izin, alpa, terlambat };
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const schoolStats = calculateSchoolStats();
  const currentClassStudents = activeStudents.filter(s => s.classId === selectedClassId);
  const currentClassSession = attendanceData[selectedClassId]?.date === todayStr ? attendanceData[selectedClassId] : null;

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
      <header className="sticky top-0 z-40 bg-[#0c1017]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo & School Identity */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 flex items-center justify-center transition-transform group-hover:scale-105">
                <Image src="/logo.png" alt="Logo SMPN 3 Cihampelas" fill className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white tracking-wide group-hover:text-cyan-300 transition flex items-center gap-2">
                  SIAP SPENTIC
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono">PRESENSI</span>
                </div>
                <div className="text-[11px] text-stone-400">SMP Negeri 3 Cihampelas</div>
              </div>
            </Link>

            {/* Back to Home Link (Mobile) */}
            <Link 
              href="/" 
              className="sm:hidden text-xs text-stone-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10"
            >
              ← Web Utama
            </Link>
          </div>

          {/* Right Header Navigation: Differentiates Logged In vs Logged Out */}
          {currentUser ? (
            <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* Active User Identity Pill */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 shadow-sm">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  currentUser.role === 'guru_mapel' 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : currentUser.role === 'guru_piket'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}>
                  {currentUser.role === 'guru_mapel' ? '👨‍🏫' : currentUser.role === 'guru_piket' ? '🏢' : '🎓'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="truncate max-w-[130px] sm:max-w-[180px]">{currentUser.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Akun Aktif" />
                  </div>
                  <div className="text-[10px] text-stone-400">
                    {currentUser.role === 'guru_mapel' && (currentUser.subject || 'Guru Mata Pelajaran')}
                    {currentUser.role === 'guru_piket' && 'Stasiun Meja Piket'}
                    {currentUser.role === 'siswa' && `Peserta Didik (Kelas ${currentUser.classId || '7-A'})`}
                  </div>
                </div>
              </div>

              {/* Digital WIB Clock (Desktop) */}
              <div className="hidden md:flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <ELearningClock />
              </div>

              {/* Red Official Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Keluar dari akun ini"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Keluar</span>
              </button>

              <Link 
                href="/" 
                className="hidden lg:block text-xs text-stone-400 hover:text-cyan-400 transition font-medium"
              >
                ← Web Utama
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-xs">
              <div className="bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <ELearningClock />
              </div>
              <Link 
                href="/" 
                className="text-stone-400 hover:text-cyan-400 transition font-medium flex items-center gap-1"
              >
                ← Kembali ke Web Utama
              </Link>
            </div>
          )}

        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">

        {/* ----------------- 1. VIEW: OFFICIAL LOGIN PORTAL (WHEN NOT LOGGED IN) ----------------- */}
        {!currentUser && (
          <div className="max-w-2xl mx-auto my-4 sm:my-8 space-y-6">
            
            {/* Main Login Card */}
            <div className="bg-[#0e131d] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              {/* Ambient Glows */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              {/* Institutional Header */}
              <div className="text-center mb-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-stone-300 font-mono mb-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  SISTEM INFORMASI AKADEMIK & PRESENSI (SIAP)
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Portal Masuk Terpadu
                </h1>
                <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-md mx-auto">
                  SMP Negeri 3 Cihampelas — Layanan Presensi Digital & KBM Online TP. 2026/2027
                </p>
              </div>

              {/* 3-Role Segmented Selector */}
              <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-black/60 rounded-2xl border border-white/10 mb-6 text-xs font-semibold relative z-10">
                <button 
                  type="button"
                  onClick={() => switchLoginTab('guru')}
                  className={`py-2.5 px-2 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                    loginRole === 'guru'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold shadow-lg shadow-cyan-500/20'
                      : 'text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm">👨‍🏫</span>
                  <span>Dewan Guru</span>
                </button>

                <button 
                  type="button"
                  onClick={() => switchLoginTab('piket')}
                  className={`py-2.5 px-2 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                    loginRole === 'piket'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-bold shadow-lg shadow-emerald-500/20'
                      : 'text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm">🏢</span>
                  <span>Pos Meja Piket</span>
                </button>

                <button 
                  type="button"
                  onClick={() => switchLoginTab('siswa')}
                  className={`py-2.5 px-2 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                    loginRole === 'siswa'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold shadow-lg shadow-purple-500/20'
                      : 'text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm">🎓</span>
                  <span>Peserta Didik</span>
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleFormLoginSubmit} className="space-y-4 relative z-10">
                
                {loginRole === 'guru' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1.5">
                        Nomor Induk Pegawai (NIP) / NUPTK Guru
                      </label>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                        placeholder="Contoh: 19850615 201001 1 012"
                        required
                      />
                      <span className="text-[11px] text-stone-400 mt-1 block">
                        *Akun terintegrasi otomatis dengan Data Pokok Pendidikan (Dapodik)
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1.5">
                        Kata Sandi Akun Guru
                      </label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                        placeholder="Masukkan kata sandi..."
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-sm hover:opacity-95 transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <span>Masuk ke Ruang Guru</span>
                      <span>→</span>
                    </button>
                  </>
                )}

                {loginRole === 'piket' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1.5">
                        ID Stasiun / Akun Pos Piket Sekolah
                      </label>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition font-mono"
                        placeholder="ID Stasiun Piket"
                        required
                      />
                      <span className="text-[11px] text-stone-400 mt-1 block">
                        *Digunakan bersama di meja piket lobi utama untuk memantau 17 rombel
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1.5">
                        Kata Sandi Petugas Piket
                      </label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
                        placeholder="Masukkan kata sandi stasiun..."
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-bold text-sm hover:opacity-95 transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <span>Buka Stasiun Meja Piket</span>
                      <span>→</span>
                    </button>
                  </>
                )}

                {loginRole === 'siswa' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1.5">
                        Nomor Induk Siswa Nasional (NISN)
                      </label>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition font-mono"
                        placeholder="Masukkan 10 digit NISN..."
                        required
                      />
                      <span className="text-[11px] text-stone-400 mt-1 block">
                        *Tertera pada rapor atau kartu pelajar SMP Negeri 3 Cihampelas
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1.5">
                        Tanggal Lahir / Kata Sandi Siswa
                      </label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                        placeholder="Format: TTTT-BB-HH atau sandi..."
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-sm hover:opacity-95 transition shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <span>Masuk Portal Peserta Didik</span>
                      <span>→</span>
                    </button>
                  </>
                )}

              </form>

              {/* Official Testing Profiles Section */}
              <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    Akses Cepat Pengujian Akun (Mode Evaluasi Resmi)
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">1-Klik Otentikasi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Rohidin, S.Pd. */}
                  <button
                    type="button"
                    onClick={() => handleLogin({
                      role: 'guru_mapel',
                      name: 'Rohidin, S.Pd.',
                      nipOrNisn: '19720412 199703 1 002',
                      subject: 'Bahasa Inggris',
                      classId: '7-A'
                    })}
                    className="text-left p-3 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/40 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                        👨‍🏫 Rohidin, S.Pd.
                      </div>
                      <span className="text-[10px] text-cyan-400 font-mono group-hover:translate-x-0.5 transition">Masuk →</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">PKS Kurikulum / B. Inggris • NIP 19720412...</div>
                  </button>

                  {/* Dedeh Komalasari, S.Pd. */}
                  <button
                    type="button"
                    onClick={() => handleLogin({
                      role: 'guru_mapel',
                      name: 'Dedeh Komalasari, S.Pd.',
                      nipOrNisn: '19680315 199412 2 001',
                      subject: 'Ilmu Pengetahuan Alam (IPA)',
                      classId: '7-A'
                    })}
                    className="text-left p-3 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/40 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                        👩‍🏫 Dedeh Komalasari, S.Pd.
                      </div>
                      <span className="text-[10px] text-cyan-400 font-mono group-hover:translate-x-0.5 transition">Masuk →</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">Ka. Lab / Guru IPA • NIP 19680315...</div>
                  </button>

                  {/* Yulia M. Ahmad, S.Pd. */}
                  <button
                    type="button"
                    onClick={() => handleLogin({
                      role: 'guru_mapel',
                      name: 'Yulia M. Ahmad, S.Pd.',
                      nipOrNisn: '19850210 200902 2 008',
                      subject: 'Matematika',
                      classId: '7-A'
                    })}
                    className="text-left p-3 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/40 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                        👩‍🏫 Yulia M. Ahmad, S.Pd.
                      </div>
                      <span className="text-[10px] text-cyan-400 font-mono group-hover:translate-x-0.5 transition">Masuk →</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">Guru Matematika • NIP 19850210...</div>
                  </button>

                  {/* Nunik Wahyuni, S.Pd. */}
                  <button
                    type="button"
                    onClick={() => handleLogin({
                      role: 'guru_mapel',
                      name: 'Nunik Wahyuni, S.Pd.',
                      nipOrNisn: '19750918 200003 2 002',
                      subject: 'Bahasa Indonesia',
                      classId: '7-A'
                    })}
                    className="text-left p-3 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/40 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                        👩‍🏫 Nunik Wahyuni, S.Pd.
                      </div>
                      <span className="text-[10px] text-cyan-400 font-mono group-hover:translate-x-0.5 transition">Masuk →</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">PKS Kesiswaan / B. Indonesia • NIP 19750918...</div>
                  </button>

                  {/* Ichsanul Arifin, S.Kom. */}
                  <button
                    type="button"
                    onClick={() => handleLogin({
                      role: 'guru_mapel',
                      name: 'Ichsanul Arifin, S.Kom.',
                      nipOrNisn: '19930115 201903 1 008',
                      subject: 'Informatika',
                      classId: '7-A'
                    })}
                    className="text-left p-3 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/40 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                        👨‍🏫 Ichsanul Arifin, S.Kom.
                      </div>
                      <span className="text-[10px] text-cyan-400 font-mono group-hover:translate-x-0.5 transition">Masuk →</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">Guru Informatika • NIP 19930115...</div>
                  </button>

                  {/* Posko Meja Piket */}
                  <button
                    type="button"
                    onClick={() => handleLogin({
                      role: 'guru_piket',
                      name: 'Stasiun Meja Piket Utama',
                      nipOrNisn: 'POSKO-PIKET',
                      subject: 'Pusat Monitoring Rombel'
                    })}
                    className="text-left p-3 rounded-xl bg-white/[0.03] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-400/40 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                        🏢 Stasiun Meja Piket
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono group-hover:translate-x-0.5 transition">Masuk →</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">Monitoring 17 Rombel & Gerbang</div>
                  </button>

                  {/* Abdul Hanan */}
                  <button
                    type="button"
                    onClick={() => handleLogin({
                      role: 'siswa',
                      name: 'Abdul Hanan',
                      nipOrNisn: '0133138158',
                      classId: '7-A'
                    })}
                    className="text-left p-3 rounded-xl bg-white/[0.03] hover:bg-purple-500/10 border border-white/10 hover:border-purple-400/40 transition group cursor-pointer sm:col-span-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white group-hover:text-purple-300">
                        🎓 Abdul Hanan (Peserta Didik)
                      </div>
                      <span className="text-[10px] text-purple-400 font-mono group-hover:translate-x-0.5 transition">Masuk →</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">Kelas 7-A • NISN: 0133138158 • Cek Kehadiran Pribadi & Modul BSE</div>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ----------------- 2. VIEW: GURU MATA PELAJARAN (Presensi Kelas) ----------------- */}
        {currentUser?.role === 'guru_mapel' && (
          <div className="space-y-4">
            
            {/* Top Bar: Title & Sub-tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Presensi KBM</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/30">
                    {currentTeacher.subject}
                  </span>
                </h1>
                <p className="text-xs text-stone-400 mt-0.5">
                  Pengampu: <span className="text-stone-200 font-semibold">{currentTeacher.name}</span> (NIP: {currentTeacher.nip}) • SMP Negeri 3 Cihampelas
                </p>
              </div>

              {/* Sub-tabs: Presensi / Bahan Ajar / CBT */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  onClick={() => setActiveMenu('presensi')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    activeMenu === 'presensi' 
                      ? 'bg-cyan-500 text-black font-bold' 
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Presensi
                </button>
                <button
                  onClick={() => setActiveMenu('materi')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    activeMenu === 'materi' 
                      ? 'bg-cyan-500 text-black font-bold' 
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Bahan Ajar
                </button>
                <button
                  onClick={() => setActiveMenu('cbt')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    activeMenu === 'cbt' 
                      ? 'bg-cyan-500 text-black font-bold' 
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Bank Soal
                </button>
              </div>
            </div>

            {/* TAB: PRESENSI KELAS */}
            {activeMenu === 'presensi' && (
              <div className="space-y-4">
                
                {/* Clean Toolbar: Class Selector & Quick Action */}
                <div className="bg-[#0c101a] border border-white/10 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-400 font-medium">Pilih Rombel / Kelas:</span>
                      <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-400/40 text-cyan-300 text-xs font-bold focus:outline-none focus:border-cyan-400 cursor-pointer shadow-sm"
                      >
                        {SCHOOL_CLASSES.map(cls => (
                          <option key={cls.id} value={cls.id} className="bg-stone-900 text-white">
                            {cls.name} ({cls.totalStudents} Siswa)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs">
                      <span className="text-cyan-400 font-semibold">Pengampu:</span>
                      <span className="text-white font-medium">{currentTeacher.name}</span>
                      <span className="text-stone-400">({currentTeacher.subject})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {currentClassSession?.isSubmitted ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Tersimpan ({currentClassSession.submittedAt})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Belum Diabsen
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={handleSetAllHadir}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-stone-200 transition cursor-pointer"
                      title="Tandai seluruh siswa menjadi HADIR"
                    >
                      ⚡ Semua Hadir
                    </button>
                  </div>
                </div>

                {/* Table Container */}
                <div className="bg-[#0b0f17] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                  <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-xs text-stone-400">
                    <span className="font-semibold text-white">
                      Daftar Siswa {selectedClassId} ({currentClassStudents.length})
                    </span>
                    <span className="hidden sm:inline font-mono text-[11px] text-stone-500">
                      <span className="text-emerald-400">H: Hadir</span> · <span className="text-blue-400">S: Sakit</span> · <span className="text-amber-400">I: Izin</span> · <span className="text-rose-400">A: Alpa</span> · <span className="text-orange-400">T: Telat</span>
                    </span>
                  </div>

                  <div className="divide-y divide-white/5">
                    {currentClassStudents.map((student, idx) => {
                      const currentStatus = workingRecords[student.id] || 'H';
                      const currentNote = workingNotes[student.id] || '';

                      return (
                        <div 
                          key={student.id} 
                          className={`px-4 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition ${
                            currentStatus !== 'H' ? 'bg-white/[0.03]' : 'hover:bg-white/[0.01]'
                          }`}
                        >
                          {/* Student Identity */}
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <span className="w-6 font-mono text-xs text-stone-500 text-center">{idx + 1}</span>
                            <div>
                              <div className="text-xs sm:text-sm font-medium text-white flex items-center gap-1.5">
                                <span>{student.name}</span>
                                {student.gender && student.gender !== '-' && (
                                  <span className="text-[10px] text-stone-500 font-mono">({student.gender})</span>
                                )}
                              </div>
                              <div className="text-[10px] text-stone-500 font-mono">
                                NISN: {student.nisn}
                              </div>
                            </div>
                          </div>

                          {/* 5 Compact Buttons [ H ] [ S ] [ I ] [ A ] [ T ] */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, 'H')}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                currentStatus === 'H'
                                  ? 'bg-emerald-500 text-black shadow-sm ring-2 ring-emerald-400'
                                  : 'bg-white/5 text-stone-400 hover:bg-emerald-500/20 hover:text-emerald-300'
                              }`}
                              title="Hadir"
                            >
                              H
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, 'S')}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                currentStatus === 'S'
                                  ? 'bg-blue-500 text-white shadow-sm ring-2 ring-blue-400'
                                  : 'bg-white/5 text-stone-400 hover:bg-blue-500/20 hover:text-blue-300'
                              }`}
                              title="Sakit"
                            >
                              S
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, 'I')}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                currentStatus === 'I'
                                  ? 'bg-amber-500 text-black shadow-sm ring-2 ring-amber-400'
                                  : 'bg-white/5 text-stone-400 hover:bg-amber-500/20 hover:text-amber-300'
                              }`}
                              title="Izin"
                            >
                              I
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, 'A')}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                currentStatus === 'A'
                                  ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-400'
                                  : 'bg-white/5 text-stone-400 hover:bg-rose-500/20 hover:text-rose-300'
                              }`}
                              title="Alpa"
                            >
                              A
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, 'T')}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                currentStatus === 'T'
                                  ? 'bg-orange-500 text-black shadow-sm ring-2 ring-orange-400'
                                  : 'bg-white/5 text-stone-400 hover:bg-orange-500/20 hover:text-orange-300'
                              }`}
                              title="Terlambat"
                            >
                              T
                            </button>
                          </div>

                          {/* Note input ONLY when status is NOT Hadir */}
                          <div className="w-full md:w-56">
                            {currentStatus !== 'H' ? (
                              <input
                                type="text"
                                value={currentNote}
                                onChange={(e) => handleSetStudentNote(student.id, e.target.value)}
                                placeholder={
                                  currentStatus === 'S' ? 'Alasan sakit...' :
                                  currentStatus === 'I' ? 'Alasan izin...' :
                                  currentStatus === 'T' ? 'Alasan terlambat...' :
                                  'Keterangan...'
                                }
                                className="w-full px-2.5 py-1 text-xs rounded-lg bg-white/[0.06] border border-white/20 text-white focus:outline-none focus:border-cyan-400 placeholder:text-stone-500 animate-[fadeIn_0.15s_ease-out]"
                              />
                            ) : (
                              <div className="hidden md:block text-right">
                                <span className="text-[11px] text-emerald-400/60 font-medium">Hadir</span>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* BOTTOM ACTION BAR */}
                  <div className="p-3.5 sm:p-4 bg-[#090d15] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleExportSemesterExcel}
                        className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Unduh Rekap 1 Semester (P1 s/d P16) untuk Nilai Rapor"
                      >
                        <span>📥</span>
                        <span>Rekap Semester</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportMapelExcel}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-stone-300 font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Unduh presensi harian hari ini"
                      >
                        <span>📄</span>
                        <span>Jurnal Hari Ini</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveAttendance}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold text-xs sm:text-sm hover:opacity-95 transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Simpan Presensi</span>
                    </button>
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
        {currentUser?.role === 'guru_piket' && (
          <div className="space-y-6">

            {/* Piket Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Pusat Meja Piket</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-medium">
                    Live Monitoring 17 Rombel
                  </span>
                </h1>
                <p className="text-xs text-stone-400 mt-0.5">
                  Stasiun Meja Piket & Gerbang Utama • SMP Negeri 3 Cihampelas
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 border border-emerald-500/30 text-xs">
                  <span className="text-stone-400 font-medium">Petugas Jaga:</span>
                  <select
                    value={piketDutyTeacher}
                    onChange={(e) => setPiketDutyTeacher(e.target.value)}
                    className="bg-transparent text-emerald-300 font-semibold focus:outline-none cursor-pointer max-w-[220px] truncate"
                  >
                    {DEMO_TEACHERS.map((teacher) => (
                      <option key={teacher.nip} value={teacher.name} className="bg-stone-900 text-white">
                        {teacher.name} ({teacher.subject})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleExportPiketExcel}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-medium text-xs transition flex items-center gap-1.5 cursor-pointer"
                  title="Unduh seluruh rekap presensi hari ini (.xlsx)"
                >
                  <span>📥</span>
                  <span>Export Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const stored = getStoredAttendance();
                    setAttendanceData(stored);
                    const storedSess = getStoredSessions();
                    setSessions(storedSess);
                    showToast('Data kehadiran diperbarui!', 'success');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🔄 Refresh</span>
                </button>
              </div>
            </div>

            {/* TOP STATS CARDS: CLEAN & MINIMALIST */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="p-3.5 rounded-xl bg-[#0c1017] border border-white/10">
                <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Total Siswa</div>
                <div className="text-xl font-bold text-white mt-0.5">{INITIAL_STUDENTS.length}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Hadir (H)</div>
                <div className="text-xl font-bold text-emerald-300 mt-0.5">{schoolStats.hadir}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30">
                <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Sakit (S)</div>
                <div className="text-xl font-bold text-blue-300 mt-0.5">{schoolStats.sakit}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Izin (I)</div>
                <div className="text-xl font-bold text-amber-300 mt-0.5">{schoolStats.izin}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
                <div className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">Alpa (A)</div>
                <div className="text-xl font-bold text-rose-300 mt-0.5">{schoolStats.alpa}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-orange-950/20 border border-orange-500/30">
                <div className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">Telat (T)</div>
                <div className="text-xl font-bold text-orange-300 mt-0.5">{schoolStats.terlambat}</div>
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
                    const isDone = Boolean(session?.isSubmitted && session?.date === todayStr);
                    const students = activeStudents.filter(s => s.classId === cls.id);
                    
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

                        <div className="text-[11px] text-stone-400 mb-3 flex items-center justify-between">
                          <span>Total: <span className="text-stone-300 font-semibold">{cls.totalStudents} Siswa</span></span>
                          <span className="text-[10px] text-stone-500 font-mono">2026/2027</span>
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
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                    <span className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-300 flex items-center justify-center font-bold text-xs">
                      ⏱️
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">Pos Gerbang / Piket</h3>
                      <p className="text-[11px] text-stone-400">Catat Siswa Telat atau Izin</p>
                    </div>
                  </div>

                  <form onSubmit={handlePiketActionSubmit} className="space-y-3 text-xs">
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
                          <option key={c.id} value={c.id}>{c.name} ({c.totalStudents} Siswa)</option>
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
                  className="bg-[#0f141f] border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
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
                        Total: <span className="font-semibold text-white">{activeStudents.filter(s => s.classId === detailModalClassId).length} Siswa</span>
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
                    {activeStudents.filter(s => s.classId === detailModalClassId).map((student, idx) => {
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
                                {student.gender && student.gender !== '-' && (
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                    student.gender === 'L' ? 'bg-blue-500/10 text-blue-300' : 'bg-pink-500/10 text-pink-300'
                                  }`}>
                                    {student.gender}
                                  </span>
                                )}
                              </div>
                              <span className="text-stone-400 text-[10px] font-mono">
                                NISN: {student.nisn} {student.nis ? `• NIS: ${student.nis}` : ''}
                              </span>
                            </div>
                          </div>

                          {/* Tombol Status Interaktif untuk Piket [ H ] [ S ] [ I ] [ A ] [ T ] */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSetPiketStudentStatus(student.id, 'H')}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                currentStatus === 'H'
                                  ? 'bg-emerald-500 text-black shadow-sm ring-2 ring-emerald-400'
                                  : 'bg-white/5 text-stone-400 hover:bg-emerald-500/20 hover:text-emerald-300'
                              }`}
                              title="Hadir"
                            >
                              H
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetPiketStudentStatus(student.id, 'S')}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                currentStatus === 'S'
                                  ? 'bg-blue-500 text-white shadow-sm ring-2 ring-blue-400'
                                  : 'bg-white/5 text-stone-400 hover:bg-blue-500/20 hover:text-blue-300'
                              }`}
                              title="Sakit"
                            >
                              S
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetPiketStudentStatus(student.id, 'I')}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                currentStatus === 'I'
                                  ? 'bg-amber-500 text-black shadow-sm ring-2 ring-amber-400'
                                  : 'bg-white/5 text-stone-400 hover:bg-amber-500/20 hover:text-amber-300'
                              }`}
                              title="Izin"
                            >
                              I
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetPiketStudentStatus(student.id, 'A')}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                currentStatus === 'A'
                                  ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-400'
                                  : 'bg-white/5 text-stone-400 hover:bg-rose-500/20 hover:text-rose-300'
                              }`}
                              title="Alpa"
                            >
                              A
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetPiketStudentStatus(student.id, 'T')}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                currentStatus === 'T'
                                  ? 'bg-orange-500 text-black shadow-sm ring-2 ring-orange-400'
                                  : 'bg-white/5 text-stone-400 hover:bg-orange-500/20 hover:text-orange-300'
                              }`}
                              title="Terlambat"
                            >
                              T
                            </button>
                          </div>

                          {/* Kolom Catatan Piket (Hanya saat siswa tidak Hadir) */}
                          <div className="w-full md:w-48 lg:w-52">
                            {currentStatus !== 'H' ? (
                              <input
                                type="text"
                                value={currentNote}
                                onChange={(e) => handleSetPiketStudentNote(student.id, e.target.value)}
                                placeholder={
                                  currentStatus === 'S' ? 'Catatan sakit...' :
                                  currentStatus === 'I' ? 'Catatan izin...' :
                                  currentStatus === 'T' ? 'Alasan telat...' :
                                  'Keterangan...'
                                }
                                className="w-full px-2.5 py-1 text-xs rounded-lg bg-white/[0.06] border border-white/20 text-white focus:outline-none focus:border-emerald-400 placeholder:text-stone-500 animate-[fadeIn_0.15s_ease-out]"
                              />
                            ) : (
                              <div className="hidden md:block text-right">
                                <span className="text-[11px] text-emerald-400/60 font-medium">Hadir</span>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* Modal Footer (Simpan oleh Guru Piket) */}
                  <div className="p-4 border-t border-white/10 bg-black/50 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                    <div className="text-xs text-stone-400 text-center sm:text-left">
                      Petugas pengesah: <span className="text-emerald-300 font-semibold">{piketDutyTeacher} (Piket)</span>
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
        {currentUser?.role === 'siswa' && (
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
                        PESERTA DIDIK AKTIF
                      </span>
                      <span className="text-xs text-stone-400">Kelas {currentUser.classId || '7-A'} • Semester Ganjil 2026/2027</span>
                    </div>
                    <h1 className="text-xl font-bold text-white">{currentUser.name}</h1>
                    <p className="text-xs text-stone-300 font-mono">NISN: {currentUser.nipOrNisn} • SMP Negeri 3 Cihampelas</p>
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
                    Diabsen oleh Bpk. Rohidin, S.Pd. (Mapel Bahasa Inggris) dan tersinkron ke buku piket sekolah.
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
              <h3 className="text-sm font-bold text-white">Jadwal Pelajaran Kelas {currentUser.classId || '7-A'} Hari Ini</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-stone-400 font-mono">07.15 - 08.35 WIB</span>
                  <div className="font-bold text-white mt-1">Bahasa Inggris</div>
                  <div className="text-[11px] text-stone-400">Rohidin, S.Pd.</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-stone-400 font-mono">08.35 - 09.55 WIB</span>
                  <div className="font-bold text-white mt-1">Ilmu Pengetahuan Alam</div>
                  <div className="text-[11px] text-stone-400">Dedeh Komalasari, S.Pd.</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-stone-400 font-mono">10.15 - 11.35 WIB</span>
                  <div className="font-bold text-white mt-1">Matematika</div>
                  <div className="text-[11px] text-stone-400">Yulia M. Ahmad, S.Pd.</div>
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
