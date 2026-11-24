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
  violationReason?: string; // Catatan spesifik forensik pelanggaran (contoh: Pindah Tab / Alt+Tab / Notifikasi)
  violationTime?: string; // Waktu pelanggaran (HH:MM:SS WIB)
  lockedAt?: number; // Epoch ms saat ujian terkunci karena pelanggaran
  unlockedAt?: number; // Epoch ms saat kunci ujian dibuka oleh pengawas/PIN
  violationSynced?: boolean; // Penanda apakah pelanggaran telah tersimpan di server database
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
  defaultExamDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  defaultDurationMinutes?: number;
  globalEmergencyPaused?: boolean;
  globalEmergencyPauseReason?: string;
  chairmanName?: string;
  chairmanNip?: string;
}

export function extractPanitiaMeta(config: CbtPanitiaConfig) {
  return {
    examSessionName: config.examSessionName || 'Sesi 1 (Pagi)',
    academicYear: config.academicYear || '2026/2027',
    semester: config.semester || 'PTS / STS Ganjil',
    defaultExamDate: config.defaultExamDate || undefined,
    defaultStartTime: config.defaultStartTime || '07:30',
    defaultEndTime: config.defaultEndTime || '09:00',
    defaultDurationMinutes: Number(config.defaultDurationMinutes) || 60,
    globalEmergencyPaused: Boolean(config.globalEmergencyPaused),
    globalEmergencyPauseReason: config.globalEmergencyPaused ? (config.globalEmergencyPauseReason || null) : null,
    chairmanName: config.chairmanName || undefined,
    chairmanNip: config.chairmanNip || undefined
  };
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
  isUserEdited?: boolean; // Penanda bahwa panitia sudah mengatur/merotasi/menyimpan jadwal secara sadar
}

export const DEFAULT_SCHEDULE_SESSIONS: CbtScheduleSessionSlot[] = [
  { id: 's1', name: 'Jam Ke-1', startTime: '07:30', endTime: '09:00', subject: 'Informatika' },
  { id: 's2', name: 'Jam Ke-2', startTime: '09:30', endTime: '11:00', subject: 'Bahasa Inggris' }
];

function isPlaceholderSupervisor(name?: string): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  return trimmed === '' || trimmed === 'Guru Pengawas' || trimmed === 'Guru Pengawas Ruang';
}

export function getSupervisorForSlot(entry: CbtSupervisorScheduleEntry, slotId: string): string {
  const fromMap = entry.supervisors?.[slotId];
  if (!isPlaceholderSupervisor(fromMap)) return fromMap!;
  if (slotId === 's1' && !isPlaceholderSupervisor(entry.session1Supervisor)) return entry.session1Supervisor!;
  if (slotId === 's2' && !isPlaceholderSupervisor(entry.session2Supervisor)) return entry.session2Supervisor!;
  return '';
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

function isLegacyAutoFilledSchedule(parsed: any, sessions: CbtScheduleSessionSlot[]): boolean {
  if (!parsed || parsed.isUserEdited) return false;
  const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
  if (entries.length === 0 || sessions.length === 0) return false;
  return entries.every((entry: any, idx: number) =>
    sessions.every((slot, sIdx) => {
      const assigned =
        entry?.supervisors?.[slot.id] ??
        (slot.id === 's1' ? entry?.session1Supervisor : slot.id === 's2' ? entry?.session2Supervisor : '');
      const legacyDefault = REAL_SCHOOL_TEACHERS[(idx + sIdx * 4) % REAL_SCHOOL_TEACHERS.length];
      return assigned === legacyDefault;
    })
  );
}

function buildEmptyScheduleEntries(rooms: CbtExamRoomConfig[]): CbtSupervisorScheduleEntry[] {
  return rooms.map(r => ({
    roomId: r.id,
    roomName: r.name,
    roomLabel: r.label,
    session1Supervisor: '',
    session2Supervisor: '',
    supervisors: {}
  }));
}

function normalizeSupervisorSchedule(parsed: any, targetDate: string): CbtSupervisorSchedule {
  const sessions: CbtScheduleSessionSlot[] = (Array.isArray(parsed.sessions) && parsed.sessions.length > 0)
    ? parsed.sessions
    : [
        { id: 's1', name: 'Jam Ke-1', startTime: '07:30', endTime: '09:00', subject: 'Informatika' },
        { id: 's2', name: 'Jam Ke-2', startTime: '09:30', endTime: '11:00', subject: 'Bahasa Inggris' }
      ];

  // Bersihkan jadwal bawaan lama yang masih 100% auto-seed (belum pernah diatur/dirotasi panitia)
  const wipeLegacyAuto = isLegacyAutoFilledSchedule(parsed, sessions);

  const entries: CbtSupervisorScheduleEntry[] = (parsed.entries || []).map((entry: any) => {
    if (wipeLegacyAuto) {
      return {
        ...entry,
        session1Supervisor: '',
        session2Supervisor: '',
        supervisors: {}
      };
    }
    const rawSups = { ...(entry.supervisors || {}) };
    if (!rawSups['s1'] && entry.session1Supervisor) rawSups['s1'] = entry.session1Supervisor;
    if (!rawSups['s2'] && entry.session2Supervisor) rawSups['s2'] = entry.session2Supervisor;

    const cleanSups: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawSups)) {
      cleanSups[k] = isPlaceholderSupervisor(String(v || '')) ? '' : String(v);
    }

    return {
      ...entry,
      session1Supervisor: cleanSups['s1'] || '',
      session2Supervisor: cleanSups['s2'] || '',
      supervisors: cleanSups
    };
  });

  return {
    examDate: parsed.examDate || targetDate,
    sessions,
    entries,
    isUserEdited: Boolean(parsed.isUserEdited) && !wipeLegacyAuto
  };
}

export const REAL_SCHOOL_TEACHERS = [
  'Ichsanul Arifin, S.Kom.',
  'Dedeh Komalasari, S.Pd.',
  'E. Hamdani, S.Pd., M.M.Pd.',
  'Rohidin, S.Pd.',
  'Dian Nuryati, SP., MM',
  'Rachmi Fatwalia, S.Pd.',
  'H. Osad, M.Pd.I',
  'Nunik Wahyuni, S.Pd.',
  'N. Euis Kurnia, S.Pd.',
  'Rifayanti Maulani, S.Pd.',
  'Yulia M. Ahmad, S.Pd.',
  'Yepy Agus R, S.IP., M.Pd.',
  'Dudi Yusup, S.Pd.',
  'Gugun Gunawan, S.Pd.',
  'Nursifa Fauziah, S.Pd.',
  'Krisna Lestari, S.Pd.',
  'Wiwin S, S.Pd.I., M.Pd.',
  'Cincin Cintawati, S.Pd.',
  'Budiyanto, S.Pd.',
  'Muhammad Ahiq T, S.Pd.',
  'Riski Ismawarni M, S.Pd.',
  'Siti Nurjanah, S.Pd.',
  'Tina A. Rosdiana, S.Pd.I',
  'Sonia Winjuni L, S.Pd.',
  "Elis Siti Sa'adah, S.Pd.",
  'Nira Destriyani, S.Pd.',
  'H. Rustandi, S.Pd., M.Pd.'
];

