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
  Student,
  Assignment,
  AssignmentSubmission,
  QuizQuestion,
  getStoredAssignments,
  saveStoredAssignment,
  deleteStoredAssignment,
  getStoredSubmissions,
  saveStoredSubmission
} from '@/lib/elearningData';
import {
  saveSubmissionFile,
  getSubmissionFile,
  dataUrlToBlobUrl
} from '@/lib/elearningStorage';
import {
  exportMapelAttendanceToExcel,
  exportSemesterAttendanceToExcel,
  exportSchoolDailyAttendanceToExcel,
  exportSchoolSemesterAttendanceToExcel
} from '@/lib/elearningExport';
import SubmissionSplitPreviewModal from '@/components/SubmissionSplitPreviewModal';
import CreateAssignmentModal from '@/components/CreateAssignmentModal';
import StudentSubmitModal from '@/components/StudentSubmitModal';

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

  return <span className="font-mono text-slate-700 font-semibold text-xs">{time || '...'}</span>;
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
  const [activeMenu, setActiveMenu] = useState<'presensi' | 'tugas' | 'materi' | 'cbt'>('presensi');
  
  // Assignments & Homework State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  
  // Assignment Modal & Form States (Teacher)
  const [isCreateAsgModalOpen, setIsCreateAsgModalOpen] = useState<boolean>(false);
  const [inspectAsgId, setInspectAsgId] = useState<string | null>(null);
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(90);
  const [gradingFeedback, setGradingFeedback] = useState<string>('');

  // Teacher Assignment Scope Filter (Rombel Terpilih vs Semua Rombel)
  const [teacherAsgScope, setTeacherAsgScope] = useState<'current_class' | 'all_classes'>('current_class');

  // Student Assignment Upload & Quiz States
  const [studentSubmitAsgId, setStudentSubmitAsgId] = useState<string | null>(null);
  const [studentSubjectFilter, setStudentSubjectFilter] = useState<string>('all');

  // Submission File Preview Modal State (for Teacher & Student)
  const [previewSubmission, setPreviewSubmission] = useState<{ sub: AssignmentSubmission; asg?: Assignment } | null>(null);
  
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

  // Load attendance data, sessions, assignments, and submissions from storage
  useEffect(() => {
    const loadData = () => {
      const stored = getStoredAttendance();
      setAttendanceData(stored);
      const storedSess = getStoredSessions();
      setSessions(storedSess);
      setAssignments(getStoredAssignments());
      setSubmissions(getStoredSubmissions());
    };
    loadData();

    const handleDataUpdate = () => loadData();
    window.addEventListener('elearningAttendanceUpdated', handleDataUpdate);
    window.addEventListener('elearningSessionsUpdated', handleDataUpdate);
    window.addEventListener('elearningAssignmentsUpdated', handleDataUpdate);
    window.addEventListener('elearningSubmissionsUpdated', handleDataUpdate);
    return () => {
      window.removeEventListener('elearningAttendanceUpdated', handleDataUpdate);
      window.removeEventListener('elearningSessionsUpdated', handleDataUpdate);
      window.removeEventListener('elearningAssignmentsUpdated', handleDataUpdate);
      window.removeEventListener('elearningSubmissionsUpdated', handleDataUpdate);
    };
  }, []);

  // Sync working records when selected class or current teacher changes (Isolated per Teacher & Subject)
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const studentsInClass = activeStudents.filter(s => s.classId === selectedClassId);
    
    // Look up this specific teacher's session for this class today
    const teacherNipClean = (currentTeacher?.nip || '').replace(/\s+/g, '');
    const mySession = sessions.find(s => 
      s.date === todayStr && 
      s.classId === selectedClassId && 
      (s.teacherNip.replace(/\s+/g, '') === teacherNipClean || s.subject.toLowerCase() === (currentTeacher?.subject || '').toLowerCase())
    );

    const records: Record<string, AttendanceStatus> = {};
    const notes: Record<string, string> = {};

    studentsInClass.forEach(student => {
      if (mySession && mySession.records?.[student.id]) {
        records[student.id] = mySession.records[student.id];
        if (mySession.notes?.[student.id]) {
          notes[student.id] = mySession.notes[student.id];
        }
      } else {
        records[student.id] = 'H'; // Default setiap sesi baru: otomatis HADIR
      }
    });

    setWorkingRecords(records);
    setWorkingNotes(notes);
  }, [selectedClassId, currentTeacher?.nip, currentTeacher?.subject, sessions, activeStudents]);

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
      const teacher = DEMO_TEACHERS.find(t => 
        t.nip.replace(/\s+/g, '') === cleanId || 
        t.name.toLowerCase() === loginIdentifier.trim().toLowerCase()
      ) || DEMO_TEACHERS[0];
      handleLogin({
        role: 'guru_mapel',
        name: teacher ? teacher.name : 'Dewan Guru SPENTIC',
        nipOrNisn: teacher ? teacher.nip : loginIdentifier,
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

  // Save attendance from Guru Mapel (Saves to isolated Subject Session & updates general daily log)
  const handleSaveAttendance = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const today = now.toISOString().split('T')[0];
    const teacherNipClean = (currentTeacher?.nip || '').replace(/\s+/g, '');

    // 1. Save individual isolated session log for this teacher & mapel
    const newSession: SubjectSession = {
      id: `${today}_${selectedClassId}_${teacherNipClean}`,
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

    // Immediately refresh local sessions state
    const updatedSessions = getStoredSessions();
    setSessions(updatedSessions);

    // 2. Also keep general attendanceData updated for Meja Piket live summary
    const updatedData = { ...attendanceData };
    updatedData[selectedClassId] = {
      classId: selectedClassId,
      date: today,
      subject: currentTeacher.subject,
      teacherName: currentTeacher.name,
      teacherNip: currentTeacher.nip,
      isSubmitted: true,
      submittedAt: timeString,
      records: { ...workingRecords },
      notes: { ...workingNotes },
    };

    saveStoredAttendance(updatedData);
    setAttendanceData(updatedData);

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

  // Export School Semester Attendance Recap (17 Rombel, 535 Siswa) to Excel (.xlsx) for Meja Piket / Kesiswaan / BK
  const handleExportSchoolSemesterExcel = () => {
    exportSchoolSemesterAttendanceToExcel({
      semesterName: 'Semester Ganjil TP. 2026/2027',
      classes: SCHOOL_CLASSES,
      students: activeStudents,
      piketOfficer: `${piketDutyTeacher} (Petugas Piket / Kesiswaan)`
    });

    showToast('File Rekapitulasi Presensi Semester Tingkat Sekolah (17 Rombel & 535 Siswa) berhasil diunduh!', 'success');
  };

  // -------------------------------------------------------------
  // ASSIGNMENT HANDLERS (GURU & SISWA)
  // -------------------------------------------------------------
  const isTeacherAssignment = (asg: Assignment) => {
    const cleanCurrentNip = (currentTeacher?.nip || '').replace(/\s+/g, '');
    const cleanAsgNip = (asg.teacherNip || '').replace(/\s+/g, '');
    if (cleanCurrentNip && cleanAsgNip && cleanCurrentNip === cleanAsgNip) return true;
    if (asg.teacherName && currentTeacher?.name && asg.teacherName.toLowerCase() === currentTeacher.name.toLowerCase()) return true;
    if (asg.subject && currentTeacher?.subject && asg.subject.toLowerCase() === currentTeacher.subject.toLowerCase()) return true;
    return false;
  };

  const generateMockNotebookSvg = (subject: string, studentName: string, title: string) => {
    const sLower = (subject || '').toLowerCase();
    let subjectText = '';
    if (sLower.includes('inggris') || sLower.includes('english')) {
      subjectText = `
        <text x="95" y="190" font-family="monospace" font-size="14" font-weight="bold" fill="#1e3a8a">Chapter 2: Daily Routines &amp; Self-Introduction</text>
        <text x="95" y="225" font-family="sans-serif" font-size="13" fill="#1e293b">1. Good morning Mr. Rohidin! My name is ${studentName}.</text>
        <text x="95" y="253" font-family="sans-serif" font-size="13" fill="#1e293b">2. I usually wake up at 05.00 AM and pray Subuh with family.</text>
        <text x="95" y="281" font-family="sans-serif" font-size="13" fill="#1e293b">3. At 06.30 AM, I walk to SMPN 3 Cihampelas with my friends.</text>
        <text x="95" y="309" font-family="sans-serif" font-size="13" fill="#1e293b">4. In English class, we learn about Simple Present Tense.</text>
        <text x="95" y="337" font-family="sans-serif" font-size="13" fill="#1e293b">5. In the evening, I study my lessons and help my parents.</text>
        <text x="95" y="375" font-family="monospace" font-size="13" font-weight="bold" fill="#047857">Action Verbs: wake up, pray, walk, study, help</text>
        <text x="95" y="403" font-family="monospace" font-size="13" font-weight="bold" fill="#047857">Adverbs of Time: every day, at 06.30 AM, in the evening</text>
      `;
    } else if (sLower.includes('matematika') || sLower.includes('mtk') || sLower.includes('aljabar')) {
      subjectText = `
        <text x="95" y="190" font-family="monospace" font-size="14" font-weight="bold" fill="#1e3a8a">Latihan Soal Faktorisasi Bentuk Aljabar:</text>
        <text x="95" y="225" font-family="monospace" font-size="13" fill="#1e293b">1. x² + 7x + 12 = (x + 3)(x + 4)</text>
        <text x="95" y="253" font-family="monospace" font-size="13" fill="#1e293b">2. 2x² + 5x - 3 = (2x - 1)(x + 3)</text>
        <text x="95" y="281" font-family="monospace" font-size="13" fill="#1e293b">3. Bentuk sederhana (4a²b) / (2ab) = 2a</text>
        <text x="95" y="309" font-family="monospace" font-size="13" fill="#1e293b">4. 3p - 9 = 0 =&gt; 3p = 9 =&gt; p = 3</text>
        <text x="95" y="337" font-family="monospace" font-size="13" fill="#1e293b">5. (x + 5)² = x² + 10x + 25</text>
        <text x="95" y="375" font-family="sans-serif" font-size="13" font-style="italic" fill="#047857">Catatan: Langkah perhitungan telah dibuktikan dengan sifat distributif.</text>
      `;
    } else if (sLower.includes('ipa') || sLower.includes('alam')) {
      subjectText = `
        <text x="95" y="190" font-family="monospace" font-size="14" font-weight="bold" fill="#1e3a8a">Laporan Pengamatan Mikroskop Struktur Sel:</text>
        <text x="95" y="225" font-family="sans-serif" font-size="13" fill="#1e293b">1. Sel Bawang Merah: memiliki dinding selulosa kaku dan rapi.</text>
        <text x="95" y="253" font-family="sans-serif" font-size="13" fill="#1e293b">2. Sel Epitel Pipi: hanya dibatasi membran tipis fleksibel.</text>
        <text x="95" y="281" font-family="sans-serif" font-size="13" fill="#1e293b">3. Nukleus tampak jelas di bagian sentral pada sel hewan.</text>
        <text x="95" y="309" font-family="sans-serif" font-size="13" fill="#1e293b">4. Pengamatan dilakukan pada pembesaran lensa objektif 400x.</text>
        <text x="95" y="347" font-family="sans-serif" font-size="13" font-style="italic" fill="#047857">Kesimpulan: Dinding sel berfungsi melindungi struktur sel tumbuhan.</text>
      `;
    } else {
      subjectText = `
        <text x="95" y="190" font-family="monospace" font-size="14" font-weight="bold" fill="#1e3a8a">Hasil Pengerjaan Tugas ${subject}:</text>
        <text x="95" y="225" font-family="sans-serif" font-size="13" fill="#1e293b">1. Topik Tugas: ${title}</text>
        <text x="95" y="253" font-family="sans-serif" font-size="13" fill="#1e293b">2. Semua instruksi guru pengampu telah dikerjakan secara runut.</text>
        <text x="95" y="281" font-family="sans-serif" font-size="13" fill="#1e293b">3. Catatan dan resume materi pembelajaran tersusun rapi.</text>
        <text x="95" y="319" font-family="sans-serif" font-size="13" font-style="italic" fill="#047857">Peserta Didik: ${studentName} (Kelas 7-A)</text>
      `;
    }

    let lines = '';
    for (let y = 140; y <= 560; y += 28) {
      lines += `<line x1="40" y1="${y}" x2="660" y2="${y}" stroke="#cbd5e1" stroke-width="1" />`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="600" viewBox="0 0 700 600">
      <rect width="700" height="600" rx="16" fill="#fefdf9" stroke="#94a3b8" stroke-width="2"/>
      ${lines}
      <line x1="80" y1="20" x2="80" y2="580" stroke="#f87171" stroke-width="2" />
      <text x="95" y="55" font-family="sans-serif" font-size="11" font-weight="bold" fill="#64748b" letter-spacing="1">SMP NEGERI 3 CIHAMPELAS • BUKU TUGAS SISWA</text>
      <text x="95" y="80" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">Nama: ${studentName} | Kelas: 7-A</text>
      <text x="95" y="105" font-family="sans-serif" font-size="12" font-weight="bold" fill="#4338ca">Mata Pelajaran: ${subject}</text>
      <text x="95" y="150" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Tugas: ${title}</text>
      ${subjectText}
      <rect x="480" y="480" width="180" height="70" rx="8" fill="#f0fdf4" stroke="#86efac" stroke-width="1"/>
      <text x="495" y="505" font-family="sans-serif" font-size="11" font-weight="bold" fill="#15803d">✓ TUGAS TERVERIFIKASI</text>
      <text x="495" y="525" font-family="sans-serif" font-size="10" fill="#166534">SMPN 3 Cihampelas</text>
      <text x="495" y="540" font-family="sans-serif" font-size="9" fill="#64748b">Digital KBM Portal 2026</text>
    </svg>`;

    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  };

  const handleOpenPreviewSubmission = async (sub: AssignmentSubmission, asg?: Assignment) => {
    let resolvedSub = { ...sub };
    const targetAsg = asg || assignments.find(a => a.id === sub.assignmentId);
    if (!resolvedSub.fileData) {
      const storedUrl = await getSubmissionFile(sub.id);
      if (storedUrl) {
        resolvedSub.fileData = storedUrl;
      }
    }
    // Always convert PDF data URLs to browser Blob URLs so Chrome renders them without security blockage
    if (resolvedSub.fileData && (resolvedSub.fileData.startsWith('data:application/pdf') || (resolvedSub.fileName?.endsWith('.pdf') && resolvedSub.fileData.startsWith('data:')))) {
      resolvedSub.fileData = dataUrlToBlobUrl(resolvedSub.fileData);
    }
    setGradingScore(resolvedSub.grade ?? 95);
    setGradingFeedback(resolvedSub.feedback ?? 'Bagus sekali, tugas sudah lengkap dan dikerjakan dengan rapi!');
    setPreviewSubmission({ sub: resolvedSub, asg: targetAsg });
  };

  const handleCreateAssignment = (newAssignment: Assignment) => {
    saveStoredAssignment(newAssignment);
    setAssignments(getStoredAssignments());
    setIsCreateAsgModalOpen(false);
    showToast(`Tugas baru berhasil diterbitkan untuk Kelas ${newAssignment.targetClass}!`, 'success');
  };

  const handleDeleteAssignment = (id: string, title: string) => {
    if (confirm(`Yakin ingin menghapus tugas "${title}"?`)) {
      deleteStoredAssignment(id);
      setAssignments(getStoredAssignments());
      showToast('Tugas berhasil dihapus.', 'info');
    }
  };

  const handleSaveGrade = (submission: AssignmentSubmission) => {
    const updated: AssignmentSubmission = {
      ...submission,
      grade: gradingScore,
      feedback: gradingFeedback.trim() || 'Tugas telah dinilai dan diperiksa oleh guru.',
      status: 'graded'
    };
    saveStoredSubmission(updated);
    setSubmissions(getStoredSubmissions());
    setGradingSubId(null);
    showToast(`Nilai (${gradingScore}/100) dan umpan balik berhasil disimpan!`, 'success');
  };

  const handleStudentSubmitAssignment = async (data: {
    selectedFile: File | null;
    fileName: string;
    fileSize: string;
    fileData: string;
    videoUrl: string;
    answerText: string;
    quizAnswers: Record<string, number>;
  }) => {
    if (!studentSubmitAsgId) return;

    const targetAsg = assignments.find(a => a.id === studentSubmitAsgId);
    if (!targetAsg) return;

    try {
      const currentStudent = activeStudents.find(s => s.nisn === currentUser?.nipOrNisn) ||
        activeStudents.find(s => s.name.toLowerCase() === currentUser?.name?.toLowerCase()) ||
        activeStudents[0];
      const now = new Date();
      const timeStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

      const subId = `sub-${studentSubmitAsgId}-${currentStudent.id}`;

      // Calculate quiz score if quiz is present
      const hasQuiz = Boolean(targetAsg.quizQuestions && targetAsg.quizQuestions.length > 0);
      let calculatedQuizScore: number | undefined = undefined;
      let calculatedQuizAnswers: number[] | undefined = undefined;
      if (hasQuiz && targetAsg.quizQuestions) {
        let correctCount = 0;
        calculatedQuizAnswers = targetAsg.quizQuestions.map(q => {
          const ans = data.quizAnswers[q.id] ?? -1;
          if (ans === q.correctOptionIndex) correctCount++;
          return ans;
        });
        calculatedQuizScore = Math.round((correctCount / targetAsg.quizQuestions.length) * 100);
      }

      // Save file safely to IndexedDB / Memory Cache
      let resolvedFileUrl = data.fileData;
      if (data.selectedFile) {
        resolvedFileUrl = await saveSubmissionFile(subId, data.selectedFile, data.fileName);
      } else if (data.fileData) {
        resolvedFileUrl = await saveSubmissionFile(subId, data.fileData, data.fileName);
      }

      const sub: AssignmentSubmission = {
        id: subId,
        assignmentId: studentSubmitAsgId,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        studentClass: currentStudent.classId || currentUser?.classId || '7-A',
        submittedAt: timeStr,
        fileName: data.fileName || (calculatedQuizScore !== undefined ? `Lembar_Kuis_${currentStudent.name.replace(/\s+/g, '_')}.pdf` : data.videoUrl ? 'Tautan_Video_Tugas.mp4' : 'File_Tugas_Siswa.pdf'),
        fileSize: data.fileSize || (calculatedQuizScore !== undefined ? 'Kuis Online' : data.videoUrl ? 'Link Online' : '1.2 MB'),
        fileData: resolvedFileUrl || data.fileData || undefined,
        videoUrl: data.videoUrl.trim() || undefined,
        answerText: data.answerText.trim() || (calculatedQuizScore !== undefined ? `Telah menyelesaikan kuis dengan skor ${calculatedQuizScore}/100.` : 'Tugas sudah selesai dikerjakan sesuai petunjuk.'),
        quizAnswers: calculatedQuizAnswers,
        quizScore: calculatedQuizScore,
        grade: calculatedQuizScore !== undefined ? calculatedQuizScore : undefined,
        feedback: calculatedQuizScore !== undefined
          ? (calculatedQuizScore >= 90 ? 'Luar biasa! Skor kuis sangat memuaskan (A).' : calculatedQuizScore >= 75 ? 'Bagus, skor kuis mencapai KKM (B).' : 'Kuis telah dikerjakan, pelajari kembali materi.')
          : undefined,
        status: calculatedQuizScore !== undefined ? 'graded' : 'submitted'
      };

      // 1. Save to persistent storage (IndexedDB + safe localStorage)
      saveStoredSubmission(sub);

      // 2. Immediately update state so UI changes instantly
      setSubmissions(prev => {
        const idx = prev.findIndex(s => s.id === sub.id || (s.assignmentId === sub.assignmentId && s.studentId === sub.studentId));
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = sub;
          return updated;
        }
        return [sub, ...prev];
      });

      // 3. Close modal
      setStudentSubmitAsgId(null);
      showToast(calculatedQuizScore !== undefined ? `Tugas & Kuis berhasil dikirim! Nilai Kuis Anda: ${calculatedQuizScore}/100 🎉` : 'Tugas berhasil dikirimkan ke guru pengampu!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Terjadi kendala saat mengirimkan tugas.', 'warn');
    }
  };

  const handleDownloadSubmissionFile = async (sub: AssignmentSubmission, asg?: Assignment) => {
    const targetAsg = asg || assignments.find(a => a.id === sub.assignmentId);
    let fileUrl = sub.fileData;
    if (!fileUrl) {
      fileUrl = (await getSubmissionFile(sub.id)) || undefined;
    }

    if (fileUrl) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = sub.fileName || 'Tugas_Siswa.pdf';
      a.click();
      showToast(`Mengunduh berkas "${sub.fileName}"...`, 'success');
    } else {
      const content = `SMP NEGERI 3 CIHAMPELAS\nLEMBAR KERJA PESERTA DIDIK (LKPD)\n========================================\n\nNama Siswa     : ${sub.studentName}\nKelas / Rombel : ${sub.studentClass}\nMata Pelajaran : ${targetAsg?.subject || 'Mata Pelajaran'}\nJudul Tugas    : ${targetAsg?.title || 'Tugas Mandiri KBM'}\nWaktu Kirim    : ${sub.submittedAt}\nNama Berkas    : ${sub.fileName}\nUkuran Berkas  : ${sub.fileSize || '1.5 MB'}\n\nCatatan Jawaban Siswa:\n"${sub.answerText || 'Tugas sudah selesai dikerjakan.'}"\n\nNilai Guru     : ${sub.grade ?? 'Belum dinilai'}/100\nCatatan Guru   : ${sub.feedback || '-'}\n`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (sub.fileName || 'Tugas_Siswa.pdf').replace(/\.pdf$/, '.txt').replace(/\.jpg$/, '.txt');
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Berkas "${sub.fileName}" berhasil diunduh!`, 'success');
    }
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
    const classSessions = sessions.filter(s => s.date === todayStr && s.classId === classId);
    const studentsInClass = activeStudents.filter(s => s.classId === classId);
    const records: Record<string, AttendanceStatus> = {};
    const notes: Record<string, string> = {};

    studentsInClass.forEach(student => {
      // First check if any teacher recorded an absence (S, I, A, T) in today's mapel sessions
      let foundAnomaly: { status: AttendanceStatus; note?: string } | null = null;
      for (const s of classSessions) {
        const st = s.records?.[student.id];
        if (st && st !== 'H') {
          foundAnomaly = {
            status: st,
            note: s.notes?.[student.id] ? `(${s.subject}) ${s.notes[student.id]}` : `(Catatan Mapel ${s.subject})`
          };
          break;
        }
      }

      if (foundAnomaly) {
        records[student.id] = foundAnomaly.status;
        if (foundAnomaly.note) notes[student.id] = foundAnomaly.note;
      } else if (isTodaySession && session?.records?.[student.id]) {
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
    const students = activeStudents.filter(s => s.classId === detailModalClassId);
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
  
  const teacherNipClean = (currentTeacher?.nip || '').replace(/\s+/g, '');
  const mySubjectSession = sessions.find(s => 
    s.date === todayStr && 
    s.classId === selectedClassId && 
    (s.teacherNip.replace(/\s+/g, '') === teacherNipClean || s.subject.toLowerCase() === (currentTeacher?.subject || '').toLowerCase())
  );

  const otherClassSessions = sessions.filter(s =>
    s.date === todayStr &&
    s.classId === selectedClassId &&
    s.teacherNip.replace(/\s+/g, '') !== teacherNipClean &&
    s.subject.toLowerCase() !== (currentTeacher?.subject || '').toLowerCase()
  );

  // Rekap kehadiran siswa yang login, dihitung dari data sesi presensi asli (bukan angka contoh)
  const getStudentAttendanceStats = () => {
    if (!currentUser || currentUser.role !== 'siswa') return null;
    const me = activeStudents.find(s => s.nisn === currentUser.nipOrNisn) ||
      activeStudents.find(s => s.name.toLowerCase() === currentUser.name?.toLowerCase());
    if (!me) return null;
    const counts: Record<AttendanceStatus, number> = { H: 0, S: 0, I: 0, A: 0, T: 0 };
    sessions.forEach(sess => {
      const st = sess.records?.[me.id];
      if (st && st in counts) counts[st] += 1;
    });
    const total = counts.H + counts.S + counts.I + counts.A + counts.T;
    const percent = total > 0 ? Math.round(((counts.H + counts.T) / total) * 1000) / 10 : null;
    let label = 'Belum ada data';
    let toneClass = 'text-slate-500';
    if (percent !== null) {
      if (percent >= 95) { label = 'Sangat Baik'; toneClass = 'text-emerald-600'; }
      else if (percent >= 85) { label = 'Baik'; toneClass = 'text-emerald-600'; }
      else if (percent >= 75) { label = 'Cukup'; toneClass = 'text-amber-600'; }
      else { label = 'Perlu Perhatian'; toneClass = 'text-rose-600'; }
    }
    return { counts, total, percent, label, toneClass };
  };

  // Info tenggat: tanggal ramah baca + sisa hari (negatif = sudah lewat)
  const getDeadlineInfo = (dueDate: string) => {
    const due = new Date(`${dueDate}T00:00:00`);
    if (isNaN(due.getTime())) return { dateText: dueDate, daysLeft: null as number | null };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((due.getTime() - today.getTime()) / 86400000);
    const dateText = due.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    return { dateText, daysLeft };
  };

  const currentClassSession = mySubjectSession ? {
    classId: selectedClassId,
    date: todayStr,
    subject: mySubjectSession.subject,
    teacherName: mySubjectSession.teacherName,
    teacherNip: mySubjectSession.teacherNip,
    isSubmitted: true,
    submittedAt: mySubjectSession.submittedAt,
    records: mySubjectSession.records,
    notes: mySubjectSession.notes
  } : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-elearning selection:bg-indigo-500/20 selection:text-indigo-900 relative">
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[700px] h-[400px] bg-indigo-100/40 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-purple-100/35 rounded-full blur-[180px]" />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] animate-bounce duration-300 pointer-events-none">
          <div className={`px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border text-sm font-medium flex items-center gap-3 ${
            toast.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-emerald-500/10' 
              : toast.type === 'warn'
              ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-amber-500/10'
              : 'bg-indigo-50 text-indigo-800 border-indigo-300 shadow-indigo-500/10'
          }`}>
            <span className="w-2.5 h-2.5 rounded-full animate-ping bg-current" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-indigo-100 px-4 sm:px-6 py-3 relative z-10 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo & School Identity */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 flex items-center justify-center transition-transform group-hover:scale-105">
                <Image src="/logo.png" alt="Logo SMPN 3 Cihampelas" fill className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 tracking-wide group-hover:text-indigo-600 transition flex items-center gap-2">
                  SIAP SPENTIC
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-semibold">PRESENSI</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">SMP Negeri 3 Cihampelas</div>
              </div>
            </Link>

            {/* Back to Home Link (Mobile) */}
            <Link 
              href="/" 
              className="sm:hidden text-xs text-slate-600 hover:text-indigo-600 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200"
            >
              ← Web Utama
            </Link>
          </div>

          {/* Right Header Navigation: Differentiates Logged In vs Logged Out */}
          {currentUser ? (
            <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* Active User Identity Pill */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-indigo-100 shadow-sm">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  currentUser.role === 'guru_mapel' 
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : currentUser.role === 'guru_piket'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                }`}>
                  {currentUser.role === 'guru_mapel' ? '👨‍🏫' : currentUser.role === 'guru_piket' ? '🏢' : '🎓'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="truncate max-w-[130px] sm:max-w-[180px]">{currentUser.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Akun Aktif" />
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {currentUser.role === 'guru_mapel' && (currentUser.subject || 'Guru Mata Pelajaran')}
                    {currentUser.role === 'guru_piket' && 'Stasiun Meja Piket'}
                    {currentUser.role === 'siswa' && `Peserta Didik (Kelas ${currentUser.classId || '7-A'})`}
                  </div>
                </div>
              </div>

              {/* Digital WIB Clock (Desktop) */}
              <div className="hidden md:flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <ELearningClock />
              </div>

              {/* Red Official Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Keluar dari akun ini"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Keluar</span>
              </button>

              <Link 
                href="/" 
                className="hidden lg:block text-xs text-slate-600 hover:text-indigo-600 transition font-semibold"
              >
                ← Web Utama
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-xs">
              <div className="bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <ELearningClock />
              </div>
              <Link 
                href="/" 
                className="text-slate-600 hover:text-indigo-600 transition font-semibold flex items-center gap-1"
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
            <div className="bg-white border border-indigo-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-500/5 relative overflow-hidden">
              {/* Ambient Glows */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-100/40 rounded-full blur-3xl pointer-events-none" />
              
              {/* Institutional Header */}
              <div className="text-center mb-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-700 font-mono font-semibold mb-3">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  SISTEM INFORMASI AKADEMIK & PRESENSI (SIAP)
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Portal Masuk Terpadu
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  SMP Negeri 3 Cihampelas — Layanan Presensi Digital & KBM Online TP. 2026/2027
                </p>
              </div>

              {/* 3-Role Segmented Selector */}
              <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 mb-6 text-xs font-semibold relative z-10">
                <button 
                  type="button"
                  onClick={() => switchLoginTab('guru')}
                  className={`py-2.5 px-2 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                    loginRole === 'guru'
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
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
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
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
                      ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
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
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Pilih Akun Guru (28 Guru Roster):
                        </label>
                        <span className="text-[11px] text-indigo-600 font-semibold">Isi Otomatis</span>
                      </div>
                      <select
                        onChange={(e) => {
                          const t = DEMO_TEACHERS.find(teach => teach.nip === e.target.value);
                          if (t) {
                            setLoginIdentifier(t.nip);
                          }
                        }}
                        className="w-full mb-3 px-3.5 py-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
                      >
                        <option value="">-- Pilih Guru dari Roster Sekolah --</option>
                        {DEMO_TEACHERS.map((t, idx) => (
                          <option key={t.nip} value={t.nip}>
                            {idx + 1}. {t.name} — {t.subject}
                          </option>
                        ))}
                      </select>

                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nomor Induk Pegawai (NIP) / NUPTK Guru
                      </label>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition font-mono"
                        placeholder="Contoh: 19850615 201001 1 012"
                        required
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                        *Akun terintegrasi otomatis dengan Data Pokok Pendidikan (Dapodik)
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Kata Sandi Akun Guru
                      </label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition"
                        placeholder="Masukkan kata sandi..."
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <span>Masuk ke Ruang Guru</span>
                      <span>→</span>
                    </button>
                  </>
                )}

                {loginRole === 'piket' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ID Stasiun / Akun Pos Piket Sekolah
                      </label>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition font-mono"
                        placeholder="ID Stasiun Piket"
                        required
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                        *Digunakan bersama di meja piket lobi utama untuk memantau 17 rombel
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Kata Sandi Petugas Piket
                      </label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition"
                        placeholder="Masukkan kata sandi stasiun..."
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <span>Buka Stasiun Meja Piket</span>
                      <span>→</span>
                    </button>
                  </>
                )}

                {loginRole === 'siswa' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nomor Induk Siswa Nasional (NISN)
                      </label>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition font-mono"
                        placeholder="Masukkan 10 digit NISN..."
                        required
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                        *Tertera pada rapor atau kartu pelajar SMP Negeri 3 Cihampelas
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Tanggal Lahir / Kata Sandi Siswa
                      </label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition"
                        placeholder="Format: TTTT-BB-HH atau sandi..."
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <span>Masuk Portal Peserta Didik</span>
                      <span>→</span>
                    </button>
                  </>
                )}

              </form>

              {/* Official Testing Profiles Section */}
              <div className="mt-8 pt-6 border-t border-slate-100 relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    Akses Cepat Pengujian Akun (Mode Evaluasi Resmi)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">1-Klik Otentikasi</span>
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
                    className="text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                        👨‍🏫 Rohidin, S.Pd.
                      </div>
                      <span className="text-[10px] text-indigo-600 font-mono group-hover:translate-x-0.5 transition font-semibold">Masuk →</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">PKS Kurikulum / B. Inggris • NIP 19720412...</div>
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
                    className="text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                        👩‍🏫 Dedeh Komalasari, S.Pd.
                      </div>
                      <span className="text-[10px] text-indigo-600 font-mono group-hover:translate-x-0.5 transition font-semibold">Masuk →</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Ka. Lab / Guru IPA • NIP 19680315...</div>
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
                    className="text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                        👩‍🏫 Yulia M. Ahmad, S.Pd.
                      </div>
                      <span className="text-[10px] text-indigo-600 font-mono group-hover:translate-x-0.5 transition font-semibold">Masuk →</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Guru Matematika • NIP 19850210...</div>
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
                    className="text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                        👩‍🏫 Nunik Wahyuni, S.Pd.
                      </div>
                      <span className="text-[10px] text-indigo-600 font-mono group-hover:translate-x-0.5 transition font-semibold">Masuk →</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">PKS Kesiswaan / B. Indonesia • NIP 19750918...</div>
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
                    className="text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                        👨‍🏫 Ichsanul Arifin, S.Kom.
                      </div>
                      <span className="text-[10px] text-indigo-600 font-mono group-hover:translate-x-0.5 transition font-semibold">Masuk →</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Guru Informatika • NIP 19930115...</div>
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
                    className="text-left p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                        🏢 Stasiun Meja Piket
                      </div>
                      <span className="text-[10px] text-emerald-600 font-mono group-hover:translate-x-0.5 transition font-semibold">Masuk →</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Monitoring 17 Rombel & Gerbang</div>
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
                    className="text-left p-3 rounded-xl bg-slate-50 hover:bg-purple-50/70 border border-slate-200 hover:border-purple-300 transition group cursor-pointer sm:col-span-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
                        🎓 Abdul Hanan (Peserta Didik)
                      </div>
                      <span className="text-[10px] text-purple-600 font-mono group-hover:translate-x-0.5 transition font-semibold">Masuk →</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Kelas 7-A • NISN: 0133138158 • Cek Kehadiran Pribadi & Modul BSE</div>
                  </button>
                </div>

                {/* 1-Click Login Langsung ke 28 Guru Roster */}
                <div className="mt-3 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="text-xs">
                    <span className="font-bold text-slate-800">Uji Coba 28 Guru Lainnya:</span>
                    <span className="text-slate-500 text-[11px] block sm:inline sm:ml-1">Pilih nama guru di bawah untuk langsung masuk ke jurnalnya</span>
                  </div>
                  <select
                    onChange={(e) => {
                      const t = DEMO_TEACHERS.find(teach => teach.nip === e.target.value);
                      if (t) {
                        handleLogin({
                          role: 'guru_mapel',
                          name: t.name,
                          nipOrNisn: t.nip,
                          subject: t.subject,
                          classId: '7-A'
                        });
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white border border-indigo-300 text-indigo-900 text-xs font-bold focus:outline-none focus:border-indigo-600 cursor-pointer shadow-xs max-w-full sm:max-w-[320px]"
                  >
                    <option value="">-- Pilih Guru Langsung Masuk (28 Roster) --</option>
                    {DEMO_TEACHERS.map((t, idx) => (
                      <option key={t.nip} value={t.nip}>
                        {idx + 1}. {t.name} ({t.subject})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ----------------- 2. VIEW: GURU MATA PELAJARAN (Presensi Kelas) ----------------- */}
        {currentUser?.role === 'guru_mapel' && (
          <div className="space-y-4">
            
            {/* Top Bar: Title & Sub-tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Presensi KBM</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {currentTeacher.subject}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pengampu: <span className="text-slate-800 font-semibold">{currentTeacher.name}</span> (NIP: {currentTeacher.nip}) • SMP Negeri 3 Cihampelas
                </p>
              </div>

              {/* Sub-tabs: Presensi / Tugas & PR / Bahan Ajar / CBT */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setActiveMenu('presensi')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    activeMenu === 'presensi' 
                      ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  Presensi
                </button>
                <button
                  onClick={() => setActiveMenu('tugas')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    activeMenu === 'tugas' 
                      ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <span>Tugas & PR Siswa</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                </button>
                <button
                  onClick={() => setActiveMenu('materi')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    activeMenu === 'materi' 
                      ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  Bahan Ajar
                </button>
                <button
                  onClick={() => setActiveMenu('cbt')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    activeMenu === 'cbt' 
                      ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
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
                <div className="bg-white border border-indigo-100 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Pilih Rombel / Kelas:</span>
                      <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-indigo-700 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
                      >
                        {SCHOOL_CLASSES.map(cls => (
                          <option key={cls.id} value={cls.id} className="bg-white text-slate-900">
                            {cls.name} ({cls.totalStudents} Siswa)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs">
                      <span className="text-indigo-700 font-semibold">Pengampu:</span>
                      <span className="text-slate-900 font-semibold">{currentTeacher.name}</span>
                      <span className="text-slate-500">({currentTeacher.subject})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {currentClassSession?.isSubmitted ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Tersimpan ({currentClassSession.submittedAt})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Belum Diabsen (Jam {currentTeacher.subject})
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={handleSetAllHadir}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
                      title="Tandai seluruh siswa menjadi HADIR"
                    >
                      ⚡ Semua Hadir
                    </button>
                  </div>
                </div>

                {/* Info Sesi Mapel Lain yang Sudah Masuk Hari Ini di Kelas Ini */}
                {otherClassSessions.length > 0 && (
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                      <span className="font-bold text-slate-800">Riwayat Mapel Lain di {selectedClassId} Hari Ini:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {otherClassSessions.map((os) => (
                        <span key={os.id} className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-slate-700 font-medium text-[11px] shadow-xs flex items-center gap-1">
                          <span className="font-semibold text-indigo-700">{os.subject}</span>
                          <span className="text-slate-400">•</span>
                          <span>{os.teacherName.split(',')[0]}</span>
                          <span className="text-slate-400 font-mono">({os.submittedAt})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Table Container */}
                <div className="bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-slate-50 border-b border-indigo-50 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-slate-900">
                      Daftar Siswa {selectedClassId} ({currentClassStudents.length})
                    </span>
                    <span className="hidden sm:inline font-mono text-[11px] text-slate-500 font-medium">
                      <span className="text-emerald-700 font-bold">H: Hadir</span> · <span className="text-blue-700 font-bold">S: Sakit</span> · <span className="text-amber-700 font-bold">I: Izin</span> · <span className="text-rose-700 font-bold">A: Alpa</span> · <span className="text-orange-700 font-bold">T: Telat</span>
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {currentClassStudents.map((student, idx) => {
                      const currentStatus = workingRecords[student.id] || 'H';
                      const currentNote = workingNotes[student.id] || '';

                      return (
                        <div 
                          key={student.id} 
                          className={`px-4 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition ${
                            currentStatus !== 'H' ? 'bg-amber-50/25' : 'hover:bg-indigo-50/30'
                          }`}
                        >
                          {/* Student Identity */}
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <span className="w-6 font-mono text-xs text-slate-400 text-center font-semibold">{idx + 1}</span>
                            <div>
                              <div className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{student.name}</span>
                                {student.gender && student.gender !== '-' && (
                                  <span className="text-[10px] text-slate-400 font-mono">({student.gender})</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
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
                                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400 font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 font-medium'
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
                                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400 font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 font-medium'
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
                                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400 font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700 font-medium'
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
                                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400 font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700 font-medium'
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
                                  ? 'bg-orange-500 text-white shadow-sm ring-2 ring-orange-400 font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-700 font-medium'
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
                                className="w-full px-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white placeholder:text-slate-400 animate-[fadeIn_0.15s_ease-out]"
                              />
                            ) : (
                              <div className="hidden md:block text-right">
                                <span className="text-[11px] text-emerald-600 font-semibold">Hadir</span>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* BOTTOM ACTION BAR */}
                  <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleExportSemesterExcel}
                        className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Unduh Rekap 1 Semester (P1 s/d P16) untuk Nilai Rapor"
                      >
                        <span>📥</span>
                        <span>Rekap Semester</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportMapelExcel}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        title="Unduh presensi harian hari ini"
                      >
                        <span>📄</span>
                        <span>Jurnal Hari Ini</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveAttendance}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
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

            {/* TAB: TUGAS & PR SISWA (PENGUMPULAN & PENILAIAN) */}
            {activeMenu === 'tugas' && (
              <div className="space-y-4">
                {/* Header Banner */}
                <div className="bg-white border border-indigo-100 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span>Penugasan & Pemeriksaan Tugas Siswa</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                        {currentTeacher.subject}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Kelola penugasan mata pelajaran {currentTeacher.subject}, periksa berkas pengerjaan siswa, dan beri nilai secara langsung.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreateAsgModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer self-start md:self-auto"
                  >
                    <span>+ Buat Tugas Baru</span>
                  </button>
                </div>

                {/* Sub-filter bar: Rombel Terpilih vs Semua Rombel Ajar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 px-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Rombel:</span>
                    <button
                      type="button"
                      onClick={() => setTeacherAsgScope('current_class')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        teacherAsgScope === 'current_class'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Kelas {selectedClassId}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeacherAsgScope('all_classes')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        teacherAsgScope === 'all_classes'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Semua Rombel Ajar
                    </button>
                  </div>

                  {(() => {
                    const myTasks = assignments.filter(a => {
                      if (!isTeacherAssignment(a)) return false;
                      if (teacherAsgScope === 'current_class') {
                        return a.targetClass === selectedClassId;
                      }
                      return true;
                    });

                    return (
                      <span>
                        Total: <span className="font-bold text-indigo-700">{myTasks.length}</span> Tugas Aktif ({currentTeacher.subject})
                      </span>
                    );
                  })()}
                </div>

                {/* My Assignments List */}
                {(() => {
                  const myTasks = assignments.filter(a => {
                    if (!isTeacherAssignment(a)) return false;
                    if (teacherAsgScope === 'current_class') {
                      return a.targetClass === selectedClassId;
                    }
                    return true;
                  });

                  if (myTasks.length === 0) {
                    return (
                      <div className="bg-white border border-indigo-100 rounded-2xl p-8 text-center space-y-3">
                        <div className="text-4xl">📝</div>
                        <h3 className="text-sm font-bold text-slate-800">
                          Belum Ada Tugas {currentTeacher.subject} untuk {teacherAsgScope === 'current_class' ? `Kelas ${selectedClassId}` : 'Rombel Anda'}
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Bapak/Ibu guru dapat membuat tugas mandiri, PR, atau proyek untuk peserta didik mata pelajaran {currentTeacher.subject}.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsCreateAsgModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          + Terbitkan Tugas {currentTeacher.subject}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myTasks.map((asg) => {
                        const asgSubs = submissions.filter(s => s.assignmentId === asg.id);
                        const classStudentsCount = activeStudents.filter(s => s.classId === asg.targetClass).length || 35;
                        const gradedCount = asgSubs.filter(s => s.status === 'graded').length;
                        const percentage = Math.round((asgSubs.length / classStudentsCount) * 100);

                        return (
                          <div
                            key={asg.id}
                            className="bg-white border border-indigo-200/80 hover:border-indigo-400 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    Kelas {asg.targetClass}
                                  </span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    ✓ {asg.subject}
                                  </span>
                                </div>
                                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  ⏰ Tenggat: {asg.dueDate}
                                </span>
                              </div>

                              <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{asg.title}</h3>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                {asg.description}
                              </p>

                              {/* Attachment & Quiz Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                                {asg.videoUrl && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                    <span>🎬</span> Video: {asg.videoTitle ? asg.videoTitle.slice(0, 24) + '...' : 'Video Pembelajaran'}
                                  </span>
                                )}
                                {asg.materialUrl && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                                    <span>📄</span> Modul: {asg.materialName || 'Bahan Ajar.pdf'}
                                  </span>
                                )}
                                {asg.quizQuestions && asg.quizQuestions.length > 0 && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                                    <span>📝</span> Kuis Auto-Grade ({asg.quizQuestions.length} Soal)
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3 pt-3 border-t border-slate-100">
                              {/* Submission Progress Bar */}
                              <div>
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                  <span className="font-semibold text-slate-700">
                                    Pengumpulan: {asgSubs.length} / {classStudentsCount} Siswa ({percentage}%)
                                  </span>
                                  <span className="text-emerald-700 font-bold">
                                    {gradedCount} Selesai Dinilai
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                  />
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center justify-between gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setInspectAsgId(asg.id)}
                                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                  <span>📂 Periksa & Beri Nilai ({asgSubs.length})</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAssignment(asg.id, asg.title)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer text-xs"
                                  title="Hapus Tugas Ini"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB: BAHAN AJAR / MODUL TAYANG PROYEKTOR */}
            {activeMenu === 'materi' && (
              <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-indigo-50 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Bahan Ajar & Modul Tayang Proyektor</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tampilkan slide materi ini di layar proyektor kelas atau bagikan ke siswa untuk belajar di rumah.
                    </p>
                  </div>
                  <button 
                    onClick={() => showToast('Fitur unggah modul ajar baru siap dikembangkan!', 'info')}
                    className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
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
                    <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded">
                          {m.mapel}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-2">{m.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">{m.fileType}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-mono text-[11px]">{m.size}</span>
                        <button 
                          onClick={() => showToast('Membuka bahan ajar di mode layar penuh proyektor...', 'success')}
                          className="text-indigo-600 hover:underline font-bold cursor-pointer"
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
              <div className="bg-white border border-indigo-100 rounded-2xl p-6 text-center py-12 space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 mx-auto flex items-center justify-center text-2xl">
                  💻
                </div>
                <h3 className="text-lg font-bold text-slate-900">Bank Soal & Asesmen CBT Lab Komputer</h3>
                <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                  Modul ini disiapkan untuk Asesmen Sumatif (STS/SAS) di Laboratorium Komputer sekolah. Siswa dapat login menggunakan NISN di komputer lab tanpa memerlukan handphone.
                </p>
                <div className="pt-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Pusat Meja Piket</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    Live Monitoring 17 Rombel
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stasiun Meja Piket & Gerbang Utama • SMP Negeri 3 Cihampelas
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs shadow-sm">
                  <span className="text-slate-500 font-medium">Petugas Jaga:</span>
                  <select
                    value={piketDutyTeacher}
                    onChange={(e) => setPiketDutyTeacher(e.target.value)}
                    className="bg-transparent text-emerald-700 font-bold focus:outline-none cursor-pointer max-w-[220px] truncate"
                  >
                    {DEMO_TEACHERS.map((teacher) => (
                      <option key={teacher.nip} value={teacher.name} className="bg-white text-slate-900">
                        {teacher.name} ({teacher.subject})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleExportPiketExcel}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Unduh rekapitulasi presensi harian seluruh rombel hari ini (.xlsx)"
                >
                  <span>📋</span>
                  <span>Export Harian</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportSchoolSemesterExcel}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Unduh rekapitulasi kehadiran 1 semester seluruh sekolah (17 rombel & 535 siswa) untuk Kesiswaan / BK (.xlsx)"
                >
                  <span>📥</span>
                  <span>Rekap 1 Semester</span>
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
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🔄 Refresh</span>
                </button>
              </div>
            </div>

            {/* TOP STATS CARDS: CLEAN & MINIMALIST */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Siswa</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{INITIAL_STUDENTS.length}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-sm">
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Hadir (H)</div>
                <div className="text-xl font-black text-emerald-700 mt-0.5">{schoolStats.hadir}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 shadow-sm">
                <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Sakit (S)</div>
                <div className="text-xl font-black text-blue-700 mt-0.5">{schoolStats.sakit}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 shadow-sm">
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Izin (I)</div>
                <div className="text-xl font-black text-amber-700 mt-0.5">{schoolStats.izin}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 shadow-sm">
                <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Alpa (A)</div>
                <div className="text-xl font-black text-rose-700 mt-0.5">{schoolStats.alpa}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-orange-50/80 border border-orange-200 shadow-sm">
                <div className="text-[10px] font-bold text-orange-800 uppercase tracking-wider">Telat (T)</div>
                <div className="text-xl font-black text-orange-700 mt-0.5">{schoolStats.terlambat}</div>
              </div>
            </div>

            {/* DUA KOLOM: PETA KELAS (KIRI) & POS MEJA PIKET / SISWA TELAT (KANAN) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* KOLOM KIRI (2/3): PETA KELAS (LIVE GRID MONITORING) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Peta Status Seluruh Rombel</span>
                    <span className="text-xs font-normal text-slate-500">(Live Status Hari Ini)</span>
                  </h2>
                  <div className="text-xs flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Sudah Diabsen
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Belum Diabsen
                    </span>
                  </div>
                </div>

                {/* Grid Rombel Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {SCHOOL_CLASSES.map(cls => {
                    const session = attendanceData[cls.id];
                    const classSessions = sessions.filter(s => s.date === todayStr && s.classId === cls.id);
                    const isDone = classSessions.length > 0 || Boolean(session?.isSubmitted && session?.date === todayStr);
                    const students = activeStudents.filter(s => s.classId === cls.id);
                    
                    // Count anomalies (S, I, A, T) across all sessions for this class today
                    let sick = 0, leave = 0, absent = 0, late = 0;
                    students.forEach(st => {
                      let stStatus: AttendanceStatus | undefined;
                      for (const s of classSessions) {
                        if (s.records?.[st.id] && s.records[st.id] !== 'H') {
                          stStatus = s.records[st.id];
                          break;
                        }
                      }
                      if (!stStatus && session?.records?.[st.id]) {
                        stStatus = session.records[st.id];
                      }
                      if (stStatus === 'S') sick++;
                      if (stStatus === 'I') leave++;
                      if (stStatus === 'A') absent++;
                      if (stStatus === 'T') late++;
                    });

                    return (
                      <div
                        key={cls.id}
                        onClick={() => handleOpenPiketClassModal(cls.id)}
                        className={`p-4 rounded-2xl border-2 transition cursor-pointer relative overflow-hidden group shadow-sm hover:shadow-md ${
                          isDone 
                            ? 'bg-white border-emerald-300 hover:border-emerald-500' 
                            : 'bg-white border-amber-300 hover:border-amber-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                            {cls.name}
                          </span>
                          {isDone ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              🟢 {classSessions.length > 0 ? `${classSessions.length} Mapel Diabsen` : 'Selesai Diabsen'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                              🟡 Belum Diabsen
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 mb-3 flex items-center justify-between">
                          <span>Total: <span className="text-slate-800 font-semibold">{cls.totalStudents} Siswa</span></span>
                          <span className="text-[10px] text-slate-400 font-mono font-medium">2026/2027</span>
                        </div>

                        {/* Summary Numbers inside Class Card */}
                        {isDone ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-slate-500">Mapel:</span>
                              <span className="font-semibold text-slate-800 truncate max-w-[130px]" title={classSessions.map(cs => `${cs.subject} (${cs.teacherName})`).join(', ') || session?.teacherName}>
                                {classSessions.length > 0 
                                  ? classSessions.map(cs => cs.subject.split(' ')[0]).join(', ')
                                  : (session?.teacherName?.split(',')[0] || '-')}
                              </span>
                            </div>

                            <div className="grid grid-cols-4 gap-1 text-center font-mono text-[11px]">
                              <div className="p-1 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                                S: {sick}
                              </div>
                              <div className="p-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                                I: {leave}
                              </div>
                              <div className="p-1 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                                A: {absent}
                              </div>
                              <div className="p-1 rounded bg-orange-50 text-orange-800 border border-orange-200 font-bold">
                                T: {late}
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-500 text-right font-medium">
                              Waktu: <span className="font-mono text-slate-700 font-semibold">{classSessions[classSessions.length - 1]?.submittedAt || session?.submittedAt || '-'}</span>
                            </div>
                            <div className="pt-1 flex items-center justify-between text-[11px]">
                              <span className="text-indigo-600 font-bold group-hover:underline">
                                ✏️ Buka Rincian / Buku Piket →
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-2 text-center space-y-2.5">
                            <span className="text-xs text-amber-700 font-semibold block">
                              Guru Belum Hadir / Jam Kosong
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPiketClassModal(cls.id);
                              }}
                              className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>📝</span>
                              <span>Absenkan sbg Piket</span>
                            </button>
                          </div>
                        )}

                        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-center text-slate-400 group-hover:text-indigo-600 transition">
                          Klik kartu untuk buka presensi kelas ini
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KOLOM KANAN (1/3): POS MEJA PIKET (AKSI SISWA TELAT & SURAT IZIN) */}
              <div className="space-y-4">
                <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-indigo-50">
                    <span className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-bold text-xs">
                      ⏱️
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Pos Gerbang / Piket</h3>
                      <p className="text-[11px] text-slate-500">Catat Siswa Telat atau Izin</p>
                    </div>
                  </div>

                  <form onSubmit={handlePiketActionSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        1. Pilih Kelas Siswa:
                      </label>
                      <select
                        value={piketSelectedClass}
                        onChange={(e) => {
                          setPiketSelectedClass(e.target.value);
                          const firstStudent = INITIAL_STUDENTS.find(s => s.classId === e.target.value);
                          if (firstStudent) setPiketSelectedStudentId(firstStudent.id);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      >
                        {SCHOOL_CLASSES.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.totalStudents} Siswa)</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        2. Pilih Nama Siswa:
                      </label>
                      <select
                        value={piketSelectedStudentId}
                        onChange={(e) => setPiketSelectedStudentId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      >
                        {INITIAL_STUDENTS.filter(s => s.classId === piketSelectedClass).map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.gender})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        3. Status yang Dicatat:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setPiketActionStatus('T'); setPiketActionNote('Terlambat sampai gerbang'); }}
                          className={`py-2 rounded-lg font-bold text-center border transition cursor-pointer ${
                            piketActionStatus === 'T'
                              ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Terlambat (T)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPiketActionStatus('S'); setPiketActionNote('Surat dokter diserahkan ke piket'); }}
                          className={`py-2 rounded-lg font-bold text-center border transition cursor-pointer ${
                            piketActionStatus === 'S'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Sakit (S)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPiketActionStatus('I'); setPiketActionNote('Surat izin dari orang tua'); }}
                          className={`py-2 rounded-lg font-bold text-center border transition cursor-pointer ${
                            piketActionStatus === 'I'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Izin (I)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        4. Catatan Piket:
                      </label>
                      <input
                        type="text"
                        value={piketActionNote}
                        onChange={(e) => setPiketActionNote(e.target.value)}
                        placeholder="Contoh: Terlambat karena kendaraan mogok..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Update Status via Meja Piket</span>
                      <span>→</span>
                    </button>
                  </form>
                </div>

                {/* Info Card for Duty Teachers */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-2">
                  <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <span>💡 Tips Efisiensi Jam Piket:</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
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
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-text"
                onClick={() => setDetailModalClassId(null)}
              >
                <div 
                  data-lenis-prevent="true"
                  data-lenis-prevent-wheel="true"
                  data-lenis-prevent-touch="true"
                  className="bg-white border border-indigo-100 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  
                  {/* Modal Header */}
                  <div className="p-5 border-b border-indigo-100 bg-slate-50 flex-shrink-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          🏢 MODE PIKET
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">
                          Presensi & Rincian {detailModalClassId}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          attendanceData[detailModalClassId]?.isSubmitted 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {attendanceData[detailModalClassId]?.isSubmitted ? 'Sudah Diabsen' : 'Belum Diabsen (Bisa Diabsenkan Piket)'}
                        </span>
                      </div>
                      <button
                        onClick={() => setDetailModalClassId(null)}
                        className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 pt-1">
                      <div>
                        <p>
                          Total: <span className="font-semibold text-slate-900">{activeStudents.filter(s => s.classId === detailModalClassId).length} Siswa</span>
                          {attendanceData[detailModalClassId]?.teacherName && (
                            <span> • Sesi terakhir: <span className="text-indigo-700 font-semibold">{attendanceData[detailModalClassId]?.teacherName} ({attendanceData[detailModalClassId]?.subject})</span></span>
                          )}
                        </p>
                        {detailModalClassId && sessions.filter(s => s.date === todayStr && s.classId === detailModalClassId).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="text-[11px] font-semibold text-slate-500">Sesi Masuk Hari Ini:</span>
                            {sessions.filter(s => s.date === todayStr && s.classId === detailModalClassId).map(s => (
                              <span key={s.id} className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium text-[11px]">
                                {s.subject} ({s.teacherName.split(',')[0]} • {s.submittedAt})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleSetPiketAllHadir}
                        className="self-start sm:self-auto px-3 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <span>⚡</span>
                        <span>Tandai Semua Hadir</span>
                      </button>
                    </div>
                  </div>

                  {/* Petunjuk Guru Piket */}
                  <div className="px-5 py-2.5 bg-emerald-50/50 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-emerald-900 font-medium">
                      💡 Klik tombol status pada siswa jika ada yang Sakit/Izin/Alpa/Telat, lalu klik "Simpan Presensi".
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <span className="text-emerald-700">H: Hadir</span> •
                      <span className="text-blue-700">S: Sakit</span> •
                      <span className="text-amber-700">I: Izin</span> •
                      <span className="text-rose-700">A: Alpa</span> •
                      <span className="text-orange-700">T: Telat</span>
                    </div>
                  </div>

                  {/* Modal Content (Daftar Siswa Interaktif untuk Piket) */}
                  <div 
                    data-lenis-prevent="true"
                    data-lenis-prevent-wheel="true"
                    data-lenis-prevent-touch="true"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    className="p-5 overflow-y-auto overscroll-contain flex-1 min-h-0 space-y-3 divide-y divide-slate-100 text-xs select-text [scrollbar-width:thin]"
                  >
                    {activeStudents.filter(s => s.classId === detailModalClassId).map((student, idx) => {
                      const currentStatus = piketModalRecords[student.id] || 'H';
                      const currentNote = piketModalNotes[student.id] || '';

                      return (
                        <div key={student.id} className="pt-3 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          {/* Nama Siswa */}
                          <div className="flex items-center gap-2.5 min-w-[200px]">
                            <span className="w-5 text-slate-400 font-mono font-semibold">{idx + 1}.</span>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{student.name}</span>
                                {student.gender && student.gender !== '-' && (
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                    student.gender === 'L' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-pink-50 text-pink-700 border border-pink-200'
                                  }`}>
                                    {student.gender}
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-400 text-[10px] font-mono">
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
                                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400 font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 font-medium'
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
                                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400 font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 font-medium'
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
                                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400 font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700 font-medium'
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
                                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400 font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700 font-medium'
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
                                  ? 'bg-orange-500 text-white shadow-sm ring-2 ring-orange-400 font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-700 font-medium'
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
                                className="w-full px-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white placeholder:text-slate-400 animate-[fadeIn_0.15s_ease-out]"
                              />
                            ) : (
                              <div className="hidden md:block text-right">
                                <span className="text-[11px] text-emerald-700 font-semibold">Hadir</span>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* Modal Footer (Simpan oleh Guru Piket) */}
                  <div className="p-4 border-t border-indigo-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                    <div className="text-xs text-slate-500 text-center sm:text-left">
                      Petugas pengesah: <span className="text-slate-900 font-semibold">{piketDutyTeacher} (Piket)</span>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setDetailModalClassId(null)}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition cursor-pointer shadow-sm"
                      >
                        Tutup
                      </button>

                      <button
                        type="button"
                        onClick={handleSavePiketAttendance}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-1.5 cursor-pointer"
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
            <div className="bg-gradient-to-r from-purple-50 via-white to-indigo-50 border border-purple-200/80 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-2xl font-bold text-purple-700">
                    🎓
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                        PESERTA DIDIK AKTIF
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Kelas {currentUser.classId || '7-A'} • Semester Ganjil 2026/2027</span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">{currentUser.name}</h1>
                    <p className="text-xs text-slate-600 font-mono">NISN: {currentUser.nipOrNisn} • SMP Negeri 3 Cihampelas</p>
                  </div>
                </div>

                {(() => {
                  const stats = getStudentAttendanceStats();
                  return (
                    <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-right shadow-sm">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Kehadiran Kamu</div>
                      {stats && stats.percent !== null ? (
                        <>
                          <div className={`text-lg font-black ${stats.toneClass}`}>{stats.percent}% ({stats.label})</div>
                          <div className="text-[10px] text-slate-400">dari {stats.total} jam pelajaran tercatat</div>
                        </>
                      ) : (
                        <div className="text-sm font-bold text-slate-500">Belum ada data presensi</div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Quick Cards: Status Hari Ini & Materi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card Kehadiran Hari Ini */}
              {(() => {
                const currentStudent = activeStudents.find(s => s.nisn === currentUser.nipOrNisn) || activeStudents[0];
                const studentClass = currentUser.classId || '7-A';
                const todayClassSessions = sessions.filter(s => s.date === todayStr && s.classId === studentClass);
                
                // Check if student was marked absent or late in any session
                const studentAnomalies = todayClassSessions.filter(s => s.records?.[currentStudent?.id] && s.records[currentStudent.id] !== 'H');
                const hasSessions = todayClassSessions.length > 0;

                return (
                  <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-sm space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>📅 Status Kehadiran Hari Ini</span>
                    </h3>
                    
                    {studentAnomalies.length > 0 ? (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                        <div className="font-bold text-amber-800 flex items-center gap-1.5">
                          <span>⚠️</span> Catatan Presensi: {studentAnomalies.map(s => `${s.subject} (${s.records[currentStudent.id] === 'A' ? 'Alpa' : s.records[currentStudent.id] === 'S' ? 'Sakit' : s.records[currentStudent.id] === 'I' ? 'Izin' : 'Terlambat'})`).join(', ')}
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          Tercatat oleh guru mata pelajaran dan tersinkron ke buku piket harian sekolah.
                        </p>
                      </div>
                    ) : hasSessions ? (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                        <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <span>✓</span> Terdaftar HADIR di Seluruh Jam Pelajaran
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          Terverifikasi oleh guru mata pelajaran ({todayClassSessions.map(s => s.subject.split(' ')[0]).join(', ')}) dan tersinkron ke meja piket.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span>⏳</span> Menunggu KBM Dimulai
                        </div>
                        <p className="text-slate-500 text-[11px]">
                          Status kehadiran harian otomatis tercatat saat guru pengampu membuka sesi presensi di kelas.
                        </p>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 font-medium">
                      {(() => { const st = getStudentAttendanceStats(); return st && st.total > 0 ? `Rekap semester ini: Hadir ${st.counts.H}x • Terlambat ${st.counts.T}x • Sakit ${st.counts.S}x • Izin ${st.counts.I}x • Alpa ${st.counts.A}x` : 'Rekap semester belum tersedia (belum ada presensi tercatat).'; })()}
                    </div>
                  </div>
                );
              })()}

              {/* Card Bahan Ajar Mandiri di Rumah */}
              <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>📖 Buku & Modul Pelajaran</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Buku Sekolah Elektronik (BSE) Kurikulum Merdeka resmi dapat diakses dan diunduh gratis untuk belajar di rumah bersama orang tua.
                </p>
                <div className="pt-1">
                  <a
                      href="https://buku.kemdikbud.go.id/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>📚 Buka Perpustakaan Digital</span>
                      <span>↗</span>
                    </a>
                </div>
              </div>

            </div>

            {/* Jadwal Pelajaran Hari Ini */}
            {(() => {
              const currentStudent = activeStudents.find(s => s.nisn === currentUser.nipOrNisn) || activeStudents[0];
              const studentClass = currentUser.classId || '7-A';
              
              const todaySessions = sessions.filter(s => s.date === todayStr && s.classId === studentClass);

              const getBadge = (sess?: SubjectSession) => {
                if (!sess) return <span className="text-[10px] text-slate-400 italic">Belum absen</span>;
                const st = sess.records?.[currentStudent?.id] || 'H';
                if (st === 'H') return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">✓ Hadir</span>;
                if (st === 'S') return <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Sakit</span>;
                if (st === 'I') return <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Izin</span>;
                if (st === 'A') return <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Alpa</span>;
                return <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">Telat</span>;
              };

              const timeSlots = studentClass.endsWith('A') || studentClass.endsWith('B') || studentClass.endsWith('C') || studentClass.endsWith('D') || studentClass.endsWith('E') || studentClass.endsWith('F') 
                ? (studentClass.startsWith('7') ? ['12.15 - 13.45 WIB', '13.45 - 15.15 WIB', '15.35 - 17.05 WIB'] : ['06.30 - 08.00 WIB', '08.30 - 10.00 WIB', '10.30 - 12.00 WIB']) 
                : ['07.15 - 08.35 WIB', '08.35 - 09.55 WIB', '10.15 - 11.35 WIB', '12.30 - 13.50 WIB'];

              return (
                <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Jadwal Pelajaran Kelas {studentClass} Hari Ini</h3>
                  {todaySessions.length === 0 ? (
                    <div className="text-xs text-slate-500 py-3 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50">
                      Tidak ada jadwal pelajaran hari ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                      {todaySessions.map((sess, idx) => (
                        <div key={sess.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-slate-500 font-mono font-medium">{timeSlots[idx % timeSlots.length]}</span>
                            {getBadge(sess)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{sess.subject}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{sess.teacherName}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* SECTION: TUGAS & PR SEKOLAH SAYA */}
            {(() => {
              const currentStudent = activeStudents.find(s => s.nisn === currentUser.nipOrNisn) ||
                activeStudents.find(s => s.name.toLowerCase() === currentUser.name?.toLowerCase()) ||
                activeStudents[0];
              const studentClass = currentUser.classId || '7-A';
              const myAssignments = assignments.filter(a => a.targetClass === studentClass || a.targetClass === 'Semua');
              const availableSubjects = Array.from(new Set(myAssignments.map(a => a.subject)));

              const findMySub = (asgId: string) => submissions.find(
                s => s.assignmentId === asgId && (s.studentId === currentStudent.id || s.studentName.toLowerCase() === currentStudent.name.toLowerCase())
              );
              const statusRank = (asgId: string) => {
                const st = findMySub(asgId)?.status;
                return st === 'graded' ? 2 : st === 'submitted' ? 1 : 0;
              };
              const displayedTasks = (studentSubjectFilter === 'all'
                ? myAssignments
                : myAssignments.filter(a => a.subject === studentSubjectFilter)
              ).slice().sort((a, b) => statusRank(a.id) - statusRank(b.id) || a.dueDate.localeCompare(b.dueDate));

              // Calculate Status Counts
              let notSubmittedCount = 0;
              let waitingGradeCount = 0;
              let gradedCount = 0;
              myAssignments.forEach(asg => {
                const st = findMySub(asg.id)?.status;
                if (st === 'graded') gradedCount++;
                else if (st === 'submitted') waitingGradeCount++;
                else notSubmittedCount++;
              });


              return (
                <div className="bg-white border border-indigo-100 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-2">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <div className="text-xl font-black text-slate-700">{notSubmittedCount}</div>
                      <div className="text-[10px] sm:text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Belum Dikumpul</div>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                      <div className="text-xl font-black text-blue-700">{waitingGradeCount}</div>
                      <div className="text-[10px] sm:text-xs font-bold text-blue-600 mt-1 uppercase tracking-wider">Menunggu Nilai</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <div className="text-xl font-black text-emerald-700">{gradedCount}</div>
                      <div className="text-[10px] sm:text-xs font-bold text-emerald-600 mt-1 uppercase tracking-wider">Selesai Dinilai</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-50 pb-3 gap-2 mt-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>📝 Tugas & PR Kelas {studentClass}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                          {myAssignments.length} Tugas Aktif
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kerjakan tugas dari Bapak/Ibu guru, lalu unggah foto buku tugas, dokumen, atau video sebelum batas waktu.
                      </p>
                    </div>

                    {/* Filter Mapel untuk Siswa */}
                    {availableSubjects.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setStudentSubjectFilter('all')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                            studentSubjectFilter === 'all'
                              ? 'bg-purple-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Semua ({myAssignments.length})
                        </button>
                        {availableSubjects.map(sub => (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => setStudentSubjectFilter(sub)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                              studentSubjectFilter === sub
                                ? 'bg-purple-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {sub} ({myAssignments.filter(a => a.subject === sub).length})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {displayedTasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      🎉 Tidak ada tugas aktif untuk kategori ini. Tetap semangat belajar!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {displayedTasks.map((asg) => {
                        const mySub = submissions.find(
                          s => s.assignmentId === asg.id && (s.studentId === currentStudent.id || s.studentName.toLowerCase() === currentStudent.name.toLowerCase())
                        );

                        return (
                          <div
                            key={asg.id}
                            className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col justify-between space-y-3.5 ${
                              mySub?.status === 'graded'
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : mySub?.status === 'submitted'
                                ? 'bg-blue-50/40 border-blue-200'
                                : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-indigo-700">
                                  {asg.subject}
                                </span>
                                {(() => {
                                  const dl = getDeadlineInfo(asg.dueDate);
                                  let cls = 'bg-white text-slate-500 border-slate-200';
                                  let text = `Tenggat ${dl.dateText}`;
                                  if (!mySub && dl.daysLeft !== null) {
                                    if (dl.daysLeft < 0) {
                                      cls = 'bg-rose-50 text-rose-700 border-rose-200';
                                      text = `Lewat tenggat ${Math.abs(dl.daysLeft)} hari • ${dl.dateText}`;
                                    } else if (dl.daysLeft === 0) {
                                      cls = 'bg-rose-50 text-rose-700 border-rose-200';
                                      text = `Hari ini terakhir • ${dl.dateText}`;
                                    } else if (dl.daysLeft <= 2) {
                                      cls = 'bg-amber-50 text-amber-800 border-amber-200';
                                      text = `Sisa ${dl.daysLeft} hari • ${dl.dateText}`;
                                    } else {
                                      text = `Sisa ${dl.daysLeft} hari • ${dl.dateText}`;
                                    }
                                  }
                                  return (
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap ${cls}`}>
                                      {text}
                                    </span>
                                  );
                                })()}
                              </div>

                              <h3 className="text-sm font-bold text-slate-900">{asg.title}</h3>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                                {asg.description}
                              </p>
                              <div className="text-[11px] text-slate-500 mt-2">
                                Guru Pengampu: <span className="font-semibold text-slate-700">{asg.teacherName}</span>
                              </div>

                              {/* Attachment & Quiz Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                                {asg.videoUrl && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                    <span>🎬</span> Video Materi
                                  </span>
                                )}
                                {asg.materialUrl && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                                    <span>📄</span> Modul / LKPD Guru
                                  </span>
                                )}
                                {asg.quizQuestions && asg.quizQuestions.length > 0 && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                                    <span>📝</span> Kuis ({asg.quizQuestions.length} Soal)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Status and Action */}
                            <div className="pt-3 border-t border-slate-200/80 space-y-2">
                              {mySub?.status === 'graded' ? (
                                <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs space-y-1.5 shadow-2xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                                      <span>✓</span> Tugas Selesai Dinilai
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs">
                                      {mySub.grade} / 100
                                    </span>
                                  </div>
                                  {mySub.feedback && (
                                    <p className="text-slate-600 text-[11px] italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                                      Catatan Guru: &ldquo;{mySub.feedback}&rdquo;
                                    </p>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPreviewSubmission(mySub, asg)}
                                    className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline font-mono truncate flex items-center gap-1 cursor-pointer pt-0.5"
                                  >
                                    <span>{mySub.fileName?.startsWith('Lembar_Kuis_') ? '📝' : '📄'}</span> <span>{mySub.fileName?.startsWith('Lembar_Kuis_') ? 'Lihat Hasil Kuis' : 'Buka Berkas: ' + mySub.fileName}</span> <span className="text-[10px] bg-indigo-50 px-1 rounded">Lihat ↗</span>
                                  </button>
                                </div>
                              ) : mySub?.status === 'submitted' ? (
                                <div className="space-y-2">
                                  <div className="p-2.5 rounded-xl bg-white border border-blue-200 text-xs shadow-2xs">
                                    <div className="flex items-center justify-between text-blue-700 font-bold mb-1">
                                      <span className="flex items-center gap-1">
                                        <span className="text-emerald-600">✓</span>
                                        <span>Terkirim • Menunggu Penilaian</span>
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-normal">{mySub.submittedAt}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPreviewSubmission(mySub, asg)}
                                      className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline truncate flex items-center gap-1 cursor-pointer font-medium text-left"
                                    >
                                      <span>📎</span> <span>{mySub.fileName}</span> <span className="text-slate-400">({mySub.fileSize})</span> <span className="text-[10px] bg-indigo-50 px-1 rounded text-indigo-700 font-bold">Buka ↗</span>
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setStudentSubmitAsgId(asg.id)}
                                    className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition cursor-pointer"
                                  >
                                    🔄 Ganti / Unggah Ulang Berkas
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs text-amber-700 font-semibold">
                                    <span>⚠️ Belum Dikumpulkan</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setStudentSubmitAsgId(asg.id)}
                                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <span>📤 Kerjakan & Unggah Tugas</span>
                                    <span>→</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        )}

        {/* MODAL: BUAT TUGAS BARU (GURU) - isolated component, typing never re-renders this page */}
        {isCreateAsgModalOpen && (
          <CreateAssignmentModal
            currentTeacher={currentTeacher}
            defaultClass={selectedClassId}
            onClose={() => setIsCreateAsgModalOpen(false)}
            onSubmit={handleCreateAssignment}
            showToast={showToast}
          />
        )}

        {/* MODAL: PERIKSA PENGUMPULAN TUGAS (GURU) */}
        {inspectAsgId && (() => {
          const asg = assignments.find(a => a.id === inspectAsgId);
          if (!asg) return null;
          const asgSubs = submissions.filter(s => s.assignmentId === inspectAsgId);
          const classStudents = activeStudents.filter(s => s.classId === asg.targetClass);

          return (
            <div
              data-lenis-prevent="true"
              data-lenis-prevent-wheel="true"
              data-lenis-prevent-touch="true"
              className="fixed inset-0 z-50 bg-slate-900/80 overflow-y-auto p-3 sm:p-4 flex items-center justify-center"
            >
              <div
                data-lenis-prevent="true"
                data-lenis-prevent-wheel="true"
                data-lenis-prevent-touch="true"
                className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto my-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Kelas {asg.targetClass}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Tenggat: {asg.dueDate}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{asg.title}</h3>
                    <p className="text-xs text-slate-500">{asg.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectAsgId(null);
                      setGradingSubId(null);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Stats overview */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Siswa</div>
                    <div className="text-lg font-bold text-slate-900">{classStudents.length}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] text-emerald-800 font-semibold uppercase">Sudah Mengumpulkan</div>
                    <div className="text-lg font-black text-emerald-700">{asgSubs.length}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-[10px] text-amber-800 font-semibold uppercase">Belum Mengumpulkan</div>
                    <div className="text-lg font-black text-amber-700">{Math.max(0, classStudents.length - asgSubs.length)}</div>
                  </div>
                </div>

                {/* Table of Submissions */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                          <th className="py-2.5 px-3 w-10 text-center">No</th>
                          <th className="py-2.5 px-3">Nama Siswa</th>
                          <th className="py-2.5 px-3">Waktu Kumpul</th>
                          <th className="py-2.5 px-3">Berkas Lampiran</th>
                          <th className="py-2.5 px-3">Nilai & Umpan Balik</th>
                          <th className="py-2.5 px-3 text-center w-28">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classStudents.map((st, idx) => {
                          const sub = asgSubs.find(
                            s => s.studentId === st.id || s.studentName.toLowerCase() === st.name.toLowerCase()
                          );

                          return (
                            <React.Fragment key={st.id}>
                              <tr className={sub ? 'hover:bg-indigo-50/20' : 'bg-slate-50/40 text-slate-400'}>
                                <td className="py-2.5 px-3 text-center font-mono">{idx + 1}</td>
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-slate-800">{st.name}</div>
                                  <div className="text-[10px] font-mono text-slate-400">NISN: {st.nisn}</div>
                                </td>
                                <td className="py-2.5 px-3 text-[11px]">
                                  {sub ? (
                                    <span className="text-slate-600">{sub.submittedAt}</span>
                                  ) : (
                                    <span className="text-slate-400 italic">Belum dikirim</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  {sub ? (
                                    <div className="space-y-1">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenPreviewSubmission(sub, asg)}
                                        className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer text-[11px] group text-left"
                                        title="Klik untuk membuka & memeriksa berkas tugas siswa"
                                      >
                                        <span>📎</span> <span className="truncate max-w-[160px] group-hover:underline">{sub.fileName}</span>
                                        <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 rounded ml-0.5 font-bold">Buka ↗</span>
                                      </button>
                                      {sub.answerText && (
                                        <p className="text-[10px] text-slate-500 italic truncate max-w-[200px]">
                                          &ldquo;{sub.answerText}&rdquo;
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  {sub?.status === 'graded' ? (
                                    <div className="space-y-0.5">
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                        Nilai: {sub.grade} / 100
                                      </span>
                                      {sub.feedback && (
                                        <p className="text-[10px] text-slate-600 italic truncate max-w-[200px]">
                                          {sub.feedback}
                                        </p>
                                      )}
                                    </div>
                                  ) : sub ? (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-[10px]">
                                      Belum Dinilai
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {sub ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (gradingSubId === sub.id) {
                                          setGradingSubId(null);
                                        } else {
                                          setGradingSubId(sub.id);
                                          setGradingScore(sub.grade ?? 90);
                                          setGradingFeedback(sub.feedback ?? 'Bagus, tugas sudah lengkap dan dikerjakan dengan rapi.');
                                        }
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 transition cursor-pointer"
                                    >
                                      {sub.status === 'graded' ? 'Edit Nilai' : 'Beri Nilai'}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => showToast(`Notifikasi pengingat dikirim ke ${st.name}!`, 'info')}
                                      className="text-[10px] text-slate-400 hover:text-amber-700 transition cursor-pointer"
                                    >
                                      Ingatkan 🔔
                                    </button>
                                  )}
                                </td>
                              </tr>

                              {/* Inline Grading Form */}
                              {sub && gradingSubId === sub.id && (
                                <tr className="bg-indigo-50/50 border-y border-indigo-100">
                                  <td colSpan={6} className="p-3.5">
                                    <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-sm space-y-3">
                                      <div className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                                        <span>✏️</span> Penilaian Tugas: {sub.studentName}
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                        <div className="sm:col-span-1">
                                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Nilai (0 - 100)</label>
                                          <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={gradingScore}
                                            onChange={(e) => setGradingScore(Number(e.target.value))}
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-emerald-700 text-sm focus:outline-none focus:border-indigo-600"
                                          />
                                        </div>
                                        <div className="sm:col-span-3">
                                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Catatan / Umpan Balik Guru</label>
                                          <input
                                            type="text"
                                            value={gradingFeedback}
                                            onChange={(e) => setGradingFeedback(e.target.value)}
                                            placeholder="Tuliskan catatan apresiasi atau evaluasi untuk siswa..."
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-indigo-600"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-end gap-2 pt-1">
                                        <button
                                          type="button"
                                          onClick={() => setGradingSubId(null)}
                                          className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 text-xs cursor-pointer"
                                        >
                                          Batal
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveGrade(sub)}
                                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                                        >
                                          Simpan Nilai
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MODAL: KUMPULKAN TUGAS (SISWA) - isolated component, typing never re-renders this page */}
        {studentSubmitAsgId && (() => {
          const asg = assignments.find(a => a.id === studentSubmitAsgId);
          if (!asg) return null;
          const currentStudent = activeStudents.find(s => s.nisn === currentUser?.nipOrNisn) ||
            activeStudents.find(s => s.name.toLowerCase() === currentUser?.name?.toLowerCase()) ||
            activeStudents[0];
          const mySub = submissions.find(s => s.assignmentId === asg.id && (s.studentId === currentStudent.id || s.studentName.toLowerCase() === currentStudent.name.toLowerCase()));
          return (
            <StudentSubmitModal
              key={asg.id}
              asg={asg}
              currentStudent={currentStudent}
              existingSubmission={mySub}
              onClose={() => setStudentSubmitAsgId(null)}
              onSubmit={handleStudentSubmitAssignment}
              showToast={showToast}
            />
          );
        })()}

        {/* MODAL: PRATINJAU BERKAS TUGAS SISWA (SIDE-BY-SIDE SPLIT VIEW / SPEEDGRADER) */}
        {previewSubmission && (
          <SubmissionSplitPreviewModal
            previewSubmission={previewSubmission}
            assignments={assignments}
            submissions={submissions}
            currentUser={currentUser}
            onClose={() => setPreviewSubmission(null)}
            onSelectSubmission={handleOpenPreviewSubmission}
            onDownload={handleDownloadSubmissionFile}
            onSaveGrade={(updated, advanceNext) => {
              saveStoredSubmission(updated);
              setSubmissions(prev => {
                const idx = prev.findIndex(s => s.id === updated.id);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = updated;
                  return next;
                }
                return [updated, ...prev];
              });

              if (advanceNext) {
                const asgSubmissions = submissions.filter(s => s.assignmentId === (previewSubmission.asg?.id || updated.assignmentId));
                const sortedSubs = asgSubmissions.length > 0
                  ? [...asgSubmissions].sort((a, b) => a.studentName.localeCompare(b.studentName))
                  : [updated];
                const currentIdx = sortedSubs.findIndex(s => s.id === updated.id || s.studentId === updated.studentId);
                if (currentIdx >= 0 && currentIdx < sortedSubs.length - 1) {
                  const nextSub = sortedSubs[currentIdx + 1];
                  handleOpenPreviewSubmission(nextSub, previewSubmission.asg);
                  showToast(`Nilai tersimpan (${updated.grade}/100)! Melanjutkan ke ${nextSub.studentName}.`, 'success');
                  return;
                }
              }

              setPreviewSubmission(null);
              showToast(`Nilai (${updated.grade}/100) dan umpan balik berhasil disimpan!`, 'success');
            }}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-indigo-100 bg-white px-4 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 SMP Negeri 3 Cihampelas. Sistem Terpadu E-Learning & Presensi Sekolah.</span>
          <div className="flex items-center gap-3">
            <span className="text-indigo-600 font-semibold">Buku Piket Digital</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">CBT Lab Komputer</span>
            <span>•</span>
            <span className="text-purple-700 font-semibold">Kurikulum Merdeka</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
