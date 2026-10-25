'use client';

import { Student, getStoredStudents, saveStoredStudents } from './elearningData';

export type CbtQuestionType = 'pg' | 'pg_kompleks' | 'benar_salah' | 'menjodohkan';

export interface CbtStatementItem {
  id: string;
  statement: string;
  correctAnswer: boolean; // true = Benar, false = Salah
}

export interface CbtMatchingItem {
  id: string;
  leftPrompt: string;
  rightMatch: string;
}

export interface CbtQuestion {
  id: string;
  number: number;
  type: CbtQuestionType;
  question: string;
  scoreWeight: number; // bobot nilai default: 1
  
  // Media Stimulus
  mediaType?: 'image' | 'audio' | 'video' | 'none';
  mediaUrl?: string;
  mediaCaption?: string;
  audioMaxPlays?: number; // max kali putar untuk listening (default: 3)

  // Opsi untuk PG & PG Kompleks
  options?: string[]; // ['A. ...', 'B. ...', 'C. ...', 'D. ...']
  correctOptionIndex?: number; // untuk PG tunggal (0 = A, 1 = B, dst)
  correctOptionIndices?: number[]; // untuk PG kompleks ([0, 2] = A & C)

  // Khusus Benar / Salah
  statements?: CbtStatementItem[];

  // Khusus Menjodohkan
  matchingPairs?: CbtMatchingItem[];
}

export interface CbtExamPackage {
  id: string;
  title: string;
  subject: string;
  gradeLevel: '7' | '8' | '9' | 'Semua';
  targetClasses: string[]; // ['7-A', '7-B', ...]
  semester: 'Ganjil (PTS/STS)' | 'Ganjil (PAS/SAS)' | 'Genap (PTS/STS)' | 'Genap (PAT/SAT)';
  academicYear: string; // '2026/2027'
  durationMinutes: number; // e.g. 60 or 90
  token: string; // e.g. 'IPA7PAS'
  passingGrade: number; // KKM e.g. 75
  totalQuestions: number;
  status: 'active' | 'draft' | 'completed';
  teacherName: string;
  questions: CbtQuestion[];
  instructions?: string;
  createdAt: string;

  // Fitur Baru: Penjadwalan Waktu Otomatis & Jeda Darurat
  examDate?: string; // Format 'YYYY-MM-DD' e.g. '2026-10-20'
  startTime?: string; // Format 'HH:mm' e.g. '07:30'
  endTime?: string; // Format 'HH:mm' e.g. '09:00'
  emergencyPaused?: boolean; // True jika panitia menekan jeda darurat
  emergencyPauseReason?: string; // Catatan alasan jeda darurat
}

export interface CbtStudentAnswerState {
  examId: string;
  studentId: string;
  studentNisn: string;
  studentName: string;
  classId: string;
  roomName: string;
  
  // Jawaban per questionId:
  // - PG: number (index opsi)
  // - PG Kompleks: number[] (array index)
  // - Benar / Salah: Record<string, boolean> (statementId -> true/false)
  // - Menjodohkan: Record<string, string> (matchingId -> selectedRightMatch)
  answers: Record<string, any>;
  
  // Tanda Ragu-Ragu per questionId
  doubtfuls: Record<string, boolean>;
  
  // Counter berapa kali audio diputar per questionId
  audioPlayCount: Record<string, number>;

  startedAt: string;
  submittedAt?: string;
  isSubmitted: boolean;

  // Hasil perhitungan otomatis
  score?: number;
  totalScore?: number;
  correctCount?: number;
  wrongCount?: number;
  isPassed?: boolean;
  violationCount?: number; // berapa kali terdeteksi pindah tab
}

export interface CbtRoomAttendance {
  roomName: string; // 'Ruang 01' s/d 'Ruang 17' atau 'Lab Komputer 1'
  examId: string;
  examTitle: string;
  date: string;
  supervisorName: string;
  token: string;
  records: Record<string, 'H' | 'S' | 'I' | 'A'>;
  notes?: string;
  isBapSubmitted?: boolean;
  submittedAt?: string;
}

// -------------------------------------------------------------
// KONFIGURASI 17 RUANG UJIAN RESMI SMP NEGERI 3 CIHAMPELAS (SATU TINGKAT MURNI)
// -------------------------------------------------------------
export interface CbtExamRoomConfig {
  id: string; // e.g. 'ruang-01'
  name: string; // e.g. 'Ruang 01'
  classes: string[]; // e.g. ['7-A'] or ['7-A', '8-A']
  capacity: number;
  label: string; // e.g. 'Ruang 01 (Kelas 7-A)' or 'Ruang 01 (Campur 7-A & 8-A)'
  supervisorName?: string;
  assignedStudentIds?: string[]; // student IDs explicitly placed in this room
}

export interface CbtPanitiaConfig {
  rooms: CbtExamRoomConfig[];
  examSessionName: string;
  academicYear: string;
  semester: string;
}

// -------------------------------------------------------------
// JADWAL PENGAWAS RUANG CBT RESMI PANITIA (JAM 1 & JAM 2)
// -------------------------------------------------------------
// -------------------------------------------------------------
// JADWAL PENGAWAS RUANG CBT RESMI PANITIA (FLEKSIBEL N-SESI)
// -------------------------------------------------------------
export interface CbtScheduleSessionSlot {
  id: string; // e.g. 's1', 's2', 's3', 's4'
  name: string; // e.g. 'Jam Ke-1', 'Jam Ke-2', 'Jam Ke-3'
  startTime: string; // e.g. '07:30'
  endTime: string; // e.g. '09:00'
  subject?: string; // e.g. 'Informatika'
  linkedPackageId?: string; // ID paket ujian CBT yang ditautkan
}

export interface CbtSupervisorScheduleEntry {
  roomId: string; // e.g. 'ruang-01'
  roomName: string; // e.g. 'Ruang 01'
  roomLabel: string; // e.g. 'Ruang 01 (Kelas 7-A)'
  session1Supervisor?: string; // backward-compatibility alias untuk s1
  session2Supervisor?: string; // backward-compatibility alias untuk s2
  supervisors?: Record<string, string>; // slotId -> supervisorName (e.g. { s1: '...', s2: '...', s3: '...' })
}