export function getDefaultSupervisorSchedule(targetDate?: string): CbtSupervisorSchedule {
  const rooms = getDefaultSchoolRooms();
  const dateToUse = toLocalDateString(targetDate || new Date());
  const sessions: CbtScheduleSessionSlot[] = [
    { id: 's1', name: 'Jam Ke-1', startTime: '07:30', endTime: '09:00', subject: 'Informatika' },
    { id: 's2', name: 'Jam Ke-2', startTime: '09:30', endTime: '11:00', subject: 'Bahasa Inggris' }
  ];

  // Default awal kosong bersih agar panitia bebas menyusun manual atau klik Rotasi Otomatis
  return {
    examDate: dateToUse,
    sessions,
    entries: buildEmptyScheduleEntries(rooms),
    isUserEdited: false
  };
}

export function getStoredSupervisorSchedule(targetDate?: string): CbtSupervisorSchedule {
  const dateToUse = toLocalDateString(
    targetDate ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('cbt_active_schedule_date') || toLocalDateString(new Date())
        : toLocalDateString(new Date()))
  );

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

    // 3. Jika belum pernah disimpan untuk tanggal ini, deteksi paket guru namun tetap biarkan pengawas KOSONG
    const pkgs = getStoredCbtPackages();
    const pkgsOnDate = pkgs.filter(p => !p.examDate || p.examDate === dateToUse);
    if (pkgsOnDate.length > 0) {
      const autoSessions = generateSessionsFromExamPackages(pkgs, dateToUse);
      const rooms = getDefaultSchoolRooms();
      return {
        examDate: dateToUse,
        sessions: autoSessions,
        entries: buildEmptyScheduleEntries(rooms),
        isUserEdited: false
      };
    }
  } catch (e) {
    console.error('Failed parsing supervisor schedule', e);
  }

  return getDefaultSupervisorSchedule(dateToUse);
}

export function saveStoredSupervisorSchedule(
  schedule: CbtSupervisorSchedule,
  options?: { skipCloudSync?: boolean }
) {
  if (typeof window === 'undefined') return;
  try {
    const dateKey = toLocalDateString(schedule.examDate || new Date());
    const normalizedSchedule: CbtSupervisorSchedule = {
      ...schedule,
      examDate: dateKey
    };
    localStorage.setItem('cbt_active_schedule_date', dateKey);

    // Simpan ke peta multi-hari
    let map: Record<string, CbtSupervisorSchedule> = {};
    const rawMap = localStorage.getItem(CBT_SUPERVISOR_SCHEDULES_MAP_KEY);
    if (rawMap) {
      try {
        map = JSON.parse(rawMap) || {};
      } catch (e) {}
    }
    map[dateKey] = normalizedSchedule;
    localStorage.setItem(CBT_SUPERVISOR_SCHEDULES_MAP_KEY, JSON.stringify(map));

    // Simpan juga ke key tunggal aktif
    localStorage.setItem(CBT_SUPERVISOR_SCHEDULE_KEY, JSON.stringify(normalizedSchedule));

    if (!options?.skipCloudSync) {
      try {
        const pendingRaw = localStorage.getItem('spentic_pending_cbt_sched_uploads_v1');
        const pendingMap: Record<string, CbtSupervisorSchedule> = pendingRaw ? JSON.parse(pendingRaw) : {};
        pendingMap[dateKey] = normalizedSchedule;
        localStorage.setItem('spentic_pending_cbt_sched_uploads_v1', JSON.stringify(pendingMap));
      } catch {}
    }

    window.dispatchEvent(new Event('cbtSupervisorScheduleUpdated'));

    if (!options?.skipCloudSync) {
      const payload = JSON.stringify(normalizedSchedule);
      fetch('/api/cbt/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: payload.length < 60000
      })
        .then(res => {
          if (res.ok) {
            try {
              const rawP = localStorage.getItem('spentic_pending_cbt_sched_uploads_v1');
              if (rawP) {
                const pMap = JSON.parse(rawP);
                if (pMap && pMap[dateKey]) {
                  delete pMap[dateKey];
                  localStorage.setItem('spentic_pending_cbt_sched_uploads_v1', JSON.stringify(pMap));
                }
              }
            } catch {}
          }
        })
        .catch(() => {});
    }
  } catch (e) {
    console.error('Failed saving supervisor schedule', e);
  }
}

/**
 * 17 Ruangan Bersih / Kosong (0 Peserta)
 * Digunakan sebagai default state awal agar panitia memiliki lembar bersih penuh
 * dan dapat memilih metode pengisian (Auto-Silang atau Rombel Murni) dengan leluasa.
 */
export function getEmptySchoolRooms(): CbtExamRoomConfig[] {
  const rooms: CbtExamRoomConfig[] = [];
  for (let i = 1; i <= 17; i++) {
    const num = String(i).padStart(2, '0');
    rooms.push({
      id: `ruang-${num}`,
      name: `Ruang ${num}`,
      classes: [],
      capacity: 35,
      label: `Ruang ${num} (Kosong)`,
      supervisorName: 'Guru Pengawas',
      assignedStudentIds: []
    });
  }
  return rooms;
}

/**
 * 17 Ruangan Rombel Murni (7-A s.d 9-E)
 */
export function getPureClassSchoolRooms(allStudents?: Student[]): CbtExamRoomConfig[] {
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

  return roomList.map(r => {
    const studentIds = allStudents && Array.isArray(allStudents)
      ? allStudents.filter(s => s.classId === r.classId).map(s => s.id)
      : [];

    return {
      id: `ruang-${r.num}`,
      name: `Ruang ${r.num}`,
      classes: [r.classId],
      capacity: r.capacity,
      label: `Ruang ${r.num} (Kelas ${r.classId})`,
      supervisorName: 'Guru Pengawas',
      assignedStudentIds: studentIds
    };
  });
}

export function getDefaultSchoolRooms(allStudents?: Student[]): CbtExamRoomConfig[] {
  // Default awal adalah ruangan kosong bersih (0 siswa)
  return getEmptySchoolRooms();
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

  // Kembalikan state awal di memori saja TANPA menimpa cloud/database
  // agar browser baru/Incognito tidak menghapus pembagian ruangan yang sudah disusun Panitia
  return {
    rooms: getDefaultSchoolRooms(),
    examSessionName: 'Sesi 1 (Pagi)',
    academicYear: '2026/2027',
    semester: 'PTS / STS Ganjil'
  };
}

