'use client';

// Types for E-Learning & Presensi Sekolah
export interface Student {
  id: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  classId: string;
}

export type AttendanceStatus = 'H' | 'S' | 'I' | 'A' | 'T'; // Hadir, Sakit, Izin, Alpa, Terlambat

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
  updatedAt?: string;
}

export interface ClassSessionAttendance {
  classId: string;
  date: string; // YYYY-MM-DD
  subject: string;
  teacherName: string;
  teacherNip: string;
  isSubmitted: boolean;
  submittedAt?: string;
  records: Record<string, AttendanceStatus>; // studentId -> status
  notes?: Record<string, string>; // studentId -> note
}

export interface TeacherUser {
  nip: string;
  name: string;
  role: 'mapel' | 'piket' | 'both';
  subject: string;
  classes: string[];
}

export interface StudentUser {
  nisn: string;
  name: string;
  classId: string;
}

// Available Classes at SMPN 3 Cihampelas
export const SCHOOL_CLASSES = [
  { id: '7-A', name: 'Kelas 7-A', waliKelas: 'Dra. Eni Rohaeni', totalStudents: 32 },
  { id: '7-B', name: 'Kelas 7-B', waliKelas: 'Asep Saepudin, S.Pd', totalStudents: 32 },
  { id: '7-C', name: 'Kelas 7-C', waliKelas: 'Rina Marlina, S.Pd', totalStudents: 32 },
  { id: '8-A', name: 'Kelas 8-A', waliKelas: 'Hendra Gunawan, S.Pd', totalStudents: 32 },
  { id: '8-B', name: 'Kelas 8-B', waliKelas: 'Dra. Hj. Nunung', totalStudents: 32 },
  { id: '8-C', name: 'Kelas 8-C', waliKelas: 'Dedi Kusnadi, S.Pd', totalStudents: 32 },
  { id: '9-A', name: 'Kelas 9-A', waliKelas: 'Drs. H. Maman', totalStudents: 32 },
  { id: '9-B', name: 'Kelas 9-B', waliKelas: 'Yanti Susanti, M.Pd', totalStudents: 32 },
  { id: '9-C', name: 'Kelas 9-C', waliKelas: 'Agus Salim, S.Pd', totalStudents: 32 },
];

// Pre-populated realistic student roster for SMP Negeri 3 Cihampelas
export const INITIAL_STUDENTS: Student[] = [
  // Kelas 7-A
  { id: '7A-01', nisn: '0091823001', name: 'Ahmad Fauzan', gender: 'L', classId: '7-A' },
  { id: '7A-02', nisn: '0091823002', name: 'Alfi Nur Rohman', gender: 'L', classId: '7-A' },
  { id: '7A-03', nisn: '0091823003', name: 'Annisa Fitriani', gender: 'P', classId: '7-A' },
  { id: '7A-04', nisn: '0091823004', name: 'Bagas Aditya Pratama', gender: 'L', classId: '7-A' },
  { id: '7A-05', nisn: '0091823005', name: 'Cantika Dewi Putri', gender: 'P', classId: '7-A' },
  { id: '7A-06', nisn: '0091823006', name: 'Dafa Alamsyah', gender: 'L', classId: '7-A' },
  { id: '7A-07', nisn: '0091823007', name: 'Dina Rahmawati', gender: 'P', classId: '7-A' },
  { id: '7A-08', nisn: '0091823008', name: 'Fajar Nugraha', gender: 'L', classId: '7-A' },
  { id: '7A-09', nisn: '0091823009', name: 'Gita Permatasari', gender: 'P', classId: '7-A' },
  { id: '7A-10', nisn: '0091823010', name: 'Hafiz Ridwan', gender: 'L', classId: '7-A' },
  { id: '7A-11', nisn: '0091823011', name: 'Intan Nur Aini', gender: 'P', classId: '7-A' },
  { id: '7A-12', nisn: '0091823012', name: 'Jovan Satria', gender: 'L', classId: '7-A' },

  // Kelas 8-A
  { id: '8A-01', nisn: '0084920192', name: 'Aditia Pratama', gender: 'L', classId: '8-A' },
  { id: '8A-02', nisn: '0084920193', name: 'Alya Zahra Salsabila', gender: 'P', classId: '8-A' },
  { id: '8A-03', nisn: '0084920194', name: 'Bima Satria Yudha', gender: 'L', classId: '8-A' },
  { id: '8A-04', nisn: '0084920195', name: 'Chairul Anam', gender: 'L', classId: '8-A' },
  { id: '8A-05', nisn: '0084920196', name: 'Dewi Sartika Putri', gender: 'P', classId: '8-A' },
  { id: '8A-06', nisn: '0084920197', name: 'Dimas Anggoro', gender: 'L', classId: '8-A' },
  { id: '8A-07', nisn: '0084920198', name: 'Farhan Maulana', gender: 'L', classId: '8-A' },
  { id: '8A-08', nisn: '0084920199', name: 'Indah Permata Sari', gender: 'P', classId: '8-A' },
  { id: '8A-09', nisn: '0084920200', name: 'Muhammad Rizky Ramadhan', gender: 'L', classId: '8-A' },
  { id: '8A-10', nisn: '0084920201', name: 'Nabila Syakirah', gender: 'P', classId: '8-A' },
  { id: '8A-11', nisn: '0084920202', name: 'Raka Pratama Putra', gender: 'L', classId: '8-A' },
  { id: '8A-12', nisn: '0084920203', name: 'Siti Nurhaliza', gender: 'P', classId: '8-A' },

  // Kelas 9-A
  { id: '9A-01', nisn: '0073819001', name: 'Andi Saputra', gender: 'L', classId: '9-A' },
  { id: '9A-02', nisn: '0073819002', name: 'Bella Safitri', gender: 'P', classId: '9-A' },
  { id: '9A-03', nisn: '0073819003', name: 'Candra Wijaya', gender: 'L', classId: '9-A' },
  { id: '9A-04', nisn: '0073819004', name: 'Dian Anggraini', gender: 'P', classId: '9-A' },
  { id: '9A-05', nisn: '0073819005', name: 'Eko Prasetyo', gender: 'L', classId: '9-A' },
  { id: '9A-06', nisn: '0073819006', name: 'Fitri Handayani', gender: 'P', classId: '9-A' },
];

