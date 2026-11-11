'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  CbtExamPackage,
  CbtQuestion,
  CbtStudentAnswerState,
  saveStoredStudentCbtSession,
  getStoredStudentCbtSessions,
  unlockStoredStudentCbtSession,
  resetStoredStudentCbtSession,
  isViolationSyncPending,
  gradeCbtAnswers,
  getStoredCbtPackages,
  evaluateCbtPackageSchedule
} from '@/lib/cbtData';
import { Student } from '@/lib/elearningData';

type CbtAnswerValue = number | number[] | Record<string, boolean> | Record<string, string>;

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
}

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
}

function getQuestionCompletionStatus(
  q: CbtQuestion,
  a: CbtAnswerValue | undefined | null
): 'complete' | 'partial' | 'empty' {
  if (a === undefined || a === null) return 'empty';
  if (q.type === 'pg') return typeof a === 'number' ? 'complete' : 'empty';
  if (q.type === 'pg_kompleks') return Array.isArray(a) && a.length > 0 ? 'complete' : 'empty';
  if (q.type === 'benar_salah') {
    if (typeof a !== 'object' || Array.isArray(a)) return 'empty';
    const obj = a as Record<string, boolean>;
    const statements = q.statements || [];
    if (statements.length === 0) return Object.keys(obj).length > 0 ? 'complete' : 'empty';
    const filled = statements.filter(st => typeof obj[st.id] === 'boolean').length;
    if (filled === 0) return 'empty';
    return filled === statements.length ? 'complete' : 'partial';
  }
  if (q.type === 'menjodohkan') {
    if (typeof a !== 'object' || Array.isArray(a)) return 'empty';
    const obj = a as Record<string, string>;
    const pairs = q.matchingPairs || [];
    if (pairs.length === 0) {
      return Object.values(obj).some(v => typeof v === 'string' && v.trim() !== '') ? 'complete' : 'empty';
    }
    const filled = pairs.filter(p => typeof obj[p.id] === 'string' && obj[p.id].trim() !== '').length;
    if (filled === 0) return 'empty';
    return filled === pairs.length ? 'complete' : 'partial';
  }
  return 'empty';
}

function isQuestionAnswered(q: CbtQuestion, a: CbtAnswerValue | undefined | null): boolean {
  return getQuestionCompletionStatus(q, a) === 'complete';
}

function checkFullscreenActive(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDocument;
  return Boolean(
    document.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

function checkFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const docEl = document.documentElement as FullscreenElement | null;
  if (!docEl) return false;
  return Boolean(
    docEl.requestFullscreen ||
    docEl.webkitRequestFullscreen ||
    docEl.mozRequestFullScreen ||
    docEl.msRequestFullscreen
  );
}

function formatWibTime(isoString?: string): string {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '-';
  return (
    d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    }) + ' WIB'
  );
}

interface CbtStudentExamRoomProps {
  exam: CbtExamPackage;
  student: Student;
  roomName: string;
  initialSession?: CbtStudentAnswerState;
  onFinishExam: (completedSession: CbtStudentAnswerState) => void;
  onExitRoom: () => void;
}

interface MatchingDropdownProps {
  value: string;
  options: string[];
  promptLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (val: string) => void;
}

