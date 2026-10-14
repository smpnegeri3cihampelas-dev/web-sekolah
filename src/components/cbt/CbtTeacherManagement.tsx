'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CbtExamPackage,
  CbtQuestion,
  CbtQuestionType,
  getStoredCbtPackages,
  saveStoredCbtPackages,
  getStoredStudentCbtSessions,
  resetStoredStudentCbtSession
} from '@/lib/cbtData';
import { Student, SCHOOL_CLASSES } from '@/lib/elearningData';
import { exportCbtScoreLegerToExcel } from '@/lib/elearningExport';

interface CbtTeacherManagementProps {
  teacherName: string;
  teacherSubject?: string;
  activeStudents: Student[];
  onPreviewExamAsStudent?: (pkg: CbtExamPackage) => void;
}

export default function CbtTeacherManagement({
  teacherName,
  teacherSubject,
  activeStudents,
  onPreviewExamAsStudent
}: CbtTeacherManagementProps) {
  const [packages, setPackages] = useState<CbtExamPackage[]>([]);
  const [activeTab, setActiveTab] = useState<'packages' | 'scores'>('packages');

  // Selected package for Question Editor or Score Ledger
  const [selectedPackageForEdit, setSelectedPackageForEdit] = useState<CbtExamPackage | null>(null);
  const [selectedPackageForScores, setSelectedPackageForScores] = useState<CbtExamPackage | null>(null);

  // Filter kelas for score tab
  const [selectedScoreClass, setSelectedScoreClass] = useState<string>('all');

  // Question editing local state inside Question Editor
  const [editingQuestion, setEditingQuestion] = useState<CbtQuestion | null>(null);

  // New package modal state
  const [showCreatePackageModal, setShowCreatePackageModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>(teacherSubject || 'Informatika');
  const [newGrade, setNewGrade] = useState<'7' | '8' | '9'>('7');
  const [newDuration, setNewDuration] = useState<number>(60);
  const [newToken, setNewToken] = useState<string>('');
  const [newPassingGrade, setNewPassingGrade] = useState<number>(75);

  // Keep newSubject synced if teacherSubject changes
  useEffect(() => {
    if (teacherSubject) {
      setNewSubject(teacherSubject);
    }
  }, [teacherSubject]);

  const [studentSessions, setStudentSessions] = useState(() => getStoredStudentCbtSessions());

  // Load packages on mount & subscribe to updates
  useEffect(() => {
    setPackages(getStoredCbtPackages());

    const handlePkgUpdate = () => {
      setPackages(getStoredCbtPackages());
    };

    const handleSessUpdate = () => {
      setStudentSessions(getStoredStudentCbtSessions());
    };

    window.addEventListener('cbtPackagesUpdated', handlePkgUpdate);
    window.addEventListener('cbtSessionsUpdated', handleSessUpdate);
    return () => {
      window.removeEventListener('cbtPackagesUpdated', handlePkgUpdate);
      window.removeEventListener('cbtSessionsUpdated', handleSessUpdate);
    };
  }, []);

  // Set default selected package for scores when packages change
  useEffect(() => {
    if (packages.length > 0 && !selectedPackageForScores) {
      setSelectedPackageForScores(packages[0]);
    }
  }, [packages, selectedPackageForScores]);

  // Create new package handler
  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newId = `cbt_${Date.now()}`;
    const generatedToken = newToken.trim() || `PAS${newGrade}${Math.floor(10 + Math.random() * 90)}`;
    
    // Classes for selected grade
    const targetClasses = SCHOOL_CLASSES.filter(c => c.id.startsWith(newGrade)).map(c => c.id);

    const newPkg: CbtExamPackage = {
      id: newId,
      title: newTitle.trim(),
      subject: newSubject,
      gradeLevel: newGrade,
      targetClasses: targetClasses.length > 0 ? targetClasses : ['7-A', '7-B', '7-C', '7-D', '7-E', '7-F'],
      semester: 'Ganjil (PTS/STS)',
      academicYear: '2026/2027',
      durationMinutes: newDuration,
      token: generatedToken.toUpperCase(),
      passingGrade: newPassingGrade,
      totalQuestions: 0,
      status: 'active',
      teacherName: teacherName || 'Guru Pengampu',
      createdAt: new Date().toISOString().split('T')[0],
      questions: []
    };

    const updated = [newPkg, ...packages];
    saveStoredCbtPackages(updated);
    setPackages(updated);
    setShowCreatePackageModal(false);
    setSelectedPackageForEdit(newPkg); // Open editor immediately
  };

  // Toggle package status (Active / Draft)
  const handleToggleStatus = (pkgId: string) => {
    const updated = packages.map(p => {
      if (p.id === pkgId) {
        return { ...p, status: p.status === 'active' ? 'draft' : 'active' } as CbtExamPackage;
      }
      return p;
    });
    saveStoredCbtPackages(updated);
    setPackages(updated);
  };

  // Delete package
  const handleDeletePackage = (pkgId: string) => {
    if (confirm('Yakin ingin menghapus paket ujian ini beserta seluruh butir soalnya?')) {
      const updated = packages.filter(p => p.id !== pkgId);
      saveStoredCbtPackages(updated);
      setPackages(updated);
      if (selectedPackageForEdit?.id === pkgId) setSelectedPackageForEdit(null);
      if (selectedPackageForScores?.id === pkgId) setSelectedPackageForScores(null);
    }
  };

  // Save question to currently edited package
  const handleSaveQuestion = (q: CbtQuestion) => {
    if (!selectedPackageForEdit) return;

    let updatedQuestions: CbtQuestion[];
    const exists = selectedPackageForEdit.questions.some(item => item.id === q.id);

    if (exists) {
      updatedQuestions = selectedPackageForEdit.questions.map(item => item.id === q.id ? q : item);
    } else {
      updatedQuestions = [...selectedPackageForEdit.questions, q];
    }

    // Re-index question numbers
    updatedQuestions = updatedQuestions.map((item, idx) => ({ ...item, number: idx + 1 }));

    const updatedPkg: CbtExamPackage = {
      ...selectedPackageForEdit,
      questions: updatedQuestions,
      totalQuestions: updatedQuestions.length
    };

    const updatedAll = packages.map(p => p.id === updatedPkg.id ? updatedPkg : p);
    saveStoredCbtPackages(updatedAll);
    setPackages(updatedAll);
    setSelectedPackageForEdit(updatedPkg);
    setEditingQuestion(null);
  };

  // Delete question from currently edited package
  const handleDeleteQuestion = (qId: string) => {
    if (!selectedPackageForEdit) return;
    if (confirm('Hapus butir soal ini?')) {
      const remaining = selectedPackageForEdit.questions
        .filter(q => q.id !== qId)
        .map((q, idx) => ({ ...q, number: idx + 1 }));

      const updatedPkg: CbtExamPackage = {
        ...selectedPackageForEdit,
        questions: remaining,
        totalQuestions: remaining.length
      };

      const updatedAll = packages.map(p => p.id === updatedPkg.id ? updatedPkg : p);
      saveStoredCbtPackages(updatedAll);
      setPackages(updatedAll);
      setSelectedPackageForEdit(updatedPkg);
    }
  };

  // Get student submission results for selected package
  const studentResultsForScores = useMemo(() => {
    if (!selectedPackageForScores) return [];

    const allSessions = studentSessions;
    const pkgId = selectedPackageForScores.id;

    // Filter students targeted by this exam
    let targetStudents = activeStudents;
    if (selectedPackageForScores.targetClasses.length > 0) {
      targetStudents = activeStudents.filter(s => selectedPackageForScores.targetClasses.includes(s.classId));
    }

    if (selectedScoreClass !== 'all') {
      targetStudents = targetStudents.filter(s => s.classId === selectedScoreClass);
    }

    return targetStudents.map(student => {
      const sessionKey = `${pkgId}_${student.id}`;
      const session = allSessions[sessionKey];

      const score = session?.score ?? 0;
      const isPassed = session?.isPassed ?? false;

      return {
        studentId: student.id,
        studentNisn: student.nisn,
        studentName: student.name,
        classId: student.classId,
        score: score,
        correctCount: session?.correctCount ?? 0,
        wrongCount: session?.wrongCount ?? 0,
        isPassed: isPassed,
        submittedAt: session?.submittedAt,
        hasSubmitted: Boolean(session?.isSubmitted)
      };
    }).sort((a, b) => b.score - a.score || a.studentName.localeCompare(b.studentName));
  }, [selectedPackageForScores, activeStudents, selectedScoreClass, studentSessions]);

  // Handle Export Leger to Excel
  const handleExportLeger = () => {
    if (!selectedPackageForScores) return;

    exportCbtScoreLegerToExcel({
      examTitle: selectedPackageForScores.title,
      subject: selectedPackageForScores.subject,
      gradeOrClass: selectedScoreClass === 'all' ? `Tingkat ${selectedPackageForScores.gradeLevel}` : `Kelas ${selectedScoreClass}`,
      semester: selectedPackageForScores.semester,
      teacherName: selectedPackageForScores.teacherName,
      passingGrade: selectedPackageForScores.passingGrade,
      totalQuestions: selectedPackageForScores.totalQuestions,
      results: studentResultsForScores.map(r => ({
        studentNisn: r.studentNisn,
        studentName: r.studentName,
        classId: r.classId,
        score: r.score,
        correctCount: r.correctCount,
        wrongCount: r.wrongCount,
        isPassed: r.isPassed,
        submittedAt: r.submittedAt
      }))
    });
  };

  return (
    <div className="space-y-6">

      {/* 1. HEADER MODUL CBT GURU */}
      <div className="bg-white border border-indigo-100 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-sm">
                💻
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Pusat Bank Soal & Asesmen CBT (PTS / PAS)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              SMP Negeri 3 Cihampelas • Dukungan Soal PG, PG Kompleks, Benar/Salah, Menjodohkan, Audio Listening, dan Gambar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreatePackageModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
            >
              <span>+ Buat Paket Ujian Baru</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Daftar Paket vs Rekap Nilai */}
        <div className="flex items-center gap-1 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => { setActiveTab('packages'); setSelectedPackageForEdit(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'packages' && !selectedPackageForEdit
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>📋 Daftar Paket Ujian ({packages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('scores'); setSelectedPackageForEdit(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'scores'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>📊 Rekapitulasi Nilai & Leger (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT: DAFTAR PAKET UJIAN */}
      {activeTab === 'packages' && !selectedPackageForEdit && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map(pkg => (
            <div
              key={pkg.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                      {pkg.subject}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {pkg.title}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    pkg.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {pkg.status === 'active' ? '🟢 Aktif' : '⚪ Draft'}
                  </span>
                </div>

                {/* Metadata Pills */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Kelas Sasaran:</span>
                    <span className="font-semibold text-slate-800">
                      Tingkat {pkg.gradeLevel} ({pkg.targetClasses.length} Rombel)
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Durasi & KKM:</span>
                    <span className="font-semibold text-slate-800">
                      {pkg.durationMinutes} Menit • KKM {pkg.passingGrade}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Token Ujian:</span>
                    <span className="font-mono font-bold text-indigo-700">
                      🔑 {pkg.token}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Total Soal:</span>
                    <span className="font-bold text-slate-900">
                      📝 {pkg.questions.length} Butir Soal
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Guru Pengampu:</span>
                      <span className="font-semibold text-slate-800">{pkg.teacherName || 'Guru Pengampu'}</span>
                    </div>
                    {teacherName && pkg.teacherName?.toLowerCase().includes(teacherName.toLowerCase().split(',')[0].trim()) && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-md">
                        ✓ Paket Anda
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPackageForEdit(pkg)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition border border-indigo-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>✏️ Edit Soal ({pkg.questions.length})</span>
                  </button>

                  {onPreviewExamAsStudent && (
                    <button
                      type="button"
                      onClick={() => onPreviewExamAsStudent(pkg)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                      title="Pratinjau antarmuka pengerjaan siswa"
                    >
                      <span>👁️ Preview</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPackageForScores(pkg);
                      setActiveTab('scores');
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition border border-emerald-200 cursor-pointer flex items-center gap-1"
                  >
                    <span>📊 Nilai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(pkg.id)}
                    className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs transition cursor-pointer"
                    title={pkg.status === 'active' ? 'Ubah ke Draft' : 'Aktifkan Ujian'}
                  >
                    {pkg.status === 'active' ? '⏸️' : '▶️'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePackage(pkg.id)}
                    className="p-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 text-xs transition cursor-pointer"
                    title="Hapus Paket Ujian"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. QUESTION EDITOR FOR SELECTED PACKAGE */}
      {selectedPackageForEdit && (
        <div className="space-y-5">
          {/* Editor Header */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-indigo-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPackageForEdit(null)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  ← Kembali ke Daftar Paket
                </button>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-bold text-indigo-700 font-mono">
                  Token: {selectedPackageForEdit.token}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Kelola Butir Soal: {selectedPackageForEdit.title}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingQuestion({
                  id: `q_${Date.now()}`,
                  number: selectedPackageForEdit.questions.length + 1,
                  type: 'pg',
                  question: '',
                  scoreWeight: 20,
                  options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
                  correctOptionIndex: 0
                })}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <span>+ Tambah Butir Soal</span>
              </button>
            </div>
          </div>

          {/* List Soal yang Sudah Ada */}
          <div className="space-y-3">
            {selectedPackageForEdit.questions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6 space-y-3">
                <span className="text-3xl">📝</span>
                <h4 className="text-sm font-bold text-slate-700">Belum Ada Soal di Paket Ini</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Klik tombol "+ Tambah Butir Soal" di atas untuk mulai membuat soal Pilihan Ganda, PG Kompleks, Benar/Salah, atau Menjodohkan.
                </p>
              </div>
            ) : (
              selectedPackageForEdit.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs">
                        No. {idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                        {q.type.replace('_', ' ')}
                      </span>
                      {q.mediaType && q.mediaType !== 'none' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {q.mediaType === 'image' && '🖼️ Bergambar'}
                          {q.mediaType === 'audio' && '🎧 Audio Listening'}
                          {q.mediaType === 'video' && '🎬 Video'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingQuestion(q)}
                        className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition cursor-pointer"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 text-xs transition cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {q.question}
                  </p>

                  {/* Ringkasan Opsi */}
                  {q.type === 'pg' && q.options && (
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg border ${
                            oIdx === q.correctOptionIndex
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="mr-1">[{String.fromCharCode(65 + oIdx)}]</span>
                          {opt} {oIdx === q.correctOptionIndex && '✓ (Kunci)'}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'benar_salah' && q.statements && (
                    <div className="text-[11px] space-y-1">
                      {q.statements.map((st, sIdx) => (
                        <div key={st.id} className="flex justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
                          <span className="text-slate-700">{sIdx + 1}. {st.statement}</span>
                          <span className={`font-bold ${st.correctAnswer ? 'text-emerald-700' : 'text-rose-700'}`}>
                            Kunci: {st.correctAnswer ? 'BENAR' : 'SALAH'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'menjodohkan' && q.matchingPairs && (
                    <div className="text-[11px] space-y-1">
                      {q.matchingPairs.map((p, pIdx) => (
                        <div key={p.id} className="flex justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
                          <span className="font-semibold text-slate-800">{pIdx + 1}. {p.leftPrompt}</span>
                          <span className="text-emerald-700 font-medium">➔ {p.rightMatch}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: REKAPITULASI NILAI KELAS & LEGER EXCEL */}
      {activeTab === 'scores' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Rekapitulasi Nilai Asesmen & Leger Raport
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tinjau perolehan skor nilai siswa dan unduh format Excel resmi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportLeger}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                  </svg>
                  <span>Export Leger Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Filter Paket Ujian & Filter Kelas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Paket Ujian:
                </label>
                <select
                  value={selectedPackageForScores?.id || ''}
                  onChange={(e) => {
                    const found = packages.find(p => p.id === e.target.value);
                    if (found) setSelectedPackageForScores(found);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.subject} - Kls {p.gradeLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Filter Rombel:
                </label>
                <select
                  value={selectedScoreClass}
                  onChange={(e) => setSelectedScoreClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">Semua Rombel Terdaftar</option>
                  {selectedPackageForScores?.targetClasses.map(cls => (
                    <option key={cls} value={cls}>
                      Kelas {cls}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabel Nilai Siswa */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daftar Hasil Ujian ({studentResultsForScores.length} Siswa)
              </span>
              <span className="text-xs font-bold text-indigo-700">
                KKM: {selectedPackageForScores?.passingGrade || 75}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 w-12 text-center">No</th>
                    <th className="px-3 py-2.5 w-28 font-mono">NISN</th>
                    <th className="px-3 py-2.5">Nama Lengkap Siswa</th>
                    <th className="px-3 py-2.5 w-20 text-center">Kelas</th>
                    <th className="px-3 py-2.5 w-24 text-center">Nilai Akhir</th>
                    <th className="px-3 py-2.5 w-28 text-center">Ketuntasan</th>
                    <th className="px-3 py-2.5 w-28 text-center">Waktu Kumpul</th>
                    <th className="px-3 py-2.5 w-20 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentResultsForScores.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        Belum ada data siswa untuk kriteria ini.
                      </td>
                    </tr>
                  ) : (
                    studentResultsForScores.map((res, idx) => (
                      <tr key={res.studentId} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2.5 text-center font-mono text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">
                          {res.studentNisn}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-900">
                          {res.studentName}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-slate-700">
                          {res.classId}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-black text-sm text-indigo-700">
                          {res.hasSubmitted ? res.score : <span className="text-slate-300 font-normal">-</span>}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {res.hasSubmitted ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              res.isPassed 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {res.isPassed ? '✓ TUNTAS' : '⚠️ REMEDIAL'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium italic">
                              Belum Mengikuti
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-slate-500 text-[11px]">
                          {res.submittedAt ? res.submittedAt.slice(11, 16) + ' WIB' : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {res.hasSubmitted ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (!selectedPackageForScores) return;
                                if (confirm(`Reset sesi ujian untuk ${res.studentName}? Nilai dan jawaban sebelumnya akan dihapus sehingga siswa dapat mengikuti ujian kembali.`)) {
                                  resetStoredStudentCbtSession(selectedPackageForScores.id, res.studentId);
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-xs active:scale-95"
                              title="Reset ujian siswa ini agar bisa mengulang"
                            >
                              <span>🔄</span>
                              <span>Reset</span>
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL FORM: BUAT PAKET UJIAN BARU */}
      {showCreatePackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-indigo-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Buat Paket Ujian CBT Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowCreatePackageModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-3.5 text-xs">
              {/* Teacher Info Box */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Guru Pengampu (Otomatis):</span>
                  <span className="font-bold text-slate-900">{teacherName || 'Guru Pengampu'}</span>
                </div>
                {teacherSubject && (
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] shadow-xs">
                    Mapel: {teacherSubject}
                  </span>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama / Judul Ujian:
                </label>
                <input
                  type="text"
                  required
                  placeholder={teacherSubject ? `Contoh: Asesmen Tengah Semester (PTS) - ${teacherSubject}` : "Contoh: Asesmen Tengah Semester (PTS) - Informatika"}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mata Pelajaran:
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {teacherSubject && (
                      <option value={teacherSubject}>⭐ {teacherSubject} (Mapel Anda)</option>
                    )}
                    <option value="Informatika">Informatika</option>
                    <option value="Ilmu Pengetahuan Alam (IPA)">Ilmu Pengetahuan Alam (IPA)</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                    <option value="Pendidikan Agama Islam (PABP)">Pendidikan Agama Islam (PABP)</option>
                    <option value="Pendidikan Pancasila">Pendidikan Pancasila (PPKn)</option>
                    <option value="Ilmu Pengetahuan Sosial (IPS)">Ilmu Pengetahuan Sosial (IPS)</option>
                    <option value="Prakarya">Prakarya</option>
                    <option value="Seni Budaya">Seni Budaya</option>
                    <option value="Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)">PJOK</option>
                    <option value="Bahasa Sunda">Bahasa Sunda</option>
                    <option value="Bimbingan & Konseling (BK)">Bimbingan & Konseling (BK)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tingkat Kelas:
                  </label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="7">Kelas 7</option>
                    <option value="8">Kelas 8</option>
                    <option value="9">Kelas 9</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Durasi (Menit):
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    KKM / Kriteria:
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newPassingGrade}
                    onChange={(e) => setNewPassingGrade(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Token Masuk:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PAS7A"
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-indigo-700 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePackageModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  Simpan & Masuk Editor Soal →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL FORM: EDITOR BUTIR SOAL LENGKAP DENGAN MULTIMEDIA */}
      {editingQuestion && (
        <QuestionEditorModal
          initialQuestion={editingQuestion}
          onSave={handleSaveQuestion}
          onClose={() => setEditingQuestion(null)}
        />
      )}

    </div>
  );
}

// -------------------------------------------------------------
// SUB-KOMPONEN: MODAL EDITOR BUTIR SOAL INTERAKTIF
// -------------------------------------------------------------
function QuestionEditorModal({
  initialQuestion,
  onSave,
  onClose
}: {
  initialQuestion: CbtQuestion;
  onSave: (q: CbtQuestion) => void;
  onClose: () => void;
}) {
  const [qType, setQType] = useState<CbtQuestionType>(initialQuestion.type || 'pg');
  const [qText, setQText] = useState<string>(initialQuestion.question || '');
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'audio' | 'video'>(initialQuestion.mediaType || 'none');
  const [mediaUrl, setMediaUrl] = useState<string>(initialQuestion.mediaUrl || '');
  const [mediaCaption, setMediaCaption] = useState<string>(initialQuestion.mediaCaption || '');
  const [scoreWeight, setScoreWeight] = useState<number>(initialQuestion.scoreWeight || 20);

  // PG Options
  const [options, setOptions] = useState<string[]>(initialQuestion.options || ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D']);
  const [correctPgIndex, setCorrectPgIndex] = useState<number>(initialQuestion.correctOptionIndex ?? 0);
  const [correctPgIndices, setCorrectPgIndices] = useState<number[]>(initialQuestion.correctOptionIndices || [0]);

  // Benar / Salah statements
  const [statements, setStatements] = useState<Array<{ id: string; statement: string; correctAnswer: boolean }>>(
    initialQuestion.statements || [
      { id: 'st_1', statement: 'Pernyataan nomor satu...', correctAnswer: true },
      { id: 'st_2', statement: 'Pernyataan nomor dua...', correctAnswer: false }
    ]
  );

  // Menjodohkan pairs
  const [pairs, setPairs] = useState<Array<{ id: string; leftPrompt: string; rightMatch: string }>>(
    initialQuestion.matchingPairs || [
      { id: 'm_1', leftPrompt: 'Premis kiri A', rightMatch: 'Jawaban kanan A' },
      { id: 'm_2', leftPrompt: 'Premis kiri B', rightMatch: 'Jawaban kanan B' }
    ]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) {
      alert('Teks pertanyaan tidak boleh kosong.');
      return;
    }

    const compiled: CbtQuestion = {
      id: initialQuestion.id,
      number: initialQuestion.number,
      type: qType,
      question: qText.trim(),
      scoreWeight: scoreWeight,
      mediaType: mediaType,
      mediaUrl: mediaType !== 'none' ? mediaUrl.trim() : undefined,
      mediaCaption: mediaType !== 'none' ? mediaCaption.trim() : undefined
    };

    if (qType === 'pg') {
      compiled.options = options;
      compiled.correctOptionIndex = correctPgIndex;
    } else if (qType === 'pg_kompleks') {
      compiled.options = options;
      compiled.correctOptionIndices = correctPgIndices;
    } else if (qType === 'benar_salah') {
      compiled.statements = statements;
    } else if (qType === 'menjodohkan') {
      compiled.matchingPairs = pairs;
    }

    onSave(compiled);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Editor Butir Soal No. {initialQuestion.number}
            </h3>
            <p className="text-xs text-slate-500">
              Pilih tipe soal dan lampirkan stimulus media sesuai kebutuhan materi.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
          
          {/* 1. Pilih Tipe Soal */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              1. Pilih Tipe Soal:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setQType('pg')}
                className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                  qType === 'pg'
                    ? 'bg-blue-50 text-blue-800 border-blue-500 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Pilihan Ganda
              </button>
              <button
                type="button"
                onClick={() => setQType('pg_kompleks')}
                className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                  qType === 'pg_kompleks'
                    ? 'bg-purple-50 text-purple-800 border-purple-500 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                PG Kompleks
              </button>
              <button
                type="button"
                onClick={() => setQType('benar_salah')}
                className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                  qType === 'benar_salah'
                    ? 'bg-amber-50 text-amber-800 border-amber-500 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Benar / Salah
              </button>
              <button
                type="button"
                onClick={() => setQType('menjodohkan')}
                className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                  qType === 'menjodohkan'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Menjodohkan
              </button>
            </div>
          </div>

          {/* 2. Media Stimulus (Gambar / Audio / Video) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">
                2. Lampiran Media Stimulus (Opsional):
              </label>
              <div className="flex items-center gap-1.5">
                {(['none', 'image', 'audio', 'video'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMediaType(m)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      mediaType === m
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m === 'none' && 'Tanpa Media'}
                    {m === 'image' && '🖼️ Gambar'}
                    {m === 'audio' && '🎧 Audio Listening'}
                    {m === 'video' && '🎬 Video'}
                  </button>
                ))}
              </div>
            </div>

            {mediaType !== 'none' && (
              <div className="space-y-2 pt-1">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">
                    URL Media (Tautan Gambar / Audio MP3 / Video):
                  </span>
                  <input
                    type="url"
                    placeholder="https://contoh-domain.com/audio-listening.mp3"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">
                    Keterangan / Judul Stimulus Media:
                  </span>
                  <input
                    type="text"
                    placeholder="Contoh: Audio Section 1: Percakapan di Perpustakaan"
                    value={mediaCaption}
                    onChange={(e) => setMediaCaption(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Teks Pertanyaan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              3. Teks Pertanyaan Soal:
            </label>
            <textarea
              rows={3}
              required
              placeholder="Tuliskan butir soal atau stimulus teks di sini..."
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* 4. Konfigurasi Jawaban Sesuai Tipe */}
          
          {/* A. PILIHAN GANDA BIASA */}
          {qType === 'pg' && (
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">
                4. Opsi Pilihan Jawaban & Tandai Kunci Benar:
              </label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctPg"
                    checked={correctPgIndex === idx}
                    onChange={() => setCorrectPgIndex(idx)}
                    className="w-4 h-4 text-indigo-600 cursor-pointer"
                  />
                  <span className="w-6 font-bold text-slate-700">{String.fromCharCode(65 + idx)}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const copy = [...options];
                      copy[idx] = e.target.value;
                      setOptions(copy);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                  {correctPgIndex === idx && (
                    <span className="text-[11px] font-bold text-emerald-700 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                      ✓ Kunci
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* B. PG KOMPLEKS (MULTI CHECKBOX) */}
          {qType === 'pg_kompleks' && (
            <div className="space-y-2">
              <label className="block font-bold text-purple-900">
                4. Opsi PG Kompleks (Centang Semua yang Merupakan Kunci Benar):
              </label>
              {options.map((opt, idx) => {
                const isChecked = correctPgIndices.includes(idx);

                return (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setCorrectPgIndices(correctPgIndices.filter(i => i !== idx));
                        } else {
                          setCorrectPgIndices([...correctPgIndices, idx]);
                        }
                      }}
                      className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                    />
                    <span className="w-6 font-bold text-slate-700">{String.fromCharCode(65 + idx)}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const copy = [...options];
                        copy[idx] = e.target.value;
                        setOptions(copy);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500"
                    />
                    {isChecked && (
                      <span className="text-[11px] font-bold text-purple-700 px-2 py-0.5 rounded bg-purple-50 border border-purple-200">
                        ✓ Kunci
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* C. BENAR / SALAH */}
          {qType === 'benar_salah' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-amber-900">
                  4. Daftar Pernyataan & Kunci Kebenaran:
                </label>
                <button
                  type="button"
                  onClick={() => setStatements([...statements, { id: `st_${Date.now()}`, statement: 'Pernyataan baru...', correctAnswer: true }])}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-bold cursor-pointer"
                >
                  + Tambah Baris Pernyataan
                </button>
              </div>
              {statements.map((st, idx) => (
                <div key={st.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-500">{idx + 1}.</span>
                  <input
                    type="text"
                    value={st.statement}
                    onChange={(e) => {
                      const copy = [...statements];
                      copy[idx].statement = e.target.value;
                      setStatements(copy);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const copy = [...statements];
                      copy[idx].correctAnswer = !copy[idx].correctAnswer;
                      setStatements(copy);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                      st.correctAnswer
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {st.correctAnswer ? '✓ BENAR' : '✗ SALAH'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* D. MENJODOHKAN */}
          {qType === 'menjodohkan' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-emerald-900">
                  4. Pasangan Premis Kiri & Jawaban Kanan:
                </label>
                <button
                  type="button"
                  onClick={() => setPairs([...pairs, { id: `m_${Date.now()}`, leftPrompt: 'Premis kiri...', rightMatch: 'Jawaban kanan...' }])}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold cursor-pointer"
                >
                  + Tambah Pasangan
                </button>
              </div>
              {pairs.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-500">{idx + 1}.</span>
                  <input
                    type="text"
                    placeholder="Premis Kiri"
                    value={p.leftPrompt}
                    onChange={(e) => {
                      const copy = [...pairs];
                      copy[idx].leftPrompt = e.target.value;
                      setPairs(copy);
                    }}
                    className="w-1/2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900"
                  />
                  <span className="text-slate-400 font-bold">➔</span>
                  <input
                    type="text"
                    placeholder="Jawaban Kanan"
                    value={p.rightMatch}
                    onChange={(e) => {
                      const copy = [...pairs];
                      copy[idx].rightMatch = e.target.value;
                      setPairs(copy);
                    }}
                    className="w-1/2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Footer Save */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md shadow-indigo-600/20"
            >
              Simpan Butir Soal Ini ✓
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
