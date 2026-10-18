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
// KONFIGURASI RUANGAN & PRESET KOMPOSISI CAMPUR PANITIA CBT
// -------------------------------------------------------------
export type CbtRoomPresetType = 'campur_7_8' | 'campur_8_9' | 'campur_7_9' | 'murni' | 'custom';

export interface CbtExamRoomConfig {
  id: string; // e.g. 'ruang-01'
  name: string; // e.g. 'Ruang 01'
  classes: string[]; // e.g. ['7-A', '8-A']
  capacity: number; // default: 32
  label: string; // e.g. 'Ruang 01 (Gabungan 7-A & 8-A)'
  supervisorName?: string;
}

export interface CbtPanitiaConfig {
  activePreset: CbtRoomPresetType;
  rooms: CbtExamRoomConfig[];
  examSessionName: string;
  academicYear: string;
  semester: string;
}

export function generateRoomsForPreset(preset: CbtRoomPresetType): CbtExamRoomConfig[] {
  const rooms: CbtExamRoomConfig[] = [];
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  if (preset === 'campur_7_8') {
    // Ruang 01 - 06: Gabungan Kelas 7 & 8
    letters.forEach((l, idx) => {
      const numStr = String(idx + 1).padStart(2, '0');
      rooms.push({
        id: `ruang-${numStr}`,
        name: `Ruang ${numStr}`,
        classes: [`7-${l}`, `8-${l}`],
        capacity: 32,
        label: `Ruang ${numStr} (Gabungan 7-${l} & 8-${l})`,
        supervisorName: 'Guru Pengawas'
      });
    });
    // Ruang 07 - 12: Kelas 9
    letters.forEach((l, idx) => {
      const numStr = String(idx + 7).padStart(2, '0');
      rooms.push({
        id: `ruang-${numStr}`,
        name: `Ruang ${numStr}`,
        classes: [`9-${l}`],
        capacity: 32,
        label: `Ruang ${numStr} (Kelas 9-${l})`,
        supervisorName: 'Guru Pengawas'
      });
    });
  } else if (preset === 'campur_8_9') {
    // Ruang 01 - 06: Gabungan Kelas 8 & 9
    letters.forEach((l, idx) => {
      const numStr = String(idx + 1).padStart(2, '0');
      rooms.push({
        id: `ruang-${numStr}`,
        name: `Ruang ${numStr}`,
        classes: [`8-${l}`, `9-${l}`],
        capacity: 32,
        label: `Ruang ${numStr} (Gabungan 8-${l} & 9-${l})`,
        supervisorName: 'Guru Pengawas'
      });
    });
    // Ruang 07 - 12: Kelas 7
    letters.forEach((l, idx) => {
      const numStr = String(idx + 7).padStart(2, '0');
      rooms.push({
        id: `ruang-${numStr}`,
        name: `Ruang ${numStr}`,
        classes: [`7-${l}`],
        capacity: 32,
        label: `Ruang ${numStr} (Kelas 7-${l})`,
        supervisorName: 'Guru Pengawas'
      });
    });
  } else if (preset === 'campur_7_9') {
    // Ruang 01 - 06: Gabungan Kelas 7 & 9
    letters.forEach((l, idx) => {
      const numStr = String(idx + 1).padStart(2, '0');
      rooms.push({
        id: `ruang-${numStr}`,
        name: `Ruang ${numStr}`,
        classes: [`7-${l}`, `9-${l}`],
        capacity: 32,
        label: `Ruang ${numStr} (Gabungan 7-${l} & 9-${l})`,
        supervisorName: 'Guru Pengawas'
      });
    });
    // Ruang 07 - 12: Kelas 8
    letters.forEach((l, idx) => {
      const numStr = String(idx + 7).padStart(2, '0');
      rooms.push({
        id: `ruang-${numStr}`,
        name: `Ruang ${numStr}`,
        classes: [`8-${l}`],
        capacity: 32,
        label: `Ruang ${numStr} (Kelas 8-${l})`,
        supervisorName: 'Guru Pengawas'
      });
    });
  } else {
    // Murni (Satu Tingkat): Ruang 01-06 (7A-7F), Ruang 07-12 (8A-8F), Ruang 13-18 (9A-9F)
    letters.forEach((l, idx) => {
      const numStr = String(idx + 1).padStart(2, '0');
      rooms.push({
        id: `ruang-${numStr}`,
        name: `Ruang ${numStr}`,
        classes: [`7-${l}`],
        capacity: 32,
        label: `Ruang ${numStr} (Kelas 7-${l})`,
        supervisorName: 'Guru Pengawas'
      });
    });
    letters.forEach((l, idx) => {
      const numStr = String(idx + 7).padStart(2, '0');
      rooms.push({
        id: `ruang-${numStr}`,
        name: `Ruang ${numStr}`,
        classes: [`8-${l}`],
        capacity: 32,
        label: `Ruang ${numStr} (Kelas 8-${l})`,
        supervisorName: 'Guru Pengawas'
      });
    });
    letters.forEach((l, idx) => {
      const numStr = String(idx + 13).padStart(2, '0');
      rooms.push({
        id: `ruang-${numStr}`,
        name: `Ruang ${numStr}`,
        classes: [`9-${l}`],
        capacity: 32,
        label: `Ruang ${numStr} (Kelas 9-${l})`,
        supervisorName: 'Guru Pengawas'
      });
    });
  }

  // Tambahkan Lab Komputer
  rooms.push({
    id: 'lab-komp-1',
    name: 'Lab Komputer 1',
    classes: ['Semua'],
    capacity: 40,
    label: 'Lab Komputer 1 (Cadangan / Susulan)',
    supervisorName: 'Proktor CBT'
  });
  rooms.push({
    id: 'lab-komp-2',
    name: 'Lab Komputer 2',
    classes: ['Semua'],
    capacity: 40,
    label: 'Lab Komputer 2 (Cadangan / Susulan)',
    supervisorName: 'Proktor CBT'
  });

  return rooms;
}