export interface CbtSupervisorSchedule {
  examDate: string;
  sessions?: CbtScheduleSessionSlot[]; // Daftar sesi dinamis: Jam 1, Jam 2, Jam 3, Jam 4, Jam 5, dst.
  entries: CbtSupervisorScheduleEntry[];
}

export const DEFAULT_SCHEDULE_SESSIONS: CbtScheduleSessionSlot[] = [
  { id: 's1', name: 'Jam Ke-1', startTime: '07:30', endTime: '09:00', subject: 'Informatika' },
  { id: 's2', name: 'Jam Ke-2', startTime: '09:30', endTime: '11:00', subject: 'Bahasa Inggris' }
];

export function getSupervisorForSlot(entry: CbtSupervisorScheduleEntry, slotId: string): string {
  if (entry.supervisors && entry.supervisors[slotId]) {
    return entry.supervisors[slotId];
  }
  if (slotId === 's1' && entry.session1Supervisor) return entry.session1Supervisor;
  if (slotId === 's2' && entry.session2Supervisor) return entry.session2Supervisor;
  return 'Guru Pengawas';
}

/**
 * Otomatis mendeteksi dan mengelompokkan paket ujian CBT yang diterbitkan guru-guru
 * berdasarkan tanggal dan rentang jam pengerjaannya, lalu membuat daftar slot Sesi (Jam 1, 2, 3 dst.).
 */
export function generateSessionsFromExamPackages(
  packages: CbtExamPackage[],
  targetDate?: string
): CbtScheduleSessionSlot[] {
  const dateToUse = targetDate || new Date().toISOString().split('T')[0];
  
  // Ambil paket yang tanggalnya cocok (atau tanpa tanggal)
  const matched = packages.filter(p => !p.examDate || p.examDate === dateToUse);
  
  if (matched.length === 0) {
    return [
      { id: 's1', name: 'Jam Ke-1', startTime: '07:30', endTime: '09:00', subject: 'Sesi Pagi Utama' },
      { id: 's2', name: 'Jam Ke-2', startTime: '09:30', endTime: '11:00', subject: 'Sesi Siang' }
    ];
  }

  // Kelompokkan berdasarkan waktu mulai & selesai unik, lalu urutkan
  const timeSlotMap = new Map<string, { startTime: string; endTime: string; subjects: Set<string>; packageIds: string[] }>();
  
  matched.forEach(pkg => {
    const start = pkg.startTime || '07:30';
    const end = pkg.endTime || '09:00';
    const key = `${start}_${end}`;
    if (!timeSlotMap.has(key)) {
      timeSlotMap.set(key, {
        startTime: start,
        endTime: end,
        subjects: new Set([pkg.subject]),
        packageIds: [pkg.id]
      });
    } else {
      const existing = timeSlotMap.get(key)!;
      existing.subjects.add(pkg.subject);
      existing.packageIds.push(pkg.id);
    }
  });

  // Urutkan berdasarkan jam mulai
  const sortedSlots = Array.from(timeSlotMap.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return sortedSlots.map((slot, idx) => ({
    id: `s${idx + 1}`,
    name: `Jam Ke-${idx + 1}`,
    startTime: slot.startTime,
    endTime: slot.endTime,
    subject: Array.from(slot.subjects).join(' & '),
    linkedPackageId: slot.packageIds[0]
  }));
}

const CBT_SUPERVISOR_SCHEDULES_MAP_KEY = 'cbt_supervisor_schedules_map_v1';
const CBT_SUPERVISOR_SCHEDULE_KEY = 'cbt_supervisor_schedule_v1';

function normalizeSupervisorSchedule(parsed: any, targetDate: string): CbtSupervisorSchedule {
  const sessions: CbtScheduleSessionSlot[] = (Array.isArray(parsed.sessions) && parsed.sessions.length > 0)
    ? parsed.sessions
    : [
        { id: 's1', name: 'Jam Ke-1', startTime: '07:30', endTime: '09:00', subject: 'Informatika' },
        { id: 's2', name: 'Jam Ke-2', startTime: '09:30', endTime: '11:00', subject: 'Bahasa Inggris' }
      ];

  const entries: CbtSupervisorScheduleEntry[] = (parsed.entries || []).map((entry: any) => {
    const sups = { ...(entry.supervisors || {}) };
    if (!sups['s1'] && entry.session1Supervisor) sups['s1'] = entry.session1Supervisor;
    if (!sups['s2'] && entry.session2Supervisor) sups['s2'] = entry.session2Supervisor;
    return {
      ...entry,
      session1Supervisor: sups['s1'] || entry.session1Supervisor || 'Guru Pengawas',
      session2Supervisor: sups['s2'] || entry.session2Supervisor || 'Guru Pengawas',
      supervisors: sups
    };
  });

  return {
    examDate: parsed.examDate || targetDate,
    sessions,
    entries
  };
}

export function getDefaultSupervisorSchedule(targetDate?: string): CbtSupervisorSchedule {
  const rooms = getDefaultSchoolRooms();
  const defaultTeachers = [
    'Ichsanul Arifin, S.Kom.',
    'Cucu Rohaeti, S.Pd.',
    'Dani Ramdani, S.Pd.',
    'Dra. Hj. Siti Rohmah, M.Pd.',
    'Yudi, S.Pd.',
    'Siti Nurhaliza, S.Pd.',
    'Ahmad Fauzi, S.Pd.I.',
    'Budi Santoso, S.Pd.',
    'Rina Marlina, S.Pd.',
    'Eka Prasetya, S.Pd.',
    'Dewi Sartika, S.Pd.',
    'Agus Setiawan, S.Pd.',
    'Fitri Handayani, S.Pd.',
    'Hendri Gunawan, S.Pd.',
    'Novi Andriani, S.Pd.',
    'Rahmat Hidayat, S.Pd.',
    'Wawan Kuswandi, S.Pd.'
  ];

  const dateToUse = targetDate || new Date().toISOString().split('T')[0];
  const sessions: CbtScheduleSessionSlot[] = [
    { id: 's1', name: 'Jam Ke-1', startTime: '07:30', endTime: '09:00', subject: 'Informatika' },
    { id: 's2', name: 'Jam Ke-2', startTime: '09:30', endTime: '11:00', subject: 'Bahasa Inggris' }
  ];

  const entries: CbtSupervisorScheduleEntry[] = rooms.map((r, idx) => {
    const s1Teacher = defaultTeachers[idx % defaultTeachers.length];
    const s2Teacher = defaultTeachers[(idx + 4) % defaultTeachers.length];
    return {
      roomId: r.id,
      roomName: r.name,
      roomLabel: r.label,
      session1Supervisor: s1Teacher,
      session2Supervisor: s2Teacher,
      supervisors: {
        s1: s1Teacher,
        s2: s2Teacher
      }
    };
  });

  return {
    examDate: dateToUse,
    sessions,
    entries
  };
}

export function getStoredSupervisorSchedule(targetDate?: string): CbtSupervisorSchedule {
  const dateToUse = targetDate || (typeof window !== 'undefined' ? (localStorage.getItem('cbt_active_schedule_date') || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]);

  if (typeof window === 'undefined') return getDefaultSupervisorSchedule(dateToUse);
  try {
    // 1. Cek penyimpanan multi-hari per tanggal
    const rawMap = localStorage.getItem(CBT_SUPERVISOR_SCHEDULES_MAP_KEY);
    if (rawMap) {
      const map = JSON.parse(rawMap);
      if (map && map[dateToUse] && Array.isArray(map[dateToUse].entries) && map[dateToUse].entries.length > 0) {
        return normalizeSupervisorSchedule(map[dateToUse], dateToUse);
      }
    }

    // 2. Cek key jadwal aktif tunggal jika tanggal cocok
    const raw = localStorage.getItem(CBT_SUPERVISOR_SCHEDULE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.entries) && parsed.entries.length > 0) {
        if (!targetDate || parsed.examDate === dateToUse) {
          return normalizeSupervisorSchedule(parsed, dateToUse);
        }
      }
    }

    // 3. Jika belum pernah disimpan untuk tanggal ini, periksa apakah guru sudah menerbitkan paket di tanggal ini!
    const pkgs = getStoredCbtPackages();
    const pkgsOnDate = pkgs.filter(p => !p.examDate || p.examDate === dateToUse);
    if (pkgsOnDate.length > 0) {
      const autoSessions = generateSessionsFromExamPackages(pkgs, dateToUse);
      const rooms = getDefaultSchoolRooms();
      const defaultTeachers = [
        'Ichsanul Arifin, S.Kom.',
        'Cucu Rohaeti, S.Pd.',
        'Dani Ramdani, S.Pd.',
        'Dra. Hj. Siti Rohmah, M.Pd.',
        'Yudi, S.Pd.',
        'Siti Nurhaliza, S.Pd.',
        'Ahmad Fauzi, S.Pd.I.',
        'Budi Santoso, S.Pd.',
        'Rina Marlina, S.Pd.',
        'Eka Prasetya, S.Pd.',
        'Dewi Sartika, S.Pd.',
        'Agus Setiawan, S.Pd.',
        'Fitri Handayani, S.Pd.',
        'Hendri Gunawan, S.Pd.',
        'Novi Andriani, S.Pd.',
        'Rahmat Hidayat, S.Pd.',
        'Wawan Kuswandi, S.Pd.'
      ];
      const entries: CbtSupervisorScheduleEntry[] = rooms.map((r, idx) => {
        const sups: Record<string, string> = {};
        autoSessions.forEach((slot, sIdx) => {
          sups[slot.id] = defaultTeachers[(idx + sIdx * 4) % defaultTeachers.length];
        });
        return {
          roomId: r.id,
          roomName: r.name,
          roomLabel: r.label,
          session1Supervisor: sups['s1'],
          session2Supervisor: sups['s2'],
          supervisors: sups
        };
      });

      const autoSchedule: CbtSupervisorSchedule = {
        examDate: dateToUse,
        sessions: autoSessions,
        entries
      };
      saveStoredSupervisorSchedule(autoSchedule);
      return autoSchedule;
    }
  } catch (e) {
    console.error('Failed parsing supervisor schedule', e);
  }

  const def = getDefaultSupervisorSchedule(dateToUse);
  saveStoredSupervisorSchedule(def);
  return def;
}

