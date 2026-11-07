'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Assignment, QuizQuestion, SCHOOL_CLASSES } from '@/lib/elearningData';

interface CreateAssignmentModalProps {
  currentTeacher: {
    nip: string;
    name: string;
    subject: string;
    classes: string[];
  };
  onClose: () => void;
  onSubmit: (newAssignment: Assignment) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
  defaultClass?: string;
}

// -------------------------------------------------------------
// SUB-COMPONENT: KARTU SOAL KUIS (CLEAN & ZERO TYPING LAG)
// -------------------------------------------------------------
interface QuizQuestionCardProps {
  q: QuizQuestion;
  qIdx: number;
  total: number;
  onUpdate: (qIdx: number, patch: Partial<QuizQuestion>) => void;
  onDelete: (qIdx: number) => void;
}

const QuizQuestionCard = React.memo(function QuizQuestionCard({
  q,
  qIdx,
  total,
  onUpdate,
  onDelete
}: QuizQuestionCardProps) {
  const letters = ['A', 'B', 'C', 'D'];

  const getCleanOptionText = (opt: string) => {
    if (!opt) return '';
    return opt.replace(/^[A-D]\.\s*/, '');
  };

  const handleOptionTextChange = (optIdx: number, text: string) => {
    const prefix = letters[optIdx];
    const newOptions = [...q.options];
    newOptions[optIdx] = prefix + '. ' + text;
    onUpdate(qIdx, { options: newOptions });
  };

  const handleSelectKey = (optIdx: number) => {
    onUpdate(qIdx, { correctOptionIndex: optIdx });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-purple-300 shadow-xs p-4 sm:p-5 space-y-3.5 transition-all">
      {/* HEADER SOAL */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center">
            {qIdx + 1}
          </span>
          <span className="font-bold text-slate-800 text-xs sm:text-sm">Soal Nomor {qIdx + 1}</span>
          <span className="text-[11px] text-slate-400 font-medium">({qIdx + 1} dari {total})</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge Kunci */}
          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1">
            <span>✓ Kunci:</span>
            <span className="font-black">{letters[q.correctOptionIndex] || 'A'}</span>
          </span>

          {/* Tombol Hapus */}
          <button
            type="button"
            onClick={() => onDelete(qIdx)}
            className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition font-medium cursor-pointer"
            title="Hapus soal ini"
          >
            ✕ Hapus
          </button>
        </div>
      </div>

      {/* PERTANYAAN */}
      <div>
        <textarea
          rows={2}
          value={q.question}
          onChange={(e) => onUpdate(qIdx, { question: e.target.value })}
          placeholder="Tuliskan pertanyaan soal di sini..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-xs bg-slate-50/40 hover:bg-white focus:bg-white resize-none leading-relaxed transition font-medium placeholder-slate-400"
        />
      </div>

      {/* 4 PILIHAN GANDA (A, B, C, D) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {letters.map((prefix, optIdx) => {
          const isCorrect = q.correctOptionIndex === optIdx;
          const currentText = getCleanOptionText(q.options[optIdx] || '');

          return (
            <div
              key={prefix}
              className={'flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all ' + (
                isCorrect
                  ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              )}
            >
              {/* Tombol Huruf (Klik untuk set kunci) */}
              <button
                type="button"
                onClick={() => handleSelectKey(optIdx)}
                title={'Klik untuk memilih ' + prefix + ' sebagai kunci jawaban'}
                className={'w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center transition flex-shrink-0 cursor-pointer ' + (
                  isCorrect
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700'
                )}
              >
                {prefix}
              </button>

              {/* Input Teks Opsi */}
              <input
                type="text"
                value={currentText}
                onChange={(e) => handleOptionTextChange(optIdx, e.target.value)}
                placeholder={'Pilihan ' + prefix + '...'}
                className="flex-1 min-w-0 px-1.5 py-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
              />

              {/* Status Kunci */}
              <button
                type="button"
                onClick={() => handleSelectKey(optIdx)}
                className={'text-[10px] px-2 py-0.5 rounded font-bold flex-shrink-0 transition cursor-pointer ' + (
                  isCorrect
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                )}
              >
                {isCorrect ? '✓ Kunci' : 'Pilih'}
              </button>
            </div>
          );
        })}
      </div>

      {/* PEMBAHASAN SINGKAT (OPSIONAL) */}
      <div>
        <input
          type="text"
          value={q.explanation || ''}
          onChange={(e) => onUpdate(qIdx, { explanation: e.target.value })}
          placeholder="Pembahasan atau penjelasan jawaban (opsional)..."
          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-purple-400 text-slate-700 placeholder-slate-400"
        />
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// MAIN MODAL: BUAT TUGAS BARU (CLEAN & RINGKAS)
// -------------------------------------------------------------
export default function CreateAssignmentModal({
  currentTeacher,
  defaultClass,
  onClose,
  onSubmit,
  showToast
}: CreateAssignmentModalProps) {
  const availableTeacherSubjects: string[] = useMemo(() => {
    const raw = currentTeacher.subject || 'Umum';
    if (raw.includes('&') || raw.includes(' dan ')) {
      const parts = raw.split(/&|dan/i).map(s => s.trim()).filter(Boolean);
      return parts.map(s => {
        if (s.toLowerCase().includes('pabp') || s.toLowerCase().includes('agama')) {
          return 'Pendidikan Agama Islam (PABP)';
        }
        if (s.toLowerCase().includes('sunda')) {
          return 'Bahasa Sunda';
        }
        return s;
      });
    }
    return [raw];
  }, [currentTeacher.subject]);

  const [selectedSubject, setSelectedSubject] = useState<string>(() => availableTeacherSubjects[0]);
  const [title, setTitle] = useState('');
  const [targetClass, setTargetClass] = useState(defaultClass || '7-A');
  const [dueDate, setDueDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  });
  const [desc, setDesc] = useState('');

  // Video, Material, & Quiz
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [materialName, setMaterialName] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  type TeacherTab = 'info' | 'kuis' | 'lampiran';
  const [activeTab, setActiveTab] = useState<TeacherTab>('info');

  const attachmentCount = (videoUrl.trim() ? 1 : 0) + (materialUrl.trim() ? 1 : 0);
  const activeQuizCount = quizQuestions.length;

  const tabs: { id: TeacherTab; label: string; icon: string; badge?: string }[] = [
    { id: 'info', label: 'Informasi', icon: '📋' },
    { id: 'kuis', label: 'Soal Kuis', icon: '📝', badge: quizQuestions.length > 0 ? (quizQuestions.length + ' Soal') : undefined },
    { id: 'lampiran', label: 'Lampiran', icon: '📎', badge: attachmentCount > 0 ? String(attachmentCount) : undefined }
  ];
  const activeIdx = tabs.findIndex(t => t.id === activeTab);
  const prevTab = activeIdx > 0 ? tabs[activeIdx - 1] : null;
  const nextTab = activeIdx < tabs.length - 1 ? tabs[activeIdx + 1] : null;

  // Question update helpers (useCallback to prevent child re-renders)
  const handleUpdateQuestion = useCallback((qIdx: number, patch: Partial<QuizQuestion>) => {
    setQuizQuestions(prev => prev.map((q, i) => (i === qIdx ? { ...q, ...patch } : q)));
  }, []);

  const handleDeleteQuestion = useCallback((qIdx: number) => {
    setQuizQuestions(prev => prev.filter((_, idx) => idx !== qIdx));
  }, []);

  const addManualQuestion = () => {
    setQuizQuestions(prev => [
      ...prev,
      {
        id: 'q-' + Date.now() + '-' + (prev.length + 1),
        question: '',
        options: ['A. ', 'B. ', 'C. ', 'D. '],
        correctOptionIndex: 0,
        explanation: ''
      }
    ]);
  };

  const handleSubmit = () => {
    if (!title.trim() || !dueDate) {
      showToast('Mohon isi judul tugas dan batas waktu pengumpulan!', 'warn');
      setActiveTab('info');
      return;
    }

    if (quizQuestions.length > 0) {
      const emptyIdx = quizQuestions.findIndex(q => !q.question.trim());
      if (emptyIdx !== -1) {
        showToast('Soal Nomor ' + (emptyIdx + 1) + ' pertanyaannya masih kosong. Lengkapi atau hapus soal tersebut.', 'warn');
        setActiveTab('kuis');
        return;
      }
    }

    const newAssignment: Assignment = {
      id: 'asg-' + Date.now(),
      title: title.trim(),
      subject: selectedSubject,
      teacherName: currentTeacher.name,
      teacherNip: currentTeacher.nip,
      targetClass,
      dueDate,
      description: desc.trim() || 'Kerjakan tugas sesuai petunjuk guru dan kumpulkan sebelum batas waktu.',
      allowUpload: true,
      createdAt: new Date().toISOString().split('T')[0],
      materialUrl: materialUrl.trim() || undefined,
      materialName: materialName.trim() || (materialUrl.trim() ? 'Bahan_Materi.pdf' : undefined),
      videoUrl: videoUrl.trim() || undefined,
      videoTitle: videoTitle.trim() || (videoUrl.trim() ? ('Video Materi ' + currentTeacher.subject) : undefined),
      quizQuestions: quizQuestions.length > 0 ? quizQuestions : undefined
    };

    onSubmit(newAssignment);
  };

  // ---------- TAB 1: INFORMASI ----------
  const renderInfoTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
      {/* Kolom Kiri: Detail Form */}
      <div className="space-y-3.5 bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-200">
        <div>
          <label className="block font-bold text-slate-800 text-xs mb-1">
            Judul Tugas *
          </label>
          <input
            id="create-asg-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Tugas Bab 2 Sistem Pencernaan"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs bg-white font-medium"
          />
        </div>

        {availableTeacherSubjects.length > 1 && (
          <div>
            <label className="block font-bold text-slate-800 text-xs mb-1">Mata Pelajaran *</label>
            <div className="grid grid-cols-2 gap-2">
              {availableTeacherSubjects.map((sub) => {
                const isSelected = selectedSubject === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubject(sub)}
                    className={'py-1.5 px-2.5 rounded-xl border text-xs font-bold transition text-left cursor-pointer flex items-center gap-1.5 ' + (
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <span>{isSelected ? '●' : '○'}</span>
                    <span className="truncate">{sub}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-800 text-xs mb-1">Kelas *</label>
            <select
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs cursor-pointer bg-white font-semibold"
            >
              {SCHOOL_CLASSES.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.totalStudents} Siswa)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-800 text-xs mb-1">Batas Waktu Pengumpulan *</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs bg-white font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Petunjuk Tugas */}
      <div className="flex flex-col bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-200">
        <label className="block font-bold text-slate-800 text-xs mb-1">
          Petunjuk Tugas untuk Siswa
        </label>
        <textarea
          rows={7}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Tuliskan petunjuk atau instruksi pengerjaan tugas untuk siswa..."
          className="w-full flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs resize-none bg-white leading-relaxed font-medium placeholder-slate-400"
        />
      </div>
    </div>
  );

  // ---------- TAB 2: SOAL KUIS ----------
  const renderKuisTab = () => (
    <div className="space-y-3.5 text-xs">
      {/* HEADER BAR KUIS (RINGKAS & BERSIH) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">Soal Pilihan Ganda</span>
          {quizQuestions.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-black text-[11px]">
              {quizQuestions.length} Soal
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addManualQuestion}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1 transition active:scale-95"
          >
            <span>+</span>
            <span>Tambah Soal</span>
          </button>
          {quizQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Yakin ingin menghapus semua soal kuis ini?')) {
                  setQuizQuestions([]);
                }
              }}
              className="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold cursor-pointer transition"
            >
              Hapus Semua
            </button>
          )}
        </div>
      </div>

      {/* AREA SOAL / EMPTY STATE */}
      {quizQuestions.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2.5">
          <div className="text-3xl">📝</div>
          <h4 className="font-bold text-slate-700 text-xs sm:text-sm">Belum Ada Soal Kuis</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Klik tombol di bawah jika ingin menambahkan soal pilihan ganda, atau lewati jika tugas ini hanya berupa pengumpulan berkas/catatan.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={addManualQuestion}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer transition inline-flex items-center gap-1.5 active:scale-95"
            >
              <span>+ Buat Soal Pertama</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {quizQuestions.map((q, qIdx) => (
            <QuizQuestionCard
              key={q.id || ('q-' + qIdx)}
              q={q}
              qIdx={qIdx}
              total={quizQuestions.length}
              onUpdate={handleUpdateQuestion}
              onDelete={handleDeleteQuestion}
            />
          ))}

          <div className="pt-1 flex justify-center">
            <button
              type="button"
              onClick={addManualQuestion}
              className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs cursor-pointer transition flex items-center gap-1.5"
            >
              <span>+ Tambah Soal Nomor {quizQuestions.length + 1}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ---------- TAB 3: LAMPIRAN (VIDEO & FILE) ----------
  const renderLampiranTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
      {/* VIDEO */}
      <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200 space-y-3">
        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <span>🎬</span> Video Pembelajaran (Opsional)
        </div>
        <div className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tautan Video (YouTube / Drive):</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs bg-white font-medium"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Judul Video:</label>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Contoh: Video Penjelasan Bab 2"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs bg-white font-medium"
            />
          </div>
          {videoUrl && (
            <button
              type="button"
              onClick={() => { setVideoUrl(''); setVideoTitle(''); }}
              className="text-[11px] text-rose-600 hover:underline cursor-pointer font-medium"
            >
              ✕ Hapus Video
            </button>
          )}
        </div>
      </div>

      {/* BERKAS FILE */}
      <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200 space-y-3">
        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <span>📄</span> Berkas Modul / LKPD PDF (Opsional)
        </div>
        <div className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tautan File Dokumen:</label>
            <input
              type="url"
              value={materialUrl}
              onChange={(e) => setMaterialUrl(e.target.value)}
              placeholder="https://.../LKPD_Materi.pdf"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs bg-white font-medium"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama File Dokumen:</label>
            <input
              type="text"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              placeholder="Contoh: LKPD_Sains_Bab2.pdf"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs bg-white font-medium"
            />
          </div>
          {materialUrl && (
            <button
              type="button"
              onClick={() => { setMaterialUrl(''); setMaterialName(''); }}
              className="text-[11px] text-rose-600 hover:underline cursor-pointer font-medium"
            >
              ✕ Hapus File
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      data-lenis-prevent-touch="true"
      className="fixed inset-0 z-[80] bg-slate-900/80 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex items-center justify-center animate-in fade-in duration-150 font-elearning"
    >
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl h-[92vh] max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        {/* HEADER MODAL (CLEAN & RINGKAS) */}
        <div className="px-6 py-4 flex items-center justify-between gap-3 border-b border-slate-100 bg-white flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">Buat Tugas Baru</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="font-semibold text-indigo-700">{currentTeacher.subject}</span> • {currentTeacher.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 transition flex-shrink-0"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* TAB NAVIGATION (3 PILL BERSIH) */}
        <div className="px-6 border-b border-slate-200 flex-shrink-0 bg-white">
          <div className="flex gap-2 overflow-x-auto" role="tablist">
            {tabs.map(t => {
              const isActive = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  id={'create-asg-tab-' + t.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(t.id)}
                  className={'relative px-3.5 py-2.5 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer rounded-t-xl ' + (
                    isActive
                      ? 'text-indigo-700 bg-indigo-50/70'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  )}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {t.badge && (
                    <span className={'ml-1 px-2 py-0.2 rounded-full text-[10px] font-black ' + (
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                    )}>
                      {t.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-indigo-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ISI KONTEN (SCROLLABLE & LUAS) */}
        <div
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          className="flex-1 min-h-0 overflow-y-auto px-6 py-4"
        >
          {activeTab === 'info' && renderInfoTab()}
          {activeTab === 'kuis' && renderKuisTab()}
          {activeTab === 'lampiran' && renderLampiranTab()}
        </div>

        {/* FOOTER (CLEAN & RINGKAS) */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
            <span>Kelas <b className="text-slate-700 font-semibold">{targetClass}</b></span>
            <span>•</span>
            <span>{activeQuizCount > 0 ? (activeQuizCount + ' Soal Kuis') : 'Tanpa Kuis'}</span>
            <span>•</span>
            <span>{attachmentCount} Lampiran</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 text-xs font-semibold cursor-pointer transition"
            >
              Batal
            </button>
            {prevTab && (
              <button
                key={'btn-prev-' + prevTab.id}
                type="button"
                onClick={() => setActiveTab(prevTab.id)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition"
              >
                ← Sebelumnya
              </button>
            )}
            {nextTab && (
              <button
                key={'btn-next-' + nextTab.id}
                type="button"
                onClick={() => setActiveTab(nextTab.id)}
                className="px-3.5 py-2 rounded-xl bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-xs font-bold cursor-pointer transition"
              >
                Selanjutnya →
              </button>
            )}
            <button
              key="btn-publish-asg"
              id="create-asg-submit"
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <span>🚀 Terbitkan Tugas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