const PENDING_CBT_ROOMS_KEY = 'spentic_pending_cbt_rooms_upload_v1';
let pendingRoomsPushCount = 0;
let lastRoomsMutationAt = 0;
let roomsSyncPendingUpload = false;
let lastRoomsForceEmpty = false;

export function isRoomsCloudSyncSafeToApply(): boolean {
  if (pendingRoomsPushCount > 0 || roomsSyncPendingUpload) return false;
  if (typeof window !== 'undefined') {
    try {
      if (localStorage.getItem(PENDING_CBT_ROOMS_KEY)) return false;
    } catch {}
  }
  if (Date.now() - lastRoomsMutationAt < 8000) return false;
  return true;
}

export function isRoomsUploadPending(): boolean {
  if (roomsSyncPendingUpload) return true;
  if (typeof window !== 'undefined') {
    try {
      return Boolean(localStorage.getItem(PENDING_CBT_ROOMS_KEY));
    } catch {}
  }
  return false;
}

export function markRoomsUploadCompleted(): void {
  roomsSyncPendingUpload = false;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(PENDING_CBT_ROOMS_KEY);
    } catch {}
  }
}

export function getLastRoomsForceEmpty(): boolean {
  if (lastRoomsForceEmpty) return true;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(PENDING_CBT_ROOMS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Boolean(parsed?.forceEmpty);
      }
    } catch {}
  }
  return false;
}

export function saveStoredCbtPanitiaConfig(
  config: CbtPanitiaConfig,
  options?: { skipCloudPush?: boolean; forceEmpty?: boolean }
) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CBT_PANITIA_CONFIG_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('cbtPanitiaConfigUpdated', { detail: config }));
    // Kirim langsung ke /api/cbt/rooms (tanpa jeda dynamic import + keepalive) agar tidak kalah race oleh focus sync
    if (!options?.skipCloudPush && config.rooms && Array.isArray(config.rooms)) {
      lastRoomsMutationAt = Date.now();
      pendingRoomsPushCount += 1;
      roomsSyncPendingUpload = true;
      lastRoomsForceEmpty = Boolean(options?.forceEmpty);
      try {
        localStorage.setItem(
          PENDING_CBT_ROOMS_KEY,
          JSON.stringify({ ts: lastRoomsMutationAt, forceEmpty: lastRoomsForceEmpty })
        );
      } catch {}
      window.dispatchEvent(new CustomEvent('cbtRoomsSyncStatus', { detail: { status: 'syncing' } }));

      const payload = JSON.stringify({
        rooms: config.rooms,
        forceEmpty: Boolean(options?.forceEmpty),
        meta: extractPanitiaMeta(config)
      });

      fetch('/api/cbt/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: payload.length < 60000
      })
        .then(res => {
          if (res.ok) {
            markRoomsUploadCompleted();
            window.dispatchEvent(new CustomEvent('cbtRoomsSyncStatus', { detail: { status: 'synced' } }));
          } else {
            roomsSyncPendingUpload = true;
            window.dispatchEvent(new CustomEvent('cbtRoomsSyncStatus', { detail: { status: 'error' } }));
          }
        })
        .catch(() => {
          roomsSyncPendingUpload = true;
          window.dispatchEvent(new CustomEvent('cbtRoomsSyncStatus', { detail: { status: 'error' } }));
        })
        .finally(() => {
          pendingRoomsPushCount = Math.max(0, pendingRoomsPushCount - 1);
        });
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
 * Prioritas 1: Jika ruangan memiliki assignedStudentIds eksplisit, KEMBALIKAN HANYA SISWA TERSEBUT.
 * Prioritas 2: Jika rombel tunggal (room.classes.length === 1), ambil siswa rombel itu.
 * Prioritas 3 (Anti-Bug / Defensive): Jika kelas > 1 tetapi assignedStudentIds kosong,
 * ambil proporsional 50:50 dari kedua kelas hingga kapasitas ruangan agar tidak pernah terjadi lonjakan 70 siswa!
 */
export function getStudentsForRoom(room: CbtExamRoomConfig | undefined | null, allStudents: Student[]): Student[] {
  if (!room) return [];
  
  // Prioritas 1: Penempatan eksplisit per-ID (termasuk jika sengaja dikosongkan [])
  if (Array.isArray(room.assignedStudentIds)) {
    if (room.assignedStudentIds.length === 0) return [];
    const idSet = new Set(room.assignedStudentIds);
    return allStudents.filter(s => idSet.has(s.id));
  }

  // Jika classes kosong
  if (!room.classes || room.classes.length === 0) {
    return [];
  }

  // Prioritas 2: Rombel tunggal murni
  if (room.classes && room.classes.length === 1 && room.classes[0] !== 'Semua') {
    return allStudents.filter(s => s.classId === room.classes[0]);
  }

  if (room.classes && room.classes.includes('Semua')) {
    return allStudents;
  }

  // Prioritas 3: Safe-guard jika bertipe campuran / silang
  if (room.classes && room.classes.length > 1) {
    const classA = allStudents.filter(s => s.classId === room.classes[0]);
    const classB = allStudents.filter(s => s.classId === room.classes[1]);
    const halfA = Math.ceil(classA.length / 2);
    const halfB = Math.ceil(classB.length / 2);
    return [...classA.slice(0, halfA), ...classB.slice(0, halfB)].slice(0, room.capacity || 35);
  }

  return [];
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
        ...room,
        classes: [classAId, classBId],
        label: `${room.name} (Silang ${classAId} & ${classBId})`,
        capacity: Math.max(room.capacity || 35, roomAStudents.length),
        assignedStudentIds: studentIds
      };
    }
    if (room.id === roomBId) {
      const studentIds = roomBStudents.map(s => s.id);
      return {
        ...room,
        classes: [classAId, classBId],
        label: `${room.name} (Silang ${classAId} & ${classBId})`,
        capacity: Math.max(room.capacity || 35, roomBStudents.length),
        assignedStudentIds: studentIds
      };
    }

    // Bersihkan ruangan lain agar tidak ada siswa ganda
    let updatedAssigned = room.assignedStudentIds ? [...room.assignedStudentIds] : [];
    if (updatedAssigned.length === 0 && room.classes.some(c => c === classAId || c === classBId)) {
      const remaining = allStudents.filter(s => room.classes.includes(s.classId) && !affectedStudentIds.has(s.id));
      updatedAssigned = remaining.map(s => s.id);
    } else {
      updatedAssigned = updatedAssigned.filter(id => !affectedStudentIds.has(id));
    }

    const remainingStudents = allStudents.filter(s => updatedAssigned.includes(s.id));
    return {
      ...room,
      ...updateRoomMetadata(room, remainingStudents),
      assignedStudentIds: updatedAssigned
    };
  });
}

