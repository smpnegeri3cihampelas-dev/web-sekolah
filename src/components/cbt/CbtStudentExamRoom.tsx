'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  CbtExamPackage,
  CbtQuestion,
  CbtStudentAnswerState,
  saveStoredStudentCbtSession,
  getStoredStudentCbtSessions,
  gradeCbtAnswers,
  getStoredCbtPackages,
  evaluateCbtPackageSchedule
} from '@/lib/cbtData';
import { Student } from '@/lib/elearningData';

interface CbtStudentExamRoomProps {
  exam: CbtExamPackage;
  student: Student;
  roomName: string;
  initialSession?: CbtStudentAnswerState;
  onFinishExam: (completedSession: CbtStudentAnswerState) => void;
  onExitRoom: () => void;
}

export default function CbtStudentExamRoom({
  exam,
  student,
  roomName,
  initialSession,
  onFinishExam,
  onExitRoom
}: CbtStudentExamRoomProps) {
  // Current question index (0-indexed)
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // Fallback membaca session aktif siswa dari storage jika initialSession tidak diteruskan
  const effectiveSession = useMemo(() => {
    if (initialSession) return initialSession;
    const all = getStoredStudentCbtSessions();
    const key = `${exam.id}_${student.id}`;
    if (all[key]) return all[key];
    return Object.values(all).find(s => 
      (s.studentId === student.id || (student.nisn && (s.studentNisn === student.nisn || s.studentId === student.nisn))) &&
      (!s.examId || s.examId === exam.id)
    ) || null;
  }, [initialSession, exam.id, student.id, student.nisn]);

  // Student answer state
  const [answers, setAnswers] = useState<Record<string, any>>(
    effectiveSession?.answers || {}
  );
  const [doubtfuls, setDoubtfuls] = useState<Record<string, boolean>>(
    effectiveSession?.doubtfuls || {}
  );
  const [audioPlays, setAudioPlays] = useState<Record<string, number>>(
    effectiveSession?.audioPlayCount || {}
  );
  const [violationCount, setViolationCount] = useState<number>(
    effectiveSession?.violationCount || 0
  );

  // Model A: Zero-Tolerance Exam Lockdown (Sekali Keluar = Langsung Terkunci Mati!)
  const [isLockedByViolation, setIsLockedByViolation] = useState<boolean>(() => {
    return Boolean(effectiveSession?.violationCount && effectiveSession.violationCount >= 1);
  });
  const [unlockTokenInput, setUnlockTokenInput] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return Boolean(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  });

  // Time remaining in seconds
  const totalDurationSeconds = Math.max(60, (exam.durationMinutes || 60) * 60);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (initialSession?.startedAt && !initialSession?.isSubmitted) {
      const elapsed = Math.floor((Date.now() - new Date(initialSession.startedAt).getTime()) / 1000);
      const remaining = totalDurationSeconds - elapsed;
      if (remaining > 30) {
        return remaining;
      }
    }
    return totalDurationSeconds;
  });

  // UI state
  const [fontSizeClass, setFontSizeClass] = useState<'text-sm' | 'text-base' | 'text-lg'>('text-base');
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isExamCompleted, setIsExamCompleted] = useState<boolean>(
    Boolean(initialSession?.isSubmitted)
  );
  const [completedResult, setCompletedResult] = useState<CbtStudentAnswerState | null>(
    initialSession?.isSubmitted ? initialSession : null
  );

  // Realtime CBT Package Status & Schedule Sync (Active / Window Schedule / Emergency Paused)
  const [currentPackage, setCurrentPackage] = useState<CbtExamPackage>(exam);
  const [scheduleNow, setScheduleNow] = useState<Date>(new Date());

  useEffect(() => {
    // Tick every 5 seconds to catch schedule opening/closing precisely
    const clockTimer = setInterval(() => setScheduleNow(new Date()), 5000);
    return () => clearInterval(clockTimer);
  }, []);

  const scheduleEval = useMemo(() => {
    return evaluateCbtPackageSchedule(currentPackage, scheduleNow);
  }, [currentPackage, scheduleNow]);

  const isExamPaused = currentPackage.status === 'draft' || scheduleEval.scheduleState === 'emergency_paused';

  // Real-time listener: jika Pengawas membuka kunci dari meja pengawas/panitia secara remote
  const handleRemoteUnlock = useCallback(() => {
    try {
      const sessions = getStoredStudentCbtSessions();
      const key = `${exam.id}_${student.id}`;
      let current: CbtStudentAnswerState | undefined = sessions[key];
      if (!current) {
        current = Object.values(sessions).find(s => 
          (s.studentId === student.id || (student.nisn && (s.studentNisn === student.nisn || s.studentId === student.nisn))) &&
          (!s.examId || s.examId === exam.id)
        );
      }
      if (current) {
        if (!current.violationCount || current.violationCount === 0) {
          lastViolationTimeRef.current = Date.now() + 4000;
          setIsLockedByViolation(false);
          setViolationCount(0);
          setUnlockError(null);
          enterFullscreen();
        } else {
          setViolationCount(current.violationCount);
          setIsLockedByViolation(true);
        }
      } else {
        // Jika sesi telah di-reset/dihapus oleh pengawas dari Meja Pengawas:
        setIsExamCompleted(false);
        setCompletedResult(null);
        setIsLockedByViolation(false);
        setViolationCount(0);
        setUnlockError(null);
        setAnswers({});
        setDoubtfuls({});
      }
    } catch (e) {
      console.error('Remote unlock sync error', e);
    }
  }, [exam.id, student.id, student.nisn]);

  useEffect(() => {
    const handlePkgsUpdate = () => {
      const pkgs = getStoredCbtPackages();
      const updated = pkgs.find(p => p.id === exam.id);
      if (updated) {
        setCurrentPackage(updated);
      }
    };

    // Sinkronkan langsung saat komponen dibuka
    handleRemoteUnlock();

    window.addEventListener('cbtPackagesUpdated', handlePkgsUpdate);
    window.addEventListener('cbtSessionsUpdated', handleRemoteUnlock);
    window.addEventListener('storage', handleRemoteUnlock);

    return () => {
      window.removeEventListener('cbtPackagesUpdated', handlePkgsUpdate);
      window.removeEventListener('cbtSessionsUpdated', handleRemoteUnlock);
      window.removeEventListener('storage', handleRemoteUnlock);
    };
  }, [exam.id, handleRemoteUnlock]);

  // Audio playing ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const startedAtRef = useRef<string>(
    (() => {
      if (initialSession?.startedAt && !initialSession?.isSubmitted) {
        const elapsed = Math.floor((Date.now() - new Date(initialSession.startedAt).getTime()) / 1000);
        if (totalDurationSeconds - elapsed > 30) {
          return initialSession.startedAt;
        }
      }
      return new Date().toISOString();
    })()
  );

  // 1. Timer countdown (Automatically frozen when exam is paused)
  useEffect(() => {
    if (isExamCompleted || isExamPaused) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleForceAutoSubmit('Waktu ujian telah habis!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamCompleted, isExamPaused]);

  // Fullscreen helper (Cross-browser mobile & desktop)
  const enterFullscreen = async () => {
    try {
      const docEl = document.documentElement as any;
      if (docEl && !document.fullscreenElement && !docEl.webkitFullscreenElement) {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('Fullscreen entry pending or requires direct user gesture', err);
    }
  };

  const lastViolationTimeRef = useRef<number>(Date.now() + 3000);

  // Helper: Trigger Violation with ZERO-TOLERANCE (Sekali Keluar Langsung Terkunci Mati!)
  const triggerViolation = (reasonText: string) => {
    if (isExamCompleted || isExamPaused) return;

    const now = Date.now();
    // Abaikan jika masih dalam masa tenggang awal (grace period 3 detik)
    if (now < lastViolationTimeRef.current) {
      return;
    }
    // Minimal jeda 1 detik antar pelanggaran agar tidak dobel hitungan
    if (now - lastViolationTimeRef.current < 1000) {
      return;
    }
    lastViolationTimeRef.current = now;

    setViolationCount(prev => {
      const nextCount = prev + 1;
      persistSession(answers, doubtfuls, nextCount);

      // ZERO-TOLERANCE: Sekali saja siswa keluar (buka Google/WA/aplikasi lain), ujian LANGSUNG TERKUNCI!
      setIsLockedByViolation(true);
      setWarningMessage(null);
      return nextCount;
    });
  };

  // Helper: Supervisor Unlock Logic (RAHASIA: Siswa TIDAK TAHU PIN Ini!)
  const handleUnlockExam = () => {
    const cleanInput = unlockTokenInput.trim().toUpperCase();
    // PIN Rahasia Pengawas Ruangan / Panitia (Bukan Token Ujian yang ada di papan tulis!)
    const validSupervisorPins = [
      'SPENTIC99',
      '999999',
      'GURU2026',
      'PENGAWAS2026',
      'PANITIA2026'
    ];

    if (!cleanInput) {
      setUnlockError('Harap masukkan PIN Rahasia Pengawas!');
      return;
    }

    // Jika siswa mencoba memasukkan token ujian papan tulis
    if (cleanInput === exam.token.toUpperCase().trim()) {
      setUnlockError('❌ Token Ujian papan tulis TIDAK BISA digunakan untuk membuka pelanggaran! Panggil Pengawas Ruangan Anda.');
      return;
    }

    if (validSupervisorPins.includes(cleanInput)) {
      setUnlockError(null);
      setUnlockSuccess('Kunci ujian berhasil dibuka oleh Pengawas!');
      setTimeout(() => {
        setIsLockedByViolation(false);
        setViolationCount(0);
        setUnlockTokenInput('');
        setUnlockSuccess(null);
        persistSession(answers, doubtfuls, 0);
        enterFullscreen();
      }, 700);
    } else {
      setUnlockError('❌ PIN Pengawas salah! Hanya Guru Pengawas yang berhak membuka lembar ujian ini.');
    }
  };

  // 2. Anti-Cheating: Window blur (Alt+Tab) / tab switch / fullscreen & key detection
  useEffect(() => {
    if (isExamCompleted) return;

    // 1. Deteksi saat jendela browser kehilangan fokus (Alt+Tab, klik Word, klik WA, klik aplikasi lain)
    const handleWindowBlur = () => {
      if (isExamCompleted || isExamPaused) return;
      if (Date.now() < lastViolationTimeRef.current) return;
      triggerViolation('Anda terdeteksi berpindah ke aplikasi lain atau melakukan Alt+Tab!');
    };

    // 2. Deteksi saat tab browser disembunyikan / berganti tab
    const handleVisibilityChange = () => {
      if (isExamCompleted || isExamPaused) return;
      if (Date.now() < lastViolationTimeRef.current) return;
      if (document.hidden) {
        triggerViolation('Anda terdeteksi berpindah tab browser atau meminimalkan layar ujian.');
      }
    };

    // 3. Deteksi aktif berkala (Heartbeat Monitor): Menangkap jika user membuka Word, WA, atau aplikasi desktop lain di depan browser
    const focusHeartbeat = setInterval(() => {
      if (isExamCompleted || isExamPaused) return;
      if (Date.now() < lastViolationTimeRef.current) return;

      // Jika document tidak memiliki fokus atau tab sedang tersembunyi
      if (!document.hasFocus() || document.hidden) {
        triggerViolation('Terdeteksi keluar dari layar ujian CBT (membuka aplikasi lain di komputer/HP)!');
      }
    }, 700);

    const handleFullscreenChange = () => {
      const active = Boolean(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(active);
      if (Date.now() < lastViolationTimeRef.current) return;
      if (!active && !isExamCompleted && !isExamPaused) {
        triggerViolation('Anda keluar dari Mode Layar Penuh (Fullscreen)!');
      }
    };

    // Deteksi Layar Belah (Split Screen / Multi-Window di HP Android / iOS)
    const handleResizeOrSplitScreen = () => {
      if (isExamCompleted || isExamPaused) return;
      if (typeof window !== 'undefined' && window.screen) {
        const screenH = window.screen.availHeight || window.screen.height;
        const screenW = window.screen.availWidth || window.screen.width;
        // Jika layar belah diaktifkan, tinggi atau lebar browser terpotong drastis (< 55% dari layar)
        // Abaikan jika sedang mengetik (ada input/textarea yang sedang fokus)
        const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');
        if (!isTyping && screenH > 500 && window.innerHeight < screenH * 0.52) {
          triggerViolation('Terdeteksi menggunakan Layar Belah (Split Screen / Multi-Window)!');
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
      }
      if (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      if (e.ctrlKey && ['u', 'p', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    // Anti-Copy, Anti-Cut, Anti-Paste & Anti-Drag (Anti Google Lens / Cheating)
    const handleBlockClipboard = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('pagehide', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
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
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('pagehide', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
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
  }, [isExamCompleted, isExamPaused, answers, doubtfuls]);

  // 3. Format timer: HH:MM:SS
  const formattedTime = useMemo(() => {
    const hours = Math.floor(secondsRemaining / 3600);
    const mins = Math.floor((secondsRemaining % 3600) / 60);
    const secs = secondsRemaining % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${hours > 0 ? pad(hours) + ':' : ''}${pad(mins)}:${pad(secs)}`;
  }, [secondsRemaining]);

  const isLowTime = secondsRemaining <= 300; // < 5 mins
  const currentQuestion = exam.questions[currentIdx] || exam.questions[0];

  // Helper: Persist session to localStorage
  const persistSession = (
    currentAnswers: Record<string, any>,
    currentDoubtfuls: Record<string, boolean>,
    violations: number = violationCount
  ) => {
    const sessionState: CbtStudentAnswerState = {
      examId: exam.id,
      studentId: student.id,
      studentNisn: student.nisn,
      studentName: student.name,
      classId: student.classId,
      roomName: roomName,
      answers: currentAnswers,
      doubtfuls: currentDoubtfuls,
      audioPlayCount: audioPlays,
      startedAt: startedAtRef.current,
      isSubmitted: false,
      violationCount: violations
    };
    saveStoredStudentCbtSession(sessionState);
  };

  // Answer handler for PG (Single)
  const handleSelectPgOption = (optionIdx: number) => {
    if (isLockedByViolation) return;
    const newAnswers = { ...answers, [currentQuestion.id]: optionIdx };
    setAnswers(newAnswers);
    persistSession(newAnswers, doubtfuls);
  };

  // Answer handler for PG Kompleks (Multi Checkbox)
  const handleTogglePgKompleks = (optionIdx: number) => {
    if (isLockedByViolation) return;
    const currentList: number[] = Array.isArray(answers[currentQuestion.id])
      ? answers[currentQuestion.id]
      : [];
    let updatedList: number[];
    if (currentList.includes(optionIdx)) {
      updatedList = currentList.filter(i => i !== optionIdx);
    } else {
      updatedList = [...currentList, optionIdx].sort((a, b) => a - b);
    }
    const newAnswers = { ...answers, [currentQuestion.id]: updatedList };
    setAnswers(newAnswers);
    persistSession(newAnswers, doubtfuls);
  };

  // Answer handler for Benar / Salah
  const handleSelectBenarSalah = (statementId: string, value: boolean) => {
    if (isLockedByViolation) return;
    const currentObj = answers[currentQuestion.id] || {};
    const updatedObj = { ...currentObj, [statementId]: value };
    const newAnswers = { ...answers, [currentQuestion.id]: updatedObj };
    setAnswers(newAnswers);
    persistSession(newAnswers, doubtfuls);
  };

  // Answer handler for Menjodohkan
  const handleSelectMenjodohkan = (matchingId: string, rightValue: string) => {
    if (isLockedByViolation) return;
    const currentObj = answers[currentQuestion.id] || {};
    const updatedObj = { ...currentObj, [matchingId]: rightValue };
    const newAnswers = { ...answers, [currentQuestion.id]: updatedObj };
    setAnswers(newAnswers);
    persistSession(newAnswers, doubtfuls);
  };

  // Toggle Ragu-Ragu
  const handleToggleDoubtful = () => {
    if (isLockedByViolation) return;
    const isCurrentlyDoubtful = Boolean(doubtfuls[currentQuestion.id]);
    const newDoubtfuls = { ...doubtfuls, [currentQuestion.id]: !isCurrentlyDoubtful };
    setDoubtfuls(newDoubtfuls);
    persistSession(answers, newDoubtfuls);
  };

  // Audio Play Handler with Max Plays Protection
  const handlePlayAudio = () => {
    const qId = currentQuestion.id;
    const currentPlays = audioPlays[qId] || 0;
    const maxPlays = currentQuestion.audioMaxPlays || 3;

    if (currentPlays >= maxPlays) {
      alert(`Batas pemutaran audio untuk soal ini telah mencapai batas maksimal (${maxPlays} kali).`);
      return;
    }

    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play();
        setIsPlayingAudio(true);
        const nextPlays = currentPlays + 1;
        const newAudioPlays = { ...audioPlays, [qId]: nextPlays };
        setAudioPlays(newAudioPlays);
      }
    }
  };

  // Calculation of progress
  const answeredCount = useMemo(() => {
    return exam.questions.filter(q => {
      const a = answers[q.id];
      if (a === undefined || a === null) return false;
      if (q.type === 'pg') return typeof a === 'number';
      if (q.type === 'pg_kompleks') return Array.isArray(a) && a.length > 0;
      if (q.type === 'benar_salah') return Object.keys(a).length > 0;
      if (q.type === 'menjodohkan') return Object.keys(a).length > 0;
      return false;
    }).length;
  }, [answers, exam.questions]);

  const doubtfulCount = useMemo(() => {
    return Object.values(doubtfuls).filter(Boolean).length;
  }, [doubtfuls]);

  // Submission handler
  const handleConfirmSubmit = () => {
    const { finalScore, correctCount, wrongCount, isPassed } = gradeCbtAnswers(exam, answers);

    const completedSession: CbtStudentAnswerState = {
      examId: exam.id,
      studentId: student.id,
      studentNisn: student.nisn,
      studentName: student.name,
      classId: student.classId,
      roomName: roomName,
      answers: answers,
      doubtfuls: doubtfuls,
      audioPlayCount: audioPlays,
      startedAt: startedAtRef.current,
      submittedAt: new Date().toISOString(),
      isSubmitted: true,
      score: finalScore,
      totalScore: 100,
      correctCount: correctCount,
      wrongCount: wrongCount,
      isPassed: isPassed,
      violationCount: violationCount
    };

    saveStoredStudentCbtSession(completedSession);
    setCompletedResult(completedSession);
    setIsExamCompleted(true);
    setShowSubmitModal(false);
    onFinishExam(completedSession);
  };

  const handleForceAutoSubmit = (reason: string) => {
    alert(`Ujian otomatis dikumpulkan: ${reason}`);
    handleConfirmSubmit();
  };

  // Otomatis kumpulkan jawaban saat batas akhir jam sesi resmi ujian (endTime) telah tercapai
  useEffect(() => {
    if (!isExamCompleted && scheduleEval.scheduleState === 'expired') {
      handleForceAutoSubmit(
        `Batas waktu sesi resmi ujian telah berakhir (${currentPackage.endTime || 'Jadwal ditutup'})!`
      );
    }
  }, [scheduleEval.scheduleState, isExamCompleted, currentPackage.endTime]);

  // -------------------------------------------------------------
  // JIKA SISWA SUDAH SELESAI MENGERJAKAN (TAMPILAN SELESAI)
  // -------------------------------------------------------------
  if (isExamCompleted && completedResult) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center text-3xl">
            ✓
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              UJIAN BERHASIL DIKUMPULKAN
            </span>
            <h2 className="text-xl font-bold mt-2 text-white">
              {exam.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              SMP Negeri 3 Cihampelas • {exam.subject}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/80 text-left space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Nama Siswa:</span>
              <span className="font-bold text-white">{student.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">NISN / Kelas:</span>
              <span className="font-mono text-slate-300">{student.nisn} ({student.classId})</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Ruang Ujian:</span>
              <span className="text-slate-200">{roomName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Waktu Pengumpulan:</span>
              <span className="font-mono text-slate-300">
                {completedResult.submittedAt?.slice(11, 16)} WIB
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

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                if (typeof document !== 'undefined' && document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
                onExitRoom();
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-98"
            >
              Kembali ke Beranda E-Learning
            </button>

            <button
              type="button"
              onClick={() => {
                const sessions = getStoredStudentCbtSessions();
                const key = `${exam.id}_${student.id}`;
                const current = sessions[key] || Object.values(sessions).find(s => 
                  (s.studentId === student.id || (student.nisn && (s.studentNisn === student.nisn || s.studentId === student.nisn))) &&
                  (!s.examId || s.examId === exam.id)
                );
                if (!current || !current.isSubmitted) {
                  alert('✅ Sesi ujian telah di-reset oleh Pengawas Ruangan! Membuka kembali lembar ujian dari awal...');
                  setIsExamCompleted(false);
                  setCompletedResult(null);
                  setAnswers({});
                  setDoubtfuls({});
                  setViolationCount(0);
                  setIsLockedByViolation(false);
                  setSecondsRemaining(currentPackage.durationMinutes * 60);
                  startedAtRef.current = new Date().toISOString();
                } else {
                  alert('ℹ️ Sesi ujian ini masih berstatus "Telah Dikumpulkan" di server sekolah.\n\nJika pengawas ruangan baru saja mereset, pastikan pengawas mengklik tombol "Reset" pada baris nama Anda di Meja Pengawas.');
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-600 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <span>🔄</span>
              <span>Cek Status Reset Pengawas / Kerjakan Ulang</span>
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
      onClick={() => {
        if (typeof document !== 'undefined' && !document.fullscreenElement && !isExamCompleted && !isExamPaused && roomName !== 'Ruang Pratinjau Guru') {
          enterFullscreen();
        }
      }}
    >
      
      {/* 1. TOP BAR CBT (STATUS & TIMER) */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 py-3 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Left: Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-sm text-indigo-400">
              💻
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  CBT SPENTIC
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {roomName}
                </span>
              </div>
              <h1 className="text-sm font-bold text-slate-100 truncate max-w-sm sm:max-w-md">
                {exam.title}
              </h1>
            </div>
          </div>

          {/* Right: Student Profile & Countdown Timer */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            
            {/* Student info */}
            <div className="hidden md:block text-right">
              <div className="text-xs font-bold text-white truncate max-w-[160px]">
                {student.name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                NISN: {student.nisn} ({student.classId})
              </div>
            </div>

            {/* Font Adjuster Buttons */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setFontSizeClass('text-sm')}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                  fontSizeClass === 'text-sm' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Font Lebih Kecil"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSizeClass('text-base')}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                  fontSizeClass === 'text-base' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Font Normal"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSizeClass('text-lg')}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                  fontSizeClass === 'text-lg' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Font Lebih Besar"
              >
                A+
              </button>
            </div>

            {/* FULLSCREEN BUTTON */}
            {!isFullscreen && !isExamCompleted && (
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
                <span>Terkunci ({violationCount}x Keluar)</span>
              </div>
            )}

            {/* SESSION SCHEDULE BADGE */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
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
            <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono font-bold text-xs shadow-inner ${
              isLowTime 
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse' 
                : 'bg-slate-800 border-slate-700 text-emerald-400'
            }`}>
              <span className="text-sm">⏱️</span>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-sans leading-none">
                  Sisa Waktu
                </div>
                <div className="text-sm font-black leading-none mt-0.5">
                  {formattedTime}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY SECTION (2 COLUMNS: QUESTION CARD + NAVIGATION DRAWER) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* KOLOM KIRI (3/4): LEMBAR SOAL */}
        <section className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 relative overflow-hidden select-none">
            
            {/* DYNAMIC WATERMARK (ANTI-SCREENSHOT & ANTI-BOCOR SOAL) */}
            <div 
              className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden flex flex-wrap items-center justify-around gap-y-16 gap-x-12 p-4 opacity-[0.055] sm:opacity-[0.065] rotate-[-18deg] scale-110"
              aria-hidden="true"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="text-center font-black tracking-widest text-slate-900 text-xs sm:text-sm uppercase leading-tight font-mono select-none">
                  <div>SMP NEGERI 3 CIHAMPELAS</div>
                  <div className="text-rose-900 font-extrabold">{student.name} • NISN: {student.nisn}</div>
                  <div>KELAS {student.classId} • {roomName}</div>
                </div>
              ))}
            </div>
            
            {/* Header Soal (Nomor & Tipe Soal) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono font-black text-sm shadow-xs">
                  Soal No. {currentIdx + 1}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  dari {exam.questions.length} soal
                </span>
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
              <div className="space-y-2">
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
                  <p className="text-xs text-slate-500 italic text-center">
                    {currentQuestion.mediaCaption}
                  </p>
                )}
              </div>
            )}

            {currentQuestion.mediaType === 'audio' && currentQuestion.mediaUrl && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                      🎧
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-indigo-900">
                        {currentQuestion.mediaCaption || 'Seksi Listening / Menyimak Audio'}
                      </h4>
                      <p className="text-[11px] text-indigo-600">
                        Dengarkan audio percakapan dengan seksama
                      </p>
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
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-sm ${
                      isPlayingAudio
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
              </div>
            )}

            {/* TEKS SOAL */}
            <div className={`text-slate-800 leading-relaxed font-normal ${fontSizeClass}`}>
              {currentQuestion.question}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* AREA INPUT JAWABAN (SESUAI TIPE SOAL) */}
            {/* ------------------------------------------------------------- */}

            {/* 1. PILIHAN GANDA (SINGLE CHOICE) */}
            {currentQuestion.type === 'pg' && currentQuestion.options && (
              <div className="space-y-2.5 pt-2">
                {currentQuestion.options.map((opt, optIdx) => {
                  const isSelected = answers[currentQuestion.id] === optIdx;
                  const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectPgOption(optIdx)}
                      className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-600 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {letter}
                      </div>
                      <span className={`flex-1 ${fontSizeClass} ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {opt}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. PG KOMPLEKS (MULTI CHECKBOX) */}
            {currentQuestion.type === 'pg_kompleks' && currentQuestion.options && (
              <div className="space-y-2.5 pt-2">
                <p className="text-xs text-purple-700 font-semibold mb-2">
                  ℹ️ Anda dapat memilih lebih dari satu jawaban yang benar:
                </p>
                {currentQuestion.options.map((opt, optIdx) => {
                  const selectedList: number[] = Array.isArray(answers[currentQuestion.id])
                    ? answers[currentQuestion.id]
                    : [];
                  const isSelected = selectedList.includes(optIdx);
                  const letter = String.fromCharCode(65 + optIdx);

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleTogglePgKompleks(optIdx)}
                      className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-purple-50/80 border-purple-600 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs transition border ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : 'bg-white border-slate-300 text-slate-400'
                      }`}>
                        {isSelected ? '✓' : ''}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-slate-900 mr-2">[{letter}]</span>
                        <span className={`${fontSizeClass} ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                          {opt}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. BENAR / SALAH (TABEL PERNYATAAN) */}
            {currentQuestion.type === 'benar_salah' && currentQuestion.statements && (
              <div className="pt-2 space-y-3">
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
                        const userAns = answers[currentQuestion.id]?.[st.id];

                        return (
                          <tr key={st.id} className="hover:bg-slate-50 transition">
                            <td className="px-3 py-3 text-center font-bold text-slate-500">
                              {stIdx + 1}
                            </td>
                            <td className={`px-3 py-3 text-slate-800 ${fontSizeClass}`}>
                              {st.statement}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleSelectBenarSalah(st.id, true)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  userAns === true
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
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  userAns === false
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
              <div className="pt-2 space-y-3">
                <p className="text-xs text-emerald-700 font-semibold">
                  ℹ️ Pasangkan premis sebelah kiri dengan pasangan yang tepat di sebelah kanan:
                </p>
                <div className="space-y-2.5">
                  {currentQuestion.matchingPairs.map((pair, pIdx) => {
                    const currentMatch = answers[currentQuestion.id]?.[pair.id] || '';
                    const availableOptions = currentQuestion.matchingPairs!.map(p => p.rightMatch);

                    return (
                      <div 
                        key={pair.id} 
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="sm:w-1/2 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                            {pIdx + 1}
                          </span>
                          <span className={`font-semibold text-slate-900 ${fontSizeClass}`}>
                            {pair.leftPrompt}
                          </span>
                        </div>

                        <div className="sm:w-1/2 flex items-center gap-2">
                          <span className="text-slate-400 font-bold text-xs">➔</span>
                          <select
                            value={currentMatch}
                            onChange={(e) => handleSelectMenjodohkan(pair.id, e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
                          >
                            <option value="">-- Pilih Pasangan Jawaban --</option>
                            {availableOptions.map((opt, oIdx) => (
                              <option key={oIdx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TOMBOL NAVIGASI BAWAH */}
            {/* ------------------------------------------------------------- */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
              
              {/* Previous button */}
              <button
                type="button"
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
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
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  doubtfuls[currentQuestion.id]
                    ? 'bg-amber-500 text-white border border-amber-600'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>🟨</span>
                <span>{doubtfuls[currentQuestion.id] ? 'Hilangkan Ragu-Ragu' : 'Tandai Ragu-Ragu'}</span>
              </button>

              {/* Next button */}
              {currentIdx < exam.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx(prev => Math.min(exam.questions.length - 1, prev + 1))}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  <span>Soal Berikutnya</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <span>✓ Kumpulkan Ujian</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* KOLOM KANAN (1/4): LACI NOMOR SOAL & RINGKASAN PROGRESS */}
        <aside className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 sticky top-20">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>📑 Daftar Nomor Soal</span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {answeredCount}/{exam.questions.length} Selesai
              </span>
            </div>

            {/* Grid Tombol Nomor Soal (1 s/d N) */}
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((q, qIdx) => {
                const isCurrent = qIdx === currentIdx;
                const isDoubtful = Boolean(doubtfuls[q.id]);
                
                // check if answered
                const a = answers[q.id];
                let isAnswered = false;
                if (a !== undefined && a !== null) {
                  if (q.type === 'pg') isAnswered = typeof a === 'number';
                  else if (q.type === 'pg_kompleks') isAnswered = Array.isArray(a) && a.length > 0;
                  else if (q.type === 'benar_salah') isAnswered = Object.keys(a).length > 0;
                  else if (q.type === 'menjodohkan') isAnswered = Object.keys(a).length > 0;
                }

                let badgeColor = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
                if (isDoubtful) {
                  badgeColor = 'bg-amber-400 border-amber-500 text-slate-900 font-extrabold';
                } else if (isAnswered) {
                  badgeColor = 'bg-emerald-600 border-emerald-600 text-white font-bold';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(qIdx)}
                    className={`h-9 rounded-xl border font-mono text-xs transition cursor-pointer flex items-center justify-center relative ${badgeColor} ${
                      isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                    }`}
                  >
                    <span>{qIdx + 1}</span>
                  </button>
                );
              })}
            </div>

            {/* Keterangan Warna */}
            <div className="text-[11px] text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block" />
                <span>Hijau = Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-400 inline-block" />
                <span>Kuning = Ragu-Ragu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300 inline-block" />
                <span>Putih = Belum Dijawab</span>
              </div>
            </div>

            {/* Tombol Kumpulkan Jawaban */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>🔴 Selesai & Kumpulkan</span>
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

      {/* MODAL PERINGATAN CURANG / PINDAH TAB (TOLERANSI 1 & 2) */}
      {warningMessage && !isLockedByViolation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-md">
          <div className="bg-white border-2 border-amber-500 rounded-3xl p-6 sm:p-7 max-w-md w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 border border-amber-200 mx-auto flex items-center justify-center text-3xl font-black">
              ⚠️
            </div>
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black uppercase tracking-wider">
                Peringatan Integritas ({violationCount}/3)
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 pt-1">
                Terdeteksi Meninggalkan Ujian
              </h3>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed text-left space-y-1.5">
              <p className="font-semibold whitespace-pre-line">{warningMessage}</p>
              <p className="text-[11px] text-amber-800 border-t border-amber-200/80 pt-1.5">
                Aktivitas ini dicatat di monitor Panitia & Pengawas Ruangan. Sisa kesempatan: <strong>{Math.max(0, 3 - violationCount)}x</strong> sebelum sistem <strong>MENGUNCI TOTAL</strong> lembar ujian Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setWarningMessage(null);
                enterFullscreen();
              }}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-lg shadow-amber-600/30 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Saya Mengerti & Lanjutkan Ujian</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL LOCKDOWN RESMI CBT (REMOTE UNLOCK ONLY - RINGKAS & RAPIH) */}
      {isLockedByViolation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md select-none">
          <div className="bg-slate-900 border border-rose-500/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-sm sm:max-w-md w-full text-center space-y-3.5 shadow-2xl shadow-rose-950/80 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            
            {/* Icon & Badge */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/40 flex items-center justify-center text-2xl shadow-inner animate-pulse">
                🔒
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider">
                <span>●</span>
                <span>UJIAN TERKUNCI</span>
              </div>
            </div>

            {/* Title & Short Reason */}
            <div className="space-y-0.5">
              <h2 className="text-base sm:text-lg font-black text-white">
                Akses Ujian Dibekukan
              </h2>
              <p className="text-xs text-rose-300">
                Terdeteksi meninggalkan lembar ujian ({violationCount}x keluar).
              </p>
            </div>

            {/* Compact Student Identity */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-300 grid grid-cols-2 gap-2 text-left">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold tracking-wider">Peserta</span>
                <span className="font-bold text-white truncate block">{student.name}</span>
                <span className="text-[11px] text-slate-400 font-mono">{student.classId} • {student.nisn}</span>
              </div>
              <div className="border-l border-slate-700/60 pl-2">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold tracking-wider">Ruangan</span>
                <span className="font-semibold text-slate-200 block truncate">{roomName}</span>
                <span className="text-[10px] text-rose-400 font-semibold block mt-0.5">🚨 Status: Terkunci</span>
              </div>
            </div>

            {/* Concise Instruction */}
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 text-center leading-relaxed">
              ✋ <strong>Angkat tangan</strong> dan lapor ke <strong>Pengawas Ruangan</strong> untuk membuka kunci ujian dari Meja Pengawas.
            </div>

            {/* Real-time Status & Sync */}
            {violationCount === 0 ? (
              <div className="space-y-2">
                <div className="py-2.5 px-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs">
                  <span>✅</span>
                  <span>Kunci Telah Dibuka Pengawas!</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    lastViolationTimeRef.current = Date.now() + 4000;
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
              <div className="space-y-2">
                <div className="py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-center gap-2 text-amber-400 font-semibold text-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>Menunggu Buka Kunci Pengawas...</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleRemoteUnlock();
                  }}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  title="Klik untuk sinkronisasi manual jika pengawas sudah membuka kunci"
                >
                  <span>🔄</span>
                  <span>Cek Status Buka Kunci Pengawas</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL / OVERLAY: WAJIB LAYAR PENUH (FULLSCREEN ENFORCER) */}
      {!isFullscreen && !isExamCompleted && !isExamPaused && roomName !== 'Ruang Pratinjau Guru' && !isLockedByViolation && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center animate-fade-in select-none"
          onClick={enterFullscreen}
        >
          <div 
            className="max-w-md w-full bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5"
            onClick={(e) => {
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
              <h2 className="text-lg sm:text-xl font-black text-white">
                Wajib Masuk Layar Penuh
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Ujian <strong>{exam.title}</strong> wajib dikerjakan dalam mode <strong>Layar Penuh (Fullscreen)</strong> demi ketertiban dan pencegahan kecurangan.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-400 text-left space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                <span>Tab browser lain & navigasi Windows otomatis disembunyikan.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-400">⚠️</span>
                <span>Dilarang menekan tombol Esc, Alt+Tab, atau membuka aplikasi lain.</span>
              </div>
            </div>

            <button
              id="btn-activate-fullscreen"
              type="button"
              onClick={(e) => {
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
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Pengumpulan Ujian
              </h3>
              <p className="text-xs text-slate-500">
                Pastikan Anda telah meninjau seluruh jawaban sebelum mengakhiri sesi ujian.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Soal:</span>
                <span className="font-bold text-slate-800">{exam.questions.length} Butir</span>
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
                <span className="font-bold text-rose-700">{exam.questions.length - answeredCount} Soal</span>
              </div>
            </div>

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
                onClick={handleConfirmSubmit}
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
              <h3 className="text-lg font-black text-white">
                Sesi Ujian Sedang Dijeda
              </h3>
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