export function saveStoredSupervisorSchedule(schedule: CbtSupervisorSchedule) {
  if (typeof window === 'undefined') return;
  try {
    const dateKey = schedule.examDate || new Date().toISOString().split('T')[0];
    localStorage.setItem('cbt_active_schedule_date', dateKey);

    // Simpan ke peta multi-hari
    let map: Record<string, CbtSupervisorSchedule> = {};
    const rawMap = localStorage.getItem(CBT_SUPERVISOR_SCHEDULES_MAP_KEY);
    if (rawMap) {
      try {
        map = JSON.parse(rawMap) || {};
      } catch (e) {}
    }
    map[dateKey] = schedule;
    localStorage.setItem(CBT_SUPERVISOR_SCHEDULES_MAP_KEY, JSON.stringify(map));

    // Simpan juga ke key tunggal aktif
    localStorage.setItem(CBT_SUPERVISOR_SCHEDULE_KEY, JSON.stringify(schedule));
    window.dispatchEvent(new Event('cbtSupervisorScheduleUpdated'));
  } catch (e) {
    console.error('Failed saving supervisor schedule', e);
  }
}

export function getDefaultSchoolRooms(): CbtExamRoomConfig[] {
  // 17 Rombel Resmi SMP Negeri 3 Cihampelas:
  // Kelas 7: 7-A s.d 7-F (6 Kelas)
  // Kelas 8: 8-A s.d 8-F (6 Kelas)
  // Kelas 9: 9-A s.d 9-E (5 Kelas, sampai 9-E)
  const roomList: { num: string; classId: string; capacity: number }[] = [
    { num: '01', classId: '7-A', capacity: 35 },
    { num: '02', classId: '7-B', capacity: 35 },
    { num: '03', classId: '7-C', capacity: 34 },
    { num: '04', classId: '7-D', capacity: 34 },
    { num: '05', classId: '7-E', capacity: 33 },
    { num: '06', classId: '7-F', capacity: 35 },
    { num: '07', classId: '8-A', capacity: 30 },
    { num: '08', classId: '8-B', capacity: 32 },
    { num: '09', classId: '8-C', capacity: 32 },
    { num: '10', classId: '8-D', capacity: 31 },
    { num: '11', classId: '8-E', capacity: 31 },
    { num: '12', classId: '8-F', capacity: 30 },
    { num: '13', classId: '9-A', capacity: 27 },
    { num: '14', classId: '9-B', capacity: 29 },
    { num: '15', classId: '9-C', capacity: 29 },
    { num: '16', classId: '9-D', capacity: 28 },
    { num: '17', classId: '9-E', capacity: 30 },
  ];

  const rooms: CbtExamRoomConfig[] = roomList.map(r => ({
    id: `ruang-${r.num}`,
    name: `Ruang ${r.num}`,
    classes: [r.classId],
    capacity: r.capacity,
    label: `Ruang ${r.num} (Kelas ${r.classId})`,
    supervisorName: 'Guru Pengawas'
  }));

  return rooms;
}