/**
 * ⚡ Fitur Otomatis 1-Klik:
 * Membagi silang seluruh Kelas 7 dan Kelas 8 ke Ruang 01 s/d Ruang 12 (50:50).
 * Kelas 9 (9A s/d 9E) tetap menjadi rombel murni di Ruang 13 s/d 17.
 */
export function autoCrossSplitClasses7And8(
  allStudents: Student[]
): CbtExamRoomConfig[] {
  const result: CbtExamRoomConfig[] = [];

  const pairs: [string, string, string, string, string, string][] = [
    ['7-A', '8-A', 'ruang-01', 'ruang-02', 'Ruang 01', 'Ruang 02'],
    ['7-B', '8-B', 'ruang-03', 'ruang-04', 'Ruang 03', 'Ruang 04'],
    ['7-C', '8-C', 'ruang-05', 'ruang-06', 'Ruang 05', 'Ruang 06'],
    ['7-D', '8-D', 'ruang-07', 'ruang-08', 'Ruang 07', 'Ruang 08'],
    ['7-E', '8-E', 'ruang-09', 'ruang-10', 'Ruang 09', 'Ruang 10'],
    ['7-F', '8-F', 'ruang-11', 'ruang-12', 'Ruang 11', 'Ruang 12'],
  ];

  for (const [classAId, classBId, roomAId, roomBId, roomAName, roomBName] of pairs) {
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

    result.push({
      id: roomAId,
      name: roomAName,
      classes: [classAId, classBId],
      label: `${roomAName} (Silang ${classAId} & ${classBId})`,
      capacity: 35,
      supervisorName: 'Guru Pengawas',
      assignedStudentIds: roomAStudents.map(s => s.id)
    });

    result.push({
      id: roomBId,
      name: roomBName,
      classes: [classAId, classBId],
      label: `${roomBName} (Silang ${classAId} & ${classBId})`,
      capacity: 35,
      supervisorName: 'Guru Pengawas',
      assignedStudentIds: roomBStudents.map(s => s.id)
    });
  }

  // Kelas 9: Ruang 13 s.d 17 (rombel murni)
  const grade9Classes = ['9-A', '9-B', '9-C', '9-D', '9-E'];
  grade9Classes.forEach((cls, idx) => {
    const roomNum = String(13 + idx).padStart(2, '0');
    const roomId = `ruang-${roomNum}`;
    const roomName = `Ruang ${roomNum}`;
    const students = allStudents
      .filter(s => s.classId === cls)
      .sort((a, b) => a.name.localeCompare(b.name));

    result.push({
      id: roomId,
      name: roomName,
      classes: [cls],
      label: `${roomName} (Kelas ${cls})`,
      capacity: 35,
      supervisorName: 'Guru Pengawas',
      assignedStudentIds: students.map(s => s.id)
    });
  });

  return result;
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

/**
 * Konversi tanggal ke format 'YYYY-MM-DD' lokal tanpa tergeser timezone UTC
 */
export function toLocalDateString(val: any): string {
  if (!val) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  if (typeof val === 'string') {
    if (val.includes('T')) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    }
    const match = val.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    return val.split('T')[0];
  }
  return String(val);
}

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
      // Clean up legacy mock exams (Cucu Rohaeti, Erma Rismayanti, old demo tests)
      const cleaned = parsed.filter((p: any) => {
        const tName = p.teacherName || '';
        return (
          !tName.includes('Cucu Rohaeti') &&
          !tName.includes('Erma Rismayanti') &&
          p.id !== 'cbt-ipa-7-pts' &&
          p.id !== 'cbt-bing-8-pts' &&
          p.title !== 'jnn'
        );
      });
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(CBT_PACKAGES_KEY, JSON.stringify(cleaned));
      }
      return cleaned.map((p: CbtExamPackage) => ({
        ...p,
        examDate: toLocalDateString(p.examDate),
        startTime: p.startTime || '07:30',
        endTime: p.endTime || '09:00',
        emergencyPaused: Boolean(p.emergencyPaused)
      }));
    }
    return [];
  } catch {
    return [];
  }
}

const DELETED_CBT_PKG_KEY = 'spentic_deleted_cbt_pkg_ids_v1';
const PENDING_CBT_PKG_UPLOADS_KEY = 'spentic_pending_cbt_pkg_uploads_v1';

function markLocalCbtPackagePendingSync(pkg: CbtExamPackage) {
  if (typeof window === 'undefined') return;
  try {
    // 1. Unmark from deleted tombstones
    const rawDel = localStorage.getItem(DELETED_CBT_PKG_KEY);
    if (rawDel) {
      const delSet = new Set<string>(JSON.parse(rawDel));
      if (delSet.has(pkg.id)) {
        delSet.delete(pkg.id);
        localStorage.setItem(DELETED_CBT_PKG_KEY, JSON.stringify(Array.from(delSet)));
      }
    }
    // 2. Add/update in pending upload queue synchronously (prevents focus-sync race condition)
    const rawPend = localStorage.getItem(PENDING_CBT_PKG_UPLOADS_KEY);
    const pendList: CbtExamPackage[] = rawPend ? JSON.parse(rawPend) : [];
    const idx = pendList.findIndex(p => p.id === pkg.id);
    if (idx >= 0) pendList[idx] = pkg;
    else pendList.push(pkg);
    localStorage.setItem(PENDING_CBT_PKG_UPLOADS_KEY, JSON.stringify(pendList));
  } catch {}
}

function markLocalCbtPackageDeletedSync(id: string) {
  if (typeof window === 'undefined') return;
  try {
    // 1. Record tombstone synchronously before confirm() focus event can fire
    const rawDel = localStorage.getItem(DELETED_CBT_PKG_KEY);
    const delSet = new Set<string>(rawDel ? JSON.parse(rawDel) : []);
    delSet.add(id);
    localStorage.setItem(DELETED_CBT_PKG_KEY, JSON.stringify(Array.from(delSet)));

    // 2. Remove from pending upload queue synchronously
    const rawPend = localStorage.getItem(PENDING_CBT_PKG_UPLOADS_KEY);
    if (rawPend) {
      const pendList: CbtExamPackage[] = JSON.parse(rawPend);
      const filtered = pendList.filter(p => p.id !== id);
      localStorage.setItem(PENDING_CBT_PKG_UPLOADS_KEY, JSON.stringify(filtered));
    }
  } catch {}
}

export async function deleteStoredCbtPackage(
  id: string,
  options?: { skipCloudSync?: boolean }
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    markLocalCbtPackageDeletedSync(id);
    const list = getStoredCbtPackages().filter(p => p.id !== id);
    localStorage.setItem(CBT_PACKAGES_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('cbtPackagesUpdated'));
    if (!options?.skipCloudSync) {
      const m = await import('./cloudSync');
      return await m.deleteCbtPackageFromCloud(id);
    }
    return true;
  } catch (e) {
    console.error('Failed deleting CBT package', e);
    return false;
  }
}

