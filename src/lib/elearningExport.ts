'use client';

import * as XLSX from 'xlsx';
import { 
  Student, 
  AttendanceStatus, 
  SchoolClass, 
  ClassSessionAttendance, 
  SubjectSession 
} from './elearningData';

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  H: 'HADIR',
  S: 'SAKIT',
  I: 'IZIN',
  A: 'ALPA',
  T: 'TERLAMBAT',
  K: 'KELUAR'
};

/**
 * Format tanggal Indonesia: contoh "29 September 2026"
 */
export function formatIndonesianDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-');
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Dapatkan tanggal hari ini (YYYY-MM-DD) sesuai zona waktu WIB (Asia/Jakarta)
 */
export function getTodayWibDateStr(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
}

/**
 * Konversi ISO timestamp (UTC) menjadi jam WIB yang akurat (contoh: "21:28 WIB")
 */
export function formatWibTimeLabel(isoStr?: string): string {
  if (!isoStr) return '-';
  const trimmed = isoStr.trim();
  if (!trimmed) return '-';
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const hhmm = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(parsed);
    return `${hhmm} WIB`;
  }
  return trimmed.includes('WIB') ? trimmed : `${trimmed} WIB`;
}

/**
 * Sanitize filename to avoid invalid characters on OS
 */
function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '_').trim();
}

/**
 * Export Presensi Mata Pelajaran untuk Guru Mapel
 */