const CBT_PANITIA_CONFIG_KEY = 'cbt_panitia_config_v2';

export function getStoredCbtPanitiaConfig(): CbtPanitiaConfig {
  if (typeof window === 'undefined') {
    return {
      rooms: getDefaultSchoolRooms(),
      examSessionName: 'Sesi 1 (Pagi)',
      academicYear: '2026/2027',
      semester: 'PTS / STS Ganjil'
    };
  }

  try {
    const raw = localStorage.getItem(CBT_PANITIA_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.rooms && Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
        // Filter out any legacy lab rooms to honor user preference
        const cleanedRooms = parsed.rooms.filter(
          (r: CbtExamRoomConfig) => !r.id.startsWith('lab') && !r.name.toLowerCase().includes('lab komputer')
        );
        // Automatic deduplication by id and name
        const seenIds = new Set<string>();
        const seenNames = new Set<string>();
        const uniqueRooms = cleanedRooms.filter((r: CbtExamRoomConfig) => {
          if (!r.id || seenIds.has(r.id) || seenNames.has(r.name.toLowerCase().trim())) return false;
          seenIds.add(r.id);
          seenNames.add(r.name.toLowerCase().trim());
          return true;
        });
        return {
          ...parsed,
          rooms: uniqueRooms.length > 0 ? uniqueRooms : getDefaultSchoolRooms()
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse cbt_panitia_config', e);
  }

  const initial: CbtPanitiaConfig = {
    rooms: getDefaultSchoolRooms(),
    examSessionName: 'Sesi 1 (Pagi)',
    academicYear: '2026/2027',
    semester: 'PTS / STS Ganjil'
  };
  saveStoredCbtPanitiaConfig(initial);
  return initial;
}

export function saveStoredCbtPanitiaConfig(config: CbtPanitiaConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CBT_PANITIA_CONFIG_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('cbtPanitiaConfigUpdated', { detail: config }));
    // Asynchronous background cloud sync to Hostinger MySQL
    if (config.rooms && Array.isArray(config.rooms)) {
      try {
        import('./cloudSync').then(m => m.pushCbtRoomsToCloud(config.rooms)).catch(() => {});
      } catch {}
    }
  } catch (e) {
    console.error('Failed to save cbt_panitia_config', e);
  }
}

// -------------------------------------------------------------
// HELPER PENEMPATAN SISWA KE RUANGAN CBT
// -------------------------------------------------------------

/**
 * Mengambil daftar siswa yang ditempatkan di suatu ruangan tertentu.
 * Jika ruangan memiliki assignedStudentIds eksplisit, kembalikan siswa tersebut.
 * Jika tidak, fallback ke pencocokan kelas (room.classes).
 */
export function getStudentsForRoom(room: CbtExamRoomConfig | undefined | null, allStudents: Student[]): Student[] {
  if (!room) return [];
  if (room.assignedStudentIds && Array.isArray(room.assignedStudentIds) && room.assignedStudentIds.length > 0) {
    const idSet = new Set(room.assignedStudentIds);
    return allStudents.filter(s => idSet.has(s.id));
  }
  if (room.classes.includes('Semua')) {
    return allStudents;
  }
  return allStudents.filter(s => room.classes.includes(s.classId));
}

/**
 * Mencari ruangan tempat seorang siswa ditempatkan.
 * Prioritas 1: Ruangan dengan assignedStudentIds yang memuat ID siswa.
 * Prioritas 2: Ruangan reguler yang cocok kelasnya dan belum memiliki assignedStudentIds custom.
 */
export function getRoomForStudent(student: Student, rooms: CbtExamRoomConfig[]): CbtExamRoomConfig | undefined {
  // 1. Cek penempatan eksplisit
  const explicit = rooms.find(r => r.assignedStudentIds && r.assignedStudentIds.includes(student.id));
  if (explicit) return explicit;

  // 2. Cek ruangan reguler berbasis kelas yang belum dicustom
  const regularClassMatch = rooms.find(r =>
    (!r.assignedStudentIds || r.assignedStudentIds.length === 0) &&
    r.classes.includes(student.classId)
  );
  if (regularClassMatch) return regularClassMatch;

  // 3. Fallback umum jika belum pernah dicustom
  return rooms.find(r => r.classes.includes(student.classId));
}

/**
 * Memperbarui label dan classes pada konfigurasi ruangan berdasarkan siswa yang ada di dalamnya.
 */
export function updateRoomMetadata(room: CbtExamRoomConfig, roomStudents: Student[]): CbtExamRoomConfig {
  if (roomStudents.length === 0) {
    return {
      ...room,
      classes: [],
      label: `${room.name} (Kosong)`
    };
  }
  const uniqueClasses = Array.from(new Set(roomStudents.map(s => s.classId))).sort();
  const labelSuffix = uniqueClasses.length > 1
    ? `Campur ${uniqueClasses.join(' & ')}`
    : `Kelas ${uniqueClasses[0]}`;

  return {
    ...room,
    classes: uniqueClasses,
    label: `${room.name} (${labelSuffix})`
  };
}

/**
 * Fitur Spesial: Pembagian Silang 2 Kelas ke 2 Ruangan (50% - 50%).
 * Contoh: 50% 7-A + 50% 8-A ke Ruang 01, sisa 50% 7-A + 50% 8-A ke Ruang 02.
 */
