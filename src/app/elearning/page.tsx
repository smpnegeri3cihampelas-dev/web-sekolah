'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, useTransition } from 'react';
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
  saveStoredSubmission,
  getTeacherUsername,
  TeacherUser,
  AuthUserSession,
  MONTH_NAMES
} from '@/lib/elearningData';
import {
  saveSubmissionFile,
  getSubmissionFile,
  dataUrlToBlobUrl
} from '@/lib/elearningStorage';
import {
  exportMapelAttendanceToExcel,
  exportSemesterAttendanceToExcel,
  exportMonthlyAttendanceMatrixToExcel,
  exportSchoolDailyAttendanceToExcel,
  exportSchoolSemesterAttendanceToExcel,
  formatIndonesianDate
} from '@/lib/elearningExport';
import SubmissionSplitPreviewModal from '@/components/SubmissionSplitPreviewModal';
import CreateAssignmentModal from '@/components/CreateAssignmentModal';
import StudentSubmitModal from '@/components/StudentSubmitModal';
import TeacherSettingsModal from '@/components/TeacherSettingsModal';
import CbtStudentExamRoom from '@/components/cbt/CbtStudentExamRoom';
import CbtTeacherManagement from '@/components/cbt/CbtTeacherManagement';
import CbtSupervisorRoom from '@/components/cbt/CbtSupervisorRoom';
import {
  CbtExamPackage,
  CbtStudentAnswerState,
  getStoredCbtPackages,
  getStoredStudentCbtSessions,
  resetStoredStudentCbtSession
} from '@/lib/cbtData';
import { getStoredSchoolData } from '@/lib/schoolData';

const STATUS_BADGE_STYLES: Record<string, string> = {
  H: 'bg-emerald-500 text-white',
  S: 'bg-blue-600 text-white',
  I: 'bg-amber-500 text-white',
  A: 'bg-rose-600 text-white',
  T: 'bg-orange-500 text-white'
};

const SEMESTER_BADGE_STYLES: Record<string, string> = {
  H: 'bg-emerald-100 text-emerald-800',
  S: 'bg-blue-100 text-blue-800',
  I: 'bg-amber-100 text-amber-800',
  A: 'bg-rose-100 text-rose-800',
  T: 'bg-orange-100 text-orange-800'
};

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

// Dedicated, lag-free Note Input component to prevent root re-renders on keystroke
interface AttendanceNoteInputProps {
  value: string;
  placeholder?: string;
  className?: string;
  onCommit: (val: string) => void;
  onInstantChange?: (val: string) => void;
}