const CBT_PANITIA_CONFIG_KEY = 'cbt_panitia_config_v1';

export function getStoredCbtPanitiaConfig(): CbtPanitiaConfig {
  if (typeof window === 'undefined') {
    return {
      activePreset: 'campur_7_8',
      rooms: generateRoomsForPreset('campur_7_8'),
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
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse cbt_panitia_config', e);
  }

  const initial: CbtPanitiaConfig = {
    activePreset: 'campur_7_8',
    rooms: generateRoomsForPreset('campur_7_8'),
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
  } catch (e) {
    console.error('Failed to save cbt_panitia_config', e);
  }
}

export const CBT_EXAM_ROOMS: string[] = [
  'Ruang 01 (Gabungan 7-A & 8-A)',
  'Ruang 02 (Gabungan 7-B & 8-B)',
  'Ruang 03 (Gabungan 7-C & 8-C)',
  'Ruang 04 (Gabungan 7-D & 8-D)',
  'Ruang 05 (Gabungan 7-E & 8-E)',
  'Ruang 06 (Gabungan 7-F & 8-F)',
  'Ruang 07 (Kelas 9-A)',
  'Ruang 08 (Kelas 9-B)',
  'Ruang 09 (Kelas 9-C)',
  'Ruang 10 (Kelas 9-D)',
  'Ruang 11 (Kelas 9-E)',
  'Ruang 12 (Kelas 9-F)',
  'Lab Komputer 1 (Cadangan / Susulan)',
  'Lab Komputer 2 (Cadangan / Susulan)'
];

// -------------------------------------------------------------
// PAKET UJIAN DEMO LENGKAP & KAYA MULTIMEDIA
// -------------------------------------------------------------
export const INITIAL_CBT_PACKAGES: CbtExamPackage[] = [
  {
    id: 'cbt-ipa-7-pts',
    title: 'Asesmen Sumatif Tengah Semester (STS/PTS) - IPA Terpadu',
    subject: 'Ilmu Pengetahuan Alam (IPA)',
    gradeLevel: '7',
    targetClasses: ['7-A', '7-B', '7-C', '7-D', '7-E', '7-F'],
    semester: 'Ganjil (PTS/STS)',
    academicYear: '2026/2027',
    durationMinutes: 60,
    token: 'IPA7SM',
    passingGrade: 75,
    totalQuestions: 5,
    status: 'active',
    teacherName: 'Cucu Rohaeti, S.Pd.',
    instructions: 'Bacalah petunjuk pengerjaan soal dengan teliti. Gunakan headset/earphone jika terdapat soal listening/video. Dilarang membuka tab lain.',
    createdAt: '2026-10-01',
    questions: [
      {
        id: 'q-ipa-1',
        number: 1,
        type: 'pg',
        question: 'Perhatikan gambar mikroskop cahaya dan bagian yang ditunjuk dengan tanda panah merah berikut. Bagian tersebut berfungsi untuk memfokuskan bayangan objek secara cepat dan kasar, yaitu dinamakan...',
        scoreWeight: 20,
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        mediaCaption: 'Gambar 1. Bagian-Bagian Mikroskop Cahaya Laboratorium IPA',
        options: [
          'Makrometer (Pemutar Kasar)',
          'Mikrometer (Pemutar Halus)',
          'Revolver Lensa Obyektif',
          'Diafragma Pengatur Cahaya'
        ],
        correctOptionIndex: 0
      },
      {
        id: 'q-ipa-2',
        number: 2,
        type: 'pg_kompleks',
        question: 'Manakah dari pernyataan berikut yang merupakan ciri-ciri khas sel tumbuhan yang MEMBEDAKANNYA dari sel hewan? (Pilihlah DUA atau LEBIH jawaban yang benar!)',
        scoreWeight: 20,
        mediaType: 'none',
        options: [
          'Memiliki dinding sel yang tersusun dari selulosa sehingga bentuknya kaku dan tetap',
          'Memiliki kloroplas yang mengandung klorofil untuk fotosintesis',
          'Tidak memiliki membran inti sel (prokariotik)',
          'Memiliki vakuola berukuran besar di bagian tengah sitoplasma'
        ],
        correctOptionIndices: [0, 1, 3]
      },
      {
        id: 'q-ipa-3',
        number: 3,
        type: 'benar_salah',
        question: 'Tentukan apakah setiap pernyataan mengenai wujud zat dan perubahannya berikut ini BENAR atau SALAH berdasarkan konsep sains:',
        scoreWeight: 20,
        mediaType: 'none',
        statements: [
          {
            id: 'st-ipa-1',
            statement: 'Partikel-partikel pada zat padat memiliki susunan yang sangat rapat dan gaya tarik-menarik antarpartikel yang sangat kuat.',
            correctAnswer: true
          },
          {
            id: 'st-ipa-2',
            statement: 'Proses perubahan wujud dari gas langsung menjadi padat disebut dengan menguap.',
            correctAnswer: false
          },
          {
            id: 'st-ipa-3',
            statement: 'Zat cair memiliki volume yang tetap namun bentuknya selalu mengikuti wadah tempatnya berada.',
            correctAnswer: true
          }
        ]
      },
      {
        id: 'q-ipa-4',
        number: 4,
        type: 'menjodohkan',
        question: 'Pasangkanlah organ sistem pencernaan manusia di sebelah kiri dengan fungsi utamanya yang tepat di sebelah kanan:',
        scoreWeight: 20,
        mediaType: 'none',
        matchingPairs: [
          {
            id: 'm-ipa-1',
            leftPrompt: 'Lambung (Ventrikulus)',
            rightMatch: 'Menghasilkan asam lambung (HCl) dan enzim pepsin untuk mencerna protein'
          },
          {
            id: 'm-ipa-2',
            leftPrompt: 'Usus Halus (Intestinum)',
            rightMatch: 'Tempat penyerapan utama sari-sari makanan ke dalam pembuluh darah'
          },
          {
            id: 'm-ipa-3',
            leftPrompt: 'Usus Besar (Kolon)',
            rightMatch: 'Penyerapan kembali air dan pembusukan sisa makanan oleh bakteri E. coli'
          }
        ]
      },
      {
        id: 'q-ipa-5',
        number: 5,
        type: 'pg',
        question: 'Simaklah rekaman audio penjelasan praktikum uji asam-basa menggunakan indikator lakmus berikut ini. Berdasarkan rekaman tersebut, warna kertas lakmus merah jika dicelupkan ke dalam larutan sabun akan berubah menjadi...',
        scoreWeight: 20,
        mediaType: 'audio',
        mediaUrl: 'https://cdn.freesound.org/previews/274/274178_5121236-lq.mp3',
        mediaCaption: '🎧 Audio Stimulus: Penjelasan Praktikum Larutan Asam & Basa (Sains Kelas 7)',
        audioMaxPlays: 3,
        options: [
          'Berubah menjadi warna Biru (karena sabun bersifat Basa)',
          'Tetap berwarna Merah (karena sabun bersifat Netral)',
          'Berubah menjadi warna Kuning keemasan',
          'Berubah menjadi Transparan'
        ],
        correctOptionIndex: 0
      }
    ]
  },
  {
    id: 'cbt-eng-7-pas',
    title: 'Asesmen Sumatif Akhir Semester (SAS/PAS) - Bahasa Inggris',
    subject: 'Bahasa Inggris',
    gradeLevel: '7',
    targetClasses: ['7-A', '7-B', '7-C', '7-D', '7-E', '7-F'],
    semester: 'Ganjil (PAS/SAS)',
    academicYear: '2026/2027',
    durationMinutes: 90,
    token: 'ENG7SM',
    passingGrade: 75,
    totalQuestions: 4,
    status: 'active',
    teacherName: 'Erma Rismayanti, S.Pd.',
    instructions: 'Put on your headphones for the listening section. Choose the most appropriate answer for each question.',
    createdAt: '2026-10-05',
    questions: [
      {
        id: 'q-eng-1',
        number: 1,
        type: 'pg',
        question: 'Listen carefully to the audio conversation between Edo and Dayu at the school library. What time does the school library close today?',
        scoreWeight: 25,
        mediaType: 'audio',
        mediaUrl: 'https://cdn.freesound.org/previews/274/274178_5121236-lq.mp3',
        mediaCaption: '🎧 Audio Section 1: Daily Conversation at Spentic Library',
        audioMaxPlays: 3,
        options: [
          'At 02.00 PM in the afternoon',
          'At 03.30 PM in the afternoon',
          'At 11.45 AM in the morning',
          'At 05.00 PM in the evening'
        ],
        correctOptionIndex: 1
      },
      {
        id: 'q-eng-2',
        number: 2,
        type: 'pg_kompleks',
        question: 'Read the short introduction text below. Which sentences are grammatically CORRECT in using Subject Pronouns and to be? (Select TWO or MORE correct sentences!)',
        scoreWeight: 25,
        mediaType: 'none',
        options: [
          'Rina and I are seventh-grade students at SMP Negeri 3 Cihampelas.',
          'They is very excited to join the English Club competition.',
          'Mr. Hendra is our dedicated science teacher in school.',
          'She am always polite and friendly to everyone.'
        ],
        correctOptionIndices: [0, 2]
      },
      {
        id: 'q-eng-3',
        number: 3,
        type: 'benar_salah',
        question: 'Determine whether each statement below is TRUE or FALSE based on the classroom greeting rules:',
        scoreWeight: 25,
        mediaType: 'none',
        statements: [
          {
            id: 'st-eng-1',
            statement: 'We say "Good Morning" when meeting our teachers between 06.00 AM and 11.59 AM.',
            correctAnswer: true
          },
          {
            id: 'st-eng-2',
            statement: '"Good Night" is used when greeting someone in the afternoon at school.',
            correctAnswer: false
          },
          {
            id: 'st-eng-3',
            statement: 'When leaving a friend after school, we can say "Goodbye" or "See you tomorrow".',
            correctAnswer: true
          }
        ]
      },
      {
        id: 'q-eng-4',
        number: 4,
        type: 'menjodohkan',
        question: 'Match the English vocabulary on the left with its correct Indonesian translation on the right:',
        scoreWeight: 25,
        mediaType: 'none',
        matchingPairs: [
          {
            id: 'm-eng-1',
            leftPrompt: 'Timetable / Schedule',
            rightMatch: 'Jadwal Pelajaran'
          },
          {
            id: 'm-eng-2',
            leftPrompt: 'Headmaster / Principal',
            rightMatch: 'Kepala Sekolah'
          },
          {
            id: 'm-eng-3',
            leftPrompt: 'Laboratory Equipment',
            rightMatch: 'Peralatan Laboratorium'
          }
        ]
      }
    ]
  }
];

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
    if (!raw) {
      localStorage.setItem(CBT_PACKAGES_KEY, JSON.stringify(INITIAL_CBT_PACKAGES));
      return INITIAL_CBT_PACKAGES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CBT_PACKAGES;
  } catch {
    return INITIAL_CBT_PACKAGES;
  }
}

export function saveStoredCbtPackages(packages: CbtExamPackage[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CBT_PACKAGES_KEY, JSON.stringify(packages));
    window.dispatchEvent(new Event('cbtPackagesUpdated'));
  } catch (e) {
    console.error('Failed saving CBT packages', e);
  }
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
  } catch (e) {
    console.error('Failed saving student CBT session', e);
  }
}

export function resetStoredStudentCbtSession(examId: string, studentId: string) {
  if (typeof window === 'undefined') return;
  try {
    const all = getStoredStudentCbtSessions();
    const key = `${examId}_${studentId}`;
    if (all[key]) {
      delete all[key];
      localStorage.setItem(CBT_STUDENT_SESSIONS_KEY, JSON.stringify(all));
      window.dispatchEvent(new Event('cbtSessionsUpdated'));
    }
  } catch (e) {
    console.error('Failed resetting student CBT session', e);
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
  } catch (e) {
    console.error('Failed saving CBT room attendance', e);
  }
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