export function splitTwoClassesAcrossTwoRooms(
  classAId: string,
  classBId: string,
  roomAId: string,
  roomBId: string,
  currentRooms: CbtExamRoomConfig[],
  allStudents: Student[]
): CbtExamRoomConfig[] {
  // Ambil siswa Kelas A dan B urut alfabetis
  const classA = allStudents
    .filter(s => s.classId === classAId)
    .sort((a, b) => a.name.localeCompare(b.name));
  const classB = allStudents
    .filter(s => s.classId === classBId)
    .sort((a, b) => a.name.localeCompare(b.name));

  const halfAIndex = Math.ceil(classA.length / 2);
  const halfBIndex = Math.ceil(classB.length / 2);

  const firstHalfA = classA.slice(0, halfAIndex);
  const secondHalfA = classA.slice(halfAIndex);

  const firstHalfB = classB.slice(0, halfBIndex);
  const secondHalfB = classB.slice(halfBIndex);

  const roomAStudents = [...firstHalfA, ...firstHalfB];
  const roomBStudents = [...secondHalfA, ...secondHalfB];

  const affectedStudentIds = new Set([...classA.map(s => s.id), ...classB.map(s => s.id)]);

  return currentRooms.map(room => {
    if (room.id === roomAId) {
      const studentIds = roomAStudents.map(s => s.id);
      return {
        ...updateRoomMetadata(room, roomAStudents),
        assignedStudentIds: studentIds
      };
    }
    if (room.id === roomBId) {
      const studentIds = roomBStudents.map(s => s.id);
      return {
        ...updateRoomMetadata(room, roomBStudents),
        assignedStudentIds: studentIds
      };
    }

    // Jika ruangan lain memiliki salah satu siswa ini di assignedStudentIds, bersihkan untuk hindari duplikasi
    if (room.assignedStudentIds && room.assignedStudentIds.length > 0) {
      const filtered = room.assignedStudentIds.filter(id => !affectedStudentIds.has(id));
      const remainingStudents = allStudents.filter(s => filtered.includes(s.id));
      return {
        ...updateRoomMetadata(room, remainingStudents),
        assignedStudentIds: filtered
      };
    }

    return room;
  });
}

export const CBT_EXAM_ROOMS: string[] = [
  'Ruang 01 (Kelas 7-A)',
  'Ruang 02 (Kelas 7-B)',
  'Ruang 03 (Kelas 7-C)',
  'Ruang 04 (Kelas 7-D)',
  'Ruang 05 (Kelas 7-E)',
  'Ruang 06 (Kelas 7-F)',
  'Ruang 07 (Kelas 8-A)',
  'Ruang 08 (Kelas 8-B)',
  'Ruang 09 (Kelas 8-C)',
  'Ruang 10 (Kelas 8-D)',
  'Ruang 11 (Kelas 8-E)',
  'Ruang 12 (Kelas 8-F)',
  'Ruang 13 (Kelas 9-A)',
  'Ruang 14 (Kelas 9-B)',
  'Ruang 15 (Kelas 9-C)',
  'Ruang 16 (Kelas 9-D)',
  'Ruang 17 (Kelas 9-E)'
];

// -------------------------------------------------------------
// PAKET UJIAN CBT RESMI (DIBUAT LANGSUNG OLEH GURU & PANITIA)
// -------------------------------------------------------------
export const INITIAL_CBT_PACKAGES: CbtExamPackage[] = [];

// -------------------------------------------------------------
// STORAGE KEYS & LOCAL PERSISTENCE
// -------------------------------------------------------------
const CBT_PACKAGES_KEY = 'spentic_cbt_packages_v1';
const CBT_STUDENT_SESSIONS_KEY = 'spentic_cbt_student_sessions_v1';
const CBT_ROOM_ATTENDANCE_KEY = 'spentic_cbt_room_attendance_v1';