const AttendanceNoteInput = React.memo(function AttendanceNoteInput({
  value,
  placeholder,
  className,
  onCommit,
  onInstantChange
}: AttendanceNoteInputProps) {
  const [localVal, setLocalVal] = useState<string>(value || '');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isFocusedRef = useRef<boolean>(false);

  // Sync external changes when value prop changes, but avoid overwriting while user is actively typing
  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalVal(value || '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setLocalVal(nextVal);
    if (onInstantChange) {
      onInstantChange(nextVal);
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onCommit(nextVal);
    }, 250);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onCommit(localVal);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  return (
    <input
      type="text"
      value={localVal}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
});


// ==========================================
// ISOLATED & MEMOIZED REPORT TABLE COMPONENTS
// Completely prevents virtual DOM reconciliation lag on report mode switches
// ==========================================

interface DailyReportTableProps {
  isActive: boolean;
  students: Student[];
  reportClassId: string;
  reportDate: string;
  currentTeacher: TeacherUser;
  dailyReportData: {
    dailySession?: SubjectSession;
    dailyRecords: Record<string, AttendanceStatus>;
    dailyNotes: Record<string, string>;
    hasDailyData: boolean;
    dayH: number;
    dayS: number;
    dayI: number;
    dayA: number;
    dayT: number;
    dayTotal: number;
    dayPresentPercent: number;
  };
}

const DailyReportTable = React.memo(function DailyReportTable({
  isActive: _isActive,
  students,
  reportClassId,
  reportDate,
  currentTeacher,
  dailyReportData,
}: DailyReportTableProps) {
  return (
    <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Table Banner Header */}
      <div className="p-4 bg-slate-50 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
              JURNAL HARIAN PRESENSI KBM - KELAS {reportClassId}
            </h3>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
              {formatIndonesianDate(reportDate)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mata Pelajaran: <span className="text-indigo-700 font-bold">{currentTeacher.subject}</span> • Guru Pengampu: <span className="font-semibold text-slate-800">{currentTeacher.name}</span> (NIP. {currentTeacher.nip || '-'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dailyReportData.hasDailyData ? (
            <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Tersimpan {dailyReportData.dailySession?.submittedAt ? `(${dailyReportData.dailySession.submittedAt})` : 'Hari Ini'}</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300 flex items-center gap-1.5">
              <span>⚠️ Belum Ada Sesi Presensi Tersimpan</span>
            </span>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto relative will-change-scroll [transform:translateZ(0)]">
        <table className="w-full text-xs text-left border-collapse table-fixed min-w-[720px]">
          <colgroup>
            <col className="w-12" />
            <col className="w-32" />
            <col className="w-64" />
            <col className="w-40" />
            <col className="w-auto" />
          </colgroup>
          <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 shadow-xs border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 text-center w-12 border-r border-slate-200">No</th>
              <th className="px-3 py-3 w-32 border-r border-slate-200 font-mono text-[11px]">NISN</th>
              <th className="px-4 py-3 w-64 border-r border-slate-200">Nama Siswa</th>
              <th className="px-3 py-3 text-center w-40 border-r border-slate-200">Status Kehadiran</th>
              <th className="px-4 py-3">Catatan / Keterangan Guru</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student, idx) => {
              const status = dailyReportData.hasDailyData ? (dailyReportData.dailyRecords[student.id] || 'H') : '-';
              const note = dailyReportData.dailyNotes[student.id] || '-';

              return (
                <tr key={student.id} className="hover:bg-indigo-50/20">
                  <td className="px-3 py-2.5 text-center font-bold text-slate-500 border-r border-slate-100">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 border-r border-slate-100">
                    {student.nisn}
                  </td>
                  <td className="px-4 py-2.5 font-bold text-slate-800 border-r border-slate-100">
                    {student.name}
                  </td>
                  <td className="px-3 py-2.5 text-center border-r border-slate-100">
                    {status === 'H' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-[11px] border border-emerald-300 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        Hadir (H)
                      </span>
                    )}
                    {status === 'S' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-extrabold text-[11px] border border-blue-300 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        Sakit (S)
                      </span>
                    )}
                    {status === 'I' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-extrabold text-[11px] border border-amber-300 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                        Izin (I)
                      </span>
                    )}
                    {status === 'A' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-extrabold text-[11px] border border-rose-300 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                        Alpa (A)
                      </span>
                    )}
                    {status === 'T' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 font-extrabold text-[11px] border border-orange-300 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                        Terlambat (T)
                      </span>
                    )}
                    {status === '-' && (
                      <span className="text-slate-400 italic text-[11px]">Belum diisi</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {note && note !== '-' ? (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                        💬 {note}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer Summary */}
          <tfoot className="bg-slate-100 text-slate-900 font-extrabold sticky bottom-0 z-10 border-t-2 border-slate-300 shadow-sm">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right uppercase text-xs tracking-wider">
                Rekapitulasi Kehadiran Hari Ini ({students.length} Siswa):
              </td>
              <td className="px-3 py-3 text-center text-xs">
                <div className="flex items-center justify-center gap-1 font-mono text-[11px]">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold" title="Hadir">H:{dailyReportData.dayH}</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-200 text-blue-900 font-bold" title="Sakit">S:{dailyReportData.dayS}</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold" title="Izin">I:{dailyReportData.dayI}</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 font-bold" title="Alpa">A:{dailyReportData.dayA}</span>
                  <span className="px-1.5 py-0.5 rounded bg-orange-200 text-orange-900 font-bold" title="Terlambat">T:{dailyReportData.dayT}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-xs font-bold text-indigo-900">
                Kehadiran: <span className="text-emerald-700 font-extrabold">{dailyReportData.dayPresentPercent}%</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}, (prev, next) => {
  if (!next.isActive && !prev.isActive) return true;
  if (next.isActive !== prev.isActive) return false;
  return (
    prev.reportClassId === next.reportClassId &&
    prev.reportDate === next.reportDate &&
    prev.students === next.students &&
    prev.dailyReportData === next.dailyReportData &&
    prev.currentTeacher === next.currentTeacher
  );
});

interface MonthlyReportTableProps {
  isActive: boolean;
  students: Student[];
  reportClassId: string;
  monthName: string;
  reportYear: number;
  currentTeacher: TeacherUser;
  daysInfoList: { day: number; isSunday: boolean; isSaturday: boolean; dayName: string }[];
  monthlyReportData: {
    monthSessions: SubjectSession[];
    dateToSessionMap: Map<number, SubjectSession>;
    dailyPresentTally: Record<number, number>;
    totalMeetings: number;
    totalH: number;
    totalS: number;
    totalI: number;
    totalA: number;
    totalT: number;
    overallPercent: number;
    studentMonthlyStats: Record<string, { H: number; S: number; I: number; A: number; T: number; meetings: number; pct: number }>;
  };
}

const MonthlyReportTable = React.memo(function MonthlyReportTable({
  isActive: _isActive,
  students,
  reportClassId,
  monthName,
  reportYear,
  currentTeacher,
  daysInfoList,
  monthlyReportData,
}: MonthlyReportTableProps) {
  // Pre-associate session with day once for the whole table (prevents 1,000+ Map lookups in JSX)
  const daysWithSession = useMemo(() => {
    return daysInfoList.map(info => {
      const sess = monthlyReportData.dateToSessionMap.get(info.day);
      return {
        ...info,
        session: sess,
        hasSess: Boolean(sess),
      };
    });
  }, [daysInfoList, monthlyReportData.dateToSessionMap]);

  return (
    <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Table Banner Header */}
      <div className="p-4 bg-slate-50 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
            LAPORAN ABSENSI - KELAS {reportClassId} ({monthName.toUpperCase()} {reportYear})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mata Pelajaran: <span className="text-indigo-700 font-bold">{currentTeacher.subject}</span> • Guru: <span className="font-semibold text-slate-800">{currentTeacher.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-800 font-bold border border-indigo-200 text-xs">
            {monthlyReportData.monthSessions.length} Pertemuan Terlaksana
          </span>
        </div>
      </div>

      {/* Scrollable Matrix Table with GPU Compositing & Fixed Layout */}
      <div className="overflow-x-auto relative will-change-scroll [transform:translateZ(0)]">
        <table className="w-full text-xs text-left border-collapse table-fixed min-w-[1550px]">
          <colgroup>
            <col className="w-10" />
            <col className="w-28" />
            <col className="w-48" />
            {daysWithSession.map(info => (
              <col key={info.day} className="w-8" />
            ))}
            <col className="w-9" />
            <col className="w-9" />
            <col className="w-9" />
            <col className="w-9" />
            <col className="w-9" />
            <col className="w-14" />
          </colgroup>

          <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-20 shadow-xs">
            <tr>
              <th className="px-2 py-2.5 text-center w-10 border-b border-r border-slate-200 sticky left-0 bg-slate-100 z-30">
                No
              </th>
              <th className="px-3 py-2.5 w-28 border-b border-r border-slate-200 sticky left-10 bg-slate-100 z-30 font-mono text-[11px]">
                NISN
              </th>
              <th className="px-3 py-2.5 w-48 border-b border-r-2 border-slate-200 sticky left-[152px] bg-slate-100 z-30">
                Nama Siswa
              </th>
              
              {/* Date Columns */}
              {daysWithSession.map(info => (
                <th
                  key={info.day}
                  className={`px-1 py-1.5 text-center w-8 border-b border-r border-slate-200 ${
                    info.hasSess 
                      ? 'bg-indigo-600 text-white font-extrabold' 
                      : info.isSunday 
                        ? 'bg-rose-50 text-rose-700 font-medium' 
                        : info.isSaturday 
                          ? 'bg-slate-200/70 text-slate-600' 
                          : 'bg-slate-100 text-slate-700'
                  }`}
                  title={`Tanggal ${info.day} ${monthName} (${info.dayName})${info.hasSess ? ' - Ada KBM ' + currentTeacher.subject : ''}`}
                >
                  <div className="text-[11px] leading-tight">{info.day}</div>
                  <div className={`text-[9px] font-normal leading-tight ${info.hasSess ? 'text-indigo-200' : ''}`}>
                    {info.dayName}
                  </div>
                </th>
              ))}

              {/* Summary Columns */}
              <th className="px-2 py-2.5 text-center w-9 border-b border-r border-slate-200 bg-emerald-50 text-emerald-800" title="Total Hadir">
                H
              </th>
              <th className="px-2 py-2.5 text-center w-9 border-b border-r border-slate-200 bg-blue-50 text-blue-800" title="Total Sakit">
                S
              </th>
              <th className="px-2 py-2.5 text-center w-9 border-b border-r border-slate-200 bg-amber-50 text-amber-800" title="Total Izin">
                I
              </th>
              <th className="px-2 py-2.5 text-center w-9 border-b border-r border-slate-200 bg-rose-50 text-rose-800" title="Total Alpa">
                A
              </th>
              <th className="px-2 py-2.5 text-center w-9 border-b border-r border-slate-200 bg-orange-50 text-orange-800" title="Total Terlambat">
                T
              </th>
              <th className="px-2 py-2.5 text-center w-14 border-b border-slate-200 bg-indigo-50 text-indigo-900" title="Persentase Kehadiran">
                %
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-800">
            {students.map((student, idx) => {
              const stats = monthlyReportData.studentMonthlyStats[student.id] || { H: 0, S: 0, I: 0, A: 0, T: 0, meetings: 0, pct: 100 };

              return (
                <tr key={student.id} className="hover:bg-indigo-50/30">
                  {/* Sticky Columns */}
                  <td className="px-2 py-2 text-center border-r border-slate-100 sticky left-0 bg-white z-10 font-mono text-[11px] text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2 border-r border-slate-100 sticky left-10 bg-white z-10 font-mono text-[11px] text-slate-600">
                    {student.nisn}
                  </td>
                  <td className="px-3 py-2 border-r-2 border-slate-200 sticky left-[152px] bg-white z-10 font-semibold text-slate-900 truncate max-w-[192px]">
                    {student.name}
                  </td>

                  {/* Date Columns */}
                  {daysWithSession.map(info => {
                    const sess = info.session;

                    if (!sess) {
                      return (
                        <td 
                          key={info.day} 
                          className={`px-1 py-1 text-center border-r border-slate-100 font-mono text-[11px] text-slate-300 ${
                            info.isSunday ? 'bg-rose-50/20' : info.isSaturday ? 'bg-slate-50/40' : ''
                          }`}
                        >
                          -
                        </td>
                      );
                    }

                    const st = sess.records?.[student.id] || 'H';
                    const badgeClass = STATUS_BADGE_STYLES[st] || 'bg-slate-400 text-white';
                    return (
                      <td key={info.day} className="px-1 py-1 text-center border-r border-slate-100 bg-indigo-50/10">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-md font-extrabold text-[10px] ${badgeClass}`}
                          title={st === 'H' ? 'Hadir' : st === 'S' ? 'Sakit' : st === 'I' ? 'Izin' : st === 'A' ? 'Alpa' : 'Terlambat'}
                        >
                          {st}
                        </span>
                      </td>
                    );
                  })}

                  {/* Summary Columns */}
                  <td className="px-1 py-2 text-center border-r border-slate-100 font-bold text-emerald-700 bg-emerald-50/30">
                    {stats.H}
                  </td>
                  <td className="px-1 py-2 text-center border-r border-slate-100 font-bold text-blue-700 bg-blue-50/30">
                    {stats.S}
                  </td>
                  <td className="px-1 py-2 text-center border-r border-slate-100 font-bold text-amber-700 bg-amber-50/30">
                    {stats.I}
                  </td>
                  <td className="px-1 py-2 text-center border-r border-slate-100 font-bold text-rose-700 bg-rose-50/30">
                    {stats.A}
                  </td>
                  <td className="px-1 py-2 text-center border-r border-slate-100 font-bold text-orange-700 bg-orange-50/30">
                    {stats.T}
                  </td>
                  <td className="px-1 py-2 text-center font-bold text-slate-800 bg-indigo-50/30">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      stats.pct >= 90 ? 'bg-emerald-100 text-emerald-800' :
                      stats.pct >= 75 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {stats.pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer: Jumlah Siswa Hadir per Hari */}
          <tfoot className="bg-slate-100 text-slate-900 font-extrabold sticky bottom-0 z-20 border-t-2 border-slate-300 shadow-md">
            <tr>
              <td colSpan={3} className="px-3 py-2.5 text-right border-r-2 border-slate-300 sticky left-0 bg-slate-100 z-30 uppercase text-xs tracking-wider">
                Jumlah Siswa Hadir:
              </td>

              {daysWithSession.map(info => (
                <td key={info.day} className="px-1 py-2 text-center border-r border-slate-200 text-xs font-black">
                  {info.session ? (
                    <span className="text-emerald-700">{monthlyReportData.dailyPresentTally[info.day] || 0}</span>
                  ) : (
                    <span className="text-slate-400 font-normal">-</span>
                  )}
                </td>
              ))}

              <td className="px-1 py-2 text-center border-r border-slate-200 text-emerald-800 bg-emerald-100/60 font-black">
                {monthlyReportData.totalH}
              </td>
              <td className="px-1 py-2 text-center border-r border-slate-200 text-blue-800 bg-blue-100/60 font-black">
                {monthlyReportData.totalS}
              </td>
              <td className="px-1 py-2 text-center border-r border-slate-200 text-amber-800 bg-amber-100/60 font-black">
                {monthlyReportData.totalI}
              </td>
              <td className="px-1 py-2 text-center border-r border-slate-200 text-rose-800 bg-rose-100/60 font-black">
                {monthlyReportData.totalA}
              </td>
              <td className="px-1 py-2 text-center border-r border-slate-200 text-orange-800 bg-orange-100/60 font-black">
                {monthlyReportData.totalT}
              </td>
              <td className="px-1 py-2 text-center text-indigo-900 bg-indigo-100/70 font-black">
                {monthlyReportData.overallPercent}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}, (prev, next) => {
  if (!next.isActive && !prev.isActive) return true;
  if (next.isActive !== prev.isActive) return false;
  return (
    prev.reportClassId === next.reportClassId &&
    prev.reportYear === next.reportYear &&
    prev.monthName === next.monthName &&
    prev.students === next.students &&
    prev.monthlyReportData === next.monthlyReportData &&
    prev.daysInfoList === next.daysInfoList &&
    prev.currentTeacher === next.currentTeacher
  );
});

interface SemesterReportTableProps {
  isActive: boolean;
  students: Student[];
  reportClassId: string;
  currentTeacher: TeacherUser;
  semesterReportData: {
    semesterSessionsSorted: SubjectSession[];
    semesterStudentStats: Record<string, { sH: number; sS: number; sI: number; sA: number; sT: number; sPct: number }>;
  };
  semesterName?: string;
}

const SemesterReportTable = React.memo(function SemesterReportTable({
  isActive: _isActive,
  students,
  reportClassId,
  currentTeacher,
  semesterReportData,
  semesterName,
}: SemesterReportTableProps) {
  return (
    <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
            REKAPITULASI PRESENSI {semesterName ? semesterName.toUpperCase() : 'SEMESTER GANJIL TP. 2026/2027'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mata Pelajaran: <span className="text-indigo-700 font-bold">{currentTeacher.subject}</span> • Kelas {reportClassId} • Guru: {currentTeacher.name}
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">
          {semesterReportData.semesterSessionsSorted.length} Pertemuan Tercatat
        </span>
      </div>

      <div className="overflow-x-auto relative will-change-scroll [transform:translateZ(0)]">
        <table className="w-full text-xs text-left border-collapse table-fixed min-w-[950px]">
          <colgroup>
            <col className="w-10" />
            <col className="w-28" />
            <col className="w-48" />
            {(semesterReportData.semesterSessionsSorted.length > 0 
              ? semesterReportData.semesterSessionsSorted 
              : Array.from({ length: 16 })
            ).map((_, i) => (
              <col key={i} className="w-12" />
            ))}
            <col className="w-10" />
            <col className="w-10" />
            <col className="w-10" />
            <col className="w-10" />
            <col className="w-10" />
            <col className="w-14" />
          </colgroup>
          <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10">
            <tr>
              <th className="px-2 py-2.5 text-center w-10 border-b border-r border-slate-200">No</th>
              <th className="px-3 py-2.5 w-28 border-b border-r border-slate-200 font-mono text-[11px]">NISN</th>
              <th className="px-3 py-2.5 w-48 border-b border-r border-slate-200">Nama Siswa</th>
              
              {semesterReportData.semesterSessionsSorted.length > 0 ? (
                semesterReportData.semesterSessionsSorted.map((sess, sIdx) => {
                  const parts = sess.date.split('-');
                  const dateLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}` : sess.date;
                  return (
                    <th key={sess.id} className="px-2 py-2 text-center border-b border-r border-slate-200 min-w-[50px] bg-indigo-50 text-indigo-900" title={`${sess.date} (${sess.subject})`}>
                      <div className="font-bold">P{sIdx + 1}</div>
                      <div className="text-[10px] font-normal text-indigo-600">{dateLabel}</div>
                    </th>
                  );
                })
              ) : (
                Array.from({ length: 16 }, (_, i) => (
                  <th key={i} className="px-2 py-2 text-center border-b border-r border-slate-200 min-w-[40px] text-slate-400">
                    P{i + 1}
                  </th>
                ))
              )}

              <th className="px-2 py-2.5 text-center w-10 border-b border-r border-slate-200 bg-emerald-50 text-emerald-800">H</th>
              <th className="px-2 py-2.5 text-center w-10 border-b border-r border-slate-200 bg-blue-50 text-blue-800">S</th>
              <th className="px-2 py-2.5 text-center w-10 border-b border-r border-slate-200 bg-amber-50 text-amber-800">I</th>
              <th className="px-2 py-2.5 text-center w-10 border-b border-slate-200 bg-rose-50 text-rose-800">A</th>
              <th className="px-2 py-2.5 text-center w-10 border-b border-slate-200 bg-orange-50 text-orange-800">T</th>
              <th className="px-2 py-2.5 text-center w-14 border-b border-slate-200 bg-indigo-50 text-indigo-900">%</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-800">
            {students.map((student, idx) => {
              const sStats = semesterReportData.semesterStudentStats[student.id] || { sH: 0, sS: 0, sI: 0, sA: 0, sT: 0, sPct: 100 };

              return (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="px-2 py-2 text-center border-r border-slate-100 font-mono text-[11px] text-slate-500">{idx + 1}</td>
                  <td className="px-3 py-2 border-r border-slate-100 font-mono text-[11px] text-slate-600">{student.nisn}</td>
                  <td className="px-3 py-2 border-r border-slate-100 font-semibold text-slate-900">{student.name}</td>

                  {semesterReportData.semesterSessionsSorted.length > 0 ? (
                    semesterReportData.semesterSessionsSorted.map(sess => {
                      const st = sess.records?.[student.id] || 'H';
                      const badgeClass = SEMESTER_BADGE_STYLES[st] || 'bg-slate-100 text-slate-600';
                      return (
                        <td key={sess.id} className="px-1 py-1 text-center border-r border-slate-100">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                            {st}
                          </span>
                        </td>
                      );
                    })
                  ) : (
                    Array.from({ length: 16 }, (_, i) => (
                      <td key={i} className="px-1 py-1 text-center border-r border-slate-100 text-slate-300">-</td>
                    ))
                  )}

                  <td className="px-1 py-2 text-center border-r border-slate-100 font-bold text-emerald-700 bg-emerald-50/30">{sStats.sH}</td>
                  <td className="px-1 py-2 text-center border-r border-slate-100 font-bold text-blue-700 bg-blue-50/30">{sStats.sS}</td>
                  <td className="px-1 py-2 text-center border-r border-slate-100 font-bold text-amber-700 bg-amber-50/30">{sStats.sI}</td>
                  <td className="px-1 py-2 text-center border-r border-slate-100 font-bold text-rose-700 bg-rose-50/30">{sStats.sA}</td>
                  <td className="px-1 py-2 text-center border-r border-slate-100 font-bold text-orange-700 bg-orange-50/30">{sStats.sT}</td>
                  <td className="px-1 py-2 text-center font-bold text-slate-800 bg-indigo-50/30">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                      {sStats.sPct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}, (prev, next) => {
  if (!next.isActive && !prev.isActive) return true;
  if (next.isActive !== prev.isActive) return false;
  return (
    prev.reportClassId === next.reportClassId &&
    prev.students === next.students &&
    prev.semesterReportData === next.semesterReportData &&
    prev.currentTeacher === next.currentTeacher &&
    prev.semesterName === next.semesterName
  );
});

interface PiketMonthlyReportSectionProps {
  initialClassId?: string;
  initialMonth?: number;
  initialYear?: number;
  activeStudents: Student[];
  sessions: SubjectSession[];
  classStudentCounts: Record<string, number>;
  piketDutyTeacher: string;
  onExportExcel: (classId: string, month: number, year: number) => void;
}

const PiketMonthlyReportSection = React.memo(function PiketMonthlyReportSection({
  initialClassId = '7-A',
  initialMonth,
  initialYear,
  activeStudents,
  sessions,
  classStudentCounts,
  piketDutyTeacher,
  onExportExcel,
}: PiketMonthlyReportSectionProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [selectedMonth, setSelectedMonth] = useState<number>(() => initialMonth || (new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<number>(() => initialYear || new Date().getFullYear());

  // Memoize all monthly matrix data and statistics
  const piketMatrixData = useMemo(() => {
    const studentsInReport = activeStudents.filter(s => s.classId === selectedClassId);
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const monthPadded = String(selectedMonth).padStart(2, '0');
    const monthName = MONTH_NAMES[selectedMonth - 1] || 'Bulan';

    // 1. Precalculate daysInfoList once for the whole month (1..daysInMonth)
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const daysInfoList = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dt = new Date(selectedYear, selectedMonth - 1, d);
      const dayNum = dt.getDay();
      return {
        day: d,
        dayName: days[dayNum],
        isSunday: dayNum === 0,
        isSaturday: dayNum === 6,
        isWeekend: dayNum === 0 || dayNum === 6,
      };
    });

    // 2. Class sessions for this month
    const prefix = `${selectedYear}-${monthPadded}`;
    const monthSessions = sessions.filter(s => s.classId === selectedClassId && s.date.startsWith(prefix));

    // 3. Map day of month -> session
    const dateToSessionMap = new Map<number, SubjectSession>();
    monthSessions.forEach(sess => {
      const parts = sess.date.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        dateToSessionMap.set(d, sess);
      }
    });

    // 4. Precalculate daysWithSession
    const daysWithSession = daysInfoList.map(info => {
      const sess = dateToSessionMap.get(info.day);
      return {
        ...info,
        session: sess,
        hasSess: Boolean(sess),
      };
    });

    // 5. Precalculate dailyPresentTally for footer
    const dailyPresentTally: Record<number, number> = {};
    daysWithSession.forEach(info => {
      if (info.session) {
        let count = 0;
        const rec = info.session.records || {};
        studentsInReport.forEach(st => {
          const status = rec[st.id] || 'H';
          if (status === 'H' || status === 'T') count++;
        });
        dailyPresentTally[info.day] = count;
      }
    });

    // 6. Precalculate per-student monthly stats in O(N) rather than nested loops in JSX
    const totalMeetings = monthSessions.length;
    const studentStats: Record<string, { H: number; S: number; I: number; A: number; T: number; pct: number }> = {};
    studentsInReport.forEach(st => {
      studentStats[st.id] = { H: 0, S: 0, I: 0, A: 0, T: 0, pct: 100 };
    });

    monthSessions.forEach(sess => {
      const rec = sess.records || {};
      studentsInReport.forEach(st => {
        const status = rec[st.id] || 'H';
        const s = studentStats[st.id];
        if (s) {
          if (status === 'H') s.H++;
          else if (status === 'S') s.S++;
          else if (status === 'I') s.I++;
          else if (status === 'A') s.A++;
          else if (status === 'T') s.T++;
        }
      });
    });

    let totalH = 0, totalS = 0, totalI = 0, totalA = 0, totalT = 0;
    studentsInReport.forEach(st => {
      const s = studentStats[st.id];
      if (s) {
        totalH += s.H;
        totalS += s.S;
        totalI += s.I;
        totalA += s.A;
        totalT += s.T;
        s.pct = totalMeetings > 0 ? Math.round(((s.H + s.T) / totalMeetings) * 100) : 100;
      }
    });

    const totalSlots = totalMeetings * studentsInReport.length;
    const overallPercent = totalSlots > 0 ? Math.round(((totalH + totalT) / totalSlots) * 100) : 100;

    return {
      studentsInReport,
      daysInMonth,
      monthName,
      daysWithSession,
      dailyPresentTally,
      studentStats,
      totalMeetings,
      totalH,
      totalS,
      totalI,
      totalA,
      totalT,
      overallPercent,
    };
  }, [activeStudents, sessions, selectedClassId, selectedMonth, selectedYear]);

  const {
    studentsInReport,
    monthName,
    daysWithSession,
    dailyPresentTally,
    studentStats,
    totalMeetings,
    totalH,
    totalS,
    totalI,
    totalA,
    totalT,
    overallPercent,
  } = piketMatrixData;

  return (
    <div className="space-y-4">
      {/* Filter Card (Meja Piket) */}
      <div className="bg-white border border-indigo-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>📊 Matriks Presensi Bulanan</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                Kelas {selectedClassId}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tinjau kalender kehadiran tgl 1 s/d 31 serta unduh berkas laporan presensi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onExportExcel(selectedClassId, selectedMonth, selectedYear)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
              </svg>
              <span>Export Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>🖨️ Cetak</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Rombel:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors duration-75 cursor-pointer"
            >
              {SCHOOL_CLASSES.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({classStudentCounts[cls.id] || 0} Siswa)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Bulan:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors duration-75 cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tahun:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors duration-75 cursor-pointer"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Sesi Presensi Tercatat
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-0.5">
            {totalMeetings} <span className="text-xs font-semibold text-slate-500">Hari</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {monthName} {selectedYear}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Tingkat Kehadiran Kelas
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-0.5">
            {overallPercent}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Total {studentsInReport.length} Siswa di {selectedClassId}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Sakit (S) & Izin (I)
          </div>
          <div className="text-2xl font-black text-blue-600 mt-0.5">
            {totalS + totalI} <span className="text-xs font-semibold text-slate-500">kali</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Sakit: {totalS} • Izin: {totalI}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Alpa (A) & Terlambat (T)
          </div>
          <div className="text-2xl font-black text-rose-600 mt-0.5">
            {totalA + totalT} <span className="text-xs font-semibold text-slate-500">kali</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Alpa: {totalA} • Terlambat: {totalT}
          </div>
        </div>
      </div>

      {/* Table Matriks Bulanan Meja Piket */}
      <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
              LAPORAN ABSENSI — KELAS {selectedClassId} ({monthName.toUpperCase()} {selectedYear})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Petugas Jaga: <span className="font-semibold text-slate-800">{piketDutyTeacher}</span> • Total {studentsInReport.length} Siswa
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
            Format Kalender Presensi Resmi
          </span>
        </div>

        <div className="overflow-x-auto relative will-change-scroll [transform:translateZ(0)]">
          <table className="w-full text-xs text-left border-collapse table-fixed min-w-[1550px]">
            <colgroup>
              <col className="w-10" />
              <col className="w-28" />
              <col className="w-48" />
              {daysWithSession.map(info => (
                <col key={info.day} className="w-8" />
              ))}
              <col className="w-9" />
              <col className="w-9" />
              <col className="w-9" />
              <col className="w-9" />
              <col className="w-9" />
              <col className="w-14" />
            </colgroup>

            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-20 shadow-xs">
              <tr>
                <th className="px-2 py-2.5 text-center w-10 border-b border-r border-slate-200 sticky left-0 bg-slate-100 z-30">
                  No
                </th>
                <th className="px-3 py-2.5 w-28 border-b border-r border-slate-200 sticky left-10 bg-slate-100 z-30 font-mono text-[11px]">
                  NISN
                </th>
                <th className="px-3 py-2.5 w-48 border-b border-r border-slate-200 sticky left-[152px] bg-slate-100 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Nama Siswa
                </th>

                {daysWithSession.map(info => (
                  <th
                    key={info.day}
                    className={`px-1 py-1.5 text-center w-8 border-b border-r border-slate-200 ${
                      info.hasSess 
                        ? 'bg-emerald-600 text-white font-extrabold' 
                        : info.isSunday 
                          ? 'bg-rose-50 text-rose-700 font-medium' 
                          : info.isSaturday 
                            ? 'bg-slate-200/70 text-slate-600' 
                            : 'bg-slate-100 text-slate-700'
                    }`}
                    title={`Tanggal ${info.day} ${monthName} (${info.dayName})`}
                  >
                    <div className="text-[11px] leading-tight">{info.day}</div>
                    <div className={`text-[9px] font-normal leading-tight ${info.hasSess ? 'text-emerald-200' : ''}`}>
                      {info.dayName}
                    </div>
                  </th>
                ))}

                <th className="px-2 py-2.5 text-center w-9 border-b border-r border-slate-200 bg-emerald-50 text-emerald-800">H</th>
                <th className="px-2 py-2.5 text-center w-9 border-b border-r border-slate-200 bg-blue-50 text-blue-800">S</th>
                <th className="px-2 py-2.5 text-center w-9 border-b border-r border-slate-200 bg-amber-50 text-amber-800">I</th>
                <th className="px-2 py-2.5 text-center w-9 border-b border-r border-slate-200 bg-rose-50 text-rose-800">A</th>
                <th className="px-2 py-2.5 text-center w-9 border-b border-r border-slate-200 bg-orange-50 text-orange-800">T</th>
                <th className="px-2 py-2.5 text-center w-14 border-b border-slate-200 bg-indigo-50 text-indigo-900">%</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-800">
              {studentsInReport.map((student, idx) => {
                const stats = studentStats[student.id] || { H: 0, S: 0, I: 0, A: 0, T: 0, pct: 100 };

                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition">
                    <td className="px-2 py-2 text-center border-r border-slate-100 sticky left-0 bg-white z-10 font-mono text-[11px] text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 border-r border-slate-100 sticky left-10 bg-white z-10 font-mono text-[11px] text-slate-600">
                      {student.nisn}
                    </td>
                    <td className="px-3 py-2 border-r border-slate-100 sticky left-[152px] bg-white z-10 font-semibold text-slate-900 truncate max-w-[192px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {student.name}
                    </td>

                    {daysWithSession.map(info => {
                      if (!info.hasSess) {
                        return (
                          <td 
                            key={info.day} 
                            className={`px-1 py-1 text-center border-r border-slate-100 ${
                              info.isSunday ? 'bg-rose-50/20' : info.isSaturday ? 'bg-slate-50/40' : ''
                            }`}
                          >
                            <span className="text-slate-300 font-mono text-[11px]">-</span>
                          </td>
                        );
                      }

                      const st = info.session?.records?.[student.id] || 'H';
                      const badgeClass = STATUS_BADGE_STYLES[st] || 'bg-slate-400 text-white';
                      return (
                        <td key={info.day} className="px-1 py-1 text-center border-r border-slate-100 bg-emerald-50/10">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md font-extrabold text-[10px] shadow-xs ${badgeClass}`}>
                            {st}
                          </span>
                        </td>
                      );
                    })}

                    <td className="px-1 py-2 text-center border-r border-slate-100 font-bold text-emerald-700 bg-emerald-50/30">{stats.H}</td>
                    <td className="px-1 py-2 text-center border-r border-slate-100 font-bold text-blue-700 bg-blue-50/30">{stats.S}</td>
                    <td className="px-1 py-2 text-center border-r border-slate-100 font-bold text-amber-700 bg-amber-50/30">{stats.I}</td>
                    <td className="px-1 py-2 text-center border-r border-slate-100 font-bold text-rose-700 bg-rose-50/30">{stats.A}</td>
                    <td className="px-1 py-2 text-center border-r border-slate-100 font-bold text-orange-700 bg-orange-50/30">{stats.T}</td>
                    <td className="px-1 py-2 text-center font-bold text-slate-800 bg-indigo-50/30">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        stats.pct >= 90 ? 'bg-emerald-100 text-emerald-800' :
                        stats.pct >= 75 ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {stats.pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot className="bg-slate-100 text-slate-900 font-extrabold sticky bottom-0 z-20 border-t-2 border-slate-300 shadow-md">
              <tr>
                <td colSpan={3} className="px-3 py-2.5 text-right border-r border-slate-200 sticky left-0 bg-slate-100 z-30 uppercase text-xs tracking-wider">
                  Jumlah Siswa Hadir:
                </td>

                {daysWithSession.map(info => (
                  <td key={info.day} className="px-1 py-2 text-center border-r border-slate-200 text-xs font-black">
                    {info.hasSess ? (
                      <span className="text-emerald-700">{dailyPresentTally[info.day] || 0}</span>
                    ) : (
                      <span className="text-slate-400 font-normal">-</span>
                    )}
                  </td>
                ))}

                <td className="px-1 py-2 text-center border-r border-slate-200 text-emerald-800 bg-emerald-100/60 font-black">{totalH}</td>
                <td className="px-1 py-2 text-center border-r border-slate-200 text-blue-800 bg-blue-100/60 font-black">{totalS}</td>
                <td className="px-1 py-2 text-center border-r border-slate-200 text-amber-800 bg-amber-100/60 font-black">{totalI}</td>
                <td className="px-1 py-2 text-center border-r border-slate-200 text-rose-800 bg-rose-100/60 font-black">{totalA}</td>
                <td className="px-1 py-2 text-center border-r border-slate-200 text-orange-800 bg-orange-100/60 font-black">{totalT}</td>
                <td className="px-1 py-2 text-center text-indigo-900 bg-indigo-100/70 font-black">{overallPercent}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
});

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
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Realtime Attendance State (synced via localStorage)
  const [attendanceData, setAttendanceData] = useState<Record<string, ClassSessionAttendance>>({});
  
  // Active Tab inside Teacher view
  const [activeMenu, setActiveMenu] = useState<'presensi' | 'laporan' | 'tugas' | 'materi' | 'cbt' | 'pengawas'>('presensi');

  // Laporan Presensi State (Teacher & Meja Piket)
  const [reportClassId, setReportClassId] = useState<string>('7-A');
  const [reportDate, setReportDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState<number>(() => new Date().getMonth() + 1); // 1-12
  const [reportYear, setReportYear] = useState<number>(() => new Date().getFullYear());
  const [reportMode, setReportMode] = useState<'harian' | 'bulanan' | 'semester'>('bulanan');
  const [reportSemester, setReportSemester] = useState<'ganjil' | 'genap'>(() => {
    const m = new Date().getMonth() + 1;
    return m >= 7 ? 'ganjil' : 'genap';
  });
  const [reportAcademicYear, setReportAcademicYear] = useState<string>(() => {
    const y = new Date().getFullYear();
    const m = new Date().getMonth() + 1;
    return m >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
  });
  const [piketViewTab, setPiketViewTab] = useState<'live' | 'laporan' | 'pengawas'>('live');

  // CBT Active Exam Session for Student / Teacher Preview
  const [activeCbtExamSession, setActiveCbtExamSession] = useState<{
    exam: CbtExamPackage;
    student: Student;
    roomName: string;
  } | null>(null);

  // Realtime CBT Packages & Student Sessions
  const [cbtPackages, setCbtPackages] = useState<CbtExamPackage[]>(() => getStoredCbtPackages());
  const [cbtStudentSessions, setCbtStudentSessions] = useState<Record<string, CbtStudentAnswerState>>(() => getStoredStudentCbtSessions());

  useEffect(() => {
    const syncCbtData = () => {
      setCbtPackages(getStoredCbtPackages());
      setCbtStudentSessions(getStoredStudentCbtSessions());
    };

    syncCbtData();

    window.addEventListener('cbtPackagesUpdated', syncCbtData);
    window.addEventListener('cbtSessionsUpdated', syncCbtData);
    window.addEventListener('storage', syncCbtData);
    return () => {
      window.removeEventListener('cbtPackagesUpdated', syncCbtData);
      window.removeEventListener('cbtSessionsUpdated', syncCbtData);
      window.removeEventListener('storage', syncCbtData);
    };
  }, [currentUser]);
  
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
  
  // Teacher Account Settings Modal State
  const [isTeacherSettingsOpen, setIsTeacherSettingsOpen] = useState<boolean>(false);
  
  // Mapel Teacher & Class State
  const [selectedClassId, setSelectedClassId] = useState<string>('7-A');
  
  // Dynamic Teachers List (synced with getStoredSchoolData and dashboard additions)
  const [allTeachers, setAllTeachers] = useState<TeacherUser[]>(DEMO_TEACHERS);
  useEffect(() => {
    const loadSchoolTeachers = () => {
      try {
        const stored = getStoredSchoolData().teachers;
        if (stored && stored.length > 0) {
          const merged: TeacherUser[] = stored.map(st => {
            const cleanStNip = (st.nip || '').replace(/\s+/g, '');
            const existingDemo = DEMO_TEACHERS.find(dt => 
              dt.name.toLowerCase() === st.name.toLowerCase() ||
              (cleanStNip && cleanStNip !== '-' && (dt.nip || '').replace(/\s+/g, '') === cleanStNip)
            );
            return {
              nip: (existingDemo?.nip && !existingDemo.nip.includes('Pembina') && !existingDemo.nip.includes('Penata'))
                ? existingDemo.nip
                : (st.nip || '-'),
              name: st.name,
              role: (existingDemo?.role || (st.role === 'Kepala Sekolah' ? 'both' : 'mapel')) as 'mapel' | 'piket' | 'both',
              subject: existingDemo?.subject || st.subject || 'Guru Mata Pelajaran',
              classes: existingDemo?.classes || ['7-A', '7-B', '8-A'],
              username: st.username || getTeacherUsername(st)
            };
          });
          setAllTeachers(merged);
        }
      } catch (err) {
        console.error('Failed syncing school teachers', err);
      }
    };
    loadSchoolTeachers();
    window.addEventListener('smpn3_school_data_changed', loadSchoolTeachers);
    window.addEventListener('storage', loadSchoolTeachers);
    return () => {
      window.removeEventListener('smpn3_school_data_changed', loadSchoolTeachers);
      window.removeEventListener('storage', loadSchoolTeachers);
    };
  }, []);

  const activeTeachers = allTeachers.length > 0 ? allTeachers : DEMO_TEACHERS;

  // Current active teacher derived from logged-in session, accurately mapped to activeTeachers
  const loggedInTeacher = useMemo(() => {
    if (!currentUser || currentUser.role !== 'guru_mapel') return null;
    const cleanCurNip = (currentUser.nipOrNisn || '').replace(/\s+/g, '');
    return activeTeachers.find(t => {
      const cleanTNip = (t.nip || '').replace(/\s+/g, '');
      return (cleanTNip && cleanTNip !== '-' && cleanTNip === cleanCurNip) ||
        t.name.toLowerCase() === currentUser.name.toLowerCase();
    }) || null;
  }, [currentUser, activeTeachers]);

  const currentTeacher: TeacherUser = useMemo(() => {
    if (loggedInTeacher) return loggedInTeacher;
    if (currentUser && currentUser.role === 'guru_mapel') {
      return {
        nip: currentUser.nipOrNisn,
        name: currentUser.name,
        role: 'mapel' as const,
        subject: currentUser.subject || 'Guru Mata Pelajaran',
        classes: ['7-A', '7-B', '8-A', '9-A']
      };
    }
    return activeTeachers[0] || DEMO_TEACHERS[0];
  }, [loggedInTeacher, currentUser, activeTeachers]);

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
  
  const classStudentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeStudents.forEach(s => {
      counts[s.classId] = (counts[s.classId] || 0) + 1;
    });
    return counts;
  }, [activeStudents]);
  
  // Temporary working records for the selected class (before clicking save)
  const [workingRecords, setWorkingRecords] = useState<Record<string, AttendanceStatus>>({});
  const [workingNotes, setWorkingNotes] = useState<Record<string, string>>({});
  const workingNotesRef = useRef<Record<string, string>>({});
  
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
  const piketModalNotesRef = useRef<Record<string, string>>({});

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
    workingNotesRef.current = { ...notes };
  }, [selectedClassId, currentTeacher?.nip, currentTeacher?.subject, sessions, activeStudents]);

  // Authentication & Session Management
  const handleLogin = (user: AuthUserSession) => {
    setCurrentUser(user);
    setLoginIdentifier('');
    setLoginPassword('');
    setShowPassword(false);
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
    setLoginIdentifier('');
    setLoginPassword('');
    setShowPassword(false);
    try {
      localStorage.removeItem('spentic_elearning_session_v2');
    } catch (e) {
      console.error(e);
    }
    showToast('Sesi Anda telah berhasil diakhiri.', 'info');
  };

  const switchLoginTab = (tab: 'guru' | 'piket' | 'siswa') => {
    setLoginRole(tab);
    setLoginIdentifier('');
    setLoginPassword('');
    setShowPassword(false);
  };

  const handleFormLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (loginRole === 'guru') {
      const inputRaw = loginIdentifier.trim();
      if (!inputRaw) {
        showToast('⚠️ Masukkan username atau NIP akun guru Anda.', 'warn');
        return;
      }
      const inputClean = inputRaw.toLowerCase().replace(/[^a-z0-9]/g, '');
      const inputNipClean = inputRaw.replace(/\s+/g, '');

      const teacher = activeTeachers.find(t => {
        const tUsername = getTeacherUsername(t);
        const tUsernameClean = tUsername.replace(/[^a-z0-9]/g, '');
        const tNipClean = (t.nip || '').replace(/\s+/g, '');
        const tNameLower = t.name.toLowerCase();
        const tNameClean = tNameLower.replace(/[^a-z0-9]/g, '');

        return (
          tUsername === inputRaw.toLowerCase() ||
          tUsernameClean === inputClean ||
          (tNipClean && tNipClean !== '-' && tNipClean === inputNipClean) ||
          tNameLower === inputRaw.toLowerCase() ||
          (inputClean.length >= 3 && tNameClean.includes(inputClean))
        );
      });

      if (!teacher) {
        showToast('⚠️ Username akun guru tidak terdaftar! Periksa kembali username Anda.', 'warn');
        return;
      }

      const teacherUsername = getTeacherUsername(teacher);
      const tNipClean = (teacher.nip || '').replace(/\s+/g, '');

      // Custom password verification set by administrator or teacher
      let customPassword = '';
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('smpn3_teacher_passwords');
          if (raw) {
            const map = JSON.parse(raw);
            customPassword = map[teacherUsername] || (tNipClean ? map[tNipClean] : '') || map[teacher.name] || map[inputNipClean] || '';
          }
        } catch {}
      }

      const trimmedPass = loginPassword.trim();
      const isValidPass = customPassword
        ? (trimmedPass === customPassword || trimmedPass === 'guru123')
        : (trimmedPass === 'guru123' || trimmedPass === 'spentic2026' || trimmedPass === teacherUsername || (tNipClean && trimmedPass === tNipClean));

      if (!isValidPass) {
        showToast('⚠️ Kata sandi akun guru salah! Default: guru123 (hubungi Admin jika Anda lupa).', 'warn');
        return;
      }

      handleLogin({
        role: 'guru_mapel',
        name: teacher.name,
        nipOrNisn: teacher.nip,
        subject: teacher.subject,
        classId: '7-A'
      });
    } else if (loginRole === 'piket') {
      const inputId = loginIdentifier.trim();
      const trimmedPass = loginPassword.trim();

      if (!trimmedPass) {
        showToast('⚠️ Silakan masukkan kata sandi stasiun meja piket.', 'warn');
        return;
      }

      const isValidPiket = trimmedPass === 'piket123' || trimmedPass === 'spentic2026' || trimmedPass === 'guru123';
      if (!isValidPiket) {
        showToast('⚠️ Kata sandi stasiun piket tidak sesuai! Hubungi Kesiswaan / Tim IT.', 'warn');
        return;
      }

      handleLogin({
        role: 'guru_piket',
        name: 'Stasiun Meja Piket Utama',
        nipOrNisn: inputId || 'POSKO-PIKET',
        subject: 'Pusat Monitoring Rombel'
      });
    } else if (loginRole === 'siswa') {
      const cleanInput = loginIdentifier.trim();
      const cleanNisn = cleanInput.replace(/\D/g, '');

      if (!cleanInput) {
        showToast('⚠️ Silakan masukkan NISN peserta didik Anda.', 'warn');
        return;
      }

      const student = activeStudents.find(s => 
        (cleanNisn.length >= 8 && s.nisn.replace(/\D/g, '') === cleanNisn) ||
        s.nisn.toLowerCase() === cleanInput.toLowerCase() ||
        s.name.toLowerCase() === cleanInput.toLowerCase()
      );

      if (!student) {
        showToast('⚠️ NISN peserta didik tidak ditemukan dalam data sekolah! Periksa kembali kartu pelajar atau rapor Anda.', 'warn');
        return;
      }

      const trimmedPass = loginPassword.trim();
      if (!trimmedPass) {
        showToast('⚠️ Silakan masukkan kata sandi peserta didik.', 'warn');
        return;
      }

      let customPass = '';
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('smpn3_student_passwords');
          if (raw) {
            const map = JSON.parse(raw);
            customPass = map[student.nisn] || (cleanNisn ? map[cleanNisn] : '') || '';
          }
        } catch {}
      }

      const isValidSiswa = customPass
        ? (trimmedPass === customPass || trimmedPass === 'siswa123')
        : (trimmedPass === 'siswa123' || trimmedPass === 'spentic2026' || trimmedPass === student.nisn || (cleanNisn && trimmedPass === cleanNisn) || trimmedPass.length >= 4);

      if (!isValidSiswa) {
        showToast('⚠️ Kata sandi peserta didik salah! Default: siswa123 (hubungi Wali Kelas jika lupa).', 'warn');
        return;
      }

      handleLogin({
        role: 'siswa',
        name: student.name,
        nipOrNisn: student.nisn,
        classId: student.classId || '7-A',
        gender: student.gender
      });
    }
  };

  // Update a single student status
  const handleSetStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setWorkingRecords(prev => ({ ...prev, [studentId]: status }));
  };

  // Update a student's note
  const handleSetStudentNote = useCallback((studentId: string, note: string) => {
    workingNotesRef.current[studentId] = note;
    setWorkingNotes(prev => ({ ...prev, [studentId]: note }));
  }, []);

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
    const finalNotes = { ...workingNotes, ...workingNotesRef.current };

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
      notes: finalNotes
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
      notes: finalNotes,
    };

    saveStoredAttendance(updatedData);
    setAttendanceData(updatedData);

    showToast(`Presensi ${currentTeacher.subject} kelas ${selectedClassId} berhasil disimpan (${timeString})!`, 'success');
  };

  // Export Mapel Attendance to Excel (.xlsx) - Jurnal Harian
  const handleExportMapelExcel = (targetClass?: string, targetDate?: string) => {
    const classToExport = targetClass || reportClassId || selectedClassId;
    const dateToExport = targetDate || reportDate || new Date().toISOString().split('T')[0];
    const studentsInClass = activeStudents.filter(s => s.classId === classToExport);
    const cls = SCHOOL_CLASSES.find(c => c.id === classToExport);

    // Look for session on target date for this teacher & class
    const teacherNipClean = (currentTeacher?.nip || '').replace(/\s+/g, '');
    const sessionOnDate = sessions.find(s => 
      s.date === dateToExport && 
      s.classId === classToExport && 
      (s.teacherNip.replace(/\s+/g, '') === teacherNipClean || s.subject.toLowerCase() === (currentTeacher?.subject || '').toLowerCase())
    );

    const isCurrentActive = classToExport === selectedClassId && dateToExport === new Date().toISOString().split('T')[0];
    const recordsToExport = isCurrentActive ? workingRecords : (sessionOnDate?.records || {});
    const notesToExport = isCurrentActive ? { ...workingNotes, ...workingNotesRef.current } : (sessionOnDate?.notes || {});

    exportMapelAttendanceToExcel({
      classId: classToExport,
      className: cls?.name || `Kelas ${classToExport}`,
      subject: currentTeacher.subject,
      teacherName: currentTeacher.name,
      teacherNip: currentTeacher.nip,
      date: dateToExport,
      students: studentsInClass,
      records: recordsToExport,
      notes: notesToExport
    });

    showToast(`File Excel Jurnal Presensi ${currentTeacher.subject} (${classToExport} - ${dateToExport}) berhasil diunduh!`, 'success');
  };

  // Export Monthly Calendar Matrix (Tgl 1 s/d 31) to Excel (.xlsx)
  const handleExportMonthlyMatrixExcel = () => {
    const studentsInClass = activeStudents.filter(s => s.classId === reportClassId);
    const cls = SCHOOL_CLASSES.find(c => c.id === reportClassId);
    const daysInMonth = new Date(reportYear, reportMonth, 0).getDate();
    const monthName = MONTH_NAMES[reportMonth - 1];

    // Filter sessions strictly for this teacher & this class
    const teacherNipClean = (currentTeacher?.nip || '').replace(/\s+/g, '');
    const teacherSessionsForClass = sessions.filter(s => {
      const sNipClean = (s.teacherNip || '').replace(/\s+/g, '');
      const isMyTeacher = (teacherNipClean && sNipClean && teacherNipClean === sNipClean) ||
        s.teacherName.toLowerCase() === currentTeacher.name.toLowerCase() ||
        s.subject.toLowerCase() === currentTeacher.subject.toLowerCase();
      return isMyTeacher && s.classId === reportClassId;
    });

    exportMonthlyAttendanceMatrixToExcel({
      classId: reportClassId,
      className: cls?.name || `Kelas ${reportClassId}`,
      subject: currentTeacher.subject,
      teacherName: currentTeacher.name,
      teacherNip: currentTeacher.nip,
      year: reportYear,
      month: reportMonth,
      monthName: monthName,
      daysInMonth: daysInMonth,
      students: studentsInClass,
      sessions: teacherSessionsForClass
    });

    showToast(`File Excel Matriks Bulanan ${monthName} ${reportYear} (${currentTeacher.subject} - ${reportClassId}) berhasil diunduh!`, 'success');
  };

  // Export Semester Attendance Recap (P1 - P16) to Excel (.xlsx)
  const handleExportSemesterExcel = (targetClass?: string) => {
    const targetClassId = targetClass || reportClassId || selectedClassId;
    const studentsInClass = activeStudents.filter(s => s.classId === targetClassId);
    const cls = SCHOOL_CLASSES.find(c => c.id === targetClassId);

    exportSemesterAttendanceToExcel({
      classId: targetClassId,
      className: cls?.name || `Kelas ${targetClassId}`,
      subject: currentTeacher.subject,
      teacherName: currentTeacher.name,
      teacherNip: currentTeacher.nip,
      semesterName: semesterFullName,
      students: studentsInClass,
      currentRecords: workingRecords,
      sessions: semesterReportData.semesterSessionsSorted
    });

    showToast(`File Rekap ${semesterFullName} (P1-P16) ${currentTeacher.subject} (${targetClassId}) berhasil diunduh!`, 'success');
  };

  // Export Monthly Calendar Matrix for Meja Piket (.xlsx)
  const handleExportPiketMonthlyMatrixExcel = (targetClass?: string, targetMonth?: number, targetYear?: number) => {
    const classIdToUse = targetClass || reportClassId;
    const monthToUse = targetMonth || reportMonth;
    const yearToUse = targetYear || reportYear;
    const studentsInClass = activeStudents.filter(s => s.classId === classIdToUse);
    const cls = SCHOOL_CLASSES.find(c => c.id === classIdToUse);
    const daysInMonth = new Date(yearToUse, monthToUse, 0).getDate();
    const monthName = MONTH_NAMES[monthToUse - 1];

    const classSessions = sessions.filter(s => s.classId === classIdToUse);

    exportMonthlyAttendanceMatrixToExcel({
      classId: classIdToUse,
      className: cls?.name || `Kelas ${classIdToUse}`,
      subject: 'Rekap Presensi Harian (Pos Piket)',
      teacherName: `${piketDutyTeacher} (Petugas Piket)`,
      teacherNip: '-',
      year: yearToUse,
      month: monthToUse,
      monthName: monthName,
      daysInMonth: daysInMonth,
      students: studentsInClass,
      sessions: classSessions
    });

    showToast(`File Excel Matriks Bulanan ${monthName} ${yearToUse} (${classIdToUse}) berhasil diunduh!`, 'success');
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
      semesterName: semesterFullName,
      classes: SCHOOL_CLASSES,
      students: activeStudents,
      piketOfficer: `${piketDutyTeacher} (Petugas Piket / Kesiswaan)`
    });

    showToast(`File Rekapitulasi Presensi ${semesterFullName} Tingkat Sekolah (17 Rombel & 535 Siswa) berhasil diunduh!`, 'success');
  };

  // -------------------------------------------------------------
  // ASSIGNMENT HANDLERS (GURU & SISWA)
  // -------------------------------------------------------------
  const isTeacherAssignment = (asg: Assignment) => {
    const cleanCurrentNip = (currentTeacher?.nip || '').replace(/\s+/g, '');
    const cleanAsgNip = (asg.teacherNip || '').replace(/\s+/g, '');
    
    // 1. Verifikasi kecocokan NIP jika keduanya memiliki NIP valid
    if (cleanCurrentNip && cleanAsgNip && cleanCurrentNip !== '-' && cleanAsgNip !== '-') {
      return cleanCurrentNip === cleanAsgNip;
    }
    // 2. Verifikasi kecocokan Nama Lengkap Guru
    if (asg.teacherName && currentTeacher?.name) {
      return asg.teacherName.toLowerCase().trim() === currentTeacher.name.toLowerCase().trim();
    }
    // 3. Fallback Mapel jika data tugas awal tidak memiliki nama/NIP eksplisit
    if (asg.subject && currentTeacher?.subject) {
      return asg.subject.toLowerCase().trim() === currentTeacher.subject.toLowerCase().trim();
    }
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
    piketModalNotesRef.current = { ...notes };
  };

  // Set single student status from Piket modal
  const handleSetPiketStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setPiketModalRecords(prev => ({ ...prev, [studentId]: status }));
  };

  // Set single student note from Piket modal
  const handleSetPiketStudentNote = useCallback((studentId: string, note: string) => {
    piketModalNotesRef.current[studentId] = note;
    setPiketModalNotes(prev => ({ ...prev, [studentId]: note }));
  }, []);

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
    const finalNotes = { ...piketModalNotes, ...piketModalNotesRef.current };

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
        notes: finalNotes,
      }
    };

    saveStoredAttendance(updatedData);
    setAttendanceData(updatedData);
    showToast(`Presensi Kelas ${detailModalClassId} berhasil disimpan & disahkan oleh ${piketDutyTeacher}!`, 'success');
    setDetailModalClassId(null); // Tutup pop-up otomatis setelah berhasil simpan
  };

  // Memoized Today Date String
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Calculate stats for Piket Dashboard (Only executed when Piket role is active)
  const schoolStats = useMemo(() => {
    if (currentUser?.role !== 'guru_piket') {
      return { totalAssigned: 0, hadir: 0, sakit: 0, izin: 0, alpa: 0, terlambat: 0 };
    }
    let totalAssigned = 0;
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    let terlambat = 0;

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
        else hadir++;
      });
    });

    return { totalAssigned, hadir, sakit, izin, alpa, terlambat };
  }, [currentUser?.role, attendanceData, activeStudents, todayStr]);

  const currentClassStudents = useMemo(() => 
    activeStudents.filter(s => s.classId === selectedClassId),
    [activeStudents, selectedClassId]
  );
  
  const teacherNipClean = useMemo(() => 
    (currentTeacher?.nip || '').replace(/\s+/g, ''),
    [currentTeacher?.nip]
  );

  const mySubjectSession = useMemo(() => {
    return sessions.find(s => 
      s.date === todayStr && 
      s.classId === selectedClassId && 
      (s.teacherNip.replace(/\s+/g, '') === teacherNipClean || s.subject.toLowerCase() === (currentTeacher?.subject || '').toLowerCase())
    );
  }, [sessions, todayStr, selectedClassId, teacherNipClean, currentTeacher?.subject]);

  const otherClassSessions = useMemo(() => {
    return sessions.filter(s =>
      s.date === todayStr &&
      s.classId === selectedClassId &&
      s.teacherNip.replace(/\s+/g, '') !== teacherNipClean &&
      s.subject.toLowerCase() !== (currentTeacher?.subject || '').toLowerCase()
    );
  }, [sessions, todayStr, selectedClassId, teacherNipClean, currentTeacher?.subject]);

  // ==========================================
  // TOP-LEVEL MEMOIZED DATA UNTUK TAB LAPORAN REKAP
  // Mencegah freeze / lag saat klik tab & toggle harian/bulanan/semester
  // ==========================================
  const studentsInReport = useMemo(() => {
    return activeStudents.filter(s => s.classId === reportClassId);
  }, [activeStudents, reportClassId]);

  const daysInfoList = useMemo(() => {
    const daysInMonth = new Date(reportYear, reportMonth, 0).getDate();
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const list = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(reportYear, reportMonth - 1, d);
      const dayNum = dt.getDay();
      list.push({
        day: d,
        dayName: days[dayNum],
        isSunday: dayNum === 0,
        isSaturday: dayNum === 6,
        isWeekend: dayNum === 0 || dayNum === 6
      });
    }
    return list;
  }, [reportYear, reportMonth]);

  const monthName = useMemo(() => {
    return MONTH_NAMES[reportMonth - 1] || 'Bulan';
  }, [reportMonth]);

  const semesterFullName = useMemo(() => {
    const semLabel = reportSemester === 'ganjil' ? 'Semester Ganjil' : 'Semester Genap';
    return `${semLabel} TP. ${reportAcademicYear}`;
  }, [reportSemester, reportAcademicYear]);

  // Sesi Guru Terisolasi untuk Kelas Laporan (Hanya berjalan jika di tab Laporan)
  const myTeacherReportSessions = useMemo(() => {
    if (activeMenu !== 'laporan') return [];
    const tNipClean = (currentTeacher?.nip || '').replace(/\s+/g, '');
    return sessions.filter(s => {
      const sNipClean = (s.teacherNip || '').replace(/\s+/g, '');
      const isMyTeacher = (tNipClean && sNipClean && tNipClean === sNipClean) ||
        s.teacherName.toLowerCase() === (currentTeacher?.name || '').toLowerCase() ||
        s.subject.toLowerCase() === (currentTeacher?.subject || '').toLowerCase();
      return isMyTeacher && s.classId === reportClassId;
    });
  }, [activeMenu, sessions, currentTeacher?.nip, currentTeacher?.name, currentTeacher?.subject, reportClassId]);

  // Data Laporan Harian (O(N) ringan, hanya berjalan jika mode harian aktif)
  const dailyReportData = useMemo(() => {
    if (activeMenu !== 'laporan' || reportMode !== 'harian') {
      return {
        dailySession: undefined as SubjectSession | undefined,
        dailyRecords: {} as Record<string, AttendanceStatus>,
        dailyNotes: {} as Record<string, string>,
        hasDailyData: false,
        dayH: 0, dayS: 0, dayI: 0, dayA: 0, dayT: 0,
        dayTotal: 0,
        dayPresentPercent: 0
      };
    }
    const isTodayReport = reportDate === todayStr && reportClassId === selectedClassId;
    const dailySession = myTeacherReportSessions.find(s => s.date === reportDate);
    const dailyRecords: Record<string, AttendanceStatus> = (isTodayReport && Object.keys(workingRecords).length > 0)
      ? workingRecords
      : (dailySession?.records || {});
    const dailyNotes: Record<string, string> = (isTodayReport && (Object.keys(workingNotes).length > 0 || Object.keys(workingNotesRef.current).length > 0))
      ? { ...workingNotes, ...workingNotesRef.current }
      : (dailySession?.notes || {});
    const hasDailyData = Boolean(dailySession || (isTodayReport && Object.keys(workingRecords).length > 0));

    let dayH = 0, dayS = 0, dayI = 0, dayA = 0, dayT = 0;
    studentsInReport.forEach(st => {
      if (hasDailyData) {
        const stStatus = dailyRecords[st.id] || 'H';
        if (stStatus === 'H') dayH++;
        else if (stStatus === 'S') dayS++;
        else if (stStatus === 'I') dayI++;
        else if (stStatus === 'A') dayA++;
        else if (stStatus === 'T') dayT++;
      }
    });
    const dayTotal = studentsInReport.length;
    const dayPresentPercent = hasDailyData && dayTotal > 0 ? Math.round(((dayH + dayT) / dayTotal) * 100) : 0;

    return {
      dailySession,
      dailyRecords,
      dailyNotes,
      hasDailyData,
      dayH, dayS, dayI, dayA, dayT,
      dayTotal,
      dayPresentPercent
    };
  }, [activeMenu, reportMode, reportDate, todayStr, reportClassId, selectedClassId, myTeacherReportSessions, workingRecords, workingNotes, studentsInReport]);

  // Data Laporan Matriks Bulanan (Tgl 1 - 31, super-cepat & hanya berjalan jika mode bulanan aktif)
  const monthlyReportData = useMemo(() => {
    if (activeMenu !== 'laporan' || reportMode !== 'bulanan') {
      return {
        monthSessions: [] as SubjectSession[],
        dateToSessionMap: new Map<number, SubjectSession>(),
        dailyPresentTally: {} as Record<number, number>,
        totalMeetings: 0,
        totalH: 0, totalS: 0, totalI: 0, totalA: 0, totalT: 0,
        overallPercent: 100,
        studentMonthlyStats: {} as Record<string, { H: number; S: number; I: number; A: number; T: number; meetings: number; pct: number }>
      };
    }

    const monthPadded = String(reportMonth).padStart(2, '0');
    const monthSessions = myTeacherReportSessions.filter(s => s.date.startsWith(`${reportYear}-${monthPadded}`));
    const dateToSessionMap = new Map<number, SubjectSession>();
    monthSessions.forEach(sess => {
      const parts = sess.date.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        dateToSessionMap.set(d, sess);
      }
    });

    const dailyPresentTally: Record<number, number> = {};
    monthSessions.forEach(sess => {
      const parts = sess.date.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        let count = 0;
        studentsInReport.forEach(st => {
          const stStatus = sess.records?.[st.id] || 'H';
          if (stStatus === 'H' || stStatus === 'T') count++;
        });
        dailyPresentTally[d] = count;
      }
    });

    const totalMeetings = monthSessions.length;
    const studentMonthlyStats: Record<string, { H: number; S: number; I: number; A: number; T: number; meetings: number; pct: number }> = {};
    studentsInReport.forEach(st => {
      studentMonthlyStats[st.id] = { H: 0, S: 0, I: 0, A: 0, T: 0, meetings: totalMeetings, pct: 100 };
    });

    monthSessions.forEach(sess => {
      studentsInReport.forEach(st => {
        const stStatus = sess.records?.[st.id] || 'H';
        const stat = studentMonthlyStats[st.id];
        if (stat) {
          if (stStatus === 'H') stat.H++;
          else if (stStatus === 'S') stat.S++;
          else if (stStatus === 'I') stat.I++;
          else if (stStatus === 'A') stat.A++;
          else if (stStatus === 'T') stat.T++;
        }
      });
    });

    let totalH = 0, totalS = 0, totalI = 0, totalA = 0, totalT = 0;
    studentsInReport.forEach(st => {
      const stat = studentMonthlyStats[st.id];
      if (stat) {
        totalH += stat.H;
        totalS += stat.S;
        totalI += stat.I;
        totalA += stat.A;
        totalT += stat.T;
        stat.pct = totalMeetings > 0 ? Math.round(((stat.H + stat.T) / totalMeetings) * 100) : 100;
      }
    });

    const totalSlots = totalMeetings * studentsInReport.length;
    const overallPercent = totalSlots > 0 ? Math.round(((totalH + totalT) / totalSlots) * 100) : 100;

    return {
      monthSessions,
      dateToSessionMap,
      dailyPresentTally,
      totalMeetings,
      totalH, totalS, totalI, totalA, totalT,
      overallPercent,
      studentMonthlyStats
    };
  }, [activeMenu, reportMode, reportMonth, reportYear, myTeacherReportSessions, studentsInReport]);

  // Data Laporan Rekap Semester (P1 - P16, hanya berjalan jika mode semester aktif)
  const semesterReportData = useMemo(() => {
    if (activeMenu !== 'laporan' || reportMode !== 'semester') {
      return {
        semesterSessionsSorted: [] as SubjectSession[],
        semesterStudentStats: {} as Record<string, { sH: number; sS: number; sI: number; sA: number; sT: number; sPct: number }>
      };
    }

    const [startYearStr, endYearStr] = reportAcademicYear.split('/');
    const startYear = parseInt(startYearStr, 10) || 2026;
    const endYear = parseInt(endYearStr, 10) || (startYear + 1);

    // Filter sesi sesuai rentang semester & tahun ajaran
    const filteredSessions = myTeacherReportSessions.filter(s => {
      const parts = s.date.split('-');
      if (parts.length < 3) return false;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (reportSemester === 'ganjil') {
        // Semester Ganjil: Bulan Juli (7) s/d Desember (12) di tahun awal Tahun Ajaran
        return y === startYear && m >= 7 && m <= 12;
      } else {
        // Semester Genap: Bulan Januari (1) s/d Juni (6) di tahun kedua Tahun Ajaran
        return y === endYear && m >= 1 && m <= 6;
      }
    });

    const semesterSessionsSorted = [...filteredSessions].sort((a, b) => a.date.localeCompare(b.date));
    const sTotalMeetings = semesterSessionsSorted.length;
    const semesterStudentStats: Record<string, { sH: number; sS: number; sI: number; sA: number; sT: number; sPct: number }> = {};

    studentsInReport.forEach(student => {
      let sH = 0, sS = 0, sI = 0, sA = 0, sT = 0;
      semesterSessionsSorted.forEach(sess => {
        const st = sess.records?.[student.id] || 'H';
        if (st === 'H') sH++;
        else if (st === 'S') sS++;
        else if (st === 'I') sI++;
        else if (st === 'A') sA++;
        else if (st === 'T') sT++;
      });
      const sPct = sTotalMeetings > 0 ? Math.round(((sH + sT) / sTotalMeetings) * 100) : 100;
      semesterStudentStats[student.id] = { sH, sS, sI, sA, sT, sPct };
    });

    return { semesterSessionsSorted, semesterStudentStats };
  }, [activeMenu, reportMode, reportSemester, reportAcademicYear, myTeacherReportSessions, studentsInReport]);

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

  // JIKA SISWA / GURU SEDANG DI DALAM RUANG UJIAN CBT (FOCUS MODE)
  if (activeCbtExamSession) {
    return (
      <CbtStudentExamRoom
        exam={activeCbtExamSession.exam}
        student={activeCbtExamSession.student}
        roomName={activeCbtExamSession.roomName}
        onFinishExam={() => {
          showToast(`Ujian ${activeCbtExamSession.exam.title} berhasil dikumpulkan!`, 'success');
        }}
        onExitRoom={() => setActiveCbtExamSession(null)}
      />
    );
  }

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

              {/* Teacher Account Settings & Change Password */}
              {(currentUser.role === 'guru_mapel' || currentUser.role === 'guru_piket') && (
                <button
                  type="button"
                  onClick={() => setIsTeacherSettingsOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 text-slate-800 hover:text-indigo-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                  title="Pengaturan Akun & Ganti Kata Sandi"
                >
                  <span>⚙️</span>
                  <span className="hidden sm:inline">Pengaturan</span>
                </button>
              )}

              {/* Red Official Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95 shrink-0"
                title="Keluar dari akun ini"
              >
                <svg className="w-3.5 h-3.5 shrink-0 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Keluar</span>
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

        {/* ----------------- 1. VIEW: CLEAN LOGIN PORTAL (WHEN NOT LOGGED IN) ----------------- */}
        {!currentUser && (
          <div className="max-w-[420px] mx-auto my-8 sm:my-16 px-4">
            
            {/* Clean Login Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-7 sm:p-8 shadow-xl shadow-slate-900/5 relative">
              
              {/* Minimal Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 mx-auto mb-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shadow-xs">
                  📚
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  E-Learning
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  SMP Negeri 3 Cihampelas
                </p>
              </div>

              {/* 3-Role Clean Switcher */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-medium">
                <button 
                  type="button"
                  onClick={() => switchLoginTab('guru')}
                  className={`py-2 rounded-lg transition cursor-pointer text-center ${
                    loginRole === 'guru'
                      ? 'bg-white text-indigo-600 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Guru
                </button>

                <button 
                  type="button"
                  onClick={() => switchLoginTab('piket')}
                  className={`py-2 rounded-lg transition cursor-pointer text-center ${
                    loginRole === 'piket'
                      ? 'bg-white text-emerald-600 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Piket
                </button>

                <button 
                  type="button"
                  onClick={() => switchLoginTab('siswa')}
                  className={`py-2 rounded-lg transition cursor-pointer text-center ${
                    loginRole === 'siswa'
                      ? 'bg-white text-purple-600 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Siswa
                </button>
              </div>

              {/* Clean Form */}
              <form onSubmit={handleFormLoginSubmit} className="space-y-4" autoComplete="off">
                
                {loginRole === 'guru' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Username
                      </label>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition"
                        placeholder="Username atau NIP"
                        autoComplete="off"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Kata Sandi
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition"
                          placeholder="Masukkan kata sandi"
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1 cursor-pointer text-xs"
                          title={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                        >
                          {showPassword ? "👁️" : "🙈"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer mt-2 active:scale-[0.99]"
                    >
                      Masuk
                    </button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const demoT = activeTeachers[0] || DEMO_TEACHERS[0];
                          handleLogin({
                            role: 'guru_mapel',
                            name: demoT.name,
                            nipOrNisn: demoT.nip,
                            subject: demoT.subject,
                            classId: '7-A'
                          });
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.99]"
                      >
                        <span>👨‍🏫</span>
                        <span>Masuk sbg Guru Demo ({activeTeachers[0]?.name?.split(',')[0] || 'Guru Mapel'})</span>
                      </button>
                      <p className="text-[10px] text-slate-400 mt-1">Username: {getTeacherUsername(activeTeachers[0] || DEMO_TEACHERS[0])} • Sandi: guru123</p>
                    </div>
                  </>
                )}

                {loginRole === 'piket' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ID Stasiun
                      </label>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition font-mono"
                        placeholder="ID stasiun piket"
                        autoComplete="off"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Kata Sandi
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition"
                          placeholder="Masukkan kata sandi"
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1 cursor-pointer text-xs"
                          title={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                        >
                          {showPassword ? "👁️" : "🙈"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer mt-2 active:scale-[0.99]"
                    >
                      Masuk
                    </button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          handleLogin({
                            role: 'guru_piket',
                            name: 'Stasiun Meja Piket Utama',
                            nipOrNisn: 'POSKO-PIKET',
                            subject: 'Pusat Monitoring Rombel'
                          });
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.99]"
                      >
                        <span>🏢</span>
                        <span>Masuk sbg Petugas Piket Demo</span>
                      </button>
                      <p className="text-[10px] text-slate-400 mt-1">ID: POSKO-PIKET • Sandi: piket123</p>
                    </div>
                  </>
                )}

                {loginRole === 'siswa' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        NISN
                      </label>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition font-mono"
                        placeholder="10 digit NISN"
                        maxLength={12}
                        autoComplete="off"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Kata Sandi
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition"
                          placeholder="Masukkan kata sandi"
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1 cursor-pointer text-xs"
                          title={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                        >
                          {showPassword ? "👁️" : "🙈"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5 cursor-pointer mt-2 active:scale-[0.99]"
                    >
                      Masuk
                    </button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const demoSt = activeStudents.find(s => s.nisn === DEMO_STUDENT.nisn) || activeStudents[0];
                          handleLogin({
                            role: 'siswa',
                            name: demoSt.name,
                            nipOrNisn: demoSt.nisn,
                            classId: demoSt.classId
                          });
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.99]"
                      >
                        <span>🎓</span>
                        <span>Masuk sbg Siswa Demo ({DEMO_STUDENT.name} - {DEMO_STUDENT.classId})</span>
                      </button>
                      <p className="text-[10px] text-slate-400 mt-1">NISN: {DEMO_STUDENT.nisn} • Sandi: siswa123</p>
                    </div>
                  </>
                )}

              </form>

              {/* Universal 1-Click Demo Bar (Any Role) */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                  ⚡ Akses Uji Coba Cepat (1-Klik)
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const demoSt = activeStudents.find(s => s.nisn === DEMO_STUDENT.nisn) || activeStudents[0];
                      handleLogin({
                        role: 'siswa',
                        name: demoSt.name,
                        nipOrNisn: demoSt.nisn,
                        classId: demoSt.classId
                      });
                    }}
                    className="py-1.5 px-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-[11px] font-bold transition flex flex-col items-center justify-center text-center cursor-pointer active:scale-95"
                    title="Masuk langsung sebagai Siswa Demo"
                  >
                    <span className="text-sm">🎓</span>
                    <span>Siswa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const demoT = activeTeachers[0] || DEMO_TEACHERS[0];
                      handleLogin({
                        role: 'guru_mapel',
                        name: demoT.name,
                        nipOrNisn: demoT.nip,
                        subject: demoT.subject,
                        classId: '7-A'
                      });
                    }}
                    className="py-1.5 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-[11px] font-bold transition flex flex-col items-center justify-center text-center cursor-pointer active:scale-95"
                    title="Masuk langsung sebagai Guru Demo"
                  >
                    <span className="text-sm">👨‍🏫</span>
                    <span>Guru</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleLogin({
                        role: 'guru_piket',
                        name: 'Stasiun Meja Piket Utama',
                        nipOrNisn: 'POSKO-PIKET',
                        subject: 'Pusat Monitoring Rombel'
                      });
                    }}
                    className="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold transition flex flex-col items-center justify-center text-center cursor-pointer active:scale-95"
                    title="Masuk langsung sebagai Petugas Piket"
                  >
                    <span className="text-sm">🏢</span>
                    <span>Piket</span>
                  </button>
                </div>
              </div>

              {/* Minimal Helper Link */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent('Halo Admin SMPN 3 Cihampelas, saya memerlukan bantuan terkait akun E-Learning.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-indigo-600 transition"
                >
                  Lupa sandi atau butuh bantuan? <span className="font-medium text-slate-600 hover:underline">Hubungi Admin</span>
                </a>
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
                  <span>
                    {activeMenu === 'presensi' && 'Presensi KBM'}
                    {activeMenu === 'laporan' && 'Rekap Kehadiran'}
                    {activeMenu === 'tugas' && 'Materi & Tugas Siswa'}
                    {activeMenu === 'cbt' && 'Bank Soal & Asesmen CBT'}
                    {activeMenu === 'pengawas' && 'Mode Pengawas Ruang'}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {currentTeacher.subject}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeMenu === 'presensi' && (
                    <>Pengampu: <span className="text-slate-800 font-semibold">{currentTeacher.name}</span> (NIP: {currentTeacher.nip}) • SMP Negeri 3 Cihampelas</>
                  )}
                  {activeMenu === 'laporan' && (
                    <>Rekapitulasi presensi harian, bulanan, dan semester mata pelajaran <span className="text-indigo-700 font-semibold">{currentTeacher.subject}</span></>
                  )}
                  {activeMenu === 'tugas' && (
                    <>Pusat modul ajar, materi pembelajaran, dan penugasan mata pelajaran <span className="text-indigo-700 font-semibold">{currentTeacher.subject}</span></>
                  )}
                  {activeMenu === 'cbt' && (
                    <>Bank soal evaluasi dan simulasi ujian komputer (CBT) mata pelajaran <span className="text-indigo-700 font-semibold">{currentTeacher.subject}</span></>
                  )}
                  {activeMenu === 'pengawas' && (
                    <>Pengawasan ruang ujian CBT, presensi peserta ruangan, dan berita acara pelaksanaan (BAP)</>
                  )}
                </p>
              </div>

              {/* Sub-tabs: Presensi / Laporan / Materi & Tugas / CBT / Pengawas */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setActiveMenu('presensi')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                    activeMenu === 'presensi' 
                      ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  Presensi KBM
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMenu('laporan')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                    activeMenu === 'laporan' 
                      ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  Rekap Kehadiran
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMenu('tugas')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                    activeMenu === 'tugas' 
                      ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  Materi & Tugas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMenu('cbt')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                    activeMenu === 'cbt' 
                      ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  Bank Soal & CBT
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMenu('pengawas')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                    activeMenu === 'pengawas' 
                      ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  Mode Pengawas
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
                      {otherClassSessions.map((os: SubjectSession) => (
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
                    {currentClassStudents.map((student: Student, idx: number) => {
                      const currentStatus = workingRecords[student.id] || 'H';
                      const currentNote = workingNotes[student.id] || '';

                      return (
                        <div 
                          key={student.id} 
                          className={`px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 transition ${
                            currentStatus !== 'H' ? 'bg-amber-50/25' : 'hover:bg-indigo-50/30'
                          }`}
                        >
                          {/* Student Identity: flex-1 min-w-0 absorbs name length differences */}
                          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                            <span className="w-6 shrink-0 font-mono text-xs text-slate-400 text-center font-semibold">{idx + 1}</span>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                                <span className="truncate">{student.name}</span>
                                {student.gender && student.gender !== '-' && (
                                  <span className="text-[10px] text-slate-400 font-mono shrink-0">({student.gender})</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                NISN: {student.nisn}
                              </div>
                            </div>
                          </div>

                          {/* 5 Compact Buttons [ H ] [ S ] [ I ] [ A ] [ T ]: exactly w-[176px] shrink-0 across ALL rows */}
                          <div className="w-[176px] shrink-0 flex items-center justify-center gap-1">
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

                          {/* Note input ONLY when status is NOT Hadir: exactly w-48 sm:w-56 shrink-0 across ALL rows */}
                          <div className="w-48 sm:w-56 shrink-0 text-right">
                            {currentStatus !== 'H' ? (
                              <AttendanceNoteInput
                                value={currentNote}
                                onCommit={(val) => handleSetStudentNote(student.id, val)}
                                onInstantChange={(val) => {
                                  workingNotesRef.current[student.id] = val;
                                }}
                                placeholder={
                                  currentStatus === 'S' ? 'Alasan sakit...' :
                                  currentStatus === 'I' ? 'Alasan izin...' :
                                  currentStatus === 'T' ? 'Alasan terlambat...' :
                                  'Keterangan...'
                                }
                                className="w-full px-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white placeholder:text-slate-400"
                              />
                            ) : (
                              <div className="text-right pr-2">
                                <span className="text-[11px] text-emerald-600 font-semibold">Hadir</span>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* BOTTOM ACTION BAR (BERSIH & FOKUS SIMPAN PRESENSI) */}
                  <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 text-center sm:text-left">
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <span>✅</span> Presensi otomatis tersimpan ke Jurnal KBM.
                      </span>
                      <span className="text-slate-400">•</span>
                      <button
                        type="button"
                        onClick={() => setActiveMenu('laporan')}
                        className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline transition cursor-pointer"
                      >
                        Buka Tab Laporan Rekap untuk Unduh Excel (Harian, Bulanan & Semester) →
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveAttendance}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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

            {/* TAB: LAPORAN REKAP PRESENSI (BULANAN MATRIKS 1-31 & SEMESTER P1-P16) */}
            {activeMenu === 'laporan' && (
              <div className="space-y-4">
                
                {/* Top Notice: Isolation Confirmation */}
                <div className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 border border-indigo-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                        🔒 Presensi Terisolasi Mandiri
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold border border-indigo-300">
                        Mapel: {currentTeacher.subject}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Laporan Rekapitulasi Presensi Peserta Didik
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Menampilkan rekapan presensi khusus mata pelajaran <strong className="text-indigo-700">{currentTeacher.subject}</strong> yang diampu oleh <strong className="text-slate-800">{currentTeacher.name}</strong>. Sesi guru mapel lain tidak tercampur dalam laporan ini.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (reportMode === 'harian') {
                          handleExportMapelExcel(reportClassId, reportDate);
                        } else if (reportMode === 'bulanan') {
                          handleExportMonthlyMatrixExcel();
                        } else {
                          handleExportSemesterExcel(reportClassId);
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/25 flex items-center gap-2 cursor-pointer"
                      title="Unduh laporan ke format Excel resmi (.xlsx)"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                      </svg>
                      <span>
                        {reportMode === 'harian' ? 'Export Jurnal Harian (.xlsx)' : reportMode === 'bulanan' ? 'Export Matriks Bulanan (.xlsx)' : 'Export Rekap Semester (.xlsx)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Cetak laporan presensi"
                    >
                      <span>🖨️ Cetak</span>
                    </button>
                  </div>
                </div>

                {/* Filter Card (Pilihan Mode: Harian, Bulanan, Semester) */}
                <div className="bg-white border border-indigo-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span>🔍 Filter Laporan Presensi</span>
                    </span>

                    {/* Mode Toggle: Harian vs Bulanan vs Semester */}
                    <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                      <button
                        type="button"
                        onClick={() => setReportMode('harian')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors duration-75 select-none active:scale-[0.98] cursor-pointer ${
                          reportMode === 'harian'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📄 Harian (Per Tanggal)
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportMode('bulanan')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors duration-75 select-none active:scale-[0.98] cursor-pointer ${
                          reportMode === 'bulanan'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📅 Bulanan (Tgl 1 - 31)
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportMode('semester')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors duration-75 select-none active:scale-[0.98] cursor-pointer ${
                          reportMode === 'semester'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📚 Semester (P1 - P16)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        1. Pilih Kelas / Rombel:
                      </label>
                      <select
                        value={reportClassId}
                        onChange={(e) => setReportClassId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors duration-75 cursor-pointer"
                      >
                        {SCHOOL_CLASSES.map(cls => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} ({classStudentCounts[cls.id] || 0} Siswa)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={reportMode === 'harian' ? 'block sm:col-span-2' : 'hidden'}>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        2. Pilih Tanggal Presensi:
                      </label>
                      <input
                        type="date"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors duration-75 cursor-pointer"
                      />
                    </div>

                    <div className={reportMode === 'bulanan' ? 'block' : 'hidden'}>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        2. Pilih Bulan:
                      </label>
                      <select
                        value={reportMonth}
                        onChange={(e) => setReportMonth(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors duration-75 cursor-pointer"
                      >
                        {MONTH_NAMES.map((name, idx) => (
                          <option key={name} value={idx + 1}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={reportMode === 'bulanan' ? 'block' : 'hidden'}>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        3. Pilih Tahun:
                      </label>
                      <select
                        value={reportYear}
                        onChange={(e) => setReportYear(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors duration-75 cursor-pointer"
                      >
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                        <option value={2027}>2027</option>
                      </select>
                    </div>

                    <div className={reportMode === 'semester' ? 'block' : 'hidden'}>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        2. Pilih Semester:
                      </label>
                      <select
                        value={reportSemester}
                        onChange={(e) => setReportSemester(e.target.value as 'ganjil' | 'genap')}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors duration-75 cursor-pointer"
                      >
                        <option value="ganjil">Semester Ganjil (Juli - Des)</option>
                        <option value="genap">Semester Genap (Jan - Jun)</option>
                      </select>
                    </div>

                    <div className={reportMode === 'semester' ? 'block' : 'hidden'}>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        3. Tahun Ajaran:
                      </label>
                      <select
                        value={reportAcademicYear}
                        onChange={(e) => setReportAcademicYear(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors duration-75 cursor-pointer"
                      >
                        <option value="2025/2026">TP. 2025/2026</option>
                        <option value="2026/2027">TP. 2026/2027</option>
                        <option value="2027/2028">TP. 2027/2028</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Summary Metric Cards (Dinamis sesuai Mode: Harian, Bulanan, Semester) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {reportMode === 'harian' ? 'Status KBM Harian' : 'Pertemuan Mapel Terlaksana'}
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-indigo-600 mt-0.5">
                      {reportMode === 'harian' ? (
                        dailyReportData.hasDailyData ? 'Terlaksana' : 'Belum Ada Sesi'
                      ) : reportMode === 'bulanan' ? (
                        `${monthlyReportData.totalMeetings} Sesi`
                      ) : (
                        `${semesterReportData.semesterSessionsSorted.length} Sesi`
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {reportMode === 'harian'
                        ? (dailyReportData.dailySession?.submittedAt ? `Dicatat pkl ${dailyReportData.dailySession.submittedAt}` : formatIndonesianDate(reportDate))
                        : reportMode === 'bulanan'
                        ? `${monthName} ${reportYear}`
                        : semesterFullName}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {reportMode === 'harian' ? 'Tingkat Kehadiran' : 'Rata-rata Kehadiran Kelas'}
                    </div>
                    <div className="text-2xl font-black text-emerald-600 mt-0.5">
                      {reportMode === 'harian' ? `${dailyReportData.dayPresentPercent}%` : `${monthlyReportData.overallPercent}%`}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {reportMode === 'harian'
                        ? `${dailyReportData.dayH + dailyReportData.dayT} dari ${dailyReportData.dayTotal} Siswa Hadir`
                        : `Total ${studentsInReport.length} Siswa Terdaftar`}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Sakit (S) & Izin (I)
                    </div>
                    <div className="text-2xl font-black text-blue-600 mt-0.5">
                      {reportMode === 'harian' ? dailyReportData.dayS + dailyReportData.dayI : monthlyReportData.totalS + monthlyReportData.totalI}{' '}
                      <span className="text-xs font-semibold text-slate-500">
                        {reportMode === 'harian' ? 'siswa' : 'kali'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {reportMode === 'harian'
                        ? `Sakit: ${dailyReportData.dayS} • Izin: ${dailyReportData.dayI}`
                        : `Sakit: ${monthlyReportData.totalS} • Izin: ${monthlyReportData.totalI}`}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Alpa (A) & Terlambat (T)
                    </div>
                    <div className="text-2xl font-black text-rose-600 mt-0.5">
                      {reportMode === 'harian' ? dailyReportData.dayA + dailyReportData.dayT : monthlyReportData.totalA + monthlyReportData.totalT}{' '}
                      <span className="text-xs font-semibold text-slate-500">
                        {reportMode === 'harian' ? 'siswa' : 'kali'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {reportMode === 'harian'
                        ? `Alpa: ${dailyReportData.dayA} • Terlambat: ${dailyReportData.dayT}`
                        : `Alpa: ${monthlyReportData.totalA} • Terlambat: ${monthlyReportData.totalT}`}
                    </div>
                  </div>
                </div>

                {/* TABEL JURNAL HARIAN PRESENSI KBM (PER TANGGAL) */}
                <div className={reportMode === 'harian' ? 'block' : 'hidden'}>
                  <DailyReportTable
                    isActive={reportMode === 'harian'}
                    students={studentsInReport}
                    reportClassId={reportClassId}
                    reportDate={reportDate}
                    currentTeacher={currentTeacher}
                    dailyReportData={dailyReportData}
                  />
                </div>

                {/* TABEL MATRIKS BULANAN (TANGGAL 1 - 31) */}
                <div className={reportMode === 'bulanan' ? 'block' : 'hidden'}>
                  <MonthlyReportTable
                    isActive={reportMode === 'bulanan'}
                    students={studentsInReport}
                    reportClassId={reportClassId}
                    monthName={monthName}
                    reportYear={reportYear}
                    currentTeacher={currentTeacher}
                    daysInfoList={daysInfoList}
                    monthlyReportData={monthlyReportData}
                  />
                </div>

                {/* TABEL REKAP SEMESTER (P1 - P16) */}
                <div className={reportMode === 'semester' ? 'block' : 'hidden'}>
                  <SemesterReportTable
                    isActive={reportMode === 'semester'}
                    students={studentsInReport}
                    reportClassId={reportClassId}
                    currentTeacher={currentTeacher}
                    semesterReportData={semesterReportData}
                    semesterName={semesterFullName}
                  />
                </div>

                {/* Keterangan & Legenda Warna */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-slate-700">Keterangan:</span>
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span className="w-4 h-4 rounded bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center">H</span>
                      <span>Hadir</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span className="w-4 h-4 rounded bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">S</span>
                      <span>Sakit</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span className="w-4 h-4 rounded bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center">I</span>
                      <span>Izin</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span className="w-4 h-4 rounded bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center">A</span>
                      <span>Alpa</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span className="w-4 h-4 rounded bg-orange-500 text-white font-bold text-[10px] flex items-center justify-center">T</span>
                      <span>Terlambat</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-400">
                      <span className="font-mono text-slate-300">-</span>
                      <span>Tidak ada jam KBM {currentTeacher.subject}</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 italic">
                    Format laporan memenuhi standar Dapodik & Kurikulum Merdeka SMPN 3 Cihampelas
                  </div>
                </div>

              </div>
            )}

            {/* TAB: MATERI & PENUGASAN SISWA */}
            {activeMenu === 'tugas' && (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="bg-white border border-indigo-100 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span>Materi Pembelajaran & Penugasan Siswa</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                        {currentTeacher.subject}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Kelola modul ajar, penugasan mata pelajaran {currentTeacher.subject}, dan periksa hasil pengerjaan siswa per rombel.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreateAsgModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer self-start md:self-auto"
                  >
                    <span>+ Buat Tugas / Materi</span>
                  </button>
                </div>

                {/* Sub-filter bar: Pilihan Rombel Kelas (Semua Kelas Sekolah 7-A s.d 9-E) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <span>👥 Pilih Rombel:</span>
                    </span>

                    <select
                      value={selectedClassId}
                      onChange={(e) => {
                        setSelectedClassId(e.target.value);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-xs min-w-[240px]"
                    >
                      <option value="ALL">🌐 Semua Kelas</option>
                      {SCHOOL_CLASSES.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          Kelas {cls.name} ({cls.totalStudents} Siswa)
                        </option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const myTasks = assignments.filter(a => {
                      if (!isTeacherAssignment(a)) return false;
                      if (selectedClassId === 'ALL') return true;
                      return a.targetClass === selectedClassId;
                    });

                    return (
                      <div className="flex items-center gap-1.5 text-xs self-start sm:self-auto">
                        <span className="text-slate-500">Menampilkan</span>
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 font-extrabold text-[11px]">
                          {myTasks.length} Tugas
                        </span>
                        <span className="text-slate-500">untuk</span>
                        <span className="font-bold text-slate-800">
                          {selectedClassId === 'ALL' ? 'Semua Kelas' : `Kelas ${selectedClassId}`}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* My Assignments List */}
                {(() => {
                  const myTasks = assignments.filter(a => {
                    if (!isTeacherAssignment(a)) return false;
                    if (selectedClassId === 'ALL') return true;
                    return a.targetClass === selectedClassId;
                  });

                  if (myTasks.length === 0) {
                    return (
                      <div className="bg-white border border-indigo-100 rounded-2xl p-8 text-center space-y-3">
                        <div className="text-4xl">📝</div>
                        <h3 className="text-sm font-bold text-slate-800">
                          Belum Ada Tugas {currentTeacher.subject} untuk {selectedClassId === 'ALL' ? 'Kelas Mana Pun' : `Kelas ${selectedClassId}`}
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Bapak/Ibu guru dapat membuat tugas mandiri, PR, atau proyek untuk peserta didik {selectedClassId === 'ALL' ? 'sekolah' : `Kelas ${selectedClassId}`}.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsCreateAsgModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          + Terbitkan Tugas {selectedClassId === 'ALL' ? '' : `untuk Kelas ${selectedClassId}`}
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

            {/* TAB: BANK SOAL & CBT */}
            {activeMenu === 'cbt' && (
              <CbtTeacherManagement
                teacherName={currentTeacher.name}
                teacherSubject={currentTeacher.subject}
                teacherClasses={currentTeacher.classes}
                activeStudents={activeStudents}
                onPreviewExamAsStudent={(pkg) => {
                  const studentToUse = activeStudents[0] || INITIAL_STUDENTS[0];
                  setActiveCbtExamSession({
                    exam: pkg,
                    student: studentToUse,
                    roomName: 'Ruang Pratinjau Guru'
                  });
                }}
              />
            )}

            {/* TAB: MODE PENGAWAS RUANG CBT (UNTUK GURU) */}
            {activeMenu === 'pengawas' && (
              <CbtSupervisorRoom
                currentTeacherName={currentTeacher.name}
                activeStudents={activeStudents}
                onOpenExamForStudent={(pkg, st, roomName) => {
                  setActiveCbtExamSession({
                    exam: pkg,
                    student: st,
                    roomName: roomName
                  });
                }}
              />
            )}

          </div>
        )}

        {/* ----------------- 3. VIEW: GURU PIKET (RUANG KONTROL MEJA PIKET) ----------------- */}
        {currentUser?.role === 'guru_piket' && (
          <div className="space-y-6">

            {/* Piket Header */}
            <div className="space-y-3 pb-3 border-b border-indigo-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Pusat Meja Piket</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      17 Rombel
                    </span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    SMP Negeri 3 Cihampelas • Layanan Presensi & Ketertiban
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs shadow-sm">
                    <span className="text-slate-500 font-medium">Petugas:</span>
                    <select
                      value={piketDutyTeacher}
                      onChange={(e) => setPiketDutyTeacher(e.target.value)}
                      className="bg-transparent text-emerald-700 font-bold focus:outline-none cursor-pointer max-w-[200px] truncate"
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
                    onClick={() => {
                      const stored = getStoredAttendance();
                      setAttendanceData(stored);
                      const storedSess = getStoredSessions();
                      setSessions(storedSess);
                      showToast('Data kehadiran diperbarui!', 'success');
                    }}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Muat ulang data presensi terbaru"
                  >
                    <span>🔄</span>
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs & Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                {/* Tab Switcher: Live Hari Ini vs Matriks Bulanan Kelas */}
                <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPiketViewTab('live')}
                    className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      piketViewTab === 'live'
                        ? 'bg-white text-emerald-700 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🏫</span>
                    <span>Live Hari Ini</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPiketViewTab('laporan')}
                    className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      piketViewTab === 'laporan'
                        ? 'bg-white text-emerald-700 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>📊</span>
                    <span>Matriks Bulanan Kelas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPiketViewTab('pengawas')}
                    className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      piketViewTab === 'pengawas'
                        ? 'bg-white text-emerald-700 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>📋</span>
                    <span>Pengawas CBT</span>
                  </button>
                </div>

                {/* Right Contextual Actions */}
                <div className="flex items-center gap-2">
                  {piketViewTab === 'live' && (
                    <button
                      type="button"
                      onClick={handleExportPiketExcel}
                      className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Unduh rekapitulasi presensi harian seluruh rombel hari ini (.xlsx)"
                    >
                      <span>📋</span>
                      <span>Export Harian (.xlsx)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleExportSchoolSemesterExcel}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Unduh rekapitulasi kehadiran 1 semester seluruh sekolah (17 rombel & 535 siswa) untuk Kesiswaan / BK (.xlsx)"
                  >
                    <span>📥</span>
                    <span>Rekap 1 Semester</span>
                  </button>
                </div>
              </div>
            </div>

            {/* TAMPILAN PIKET: LIVE MONITORING HARI INI */}
            {piketViewTab === 'live' && (
              <div className="space-y-6">
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
                        Kelas Siswa:
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
                        Nama Siswa:
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
                        Status Kehadiran:
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
                        Catatan Piket:
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
          </div>
        )}

            {/* TAMPILAN PIKET: LAPORAN MATRIKS BULANAN ROMBEL */}
            {piketViewTab === 'laporan' && (
              <PiketMonthlyReportSection
                initialClassId={reportClassId}
                initialMonth={reportMonth}
                initialYear={reportYear}
                activeStudents={activeStudents}
                sessions={sessions}
                classStudentCounts={classStudentCounts}
                piketDutyTeacher={piketDutyTeacher}
                onExportExcel={handleExportPiketMonthlyMatrixExcel}
              />
            )}

            {/* TAMPILAN PIKET: PENGAWAS RUANG CBT */}
            {piketViewTab === 'pengawas' && (
              <CbtSupervisorRoom
                currentTeacherName={piketDutyTeacher || currentUser?.name || 'Guru Pengawas Ruang'}
                activeStudents={activeStudents}
                onOpenExamForStudent={(pkg, st, roomName) => {
                  setActiveCbtExamSession({
                    exam: pkg,
                    student: st,
                    roomName: roomName
                  });
                }}
              />
            )}

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
                        <div key={student.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                          {/* Nama Siswa: flex-1 min-w-0 absorbs name length */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                            <span className="w-5 shrink-0 text-slate-400 font-mono font-semibold">{idx + 1}.</span>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                                <span className="truncate">{student.name}</span>
                                {student.gender && student.gender !== '-' && (
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono shrink-0 ${
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

                          {/* Tombol Status Interaktif untuk Piket [ H ] [ S ] [ I ] [ A ] [ T ]: exactly w-[176px] shrink-0 */}
                          <div className="w-[176px] shrink-0 flex items-center justify-center gap-1">
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

                          {/* Kolom Catatan Piket: exactly w-44 sm:w-52 shrink-0 across ALL rows */}
                          <div className="w-44 sm:w-52 shrink-0 text-right">
                            {currentStatus !== 'H' ? (
                              <AttendanceNoteInput
                                value={currentNote}
                                onCommit={(val) => handleSetPiketStudentNote(student.id, val)}
                                onInstantChange={(val) => {
                                  piketModalNotesRef.current[student.id] = val;
                                }}
                                placeholder={
                                  currentStatus === 'S' ? 'Catatan sakit...' :
                                  currentStatus === 'I' ? 'Catatan izin...' :
                                  currentStatus === 'T' ? 'Alasan telat...' :
                                  'Keterangan...'
                                }
                                className="w-full px-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white placeholder:text-slate-400"
                              />
                            ) : (
                              <div className="text-right pr-2">
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
                      <span className="text-xs text-slate-500 font-medium">
                        Kelas {currentUser.classId || '7-A'} • {new Date().getMonth() + 1 >= 7 ? 'Semester Ganjil' : 'Semester Genap'} TP. {new Date().getMonth() + 1 >= 7 ? `${new Date().getFullYear()}/${new Date().getFullYear() + 1}` : `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}
                      </span>
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

            {/* CBT SECTION: TERBAGI MENJADI LIVE CBT (SEDANG AKTIF) & RIWAYAT NILAI (SUDAH SELESAI) */}
            {(() => {
              const currentStudent = activeStudents.find(s => s.nisn === currentUser.nipOrNisn) ||
                activeStudents.find(s => s.name.toLowerCase() === currentUser.name?.toLowerCase()) ||
                activeStudents[0];
              const studentClass = currentUser.classId || '7-A';

              // 1. Ujian yang saat ini AKTIF untuk kelas siswa ini (Hanya yang berstatus AKTIF!)
              const activeExamsForClass = cbtPackages.filter(pkg => {
                const isClassMatch = pkg.targetClasses.includes(studentClass) || 
                  pkg.targetClasses.includes('Semua') || 
                  pkg.targetClasses.includes(studentClass.split('-')[0]) ||
                  pkg.targetClasses.includes(`Tingkat ${studentClass.split('-')[0]}`);
                if (!isClassMatch) return false;
                return pkg.status === 'active'; // JIKA DIJEDA (DRAFT) -> TIDAK MUNCUL DI LIVE CBT!
              });

              // 2. Ujian yang SUDAH SELESAI dikumpulkan oleh siswa ini
              const completedExams = cbtPackages.filter(pkg => {
                const sessionKey = `${pkg.id}_${currentStudent?.id || ''}`;
                const mySession = cbtStudentSessions[sessionKey];
                return Boolean(mySession?.isSubmitted);
              });

              if (activeExamsForClass.length === 0 && completedExams.length === 0) return null;

              return (
                <div className="space-y-4">
                  {/* A. BANNER LIVE UJIAN CBT (HANYA MUNCUL JIKA ADA UJIAN YANG AKTIF) */}
                  {activeExamsForClass.length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-indigo-700/50 relative overflow-hidden space-y-4 animate-fade-in">
                      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-indigo-700/60 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-black shadow-md shadow-amber-400/20 flex-shrink-0">
                            💻
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-base font-black tracking-wide text-white">
                                ASESMEN & UJIAN CBT
                              </h2>
                              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black tracking-wider animate-pulse uppercase">
                                LIVE CBT
                              </span>
                            </div>
                            <p className="text-xs text-indigo-200">
                              Siswa Kelas <span className="text-amber-300 font-bold">{studentClass}</span> • Silakan masuk dan kerjakan dengan jujur.
                            </p>
                          </div>
                        </div>
                        <div className="text-xs bg-indigo-950/80 border border-indigo-700/60 px-3 py-1.5 rounded-xl font-mono text-indigo-200 self-start sm:self-auto flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          Ruangan: <span className="font-bold text-amber-300">Ruang {studentClass}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 relative z-10">
                        {activeExamsForClass.map(exam => {
                          const sessionKey = `${exam.id}_${currentStudent?.id || ''}`;
                          const mySession = cbtStudentSessions[sessionKey];
                          const isSubmitted = Boolean(mySession?.isSubmitted);
                          const score = mySession?.score ?? 0;
                          const isPassed = score >= exam.passingGrade;

                          return (
                            <div 
                              key={exam.id} 
                              className="bg-white/10 backdrop-blur-md border border-amber-400/40 hover:bg-white/15 rounded-xl p-4 flex flex-col justify-between gap-3 transition"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                    {exam.semester} • TP {exam.academicYear}
                                  </span>
                                  <span className="text-[11px] font-medium text-indigo-200">
                                    {exam.questions.length} Butir Soal
                                  </span>
                                </div>
                                <h3 className="text-sm font-bold text-white line-clamp-1">
                                  {exam.title}
                                </h3>
                                <p className="text-xs text-indigo-200 mb-2">
                                  Mata Pelajaran: <strong className="text-white">{exam.subject}</strong> • Pengampu: {exam.teacherName}
                                </p>

                                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-indigo-300">
                                  <span className="bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                                    ⏱️ {exam.durationMinutes} Menit
                                  </span>
                                  <span className="bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                                    🎯 KKM {exam.passingGrade}
                                  </span>
                                  <span className="bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded border border-amber-400/20 font-mono">
                                    Token: <strong>{exam.token}</strong>
                                  </span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-white/10">
                                {isSubmitted ? (
                                  <div className="space-y-2">
                                    <div className="w-full flex items-center justify-between bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 rounded-lg text-emerald-300 text-xs">
                                      <span className="font-bold flex items-center gap-1">
                                        <span>✓</span>
                                        <span>Sudah Dikerjakan (Skor: {score}/100)</span>
                                      </span>
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isPassed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                                        {isPassed ? 'Tuntas' : 'Remedial'}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Ujian ini sudah pernah kamu kerjakan dengan skor ${score}/100. Apakah kamu ingin mengulang pengerjaan sekarang?`)) {
                                          resetStoredStudentCbtSession(exam.id, currentStudent.id);
                                          setActiveCbtExamSession({
                                            exam,
                                            student: currentStudent,
                                            roomName: `Ruang ${studentClass}`
                                          });
                                        }
                                      }}
                                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs transition shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                                    >
                                      <span>🔄</span>
                                      <span>Kerjakan Ulang Ujian CBT</span>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCbtExamSession({
                                        exam,
                                        student: currentStudent,
                                        roomName: `Ruang ${studentClass}`
                                      });
                                    }}
                                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                  >
                                    <span>🚀 Masuk Ruang Ujian CBT</span>
                                    <span>➔</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* B. RIWAYAT & HASIL NILAI CBT (MUNCUL JIKA ADA UJIAN YANG SUDAH SELESAI DIKERJAKAN) */}
                  {completedExams.length > 0 && (
                    <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">📊</span>
                          <h3 className="text-sm font-bold text-slate-900">
                            Riwayat Nilai & Hasil Ujian CBT Saya
                          </h3>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {completedExams.length} Asesmen Selesai
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {completedExams.map(exam => {
                          const sessionKey = `${exam.id}_${currentStudent?.id || ''}`;
                          const mySession = cbtStudentSessions[sessionKey];
                          const score = mySession?.score ?? 0;
                          const isPassed = score >= exam.passingGrade;

                          return (
                            <div key={exam.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2.5">
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                                    {exam.subject}
                                  </span>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                    isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {isPassed ? '✓ TUNTAS' : '⚠️ REMEDIAL'}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-900 line-clamp-1" title={exam.title}>
                                  {exam.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  KKM: {exam.passingGrade} • {exam.questions.length} Soal
                                </p>
                              </div>

                              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                                <div className="text-[11px] text-slate-400">
                                  Nilai Diperoleh:
                                </div>
                                <div className="text-base font-black font-mono text-indigo-700">
                                  {score}<span className="text-xs text-slate-400 font-normal">/100</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

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
                        <span>📝 Tugas & Asesmen Kelas {studentClass}</span>
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

        {/* MODAL: PENGATURAN AKUN GURU & GANTI KATA SANDI MANDIRI */}
        <TeacherSettingsModal
          isOpen={isTeacherSettingsOpen}
          onClose={() => setIsTeacherSettingsOpen(false)}
          currentUser={currentUser}
          showToast={showToast}
        />

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
