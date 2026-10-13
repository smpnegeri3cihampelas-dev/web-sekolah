'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CbtExamPackage,
  CbtQuestion,
  CbtStudentAnswerState,
  saveStoredStudentCbtSession,
  gradeCbtAnswers
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

  // Student answer state
  const [answers, setAnswers] = useState<Record<string, any>>(
    initialSession?.answers || {}
  );
  const [doubtfuls, setDoubtfuls] = useState<Record<string, boolean>>(
    initialSession?.doubtfuls || {}
  );
  const [audioPlays, setAudioPlays] = useState<Record<string, number>>(
    initialSession?.audioPlayCount || {}
  );
  const [violationCount, setViolationCount] = useState<number>(
    initialSession?.violationCount || 0
  );

  // Time remaining in seconds
  const totalDurationSeconds = exam.durationMinutes * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (initialSession?.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(initialSession.startedAt).getTime()) / 1000);
      return Math.max(0, totalDurationSeconds - elapsed);
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

  // Audio playing ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const startedAtRef = useRef<string>(
    initialSession?.startedAt || new Date().toISOString()
  );

  // 1. Timer countdown
  useEffect(() => {
    if (isExamCompleted) return;

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
  }, [isExamCompleted]);

  // 2. Anti-Cheating: Window blur / tab switch detection
  useEffect(() => {
    if (isExamCompleted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolationCount(prev => {
          const nextCount = prev + 1;
          setWarningMessage(
            `⚠️ PERINGATAN INTEGRITAS UJIAN!\nAnda terdeteksi berpindah tab/layar (${nextCount}/3). Harap tetap berada di lembar ujian CBT.`
          );
          // Persist violation
          persistSession(answers, doubtfuls, nextCount);
          return nextCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isExamCompleted, answers, doubtfuls]);

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
    const newAnswers = { ...answers, [currentQuestion.id]: optionIdx };
    setAnswers(newAnswers);
    persistSession(newAnswers, doubtfuls);
  };

  // Answer handler for PG Kompleks (Multi Checkbox)
  const handleTogglePgKompleks = (optionIdx: number) => {
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
    const currentObj = answers[currentQuestion.id] || {};
    const updatedObj = { ...currentObj, [statementId]: value };
    const newAnswers = { ...answers, [currentQuestion.id]: updatedObj };
    setAnswers(newAnswers);
    persistSession(newAnswers, doubtfuls);
  };

  // Answer handler for Menjodohkan
  const handleSelectMenjodohkan = (matchingId: string, rightValue: string) => {
    const currentObj = answers[currentQuestion.id] || {};
    const updatedObj = { ...currentObj, [matchingId]: rightValue };
    const newAnswers = { ...answers, [currentQuestion.id]: updatedObj };
    setAnswers(newAnswers);
    persistSession(newAnswers, doubtfuls);
  };

  // Toggle Ragu-Ragu
  const handleToggleDoubtful = () => {
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

          <button
            type="button"
            onClick={onExitRoom}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/30 cursor-pointer"
          >
            Kembali ke Beranda E-Learning
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TAMPILAN RUANG UJIAN CBT AKTIF (FOCUS MODE)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      
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
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            
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

      {/* MODAL PERINGATAN CURANG / PINDAH TAB */}
      {warningMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white border-2 border-rose-500 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center text-2xl font-black">
              ⚠️
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Peringatan Integritas Ujian!
            </h3>
            <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
              {warningMessage}
            </p>
            <button
              type="button"
              onClick={() => setWarningMessage(null)}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Saya Mengerti & Lanjutkan Ujian
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

    </div>
  );
}