export function getStoredCbtPackages(): CbtExamPackage[] {
  if (typeof window === 'undefined') return INITIAL_CBT_PACKAGES;
  try {
    const raw = localStorage.getItem(CBT_PACKAGES_KEY);
    if (raw === null) {
      localStorage.setItem(CBT_PACKAGES_KEY, JSON.stringify(INITIAL_CBT_PACKAGES));
      return INITIAL_CBT_PACKAGES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((p: CbtExamPackage) => ({
        ...p,
        examDate: p.examDate || new Date().toISOString().split('T')[0],
        startTime: (p.startTime === '07:30' && p.endTime === '09:00') ? '06:00' : (p.startTime || '06:00'),
        endTime: (p.startTime === '07:30' && p.endTime === '09:00') ? '23:59' : (p.endTime || '23:59'),
        emergencyPaused: Boolean(p.emergencyPaused)
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export function deleteStoredCbtPackage(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const list = getStoredCbtPackages().filter(p => p.id !== id);
    localStorage.setItem(CBT_PACKAGES_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('cbtPackagesUpdated'));
    try {
      import('./cloudSync').then(m => m.deleteCbtPackageFromCloud(id)).catch(() => {});
    } catch {}
  } catch (e) {
    console.error('Failed deleting CBT package', e);
  }
}

export function saveStoredCbtPackages(packages: CbtExamPackage[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CBT_PACKAGES_KEY, JSON.stringify(packages));
    window.dispatchEvent(new Event('cbtPackagesUpdated'));
    // Asynchronous background cloud sync to Hostinger MySQL
    try {
      import('./cloudSync').then(m => {
        packages.forEach(p => m.pushCbtPackageToCloud(p));
      }).catch(() => {});
    } catch {}
  } catch (e) {
    console.error('Failed saving CBT packages', e);
  }
}

// -------------------------------------------------------------
// HELPER PENJADWALAN OTOMATIS BERDASARKAN JAM (TIME-WINDOW CBT)
// -------------------------------------------------------------
export type CbtScheduleState = 'upcoming' | 'ongoing' | 'expired' | 'emergency_paused';

export interface CbtScheduleEvaluation {
  scheduleState: CbtScheduleState;
  isActiveNow: boolean;
  canEnter: boolean;
  statusLabel: string;
  badgeClass: string;
  scheduleText: string;
  message?: string;
}

/**
 * Mengevaluasi status live paket ujian berdasarkan jam server/perangkat dan jeda darurat
 */
export function evaluateCbtPackageSchedule(
  pkg: CbtExamPackage | undefined | null,
  now: Date = new Date()
): CbtScheduleEvaluation {
  if (!pkg) {
    return {
      scheduleState: 'expired',
      isActiveNow: false,
      canEnter: false,
      statusLabel: 'TIDAK TERSEDIA',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      scheduleText: '-'
    };
  }

  // 1. Cek Jeda Darurat Panitia (Manual Emergency Pause)
  if (pkg.emergencyPaused || pkg.status === 'draft') {
    return {
      scheduleState: 'emergency_paused',
      isActiveNow: false,
      canEnter: false,
      statusLabel: '⏸️ DIJEDA DARURAT',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold animate-pulse',
      scheduleText: pkg.startTime && pkg.endTime ? `${pkg.startTime} - ${pkg.endTime} WIB` : 'Dijeda',
      message: pkg.emergencyPauseReason || 'Ujian sedang dijeda darurat oleh panitia (misal: kendala listrik/jaringan). Mohon tetap tenang di tempat duduk.'
    };
  }

  // 2. Mode Bebas / Fleksibel (Jika jam tidak diatur sama sekali)
  if (!pkg.startTime && !pkg.endTime && !pkg.examDate) {
    return {
      scheduleState: 'ongoing',
      isActiveNow: true,
      canEnter: true,
      statusLabel: '🟢 AKTIF (FLEKSIBEL)',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
      scheduleText: 'Waktu Fleksibel'
    };
  }

  // 3. Evaluasi Tanggal & Jam Lokal (Format 24 Jam)
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${hours}:${minutes}`;

  const targetDate = pkg.examDate || todayStr;
  const startTime = pkg.startTime || '00:00';
  const endTime = pkg.endTime || '23:59';
  const scheduleDisplay = `${startTime} - ${endTime} WIB`;

  // Evaluasi Tanggal
  if (todayStr < targetDate) {
    return {
      scheduleState: 'upcoming',
      isActiveNow: false,
      canEnter: false,
      statusLabel: `📅 ${targetDate}`,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      scheduleText: `${targetDate} • ${scheduleDisplay}`,
      message: `Ujian dijadwalkan pada ${targetDate} pukul ${scheduleDisplay}.`
    };
  }

  if (todayStr > targetDate) {
    return {
      scheduleState: 'expired',
      isActiveNow: false,
      canEnter: false,
      statusLabel: '🏁 JADWAL BERAKHIR',
      badgeClass: 'bg-slate-200 text-slate-700 border-slate-300 font-bold',
      scheduleText: `${targetDate} • ${scheduleDisplay}`,
      message: `Jadwal resmi ujian telah berakhir pada tanggal ${targetDate}.`
    };
  }

  // Tanggal Hari Ini -> Evaluasi Jam
  if (currentTimeStr < startTime) {
    return {
      scheduleState: 'upcoming',
      isActiveNow: false,
      canEnter: false,
      statusLabel: `⏳ DIBUKA ${startTime}`,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse',
      scheduleText: scheduleDisplay,
      message: `Ujian akan dibuka otomatis tepat pada pukul ${startTime} WIB.`
    };
  }

  if (currentTimeStr > endTime) {
    return {
      scheduleState: 'expired',
      isActiveNow: false,
      canEnter: false,
      statusLabel: '🏁 WAKTU HABIS',
      badgeClass: 'bg-slate-200 text-slate-700 border-slate-300 font-bold',
      scheduleText: scheduleDisplay,
      message: `Waktu ujian telah berakhir pada pukul ${endTime} WIB.`
    };
  }

  // Sedang Aktif di Dalam Rentang Jam (currentTimeStr >= startTime && currentTimeStr <= endTime)
  return {
    scheduleState: 'ongoing',
    isActiveNow: true,
    canEnter: true,
    statusLabel: `🟢 AKTIF (${scheduleDisplay})`,
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    scheduleText: scheduleDisplay,
    message: `Ujian aktif hingga pukul ${endTime} WIB.`
  };
}

/**
 * Update jadwal waktu (tanggal, jam mulai, jam selesai, durasi) serentak atau per paket
 */
export function updateCbtPackageSchedule(params: {
  packageId?: string; // jika kosong -> terapkan ke SEMUA paket
  examDate?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
}) {
  const all = getStoredCbtPackages();
  const updated = all.map(pkg => {
    if (!params.packageId || pkg.id === params.packageId) {
      return {
        ...pkg,
        status: 'active' as const,
        examDate: params.examDate !== undefined ? params.examDate : pkg.examDate,
        startTime: params.startTime !== undefined ? params.startTime : pkg.startTime,
        endTime: params.endTime !== undefined ? params.endTime : pkg.endTime,
        durationMinutes: params.durationMinutes !== undefined ? params.durationMinutes : pkg.durationMinutes,
        emergencyPaused: false
      };
    }
    return pkg;
  });
  saveStoredCbtPackages(updated);
  return updated;
}

/**
 * Toggle Jeda Darurat (Emergency Pause) serentak oleh Panitia
 */
export function toggleCbtEmergencyPause(isPaused: boolean, reason?: string) {
  const all = getStoredCbtPackages();
  const updated = all.map(pkg => ({
    ...pkg,
    status: (isPaused ? 'draft' : 'active') as 'active' | 'draft',
    emergencyPaused: isPaused,
    emergencyPauseReason: isPaused ? (reason || 'Jeda darurat serentak oleh panitia (misal: kendala listrik/jaringan)') : undefined
  }));
  saveStoredCbtPackages(updated);
  return updated;
}

export function getStoredStudentCbtSessions(): Record<string, CbtStudentAnswerState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CBT_STUDENT_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredStudentCbtSession(session: CbtStudentAnswerState) {
  if (typeof window === 'undefined') return;
  try {
    const all = getStoredStudentCbtSessions();
    const key = `${session.examId}_${session.studentId}`;
    all[key] = session;
    localStorage.setItem(CBT_STUDENT_SESSIONS_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('cbtSessionsUpdated'));
    // Asynchronous background cloud sync to Hostinger MySQL
    try {
      import('./cloudSync').then(m => m.pushCbtStudentAnswerToCloud(session)).catch(() => {});
    } catch {}
  } catch (e) {
    console.error('Failed saving student CBT session', e);
  }
}

export function resetStoredStudentCbtSession(examId: string, studentIdOrNisn: string) {
  if (typeof window === 'undefined') return;
  try {
    const all = getStoredStudentCbtSessions();
    let modified = false;

    // 1. Direct delete by composite key
    const directKey = `${examId}_${studentIdOrNisn}`;
    if (all[directKey]) {
      delete all[directKey];
      modified = true;
    }

    // 2. Comprehensive scan across all session objects
    for (const [k, sess] of Object.entries(all)) {
      const isStudentMatch = 
        sess.studentId === studentIdOrNisn || 
        sess.studentNisn === studentIdOrNisn || 
        k.includes(studentIdOrNisn) ||
        (sess.studentName && sess.studentName.toLowerCase().trim() === studentIdOrNisn.toLowerCase().trim());

      const isExamMatch = !examId || sess.examId === examId || k.startsWith(examId);

      if (isStudentMatch && isExamMatch) {
        delete all[k];
        modified = true;
      }
    }

    // Always persist and notify listeners
    localStorage.setItem(CBT_STUDENT_SESSIONS_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('cbtSessionsUpdated'));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Failed resetting student CBT session', e);
  }
}

export function unlockStoredStudentCbtSession(examId: string, studentIdOrNisn: string) {
  if (typeof window === 'undefined') return;
  try {
    const all = getStoredStudentCbtSessions();
    let modified = false;

    // 1. Direct key update if exists
    const directKey = `${examId}_${studentIdOrNisn}`;
    if (all[directKey]) {
      all[directKey] = {
        ...all[directKey],
        violationCount: 0
      };
      modified = true;
    }

    // 2. Comprehensive scan across all session objects
    for (const [k, sess] of Object.entries(all)) {
      const isStudentMatch = 
        sess.studentId === studentIdOrNisn || 
        sess.studentNisn === studentIdOrNisn || 
        k.includes(studentIdOrNisn) ||
        (sess.studentName && sess.studentName.toLowerCase().trim() === studentIdOrNisn.toLowerCase().trim());

      const isExamMatch = !examId || sess.examId === examId || k.startsWith(examId);

      if (isStudentMatch && isExamMatch) {
        all[k] = {
          ...sess,
          violationCount: 0
        };
        modified = true;
      }
    }

    // Always persist and notify listeners
    localStorage.setItem(CBT_STUDENT_SESSIONS_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('cbtSessionsUpdated'));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Failed unlocking student CBT session', e);
  }
}


export function getStoredCbtRoomAttendances(): Record<string, CbtRoomAttendance> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CBT_ROOM_ATTENDANCE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredCbtRoomAttendance(attendance: CbtRoomAttendance) {
  if (typeof window === 'undefined') return;
  try {
    const all = getStoredCbtRoomAttendances();
    const key = `${attendance.roomName}_${attendance.examId}_${attendance.date}`;
    all[key] = attendance;
    localStorage.setItem(CBT_ROOM_ATTENDANCE_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('cbtAttendanceUpdated'));
    window.dispatchEvent(new Event('cbtRoomAttendancesUpdated'));
  } catch (e) {
    console.error('Failed saving CBT room attendance', e);
  }
}

/**
 * Smart Check-in Pengawas Ruang CBT:
 * Mendaftarkan guru pengawas yang sedang bertugas di ruangan ke konfigurasi panitia
 * dan presensi aktif secara instan (real-time).
 */
export function checkInRoomSupervisor(params: {
  roomName: string;
  supervisorName: string;
  examId?: string;
  examTitle?: string;
  token?: string;
  initialRecords?: Record<string, 'H' | 'S' | 'I' | 'A'>;
}): { success: boolean; message: string } {
  if (typeof window === 'undefined') return { success: false, message: 'Window undefined' };
  const { roomName, supervisorName, examId, examTitle, token, initialRecords } = params;
  const cleanSup = supervisorName.trim();
  if (!cleanSup || cleanSup === 'Guru Pengawas' || cleanSup === 'Guru Pengawas Ruang') {
    return { success: false, message: 'Nama pengawas tidak valid' };
  }

  try {
    // 1. Update di CbtPanitiaConfig agar nama pengawas langsung tampil di semua monitoring ruangan
    const currentConfig = getStoredCbtPanitiaConfig();
    let configUpdated = false;
    const updatedRooms = currentConfig.rooms.map(r => {
      const matchName = r.name.toLowerCase().trim() === roomName.toLowerCase().trim();
      const matchLabel = r.label && r.label.toLowerCase().includes(roomName.toLowerCase().trim());
      if (matchName || matchLabel) {
        configUpdated = true;
        return {
          ...r,
          supervisorName: cleanSup
        };
      }
      return r;
    });

    if (configUpdated) {
      saveStoredCbtPanitiaConfig({ ...currentConfig, rooms: updatedRooms });
    }

    // 2. Jika examId diberikan, update atau buat presensi aktif di CBT_ROOM_ATTENDANCE_KEY
    if (examId) {
      const todayStr = new Date().toISOString().split('T')[0];
      const allAtt = getStoredCbtRoomAttendances();
      const key = `${roomName}_${examId}_${todayStr}`;
      const existing = allAtt[key];

      allAtt[key] = {
        roomName,
        examId,
        examTitle: examTitle || existing?.examTitle || 'Ujian CBT',
        date: todayStr,
        supervisorName: cleanSup,
        token: token || existing?.token || '',
        records: initialRecords ? { ...(existing?.records || {}), ...initialRecords } : (existing?.records || {}),
        notes: existing?.notes || 'Ujian berlangsung tertib, aman, dan lancar tanpa kendala teknis.',
        isBapSubmitted: Boolean(existing?.isBapSubmitted),
        submittedAt: existing?.submittedAt
      };

      localStorage.setItem(CBT_ROOM_ATTENDANCE_KEY, JSON.stringify(allAtt));
      window.dispatchEvent(new Event('cbtAttendanceUpdated'));
      window.dispatchEvent(new Event('cbtRoomAttendancesUpdated'));
    }

    return { success: true, message: `Berhasil check-in di ${roomName} sebagai ${cleanSup}` };
  } catch (err) {
    console.error('Failed checking in room supervisor', err);
    return { success: false, message: 'Gagal check-in pengawas' };
  }
}

/**
 * Otomatis menandai siswa sebagai HADIR (H) di lembar presensi ruangan
 * saat siswa memverifikasi token dan mulai masuk ke ruang ujian.
 */
export function markStudentCbtAttendancePresent(params: {
  roomName: string;
  examId: string;
  studentId: string;
  date?: string;
  examTitle?: string;
  token?: string;
}): void {
  if (typeof window === 'undefined') return;
  const { roomName, examId, studentId, examTitle, token } = params;
  const todayStr = params.date || new Date().toISOString().split('T')[0];
  const allAtt = getStoredCbtRoomAttendances();
  const key = `${roomName}_${examId}_${todayStr}`;
  const existing = allAtt[key];

  const currentRecords: Record<string, 'H' | 'S' | 'I' | 'A'> = existing?.records ? { ...existing.records } : {};
  currentRecords[studentId] = 'H'; // Otomatis tandai Hadir!

  allAtt[key] = {
    roomName,
    examId,
    examTitle: examTitle || existing?.examTitle || 'Ujian CBT',
    date: todayStr,
    supervisorName: existing?.supervisorName || 'Guru Pengawas',
    token: token || existing?.token || '',
    records: currentRecords,
    notes: existing?.notes || 'Ujian berlangsung tertib, aman, dan lancar tanpa kendala teknis.',
    isBapSubmitted: Boolean(existing?.isBapSubmitted),
    submittedAt: existing?.submittedAt
  };

  localStorage.setItem(CBT_ROOM_ATTENDANCE_KEY, JSON.stringify(allAtt));
  window.dispatchEvent(new Event('cbtAttendanceUpdated'));
  window.dispatchEvent(new Event('cbtRoomAttendancesUpdated'));
}



// -------------------------------------------------------------
// AUTO-GRADING ENGINE (Koreksi Otomatis 4 Tipe Soal)
// -------------------------------------------------------------
export function gradeCbtAnswers(
  exam: CbtExamPackage,
  answers: Record<string, any>
): {
  finalScore: number;
  correctCount: number;
  wrongCount: number;
  isPassed: boolean;
  questionScores: Record<string, number>;
} {
  let totalScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  const questionScores: Record<string, number> = {};

  const totalQuestions = exam.questions.length;
  if (totalQuestions === 0) {
    return { finalScore: 0, correctCount: 0, wrongCount: 0, isPassed: false, questionScores: {} };
  }

  // Tiap soal memiliki bobot proporsional (skala 100)
  const defaultWeight = 100 / totalQuestions;

  exam.questions.forEach((q) => {
    const ans = answers[q.id];
    let earnedRatio = 0; // 0 s/d 1

    if (ans === undefined || ans === null) {
      earnedRatio = 0;
    } else if (q.type === 'pg') {
      // PG Tunggal
      if (Number(ans) === q.correctOptionIndex) {
        earnedRatio = 1;
      }
    } else if (q.type === 'pg_kompleks') {
      // PG Kompleks (Multi Checkbox)
      const correctIndices = q.correctOptionIndices || [];
      const userSelected: number[] = Array.isArray(ans) ? ans : [];
      
      if (correctIndices.length > 0) {
        let matchingCorrect = 0;
        let incorrectPicks = 0;

        userSelected.forEach(idx => {
          if (correctIndices.includes(idx)) matchingCorrect++;
          else incorrectPicks++;
        });

        // Skor proporsional jika sebagian benar dan tanpa opsi salah
        const ratio = (matchingCorrect - incorrectPicks) / correctIndices.length;
        earnedRatio = Math.max(0, Math.min(1, ratio));
      }
    } else if (q.type === 'benar_salah') {
      // Benar / Salah (Tabel Pernyataan)
      const statements = q.statements || [];
      const userAnswers: Record<string, boolean> = typeof ans === 'object' && ans !== null ? ans : {};
      
      if (statements.length > 0) {
        let rightStatements = 0;
        statements.forEach(st => {
          if (userAnswers[st.id] === st.correctAnswer) {
            rightStatements++;
          }
        });
        earnedRatio = rightStatements / statements.length;
      }
    } else if (q.type === 'menjodohkan') {
      // Menjodohkan
      const pairs = q.matchingPairs || [];
      const userMatches: Record<string, string> = typeof ans === 'object' && ans !== null ? ans : {};
      
      if (pairs.length > 0) {
        let rightPairs = 0;
        pairs.forEach(p => {
          if (userMatches[p.id] === p.rightMatch) {
            rightPairs++;
          }
        });
        earnedRatio = rightPairs / pairs.length;
      }
    }

    const earnedPoints = earnedRatio * defaultWeight;
    questionScores[q.id] = Math.round(earnedPoints * 10) / 10;
    totalScore += earnedPoints;

    if (earnedRatio >= 0.8) {
      correctCount++;
    } else {
      wrongCount++;
    }
  });

  const finalScore = Math.min(100, Math.round(totalScore));
  const isPassed = finalScore >= (exam.passingGrade || 75);

  return {
    finalScore,
    correctCount,
    wrongCount,
    isPassed,
    questionScores
  };
}

// -------------------------------------------------------------
// PENDAFTARAN DARURAT SISWA DI RUANGAN OLEH PENGAWAS
// (Langsung terhubung ke Database Master Siswa Sekolah)
// -------------------------------------------------------------
export function registerEmergencyStudentToCbt(params: {
  name: string;
  nisn: string;
  classId: string;
  gender: 'L' | 'P';
}): Student {
  const all = getStoredStudents();
  
  // Periksa apakah NISN sudah ada
  const existing = all.find(s => s.nisn === params.nisn);
  if (existing) {
    return existing;
  }

  const newId = `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newStudent: Student = {
    id: newId,
    nisn: params.nisn.trim(),
    name: params.name.trim(),
    classId: params.classId,
    gender: params.gender
  };

  const updatedList = [newStudent, ...all];
  saveStoredStudents(updatedList); // Menyimpan dan menembakkan elearningStudentsUpdated

  return newStudent;
}
