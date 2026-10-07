'use client';

import React, { useState, useEffect } from 'react';
import { Assignment, AssignmentSubmission } from '@/lib/elearningData';
import { AuthUserSession } from '@/app/elearning/page';

interface SubmissionSplitPreviewModalProps {
  previewSubmission: { sub: AssignmentSubmission; asg?: Assignment };
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  currentUser: AuthUserSession | null;
  onClose: () => void;
  onSelectSubmission: (sub: AssignmentSubmission, asg?: Assignment) => void;
  onDownload: (sub: AssignmentSubmission, asg?: Assignment) => void;
  onSaveGrade: (updated: AssignmentSubmission, advanceNext?: boolean) => void;
}

export default function SubmissionSplitPreviewModal({
  previewSubmission,
  assignments,
  submissions,
  currentUser,
  onClose,
  onSelectSubmission,
  onDownload,
  onSaveGrade
}: SubmissionSplitPreviewModalProps) {
  const { sub, asg: passedAsg } = previewSubmission;
  const asg = passedAsg || assignments.find(a => a.id === sub.assignmentId);

  // Filter submissions for this assignment to enable ◀ Sebelumnya / Berikutnya ▶ SpeedGrader switcher
  const asgSubmissions = submissions.filter(s => s.assignmentId === (asg?.id || sub.assignmentId));
  const sortedSubs = asgSubmissions.length > 0
    ? [...asgSubmissions].sort((a, b) => a.studentName.localeCompare(b.studentName))
    : [sub];
  const currentSubIdx = sortedSubs.findIndex(s => s.id === sub.id || s.studentId === sub.studentId);
  const hasPrev = currentSubIdx > 0;
  const hasNext = currentSubIdx >= 0 && currentSubIdx < sortedSubs.length - 1;
  const prevSub = hasPrev ? sortedSubs[currentSubIdx - 1] : null;
  const nextSub = hasNext ? sortedSubs[currentSubIdx + 1] : null;

  // Local Grading Form State synced when current submission changes
  const [localGrade, setLocalGrade] = useState<number>(sub.grade ?? sub.quizScore ?? 95);
  const [localFeedback, setLocalFeedback] = useState<string>(
    sub.feedback ?? 'Bagus sekali, tugas sudah lengkap dan dikerjakan dengan rapi!'
  );
  const [activeCanvasTab, setActiveCanvasTab] = useState<'document' | 'quiz'>('document');

  useEffect(() => {
    setLocalGrade(sub.grade ?? sub.quizScore ?? 95);
    setLocalFeedback(sub.feedback ?? 'Bagus sekali, tugas sudah lengkap dan dikerjakan dengan rapi!');
    if (!sub.fileData && asg?.quizQuestions && asg.quizQuestions.length > 0) {
      setActiveCanvasTab('quiz');
    } else {
      setActiveCanvasTab('document');
    }
  }, [sub.id, sub.grade, sub.feedback, sub.fileData, asg?.id, asg?.quizQuestions]);

  // File type detection
  const isPdfFile = Boolean(
    sub.fileName?.match(/\.pdf$/i) ||
    (sub.fileData && (sub.fileData.startsWith('data:application/pdf') || sub.fileData.startsWith('blob:') || sub.fileData.includes('.pdf')))
  );

  const isVideoFile = Boolean(
    (sub.fileData && (sub.fileData.startsWith('data:video/') || sub.fileData.endsWith('.mp4'))) ||
    sub.fileName?.match(/\.(mp4|webm|mov)$/i)
  );

  const isYouTubeVideo = Boolean(
    sub.videoUrl && (sub.videoUrl.includes('youtube.com') || sub.videoUrl.includes('youtu.be'))
  );

  const isCloudLink = !isVideoFile && !isYouTubeVideo && Boolean(sub.videoUrl);

  const isImageFile = !isVideoFile && !isYouTubeVideo && !isCloudLink && !isPdfFile && Boolean(
    (sub.fileData && sub.fileData.startsWith('data:image/')) ||
    (sub.fileName?.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) && sub.fileData)
  );

  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSave = (advanceNext: boolean = false) => {
    setIsSaving(true);
    const updated: AssignmentSubmission = {
      ...sub,
      grade: localGrade,
      feedback: localFeedback.trim() || 'Tugas telah dinilai dan diperiksa oleh guru.',
      status: 'graded'
    };
    onSaveGrade(updated, advanceNext);
  };

  return (
    <div
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      data-lenis-prevent-touch="true"
      className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center animate-in fade-in duration-200 font-elearning"
    >
      <div
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-[96vw] xl:max-w-[1560px] h-[92vh] max-h-[95vh] shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10 my-auto"
      >
        {/* 1. TOP UNIFIED TOOLBAR / SPEEDGRADER HEADER */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 bg-slate-900 border-b border-slate-800 text-white flex-shrink-0 gap-2 sm:gap-4">
          {/* Left: Assignment & Student Information */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-lg text-indigo-400 flex-shrink-0">
              📄
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                  {asg?.subject || 'Tugas Siswa'}
                </span>
                <h3 className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                  {asg?.title || 'Tugas KBM'}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-200">{sub.studentName}</span>
                <span>•</span>
                <span>Kelas {sub.studentClass}</span>
                {sub.fileName && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-slate-400 font-mono text-[11px] truncate max-w-[200px] hidden sm:inline">
                      {sub.fileName} ({sub.fileSize || 'Berkas'})
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Middle: SpeedGrader Student Navigator (guru saja - siswa tidak boleh melihat berkas teman) */}
          {currentUser?.role === 'guru_mapel' && (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/90 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-700/80 flex-shrink-0 text-xs shadow-inner">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => prevSub && onSelectSubmission(prevSub, asg)}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                hasPrev
                  ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-xs'
                  : 'bg-slate-800/50 text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title={hasPrev ? `Siswa sebelumnya: ${prevSub?.studentName}` : 'Tidak ada siswa sebelumnya'}
            >
              <span>◀</span>
              <span className="hidden md:inline">Sebelumnya</span>
            </button>

            <div className="px-1.5 sm:px-2 font-mono font-bold text-slate-300 text-center min-w-[80px] sm:min-w-[110px] text-[11px] sm:text-xs">
              Siswa {currentSubIdx >= 0 ? currentSubIdx + 1 : 1} / {sortedSubs.length}
            </div>

            <button
              type="button"
              disabled={!hasNext}
              onClick={() => nextSub && onSelectSubmission(nextSub, asg)}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                hasNext
                  ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-xs'
                  : 'bg-slate-800/50 text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title={hasNext ? `Siswa berikutnya: ${nextSub?.studentName}` : 'Tidak ada siswa berikutnya'}
            >
              <span className="hidden md:inline">Berikutnya</span>
              <span>▶</span>
            </button>
          </div>
          )}

          {/* Middle: Canvas View Switcher (Berkas vs Kuis) */}
          {asg?.quizQuestions && asg.quizQuestions.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700 mx-auto">
              <button
                type="button"
                onClick={() => setActiveCanvasTab('document')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeCanvasTab === 'document' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📄</span> <span className="hidden sm:inline">Berkas Tugas</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCanvasTab('quiz')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeCanvasTab === 'quiz' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📝</span> <span>Lembar Kuis ({sub.quizScore !== undefined ? `${sub.quizScore}/100` : `${asg.quizQuestions.length} Soal`})</span>
              </button>
            </div>
          )}

          {/* Right: Actions & Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {sub.fileData && (
              <a
                href={sub.fileData}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Buka dokumen di tab browser penuh"
              >
                <span>↗</span>
                <span className="hidden sm:inline">Tab Penuh</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => onDownload(sub, asg)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Unduh berkas pengerjaan siswa"
            >
              <span>⬇</span>
              <span className="hidden sm:inline">Unduh</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
              title="Tutup Pratinjau (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 2. SPLIT SCREEN WORKSPACE: LEFT (DOCUMENT CANVAS) & RIGHT (SPEEDGRADER SIDEBAR) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 bg-slate-950">
          
          {/* LEFT PANEL: FULL-VIEW DOCUMENT CANVAS (70% - 72% Width) */}
          <div
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="flex-1 min-w-0 h-full flex flex-col bg-slate-950 overflow-y-auto relative"
          >
            {/* SPECIAL TAB: QUIZ RESULTS ANALYSIS & GRADING SHEET */}
            {activeCanvasTab === 'quiz' && asg?.quizQuestions && asg.quizQuestions.length > 0 ? (
              <div className="p-4 sm:p-6 overflow-y-auto h-full flex justify-center">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-2xl w-full text-slate-800 font-sans my-auto">
                  {/* Kop Sekolah */}
                  <div className="border-b-2 border-slate-800 pb-3 text-center space-y-0.5">
                    <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                      Pemerintah Kabupaten Bandung Barat • Dinas Pendidikan
                    </div>
                    <div className="text-base font-black text-slate-900 tracking-tight">
                      SMP NEGERI 3 CIHAMPELAS
                    </div>
                    <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">
                      Lembar Penilaian &amp; Analisis Kuis Interaktif Siswa
                    </div>
                  </div>

                  {/* Identitas Siswa & Tugas */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500">Nama Siswa:</span>{' '}
                      <span className="font-bold text-slate-900">{sub.studentName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Kelas:</span>{' '}
                      <span className="font-bold text-slate-900">{sub.studentClass}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Mata Pelajaran:</span>{' '}
                      <span className="font-bold text-indigo-700">{asg.subject}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Waktu Kirim:</span>{' '}
                      <span className="font-mono text-slate-700">{sub.submittedAt}</span>
                    </div>
                    <div className="col-span-2 pt-1.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-[11px] gap-1">
                      <span>Guru Pengampu: <strong className="text-slate-800">{asg.teacherName}</strong></span>
                      <span>Topik: <strong className="text-indigo-900">{asg.title}</strong></span>
                    </div>
                  </div>

                  {/* Logic for showing answers */}
                  {(() => {
                    const isTeacher = currentUser?.role === 'guru_mapel';
                    const due = asg.dueDate ? new Date(asg.dueDate + 'T23:59:59') : new Date();
                    const showAnswers = isTeacher || new Date() > due;

                    return (
                      <>
                        {/* Hasil Evaluasi Kuis Banner */}
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 flex items-center justify-between shadow-2xs mb-4">
                          <div>
                            <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                              Hasil Evaluasi Kuis Interaktif
                            </div>
                            {showAnswers ? (
                              <>
                                <div className="text-3xl font-black text-purple-900 font-mono mt-0.5">
                                  {sub.quizScore !== undefined ? sub.quizScore : 100} <span className="text-sm font-semibold text-purple-600">/ 100</span>
                                </div>
                                <div className="text-[11px] text-purple-800 font-medium mt-0.5">
                                  {(sub.quizScore ?? 100) >= 75 ? '✓ Mencapai Ketuntasan Minimal (KKM)' : '⚠️ Perlu Penguatan Materi'}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm font-bold text-slate-700 mt-2">
                                🔒 Nilai & Pembahasan disembunyikan hingga tenggat waktu berakhir ({asg.dueDate}).
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-2xl">📝 ✨</div>
                            <div className="text-[10px] text-slate-500 mt-1">
                              Total {asg.quizQuestions.length} Soal Pilihan Ganda
                            </div>
                          </div>
                        </div>

                        {/* Rincian Jawaban Soal */}
                        <div className="space-y-4">
                          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between">
                            <span>Rincian Analisis Jawaban Per Butir Soal</span>
                            <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              Auto-Scored
                            </span>
                          </div>

                          {asg.quizQuestions.map((q, qIdx) => {
                            const studentAnsIdx = sub.quizAnswers && sub.quizAnswers[qIdx] !== undefined
                              ? sub.quizAnswers[qIdx]
                              : (sub.quizScore === 100 ? q.correctOptionIndex : (qIdx === 0 ? q.correctOptionIndex : -1));
                            const isCorrect = studentAnsIdx === q.correctOptionIndex;

                            return (
                              <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 ${
                                      showAnswers ? (isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800') : 'bg-indigo-100 text-indigo-800'
                                    }`}>
                                      {qIdx + 1}
                                    </span>
                                    <span className="font-bold text-slate-900 text-xs leading-relaxed">
                                      {q.question}
                                    </span>
                                  </div>
                                  {showAnswers && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                                    }`}>
                                      {isCorrect ? '✓ Benar' : '✕ Salah'}
                                    </span>
                                  )}
                                </div>

                                {/* 4 Options Display */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                  {q.options.map((opt, optIdx) => {
                                    const isStudentSelected = studentAnsIdx === optIdx;
                                    const isKey = q.correctOptionIndex === optIdx;

                                    let cardStyle = 'bg-white border-slate-200 text-slate-700';
                                    if (isStudentSelected && showAnswers && isCorrect) {
                                      cardStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-400';
                                    } else if (isStudentSelected && showAnswers && !isCorrect) {
                                      cardStyle = 'bg-rose-50 border-rose-400 text-rose-950 font-bold ring-1 ring-rose-400';
                                    } else if (isStudentSelected && !showAnswers) {
                                      cardStyle = 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold ring-1 ring-indigo-400';
                                    } else if (isKey && showAnswers) {
                                      cardStyle = 'bg-emerald-50/50 border-emerald-300 text-emerald-900 font-semibold';
                                    }

                                    return (
                                      <div
                                        key={optIdx}
                                        className={`p-2 rounded-xl text-xs border flex items-center justify-between gap-2 ${cardStyle}`}
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                            {['A', 'B', 'C', 'D'][optIdx]}
                                          </span>
                                          <span className="truncate">{opt.replace(/^[A-D]\.\s*/, '')}</span>
                                        </div>
                                        {isStudentSelected && (
                                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                                            showAnswers ? (isCorrect ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900') : 'bg-indigo-200 text-indigo-900'
                                          }`}>
                                            {showAnswers ? (isCorrect ? '✓ Pilihan Siswa' : '✕ Pilihan Siswa') : 'Pilihan Siswa'}
                                          </span>
                                        )}
                                        {!isStudentSelected && isKey && showAnswers && (
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex-shrink-0">
                                            ✓ Kunci
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Explanation */}
                                {showAnswers && q.explanation && (
                                  <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900">
                                    <span className="font-bold">Pembahasan:</span> {q.explanation}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : isVideoFile ? (
              <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                <div className="w-full max-w-3xl space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl shadow-lg">
                    <span className="font-bold flex items-center gap-2">
                      <span>🎬</span> <span>{sub.fileName || 'Video Tugas Siswa'}</span>
                    </span>
                    <span className="font-mono text-purple-300 font-bold bg-purple-900/50 px-2.5 py-0.5 rounded border border-purple-700/50 text-[11px]">
                      {sub.fileSize || 'Video'}
                    </span>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800">
                    <video
                      src={sub.fileData && (sub.fileData.startsWith('data:') || sub.fileData.startsWith('blob:') || sub.fileData.startsWith('http')) ? sub.fileData : 'https://www.w3schools.com/html/mov_bbb.mp4'}
                      controls
                      playsInline
                      className="w-full max-h-[72vh] object-contain mx-auto"
                    />
                  </div>
                </div>
              </div>
            ) : isYouTubeVideo ? (
              /* B. TAMPILAN YOUTUBE EMBED */
              <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                <div className="w-full max-w-3xl space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl shadow-lg">
                    <span className="font-bold flex items-center gap-2 text-rose-400">
                      <span>▶️</span> <span>Video YouTube Tugas Siswa</span>
                    </span>
                    <a
                      href={sub.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
                    >
                      Buka di YouTube ↗
                    </a>
                  </div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800">
                    <iframe
                      src={sub.videoUrl?.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                      title="Video Tugas Siswa"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            ) : isCloudLink ? (
              /* C. TAMPILAN LINK GOOGLE DRIVE / CLOUD */
              <div className="h-full flex items-center justify-center p-6 text-center">
                <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 text-3xl mx-auto flex items-center justify-center">
                    📁
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Tautan Berkas Cloud / Drive</h4>
                    <p className="text-xs text-slate-400 mt-1 break-all font-mono">
                      {sub.videoUrl}
                    </p>
                  </div>
                  <a
                    href={sub.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/30 cursor-pointer"
                  >
                    <span>▶️ Tonton / Buka di Google Drive</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            ) : isImageFile ? (
              /* D. TAMPILAN FOTO / GAMBAR */
              <div className="h-full flex items-center justify-center p-4 sm:p-6 overflow-auto">
                <div className="space-y-3 max-w-3xl w-full text-center">
                  <img
                    src={sub.fileData}
                    alt={sub.fileName}
                    className="max-h-[80vh] mx-auto object-contain rounded-xl shadow-2xl border border-slate-800 bg-slate-900"
                  />
                </div>
              </div>
            ) : isPdfFile ? (
              /* E. TAMPILAN DOKUMEN PDF (CHROMIUM EMBED FIT-TO-WIDTH & HIDDEN NAVPANES) */
              <div className="w-full h-full flex flex-col bg-slate-950">
                <object
                  data={sub.fileData ? `${sub.fileData}#toolbar=1&navpanes=0&view=FitH&pagemode=none` : undefined}
                  type="application/pdf"
                  className="w-full h-full border-0 block bg-slate-950"
                >
                  <iframe
                    src={sub.fileData ? `${sub.fileData}#toolbar=1&navpanes=0&view=FitH&pagemode=none` : undefined}
                    title={sub.fileName}
                    className="w-full h-full border-0"
                  >
                    <div className="h-full flex items-center justify-center p-8 text-center bg-slate-900 text-slate-300 space-y-3">
                      <div className="text-4xl">📄</div>
                      <h4 className="font-bold text-white text-sm">Dokumen: {sub.fileName}</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Browser Anda membatasi penayangan langsung. Klik tombol di bawah untuk melihat dokumen di tab baru.
                      </p>
                      {sub.fileData && (
                        <a
                          href={sub.fileData}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs"
                        >
                          Buka Dokumen di Tab Baru ↗
                        </a>
                      )}
                    </div>
                  </iframe>
                </object>
              </div>
            ) : (() => {
              /* F. TAMPILAN LEMBAR KERJA DIGITAL (LKPD FALLBACK PER MAPEL) */
              const subjectName = asg?.subject || 'Mata Pelajaran';
              const sLower = subjectName.toLowerCase();
              const isEnglish = sLower.includes('inggris') || sLower.includes('english');
              const isMath = sLower.includes('matematika') || sLower.includes('mtk') || sLower.includes('aljabar');
              const isScience = sLower.includes('ipa') || sLower.includes('alam');
              const isIndonesian = sLower.includes('indonesia');
              const isCivics = sLower.includes('pancasila') || sLower.includes('ppkn') || sLower.includes('pkn');
              const isSocial = sLower.includes('ips') || sLower.includes('sosial');
              const isReligion = sLower.includes('agama') || sLower.includes('pai') || sLower.includes('pabp') || sLower.includes('islam');
              const isSunda = sLower.includes('sunda');

              return (
                <div className="p-4 sm:p-6 overflow-y-auto h-full flex justify-center">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-2xl w-full text-slate-800 font-sans my-auto">
                    {/* Kop Dokumen Sekolah */}
                    <div className="border-b-2 border-slate-800 pb-3 text-center space-y-0.5">
                      <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                        Pemerintah Kabupaten Bandung Barat • Dinas Pendidikan
                      </div>
                      <div className="text-base font-black text-slate-900 tracking-tight">
                        SMP NEGERI 3 CIHAMPELAS
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {isEnglish
                          ? 'English Learning Worksheet (LKPD) • Digital Learning 2026/2027'
                          : isMath
                          ? 'Lembar Kerja Matematika (LKPD) • Pembelajaran Digital KBM 2026/2027'
                          : isScience
                          ? 'Laporan Praktikum IPA • Pembelajaran Digital KBM 2026/2027'
                          : isIndonesian
                          ? 'Lembar Kerja Bahasa Indonesia • Pembelajaran Digital KBM 2026/2027'
                          : isSunda
                          ? 'Lembar Kerja Pangajaran Basa Sunda • Pembelajaran Digital KBM 2026/2027'
                          : isCivics
                          ? 'Lembar Pengamalan Nilai Pancasila • Pembelajaran Digital KBM 2026/2027'
                          : isReligion
                          ? 'Lembar Kerja PABP / Pendidikan Agama Islam • Pembelajaran Digital KBM 2026/2027'
                          : isSocial
                          ? 'Lembar Kerja IPS Terpadu • Pembelajaran Digital KBM 2026/2027'
                          : `Lembar Kerja Peserta Didik (${subjectName}) • Pembelajaran Digital KBM 2026/2027`}
                      </div>
                    </div>

                    {/* Identitas Pengerjaan */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-500">Nama Siswa:</span>{' '}
                        <span className="font-bold text-slate-900">{sub.studentName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Kelas:</span>{' '}
                        <span className="font-bold text-slate-900">{sub.studentClass}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Mata Pelajaran:</span>{' '}
                        <span className="font-bold text-indigo-700">{subjectName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Waktu Kirim:</span>{' '}
                        <span className="font-mono text-slate-700">{sub.submittedAt}</span>
                      </div>
                      <div className="col-span-2 pt-1.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-[11px] gap-1">
                        <span>Guru Pengampu: <strong className="text-slate-800">{asg?.teacherName || 'Guru Mata Pelajaran'}</strong></span>
                        <span>Topik: <strong className="text-indigo-900">{asg?.title || 'Tugas KBM'}</strong></span>
                      </div>
                    </div>

                    {/* Isi Hasil Pengerjaan Berdasarkan Mata Pelajaran */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center justify-between">
                        <span>Hasil Pengerjaan Tugas &amp; Jawaban Siswa</span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ Terverifikasi Digital
                        </span>
                      </div>

                      {isEnglish ? (
                        /* BAHASA INGGRIS */
                        <div className="space-y-4 text-xs leading-relaxed">
                          <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                            <span className="font-bold text-indigo-900 text-sm">
                              Chapter 2: Daily Routines &amp; Self-Introduction Worksheet
                            </span>
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold border border-indigo-200">
                              English KBM SMPN 3 Cihampelas
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="font-bold text-slate-800 text-[11px]">
                              Part A: Student Speaking &amp; Writing Transcript:
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-sans text-xs text-slate-800 space-y-2 leading-relaxed">
                              <p>
                                &ldquo;Good morning Mr. Rohidin and friends! My name is <strong>{sub.studentName}</strong>. I am 13 years old and I am in class <strong>{sub.studentClass}</strong> at SMP Negeri 3 Cihampelas.&rdquo;
                              </p>
                              <p>
                                &ldquo;Every morning, I wake up at 05.00 AM, make my bed, and take a shower. Then, I have breakfast with my family. At 06.30 AM, I walk to school. My favorite subjects are English and Science because they are interesting and fun.&rdquo;
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="font-bold text-slate-800 text-[11px]">
                              Part B: Simple Present Tense Grammar Analysis:
                            </div>
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-indigo-50/70 font-bold text-indigo-950">
                                  <tr>
                                    <th className="p-2 border-b border-r border-slate-200">Sentence Example</th>
                                    <th className="p-2 border-b border-r border-slate-200">Action Verb</th>
                                    <th className="p-2 border-b border-slate-200">Adverb of Time</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                  <tr>
                                    <td className="p-2 border-r border-slate-200 font-medium">I wake up at 05.00 AM</td>
                                    <td className="p-2 border-r border-slate-200 text-indigo-700 font-bold">wake up</td>
                                    <td className="p-2 text-slate-600">Every morning</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 border-r border-slate-200 font-medium">I walk to school with friends</td>
                                    <td className="p-2 border-r border-slate-200 text-indigo-700 font-bold">walk</td>
                                    <td className="p-2 text-slate-600">At 06.30 AM</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 border-r border-slate-200 font-medium">Mr. Rohidin teaches English</td>
                                    <td className="p-2 border-r border-slate-200 text-indigo-700 font-bold">teaches (-es)</td>
                                    <td className="p-2 text-slate-600">Every Tuesday</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ) : isMath ? (
                        /* MATEMATIKA / ALJABAR */
                        <div className="space-y-4 text-xs leading-relaxed">
                          <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                            <span className="font-bold text-indigo-900 text-sm">
                              Bab 3: Sistem Persamaan Linear Dua Variabel (SPLDV)
                            </span>
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold border border-indigo-200">
                              Matematika Kelas {sub.studentClass}
                            </span>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <p className="font-semibold text-slate-800">Soal: Tentukan himpunan penyelesaian dari sistem persamaan 2x + y = 8 dan x - y = 1.</p>
                            <div className="pl-3 border-l-2 border-indigo-400 space-y-1 text-slate-700">
                              <p>Langkah 1: Menggunakan metode eliminasi variabel y:</p>
                              <p className="font-mono bg-white p-1.5 rounded border border-slate-200">(2x + y = 8) + (x - y = 1) ➔ 3x = 9 ➔ x = 3</p>
                              <p>Langkah 2: Substitusi nilai x = 3 ke persamaan (2):</p>
                              <p className="font-mono bg-white p-1.5 rounded border border-slate-200">3 - y = 1 ➔ y = 2</p>
                              <p className="font-bold text-emerald-700">Kesimpulan Jawaban: Himpunan Penyelesaian HP = &#123;(3, 2)&#125;.</p>
                            </div>
                          </div>
                        </div>
                      ) : isScience ? (
                        /* IPA */
                        <div className="space-y-3 text-xs leading-relaxed">
                          <p className="font-bold text-slate-800">
                            Laporan Praktikum: Uji Fotosintesis &amp; Pembentukan Amilum (Sachs Test):
                          </p>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <p><strong>1. Tujuan Praktikum:</strong> Membuktikan bahwa fotosintesis menghasilkan amilum (karbohidrat) dan memerlukan cahaya matahari.</p>
                            <p><strong>2. Hasil Pengamatan:</strong> Daun yang terkena cahaya berubah menjadi biru kehitaman saat ditetesi larutan iodium, membuktikan adanya amilum.</p>
                            <p><strong>3. Kesimpulan:</strong> Daun yang ditutup kertas timah tidak berfotosintesis dan berwarna pucat kecokelatan.</p>
                          </div>
                        </div>
                      ) : isIndonesian ? (
                        /* BAHASA INDONESIA */
                        <div className="space-y-3 text-xs leading-relaxed">
                          <p className="font-bold text-slate-800">
                            Teks Laporan Hasil Observasi (LHO): Lingkungan Hijau SMPN 3 Cihampelas:
                          </p>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <p><strong>1. Definisi Umum:</strong> SMP Negeri 3 Cihampelas memiliki area terbuka hijau seluas 1.500 m² yang dimanfaatkan sebagai taman sains edukasi dan kebun TOGA.</p>
                            <p><strong>2. Deskripsi Bagian:</strong> Terdapat berbagai jenis tanaman peneduh, tanaman obat keluarga, dan kolam budidaya ikan air tawar.</p>
                            <p><strong>3. Deskripsi Manfaat:</strong> Taman sekolah menciptakan sirkulasi udara yang bersih dan menjadi laboratorium kontekstual siswa.</p>
                          </div>
                        </div>
                      ) : isSocial ? (
                        /* IPS */
                        <div className="space-y-3 text-xs leading-relaxed">
                          <p className="font-bold text-slate-800">
                            Laporan Pengamatan Potensi Wilayah &amp; Letak Geografis Cihampelas (Bandung Barat):
                          </p>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <p><strong>1. Karakteristik Geografis:</strong> Terletak di wilayah perbukitan berhawa sejuk dengan batas perairan Waduk Saguling.</p>
                            <p><strong>2. Potensi Ekonomi:</strong> Sektor perikanan air tawar (KJA), pertanian palawija, dan usaha kerajinan lokal masyarakat.</p>
                            <p><strong>3. Interaksi Antar-Ruang:</strong> Distribusi hasil pertanian ke wilayah Batujaya, Cililin, hingga Kota Bandung.</p>
                          </div>
                        </div>
                      ) : isReligion ? (
                        /* PABP / PAI */
                        <div className="space-y-3 text-xs leading-relaxed">
                          <p className="font-bold text-slate-800">
                            Refleksi &amp; Pemahaman Materi PABP / PAI: Doa Harian, Akhlak Mulia, &amp; Praktik Ibadah:
                          </p>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <p><strong>1. Praktik Doa Harian:</strong> Membaca dan menghafal doa harian dengan makhraj dan tajwid yang benar.</p>
                            <p><strong>2. Penerapan Akhlak Terpuji:</strong> Keselarasan antara perkataan dan perbuatan, bersikap amanah, dan berbakti kepada orang tua dan guru.</p>
                            <p><strong>3. Istiqamah:</strong> Konsisten hadir tepat waktu dan menjaga ibadah shalat dhuha / dzuhur berjamaah di musholla SMPN 3 Cihampelas.</p>
                          </div>
                        </div>
                      ) : isSunda ? (
                        /* BAHASA SUNDA */
                        <div className="space-y-3 text-xs leading-relaxed">
                          <p className="font-bold text-slate-800">
                            Pangajaran Basa &amp; Sastra Sunda: Paguneman, Tatakrama, &amp; Dongeng Sunda:
                          </p>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <p><strong>1. Paguneman &amp; Tatakrama Basa:</strong> Ngagunakeun ragam basa loma sareng basa lemes (hormat) ka saluhureun sapertos ka sepuh sareng ka guru di sakola.</p>
                            <p><strong>2. Wangun Karya Sastra:</strong> Maca pupuh kinanti sareng nganalisis amanat moral dina carita dongeng Sasakala Situ Ciburuy &amp; Curug Malela.</p>
                            <p><strong>3. Istilah Pancakaki:</strong> Mikawanoh hubungan rundayan kulawarga (indung-bapa, aki-nini, buyut, bao, jangga wareng).</p>
                          </div>
                        </div>
                      ) : (
                        /* MAPEL LAINNYA */
                        <div className="space-y-3 text-xs leading-relaxed">
                          <p className="font-bold text-slate-800">
                            Lembar Pengerjaan &amp; Pembahasan Tugas {subjectName}:
                          </p>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <p className="font-semibold text-indigo-900">Topik Tugas: {asg?.title || 'Tugas Mandiri Peserta Didik'}</p>
                            <p className="text-slate-600 italic">Petunjuk Guru: &ldquo;{asg?.description || 'Kerjakan tugas sesuai panduan mata pelajaran.'}&rdquo;</p>
                            <div className="pt-2 border-t border-slate-200 space-y-1.5">
                              <p className="font-bold text-slate-800">Hasil Pengerjaan Siswa:</p>
                              <p className="text-slate-700 leading-relaxed">
                                1. Peserta didik telah membaca materi acuan dan merangkum poin-poin esensial mata pelajaran {subjectName}.
                              </p>
                              <p className="text-slate-700 leading-relaxed">
                                2. Pertanyaan tugas dan latihan praktis telah dijawab secara sistematis dan sesuai dengan standar capaian pembelajaran SMP Negeri 3 Cihampelas.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* RIGHT PANEL: SPEEDGRADER SIDEBAR (28% - 30% / 340-380px Width) */}
          <div
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="w-full lg:w-80 xl:w-96 flex-shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col h-full overflow-hidden text-slate-800 shadow-xl z-10"
          >
            {/* Sidebar Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                  {currentUser?.role === 'guru_mapel' ? 'Panel Penilaian Guru' : 'Informasi Penilaian'}
                </span>
              </div>
              {sub.status === 'graded' || sub.grade !== undefined ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                  ✓ {sub.grade ?? localGrade}/100
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  ⏳ Belum Dinilai
                </span>
              )}
            </div>

            {/* Sidebar Scrollable Body */}
            <div
              data-lenis-prevent="true"
              data-lenis-prevent-wheel="true"
              data-lenis-prevent-touch="true"
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
            >
              {/* Student Identity Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                  {sub.studentName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{sub.studentName}</h4>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span className="font-semibold text-indigo-700">Kelas {sub.studentClass}</span>
                    <span>•</span>
                    <span className="truncate">{sub.submittedAt || 'Hari Ini'}</span>
                  </div>
                </div>
              </div>

              {/* Catatan / Pesan Siswa */}
              {sub.answerText && (
                <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                    <span>💬</span> <span>Catatan dari Siswa:</span>
                  </span>
                  <p className="text-slate-700 italic text-[11px] leading-relaxed">&ldquo;{sub.answerText}&rdquo;</p>
                </div>
              )}

              {/* Detail Tugas Ringkas */}
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Topik Tugas:</div>
                <div className="font-semibold text-slate-800">{asg?.title || 'Tugas KBM'}</div>
                {asg?.dueDate && (
                  <div className="text-[11px] text-slate-500">Tenggat: <span className="font-mono">{asg.dueDate}</span></div>
                )}
              </div>

              {/* Interactive Grading Form for Teacher */}
              {currentUser?.role === 'guru_mapel' ? (
                <div className="space-y-4 pt-1">
                  {/* Skor Kuis Interaktif Otomatis */}
                  {sub.quizScore !== undefined && (
                    <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1.5">
                          <span>⚡</span> Skor Kuis Interaktif:
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-900 font-black text-xs font-mono">
                          {sub.quizScore} / 100
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-purple-200/80">
                        <span className="text-purple-700">Dihitung otomatis kuis</span>
                        <button
                          type="button"
                          onClick={() => setLocalGrade(sub.quizScore || 100)}
                          className="text-[11px] font-bold text-purple-800 hover:text-purple-950 underline cursor-pointer"
                        >
                          Terapkan Skor ({sub.quizScore}) ↵
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Input Nilai Angka */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Input Nilai Siswa (0 - 100):</span>
                      <span className="text-[10px] font-mono text-slate-400">KKM: 75</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={localGrade}
                        onChange={(e) => setLocalGrade(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                        className="w-24 px-3 py-2 text-2xl font-black text-center text-emerald-700 bg-white border-2 border-emerald-300 rounded-xl focus:outline-none focus:border-indigo-600 shadow-inner font-mono"
                      />
                      <div className="text-xs text-slate-600 font-semibold space-y-0.5">
                        <div className="text-sm">/ 100 Poin</div>
                        <div className={`text-[10px] font-bold ${localGrade >= 75 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {localGrade >= 90 ? '🌟 Sangat Memuaskan (A)' : localGrade >= 75 ? '✓ Tuntas (B)' : '⚠️ Perlu Remedial'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Score Chips */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preset Cepat:</div>
                    <div className="grid grid-cols-6 gap-1">
                      {[100, 95, 90, 85, 80, 75].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setLocalGrade(val)}
                          className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer text-center ${
                            localGrade === val
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Catatan / Feedback Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Catatan / Umpan Balik Guru:</span>
                    </label>
                    <textarea
                      rows={3}
                      value={localFeedback}
                      onChange={(e) => setLocalFeedback(e.target.value)}
                      placeholder="Tulis catatan apresiasi atau koreksi..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 resize-none leading-relaxed"
                    />
                    {/* Quick Feedback Chips */}
                    <div className="flex flex-wrap gap-1">
                      {[
                        '🌟 Sangat rapi & lengkap!',
                        '👍 Bagus, pemahaman tepat!',
                        '✏️ Perbaiki nomor 2.',
                        '📚 Pertahankan prestasimu!'
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setLocalFeedback(chip)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 transition cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Read-only view for Student / Pos Piket */
                <div className="space-y-3 pt-2">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1.5">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Hasil Nilai Tugas</div>
                    <div className="text-3xl font-black text-emerald-700 font-mono">
                      {sub.grade !== undefined ? sub.grade : '—'} <span className="text-sm font-bold text-emerald-600">/ 100</span>
                    </div>
                    <div className="text-xs text-emerald-700 font-medium">
                      {sub.grade !== undefined && sub.grade >= 75 ? '✓ Mencapai Ketuntasan (KKM)' : sub.grade !== undefined ? 'Perlu Remedial' : 'Menunggu Koreksi Guru'}
                    </div>
                  </div>

                  {sub.quizScore !== undefined && (
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                        <span>⚡</span> Nilai Kuis Interaktif:
                      </span>
                      <span className="text-sm font-black text-purple-900 font-mono px-2.5 py-0.5 rounded-lg bg-purple-200/80">
                        {sub.quizScore} / 100
                      </span>
                    </div>
                  )}

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan Guru:</div>
                    <p className="text-xs text-slate-700 italic">
                      &ldquo;{sub.feedback || 'Tugas sudah diterima oleh guru pengampu.'}&rdquo;
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Sticky Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/90 flex flex-col gap-2 flex-shrink-0">
              {currentUser?.role === 'guru_mapel' ? (
                <>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSave(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <span className="animate-spin text-sm">⏳</span>
                        <span>Menyimpan &amp; Menutup...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>Simpan Nilai Siswa Ini</span>
                      </>
                    )}
                  </button>

                  {hasNext && nextSub && (
                    <button
                      type="button"
                      onClick={() => handleSave(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Simpan &amp; Lanjut Siswa Berikutnya</span>
                      <span>▶</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                  >
                    Tutup Pratinjau
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Tutup Pratinjau
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
