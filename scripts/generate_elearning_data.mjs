import fs from 'fs';

const parsed = JSON.parse(fs.readFileSync('scripts/parsed_students.json', 'utf8'));
const { classCounts, students } = parsed;

const classNames = Object.keys(classCounts);

// Generate SCHOOL_CLASSES
const schoolClasses = classNames.map(clsId => {
  return {
    id: clsId,
    name: `Kelas ${clsId}`,
    waliKelas: 'Wali Kelas ' + clsId,
    totalStudents: classCounts[clsId]
  };
});

const content = `'use client';

// Types for E-Learning & Presensi Sekolah
export interface Student {
  id: string;
  nisn: string;
  nis?: string;
  name: string;
  gender?: string;
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

// All Official Classes at SMP Negeri 3 Cihampelas (Tahun Pelajaran 2026/2027)
export const SCHOOL_CLASSES = ${JSON.stringify(schoolClasses, null, 2)};

// 535 Official Students of SMP Negeri 3 Cihampelas (Tahun Pelajaran 2026/2027)
export const INITIAL_STUDENTS: Student[] = ${JSON.stringify(students, null, 2)};

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
  nisn: '${students[0]?.nisn || '0133138158'}',
  name: '${students[0]?.name || 'Abdul Hanan'}',
  classId: '${students[0]?.classId || '7-A'}'
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
        '7A-03': 'S',
        '7A-04': 'H',
        '7A-05': 'H',
        '7A-06': 'H',
        '7A-07': 'I',
        '7A-08': 'H',
      },
      notes: {
        '7A-03': 'Surat dokter dititip ke satpam',
        '7A-07': 'Ada acara keluarga'
      }
    }
  };
};

const STORAGE_KEY = 'spentic_elearning_attendance_v2';

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
`;

fs.writeFileSync('src/lib/elearningData.ts', content);
console.log('Successfully updated src/lib/elearningData.ts with 535 students and 17 classes!');