// Demo Teacher Accounts
export const DEMO_TEACHERS: TeacherUser[] = [
  {
    nip: '19850615 201001 1 012',
    name: 'Hendra Gunawan, S.Pd',
    role: 'mapel',
    subject: 'Ilmu Pengetahuan Alam (IPA)',
    classes: ['7-A', '7-B', '8-A']
  },
  {
    nip: '19780214 200501 2 008',
    name: 'Dra. Siti Aminah, M.Pd',
    role: 'piket',
    subject: 'Matematika & Tim Piket',
    classes: ['7-A', '8-A', '9-A']
  }
];

export const DEMO_STUDENT: StudentUser = {
  nisn: '0084920192',
  name: 'Aditia Pratama',
  classId: '8-A'
};

// Initial Mock Attendance State for Today
export const GET_INITIAL_ATTENDANCE = (): Record<string, ClassSessionAttendance> => {
  const today = new Date().toISOString().split('T')[0];
  return {
    '7-A': {
      classId: '7-A',
      date: today,
      subject: 'Ilmu Pengetahuan Alam (IPA)',
      teacherName: 'Hendra Gunawan, S.Pd',
      teacherNip: '19850615 201001 1 012',
      isSubmitted: true,
      submittedAt: '07:22 WIB',
      records: {
        '7A-01': 'H',
        '7A-02': 'H',
        '7A-03': 'S', // Annisa Fitriani Sakit
        '7A-04': 'H',
        '7A-05': 'H',
        '7A-06': 'H',
        '7A-07': 'I', // Dina Izin
        '7A-08': 'H',
        '7A-09': 'H',
        '7A-10': 'H',
        '7A-11': 'H',
        '7A-12': 'H',
      },
      notes: {
        '7A-03': 'Surat dokter dititip ke satpam',
        '7A-07': 'Ada acara keluarga di Garut'
      }
    },
    '8-A': {
      classId: '8-A',
      date: today,
      subject: 'Matematika',
      teacherName: 'Dra. Siti Aminah, M.Pd',
      teacherNip: '19780214 200501 2 008',
      isSubmitted: false, // Belum diabsen
      records: {},
      notes: {}
    }
  };
};

const STORAGE_KEY = 'spentic_elearning_attendance_v1';

export function getStoredAttendance(): Record<string, ClassSessionAttendance> {
  if (typeof window === 'undefined') return GET_INITIAL_ATTENDANCE();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = GET_INITIAL_ATTENDANCE();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading attendance from localStorage', e);
    return GET_INITIAL_ATTENDANCE();
  }
}

export function saveStoredAttendance(data: Record<string, ClassSessionAttendance>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('elearningAttendanceUpdated'));
  } catch (e) {
    console.error('Failed saving attendance to localStorage', e);
  }
}