export async function saveStoredCbtPackage(
  pkg: CbtExamPackage,
  options?: { skipCloudSync?: boolean }
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const questions = Array.isArray(pkg.questions)
      ? pkg.questions.map((q, idx) => ({ ...q, number: idx + 1 }))
      : [];
    const sanitizedPkg: CbtExamPackage = {
      ...pkg,
      examDate: toLocalDateString(pkg.examDate),
      questions,
      totalQuestions: questions.length
    };

    if (!options?.skipCloudSync) {
      markLocalCbtPackagePendingSync(sanitizedPkg);
    }

    const current = getStoredCbtPackages();
    const idx = current.findIndex(p => p.id === sanitizedPkg.id);
    const updated = idx >= 0
      ? current.map(p => (p.id === sanitizedPkg.id ? sanitizedPkg : p))
      : [sanitizedPkg, ...current];

    localStorage.setItem(CBT_PACKAGES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('cbtPackagesUpdated'));

    if (!options?.skipCloudSync) {
      const m = await import('./cloudSync');
      return await m.pushCbtPackageToCloud(sanitizedPkg);
    }
    return true;
  } catch (e) {
    console.error('Failed saving single CBT package', e);
    return false;
  }
}

export function saveStoredCbtPackages(
  packages: CbtExamPackage[],
  options?: { skipCloudSync?: boolean; targetPkgId?: string }
) {
  if (typeof window === 'undefined') return;
  try {
    const sanitized = packages.map(p => {
      const questions = Array.isArray(p.questions)
        ? p.questions.map((q, idx) => ({ ...q, number: idx + 1 }))
        : [];
      return {
        ...p,
        examDate: toLocalDateString(p.examDate),
        questions,
        totalQuestions: questions.length
      };
    });

    if (!options?.skipCloudSync) {
      const toQueue = options?.targetPkgId
        ? sanitized.filter(p => p.id === options.targetPkgId)
        : sanitized;
      toQueue.forEach(p => markLocalCbtPackagePendingSync(p));
    }

    localStorage.setItem(CBT_PACKAGES_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new Event('cbtPackagesUpdated'));

    if (!options?.skipCloudSync) {
      try {
        import('./cloudSync').then(m => {
          const toPush = options?.targetPkgId
            ? sanitized.filter(p => p.id === options.targetPkgId)
            : sanitized;
          toPush.forEach(p => {
            m.pushCbtPackageToCloud(p);
          });
        }).catch(() => {});
      } catch {}
    }
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

  // 1. Cek Jeda Darurat Panitia (Global maupun Per Paket)
  const globalCfg = typeof window !== 'undefined' ? getStoredCbtPanitiaConfig() : null;
  if (globalCfg?.globalEmergencyPaused || pkg.emergencyPaused || pkg.status === 'draft') {
    return {
      scheduleState: 'emergency_paused',
      isActiveNow: false,
      canEnter: false,
      statusLabel: '⏸️ DIJEDA DARURAT',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold animate-pulse',
      scheduleText: pkg.startTime && pkg.endTime ? `${pkg.startTime} - ${pkg.endTime} WIB` : 'Dijeda',
      message:
        pkg.emergencyPauseReason ||
        globalCfg?.globalEmergencyPauseReason ||
        'Ujian sedang dijeda darurat oleh panitia (misal: kendala listrik/jaringan). Mohon tetap tenang di tempat duduk.'
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

  const targetDate = toLocalDateString(pkg.examDate) || todayStr;
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
 * sekaligus menyinkronkan ke MariaDB (cbt_exam_packages + school_settings cbtPanitiaMeta)
 */
export function updateCbtPackageSchedule(params: {
  packageId?: string; // jika kosong -> terapkan ke SEMUA paket
  examDate?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  academicYear?: string;
  semester?: string;
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
        academicYear: params.academicYear !== undefined ? params.academicYear : pkg.academicYear,
        emergencyPaused: false,
        emergencyPauseReason: undefined
      };
    }
    return pkg;
  });

  // Simpan juga konfigurasi jadwal global & meta Posko ke MariaDB (school_settings) agar tetap tersimpan meski paket belum ada
  if (typeof window !== 'undefined') {
    const currentCfg = getStoredCbtPanitiaConfig();
    const nextCfg: CbtPanitiaConfig = {
      ...currentCfg,
      academicYear: params.academicYear !== undefined ? params.academicYear : currentCfg.academicYear,
      semester: params.semester !== undefined ? params.semester : currentCfg.semester,
      ...(!params.packageId
        ? {
            defaultExamDate: params.examDate !== undefined ? params.examDate : currentCfg.defaultExamDate,
            defaultStartTime: params.startTime !== undefined ? params.startTime : currentCfg.defaultStartTime,
            defaultEndTime: params.endTime !== undefined ? params.endTime : currentCfg.defaultEndTime,
            defaultDurationMinutes: params.durationMinutes !== undefined ? params.durationMinutes : currentCfg.defaultDurationMinutes,
            globalEmergencyPaused: false,
            globalEmergencyPauseReason: undefined
          }
        : {})
    };
    localStorage.setItem(CBT_PANITIA_CONFIG_KEY, JSON.stringify(nextCfg));
    window.dispatchEvent(new CustomEvent('cbtPanitiaConfigUpdated', { detail: nextCfg }));
    lastRoomsMutationAt = Date.now();
    pendingRoomsPushCount += 1;
    roomsSyncPendingUpload = true;
    fetch('/api/cbt/rooms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta: extractPanitiaMeta(nextCfg) })
    })
      .then(res => {
        if (res.ok) markRoomsUploadCompleted();
      })
      .catch(() => {})
      .finally(() => {
        pendingRoomsPushCount = Math.max(0, pendingRoomsPushCount - 1);
      });
  }

  saveStoredCbtPackages(updated, { skipCloudSync: true });

  const targets = params.packageId ? updated.filter(p => p.id === params.packageId) : updated;
  if (targets.length > 0 && typeof window !== 'undefined') {
    targets.forEach(p => markLocalCbtPackagePendingSync(p));
    fetch('/api/cbt/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packages: targets })
    })
      .then(res => {
        if (res.ok) {
          import('./cloudSync')
            .then(m => targets.forEach(p => m.dequeuePendingCbtPackageUpload(p.id)))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }
  return updated;
}

/**
 * Toggle Jeda Darurat (Emergency Pause) serentak oleh Panitia
 * langsung tersinkron ke MariaDB (school_settings + cbt_exam_packages)
 */
export function toggleCbtEmergencyPause(isPaused: boolean, reason?: string) {
  const effectiveReason = isPaused
    ? (reason || 'Jeda darurat serentak oleh panitia (misal: kendala listrik/jaringan)')
    : undefined;

  if (typeof window !== 'undefined') {
    const currentCfg = getStoredCbtPanitiaConfig();
    const nextCfg: CbtPanitiaConfig = {
      ...currentCfg,
      globalEmergencyPaused: isPaused,
      globalEmergencyPauseReason: effectiveReason
    };
    localStorage.setItem(CBT_PANITIA_CONFIG_KEY, JSON.stringify(nextCfg));
    window.dispatchEvent(new CustomEvent('cbtPanitiaConfigUpdated', { detail: nextCfg }));
    lastRoomsMutationAt = Date.now();
    pendingRoomsPushCount += 1;
    roomsSyncPendingUpload = true;
    fetch('/api/cbt/rooms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta: extractPanitiaMeta(nextCfg) })
    })
      .then(res => {
        if (res.ok) markRoomsUploadCompleted();
      })
      .catch(() => {})
      .finally(() => {
        pendingRoomsPushCount = Math.max(0, pendingRoomsPushCount - 1);
      });
  }

  const all = getStoredCbtPackages();
  const updated = all.map(pkg => ({
    ...pkg,
    status: (isPaused ? 'draft' : 'active') as 'active' | 'draft',
    emergencyPaused: isPaused,
    emergencyPauseReason: effectiveReason
  }));
  saveStoredCbtPackages(updated, { skipCloudSync: true });

  if (updated.length > 0 && typeof window !== 'undefined') {
    updated.forEach(p => markLocalCbtPackagePendingSync(p));
    fetch('/api/cbt/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packages: updated })
    })
      .then(res => {
        if (res.ok) {
          import('./cloudSync')
            .then(m => updated.forEach(p => m.dequeuePendingCbtPackageUpload(p.id)))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }

  return updated;
}

const pendingViolationLocks = new Map<string, number>();

export function isViolationSyncPending(examId: string, studentId?: string, studentNisn?: string): boolean {
  if (!examId) return false;
  if (studentId && pendingViolationLocks.has(`${examId}_${studentId}`)) return true;
  if (studentNisn && pendingViolationLocks.has(`${examId}_${studentNisn}`)) return true;
  return false;
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

export interface SaveStudentCbtSessionOptions {
  source?: 'student_room' | 'student_violation' | 'supervisor_unlock' | 'cloud_sync' | 'local';
  keepalive?: boolean;
  skipCloudPush?: boolean;
  onSyncDone?: (ok: boolean) => void;
}

export function saveStoredStudentCbtSession(
  session: CbtStudentAnswerState,
  options?: SaveStudentCbtSessionOptions
) {
  if (typeof window === 'undefined') return;
  try {
    const all = getStoredStudentCbtSessions();
    const key = `${session.examId}_${session.studentId}`;
    const hasViolation = Number(session.violationCount || 0) >= 1;
    const lockTs = hasViolation ? (session.lockedAt || Date.now()) : session.lockedAt;

    const sessionToSave: CbtStudentAnswerState = {
      ...session,
      lockedAt: lockTs,
      violationSynced: hasViolation ? Boolean(session.violationSynced) : false
    };

    if (hasViolation && lockTs && !options?.skipCloudPush) {
      pendingViolationLocks.set(key, lockTs);
      if (session.studentNisn) {
        pendingViolationLocks.set(`${session.examId}_${session.studentNisn}`, lockTs);
      }
    }

    all[key] = sessionToSave;
    localStorage.setItem(CBT_STUDENT_SESSIONS_KEY, JSON.stringify(all));
    window.dispatchEvent(
      new CustomEvent('cbtSessionsUpdated', {
        detail: {
          source: options?.source || 'local',
          examId: session.examId,
          studentId: session.studentId
        }
      })
    );

    // Asynchronous background cloud sync to Hostinger MySQL (direct fetch for 0ms latency & keepalive support)
    if (!options?.skipCloudPush) {
      fetch('/api/cbt/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionToSave),
        keepalive: Boolean(options?.keepalive)
      })
        .then(res => {
          const ok = res.ok;
          if (ok && hasViolation && lockTs) {
            try {
              const latest = getStoredStudentCbtSessions();
              const cur = latest[key];
              if (cur && Number(cur.violationCount || 0) >= 1 && cur.lockedAt === lockTs) {
                latest[key] = { ...cur, violationSynced: true };
                localStorage.setItem(CBT_STUDENT_SESSIONS_KEY, JSON.stringify(latest));
              }
            } catch {}
          }
          options?.onSyncDone?.(ok);
        })
        .catch(() => {
          options?.onSyncDone?.(false);
        })
        .finally(() => {
          if (hasViolation && lockTs) {
            if (pendingViolationLocks.get(key) === lockTs) {
              pendingViolationLocks.delete(key);
            }
            if (session.studentNisn) {
              const nisnKey = `${session.examId}_${session.studentNisn}`;
              if (pendingViolationLocks.get(nisnKey) === lockTs) {
                pendingViolationLocks.delete(nisnKey);
              }
            }
          }
        });
    }
  } catch (e) {
    console.error('Failed saving student CBT session', e);
    options?.onSyncDone?.(false);
  }
}

const PENDING_CBT_RESETS_KEY = 'spentic_pending_cbt_resets_v1';
const PENDING_CBT_UNLOCKS_KEY = 'spentic_pending_cbt_unlocks_v1';

export function resetStoredStudentCbtSession(
  examId: string,
  studentIdOrNisn: string,
  optionalSecondNisn?: string
) {
  if (typeof window === 'undefined') return;
  try {
    const all = getStoredStudentCbtSessions();
    const matchedStudentIds = new Set<string>([studentIdOrNisn]);
    if (optionalSecondNisn) matchedStudentIds.add(optionalSecondNisn);

    pendingViolationLocks.delete(`${examId}_${studentIdOrNisn}`);
    if (optionalSecondNisn) pendingViolationLocks.delete(`${examId}_${optionalSecondNisn}`);

    // 1. Direct delete by composite key
    const directKey = `${examId}_${studentIdOrNisn}`;
    if (all[directKey]) {
      if (all[directKey].studentId) matchedStudentIds.add(all[directKey].studentId);
      if (all[directKey].studentNisn) matchedStudentIds.add(all[directKey].studentNisn);
      delete all[directKey];
    }

    // 2. Comprehensive scan across all session objects
    for (const [k, sess] of Object.entries(all)) {
      const isStudentMatch = 
        sess.studentId === studentIdOrNisn || 
        sess.studentNisn === studentIdOrNisn || 
        (optionalSecondNisn && (sess.studentId === optionalSecondNisn || sess.studentNisn === optionalSecondNisn)) ||
        k.includes(studentIdOrNisn) ||
        (sess.studentName && sess.studentName.toLowerCase().trim() === studentIdOrNisn.toLowerCase().trim());

      const isExamMatch = !examId || sess.examId === examId || k.startsWith(examId);

      if (isStudentMatch && isExamMatch) {
        if (sess.studentId) matchedStudentIds.add(sess.studentId);
        if (sess.studentNisn) matchedStudentIds.add(sess.studentNisn);
        pendingViolationLocks.delete(`${sess.examId}_${sess.studentId}`);
        if (sess.studentNisn) pendingViolationLocks.delete(`${sess.examId}_${sess.studentNisn}`);
        delete all[k];
      }
    }

    // Rekam antrean reset secara sinkron di localStorage agar focus sync setelah confirm() tidak pernah mengembalikan sesi
    const resetIdList = Array.from(matchedStudentIds).filter(Boolean);
    const resetEntryKey = `${examId}_${resetIdList.sort().join('|')}`;
    try {
      const rawPend = localStorage.getItem(PENDING_CBT_RESETS_KEY);
      const pendMap: Record<string, { examId: string; ids: string[]; ts: number }> = rawPend ? JSON.parse(rawPend) : {};
      pendMap[resetEntryKey] = { examId, ids: resetIdList, ts: Date.now() };
      localStorage.setItem(PENDING_CBT_RESETS_KEY, JSON.stringify(pendMap));
    } catch {}

    // Record reset guard in cloudSync as well
    try {
      import('./cloudSync').then(m => {
        resetIdList.forEach(sid => m.recordResetCbtStudentSession(examId, sid));
      }).catch(() => {});
    } catch {}

    // Always persist and notify listeners
    localStorage.setItem(CBT_STUDENT_SESSIONS_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('cbtSessionsUpdated', { detail: { source: 'supervisor_reset', examId } }));
    window.dispatchEvent(new Event('storage'));

    // Sync deletion to cloud database for all matched IDs/NISNs
    try {
      Promise.all(
        resetIdList.map(sid =>
          fetch(
            `/api/cbt/answers?examId=${encodeURIComponent(examId)}&studentId=${encodeURIComponent(sid)}&nisn=${encodeURIComponent(optionalSecondNisn || sid)}`,
            { method: 'DELETE', keepalive: true }
          ).then(r => r.ok)
        )
      )
        .then(results => {
          if (results.every(Boolean)) {
            try {
              const rawPend = localStorage.getItem(PENDING_CBT_RESETS_KEY);
              if (rawPend) {
                const pendMap = JSON.parse(rawPend);
                if (pendMap && pendMap[resetEntryKey]) {
                  delete pendMap[resetEntryKey];
                  localStorage.setItem(PENDING_CBT_RESETS_KEY, JSON.stringify(pendMap));
                }
              }
            } catch {}
          }
        })
        .catch(() => {});
    } catch {}
  } catch (e) {
    console.error('Failed resetting student CBT session', e);
  }
}

export function unlockStoredStudentCbtSession(
  examId: string,
  studentIdOrNisn: string,
  options?: { skipCloudPush?: boolean; studentNisn?: string }
) {
  if (typeof window === 'undefined') return;
  try {
    const all = getStoredStudentCbtSessions();
    const unlockedSessions: CbtStudentAnswerState[] = [];
    const matchedStudentIds = new Set<string>([studentIdOrNisn]);
    if (options?.studentNisn) matchedStudentIds.add(options.studentNisn);
    const unlockTs = Date.now();

    pendingViolationLocks.delete(`${examId}_${studentIdOrNisn}`);
    if (options?.studentNisn) pendingViolationLocks.delete(`${examId}_${options.studentNisn}`);

    // 1. Direct key update if exists
    const directKey = `${examId}_${studentIdOrNisn}`;
    if (all[directKey]) {
      all[directKey] = {
        ...all[directKey],
        violationCount: 0,
        violationReason: undefined,
        violationTime: undefined,
        unlockedAt: unlockTs,
        violationSynced: false
      };
      unlockedSessions.push(all[directKey]);
      if (all[directKey].studentId) matchedStudentIds.add(all[directKey].studentId);
      if (all[directKey].studentNisn) matchedStudentIds.add(all[directKey].studentNisn);
    }

    // 2. Comprehensive scan across all session objects
    for (const [k, sess] of Object.entries(all)) {
      const isStudentMatch = 
        sess.studentId === studentIdOrNisn || 
        sess.studentNisn === studentIdOrNisn || 
        (options?.studentNisn && (sess.studentId === options.studentNisn || sess.studentNisn === options.studentNisn)) ||
        k.includes(studentIdOrNisn) ||
        (sess.studentName && sess.studentName.toLowerCase().trim() === studentIdOrNisn.toLowerCase().trim());

      const isExamMatch = !examId || sess.examId === examId || k.startsWith(examId);

      if (isStudentMatch && isExamMatch) {
        pendingViolationLocks.delete(`${sess.examId}_${sess.studentId}`);
        if (sess.studentNisn) pendingViolationLocks.delete(`${sess.examId}_${sess.studentNisn}`);
        all[k] = {
          ...sess,
          violationCount: 0,
          violationReason: undefined,
          violationTime: undefined,
          unlockedAt: unlockTs,
          violationSynced: false
        };
        unlockedSessions.push(all[k]);
        if (sess.studentId) matchedStudentIds.add(sess.studentId);
        if (sess.studentNisn) matchedStudentIds.add(sess.studentNisn);
      }
    }

    // Always persist and notify listeners
    localStorage.setItem(CBT_STUDENT_SESSIONS_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('cbtSessionsUpdated', { detail: { source: 'supervisor_unlock', examId } }));
    window.dispatchEvent(new Event('storage'));

    // Rekam antrean buka kunci secara sinkron di localStorage agar tidak terkunci kembali
    if (unlockedSessions.length > 0 && !options?.skipCloudPush) {
      try {
        const rawPend = localStorage.getItem(PENDING_CBT_UNLOCKS_KEY);
        const pendMap: Record<string, CbtStudentAnswerState> = rawPend ? JSON.parse(rawPend) : {};
        for (const sess of unlockedSessions) {
          pendMap[`${sess.examId}_${sess.studentId || sess.studentNisn}`] = sess;
        }
        localStorage.setItem(PENDING_CBT_UNLOCKS_KEY, JSON.stringify(pendMap));
      } catch {}
    }

    // Record unlock in cloudSync guard so window.focus after alert() does not re-lock
    try {
      import('./cloudSync')
        .then(m => {
          for (const sid of matchedStudentIds) {
            if (sid) m.recordUnlockedCbtStudentSession(examId, sid);
          }
        })
        .catch(() => {});
    } catch {}

    // Sync unlocked session(s) to cloud database immediately
    if (unlockedSessions.length > 0 && !options?.skipCloudPush) {
      const seenPayloads = new Set<string>();
      for (const sess of unlockedSessions) {
        const keySig = `${sess.examId}_${sess.studentId}_${sess.studentNisn || ''}`;
        if (seenPayloads.has(keySig)) continue;
        seenPayloads.add(keySig);
        const pendKey = `${sess.examId}_${sess.studentId || sess.studentNisn}`;
        fetch('/api/cbt/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sess),
          keepalive: true
        })
          .then(res => {
            if (res.ok) {
              try {
                const rawP = localStorage.getItem(PENDING_CBT_UNLOCKS_KEY);
                if (rawP) {
                  const pMap = JSON.parse(rawP);
                  if (pMap && pMap[pendKey]) {
                    delete pMap[pendKey];
                    localStorage.setItem(PENDING_CBT_UNLOCKS_KEY, JSON.stringify(pMap));
                  }
                }
              } catch {}
            }
          })
          .catch(() => {});
      }
    }
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

export function saveStoredCbtRoomAttendance(
  attendance: CbtRoomAttendance,
  options?: { skipCloudSync?: boolean; mergeRecordsOnly?: boolean }
) {
  if (typeof window === 'undefined') return;
  try {
    const normalizedDate = toLocalDateString(attendance.date || new Date());
    const normalizedAttendance: CbtRoomAttendance = {
      ...attendance,
      date: normalizedDate
    };
    const all = getStoredCbtRoomAttendances();
    const key = `${normalizedAttendance.roomName}_${normalizedAttendance.examId}_${normalizedDate}`;
    all[key] = normalizedAttendance;
    localStorage.setItem(CBT_ROOM_ATTENDANCE_KEY, JSON.stringify(all));

    if (!options?.skipCloudSync) {
      try {
        const pendingRaw = localStorage.getItem('spentic_pending_cbt_att_uploads_v1');
        const pendingMap: Record<string, CbtRoomAttendance> = pendingRaw ? JSON.parse(pendingRaw) : {};
        pendingMap[key] = normalizedAttendance;
        localStorage.setItem('spentic_pending_cbt_att_uploads_v1', JSON.stringify(pendingMap));
      } catch {}
    }

    window.dispatchEvent(new Event('cbtAttendanceUpdated'));
    window.dispatchEvent(new Event('cbtRoomAttendancesUpdated'));

    if (!options?.skipCloudSync) {
      import('./cloudSync')
        .then(m => m.pushCbtRoomAttendanceToCloud(normalizedAttendance, { mergeRecordsOnly: options?.mergeRecordsOnly }))
        .catch(() => {});
    }
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
    // 1. Update di CbtPanitiaConfig lokal hanya jika cache lokal memang sudah ada, lalu kirim PATCH nama pengawas saja ke server
    const hasLocalConfig = Boolean(localStorage.getItem(CBT_PANITIA_CONFIG_KEY));
    let matchedRoomId: string | undefined;
    if (hasLocalConfig) {
      const currentConfig = getStoredCbtPanitiaConfig();
      let configUpdated = false;
      const updatedRooms = currentConfig.rooms.map(r => {
        const matchName = r.name.toLowerCase().trim() === roomName.toLowerCase().trim();
        const matchLabel = r.label && r.label.toLowerCase().includes(roomName.toLowerCase().trim());
        if (matchName || matchLabel) {
          configUpdated = true;
          matchedRoomId = r.id;
          return {
            ...r,
            supervisorName: cleanSup
          };
        }
        return r;
      });

      if (configUpdated) {
        saveStoredCbtPanitiaConfig({ ...currentConfig, rooms: updatedRooms }, { skipCloudPush: true });
      }
    }

    try {
      import('./cloudSync')
        .then(m => m.pushCbtRoomSupervisorToCloud({ roomId: matchedRoomId, roomName, supervisorName: cleanSup }))
        .catch(() => {});
    } catch {}

    // 2. Jika examId diberikan, update atau buat presensi aktif di CBT_ROOM_ATTENDANCE_KEY & sinkron ke MariaDB
    if (examId) {
      const todayStr = toLocalDateString(new Date());
      const allAtt = getStoredCbtRoomAttendances();
      const key = `${roomName}_${examId}_${todayStr}`;
      const existing = allAtt[key];

      const updatedAtt: CbtRoomAttendance = {
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

      saveStoredCbtRoomAttendance(updatedAtt);
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
  const todayStr = toLocalDateString(params.date || new Date());
  const allAtt = getStoredCbtRoomAttendances();
  const key = `${roomName}_${examId}_${todayStr}`;
  const existing = allAtt[key];

  const currentRecords: Record<string, 'H' | 'S' | 'I' | 'A'> = existing?.records ? { ...existing.records } : {};
  currentRecords[studentId] = 'H'; // Otomatis tandai Hadir!

  const updatedAtt: CbtRoomAttendance = {
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

  saveStoredCbtRoomAttendance(updatedAtt, { mergeRecordsOnly: true });
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
  const cleanNisn = params.nisn.trim();
  
  // Periksa apakah NISN sudah ada
  const existing = all.find(s => s.nisn === cleanNisn);
  if (existing) {
    return existing;
  }

  const newId = `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newStudent: Student = {
    id: newId,
    nisn: cleanNisn,
    name: params.name.trim(),
    classId: params.classId,
    gender: params.gender
  };

  const updatedList = [newStudent, ...all];
  saveStoredStudents(updatedList); // Menyimpan dan menembakkan elearningStudentsUpdated

  // Sinkronkan siswa baru ke tabel students di MariaDB secara langsung
  if (typeof window !== 'undefined') {
    fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent)
    }).catch(() => {});
  }

  return newStudent;
}

export async function registerEmergencyStudentToCbtAsync(params: {
  name: string;
  nisn: string;
  classId: string;
  gender: 'L' | 'P';
}): Promise<{ student: Student; syncedToDb: boolean }> {
  const all = getStoredStudents();
  const cleanNisn = params.nisn.trim();
  const cleanName = params.name.trim();

  const existingLocal = all.find(s => s.nisn === cleanNisn);
  const candidateId = existingLocal?.id || `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  let finalStudent: Student = existingLocal
    ? { ...existingLocal, name: cleanName, classId: params.classId, gender: params.gender, status: 'Aktif' }
    : {
        id: candidateId,
        nisn: cleanNisn,
        name: cleanName,
        classId: params.classId,
        gender: params.gender,
        status: 'Aktif'
      };

  let syncedToDb = false;
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalStudent)
      });
      if (res.ok) {
        const json = await res.json();
        syncedToDb = true;
        if (json?.data?.id) {
          finalStudent = {
            ...finalStudent,
            id: json.data.id,
            nis: json.data.nis || finalStudent.nis
          };
        }
      }
    } catch {}
  }

  const latestAll = getStoredStudents();
  const existsIdx = latestAll.findIndex(s => s.nisn === cleanNisn || s.id === finalStudent.id);
  const updatedList =
    existsIdx >= 0
      ? latestAll.map((s, idx) => (idx === existsIdx ? finalStudent : s))
      : [finalStudent, ...latestAll];
  saveStoredStudents(updatedList);

  return { student: finalStudent, syncedToDb };
}
