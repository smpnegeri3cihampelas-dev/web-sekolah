'use client';

import React, { useState } from 'react';
import { Assignment, AssignmentSubmission, Student } from '@/lib/elearningData';

interface StudentSubmitModalProps {
  asg: Assignment;
  currentStudent: Student;
  existingSubmission?: AssignmentSubmission;
  onClose: () => void;
  onSubmit: (data: {
    selectedFile: File | null;
    fileName: string;
    fileSize: string;
    fileData: string;
    videoUrl: string;
    answerText: string;
    quizAnswers: Record<string, number>;
  }) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

type StudentTab = 'petunjuk' | 'kuis' | 'unggah';

export default function StudentSubmitModal({
  asg,
  currentStudent,
  existingSubmission,
  onClose,
  onSubmit,
  showToast
}: StudentSubmitModalProps) {
  // Local isolated state: typing here will NEVER re-render the 4000+ line parent page!
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>(existingSubmission?.fileName || '');
  const [fileSize, setFileSize] = useState<string>(existingSubmission?.fileSize || '');
  const [fileData, setFileData] = useState<string>(existingSubmission?.fileData || '');
  const [videoUrl, setVideoUrl] = useState<string>(existingSubmission?.videoUrl || '');
  const [answerText, setAnswerText] = useState<string>(existingSubmission?.answerText || '');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>(() => {
    if (existingSubmission?.quizAnswers && asg.quizQuestions) {
      const initial: Record<string, number> = {};
      asg.quizQuestions.forEach((q, idx) => {
        const prev = existingSubmission.quizAnswers?.[idx];
        if (prev !== undefined && prev >= 0) {
          initial[q.id] = prev;
        }
      });
      return initial;
    }
    return {};
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Tabs: Petunjuk & Materi | Kerjakan Kuis | Unggah Tugas
  const hasQuiz = Boolean(asg.quizQuestions && asg.quizQuestions.length > 0);
  const hasMateri = Boolean(asg.videoUrl || asg.materialUrl);
  const tabs: { id: StudentTab; label: string; icon: string }[] = [
    { id: 'petunjuk', label: hasMateri ? 'Petunjuk & Materi' : 'Petunjuk', icon: '📖' },
    ...(hasQuiz ? [{ id: 'kuis' as StudentTab, label: 'Kerjakan Kuis', icon: '📝' }] : []),
    { id: 'unggah', label: 'Unggah Tugas', icon: '📤' }
  ];
  const [activeTab, setActiveTab] = useState<StudentTab>(hasQuiz ? 'kuis' : 'unggah');
  const activeIdx = tabs.findIndex(t => t.id === activeTab);
  const nextTab = activeIdx >= 0 && activeIdx < tabs.length - 1 ? tabs[activeIdx + 1] : null;

  const totalQuestions = asg.quizQuestions?.length || 0;
  const answeredCount = Object.keys(quizAnswers).length;
  const hasUpload = Boolean(fileName || videoUrl.trim() || answerText.trim());

  const generateMockNotebookSvg = (subject: string, studentName: string, title: string) => {
    const subjectText = `
      <text x="95" y="190" font-family="monospace" font-size="14" font-weight="bold" fill="#1e3a8a">Hasil Pengerjaan Tugas ${subject}:</text>
      <text x="95" y="225" font-family="sans-serif" font-size="13" fill="#1e293b">1. Topik Tugas: ${title}</text>
      <text x="95" y="253" font-family="sans-serif" font-size="13" fill="#1e293b">2. Semua instruksi guru pengampu telah dikerjakan secara runut.</text>
      <text x="95" y="281" font-family="sans-serif" font-size="13" fill="#1e293b">3. Catatan dan resume materi pembelajaran tersusun rapi.</text>
      <text x="95" y="319" font-family="sans-serif" font-size="13" font-style="italic" fill="#047857">Peserta Didik: ${studentName} (Kelas 7-A)</text>
    `;

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasQuizAnswered = hasQuiz && answeredCount > 0;

    if (!hasUpload && !hasQuizAnswered) {
      showToast('Silakan jawab kuis, unggah berkas tugas, atau tulis catatan pengerjaan!', 'warn');
      setActiveTab(hasQuiz ? 'kuis' : 'unggah');
      return;
    }

    if (hasQuiz && answeredCount < totalQuestions) {
      const ok = confirm(`Masih ada ${totalQuestions - answeredCount} soal kuis yang belum dijawab. Tetap kirim sekarang?`);
      if (!ok) {
        setActiveTab('kuis');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        selectedFile,
        fileName,
        fileSize,
        fileData,
        videoUrl,
        answerText,
        quizAnswers
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- TAB CONTENTS ----------

  const renderPetunjukTab = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <span>🧑‍🏫</span> Petunjuk dari {asg.teacherName}
        </div>
        <p className="text-slate-600 leading-relaxed whitespace-pre-line">{asg.description}</p>
      </div>

      {asg.videoUrl && (() => {
        let embedUrl = asg.videoUrl;
        if (asg.videoUrl.includes('youtube.com/watch?v=')) {
          const videoId = asg.videoUrl.split('watch?v=')[1]?.split('&')[0];
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (asg.videoUrl.includes('youtu.be/')) {
          const videoId = asg.videoUrl.split('youtu.be/')[1]?.split('?')[0];
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        const isEmbed = embedUrl.includes('youtube.com/embed');

        return (
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                <span>🎬</span> {asg.videoTitle || 'Video Pembelajaran'}
              </span>
              <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-mono">Materi Video</span>
            </div>
            {isEmbed ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-amber-300 shadow-inner bg-black">
                <iframe
                  src={embedUrl}
                  title={asg.videoTitle || 'Video Pembelajaran'}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-3">
                <div className="truncate min-w-0">
                  <div className="font-semibold text-slate-800 text-xs truncate">{asg.videoTitle || 'Video Pembelajaran Guru'}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{asg.videoUrl}</div>
                </div>
                <a
                  href={asg.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 flex-shrink-0 cursor-pointer shadow-xs"
                >
                  ▶ Putar Video ↗
                </a>
              </div>
            )}
          </div>
        );
      })()}

      {asg.materialUrl && (
        <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg flex-shrink-0">📄</div>
            <div className="min-w-0">
              <div className="font-bold text-blue-950 text-xs truncate">{asg.materialName || 'Bahan Ajar / LKPD Guru'}</div>
              <div className="text-[10px] text-blue-700 font-medium">Pelajari materi atau unduh LKPD ini sebagai panduan.</div>
            </div>
          </div>
          <a
            href={asg.materialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 flex-shrink-0 cursor-pointer shadow-xs"
          >
            Buka LKPD ↗
          </a>
        </div>
      )}

      {!hasMateri && (
        <div className="text-[11px] text-slate-400 text-center py-2">Guru tidak melampirkan video atau modul untuk tugas ini.</div>
      )}
    </div>
  );

  const renderKuisTab = () => (
    <div className="space-y-3">
      <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-purple-950">Kuis Pilihan Ganda</span>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-900 font-black text-[11px] font-mono">
            {answeredCount} / {totalQuestions} Terjawab
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-purple-100 overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all duration-300"
            style={{ width: `${totalQuestions ? (answeredCount / totalQuestions) * 100 : 0}%` }}
          />
        </div>
        <p className="text-[10px] text-purple-800">Pilih satu jawaban untuk setiap soal. Nilai dihitung otomatis setelah tugas dikirim.</p>
      </div>

      {asg.quizQuestions?.map((q, qIdx) => {
        const selectedOpt = quizAnswers[q.id];
        const isAnswered = selectedOpt !== undefined;
        return (
          <div
            key={q.id}
            className={`p-3.5 bg-white rounded-2xl border space-y-2.5 transition ${isAnswered ? 'border-purple-300 shadow-xs' : 'border-slate-200'}`}
          >
            <div className="flex items-start gap-2">
              <span className={`w-6 h-6 rounded-full font-black text-[11px] flex items-center justify-center flex-shrink-0 ${isAnswered ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {qIdx + 1}
              </span>
              <span className="font-bold text-slate-800 text-xs leading-relaxed pt-0.5">{q.question}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {q.options.map((opt, optIdx) => {
                const isSelected = selectedOpt === optIdx;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                    className={`p-2.5 rounded-xl text-left text-xs transition border flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-semibold'
                        : 'bg-slate-50 hover:bg-purple-50 hover:border-purple-300 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isSelected ? 'bg-white text-purple-700' : 'bg-slate-200 text-slate-600'}`}>
                      {['A', 'B', 'C', 'D'][optIdx]}
                    </span>
                    <span>{opt.replace(/^[A-D]\.\s*/, '')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderUnggahTab = () => (
    <div className="space-y-4 text-xs">
      <div>
        <label className="block font-bold text-slate-700 mb-1.5">
          {hasQuiz ? 'Unggah Berkas / Foto Buku Tugas (opsional jika sudah menjawab kuis)' : 'Unggah Berkas / Foto Lembar Tugas *'}
        </label>
        <div className="border-2 border-dashed border-slate-300 hover:border-purple-400 rounded-2xl p-4 text-center space-y-2 bg-purple-50/20 transition">
          <div className="text-2xl">📸 📄</div>
          <div className="text-xs font-semibold text-slate-700">
            {fileName ? (
              <span className="text-purple-700 font-bold flex items-center justify-center gap-1">
                <span>✓ File Terpilih:</span> <span className="truncate max-w-[260px]">{fileName}</span>
              </span>
            ) : (
              'Pilih file foto (JPG/PNG), dokumen (PDF/Word), atau video rekaman (MP4)'
            )}
          </div>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.docx,.mp4,.webm,.mov"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setSelectedFile(file);
                setFileName(file.name);
                const sizeStr = file.size > 1024 * 1024
                  ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
                  : Math.max(1, Math.round(file.size / 1024)) + ' KB';
                setFileSize(sizeStr);
                setFileData(URL.createObjectURL(file));
              }
            }}
            className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer"
          />
        </div>

        {/* Fast Simulation Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-[10px] text-slate-400 font-medium">Contoh Cepat:</span>
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              setFileName(`Foto_Buku_Tugas_${currentStudent.name.replace(/\s+/g, '_')}.jpg`);
              setFileSize('2.4 MB');
              setFileData(generateMockNotebookSvg(asg.subject, currentStudent.name, asg.title));
              setVideoUrl('');
            }}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-600 transition cursor-pointer"
          >
            📷 Foto Tugas.jpg
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              setFileName(`Laporan_${asg.subject.split(' ')[0]}_${currentStudent.name.replace(/\s+/g, '_')}.pdf`);
              setFileSize('1.5 MB');
              setFileData('');
              setVideoUrl('');
            }}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-600 transition cursor-pointer"
          >
            📄 Dokumen.pdf
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              setFileName(`Video_Praktik_${currentStudent.name.replace(/\s+/g, '_')}.mp4`);
              setFileSize('14.2 MB');
              setFileData('https://www.w3schools.com/html/mov_bbb.mp4');
              setVideoUrl('');
            }}
            className="px-2 py-0.5 rounded-md bg-purple-100 hover:bg-purple-200 text-[10px] font-bold text-purple-700 transition cursor-pointer"
          >
            🎥 Video.mp4
          </button>
          {fileName && (
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setFileName('');
                setFileSize('');
                setFileData('');
              }}
              className="ml-auto text-[10px] text-rose-600 hover:underline cursor-pointer"
            >
              Hapus Berkas
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block font-bold text-slate-700 mb-1">
          Atau Tautan Video (YouTube / Google Drive) <span className="text-slate-400 font-normal">· alternatif jika file video besar</span>
        </label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Contoh: https://drive.google.com/file/... atau https://youtu.be/..."
          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-600 text-xs"
        />
      </div>

      <div>
        <label className="block font-bold text-slate-700 mb-1">Catatan untuk Guru (Opsional)</label>
        <textarea
          rows={3}
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder="Tuliskan catatan, ringkasan jawaban, atau ucapan untuk Bapak/Ibu guru..."
          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-600 text-xs resize-none"
        />
      </div>
    </div>
  );

  const tabBadge = (id: StudentTab) => {
    if (id === 'kuis') {
      const done = answeredCount === totalQuestions && totalQuestions > 0;
      return (
        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black font-mono ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
          {answeredCount}/{totalQuestions}
        </span>
      );
    }
    if (id === 'unggah' && hasUpload) {
      return <span className="ml-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-black inline-flex items-center justify-center">✓</span>;
    }
    return null;
  };

  return (
    <div
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      data-lenis-prevent-touch="true"
      className="fixed inset-0 z-[80] bg-slate-900/80 backdrop-blur-xs p-3 sm:p-4 flex items-center justify-center animate-in fade-in duration-150 font-elearning"
    >
      <form
        onSubmit={handleFormSubmit}
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* HEADER (fixed) */}
        <div className="px-5 sm:px-7 pt-5 pb-3 flex items-start justify-between gap-3 flex-shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">{asg.subject}</span>
              <span className="text-xs text-slate-500 font-mono">Tenggat: {asg.dueDate}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 truncate">{asg.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition flex-shrink-0"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* TAB BAR (fixed) */}
        <div className="px-5 sm:px-7 border-b border-slate-200 flex-shrink-0">
          <div className="flex gap-1 overflow-x-auto" role="tablist">
            {tabs.map(t => {
              const isActive = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  id={`student-tab-${t.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(t.id)}
                  className={`relative px-3 sm:px-4 py-2.5 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer rounded-t-xl ${
                    isActive ? 'text-purple-700 bg-purple-50/70' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {tabBadge(t.id)}
                  {isActive && <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-purple-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENT (scrollable) */}
        <div
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-7 py-4"
        >
          {activeTab === 'petunjuk' && renderPetunjukTab()}
          {activeTab === 'kuis' && hasQuiz && renderKuisTab()}
          {activeTab === 'unggah' && renderUnggahTab()}
        </div>

        {/* FOOTER (fixed) */}
        <div className="px-5 sm:px-7 py-3 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            {hasQuiz && (
              <span className={answeredCount === totalQuestions ? 'text-emerald-700 font-semibold' : ''}>
                📝 Kuis {answeredCount}/{totalQuestions}
              </span>
            )}
            {hasQuiz && <span>•</span>}
            <span className={hasUpload ? 'text-emerald-700 font-semibold' : ''}>
              📤 {hasUpload ? 'Berkas/catatan siap' : 'Belum ada berkas'}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-200/60 text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            {nextTab && (
              <button
                type="button"
                onClick={() => setActiveTab(nextTab.id)}
                className="px-3.5 py-2 rounded-xl bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-bold cursor-pointer transition"
              >
                Lanjut: {nextTab.label} →
              </button>
            )}
            <button
              id="student-submit-assignment"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-md shadow-purple-600/20 cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin inline-block">⏳</span>
                  <span>Mengirim...</span>
                </>
              ) : (
                <span>🚀 Kirim Tugas</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