export function exportMapelAttendanceToExcel(params: {
  classId: string;
  className: string;
  subject: string;
  teacherName: string;
  teacherNip: string;
  date: string;
  students: Student[];
  records: Record<string, AttendanceStatus>;
  notes?: Record<string, string>;
}) {
  const {
    classId,
    className,
    subject,
    teacherName,
    teacherNip,
    date,
    students,
    records,
    notes = {}
  } = params;

  // 1. Build Header & Info rows
  const rows: (string | number)[][] = [
    ['SMP NEGERI 3 CIHAMPELAS'],
    ['JURNAL & DAFTAR PRESENSI MATA PELAJARAN'],
    ['Tahun Ajaran 2026/2027'],
    [],
    ['Mata Pelajaran', ':', subject],
    ['Kelas', ':', `${className} (${classId})`],
    ['Guru Pengampu', ':', teacherName],
    ['NIP', ':', teacherNip || '-'],
    ['Tanggal Pelaksanaan', ':', formatIndonesianDate(date)],
    ['Total Siswa', ':', `${students.length} Siswa`],
    [],
    // Table Headers
    ['No.', 'NISN', 'NIS', 'Nama Siswa', 'Status Kehadiran', 'Keterangan / Catatan Guru']
  ];

  let countH = 0;
  let countS = 0;
  let countI = 0;
  let countA = 0;
  let countT = 0;
  let countK = 0;

  // 2. Add Student Rows
  students.forEach((student, index) => {
    const status: AttendanceStatus = records[student.id] || (student.status === 'Keluar' ? 'K' : 'H');
    const note = notes[student.id] || (student.status === 'Keluar' ? `Keluar/Pindah: ${student.exitReason || '-'}` : '-');

    if (status === 'H') countH++;
    else if (status === 'S') countS++;
    else if (status === 'I') countI++;
    else if (status === 'A') countA++;
    else if (status === 'T') countT++;
    else if (status === 'K') countK++;

    rows.push([
      index + 1,
      student.nisn,
      student.nis || '-',
      student.name,
      STATUS_LABELS[status] || 'HADIR',
      note
    ]);
  });

  // 3. Summary Rows
  const total = students.length;
  const activeTotal = total - countK;
  const pctHadir = activeTotal > 0 ? ((countH / activeTotal) * 100).toFixed(1) : '0';

  rows.push([]);
  rows.push(['RINGKASAN KEHADIRAN:']);
  rows.push(['Hadir (H)', countH, `${pctHadir}% (dari ${activeTotal} siswa aktif)`]);
  rows.push(['Sakit (S)', countS]);
  rows.push(['Izin (I)', countI]);
  rows.push(['Alpa (A)', countA]);
  rows.push(['Terlambat (T)', countT]);
  if (countK > 0) {
    rows.push(['Keluar / Pindah (K)', countK]);
  }
  rows.push(['Total Terdaftar', total]);
  rows.push([]);
  rows.push([]);

  // 4. Signature block
  rows.push(['', '', '', '', 'Cihampelas, ' + formatIndonesianDate(date)]);
  rows.push(['', '', '', '', 'Guru Mata Pelajaran,']);
  rows.push([]);
  rows.push([]);
  rows.push(['', '', '', '', teacherName]);
  rows.push(['', '', '', '', 'NIP. ' + (teacherNip || '-')]);

  // Create Worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // NISN
    { wch: 12 }, // NIS
    { wch: 34 }, // Nama Siswa
    { wch: 18 }, // Status
    { wch: 32 }  // Keterangan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Presensi ${classId}`);

  // Download file
  const fileName = sanitizeFileName(`Presensi_${classId}_${subject}_${date}.xlsx`);
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export Laporan Harian Meja Piket (Semua 17 Kelas)
 */
export function exportSchoolDailyAttendanceToExcel(params: {
  date: string;
  classes: SchoolClass[];
  attendanceData: Record<string, ClassSessionAttendance>;
  students: Student[];
  sessions?: SubjectSession[];
}) {
  const { date, classes, attendanceData, students, sessions = [] } = params;

  const workbook = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // SHEET 1: REKAPITULASI 17 KELAS
  // -------------------------------------------------------------
  const summaryRows: (string | number)[][] = [
    ['SMP NEGERI 3 CIHAMPELAS'],
    ['LAPORAN HARIAN MEJA PIKET & PRESENSI KELAS'],
    ['Tahun Ajaran 2026/2027'],
    [],
    ['Tanggal', ':', formatIndonesianDate(date)],
    ['Waktu Cetak', ':', new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB'],
    [],
    [
      'No.',
      'Rombel / Kelas',
      'Total Siswa',
      'Hadir (H)',
      'Sakit (S)',
      'Izin (I)',
      'Alpa (A)',
      'Telat (T)',
      '% Kehadiran',
      'Status Presensi',
      'Pengabsen Terakhir',
      'Jam Update'
    ]
  ];

  let totalSchoolStudents = 0;
  let totalH = 0;
  let totalS = 0;
  let totalI = 0;
  let totalA = 0;
  let totalT = 0;

  classes.forEach((cls, idx) => {
    const clsStudents = students.filter(s => s.classId === cls.id);
    const session = attendanceData[cls.id];
    const classSessions = sessions.filter(s => s.date === date && s.classId === cls.id);
    const isSubmitted = classSessions.length > 0 || !!session?.isSubmitted;

    let h = 0, s = 0, i = 0, a = 0, t = 0;

    clsStudents.forEach(st => {
      let stStatus: AttendanceStatus = 'H';
      // Prioritize any anomaly reported in any mapel session today
      for (const cs of classSessions) {
        if (cs.records?.[st.id] && cs.records[st.id] !== 'H') {
          stStatus = cs.records[st.id];
          break;
        }
      }
      if (stStatus === 'H' && session?.records?.[st.id]) {
        stStatus = session.records[st.id];
      }

      if (stStatus === 'H') h++;
      else if (stStatus === 'S') s++;
      else if (stStatus === 'I') i++;
      else if (stStatus === 'A') a++;
      else if (stStatus === 'T') t++;
    });

    const clsTotal = clsStudents.length;
    totalSchoolStudents += clsTotal;
    totalH += h;
    totalS += s;
    totalI += i;
    totalA += a;
    totalT += t;

    const pct = clsTotal > 0 ? ((h / clsTotal) * 100).toFixed(1) + '%' : '0%';

    const teacherInfo = classSessions.length > 0
      ? classSessions.map(cs => `${cs.subject.split(' ')[0]} (${cs.teacherName.split(',')[0]})`).join(', ')
      : (session?.teacherName || '-');

    const updateTime = classSessions[classSessions.length - 1]?.submittedAt || session?.submittedAt || '-';

    summaryRows.push([
      idx + 1,
      cls.name,
      clsTotal,
      h,
      s,
      i,
      a,
      t,
      pct,
      isSubmitted ? (classSessions.length > 0 ? `${classSessions.length} Mapel Selesai` : 'Selesai') : 'Belum Diabsen',
      teacherInfo,
      updateTime
    ]);
  });

  // Total Row
  const totalSchoolPct = totalSchoolStudents > 0 
    ? ((totalH / totalSchoolStudents) * 100).toFixed(1) + '%' 
    : '0%';

  summaryRows.push([]);
  summaryRows.push([
    '',
    'TOTAL KESELURUHAN',
    totalSchoolStudents,
    totalH,
    totalS,
    totalI,
    totalA,
    totalT,
    totalSchoolPct,
    '-',
    '-',
    '-'
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 5 },  // No
    { wch: 16 }, // Kelas
    { wch: 12 }, // Total
    { wch: 10 }, // H
    { wch: 10 }, // S
    { wch: 10 }, // I
    { wch: 10 }, // A
    { wch: 10 }, // T
    { wch: 14 }, // %
    { wch: 16 }, // Status
    { wch: 28 }, // Pengabsen
    { wch: 14 }  // Jam
  ];
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Rekap 17 Kelas');

  // -------------------------------------------------------------
  // SHEET 2: DAFTAR SISWA TIDAK HADIR / PERLU PERHATIAN (S/I/A/T)
  // -------------------------------------------------------------
  const absentRows: (string | number)[][] = [
    ['SMP NEGERI 3 CIHAMPELAS'],
    ['DAFTAR SISWA TIDAK HADIR & KETERANGAN (SAKIT, IZIN, ALPA, TELAT)'],
    ['Tanggal: ' + formatIndonesianDate(date)],
    [],
    ['No.', 'Kelas', 'NISN', 'Nama Siswa', 'Status', 'Keterangan / Alasan', 'Pengabsen', 'Waktu']
  ];

  let absentCount = 0;

  classes.forEach(cls => {
    const clsStudents = students.filter(s => s.classId === cls.id);
    const session = attendanceData[cls.id];
    const classSessions = sessions.filter(s => s.date === date && s.classId === cls.id);

    clsStudents.forEach(st => {
      let reportedStatus: AttendanceStatus | null = null;
      let reportedNote: string = '-';
      let reportedTeacher: string = '-';
      let reportedTime: string = '-';

      // Check all mapel sessions for any recorded absence
      for (const cs of classSessions) {
        if (cs.records?.[st.id] && cs.records[st.id] !== 'H') {
          reportedStatus = cs.records[st.id];
          reportedNote = cs.notes?.[st.id] ? `(${cs.subject}) ${cs.notes[st.id]}` : `(Mapel ${cs.subject})`;
          reportedTeacher = `${cs.teacherName} (${cs.subject})`;
          reportedTime = cs.submittedAt || '-';
          break;
        }
      }

      if (!reportedStatus && session?.records?.[st.id] && session.records[st.id] !== 'H') {
        reportedStatus = session.records[st.id];
        reportedNote = (session.notes && session.notes[st.id]) || '-';
        reportedTeacher = session.teacherName || 'Meja Piket';
        reportedTime = session.submittedAt || '-';
      }

      if (reportedStatus) {
        absentCount++;
        absentRows.push([
          absentCount,
          cls.name,
          st.nisn,
          st.name,
          STATUS_LABELS[reportedStatus] || reportedStatus,
          reportedNote,
          reportedTeacher,
          reportedTime
        ]);
      }
    });
  });

  if (absentCount === 0) {
    absentRows.push(['-', '-', '-', 'Alhamdulillah seluruh siswa hadir (Nihil Tidak Hadir)', '-', '-', '-', '-']);
  }

  const wsAbsent = XLSX.utils.aoa_to_sheet(absentRows);
  wsAbsent['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // Kelas
    { wch: 14 }, // NISN
    { wch: 32 }, // Nama
    { wch: 14 }, // Status
    { wch: 34 }, // Keterangan
    { wch: 24 }, // Pengabsen
    { wch: 14 }  // Waktu
  ];
  XLSX.utils.book_append_sheet(workbook, wsAbsent, 'Siswa Tidak Hadir');

  // -------------------------------------------------------------
  // SHEET 3: LOG SESI MATA PELAJARAN (JIKA ADA RIWAYAT)
  // -------------------------------------------------------------
  if (sessions.length > 0) {
    const sessionRows: (string | number)[][] = [
      ['SMP NEGERI 3 CIHAMPELAS'],
      ['LOG PEMBELAJARAN & PRESENSI MATA PELAJARAN HARI INI'],
      ['Tanggal: ' + formatIndonesianDate(date)],
      [],
      ['No.', 'Waktu', 'Kelas', 'Mata Pelajaran', 'Guru Pengampu', 'Hadir', 'Sakit', 'Izin', 'Alpa', 'Telat']
    ];

    sessions.forEach((s, idx) => {
      let h = 0, sk = 0, iz = 0, ap = 0, tl = 0;
      Object.values(s.records || {}).forEach(st => {
        if (st === 'H') h++;
        else if (st === 'S') sk++;
        else if (st === 'I') iz++;
        else if (st === 'A') ap++;
        else if (st === 'T') tl++;
      });

      sessionRows.push([
        idx + 1,
        s.submittedAt || '-',
        s.classId,
        s.subject,
        s.teacherName,
        h,
        sk,
        iz,
        ap,
        tl
      ]);
    });

    const wsSessions = XLSX.utils.aoa_to_sheet(sessionRows);
    wsSessions['!cols'] = [
      { wch: 5 },  // No
      { wch: 14 }, // Waktu
      { wch: 12 }, // Kelas
      { wch: 30 }, // Mapel
      { wch: 26 }, // Guru
      { wch: 8 },  // H
      { wch: 8 },  // S
      { wch: 8 },  // I
      { wch: 8 },  // A
      { wch: 8 }   // T
    ];
    XLSX.utils.book_append_sheet(workbook, wsSessions, 'Log Sesi KBM');
  }

  const fileName = sanitizeFileName(`Rekap_Presensi_Harian_SMPN3Cihampelas_${date}.xlsx`);
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export Rekap Presensi 1 Semester Seluruh Sekolah (17 Rombel, 535 Siswa) untuk Meja Piket / Kesiswaan
 */
export function exportSchoolSemesterAttendanceToExcel(params: {
  semesterName?: string;
  classes: SchoolClass[];
  students: Student[];
  piketOfficer: string;
  sessions?: SubjectSession[];
  semester?: 'ganjil' | 'genap';
  academicYear?: string;
}) {
  const {
    semesterName = 'Semester Ganjil TP. 2026/2027',
    classes,
    students,
    piketOfficer,
    sessions = [],
    semester = 'ganjil',
    academicYear = '2026/2027'
  } = params;

  const workbook = XLSX.utils.book_new();

  // Filter sesi sesuai tahun ajaran dan semester yang dipilih
  const [startYearStr, endYearStr] = academicYear.split('/');
  const startYear = parseInt(startYearStr, 10) || 2026;
  const endYear = parseInt(endYearStr, 10) || (startYear + 1);

  const semesterSessions = sessions.filter(s => {
    if (!s.date) return false;
    const parts = s.date.split('-');
    if (parts.length < 3) return false;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (semester === 'genap') {
      return y === endYear && m >= 1 && m <= 6;
    } else {
      return y === startYear && m >= 7 && m <= 12;
    }
  });

  // -------------------------------------------------------------
  // SHEET 1: REKAPITULASI 17 ROMBEL TINGKAT SEKOLAH
  // -------------------------------------------------------------
  const summaryRows: (string | number)[][] = [
    ['SMP NEGERI 3 CIHAMPELAS'],
    ['LAPORAN REKAPITULASI PRESENSI TINGKAT SEKOLAH 1 SEMESTER'],
    ['Tahun Ajaran ' + academicYear + ' (' + semesterName + ')'],
    [],
    ['Petugas Rekap Piket', ':', piketOfficer],
    ['Tanggal Cetak', ':', formatIndonesianDate(getTodayWibDateStr())],
    ['Total Rombel', ':', `${classes.length} Kelas (7-A s/d 9-E)`],
    ['Total Peserta Didik', ':', `${students.length} Siswa Terdaftar`],
    [],
    [
      'No.',
      'Rombel / Kelas',
      'Wali Kelas',
      'Total Siswa',
      'Total Hadir (H)',
      'Total Sakit (S)',
      'Total Izin (I)',
      'Total Alpa (A)',
      'Total Telat (T)',
      '% Kehadiran Rombel',
      'Kategori Ketertiban'
    ]
  ];

  let schoolTotalStudents = 0;
  let schoolTotalH = 0;
  let schoolTotalS = 0;
  let schoolTotalI = 0;
  let schoolTotalA = 0;
  let schoolTotalT = 0;
  let schoolTotalSlots = 0;

  // Pre-calculate statistics per class and student
  interface StudentSemesterStat {
    h: number;
    s: number;
    i: number;
    a: number;
    t: number;
    k: number;
    totalDays: number;
    pctNum: number | null;
    pctStr: string;
    statusKet: string;
    isKeluar: boolean;
  }

  const studentStatsMap = new Map<string, StudentSemesterStat>();

  classes.forEach((cls, idx) => {
    const clsStudents = students.filter(s => s.classId === cls.id);
    const clsSessions = semesterSessions.filter(s => s.classId === cls.id);
    const classDates = Array.from(new Set(clsSessions.map(s => s.date))).sort();
    const numDays = classDates.length;

    let classH = 0, classS = 0, classI = 0, classA = 0, classT = 0;
    const activeInClass = clsStudents.filter(s => s.status !== 'Keluar').length;

    clsStudents.forEach(st => {
      let stH = 0, stS = 0, stI = 0, stA = 0, stT = 0, stK = 0;
      const isKeluar = st.status === 'Keluar';

      if (numDays > 0) {
        classDates.forEach(dateStr => {
          const daySessions = clsSessions.filter(s => s.date === dateStr);
          let hasA = false, hasS = false, hasI = false, hasT = false, hasK = false;
          let hasRecord = false;

          for (const sess of daySessions) {
            const rec = sess.records?.[st.id];
            if (rec) {
              hasRecord = true;
              if (rec === 'A') hasA = true;
              else if (rec === 'S') hasS = true;
              else if (rec === 'I') hasI = true;
              else if (rec === 'T') hasT = true;
              else if (rec === 'K') hasK = true;
            }
          }

          if (isKeluar || hasK) {
            stK++;
          } else if (hasA) {
            stA++;
          } else if (hasS) {
            stS++;
          } else if (hasI) {
            stI++;
          } else if (hasT) {
            stT++;
          } else if (hasRecord || daySessions.length > 0) {
            stH++;
          }
        });
      }

      const pctNum = numDays > 0 && !isKeluar ? ((stH + stT) / numDays) * 100 : null;
      const pctStr = isKeluar
        ? 'Keluar'
        : (pctNum !== null ? `${pctNum.toFixed(1)}%` : '-');
      const statusKet = isKeluar
        ? (st.exitReason ? `Keluar (${st.exitReason})` : 'Keluar Sekolah')
        : (pctNum === null
          ? 'Belum Ada Sesi'
          : (pctNum >= 95 ? 'Sangat Baik' : pctNum >= 85 ? 'Baik' : 'Perlu Pembinaan BK'));

      studentStatsMap.set(st.id, {
        h: stH,
        s: stS,
        i: stI,
        a: stA,
        t: stT,
        k: stK,
        totalDays: numDays,
        pctNum,
        pctStr,
        statusKet,
        isKeluar
      });

      if (!isKeluar) {
        classH += stH;
        classS += stS;
        classI += stI;
        classA += stA;
        classT += stT;
      }
    });

    const classSlots = activeInClass * numDays;
    const classPct = classSlots > 0 
      ? (((classH + classT) / classSlots) * 100).toFixed(1) + '%' 
      : (numDays === 0 ? '-' : '0%');

    const kategori = numDays === 0
      ? 'Belum Ada Sesi'
      : (parseFloat(classPct) >= 95 ? 'Sangat Baik' : parseFloat(classPct) >= 88 ? 'Baik' : 'Perlu Pembinaan');

    schoolTotalStudents += clsStudents.length;
    schoolTotalH += classH;
    schoolTotalS += classS;
    schoolTotalI += classI;
    schoolTotalA += classA;
    schoolTotalT += classT;
    schoolTotalSlots += classSlots;

    summaryRows.push([
      idx + 1,
      cls.name,
      cls.waliKelas || `Wali Kelas ${cls.name}`,
      clsStudents.length,
      classH,
      classS,
      classI,
      classA,
      classT,
      classPct,
      kategori
    ]);
  });

  const schoolPct = schoolTotalSlots > 0 
    ? (((schoolTotalH + schoolTotalT) / schoolTotalSlots) * 100).toFixed(1) + '%' 
    : (schoolTotalSlots === 0 ? '-' : '0%');

  summaryRows.push([]);
  summaryRows.push([
    '',
    'TOTAL KESELURUHAN SEKOLAH',
    '-',
    schoolTotalStudents,
    schoolTotalH,
    schoolTotalS,
    schoolTotalI,
    schoolTotalA,
    schoolTotalT,
    schoolPct,
    schoolTotalSlots > 0 ? (parseFloat(schoolPct) >= 90 ? 'Sangat Baik' : 'Baik') : '-'
  ]);

  // Signature Block on Sheet 1
  summaryRows.push([]);
  summaryRows.push([]);
  const todayFormatted = formatIndonesianDate(getTodayWibDateStr());
  summaryRows.push(['', '', 'Mengetahui,', '', '', '', '', '', 'Cihampelas, ' + todayFormatted]);
  summaryRows.push(['', '', 'Kepala SMP Negeri 3 Cihampelas,', '', '', '', '', '', 'Petugas Meja Piket / Kesiswaan,']);
  summaryRows.push([]);
  summaryRows.push([]);
  summaryRows.push(['', '', 'H. Rustandi, S.Pd., M.Pd.', '', '', '', '', '', piketOfficer]);
  summaryRows.push(['', '', 'NIP. 19670815 199003 1 004', '', '', '', '', '', 'NIP/NUPTK: -']);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 5 },  // No
    { wch: 16 }, // Kelas
    { wch: 22 }, // Wali Kelas
    { wch: 12 }, // Total
    { wch: 14 }, // H
    { wch: 14 }, // S
    { wch: 14 }, // I
    { wch: 14 }, // A
    { wch: 14 }, // T
    { wch: 18 }, // % Hadir
    { wch: 20 }  // Kategori
  ];
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Rekap 17 Rombel');

  // -------------------------------------------------------------
  // SHEET 2: REKAPITULASI SELURUH 535 SISWA
  // -------------------------------------------------------------
  const studentRows: (string | number)[][] = [
    ['SMP NEGERI 3 CIHAMPELAS'],
    ['DAFTAR PRESENSI SISWA 1 SEMESTER (SELURUH ROMBEL UNTUK e-RAPOR)'],
    ['Tahun Ajaran ' + academicYear + ' (' + semesterName + ')'],
    [],
    ['No.', 'Kelas', 'NISN', 'NIS', 'Nama Siswa', 'Hadir (H)', 'Sakit (S)', 'Izin (I)', 'Alpa (A)', 'Telat (T)', '% Kehadiran', 'Keterangan e-Rapor']
  ];

  const bkFollowUpRows: (string | number)[][] = [
    ['SMP NEGERI 3 CIHAMPELAS'],
    ['DAFTAR SISWA PERLU PANTAUAN & PEMBINAAN GURU BK / KESISWAAN'],
    ['Kriteria: Kehadiran < 90% atau Memiliki Catatan Alpa/Telat'],
    [],
    ['No.', 'Kelas', 'NISN', 'Nama Siswa', 'Alpa (A)', 'Telat (T)', '% Kehadiran', 'Rekomendasi Tindak Lanjut BK']
  ];

  let bkCount = 0;

  students.forEach((st, idx) => {
    const stat = studentStatsMap.get(st.id) || {
      h: 0, s: 0, i: 0, a: 0, t: 0, k: 0, totalDays: 0,
      pctNum: null, pctStr: '-', statusKet: 'Belum Ada Sesi', isKeluar: st.status === 'Keluar'
    };

    studentRows.push([
      idx + 1,
      st.classId,
      st.nisn,
      st.nis || '-',
      st.name,
      stat.h,
      stat.s,
      stat.i,
      stat.a,
      stat.t,
      stat.pctStr,
      stat.statusKet
    ]);

    if (!stat.isKeluar && (stat.a >= 1 || (stat.pctNum !== null && stat.pctNum < 90) || stat.t >= 3)) {
      bkCount++;
      const rekomendasi = stat.a >= 3
        ? 'Panggilan Orang Tua & Konferensi Kasus BK'
        : stat.a >= 1
        ? 'Konseling Individual Guru BK & Wali Kelas'
        : stat.t >= 3
        ? 'Pembinaan Kedisiplinan & Piket'
        : 'Bimbingan Wali Kelas & Pemantauan Kehadiran';

      bkFollowUpRows.push([
        bkCount,
        st.classId,
        st.nisn,
        st.name,
        stat.a,
        stat.t,
        stat.pctStr,
        rekomendasi
      ]);
    }
  });

  const wsStudents = XLSX.utils.aoa_to_sheet(studentRows);
  wsStudents['!cols'] = [
    { wch: 6 },  // No
    { wch: 10 }, // Kelas
    { wch: 14 }, // NISN
    { wch: 12 }, // NIS
    { wch: 32 }, // Nama
    { wch: 10 }, // H
    { wch: 10 }, // S
    { wch: 10 }, // I
    { wch: 10 }, // A
    { wch: 10 }, // T
    { wch: 14 }, // %
    { wch: 24 }  // Ket
  ];
  XLSX.utils.book_append_sheet(workbook, wsStudents, 'Rekap 535 Siswa');

  // -------------------------------------------------------------
  // SHEET 3: PANTAUAN BK & KESISWAAN
  // -------------------------------------------------------------
  if (bkCount === 0) {
    bkFollowUpRows.push(['-', '-', '-', 'Alhamdulillah seluruh siswa memenuhi standar kehadiran (Nihil Kasus)', 0, 0, '100%', '-']);
  }
  const wsBK = XLSX.utils.aoa_to_sheet(bkFollowUpRows);
  wsBK['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 14 },
    { wch: 32 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 38 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsBK, 'Pantauan Khusus BK');

  const cleanYear = (academicYear || '2026-2027').replace(/\//g, '-');
  const fileName = sanitizeFileName(`Rekap_Semester_Tingkat_Sekolah_SMPN3Cihampelas_${cleanYear}_${semester}.xlsx`);
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export Rekap Presensi 1 Semester (Pertemuan 1 s/d 16) untuk Penilaian e-Rapor
 */
export function exportSemesterAttendanceToExcel(params: {
  classId: string;
  className: string;
  subject: string;
  teacherName: string;
  teacherNip: string;
  semesterName?: string;
  students: Student[];
  currentRecords: Record<string, AttendanceStatus>;
  sessions?: SubjectSession[];
}) {
  const {
    classId,
    className,
    subject,
    teacherName,
    teacherNip,
    semesterName = 'Semester Ganjil 2026/2027',
    students,
    currentRecords,
    sessions
  } = params;

  // We have standard 16 meetings (P1 to P16)
  const TOTAL_MEETINGS = 16;
  const hasRealSessions = Array.isArray(sessions) && sessions.length > 0;
  const numSessions = hasRealSessions ? sessions.length : 0;
  const displayColsCount = Math.max(TOTAL_MEETINGS, numSessions);

  // Generate meeting headers (P1..P16) with dates if available
  const meetingHeaders: string[] = [];
  for (let idx = 0; idx < displayColsCount; idx++) {
    if (hasRealSessions && idx < sessions.length) {
      const parts = sessions[idx].date.split('-');
      const dateStr = parts.length === 3 ? `${parts[2]}/${parts[1]}` : sessions[idx].date;
      meetingHeaders.push(`P${idx + 1} (${dateStr})`);
    } else {
      meetingHeaders.push(`P${idx + 1}`);
    }
  }

  // Build Header & Info rows
  const rows: (string | number)[][] = [
    ['SMP NEGERI 3 CIHAMPELAS'],
    ['BUKU REKAPITULASI PRESENSI SISWA 1 SEMESTER (P1 - P16)'],
    ['UNTUK PENILAIAN SIKAP & e-RAPOR KEMENDIKBUD'],
    [],
    ['Mata Pelajaran', ':', subject],
    ['Kelas / Rombel', ':', `${className} (${classId})`],
    ['Guru Pengampu', ':', teacherName],
    ['NIP Guru', ':', teacherNip || '-'],
    ['Tahun Ajaran / Semester', ':', semesterName],
    ['Total Pertemuan Tercatat', ':', `${numSessions} Sesi KBM`],
    ['Total Siswa', ':', `${students.length} Siswa`],
    [],
    // Table Header Row
    [
      'No.',
      'NISN',
      'NIS',
      'Nama Siswa',
      ...meetingHeaders,
      'Total H',
      'Total S',
      'Total I',
      'Total A',
      'Total T',
      '% Hadir'
    ]
  ];

  // For meetings P1..P16:
  // If real sessions exist, use them. If not, fill with '-'
  students.forEach((student, index) => {
    const isKeluar = student.status === 'Keluar';
    const pStatus: (AttendanceStatus | string)[] = [];
    let h = 0, s = 0, i = 0, a = 0, t = 0;

    for (let m = 0; m < displayColsCount; m++) {
      if (hasRealSessions) {
        if (m < sessions.length) {
          const raw = sessions[m].records?.[student.id];
          const st = raw ? raw : (isKeluar ? 'K' : 'H');
          pStatus.push(st);
          if (st === 'H') h++;
          else if (st === 'S') s++;
          else if (st === 'I') i++;
          else if (st === 'A') a++;
          else if (st === 'T') t++;
        } else {
          pStatus.push(isKeluar ? 'K' : '-');
        }
      } else {
        pStatus.push(isKeluar ? 'K' : '-');
      }
    }

    const pct = isKeluar
      ? (student.exitReason ? `Keluar (${student.exitReason})` : 'Keluar')
      : (numSessions > 0 ? `${Math.round(((h + t) / numSessions) * 100)}%` : '-');

    rows.push([
      index + 1,
      student.nisn,
      student.nis || '-',
      student.name,
      ...pStatus,
      h,
      s,
      i,
      a,
      t,
      pct
    ]);
  });

  // Footer: Summary statistics
  rows.push([]);
  rows.push(['Keterangan Status: H = Hadir, S = Sakit, I = Izin, A = Alpa, T = Terlambat, K = Siswa Keluar / Mutasi, - = Belum Ada Sesi']);
  rows.push([`Total Pertemuan Semester: ${numSessions} Sesi dari Target 16 Pertemuan Efektif`]);
  rows.push([]);
  rows.push([]);

  // Signature Block
  const todayStr = formatIndonesianDate(getTodayWibDateStr());
  const emptyCols = Array.from({ length: Math.max(0, displayColsCount - 4) }, () => '');
  rows.push(['', '', '', 'Mengetahui,', ...emptyCols, '', '', '', '', '', 'Cihampelas, ' + todayStr]);
  rows.push(['', '', '', 'Kepala SMP Negeri 3 Cihampelas,', ...emptyCols, '', '', '', '', '', 'Guru Mata Pelajaran,']);
  rows.push([]);
  rows.push([]);
  rows.push(['', '', '', 'H. Rustandi, S.Pd., M.Pd.', ...emptyCols, '', '', '', '', '', teacherName]);
  rows.push(['', '', '', 'NIP. 19670815 199003 1 004', ...emptyCols, '', '', '', '', '', 'NIP. ' + (teacherNip || '-')]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // NISN
    { wch: 12 }, // NIS
    { wch: 32 }, // Nama Siswa
    // Dynamic meeting cols
    ...Array.from({ length: displayColsCount }, () => ({ wch: 8 })),
    // Summary
    { wch: 8 },  // H
    { wch: 8 },  // S
    { wch: 8 },  // I
    { wch: 8 },  // A
    { wch: 8 },  // T
    { wch: 12 }  // % Hadir
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap Semester ${classId}`);

  const safeSem = (semesterName || 'Semester').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = sanitizeFileName(`Rekap_${safeSem}_${classId}_${subject}.xlsx`);
  XLSX.writeFile(workbook, fileName);
}

/**
 * Unduh Template Kosong Excel untuk Import Siswa Baru oleh Admin / Operator TU
 */
export function downloadStudentTemplateExcel() {
  const rows = [
    ['No', 'NISN', 'NIS', 'Nama Siswa', 'Kelas'],
    [1, '0133138158', '262707001', 'Contoh Siswa 1', '7-A'],
    [2, '0137255146', '262707002', 'Contoh Siswa 2', '7-A'],
    [3, '0133299101', '262707003', 'Contoh Siswa 3', '7-B']
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 14 },
    { wch: 32 },
    { wch: 10 }
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Format_Import_Siswa');
  XLSX.writeFile(workbook, 'Template_Import_Siswa_SMPN3Cihampelas.xlsx');
}

/**
 * Ekspor Laporan Matriks Presensi Bulanan (Kalender Tanggal 1 s/d 31) ke Excel (.xlsx)
 */
export function exportMonthlyAttendanceMatrixToExcel(params: {
  classId: string;
  className: string;
  subject: string;
  teacherName: string;
  teacherNip: string;
  year: number;
  month: number; // 1-12
  monthName: string;
  daysInMonth: number;
  students: Student[];
  sessions: SubjectSession[];
}) {
  const {
    classId,
    className,
    subject,
    teacherName,
    teacherNip,
    year,
    month,
    monthName,
    daysInMonth,
    students,
    sessions
  } = params;

  // Header & Info Rows
  const rows: (string | number)[][] = [
    ['SMP NEGERI 3 CIHAMPELAS'],
    ['LAPORAN MATRIKS PRESENSI MATA PELAJARAN (BULANAN)'],
    ['Tahun Ajaran 2026/2027'],
    [],
    ['Mata Pelajaran', ':', subject],
    ['Kelas', ':', `${className} (${classId})`],
    ['Guru Pengampu', ':', teacherName],
    ['NIP', ':', teacherNip || '-'],
    ['Bulan / Tahun', ':', `${monthName} ${year}`],
    ['Total Peserta Didik', ':', `${students.length} Siswa`],
    []
  ];

  // Table Headers
  const headerRow: (string | number)[] = ['No.', 'NISN', 'NIS', 'Nama Siswa'];
  for (let d = 1; d <= daysInMonth; d++) {
    headerRow.push(d);
  }
  headerRow.push('H', 'S', 'I', 'A', 'T', '% Hadir');
  rows.push(headerRow);

  // Map dates to sessions for this class and month
  const monthPadded = String(month).padStart(2, '0');
  const dateSessionsMap = new Map<number, SubjectSession>();
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${monthPadded}-${String(d).padStart(2, '0')}`;
    const sess = sessions.find(s => s.date === dStr && s.classId === classId);
    if (sess) {
      dateSessionsMap.set(d, sess);
    }
  }

  // Daily present tally for footer
  const dailyPresentCount = new Array(daysInMonth + 1).fill(0);
  let classTotalH = 0;
  let classTotalS = 0;
  let classTotalI = 0;
  let classTotalA = 0;
  let classTotalT = 0;

  // Student rows
  students.forEach((student, idx) => {
    const studentRow: (string | number)[] = [
      idx + 1,
      student.nisn,
      student.nis || '-',
      student.name
    ];

    let h = 0, s = 0, i = 0, a = 0, t = 0;
    let meetings = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const sess = dateSessionsMap.get(d);
      if (!sess) {
        studentRow.push('-');
      } else {
        meetings++;
        const st = sess.records?.[student.id] || 'H';
        studentRow.push(st);
        if (st === 'H') { h++; dailyPresentCount[d]++; }
        else if (st === 'S') s++;
        else if (st === 'I') i++;
        else if (st === 'A') a++;
        else if (st === 'T') { t++; dailyPresentCount[d]++; }
      }
    }

    classTotalH += h;
    classTotalS += s;
    classTotalI += i;
    classTotalA += a;
    classTotalT += t;

    const pct = meetings > 0 ? ((h + t) / meetings * 100).toFixed(1) + '%' : '-';
    studentRow.push(h, s, i, a, t, pct);
    rows.push(studentRow);
  });

  // Footer: Total Hadir per Tanggal
  const footerRow: (string | number)[] = ['', '', '', 'Jumlah Siswa Hadir'];
  for (let d = 1; d <= daysInMonth; d++) {
    const sess = dateSessionsMap.get(d);
    footerRow.push(sess ? dailyPresentCount[d] : '-');
  }
  footerRow.push(classTotalH, classTotalS, classTotalI, classTotalA, classTotalT, '');
  rows.push(footerRow);

  // Signatures
  rows.push([]);
  rows.push([]);
  const todayStr = getTodayWibDateStr();
  rows.push(['', '', '', 'Mengetahui,', ...new Array(Math.max(1, daysInMonth - 5)).fill(''), 'Cihampelas, ' + formatIndonesianDate(todayStr)]);
  rows.push(['', '', '', 'Kepala SMP Negeri 3 Cihampelas,', ...new Array(Math.max(1, daysInMonth - 5)).fill(''), 'Guru Mata Pelajaran,']);
  rows.push([]);
  rows.push([]);
  rows.push(['', '', '', 'H. Rustandi, S.Pd., M.Pd.', ...new Array(Math.max(1, daysInMonth - 5)).fill(''), teacherName]);
  rows.push(['', '', '', 'NIP. 19700608 199802 1 001', ...new Array(Math.max(1, daysInMonth - 5)).fill(''), 'NIP. ' + (teacherNip || '-')]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  const colWidths: { wch: number }[] = [
    { wch: 5 },  // No
    { wch: 14 }, // NISN
    { wch: 12 }, // NIS
    { wch: 28 }, // Nama Siswa
  ];
  for (let d = 1; d <= daysInMonth; d++) {
    colWidths.push({ wch: 4 }); // Date columns
  }
  colWidths.push(
    { wch: 6 }, // H
    { wch: 6 }, // S
    { wch: 6 }, // I
    { wch: 6 }, // A
    { wch: 6 }, // T
    { wch: 10 } // % Hadir
  );
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  const safeSheetName = sanitizeFileName(`${classId}_${monthName}`).slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  const fileName = sanitizeFileName(`Laporan_Presensi_${classId}_${subject}_${monthName}_${year}.xlsx`);
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export Leger Nilai Asesmen CBT (PTS / PAS) untuk Guru Mata Pelajaran & Kurikulum
 */
export function exportCbtScoreLegerToExcel(params: {
  examTitle: string;
  subject: string;
  gradeOrClass: string;
  semester: string;
  teacherName: string;
  passingGrade: number;
  totalQuestions: number;
  results: Array<{
    studentNisn: string;
    studentName: string;
    classId: string;
    score: number;
    correctCount: number;
    wrongCount: number;
    isPassed: boolean;
    submittedAt?: string;
  }>;
}) {
  const {
    examTitle,
    subject,
    gradeOrClass,
    semester,
    teacherName,
    passingGrade,
    totalQuestions,
    results
  } = params;

  const todayStr = getTodayWibDateStr();
  const rows: any[][] = [];

  // Official School Header
  rows.push(['SMP NEGERI 3 CIHAMPELAS']);
  rows.push(['LEGER NILAI ASESMEN KOMPUTER (CBT)']);
  rows.push([`${examTitle.toUpperCase()} - TP. 2026/2027`]);
  rows.push([]);
  rows.push(['Mata Pelajaran:', subject, '', 'Kelas / Rombel:', gradeOrClass]);
  rows.push(['Semester:', semester, '', 'Guru Pengampu:', teacherName]);
  rows.push(['Kriteria Ketuntasan (KKM):', `${passingGrade}`, '', 'Total Soal Ujian:', `${totalQuestions} Butir Soal`]);
  rows.push(['Waktu Unduh:', formatIndonesianDate(todayStr)]);
  rows.push([]);

  // Table Header
  rows.push([
    'NO',
    'NISN',
    'NAMA LENGKAP SISWA',
    'KELAS',
    'JML SOAL',
    'BENAR',
    'SALAH',
    'NILAI AKHIR',
    'KKM',
    'STATUS KETUNTASAN',
    'WAKTU SELESAI'
  ]);

  let totalScore = 0;
  let passedCount = 0;

  results.forEach((r, idx) => {
    totalScore += r.score;
    if (r.isPassed) passedCount++;

    rows.push([
      idx + 1,
      r.studentNisn,
      r.studentName,
      r.classId,
      totalQuestions,
      r.correctCount,
      r.wrongCount,
      r.score,
      passingGrade,
      r.isPassed ? 'TUNTAS' : 'REMEDIAL',
      formatWibTimeLabel(r.submittedAt)
    ]);
  });

  const avgScore = results.length > 0 ? Math.round((totalScore / results.length) * 10) / 10 : 0;
  const passPercent = results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0;

  // Summary Statistical Rows
  rows.push([]);
  rows.push(['', '', 'STATISTIK KELAS', '', '', '', '', '', '', '', '']);
  rows.push(['', '', 'Total Peserta yang Mengerjakan:', `${results.length} Siswa`]);
  rows.push(['', '', 'Rata-Rata Nilai Kelas:', avgScore]);
  rows.push(['', '', 'Jumlah Siswa Tuntas (>= KKM):', `${passedCount} Siswa (${passPercent}%)`]);
  rows.push(['', '', 'Jumlah Siswa Perlu Remedial:', `${results.length - passedCount} Siswa`]);
  rows.push([]);

  // Signature Block
  rows.push(['', '', '', 'Mengetahui,', '', '', '', 'Cihampelas, ' + formatIndonesianDate(todayStr)]);
  rows.push(['', '', '', 'Kepala SMP Negeri 3 Cihampelas,', '', '', '', 'Guru Mata Pelajaran,']);
  rows.push([]);
  rows.push([]);
  rows.push(['', '', '', 'H. Rustandi, S.Pd., M.Pd.', '', '', '', teacherName]);
  rows.push(['', '', '', 'NIP. 19700608 199802 1 001', '', '', '', '-']);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // NISN
    { wch: 28 }, // Nama
    { wch: 8 },  // Kelas
    { wch: 10 }, // Jml Soal
    { wch: 8 },  // Benar
    { wch: 8 },  // Salah
    { wch: 12 }, // Nilai Akhir
    { wch: 8 },  // KKM
    { wch: 18 }, // Status
    { wch: 15 }, // Waktu
  ];

  const workbook = XLSX.utils.book_new();
  const safeSheet = sanitizeFileName(`Nilai_${gradeOrClass}_${subject}`).slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheet);

  const fileName = sanitizeFileName(`Leger_Nilai_CBT_${gradeOrClass}_${subject}_${todayStr}.xlsx`);
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export Berita Acara Pelaksanaan (BAP) & Daftar Hadir Ruang Ujian (.xlsx)
 */
export function exportCbtRoomBapToExcel(params: {
  examTitle: string;
  subject: string;
  roomName: string;
  supervisorName: string;
  token: string;
  date: string;
  notes?: string;
  students: Array<{
    nisn: string;
    name: string;
    classId: string;
    status: 'H' | 'S' | 'I' | 'A';
  }>;
}) {
  const {
    examTitle,
    subject,
    roomName,
    supervisorName,
    token,
    date,
    notes,
    students
  } = params;

  const rows: any[][] = [];

  rows.push(['SMP NEGERI 3 CIHAMPELAS']);
  rows.push(['DAFTAR HADIR & BERITA ACARA PELAKSANAAN UJIAN (BAP)']);
  rows.push([examTitle.toUpperCase()]);
  rows.push([]);
  rows.push(['Mata Pelajaran:', subject, '', 'Ruang Ujian:', roomName]);
  rows.push(['Guru Pengawas:', supervisorName, '', 'Token Sesi:', token]);
  rows.push(['Hari / Tanggal:', formatIndonesianDate(date)]);
  rows.push([]);

  // Table Header
  rows.push(['NO', 'NISN', 'NAMA PESERTA UJIAN', 'KELAS', 'STATUS KEHADIRAN', 'TANDA TANGAN / KET']);

  let hadirCount = 0;
  let sakitCount = 0;
  let izinCount = 0;
  let alpaCount = 0;

  students.forEach((st, idx) => {
    if (st.status === 'H') hadirCount++;
    else if (st.status === 'S') sakitCount++;
    else if (st.status === 'I') izinCount++;
    else if (st.status === 'A') alpaCount++;

    const statusLabel = st.status === 'H' ? 'HADIR' : st.status === 'S' ? 'SAKIT' : st.status === 'I' ? 'IZIN' : 'ALPA';
    rows.push([
      idx + 1,
      st.nisn,
      st.name,
      st.classId,
      statusLabel,
      st.status === 'H' ? `${idx + 1}. .........` : `(${statusLabel})`
    ]);
  });

  // Summary
  rows.push([]);
  rows.push(['', '', 'REKAPITULASI RUANG UJIAN:']);
  rows.push(['', '', 'Jumlah Terdaftar di Ruangan:', `${students.length} Siswa`]);
  rows.push(['', '', 'Jumlah Hadir Mengikuti Ujian:', `${hadirCount} Siswa`]);
  rows.push(['', '', 'Jumlah Sakit (Ujian Susulan):', `${sakitCount} Siswa`]);
  rows.push(['', '', 'Jumlah Izin (Ujian Susulan):', `${izinCount} Siswa`]);
  rows.push(['', '', 'Jumlah Alpa / Tanpa Keterangan:', `${alpaCount} Siswa`]);
  rows.push([]);
  rows.push(['Catatan Kejadian Ruang Ujian:', notes || 'Ujian berjalan tertib, aman, dan lancar tanpa kendala teknis.']);
  rows.push([]);

  // Signatures
  rows.push(['', '', 'Panitia Ujian Sekolah,', '', 'Pengawas Ruang Ujian,']);
  rows.push([]);
  rows.push([]);
  rows.push(['', '', 'Ketua Pelaksana Asesmen', '', supervisorName]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // NISN
    { wch: 28 }, // Nama
    { wch: 10 }, // Kelas
    { wch: 18 }, // Status
    { wch: 22 }, // Tanda tangan
  ];

  const workbook = XLSX.utils.book_new();
  const safeSheet = sanitizeFileName(`BAP_${roomName}`).slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheet);

  const fileName = sanitizeFileName(`BAP_Ujian_${roomName}_${subject}_${date}.xlsx`);
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export Rekapitulasi Berita Acara Pelaksanaan (BAP) Seluruh Sekolah ke Excel (.xlsx)
 */
export function exportCbtSchoolRekapBapToExcel(params: {
  academicYear: string;
  semester: string;
  date: string;
  rooms: Array<{
    no: number;
    roomName: string;
    classes: string;
    supervisor: string;
    total: number;
    present: number;
    sick: number;
    permit: number;
    absent: number;
    isSubmitted: boolean;
    notes: string;
  }>;
}) {
  const { academicYear, semester, date, rooms } = params;
  const rows: any[][] = [];

  rows.push(['PEMERINTAH DAERAH KABUPATEN BANDUNG BARAT']);
  rows.push(['DINAS PENDIDIKAN - SMP NEGERI 3 CIHAMPELAS']);
  rows.push(['REKAPITULASI BERITA ACARA PELAKSANAAN ASESMEN SUMATIF (CBT)']);
  rows.push([`Tahun Ajaran ${academicYear || '2026/2027'} - ${semester || 'PTS / STS Ganjil'}`]);
  rows.push([]);
  rows.push(['Hari / Tanggal:', formatIndonesianDate(date), '', 'Total Ruangan:', `${rooms.length} Ruang Ujian`]);
  rows.push([]);

  // Header Table
  rows.push([
    'NO',
    'RUANG UJIAN',
    'KELAS SASARAN',
    'GURU PENGAWAS',
    'JML SISWA',
    'HADIR (H)',
    'SAKIT (S)',
    'IZIN (I)',
    'ALPA (A)',
    'STATUS BAP',
    'CATATAN KEJADIAN KHUSUS'
  ]);

  let totalSiswa = 0;
  let totalHadir = 0;
  let totalSakit = 0;
  let totalIzin = 0;
  let totalAlpa = 0;
  let totalBapSubmitted = 0;

  rooms.forEach(r => {
    totalSiswa += r.total;
    totalHadir += r.present;
    totalSakit += r.sick;
    totalIzin += r.permit;
    totalAlpa += r.absent;
    if (r.isSubmitted) totalBapSubmitted++;

    rows.push([
      r.no,
      r.roomName,
      r.classes,
      r.supervisor,
      r.total,
      r.present,
      r.sick,
      r.permit,
      r.absent,
      r.isSubmitted ? 'LENGKAP' : 'BELUM DISERAHKAN',
      r.notes || '-'
    ]);
  });

  // Footer
  rows.push([]);
  rows.push([
    '',
    'TOTAL AKUMULASI SEKOLAH:',
    '',
    '',
    totalSiswa,
    totalHadir,
    totalSakit,
    totalIzin,
    totalAlpa,
    `${totalBapSubmitted} / ${rooms.length} Terkirim`,
    `Tingkat Kehadiran: ${totalSiswa > 0 ? ((totalHadir / totalSiswa) * 100).toFixed(1) : 0}%`
  ]);

  rows.push([]);
  rows.push(['', '', 'Mengetahui,', '', '', '', 'Cihampelas, ' + formatIndonesianDate(date)]);
  rows.push(['', '', 'Kepala SMP Negeri 3 Cihampelas,', '', '', '', 'Ketua Panitia Asesmen CBT,']);
  rows.push([]);
  rows.push([]);
  rows.push(['', '', 'H. Rustandi, S.Pd., M.Pd.', '', '', '', 'Panitia Asesmen SPENTIC']);
  rows.push(['', '', 'NIP. 19700608 199802 1 001', '', '', '', 'NIP. 19850312 201101 1 004']);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // Ruang
    { wch: 16 }, // Kelas
    { wch: 24 }, // Pengawas
    { wch: 10 }, // Jml
    { wch: 10 }, // H
    { wch: 10 }, // S
    { wch: 10 }, // I
    { wch: 10 }, // A
    { wch: 18 }, // Status BAP
    { wch: 40 }, // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekapitulasi_BAP');

  const fileName = sanitizeFileName(`Rekapitulasi_BAP_Sekolah_${date}.xlsx`);
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export Daftar Siswa Berhak Ujian Susulan (Sakit / Izin) ke Excel (.xlsx)
 */
export function exportCbtSusulanListToExcel(params: {
  academicYear: string;
  semester: string;
  date: string;
  students: Array<{
    no: number;
    nisn: string;
    name: string;
    classId: string;
    roomName: string;
    subject: string;
    status: 'S' | 'I';
    notes?: string;
  }>;
}) {
  const { academicYear, semester, date, students } = params;
  const rows: any[][] = [];

  rows.push(['PEMERINTAH DAERAH KABUPATEN BANDUNG BARAT']);
  rows.push(['DINAS PENDIDIKAN - SMP NEGERI 3 CIHAMPELAS']);
  rows.push(['DAFTAR PESERTA UJIAN SUSULAN ASESMEN SUMATIF (CBT)']);
  rows.push([`Tahun Ajaran ${academicYear || '2026/2027'} - ${semester || 'PTS / STS Ganjil'}`]);
  rows.push([]);
  rows.push(['Tanggal Rekapitulasi:', formatIndonesianDate(date), '', 'Total Peserta Susulan:', `${students.length} Siswa`]);
  rows.push([]);

  // Header Table
  rows.push([
    'NO',
    'NISN',
    'NAMA SISWA',
    'ROMBEL / KELAS',
    'RUANG UJIAN ASAL',
    'MATA PELAJARAN',
    'KETERANGAN / ALASAN',
    'CATATAN KEJADIAN DARI PENGAWAS',
    'STATUS JADWAL SUSULAN'
  ]);

  students.forEach((st) => {
    rows.push([
      st.no,
      st.nisn,
      st.name,
      st.classId,
      st.roomName,
      st.subject,
      st.status === 'S' ? 'SAKIT (Surat Dokter/Ortu)' : 'IZIN RESMI',
      st.notes || '-',
      'Menunggu Penjadwalan Lab Komputer'
    ]);
  });

  rows.push([]);
  rows.push(['', '', 'Mengetahui,', '', '', '', 'Cihampelas, ' + formatIndonesianDate(date)]);
  rows.push(['', '', 'Kepala SMP Negeri 3 Cihampelas,', '', '', '', 'Koordinator Ujian Susulan,']);
  rows.push([]);
  rows.push([]);
  rows.push(['', '', 'H. Rustandi, S.Pd., M.Pd.', '', '', '', 'Panitia Asesmen SPENTIC']);
  rows.push(['', '', 'NIP. 19700608 199802 1 001', '', '', '', 'NIP. 19850312 201101 1 004']);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // NISN
    { wch: 28 }, // Nama
    { wch: 16 }, // Kelas
    { wch: 18 }, // Ruang
    { wch: 25 }, // Mapel
    { wch: 25 }, // Keterangan
    { wch: 35 }, // Catatan
    { wch: 30 }, // Status Susulan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar_Ujian_Susulan');

  const fileName = sanitizeFileName(`Daftar_Peserta_Ujian_Susulan_${date}.xlsx`);
  XLSX.writeFile(workbook, fileName);
}