function MatchingDropdown({
  value,
  options,
  promptLabel,
  placeholder = '-- Pilih Pasangan Jawaban --',
  disabled = false,
  onChange
}: MatchingDropdownProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [openUpward, setOpenUpward] = useState<boolean>(false);
  const [useMobileSheet, setUseMobileSheet] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleOpen = () => {
    if (disabled) return;
    if (!isOpen && dropdownRef.current && typeof window !== 'undefined') {
      const mobile = window.innerWidth < 640;
      setUseMobileSheet(mobile);
      if (!mobile) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const footerEl = dropdownRef.current.closest('[data-cbt-card]')?.querySelector('[data-cbt-footer]');
        const footerTop = footerEl ? footerEl.getBoundingClientRect().top : window.innerHeight;
        const effectiveBottom = Math.min(window.innerHeight - 12, footerTop - 8);
        const spaceBelow = effectiveBottom - rect.bottom;
        const spaceAbove = rect.top - 72; // beri jarak terhadap top sticky header
        setOpenUpward(spaceBelow < 210 && spaceAbove > spaceBelow);
      }
    }
    setIsOpen(prev => !prev);
  };

  const renderOptionsList = (touchLarge = false) => (
    <div className={touchLarge ? 'p-3 space-y-1.5' : 'p-1.5 space-y-0.5'}>
      <button
        type="button"
        onClick={() => {
          onChange('');
          setIsOpen(false);
        }}
        className={`w-full rounded-xl text-left font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer flex items-center justify-between gap-2 ${
          touchLarge ? 'px-3.5 py-3 text-sm border border-dashed border-slate-200' : 'px-3 py-2 text-xs'
        }`}
      >
        <span>{placeholder}</span>
        {!value && <span className="text-slate-400 shrink-0">✓</span>}
      </button>
      {options.map((opt, idx) => {
        const isSelected = value === opt;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onChange(opt);
              setIsOpen(false);
            }}
            className={`w-full rounded-xl text-left font-semibold transition cursor-pointer flex items-start justify-between gap-2 ${
              touchLarge ? 'px-3.5 py-3 text-sm' : 'px-3 py-2 text-xs'
            } ${
              isSelected
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 bg-slate-50/60 sm:bg-transparent'
            }`}
          >
            <span className="whitespace-normal wrap-break-word leading-snug">{opt}</span>
            {isSelected && <span className="font-bold shrink-0">✓</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={`relative w-full ${isOpen ? 'z-50' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        onClick={handleToggleOpen}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-xs font-semibold text-left flex items-center justify-between gap-2 transition cursor-pointer select-none ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : value
            ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-bold shadow-xs hover:border-emerald-500'
            : isOpen
              ? 'bg-white border-indigo-400 text-slate-700 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700 shadow-2xs'
          }`}
      >
        <span className="truncate min-w-0">
          {value ? (
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="text-emerald-600 font-bold shrink-0">✓</span>
              <span className="truncate">{value}</span>
            </span>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </span>
        <span className={`text-[10px] text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`}>
          ▼
        </span>
      </button>

      {/* Desktop / Tablet Popover (>= 640px) */}
      {isOpen && !disabled && !useMobileSheet && (
        <div
          className={`absolute left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl ring-1 ring-slate-900/5 max-h-56 overflow-y-auto ${openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            }`}
        >
          {renderOptionsList(false)}
        </div>
      )}

      {/* Mobile Bottom-Sheet Picker (< 640px) - Zero overlap & finger-friendly */}
      {isOpen && !disabled && useMobileSheet && (
        <div
          className="fixed inset-0 z-[80] bg-slate-900/55 backdrop-blur-xs flex items-end justify-center p-2"
          onClick={e => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-150">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  🔗 Pilih Pasangan Jawaban
                </div>
                {promptLabel && (
                  <p className="text-xs font-bold text-slate-900 mt-0.5 line-clamp-2 wrap-break-word">
                    {promptLabel}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto">{renderOptionsList(true)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CbtStudentExamRoom({
  exam,
  student,
  roomName,
  initialSession,
  onFinishExam,
  onExitRoom
}: CbtStudentExamRoomProps) {
  const isPreviewMode = roomName === 'Ruang Pratinjau Guru';

  // Realtime CBT Package Status & Schedule Sync (Active / Window Schedule / Emergency Paused)
  const [overriddenPackage, setOverriddenPackage] = useState<CbtExamPackage | null>(null);
  const currentPackage = overriddenPackage && overriddenPackage.id === exam.id ? overriddenPackage : exam;

  const questions = useMemo(
    () => (Array.isArray(currentPackage.questions) ? currentPackage.questions : []),
    [currentPackage.questions]
  );

  // Current question index (0-indexed)
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // Fallback membaca session aktif siswa dari storage jika initialSession tidak diteruskan
  const effectiveSession = useMemo(() => {
    if (initialSession) return initialSession;
    const all = getStoredStudentCbtSessions();
    const key = `${exam.id}_${student.id}`;
    if (all[key]) return all[key];
    return (
      Object.values(all).find(
        s =>
          (s.studentId === student.id ||
            (student.nisn && (s.studentNisn === student.nisn || s.studentId === student.nisn))) &&
          (!s.examId || s.examId === exam.id)
      ) || null
    );
  }, [initialSession, exam.id, student.id, student.nisn]);

  // Student answer state
  const [answers, setAnswers] = useState<Record<string, CbtAnswerValue>>(effectiveSession?.answers || {});
  const [doubtfuls, setDoubtfuls] = useState<Record<string, boolean>>(effectiveSession?.doubtfuls || {});
  const [audioPlays, setAudioPlays] = useState<Record<string, number>>(
    effectiveSession?.audioPlayCount || {}
  );
  const [violationCount, setViolationCount] = useState<number>(effectiveSession?.violationCount || 0);
  const [violationReason, setViolationReason] = useState<string>(
    effectiveSession?.violationReason || 'Terdeteksi meninggalkan lembar ujian CBT'
  );
  const [violationTime, setViolationTime] = useState<string>(effectiveSession?.violationTime || '');

  // Model CBT: Zero-Tolerance (1x Keluar = Langsung Terkunci Mati Sesuai Permintaan Sekolah)
  const [isLockedByViolation, setIsLockedByViolation] = useState<boolean>(() => {
    return !isPreviewMode && Boolean(effectiveSession?.violationCount && effectiveSession.violationCount >= 1);
  });

  const [unlockTokenInput, setUnlockTokenInput] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = useState<string | null>(null);
  const [isCheckingUnlock, setIsCheckingUnlock] = useState<boolean>(false);

  // Fullscreen states
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => checkFullscreenActive());
  const [fullscreenUnsupported, setFullscreenUnsupported] = useState<boolean>(() => !checkFullscreenSupported());
  const [fullscreenOverlayReady, setFullscreenOverlayReady] = useState<boolean>(() => checkFullscreenActive());
  const wasFullscreenRef = useRef<boolean>(checkFullscreenActive());
  const fullscreenGraceUntilRef = useRef<number>(0);

  // Time remaining in seconds
  const totalDurationSeconds = Math.max(60, (exam.durationMinutes || 60) * 60);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (effectiveSession?.startedAt && !effectiveSession?.isSubmitted) {
      const elapsed = Math.floor((Date.now() - new Date(effectiveSession.startedAt).getTime()) / 1000);
      if (!isNaN(elapsed) && elapsed >= 0) {
        return Math.max(0, totalDurationSeconds - elapsed);
      }
    }
    return totalDurationSeconds;
  });

  // UI state
  const [fontSizeClass, setFontSizeClass] = useState<'text-sm' | 'text-base' | 'text-lg'>('text-base');
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState<boolean>(false);
  const [audioLimitNotice, setAudioLimitNotice] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [toastNotice, setToastNotice] = useState<{ text: string; tone: 'success' | 'info' | 'warn' } | null>(null);
  const [autoSubmitReason, setAutoSubmitReason] = useState<string | null>(null);
  const [isCheckingReset, setIsCheckingReset] = useState<boolean>(false);
  const [resetCheckNotice, setResetCheckNotice] = useState<string | null>(null);

  const [isExamCompleted, setIsExamCompleted] = useState<boolean>(
    Boolean(effectiveSession?.isSubmitted)
  );
  const [completedResult, setCompletedResult] = useState<CbtStudentAnswerState | null>(
    effectiveSession?.isSubmitted ? effectiveSession : null
  );

  const [scheduleNow, setScheduleNow] = useState<Date>(new Date());

  const showNotice = useCallback((text: string, tone: 'success' | 'info' | 'warn' = 'info') => {
    setToastNotice({ text, tone });
    setTimeout(() => setToastNotice(prev => (prev?.text === text ? null : prev)), 4000);
  }, []);

  useEffect(() => {
    // Tick every 5 seconds to catch schedule opening/closing precisely
    const clockTimer = setInterval(() => setScheduleNow(new Date()), 5000);
    return () => clearInterval(clockTimer);
  }, []);

  const scheduleEval = useMemo(() => {
    return evaluateCbtPackageSchedule(currentPackage, scheduleNow);
  }, [currentPackage, scheduleNow]);

  const isExamPaused = currentPackage.status === 'draft' || scheduleEval.scheduleState === 'emergency_paused';

  // MUTABLE REFS (Mencegah Stale Closure pada Event Listener Anti-Curang & Auto-Submit)
  const isLockedRef = useRef<boolean>(isLockedByViolation);
  const isExamCompletedRef = useRef<boolean>(isExamCompleted);
  const isExamPausedRef = useRef<boolean>(isExamPaused);
  const answersRef = useRef<Record<string, CbtAnswerValue>>(answers);
  const doubtfulsRef = useRef<Record<string, boolean>>(doubtfuls);
  const audioPlaysRef = useRef<Record<string, number>>(audioPlays);
  const violationCountRef = useRef<number>(violationCount);
  const violationReasonRef = useRef<string>(violationReason);
  const violationTimeRef = useRef<string>(violationTime);
  const lockedAtRef = useRef<number>(
    effectiveSession?.lockedAt || (effectiveSession?.violationCount ? 1 : 0)
  );
  const unlockedAtRef = useRef<number>(effectiveSession?.unlockedAt || 0);

  useEffect(() => {
    isLockedRef.current = isLockedByViolation;
  }, [isLockedByViolation]);

  useEffect(() => {
    isExamCompletedRef.current = isExamCompleted;
  }, [isExamCompleted]);

  useEffect(() => {
    isExamPausedRef.current = isExamPaused;
  }, [isExamPaused]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    doubtfulsRef.current = doubtfuls;
  }, [doubtfuls]);

  useEffect(() => {
    audioPlaysRef.current = audioPlays;
  }, [audioPlays]);

  useEffect(() => {
    violationCountRef.current = violationCount;
  }, [violationCount]);

  useEffect(() => {
    violationReasonRef.current = violationReason;
  }, [violationReason]);

  useEffect(() => {
    violationTimeRef.current = violationTime;
  }, [violationTime]);

  // Audio playing ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const navigateToQuestion = useCallback((nextIndexOrUpdater: number | ((prev: number) => number)) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
    setAudioLimitNotice(null);
    setCurrentIdx(nextIndexOrUpdater);
  }, []);

  const startedAtRef = useRef<string>(
    (() => {
      if (effectiveSession?.startedAt && !effectiveSession?.isSubmitted) {
        const ts = new Date(effectiveSession.startedAt).getTime();
        if (!isNaN(ts)) {
          return effectiveSession.startedAt;
        }
      }
      return new Date().toISOString();
    })()
  );

  const deadlineRef = useRef<number | null>(null);
  const secondsRemainingRef = useRef<number>(secondsRemaining);
  const wasPausedRef = useRef<boolean>(isExamPaused);

  useEffect(() => {
    secondsRemainingRef.current = secondsRemaining;
  }, [secondsRemaining]);

  useEffect(() => {
    if (deadlineRef.current === null || (wasPausedRef.current && !isExamPaused)) {
      deadlineRef.current = Date.now() + secondsRemainingRef.current * 1000;
    }
    wasPausedRef.current = isExamPaused;
  }, [isExamPaused]);

  // Helper: Persist session to localStorage & server
  const persistSession = useCallback(
    (
      currentAnswers: Record<string, CbtAnswerValue>,
      currentDoubtfuls: Record<string, boolean>,
      violations: number = violationCountRef.current,
      reason: string = violationReasonRef.current,
      time: string = violationTimeRef.current,
      opts?: {
        source?: 'student_room' | 'student_violation' | 'supervisor_unlock';
        keepalive?: boolean;
        lockedAt?: number;
        unlockedAt?: number;
        audioPlayCount?: Record<string, number>;
        silentSyncBadge?: boolean;
      }
    ) => {
      if (isPreviewMode) return;
      if (!opts?.silentSyncBadge) {
        setSyncStatus('syncing');
      }
      const sessionState: CbtStudentAnswerState = {
        examId: exam.id,
        studentId: student.id,
        studentNisn: student.nisn,
        studentName: student.name,
        classId: student.classId,
        roomName: roomName,
        answers: currentAnswers,
        doubtfuls: currentDoubtfuls,
        audioPlayCount: opts?.audioPlayCount || audioPlaysRef.current,
        startedAt: startedAtRef.current,
        isSubmitted: false,
        violationCount: violations,
        violationReason: violations > 0 ? reason : undefined,
        violationTime: violations > 0 ? time : undefined,
        lockedAt: opts?.lockedAt !== undefined ? opts.lockedAt : lockedAtRef.current || undefined,
        unlockedAt: opts?.unlockedAt !== undefined ? opts.unlockedAt : unlockedAtRef.current || undefined
      };
      saveStoredStudentCbtSession(sessionState, {
        source: opts?.source || 'student_room',
        keepalive: opts?.keepalive,
        onSyncDone: ok => setSyncStatus(ok ? 'synced' : 'offline')
      });
    },
    [exam.id, student.id, student.nisn, student.name, student.classId, roomName, isPreviewMode]
  );

  // Fullscreen helper (Cross-browser mobile & desktop, graceful fallback on unsupported browsers like iOS Safari)
  const enterFullscreen = useCallback(async () => {
    try {
      const docEl = document.documentElement as FullscreenElement | null;
      if (!docEl) return;
      if (checkFullscreenActive()) {
        wasFullscreenRef.current = true;
        setIsFullscreen(true);
        return;
      }
      if (!checkFullscreenSupported()) {
        setFullscreenUnsupported(true);
        return;
      }
      fullscreenGraceUntilRef.current = Date.now() + 800;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        await docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
      wasFullscreenRef.current = true;
      setIsFullscreen(true);
    } catch (err: unknown) {
      const active = checkFullscreenActive();
      setIsFullscreen(active);
      const errName = err instanceof Error ? err.name : '';
      if (!active && (errName === 'TypeError' || errName === 'NotSupportedError' || !checkFullscreenSupported())) {
        setFullscreenUnsupported(true);
      }
    }
  }, []);

  // Helper: Reset session state cleanly (when supervisor clicks Reset)
  const resetLocalExamToFresh = useCallback(() => {
    const freshStart = new Date().toISOString();
    const freshDuration = Math.max(60, (currentPackage.durationMinutes || 60) * 60);
    startedAtRef.current = freshStart;
    deadlineRef.current = Date.now() + freshDuration * 1000;
    isExamCompletedRef.current = false;
    isLockedRef.current = false;
    lockedAtRef.current = 0;
    unlockedAtRef.current = 0;
    answersRef.current = {};
    doubtfulsRef.current = {};
    audioPlaysRef.current = {};
    violationCountRef.current = 0;
    violationReasonRef.current = '';
    violationTimeRef.current = '';

    setIsExamCompleted(false);
    setCompletedResult(null);
    setAutoSubmitReason(null);
    setAnswers({});
    setDoubtfuls({});
    setAudioPlays({});
    setViolationCount(0);
    setViolationReason('');
    setViolationTime('');
    setIsLockedByViolation(false);
    setUnlockError(null);
    setUnlockSuccess(null);
    setResetCheckNotice(null);
    setCurrentIdx(0);
    setSecondsRemaining(freshDuration);
  }, [currentPackage.durationMinutes]);

  // Real-time listener: jika Pengawas membuka kunci / mereset sesi dari meja pengawas/panitia secara remote
  const handleRemoteUnlock = useCallback(
    async (isManualClick: boolean = false) => {
      if (!isLockedRef.current && !isManualClick) {
        return;
      }

      if (isManualClick) {
        setIsCheckingUnlock(true);
        setUnlockError(null);
      }

      try {
        // 1. Cek status ke server database MariaDB
        let serverViolationCount = 0;
        let serverAnswersFound = false;
        let serverUnlockedAt = 0;
        let serverFetchOk = false;
        try {
          const res = await fetch(
            `/api/cbt/answers?examId=${encodeURIComponent(exam.id)}&nisn=${encodeURIComponent(student.nisn || student.id)}`,
            { cache: 'no-store' }
          );
          if (res.ok) {
            serverFetchOk = true;
            const json = await res.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
              serverAnswersFound = true;
              serverViolationCount = Number(json.data[0].violationCount) || 0;
              serverUnlockedAt = Number(json.data[0].unlockedAt) || 0;
            }
          }
        } catch (err) {
          console.warn('Gagal cek status remote ke server:', err);
        }

        // 2. Cek status lokal di localStorage
        const localSessions = getStoredStudentCbtSessions();
        const localKey = `${exam.id}_${student.id}`;
        const localSess =
          localSessions[localKey] ||
          Object.values(localSessions).find(
            s =>
              (s.studentId === student.id ||
                (student.nisn && (s.studentNisn === student.nisn || s.studentId === student.nisn))) &&
              (!s.examId || s.examId === exam.id)
          );

        const localWasSynced = Boolean(localSess?.violationSynced);
        const hasPendingLock = isViolationSyncPending(exam.id, student.id, student.nisn);

        // Deteksi jika pengawas mengklik RESET sesi saat siswa terkunci
        if (serverFetchOk && !serverAnswersFound && !localSess && localWasSynced) {
          resetLocalExamToFresh();
          showNotice('Sesi ujian telah di-reset oleh Pengawas. Memulai ulang dari awal.', 'info');
          if (isManualClick) {
            enterFullscreen();
          }
          return;
        }

        // Kunci HANYA boleh dibuka jika ada bukti kuat bahwa unlock terjadi SETELAH lock terakhir:
        // - Server menunjukkan violationCount === 0 DAN (serverUnlockedAt >= lockedAtRef.current ATAU violation sebelumnya sudah terkonfirmasi tersimpan di server & tidak ada pending lock)
        // - ATAU lokal menunjukkan violationCount === 0 DAN localSess.unlockedAt >= lockedAtRef.current (pengawas membuka kunci di tab/browser ini)
        const serverUnlockedAfterLock =
          serverAnswersFound &&
          serverViolationCount === 0 &&
          !hasPendingLock &&
          ((serverUnlockedAt > 0 && serverUnlockedAt >= (lockedAtRef.current || 0)) ||
            localWasSynced);

        const localUnlockedAfterLock =
          Boolean(localSess) &&
          Number(localSess?.violationCount || 0) === 0 &&
          Number(localSess?.unlockedAt || 0) >= (lockedAtRef.current || 0) &&
          Number(localSess?.unlockedAt || 0) > 0;

        if (serverUnlockedAfterLock || localUnlockedAfterLock) {
          const effectiveUnlockTs = Math.max(
            serverUnlockedAt || 0,
            Number(localSess?.unlockedAt || 0),
            Date.now()
          );
          unlockedAtRef.current = effectiveUnlockTs;
          violationCountRef.current = 0;
          violationReasonRef.current = '';
          violationTimeRef.current = '';

          if (!localSess || Number(localSess.violationCount || 0) > 0) {
            unlockStoredStudentCbtSession(exam.id, student.id, { skipCloudPush: true });
            if (student.nisn) unlockStoredStudentCbtSession(exam.id, student.nisn, { skipCloudPush: true });
          }

          setViolationCount(0);
          setViolationReason('');
          setViolationTime('');
          setUnlockError(null);

          if (isManualClick) {
            isLockedRef.current = false;
            fullscreenGraceUntilRef.current = Date.now() + 800;
            setIsLockedByViolation(false);
            enterFullscreen();
            showNotice('Kunci ujian telah dibuka oleh Pengawas! Silakan lanjutkan ujian.', 'success');
          } else {
            setUnlockSuccess('Kunci telah dibuka oleh Pengawas! Klik tombol di bawah untuk melanjutkan.');
          }
          return;
        }

        // 3. Jika belum dibuka secara sah: status tetap TERKUNCI!
        const count = Math.max(serverViolationCount || 0, localSess?.violationCount || 1, 1);
        violationCountRef.current = count;
        setViolationCount(count);
        setIsLockedByViolation(true);
        isLockedRef.current = true;
        if (isManualClick) {
          setUnlockError(
            'Status ujian Anda masih TERKUNCI. Pengawas belum membuka kunci dari Meja Pengawas, atau minta Pengawas memasukkan PIN langsung di layar ini.'
          );
        }
      } catch (e) {
        console.error('Remote unlock sync error', e);
        if (isManualClick) {
          setUnlockError('Gagal menghubungi server sekolah. Periksa koneksi atau gunakan PIN Pengawas.');
        }
      } finally {
        if (isManualClick) {
          setIsCheckingUnlock(false);
        }
      }
    },
    [exam.id, student.id, student.nisn, enterFullscreen, resetLocalExamToFresh, showNotice]
  );

  // Sync packages & listen ONLY to external/supervisor session updates (NEVER self-unlock on own save!)
  useEffect(() => {
    const handlePkgsUpdate = () => {
      const pkgs = getStoredCbtPackages();
      const updated = pkgs.find(p => p.id === exam.id);
      if (updated) {
        setOverriddenPackage(updated);
      }
    };

    const handleSyncSession = (evt: Event) => {
      const detail = (evt as CustomEvent)?.detail;
      // PENTING: Abaikan event yang dipicu oleh save/pelanggaran dari komponen ini sendiri!
      if (detail?.source === 'student_room' || detail?.source === 'student_violation') {
        return;
      }
      if (isLockedRef.current) {
        handleRemoteUnlock(false);
      }
    };

    window.addEventListener('cbtPackagesUpdated', handlePkgsUpdate);
    window.addEventListener('cbtSessionsUpdated', handleSyncSession);
    window.addEventListener('storage', handleSyncSession);

    return () => {
      window.removeEventListener('cbtPackagesUpdated', handlePkgsUpdate);
      window.removeEventListener('cbtSessionsUpdated', handleSyncSession);
      window.removeEventListener('storage', handleSyncSession);
    };
  }, [exam.id, handleRemoteUnlock]);

  // Background polling setiap 4 detik saat ujian terkunci agar pembukaan kunci dari Meja Pengawas langsung terdeteksi otomatis
  useEffect(() => {
    if (!isLockedByViolation || violationCount === 0 || isExamCompleted) return;
    const pollTimer = setInterval(() => {
      handleRemoteUnlock(false);
    }, 4000);
    return () => clearInterval(pollTimer);
  }, [isLockedByViolation, violationCount, isExamCompleted, handleRemoteUnlock]);

  // Registrasi sesi awal & rekonsiliasi status server saat pertama kali masuk ruang ujian
  const mountedInitRef = useRef<boolean>(false);
  useEffect(() => {
    if (mountedInitRef.current) return;
    mountedInitRef.current = true;

    const fsTimer = setTimeout(() => {
      setFullscreenOverlayReady(true);
    }, 180);

    if (isPreviewMode || questions.length === 0 || isExamCompletedRef.current) {
      return () => clearTimeout(fsTimer);
    }

    if (!effectiveSession) {
      saveStoredStudentCbtSession(
        {
          examId: exam.id,
          studentId: student.id,
          studentNisn: student.nisn,
          studentName: student.name,
          classId: student.classId,
          roomName: roomName,
          answers: {},
          doubtfuls: {},
          audioPlayCount: {},
          startedAt: startedAtRef.current,
          isSubmitted: false,
          violationCount: 0
        },
        {
          source: 'student_room',
          onSyncDone: ok => setSyncStatus(ok ? 'synced' : 'offline')
        }
      );
    }

    // Cek apakah di server sudah ada sesi (misal sudah dikumpulkan, terkunci di device lain, atau sudah mulai lebih dulu)
    fetch(
      `/api/cbt/answers?examId=${encodeURIComponent(exam.id)}&nisn=${encodeURIComponent(student.nisn || student.id)}`,
      { cache: 'no-store' }
    )
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (!json?.success || !Array.isArray(json.data) || json.data.length === 0) return;
        const serverRow: CbtStudentAnswerState = json.data[0];

        if (serverRow.isSubmitted) {
          saveStoredStudentCbtSession(serverRow, { source: 'cloud_sync', skipCloudPush: true });
          isExamCompletedRef.current = true;
          setCompletedResult(serverRow);
          setIsExamCompleted(true);
          return;
        }

        // Jika server mencatat pelanggaran lebih baru daripada unlock lokal terakhir
        if (
          Number(serverRow.violationCount || 0) >= 1 &&
          Number(serverRow.lockedAt || 0) >= (unlockedAtRef.current || 0) &&
          !isLockedRef.current
        ) {
          const reason = serverRow.violationReason || 'Terdeteksi meninggalkan lembar ujian CBT';
          const vTime = serverRow.violationTime || '';
          isLockedRef.current = true;
          lockedAtRef.current = serverRow.lockedAt || Date.now();
          violationCountRef.current = Number(serverRow.violationCount) || 1;
          violationReasonRef.current = reason;
          violationTimeRef.current = vTime;
          setViolationCount(violationCountRef.current);
          setViolationReason(reason);
          setViolationTime(vTime);
          setIsLockedByViolation(true);
          saveStoredStudentCbtSession(
            { ...serverRow, violationSynced: true },
            { source: 'cloud_sync', skipCloudPush: true }
          );
        }

        // Adopsi waktu mulai paling awal agar refresh/ganti perangkat tidak mereset timer
        if (serverRow.startedAt) {
          const serverStartTs = new Date(serverRow.startedAt).getTime();
          const localStartTs = new Date(startedAtRef.current).getTime();
          if (!isNaN(serverStartTs) && (isNaN(localStartTs) || serverStartTs < localStartTs)) {
            startedAtRef.current = serverRow.startedAt;
            const elapsed = Math.floor((Date.now() - serverStartTs) / 1000);
            const nextRem = Math.max(0, totalDurationSeconds - elapsed);
            deadlineRef.current = Date.now() + nextRem * 1000;
            setSecondsRemaining(nextRem);
          }
        }

        // Gabungkan jawaban dari server jika lebih lengkap
        if (
          serverRow.answers &&
          Object.keys(serverRow.answers).length > Object.keys(answersRef.current || {}).length
        ) {
          answersRef.current = serverRow.answers;
          setAnswers(serverRow.answers);
          if (serverRow.doubtfuls) {
            doubtfulsRef.current = serverRow.doubtfuls;
            setDoubtfuls(serverRow.doubtfuls);
          }
          if (serverRow.audioPlayCount) {
            audioPlaysRef.current = serverRow.audioPlayCount;
            setAudioPlays(serverRow.audioPlayCount);
          }
        }
      })
      .catch(() => { });

    return () => clearTimeout(fsTimer);
  }, [
    exam.id,
    student.id,
    student.nisn,
    student.name,
    student.classId,
    roomName,
    effectiveSession,
    isPreviewMode,
    questions.length,
    totalDurationSeconds
  ]);

  // Submission handler (SELALU membaca REF agar bebas stale closure!)
  const handleConfirmSubmit = useCallback(
    (autoReason?: string) => {
      if (isExamCompletedRef.current) return;
      isExamCompletedRef.current = true;

      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      }

      const finalAnswers = answersRef.current;
      const finalDoubtfuls = doubtfulsRef.current;
      const finalAudioPlays = audioPlaysRef.current;
      const { finalScore, correctCount, wrongCount, isPassed } = gradeCbtAnswers(
        currentPackage,
        finalAnswers
      );

      const completedSession: CbtStudentAnswerState = {
        examId: exam.id,
        studentId: student.id,
        studentNisn: student.nisn,
        studentName: student.name,
        classId: student.classId,
        roomName: roomName,
        answers: finalAnswers,
        doubtfuls: finalDoubtfuls,
        audioPlayCount: finalAudioPlays,
        startedAt: startedAtRef.current,
        submittedAt: new Date().toISOString(),
        isSubmitted: true,
        score: finalScore,
        totalScore: 100,
        correctCount: correctCount,
        wrongCount: wrongCount,
        isPassed: isPassed,
        violationCount: violationCountRef.current,
        violationReason: violationCountRef.current > 0 ? violationReasonRef.current : undefined,
        violationTime: violationCountRef.current > 0 ? violationTimeRef.current : undefined
      };

      if (!isPreviewMode) {
        saveStoredStudentCbtSession(completedSession, {
          source: 'student_room',
          keepalive: true,
          onSyncDone: ok => setSyncStatus(ok ? 'synced' : 'offline')
        });
      }

      setAutoSubmitReason(autoReason || null);
      setCompletedResult(completedSession);
      setIsExamCompleted(true);
      setShowSubmitModal(false);
      setIsLockedByViolation(false);
      isLockedRef.current = false;
      onFinishExam(completedSession);
    },
    [currentPackage, exam.id, student.id, student.nisn, student.name, student.classId, roomName, isPreviewMode, onFinishExam]
  );

  const handleConfirmSubmitRef = useRef(handleConfirmSubmit);
  useEffect(() => {
    handleConfirmSubmitRef.current = handleConfirmSubmit;
  }, [handleConfirmSubmit]);

  // 1. Wall-clock Timer countdown (Automatically frozen when exam is paused)
  useEffect(() => {
    if (isExamCompleted || isExamPaused || questions.length === 0) return;

    if (deadlineRef.current === null) {
      deadlineRef.current = Date.now() + secondsRemainingRef.current * 1000;
    }

    const timer = setInterval(() => {
      const targetDeadline = deadlineRef.current ?? Date.now();
      const next = Math.max(0, Math.ceil((targetDeadline - Date.now()) / 1000));
      setSecondsRemaining(next);
    }, 500);

    return () => clearInterval(timer);
  }, [isExamCompleted, isExamPaused, questions.length]);

  // Auto-submit saat waktu pengerjaan habis (bebas side-effect di state updater)
  useEffect(() => {
    if (!isExamCompleted && !isExamPaused && !isPreviewMode && questions.length > 0 && secondsRemaining <= 0) {
      handleConfirmSubmitRef.current('Waktu pengerjaan ujian Anda telah habis.');
    }
  }, [secondsRemaining, isExamCompleted, isExamPaused, isPreviewMode, questions.length]);

  // Otomatis kumpulkan jawaban saat batas akhir jam sesi resmi ujian (endTime) telah tercapai
  useEffect(() => {
    if (!isExamCompleted && !isPreviewMode && questions.length > 0 && scheduleEval.scheduleState === 'expired') {
      handleConfirmSubmitRef.current(
        `Batas waktu sesi resmi ujian telah berakhir (${currentPackage.endTime || 'Jadwal ditutup'}).`
      );
    }
  }, [scheduleEval.scheduleState, isExamCompleted, isPreviewMode, questions.length, currentPackage.endTime]);

  // Helper: Trigger Violation with ZERO-TOLERANCE (Sekali Keluar = Langsung Terkunci Mati!)
  // Menggunakan REF agar selalu membaca kondisi terkini dan kebal terhadap stale closure
  const triggerViolation = useCallback(
    (reasonText: string) => {
      if (isPreviewMode || isExamCompletedRef.current || isExamPausedRef.current || isLockedRef.current) {
        return;
      }

      // Tandai langsung di REF secara sinkron agar panggilan serentak tidak terdobel
      isLockedRef.current = true;
      const nowTs = Date.now();
      lockedAtRef.current = nowTs;

      const timeStr =
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Jakarta'
        }) + ' WIB';

      violationCountRef.current = 1;
      violationReasonRef.current = reasonText;
      violationTimeRef.current = timeStr;

      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      }

      setShowSubmitModal(false);
      setZoomImageUrl(null);
      setShowInstructionsModal(false);
      setUnlockError(null);
      setUnlockSuccess(null);
      setViolationReason(reasonText);
      setViolationTime(timeStr);
      setViolationCount(1);
      setIsLockedByViolation(true);

      persistSession(answersRef.current, doubtfulsRef.current, 1, reasonText, timeStr, {
        source: 'student_violation',
        keepalive: true,
        lockedAt: nowTs
      });
    },
    [isPreviewMode, persistSession]
  );

  // Helper: Supervisor Unlock Logic (PIN Pengawas Ruangan: SPENTIC2026)
  const handleUnlockExam = () => {
    const cleanInput = unlockTokenInput.trim().toUpperCase();

    if (!cleanInput) {
      setUnlockError('Harap masukkan PIN Rahasia Pengawas!');
      return;
    }

    if (cleanInput === exam.token.toUpperCase().trim()) {
      setUnlockError('❌ Token Ujian papan tulis TIDAK BISA digunakan untuk membuka pelanggaran! Panggil Pengawas Ruangan Anda.');
      return;
    }

    if (cleanInput === 'SPENTIC2026') {
      const nowTs = Date.now();
      unlockedAtRef.current = nowTs;
      isLockedRef.current = false;
      violationCountRef.current = 0;
      violationReasonRef.current = '';
      violationTimeRef.current = '';

      setIsLockedByViolation(false);
      setViolationCount(0);
      setViolationReason('');
      setViolationTime('');
      setUnlockTokenInput('');
      setUnlockError(null);
      setUnlockSuccess(null);

      // Bersihkan status pelanggaran secara lokal & kirim 1 sinkronisasi resmi ke server
      unlockStoredStudentCbtSession(exam.id, student.id, { skipCloudPush: true });
      if (student.nisn) unlockStoredStudentCbtSession(exam.id, student.nisn, { skipCloudPush: true });
      persistSession(answersRef.current, doubtfulsRef.current, 0, '', '', {
        source: 'supervisor_unlock',
        unlockedAt: nowTs
      });

      // Beri tenggang transisi fullscreen 800ms agar requestFullscreen tidak memicu false alarm
      fullscreenGraceUntilRef.current = Date.now() + 800;
      enterFullscreen();
      showNotice('Kunci ujian dibuka oleh Pengawas. Silakan lanjutkan pengerjaan.', 'success');
    } else {
      setUnlockError('❌ PIN Pengawas salah! Hanya Guru Pengawas yang berhak membuka lembar ujian ini.');
    }
  };

  // 2. Anti-Cheating: Window blur (Alt+Tab) / tab switch / pagehide / fullscreen & key detection
  useEffect(() => {
    if (isExamCompleted || isPreviewMode || questions.length === 0) return;

    // Sinkronkan status fullscreen & masa tenggang inisialisasi fullscreen saat mount
    const initialFs = checkFullscreenActive();
    if (initialFs) {
      wasFullscreenRef.current = true;
      fullscreenGraceUntilRef.current = 0;
    } else if (fullscreenGraceUntilRef.current === 0) {
      fullscreenGraceUntilRef.current = Date.now() + 800;
    }

    // 1. Deteksi saat tab browser disembunyikan / berganti tab (INSTAN 0ms TANPA GRACE PERIOD)
    const handleVisibilityChange = () => {
      if (isExamCompletedRef.current || isExamPausedRef.current || isLockedRef.current) return;
      if (document.hidden) {
        triggerViolation('Pindah Tab Browser / Minimize Aplikasi (Terindikasi Membuka Layar Lain)');
      }
    };

    // 2. Deteksi saat menutup tab / pindah URL / navigasi keluar (INSTAN + KEEPALIVE POST)
    const handlePageHide = () => {
      if (isExamCompletedRef.current || isExamPausedRef.current || isLockedRef.current) return;
      triggerViolation('Menutup atau Meninggalkan Halaman Ujian CBT');
    };

    // 3. Deteksi saat jendela browser kehilangan fokus (Alt+Tab, klik aplikasi luar)
    const handleWindowBlur = () => {
      if (isExamCompletedRef.current || isExamPausedRef.current || isLockedRef.current) return;
      if (document.hidden) {
        triggerViolation('Pindah Tab Browser (Terindikasi Searching / Tab Baru)');
        return;
      }
      if (Date.now() < fullscreenGraceUntilRef.current) return;
      triggerViolation('Jendela Kehilangan Fokus (Membuka Aplikasi / Jendela Lain)');
    };

    // 4. Deteksi aktif berkala (Heartbeat Monitor Cepat - setiap 250ms)
    const focusHeartbeat = setInterval(() => {
      if (isExamCompletedRef.current || isExamPausedRef.current || isLockedRef.current) return;

      if (document.hidden) {
        triggerViolation('Pindah Tab Browser (Terindikasi Searching / Tab Baru)');
        return;
      }
      if (Date.now() < fullscreenGraceUntilRef.current) return;
      if (!document.hasFocus()) {
        triggerViolation('Jendela Tidak Aktif (Membuka Aplikasi Lain di Depan Layar)');
      }
    }, 250);

    // 5. Deteksi keluar dari Mode Layar Penuh
    const handleFullscreenChange = () => {
      const active = checkFullscreenActive();
      setIsFullscreen(active);
      if (active) {
        wasFullscreenRef.current = true;
        fullscreenGraceUntilRef.current = 0;
        setFullscreenUnsupported(false);
        return;
      }
      if (isExamCompletedRef.current || isExamPausedRef.current || isLockedRef.current) return;
      if (wasFullscreenRef.current || Date.now() >= fullscreenGraceUntilRef.current) {
        triggerViolation('Keluar dari Mode Layar Penuh (Menekan tombol Esc / Minimize)');
      }
    };

    // 6. Deteksi Layar Belah (Split Screen / Multi-Window di HP Android / Tablet)
    const handleResizeOrSplitScreen = () => {
      if (isExamCompletedRef.current || isExamPausedRef.current || isLockedRef.current) return;
      if (Date.now() < fullscreenGraceUntilRef.current) return;
      if (typeof window !== 'undefined' && window.screen) {
        const screenH = window.screen.availHeight || window.screen.height;
        const screenW = window.screen.availWidth || window.screen.width;
        const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');
        if (!isTyping && screenH > 500 && window.innerHeight < screenH * 0.52) {
          triggerViolation('Menggunakan Layar Belah (Split Screen / Multi-Window di HP)');
        } else if (!isTyping && screenW >= 700 && !checkFullscreenActive() && window.innerWidth < screenW * 0.58) {
          triggerViolation('Menggunakan Layar Belah Horizontal (Multi-Window)');
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyLower = e.key.toLowerCase();

      // Selalu blokir DevTools & PrintScreen bahkan saat terkunci
      if (e.key === 'F12' || e.key === 'PrintScreen') {
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(keyLower)) {
        e.preventDefault();
        return;
      }

      // Saat terkunci, izinkan mengetik PIN pada input pengawas
      if (isLockedRef.current) {
        return;
      }

      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && ['u', 'p', 's', 'r', 'c', 'v', 'x', 'a', 'f'].includes(keyLower))) {
        e.preventDefault();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        triggerViolation('Menekan Tombol Esc (Keluar dari Mode Layar Penuh)');
      } else if (e.key === 'Meta') {
        e.preventDefault();
        triggerViolation('Menekan Tombol Windows / Command (Membuka Menu Aplikasi Luar)');
      } else if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        triggerViolation('Melakukan Alt+Tab (Pindah ke Aplikasi Lain di Laptop)');
      } else if (
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName || '')
      ) {
        if (e.key === 'ArrowLeft') {
          navigateToQuestion(prev => Math.max(0, prev - 1));
        } else if (e.key === 'ArrowRight') {
          navigateToQuestion(prev => Math.min(questions.length - 1, prev + 1));
        }
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isExamCompletedRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };

    // Anti-Copy, Anti-Cut, Anti-Paste & Anti-Drag (kecuali di input PIN saat terkunci)
    const handleBlockClipboard = (e: Event) => {
      if (isLockedRef.current && ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName || '')) {
        return;
      }
      e.preventDefault();
    };

    // Anti-Back Navigation (Android back button, iOS swipe-back, desktop Back button)
    try {
      window.history.pushState({ cbtRoom: true }, '', window.location.href);
    } catch { }

    const handlePopState = () => {
      try {
        window.history.pushState({ cbtRoom: true }, '', window.location.href);
      } catch { }
      if (!isExamCompletedRef.current && !isExamPausedRef.current && !isLockedRef.current) {
        triggerViolation('Menekan Tombol Kembali (Navigasi Mundur di HP/Browser)');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('resize', handleResizeOrSplitScreen);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('copy', handleBlockClipboard);
    window.addEventListener('cut', handleBlockClipboard);
    window.addEventListener('paste', handleBlockClipboard);
    window.addEventListener('selectstart', handleBlockClipboard);
    window.addEventListener('dragstart', handleBlockClipboard);

    return () => {
      clearInterval(focusHeartbeat);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('resize', handleResizeOrSplitScreen);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('copy', handleBlockClipboard);
      window.removeEventListener('cut', handleBlockClipboard);
      window.removeEventListener('paste', handleBlockClipboard);
      window.removeEventListener('selectstart', handleBlockClipboard);
      window.removeEventListener('dragstart', handleBlockClipboard);
    };
  }, [isExamCompleted, isPreviewMode, questions.length, triggerViolation, navigateToQuestion]);

  // 3. Format timer: HH:MM:SS
  const formattedTime = useMemo(() => {
    const hours = Math.floor(secondsRemaining / 3600);
    const mins = Math.floor((secondsRemaining % 3600) / 60);
    const secs = secondsRemaining % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${hours > 0 ? pad(hours) + ':' : ''}${pad(mins)}:${pad(secs)}`;
  }, [secondsRemaining]);

  const isLowTime = secondsRemaining <= 300; // < 5 mins
  const currentQuestion = questions[currentIdx] || questions[0];

  const currentMatchingMeta = useMemo(() => {
    if (!currentQuestion || currentQuestion.type !== 'menjodohkan' || !currentQuestion.matchingPairs) {
      return {
        matchObj: {} as Record<string, string>,
        availableOptions: [] as string[],
        totalPairs: 0,
        matchedPairsCount: 0
      };
    }
    const rawMatch = answers[currentQuestion.id];
    const matchObj =
      typeof rawMatch === 'object' && rawMatch !== null && !Array.isArray(rawMatch)
        ? (rawMatch as Record<string, string>)
        : {};
    const availableOptions = Array.from(
      new Set(
        currentQuestion.matchingPairs
          .map(p => p.rightMatch?.trim())
          .filter((val): val is string => Boolean(val))
      )
    );
    const totalPairs = currentQuestion.matchingPairs.length;
    const matchedPairsCount = currentQuestion.matchingPairs.filter(
      p => typeof matchObj[p.id] === 'string' && matchObj[p.id].trim() !== ''
    ).length;
    return { matchObj, availableOptions, totalPairs, matchedPairsCount };
  }, [answers, currentQuestion]);

  // Answer handler for PG (Single)
  const handleSelectPgOption = (optionIdx: number) => {
    if (isLockedRef.current || isLockedByViolation || !currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.id]: optionIdx };
    setAnswers(newAnswers);
    answersRef.current = newAnswers;
    persistSession(newAnswers, doubtfuls);
  };

  // Answer handler for PG Kompleks (Multi Checkbox)
  const handleTogglePgKompleks = (optionIdx: number) => {
    if (isLockedRef.current || isLockedByViolation || !currentQuestion) return;
    const raw = answers[currentQuestion.id];
    const currentList: number[] = Array.isArray(raw) ? raw : [];
    const updatedList = currentList.includes(optionIdx)
      ? currentList.filter(i => i !== optionIdx)
      : [...currentList, optionIdx].sort((a, b) => a - b);
    const newAnswers = { ...answers, [currentQuestion.id]: updatedList };
    setAnswers(newAnswers);
    answersRef.current = newAnswers;
    persistSession(newAnswers, doubtfuls);
  };

  // Answer handler for Benar / Salah
  const handleSelectBenarSalah = (statementId: string, value: boolean) => {
    if (isLockedRef.current || isLockedByViolation || !currentQuestion) return;
    const raw = answers[currentQuestion.id];
    const currentObj: Record<string, boolean> =
      typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Record<string, boolean>) : {};
    const updatedObj = { ...currentObj, [statementId]: value };
    const newAnswers = { ...answers, [currentQuestion.id]: updatedObj };
    setAnswers(newAnswers);
    answersRef.current = newAnswers;
    persistSession(newAnswers, doubtfuls);
  };

  // Answer handler for Menjodohkan
  const handleSelectMenjodohkan = (matchingId: string, rightValue: string) => {
    if (isLockedRef.current || isLockedByViolation || !currentQuestion) return;
    const raw = answers[currentQuestion.id];
    const currentObj: Record<string, string> =
      typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Record<string, string>) : {};
    const updatedObj = { ...currentObj, [matchingId]: rightValue };
    const newAnswers = { ...answers, [currentQuestion.id]: updatedObj };
    setAnswers(newAnswers);
    answersRef.current = newAnswers;
    persistSession(newAnswers, doubtfuls);
  };

  // Toggle Ragu-Ragu
  const handleToggleDoubtful = () => {
    if (isLockedRef.current || isLockedByViolation || !currentQuestion) return;
    const isCurrentlyDoubtful = Boolean(doubtfuls[currentQuestion.id]);
    const newDoubtfuls = { ...doubtfuls, [currentQuestion.id]: !isCurrentlyDoubtful };
    setDoubtfuls(newDoubtfuls);
    doubtfulsRef.current = newDoubtfuls;
    persistSession(answers, newDoubtfuls);
  };

  // Audio Play Handler with Max Plays Protection & Persistence
  const handlePlayAudio = () => {
    if (isLockedRef.current || isLockedByViolation || !currentQuestion) return;
    const qId = currentQuestion.id;
    const currentPlays = audioPlays[qId] || 0;
    const maxPlays = currentQuestion.audioMaxPlays || 3;

    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
        return;
      }
      if (currentPlays >= maxPlays) {
        setAudioLimitNotice(`Batas pemutaran audio untuk soal ini telah maksimal (${maxPlays} kali).`);
        setTimeout(() => setAudioLimitNotice(null), 4000);
        return;
      }
      audioRef.current.play().catch(() => { });
      setIsPlayingAudio(true);
      const nextPlays = currentPlays + 1;
      const newAudioPlays = { ...audioPlays, [qId]: nextPlays };
      setAudioPlays(newAudioPlays);
      audioPlaysRef.current = newAudioPlays;
      persistSession(answersRef.current, doubtfulsRef.current, violationCountRef.current, violationReasonRef.current, violationTimeRef.current, {
        audioPlayCount: newAudioPlays
      });
    }
  };

  // Calculation of progress
  const answeredCount = useMemo(() => {
    return questions.filter(q => isQuestionAnswered(q, answers[q.id])).length;
  }, [answers, questions]);

  const unansweredIndices = useMemo(() => {
    return questions
      .map((q, idx) => (!isQuestionAnswered(q, answers[q.id]) ? idx : -1))
      .filter(idx => idx !== -1);
  }, [answers, questions]);

  const doubtfulCount = useMemo(() => {
    return questions.filter(q => Boolean(doubtfuls[q.id])).length;
  }, [doubtfuls, questions]);

  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  // Cek status reset dari Pengawas pada halaman Selesai
  const handleCheckResetFromCompleted = async () => {
    setIsCheckingReset(true);
    setResetCheckNotice(null);
    try {
      let serverHasSubmitted = false;
      let serverFetchSucceeded = false;

      try {
        const res = await fetch(
          `/api/cbt/answers?examId=${encodeURIComponent(exam.id)}&nisn=${encodeURIComponent(student.nisn || student.id)}`,
          { cache: 'no-store' }
        );
        if (res.ok) {
          serverFetchSucceeded = true;
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            serverHasSubmitted = Boolean(json.data[0].isSubmitted);
          }
        }
      } catch { }

      const sessions = getStoredStudentCbtSessions();
      const key = `${exam.id}_${student.id}`;
      const localSess =
        sessions[key] ||
        Object.values(sessions).find(
          s =>
            (s.studentId === student.id ||
              (student.nisn && (s.studentNisn === student.nisn || s.studentId === student.nisn))) &&
            (!s.examId || s.examId === exam.id)
        );

      const isResetOnServer = serverFetchSucceeded && !serverHasSubmitted;
      const isResetLocally = !localSess || !localSess.isSubmitted;

      if (isResetOnServer || (!serverFetchSucceeded && isResetLocally)) {
        resetStoredStudentCbtSession(exam.id, student.id);
        if (student.nisn) resetStoredStudentCbtSession(exam.id, student.nisn);
        resetLocalExamToFresh();
        enterFullscreen();
        showNotice('Sesi ujian telah di-reset oleh Pengawas! Membuka kembali lembar ujian...', 'success');
      } else {
        setResetCheckNotice(
          'Sesi ujian ini masih berstatus "Telah Dikumpulkan" di server sekolah. Pastikan Pengawas telah mengklik tombol "Reset" pada nama Anda di Meja Pengawas.'
        );
      }
    } finally {
      setIsCheckingReset(false);
    }
  };

  // -------------------------------------------------------------
  // JIKA PAKET UJIAN BELUM MEMILIKI SOAL
  // -------------------------------------------------------------
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 mx-auto flex items-center justify-center text-3xl">
            📝
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white">{exam.title}</h2>
            <p className="text-xs text-slate-400">
              Paket ujian ini belum memiliki butir soal yang dipublikasikan oleh guru pengampu.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (checkFullscreenActive() && document.exitFullscreen) {
                document.exitFullscreen().catch(() => { });
              }
              onExitRoom();
            }}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Kembali ke Beranda E-Learning
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // JIKA SISWA SUDAH SELESAI MENGERJAKAN (TAMPILAN SELESAI)
  // -------------------------------------------------------------
  if (isExamCompleted && completedResult) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center text-3xl">
            ✓
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              UJIAN BERHASIL DIKUMPULKAN
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">{exam.title}</h2>
            <p className="text-xs text-slate-400 mt-1">
              SMP Negeri 3 Cihampelas • {exam.subject}
            </p>
          </div>

          {autoSubmitReason && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-medium">
              ⏱️ Pengumpulan otomatis: {autoSubmitReason}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/80 text-left space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Nama Siswa:</span>
              <span className="font-bold text-white">{student.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">NISN / Kelas:</span>
              <span className="font-mono text-slate-300">
                {student.nisn} ({student.classId})
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Ruang Ujian:</span>
              <span className="text-slate-200">{roomName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Waktu Pengumpulan:</span>
              <span className="font-mono text-slate-300">
                {formatWibTime(completedResult.submittedAt)}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Perolehan Skor:</span>
              <span className="font-mono font-black text-emerald-300">
                {completedResult.score ?? 0} / 100
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">Status Ketuntasan:</span>
              <span className={`font-bold ${completedResult.isPassed ? 'text-emerald-400' : 'text-amber-400'}`}>
                {completedResult.isPassed ? '✓ Memenuhi KKM' : 'Perlu Evaluasi Guru'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs text-center leading-relaxed">
            Jawaban Anda telah tersimpan aman di server sekolah. Terima kasih telah mengikuti ujian dengan tertib dan jujur.
          </div>

          {resetCheckNotice && (
            <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-200 text-[11px] leading-relaxed">
              ℹ️ {resetCheckNotice}
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                if (checkFullscreenActive() && document.exitFullscreen) {
                  document.exitFullscreen().catch(() => { });
                }
                onExitRoom();
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-98"
            >
              Kembali ke Beranda E-Learning
            </button>

            <button
              type="button"
              disabled={isCheckingReset}
              onClick={handleCheckResetFromCompleted}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-600 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <span>{isCheckingReset ? '⏳' : '🔄'}</span>
              <span>
                {isCheckingReset ? 'Memeriksa Status ke Server...' : 'Cek Status Reset Pengawas / Kerjakan Ulang'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TAMPILAN RUANG UJIAN CBT AKTIF (FOCUS MODE)
  // -------------------------------------------------------------
  return (
    <div
      className="min-h-screen bg-slate-100 flex flex-col font-sans select-none"
      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      {/* Non-blocking Toast Banner */}
      {toastNotice && (
        <div className="fixed top-16 right-4 z-[90] max-w-sm animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-none">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-xl border text-xs font-bold flex items-center gap-2 ${toastNotice.tone === 'success'
              ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
              : toastNotice.tone === 'warn'
                ? 'bg-amber-950/95 border-amber-500 text-amber-200'
                : 'bg-slate-900/95 border-slate-700 text-slate-200'
              }`}
          >
            <span>
              {toastNotice.tone === 'success' ? '✓' : toastNotice.tone === 'warn' ? '⚠️' : 'ℹ️'}
            </span>
            <span>{toastNotice.text}</span>
          </div>
        </div>
      )}

      {/* 1. TOP BAR CBT (STATUS & TIMER) */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Left: Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-sm text-indigo-400 shrink-0">
              💻
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  CBT SPENTIC
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {roomName}
                </span>
                {!isPreviewMode && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 font-semibold ${syncStatus === 'synced'
                      ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                      : syncStatus === 'syncing'
                        ? 'bg-amber-950/70 border-amber-700/60 text-amber-300'
                        : 'bg-orange-950/70 border-orange-700/60 text-orange-300'
                      }`}
                    title={
                      syncStatus === 'synced'
                        ? 'Jawaban tersinkronisasi aman ke server'
                        : syncStatus === 'syncing'
                          ? 'Sedang menyimpan jawaban...'
                          : 'Mode lokal aktif (jawaban aman di perangkat)'
                    }
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced'
                        ? 'bg-emerald-400'
                        : syncStatus === 'syncing'
                          ? 'bg-amber-400 animate-ping'
                          : 'bg-orange-400'
                        }`}
                    />
                    <span>
                      {syncStatus === 'synced'
                        ? 'Tersimpan'
                        : syncStatus === 'syncing'
                          ? 'Menyimpan...'
                          : 'Cache Lokal'}
                    </span>
                  </span>
                )}
              </div>
              <h1 className="text-sm font-bold text-slate-100 truncate max-w-sm sm:max-w-md">
                {exam.title}
              </h1>
            </div>
          </div>

          {/* Right: Student Profile & Countdown Timer */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-wrap">
            {/* Student info */}
            <div className="hidden md:block text-right">
              <div className="text-xs font-bold text-white truncate max-w-[160px]">{student.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">
                NISN: {student.nisn} ({student.classId})
              </div>
            </div>

            {/* Instructions Button */}
            {currentPackage.instructions && (
              <button
                type="button"
                onClick={() => setShowInstructionsModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
                title="Lihat Tata Tertib & Petunjuk Ujian"
              >
                ℹ️ Petunjuk
              </button>
            )}

            {/* Font Adjuster Buttons */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setFontSizeClass('text-sm')}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${fontSizeClass === 'text-sm' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                title="Font Lebih Kecil"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSizeClass('text-base')}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${fontSizeClass === 'text-base' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                title="Font Normal"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSizeClass('text-lg')}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${fontSizeClass === 'text-lg' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                title="Font Lebih Besar"
              >
                A+
              </button>
            </div>

            {/* FULLSCREEN BUTTON */}
            {!isFullscreen && !fullscreenUnsupported && !isExamCompleted && (
              <button
                type="button"
                onClick={enterFullscreen}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-bold text-xs transition cursor-pointer"
                title="Buka Layar Penuh"
              >
                <span>⛶</span>
                <span>Layar Penuh</span>
              </button>
            )}

            {/* VIOLATION COUNTER BADGE */}
            {violationCount > 0 && (
              <div className="px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold bg-rose-950 border-rose-500 text-rose-300 animate-pulse">
                <span>🔒</span>
                <span>Terkunci (Terdeteksi Keluar)</span>
              </div>
            )}

            {/* SESSION SCHEDULE BADGE */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
              <span className="text-sm text-amber-400">🕒</span>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-sans leading-none">
                  Sesi Ujian
                </div>
                <div className="text-xs font-bold text-slate-200 font-mono leading-none mt-0.5">
                  {currentPackage.startTime || '06:00'} - {currentPackage.endTime || '23:59'} WIB
                </div>
              </div>
            </div>

            {/* COUNTDOWN TIMER BADGE */}
            <div
              className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono font-bold text-xs shadow-inner ${isLowTime
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-emerald-400'
                }`}
            >
              <span className="text-sm">⏱️</span>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-sans leading-none">
                  Sisa Waktu
                </div>
                <div className="text-sm font-black leading-none mt-0.5">{formattedTime}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY SECTION (RESPONSIVE 12-COL GRID FIT TO VIEWPORT) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-stretch">
        {/* KOLOM KIRI (9/12): LEMBAR SOAL */}
        <section className="lg:col-span-9 flex flex-col relative z-20">
          <div
            data-cbt-card="true"
            className="flex-1 lg:min-h-[calc(100vh-7.5rem)] bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col justify-between gap-5 relative select-none"
          >
            {/* DYNAMIC WATERMARK (ANTI-SCREENSHOT & ANTI-BOCOR SOAL) */}
            <div
              className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden rounded-2xl"
              aria-hidden="true"
            >
              <div className="w-full h-full flex flex-wrap items-center justify-around gap-y-12 gap-x-10 p-4 opacity-[0.055] sm:opacity-[0.065] rotate-[-18deg] scale-110">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="text-center font-black tracking-widest text-slate-900 text-xs sm:text-sm uppercase leading-tight font-mono select-none"
                  >
                    <div>SMP NEGERI 3 CIHAMPELAS</div>
                    <div className="text-rose-900 font-extrabold">
                      {student.name} • NISN: {student.nisn}
                    </div>
                    <div>
                      KELAS {student.classId} • {roomName}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-20 space-y-4 sm:space-y-5">
            {/* Header Soal (Nomor & Tipe Soal) */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono font-black text-sm shadow-xs">
                  Soal No. {currentIdx + 1}
                </span>
                <span className="text-xs text-slate-400 font-medium">dari {questions.length} soal</span>
              </div>

              {/* Tipe Soal Badge */}
              <div>
                {currentQuestion.type === 'pg' && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                    Pilihan Ganda
                  </span>
                )}
                {currentQuestion.type === 'pg_kompleks' && (
                  <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                    ☑️ PG Kompleks (Pilih Lebih Dari 1)
                  </span>
                )}
                {currentQuestion.type === 'benar_salah' && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                    ⚖️ Benar / Salah
                  </span>
                )}
                {currentQuestion.type === 'menjodohkan' && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                    🔗 Menjodohkan Pasangan
                  </span>
                )}
              </div>
            </div>

            {/* MULTIMEDIA STIMULUS (GAMBAR, AUDIO, ATAU VIDEO) */}
            {currentQuestion.mediaType === 'image' && currentQuestion.mediaUrl && (
              <div className="relative z-10 space-y-2">
                <div
                  className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer group relative max-h-72 flex items-center justify-center"
                  onClick={() => setZoomImageUrl(currentQuestion.mediaUrl!)}
                >
                  <img
                    src={currentQuestion.mediaUrl}
                    alt={currentQuestion.mediaCaption || 'Stimulus Soal'}
                    className="max-h-72 w-auto object-contain mx-auto transition group-hover:scale-[1.02]"
                  />
                  <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-medium flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                    <span>🔍 Klik untuk Perbesar</span>
                  </div>
                </div>
                {currentQuestion.mediaCaption && (
                  <p className="text-xs text-slate-500 italic text-center">{currentQuestion.mediaCaption}</p>
                )}
              </div>
            )}

            {currentQuestion.mediaType === 'audio' && currentQuestion.mediaUrl && (
              <div className="relative z-10 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                      🎧
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-indigo-900">
                        {currentQuestion.mediaCaption || 'Seksi Listening / Menyimak Audio'}
                      </h4>
                      <p className="text-[11px] text-indigo-600">Dengarkan audio percakapan dengan seksama</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-200">
                    Sisa Putar: {Math.max(0, (currentQuestion.audioMaxPlays || 3) - (audioPlays[currentQuestion.id] || 0))} kali
                  </span>
                </div>

                {/* Audio Element & Controls */}
                <audio
                  ref={audioRef}
                  src={currentQuestion.mediaUrl}
                  onEnded={() => setIsPlayingAudio(false)}
                  className="hidden"
                />

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handlePlayAudio}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-sm ${isPlayingAudio
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                  >
                    <span>{isPlayingAudio ? '⏸️ Jeda Audio' : '▶️ Putar Audio Listening'}</span>
                  </button>
                  <span className="text-[11px] text-slate-500">
                    {isPlayingAudio ? 'Sedang memutar suara...' : 'Klik tombol untuk mendengarkan.'}
                  </span>
                </div>
                {audioLimitNotice && (
                  <p className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg mt-1 inline-block">
                    ⚠️ {audioLimitNotice}
                  </p>
                )}
              </div>
            )}

            {currentQuestion.mediaType === 'video' && currentQuestion.mediaUrl && (
              <div className="relative z-10 space-y-2">
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950">
                  <video
                    src={currentQuestion.mediaUrl}
                    controls
                    controlsList="nodownload"
                    disablePictureInPicture
                    className="w-full max-h-80 mx-auto"
                  />
                </div>
                {currentQuestion.mediaCaption && (
                  <p className="text-xs text-slate-500 italic text-center">{currentQuestion.mediaCaption}</p>
                )}
              </div>
            )}

            {/* TEKS SOAL */}
            <div className={`relative z-10 text-slate-800 leading-relaxed font-normal whitespace-pre-line ${fontSizeClass}`}>
              {currentQuestion.question}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* AREA INPUT JAWABAN (SESUAI TIPE SOAL) */}
            {/* ------------------------------------------------------------- */}

            {/* 1. PILIHAN GANDA (SINGLE CHOICE) */}
            {currentQuestion.type === 'pg' && currentQuestion.options && (
              <div className="relative z-10 space-y-2.5 pt-2">
                {currentQuestion.options.map((opt, optIdx) => {
                  const isSelected = answers[currentQuestion.id] === optIdx;
                  const letter = String.fromCharCode(65 + optIdx);

                  return (
                    <button
                      type="button"
                      key={optIdx}
                      onClick={() => handleSelectPgOption(optIdx)}
                      className={`w-full text-left p-3.5 rounded-xl border-2 transition cursor-pointer flex items-center gap-3.5 ${isSelected
                        ? 'bg-indigo-50/80 border-indigo-600 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition shrink-0 ${isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                      >
                        {letter}
                      </div>
                      <span
                        className={`flex-1 ${fontSizeClass} ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'
                          }`}
                      >
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. PG KOMPLEKS (MULTI CHECKBOX) */}
            {currentQuestion.type === 'pg_kompleks' && currentQuestion.options && (
              <div className="relative z-10 space-y-2.5 pt-2">
                <p className="text-xs text-purple-700 font-semibold mb-2">
                  ℹ️ Anda dapat memilih lebih dari satu jawaban yang benar:
                </p>
                {currentQuestion.options.map((opt, optIdx) => {
                  const raw = answers[currentQuestion.id];
                  const selectedList: number[] = Array.isArray(raw) ? raw : [];
                  const isSelected = selectedList.includes(optIdx);
                  const letter = String.fromCharCode(65 + optIdx);

                  return (
                    <button
                      type="button"
                      key={optIdx}
                      onClick={() => handleTogglePgKompleks(optIdx)}
                      className={`w-full text-left p-3.5 rounded-xl border-2 transition cursor-pointer flex items-center gap-3.5 ${isSelected
                        ? 'bg-purple-50/80 border-purple-600 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs transition border shrink-0 ${isSelected
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : 'bg-white border-slate-300 text-slate-400'
                          }`}
                      >
                        {isSelected ? '✓' : ''}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-slate-900 mr-2">[{letter}]</span>
                        <span
                          className={`${fontSizeClass} ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'
                            }`}
                        >
                          {opt}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. BENAR / SALAH (TABEL PERNYATAAN) */}
            {currentQuestion.type === 'benar_salah' && currentQuestion.statements && (
              <div className="relative z-10 pt-2 space-y-3">
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5 w-12 text-center">No</th>
                        <th className="px-3 py-2.5">Pernyataan</th>
                        <th className="px-3 py-2.5 w-24 text-center">Benar</th>
                        <th className="px-3 py-2.5 w-24 text-center">Salah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentQuestion.statements.map((st, stIdx) => {
                        const rawBs = answers[currentQuestion.id];
                        const bsObj =
                          typeof rawBs === 'object' && rawBs !== null && !Array.isArray(rawBs)
                            ? (rawBs as Record<string, boolean>)
                            : {};
                        const userAns = bsObj[st.id];

                        return (
                          <tr key={st.id} className="hover:bg-slate-50 transition">
                            <td className="px-3 py-3 text-center font-bold text-slate-500">{stIdx + 1}</td>
                            <td className={`px-3 py-3 text-slate-800 ${fontSizeClass}`}>{st.statement}</td>
                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleSelectBenarSalah(st.id, true)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${userAns === true
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                              >
                                ✓ Benar
                              </button>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleSelectBenarSalah(st.id, false)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${userAns === false
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                              >
                                ✗ Salah
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. MENJODOHKAN (MATCHING PAIRS) */}
            {currentQuestion.type === 'menjodohkan' && currentQuestion.matchingPairs && (
              <div className="relative z-30 pt-2 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                    <span>ℹ️</span>
                    <span>Pasangkan premis sebelah kiri dengan pasangan yang tepat di sebelah kanan:</span>
                  </p>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      currentMatchingMeta.matchedPairsCount === currentMatchingMeta.totalPairs
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : currentMatchingMeta.matchedPairsCount > 0
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {currentMatchingMeta.matchedPairsCount}/{currentMatchingMeta.totalPairs} Terpasang
                    {currentMatchingMeta.matchedPairsCount === currentMatchingMeta.totalPairs ? ' ✓' : ''}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {currentQuestion.matchingPairs.map((pair, pIdx) => {
                    const currentMatch = currentMatchingMeta.matchObj[pair.id] || '';
                    return (
                      <div
                        key={pair.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative"
                      >
                        <div className="sm:w-1/2 flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {pIdx + 1}
                          </span>
                          <span className={`font-semibold text-slate-900 wrap-break-word ${fontSizeClass}`}>
                            {pair.leftPrompt}
                          </span>
                        </div>

                        <div className="sm:w-1/2 flex items-center gap-2 min-w-0">
                          <span className="text-slate-400 font-bold text-xs shrink-0">➔</span>
                          <div className="flex-1 min-w-0">
                            <MatchingDropdown
                              value={currentMatch}
                              options={currentMatchingMeta.availableOptions}
                              promptLabel={`${pIdx + 1}. ${pair.leftPrompt}`}
                              disabled={isLockedByViolation}
                              onChange={val => handleSelectMenjodohkan(pair.id, val)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            </div>

            {/* ------------------------------------------------------------- */}
            {/* TOMBOL NAVIGASI BAWAH (MENEMPEL RAPI DI BAWAH KARTU SOAL) */}
            {/* ------------------------------------------------------------- */}
            <div
              data-cbt-footer="true"
              className="relative z-10 pt-4 mt-auto border-t border-slate-100 grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-2.5"
            >
              {/* Previous button */}
              <button
                type="button"
                onClick={() => navigateToQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  currentIdx === 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-xs'
                }`}
              >
                <span>←</span>
                <span>Soal Sebelumnya</span>
              </button>

              {/* Ragu-Ragu toggle */}
              <button
                type="button"
                onClick={handleToggleDoubtful}
                className={`col-span-2 sm:col-span-1 order-last sm:order-none px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                  doubtfuls[currentQuestion.id]
                    ? 'bg-amber-500 text-white border border-amber-600'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>🟨</span>
                <span>{doubtfuls[currentQuestion.id] ? 'Hilangkan Ragu-Ragu' : 'Tandai Ragu-Ragu'}</span>
              </button>

              {/* Next button */}
              {currentIdx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => navigateToQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                  className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  <span>Soal Berikutnya</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <span>✓ Kumpulkan Ujian</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* KOLOM KANAN (3/12): NAVIGASI NOMOR SOAL & RINGKASAN PROGRES */}
        <aside className="lg:col-span-3 flex flex-col relative z-10">
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-4 lg:sticky lg:top-20 lg:min-h-[calc(100vh-7.5rem)] lg:max-h-[calc(100vh-6.25rem)]">
            {/* Header, Progress Bar & Mini Ringkasan */}
            <div className="space-y-3 border-b border-slate-100 pb-3.5 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                  <span>📑</span>
                  <span>Nomor Soal</span>
                </h3>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0 whitespace-nowrap">
                  {answeredCount}/{questions.length} Selesai
                </span>
              </div>

              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 py-1 px-1">
                  <div className="text-xs font-black text-emerald-700 leading-tight">{answeredCount}</div>
                  <div className="text-[10px] font-semibold text-emerald-700/80">Dijawab</div>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-100 py-1 px-1">
                  <div className="text-xs font-black text-amber-700 leading-tight">{doubtfulCount}</div>
                  <div className="text-[10px] font-semibold text-amber-700/80">Ragu</div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200/80 py-1 px-1">
                  <div className="text-xs font-black text-slate-700 leading-tight">
                    {Math.max(0, questions.length - answeredCount)}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500">Belum</div>
                </div>
              </div>
            </div>

            {/* Grid Tombol Nomor Soal (1 s/d N) dengan padding lega p-1.5 agar ring aktif tidak terpotong */}
            <div className="flex-1 min-h-0 max-h-60 lg:max-h-none overflow-y-auto p-1.5 -m-1.5">
              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2.5 p-1">
                {questions.map((q, qIdx) => {
                  const isCurrent = qIdx === currentIdx;
                  const isDoubtful = Boolean(doubtfuls[q.id]);
                  const status = getQuestionCompletionStatus(q, answers[q.id]);

                  let badgeColor = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
                  if (isDoubtful) {
                    badgeColor = 'bg-amber-400 border-amber-500 text-slate-900 font-extrabold';
                  } else if (status === 'complete') {
                    badgeColor = 'bg-emerald-600 border-emerald-600 text-white font-bold';
                  } else if (status === 'partial') {
                    badgeColor = 'bg-emerald-50 border-emerald-400 border-dashed text-emerald-800 font-bold';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      data-cbt-nav-num={qIdx + 1}
                      data-cbt-nav-active={isCurrent ? 'true' : 'false'}
                      onClick={() => navigateToQuestion(qIdx)}
                      title={status === 'partial' ? 'Sebagian jawaban terisi (belum lengkap)' : undefined}
                      className={`h-9 rounded-xl border font-mono text-xs transition cursor-pointer flex items-center justify-center relative ${badgeColor} ${
                        isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2 border-indigo-600' : ''
                      }`}
                    >
                      <span>{qIdx + 1}</span>
                      {!isDoubtful && status === 'partial' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1 right-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Keterangan Warna & Tombol Kumpulkan (Sejajar dengan footer kiri) */}
            <div className="mt-auto pt-3 border-t border-slate-100 space-y-3 shrink-0">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] sm:text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-600 shrink-0" />
                  <span className="truncate">Hijau = Selesai</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-400 shrink-0" />
                  <span className="truncate">Kuning = Ragu</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-50 border border-dashed border-emerald-500 shrink-0" />
                  <span className="truncate">Garis = Sebagian</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-white border border-slate-300 shrink-0" />
                  <span className="truncate">Putih = Belum</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>✓ Selesai & Kumpulkan</span>
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* MODAL IMAGE ZOOM */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm cursor-pointer"
          onClick={() => setZoomImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white p-2 rounded-2xl shadow-2xl">
            <img
              src={zoomImageUrl}
              alt="Preview Zoom"
              className="max-h-[85vh] w-auto object-contain rounded-xl"
            />
            <button
              type="button"
              onClick={() => setZoomImageUrl(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-md"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* MODAL PETUNJUK UJIAN */}
      {showInstructionsModal && currentPackage.instructions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
          onClick={() => setShowInstructionsModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">ℹ️ Petunjuk Pengerjaan Ujian</h3>
              <button
                type="button"
                onClick={() => setShowInstructionsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {currentPackage.instructions}
            </p>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              🛡️ Ujian ini dilindungi mode anti-kecurangan. Dilarang keluar dari layar penuh, berpindah tab, atau membuka aplikasi lain.
            </div>
            <button
              type="button"
              onClick={() => setShowInstructionsModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
            >
              Mengerti, Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL LOCKDOWN RESMI CBT (COMPACT & NO-SCROLL) */}
      {isLockedByViolation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md select-none">
          <div className="bg-slate-900 border border-rose-500/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 max-w-sm sm:max-w-md w-full text-center space-y-2.5 shadow-2xl shadow-rose-950/80 animate-in fade-in zoom-in-95 duration-150">
            {/* Header: Badge & Title */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                <span>🔒</span>
                <span>UJIAN TERKUNCI (Toleransi 1x)</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">Akses Ujian Dibekukan</h2>
            </div>

            {/* Bukti Forensik Pelanggaran & Identitas */}
            <div className="bg-slate-950/80 border border-rose-500/50 rounded-xl p-2.5 text-left text-xs space-y-1.5 shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-bold text-amber-400">
                <span>📋 BUKTI FORENSIK:</span>
                {violationTime && <span className="font-mono text-slate-300">{violationTime}</span>}
              </div>
              <div className="font-bold text-rose-300 text-xs flex items-start gap-1.5 leading-snug">
                <span className="text-rose-400 shrink-0">⚠️</span>
                <span>{violationReason || 'Terdeteksi meninggalkan lembar ujian CBT.'}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-slate-300">
                <span className="font-semibold text-white truncate max-w-[170px]">
                  {student.name} ({student.classId})
                </span>
                <span className="text-slate-400 font-mono text-[10px]">{roomName}</span>
              </div>
            </div>

            {/* Petunjuk Singkat */}
            <div className="px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-200 text-center leading-snug">
              ✋ Angkat tangan dan lapor ke <strong>Pengawas Ruangan</strong> untuk membuka kunci ujian.
            </div>

            {/* Status & Aksi Buka Kunci */}
            {violationCount === 0 ? (
              <div className="space-y-2 pt-0.5">
                <div className="py-2 px-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs">
                  <span>✅</span>
                  <span>Kunci Telah Dibuka Pengawas!</span>
                </div>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    isLockedRef.current = false;
                    fullscreenGraceUntilRef.current = Date.now() + 800;
                    setUnlockError(null);
                    setUnlockSuccess(null);
                    setIsLockedByViolation(false);
                    enterFullscreen();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs shadow-lg shadow-emerald-950 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🚀 Lanjutkan Ujian Sekarang</span>
                  <span>➔</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-0.5">
                {/* 1. Tombol Sinkronisasi Remote dari Meja Pengawas */}
                <button
                  type="button"
                  disabled={isCheckingUnlock}
                  onClick={() => handleRemoteUnlock(true)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-bold transition border border-amber-500/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-xs disabled:opacity-60"
                  title="Klik untuk sinkronisasi jika pengawas sudah menekan Buka Kunci di Meja Pengawas"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>
                    {isCheckingUnlock ? 'Memeriksa Status Pengawas...' : '🔄 Cek Buka Kunci dari Meja Pengawas'}
                  </span>
                </button>

                {/* 2. Form Input PIN Pengawas (Di Tempat) */}
                <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 text-left space-y-1">
                  <label className="block text-[10px] font-bold text-amber-300 uppercase tracking-wider text-center">
                    🔑 Atau Ketik PIN Pengawas:
                  </label>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1 flex items-center">
                      <input
                        id="input-cbt-unlock-pin"
                        type="text"
                        name="cbt_supervisor_pin_entry"
                        inputMode="text"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-bwignore="true"
                        data-form-type="other"
                        aria-label="PIN Pengawas"
                        placeholder="Masukkan PIN Pengawas..."
                        value={unlockTokenInput}
                        onChange={e => {
                          setUnlockTokenInput(e.target.value.toUpperCase());
                          if (unlockError) setUnlockError(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleUnlockExam();
                          }
                        }}
                        className="cbt-pin-mask w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-center text-xs tracking-widest focus:outline-none focus:border-amber-400"
                      />
                      {unlockTokenInput && (
                        <span
                          aria-hidden="true"
                          className="cbt-pin-mask-fallback pointer-events-none absolute inset-0 items-center px-3 py-1.5 text-amber-300 font-mono font-bold text-xs tracking-widest overflow-hidden whitespace-nowrap"
                        >
                          {'•'.repeat(unlockTokenInput.length)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleUnlockExam}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer active:scale-95 shadow-xs"
                    >
                      Buka 🔓
                    </button>
                  </div>
                  {unlockError && (
                    <p className="text-[10px] text-rose-400 text-center font-semibold mt-0.5 leading-snug">
                      {unlockError}
                    </p>
                  )}
                  {unlockSuccess && (
                    <p className="text-[10px] text-emerald-400 text-center font-semibold mt-0.5 leading-snug">
                      ✅ {unlockSuccess}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL / OVERLAY: WAJIB LAYAR PENUH (FULLSCREEN ENFORCER) */}
      {!isFullscreen &&
        !fullscreenUnsupported &&
        fullscreenOverlayReady &&
        !isExamCompleted &&
        !isExamPaused &&
        !isPreviewMode &&
        !isLockedByViolation && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center animate-fade-in select-none"
            onClick={() => enterFullscreen()}
          >
            <div
              className="max-w-md w-full bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5"
              onClick={e => {
                e.stopPropagation();
                enterFullscreen();
              }}
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mx-auto flex items-center justify-center text-3xl animate-bounce">
                ⛶
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Mode Ujian Terproteksi
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">Wajib Masuk Layar Penuh</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Ujian <strong>{exam.title}</strong> wajib dikerjakan dalam mode{' '}
                  <strong>Layar Penuh (Fullscreen)</strong> demi ketertiban dan pencegahan kecurangan.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-400 text-left space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-amber-400">✓</span>
                  <span>Tab browser lain & navigasi sistem otomatis disembunyikan.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-rose-400">⚠️</span>
                  <span>Dilarang menekan tombol Esc, Alt+Tab, tombol Kembali, atau membuka aplikasi lain.</span>
                </div>
              </div>

              <button
                id="btn-activate-fullscreen"
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  enterFullscreen();
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm transition shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>⛶</span>
                <span>Klik Di Sini Untuk Masuk Layar Penuh</span>
              </button>
            </div>
          </div>
        )}

      {/* MODAL KONFIRMASI SELESAI UJIAN */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="text-center space-y-1">
              <span className="text-3xl">📝</span>
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Pengumpulan Ujian</h3>
              <p className="text-xs text-slate-500">
                Pastikan Anda telah meninjau seluruh jawaban sebelum mengakhiri sesi ujian.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Soal:</span>
                <span className="font-bold text-slate-800">{questions.length} Butir</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sudah Dijawab:</span>
                <span className="font-bold text-emerald-700">{answeredCount} Soal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Masih Ragu-Ragu:</span>
                <span className="font-bold text-amber-700">{doubtfulCount} Soal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Belum Dijawab:</span>
                <span className="font-bold text-rose-700">{questions.length - answeredCount} Soal</span>
              </div>
            </div>

            {unansweredIndices.length > 0 && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5">
                <p className="text-[11px] text-rose-700 font-semibold">
                  ⚠️ Nomor yang belum dijawab (klik untuk melompat):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {unansweredIndices.slice(0, 15).map(idx => {
                    const qItem = questions[idx];
                    const isPartial = qItem ? getQuestionCompletionStatus(qItem, answers[qItem.id]) === 'partial' : false;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          navigateToQuestion(idx);
                          setShowSubmitModal(false);
                        }}
                        className="px-2 py-0.5 rounded-md bg-white hover:bg-rose-100 border border-rose-300 text-rose-800 font-mono font-bold text-[11px] cursor-pointer"
                      >
                        No. {idx + 1}{isPartial ? ' (Belum Lengkap)' : ''}
                      </button>
                    );
                  })}
                  {unansweredIndices.length > 15 && (
                    <span className="text-[11px] text-rose-600 font-semibold self-center">
                      +{unansweredIndices.length - 15} lainnya
                    </span>
                  )}
                </div>
              </div>
            )}

            {doubtfulCount > 0 && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center font-medium">
                ⚠️ Anda masih memiliki {doubtfulCount} soal bertanda ragu-ragu.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cek Jawaban Lagi
              </button>
              <button
                type="button"
                onClick={() => handleConfirmSubmit()}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Ya, Kumpulkan Ujian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY UJIAN DIJEDA OLEH PANITIA PUSAT (JEDA DARURAT / MANUAL PAUSE) */}
      {isExamPaused && !isExamCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl mx-auto animate-pulse">
              ⏸️
            </div>
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {currentPackage.emergencyPaused ? '⚠️ JEDA DARURAT POSKO CBT' : 'Instruksi Panitia CBT'}
              </span>
              <h3 className="text-lg font-black text-white">Sesi Ujian Sedang Dijeda</h3>
              {currentPackage.emergencyPauseReason && (
                <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs font-semibold leading-relaxed">
                  📢 Catatan Panitia: {currentPackage.emergencyPauseReason}
                </div>
              )}
              <p className="text-xs text-slate-300 leading-relaxed">
                Panitia CBT pusat sedang menjeda sesi ujian ini. Waktu pengerjaan Anda otomatis dibekukan (tidak berkurang) dan seluruh jawaban yang telah Anda pilih tersimpan aman di server sekolah.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-400">
              💡 Harap tetap berada di halaman ini dan tidak menutup aplikasi. Layar ujian akan otomatis kembali aktif begitu panitia melanjutkan sesi ujian.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
