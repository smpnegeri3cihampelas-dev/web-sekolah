'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CbtExamPackage,
  CbtQuestion,
  CbtQuestionType,
  getStoredCbtPackages,
  saveStoredCbtPackage,
  saveStoredCbtPackages,
  deleteStoredCbtPackage,
  getStoredStudentCbtSessions,
  resetStoredStudentCbtSession,
  evaluateCbtPackageSchedule,
  toLocalDateString
} from '@/lib/cbtData';
import { Student, SCHOOL_CLASSES, parseTeacherSubjects, isSubjectMatchingSelected } from '@/lib/elearningData';
import { exportCbtScoreLegerToExcel } from '@/lib/elearningExport';
import { compressImage } from '@/lib/imageCompression';
import { resolveCbtVideoSource, resolveCbtAudioSource } from './CbtStudentExamRoom';

interface CbtTeacherManagementProps {
  teacherName: string;
  teacherSubject?: string;
  activeSubject?: string;
  onSelectSubject?: (subject: string) => void;
  teacherClasses?: string[];
  activeStudents: Student[];
}

// Helper format tanggal Indonesia (contoh: "Min, 8 Nov 2026")
function formatIndonesianExamDate(dateStr?: string): string {
  if (!dateStr) return 'Hari Ini';
  const clean = toLocalDateString(dateStr);
  const parts = clean.split('-');
  if (parts.length === 3) {
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    const date = new Date(y, m, d);
    if (!isNaN(date.getTime())) {
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${days[date.getDay()]}, ${d} ${months[m]} ${y}`;
    }
  }
  return clean;
}

export default function CbtTeacherManagement({
  teacherName,
  teacherSubject,
  activeSubject,
  onSelectSubject,
  teacherClasses,
  activeStudents
}: CbtTeacherManagementProps) {
  const [packages, setPackages] = useState<CbtExamPackage[]>([]);
  const [activeTab, setActiveTab] = useState<'packages' | 'scores'>('packages');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const availableTeacherSubjects = useMemo(
    () => parseTeacherSubjects(teacherSubject),
    [teacherSubject]
  );

  const effectiveActiveSubject = useMemo(() => {
    if (activeSubject && availableTeacherSubjects.includes(activeSubject)) {
      return activeSubject;
    }
    return availableTeacherSubjects[0] || teacherSubject || 'Informatika';
  }, [activeSubject, availableTeacherSubjects, teacherSubject]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const syncCbtFromCloudSilently = async () => {
    try {
      const { syncCbtWithCloud } = await import('@/lib/cloudSync');
      await syncCbtWithCloud();
      setPackages(getStoredCbtPackages());
      setStudentSessions(getStoredStudentCbtSessions());
    } catch {}
  };

  // Filter packages strictly for this teacher & active subject (if multi-subject teacher)
  const myPackages = useMemo(() => {
    return packages.filter(pkg => {
      const pkgSubLow = (pkg.subject || '').toLowerCase().trim();
      const isNameMatch = Boolean(
        teacherName && pkg.teacherName?.toLowerCase().includes(teacherName.toLowerCase().split(',')[0].trim())
      );
      const isAnyTeacherSubMatch = Boolean(
        teacherSubject &&
        (pkgSubLow === teacherSubject.toLowerCase().trim() ||
          availableTeacherSubjects.some(sub => sub.toLowerCase().trim() === pkgSubLow))
      );

      if (teacherSubject || teacherName) {
        if (!isNameMatch && !isAnyTeacherSubMatch) return false;
      }

      if (availableTeacherSubjects.length > 1) {
        return isSubjectMatchingSelected(
          pkg.subject,
          effectiveActiveSubject,
          availableTeacherSubjects,
          teacherSubject,
          pkg.title
        );
      }

      return true;
    });
  }, [packages, teacherSubject, teacherName, availableTeacherSubjects, effectiveActiveSubject]);

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
  const [newSubject, setNewSubject] = useState<string>(effectiveActiveSubject);
  const [newGrade, setNewGrade] = useState<'7' | '8' | '9'>('7');
  const [newSemester, setNewSemester] = useState<CbtExamPackage['semester']>('Ganjil (PTS/STS)');
  const [selectedTargetClasses, setSelectedTargetClasses] = useState<string[]>(() => {
    const grade7Classes = SCHOOL_CLASSES.filter(c => c.id.startsWith('7')).map(c => c.id);
    return grade7Classes;
  });
  const [newDuration, setNewDuration] = useState<number>(60);
  const [newToken, setNewToken] = useState<string>('');
  const [newPassingGrade, setNewPassingGrade] = useState<number>(75);
  const [newExamDate, setNewExamDate] = useState<string>(() => toLocalDateString(new Date()));
  const [newStartTime, setNewStartTime] = useState<string>('07:30');
  const [newEndTime, setNewEndTime] = useState<string>('09:00');

  // Schedule & Settings modal state for updating existing package
  const [scheduleModalPkg, setScheduleModalPkg] = useState<CbtExamPackage | null>(null);
  const [editPkgTitle, setEditPkgTitle] = useState<string>('');
  const [editPkgSubject, setEditPkgSubject] = useState<string>('');
  const [editPkgToken, setEditPkgToken] = useState<string>('');
  const [editPkgPassingGrade, setEditPkgPassingGrade] = useState<number>(75);
  const [editPkgSemester, setEditPkgSemester] = useState<CbtExamPackage['semester']>('Ganjil (PTS/STS)');
  const [editPkgTargetClasses, setEditPkgTargetClasses] = useState<string[]>([]);
  const [editSchedDate, setEditSchedDate] = useState<string>('');
  const [editSchedStartTime, setEditSchedStartTime] = useState<string>('07:30');
  const [editSchedEndTime, setEditSchedEndTime] = useState<string>('09:00');
  const [editSchedDuration, setEditSchedDuration] = useState<number>(60);

  const openScheduleModal = (pkg: CbtExamPackage) => {
    setScheduleModalPkg(pkg);
    setEditPkgTitle(pkg.title || '');
    const initialSub =
      availableTeacherSubjects.length > 1 &&
      (!pkg.subject || pkg.subject.toLowerCase().trim() === (teacherSubject || '').toLowerCase().trim())
        ? effectiveActiveSubject
        : (pkg.subject || effectiveActiveSubject);
    setEditPkgSubject(initialSub);
    setEditPkgToken(pkg.token || '');
    setEditPkgPassingGrade(pkg.passingGrade || 75);
    setEditPkgSemester(pkg.semester || 'Ganjil (PTS/STS)');
    setEditPkgTargetClasses(
      Array.isArray(pkg.targetClasses) && pkg.targetClasses.length > 0
        ? pkg.targetClasses
        : SCHOOL_CLASSES.filter(c => c.id.startsWith(String(pkg.gradeLevel || '7'))).map(c => c.id)
    );
    const rawDate = toLocalDateString(pkg.examDate);
    setEditSchedDate(rawDate);
    setEditSchedStartTime(pkg.startTime || '07:30');
    setEditSchedEndTime(pkg.endTime || '09:00');
    setEditSchedDuration(pkg.durationMinutes || 60);
  };

  const handleSavePackageSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModalPkg) return;

    if (editSchedStartTime >= editSchedEndTime) {
      alert('Jam mulai harus lebih awal daripada jam selesai.');
      return;
    }

    const cleanDate = toLocalDateString(editSchedDate);
    const updatedPkg: CbtExamPackage = {
      ...scheduleModalPkg,
      title: editPkgTitle.trim() || scheduleModalPkg.title,
      subject: editPkgSubject.trim() || scheduleModalPkg.subject,
      token: (editPkgToken.trim() || scheduleModalPkg.token).toUpperCase(),
      passingGrade: Number(editPkgPassingGrade) || 75,
      semester: editPkgSemester || scheduleModalPkg.semester,
      targetClasses: editPkgTargetClasses.length > 0 ? editPkgTargetClasses : scheduleModalPkg.targetClasses,
      examDate: cleanDate,
      startTime: editSchedStartTime,
      endTime: editSchedEndTime,
      durationMinutes: editSchedDuration,
      status: 'active' as const,
      emergencyPaused: false
    };

    const updated = packages.map(p => (p.id === updatedPkg.id ? updatedPkg : p));
    setPackages(updated);
    setScheduleModalPkg(null);

    const ok = await saveStoredCbtPackage(updatedPkg);
    showToast(
      ok
        ? `✓ Pengaturan & jadwal paket berhasil disimpan ke MariaDB: ${formatIndonesianExamDate(cleanDate)} (${editSchedStartTime} - ${editSchedEndTime} WIB)`
        : `✓ Pengaturan paket disimpan secara lokal & masuk antrean sinkronisasi MariaDB`
    );
  };

  // Handle grade change and auto-set target classes
  const handleGradeChange = (grade: '7' | '8' | '9') => {
    setNewGrade(grade);
    const gradeClasses = SCHOOL_CLASSES.filter(c => c.id.startsWith(grade)).map(c => c.id);
    setSelectedTargetClasses(gradeClasses);
  };

  // Keep newSubject synced if effectiveActiveSubject changes
  useEffect(() => {
    if (effectiveActiveSubject) {
      setNewSubject(effectiveActiveSubject);
    }
  }, [effectiveActiveSubject]);

  const [studentSessions, setStudentSessions] = useState(() => getStoredStudentCbtSessions());

  // Load packages on mount, sync with MariaDB & subscribe to updates
  useEffect(() => {
    setPackages(getStoredCbtPackages());
    setStudentSessions(getStoredStudentCbtSessions());
    syncCbtFromCloudSilently();

    const handlePkgUpdate = () => {
      setPackages(getStoredCbtPackages());
    };

    const handleSessUpdate = () => {
      setStudentSessions(getStoredStudentCbtSessions());
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes('cbt')) {
        handlePkgUpdate();
        handleSessUpdate();
      }
    };

    window.addEventListener('cbtPackagesUpdated', handlePkgUpdate);
    window.addEventListener('cbtSessionsUpdated', handleSessUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('cbtPackagesUpdated', handlePkgUpdate);
      window.removeEventListener('cbtSessionsUpdated', handleSessUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Keep selectedPackageForEdit in sync when packages array updates from cloud sync
  useEffect(() => {
    if (!selectedPackageForEdit) return;
    const latest = packages.find(p => p.id === selectedPackageForEdit.id);
    if (latest && JSON.stringify(latest) !== JSON.stringify(selectedPackageForEdit)) {
      setSelectedPackageForEdit(latest);
    }
  }, [packages, selectedPackageForEdit]);

  // Set default selected package for scores & keep its reference fresh when myPackages change
  useEffect(() => {
    if (myPackages.length > 0) {
      if (!selectedPackageForScores) {
        setSelectedPackageForScores(myPackages[0]);
      } else {
        const latestMatch = myPackages.find(p => p.id === selectedPackageForScores.id);
        if (!latestMatch) {
          setSelectedPackageForScores(myPackages[0]);
        } else if (JSON.stringify(latestMatch) !== JSON.stringify(selectedPackageForScores)) {
          setSelectedPackageForScores(latestMatch);
        }
      }
    } else {
      setSelectedPackageForScores(null);
    }
  }, [myPackages, selectedPackageForScores]);

  // Create new package handler
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newId = `cbt_${Date.now()}`;
    const generatedToken = newToken.trim() || `PAS${newGrade}${Math.floor(10 + Math.random() * 90)}`;
    
    // Classes for selected grade: use customized selectedTargetClasses
    const targetClasses = selectedTargetClasses.length > 0
      ? selectedTargetClasses
      : SCHOOL_CLASSES.filter(c => c.id.startsWith(newGrade)).map(c => c.id);

    const newPkg: CbtExamPackage = {
      id: newId,
      title: newTitle.trim(),
      subject: (availableTeacherSubjects.length > 1 ? newSubject : (teacherSubject || newSubject)) || 'Informatika',
      gradeLevel: newGrade,
      targetClasses: targetClasses,
      semester: newSemester || 'Ganjil (PTS/STS)',
      academicYear: '2026/2027',
      durationMinutes: newDuration,
      token: generatedToken.toUpperCase(),
      passingGrade: newPassingGrade,
      totalQuestions: 0,
      status: 'active',
      examDate: toLocalDateString(newExamDate),
      startTime: newStartTime || '07:30',
      endTime: newEndTime || '09:00',
      emergencyPaused: false,
      teacherName: teacherName || 'Ichsanul Arifin, S.Kom.',
      instructions: 'Kerjakan ujian dengan jujur dan teliti. Patuhi seluruh tata tertib asesmen.',
      createdAt: toLocalDateString(new Date()),
      questions: []
    };

    const updated = [newPkg, ...packages];
    setPackages(updated);
    setShowCreatePackageModal(false);
    setNewTitle('');
    setNewToken('');
    setSelectedPackageForEdit(newPkg); // Open editor immediately

    const ok = await saveStoredCbtPackage(newPkg);
    showToast(
      ok
        ? `✓ Paket ujian "${newPkg.title}" berhasil dibuat & tersimpan di MariaDB!`
        : `✓ Paket ujian "${newPkg.title}" dibuat & masuk antrean sinkronisasi MariaDB`
    );
  };

  // Toggle package status (Active / Draft)
  const handleToggleStatus = async (pkgId: string) => {
    const target = packages.find(p => p.id === pkgId);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'draft' : 'active';
    const updatedPkg: CbtExamPackage = {
      ...target,
      status: nextStatus,
      emergencyPaused: nextStatus === 'draft' ? target.emergencyPaused : false
    };
    const updated = packages.map(p => (p.id === pkgId ? updatedPkg : p));
    setPackages(updated);
    const ok = await saveStoredCbtPackage(updatedPkg);
    showToast(
      ok
        ? `✓ Status paket diubah ke ${nextStatus === 'active' ? 'AKTIF' : 'DRAFT'} & tersimpan di MariaDB`
        : `✓ Status paket diubah ke ${nextStatus === 'active' ? 'AKTIF' : 'DRAFT'}`
    );
  };

  // Delete package
  const handleDeletePackage = async (pkgId: string) => {
    const target = packages.find(p => p.id === pkgId);
    if (confirm(`Yakin ingin menghapus paket ujian "${target?.title || pkgId}" beserta seluruh butir soalnya dari database?`)) {
      const updated = packages.filter(p => p.id !== pkgId);
      setPackages(updated);
      if (selectedPackageForEdit?.id === pkgId) setSelectedPackageForEdit(null);
      if (selectedPackageForScores?.id === pkgId) setSelectedPackageForScores(null);
      const ok = await deleteStoredCbtPackage(pkgId);
      showToast(
        ok
          ? '🗑️ Paket ujian beserta seluruh butir soalnya berhasil dihapus dari database MariaDB.'
          : '🗑️ Paket ujian dihapus dari cache lokal & antrean sinkronisasi.'
      );
    }
  };

  // Save question to currently edited package
  const handleSaveQuestion = async (q: CbtQuestion) => {
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
    const savedIndex = updatedQuestions.findIndex(item => item.id === q.id);
    const savedNumber = savedIndex >= 0 ? savedIndex + 1 : updatedQuestions.length;

    const updatedPkg: CbtExamPackage = {
      ...selectedPackageForEdit,
      questions: updatedQuestions,
      totalQuestions: updatedQuestions.length
    };

    const updatedAll = packages.map(p => p.id === updatedPkg.id ? updatedPkg : p);
    setPackages(updatedAll);
    setSelectedPackageForEdit(updatedPkg);
    setEditingQuestion(null);

    const ok = await saveStoredCbtPackage(updatedPkg);
    showToast(
      ok
        ? `✓ Butir soal No. ${savedNumber} berhasil disimpan ke database MariaDB! (Total: ${updatedQuestions.length} soal)`
        : `✓ Butir soal No. ${savedNumber} disimpan di cache lokal & masuk antrean sinkronisasi MariaDB`
    );
  };

  // Delete question from currently edited package
  const handleDeleteQuestion = async (qId: string) => {
    if (!selectedPackageForEdit) return;
    if (confirm('Hapus butir soal ini dari paket ujian dan database?')) {
      const remaining = selectedPackageForEdit.questions
        .filter(q => q.id !== qId)
        .map((q, idx) => ({ ...q, number: idx + 1 }));

      const updatedPkg: CbtExamPackage = {
        ...selectedPackageForEdit,
        questions: remaining,
        totalQuestions: remaining.length
      };

      const updatedAll = packages.map(p => p.id === updatedPkg.id ? updatedPkg : p);
      setPackages(updatedAll);
      setSelectedPackageForEdit(updatedPkg);

      const ok = await saveStoredCbtPackage(updatedPkg);
      showToast(
        ok
          ? `🗑️ Butir soal berhasil dihapus & disinkronkan ke MariaDB (Sisa: ${remaining.length} soal)`
          : `🗑️ Butir soal dihapus & masuk antrean sinkronisasi MariaDB`
      );
    }
  };

  // Finish & explicitly sync currently edited package to MariaDB
  const handleFinishEditingPackage = async () => {
    if (!selectedPackageForEdit) return;
    const pkgToSync = selectedPackageForEdit;
    setSelectedPackageForEdit(null);
    const ok = await saveStoredCbtPackage(pkgToSync);
    showToast(
      ok
        ? `✓ Paket "${pkgToSync.title}" beserta ${pkgToSync.questions.length} butir soal berhasil disinkronkan ke MariaDB!`
        : `✓ Paket "${pkgToSync.title}" disimpan & masuk antrean sinkronisasi MariaDB`
    );
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
      const session = allSessions[sessionKey] || Object.values(allSessions).find(s =>
        s.examId === pkgId && (
          s.studentId === student.id ||
          (student.nisn && (s.studentNisn === student.nisn || s.studentId === student.nisn))
        )
      );

      const score = session?.score ?? 0;
      const isPassed = session?.isPassed ?? false;
      const isSubmitted = Boolean(session?.isSubmitted);
      const isLocked = !isSubmitted && Number(session?.violationCount || 0) >= 1;
      const isWorking = Boolean(session && !isSubmitted && !isLocked);

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
        hasSubmitted: isSubmitted,
        isLocked: isLocked,
        isWorking: isWorking,
        hasAnySession: Boolean(session)
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
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tab Switcher: Daftar Paket vs Rekap Nilai */}
        <div className="inline-flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('packages');
              setSelectedPackageForEdit(null);
              syncCbtFromCloudSilently();
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'packages' && !selectedPackageForEdit
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Paket Ujian ({myPackages.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('scores');
              setSelectedPackageForEdit(null);
              syncCbtFromCloudSilently();
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'scores'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rekapitulasi Nilai (.xlsx)
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewSubject(effectiveActiveSubject);
            setShowCreatePackageModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <span>+ Buat Paket Ujian</span>
        </button>
      </div>

      {/* 2. TAB CONTENT: DAFTAR PAKET UJIAN */}
      {activeTab === 'packages' && !selectedPackageForEdit && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myPackages.length === 0 ? (
            <div className="col-span-full p-8 rounded-2xl bg-white border border-slate-200/80 text-center space-y-3">
              <div className="text-3xl">📝</div>
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Paket Ujian {effectiveActiveSubject || ''}</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Klik tombol <strong>"+ Buat Paket Ujian"</strong> untuk membuat soal asesmen CBT.
              </p>
            </div>
          ) : (
            myPackages.map(pkg => {
              const schedEval = evaluateCbtPackageSchedule(pkg);
              return (
              <div
                key={pkg.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
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

                  {/* Schedule & Time Window Banner */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        🕒
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                          Jadwal Sesi Ujian
                        </span>
                        <span className="font-bold text-slate-800 text-xs">
                          📅 {formatIndonesianExamDate(pkg.examDate)} • {pkg.startTime || '07:30'} - {pkg.endTime || '09:00'} WIB
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${schedEval.badgeClass}`}>
                        {schedEval.statusLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => openScheduleModal(pkg)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="Atur tanggal dan jam mulai-selesai untuk paket ujian ini"
                      >
                        <span>⚙️ Atur Jam</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata Pills */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Kelas Sasaran:</span>
                      <span className="font-semibold text-slate-800" title={pkg.targetClasses.join(', ')}>
                        {pkg.targetClasses.length >= 6 ? `Semua Kelas ${pkg.gradeLevel}` : `Kelas ${pkg.targetClasses.join(', ')}`}
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
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openScheduleModal(pkg)}
                      className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition border border-amber-200 cursor-pointer flex items-center gap-1"
                      title="Atur Tanggal, Jam Sesi, dan Durasi Ujian"
                    >
                      <span>🕒 Jadwal</span>
                    </button>
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
            );
          })
          )}
        </div>
      )}

      {/* 3. QUESTION EDITOR FOR SELECTED PACKAGE */}
      {selectedPackageForEdit && (
        <div className="space-y-5">
          {/* Editor Header */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-indigo-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
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
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-bold text-emerald-700">
                  {selectedPackageForEdit.questions.length} Butir Soal
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Kelola Butir Soal: {selectedPackageForEdit.title}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
              <button
                type="button"
                onClick={handleFinishEditingPackage}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Simpan paket beserta seluruh butir soal ke database MariaDB dan kembali ke daftar paket"
              >
                <span>✓ Selesai &amp; Simpan Paket</span>
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs">
                        No. {idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                        {q.type.replace('_', ' ')}
                      </span>
                      {q.mediaType && q.mediaType !== 'none' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {q.mediaType === 'image' && '🖼️ Bergambar'}
                          {q.mediaType === 'audio' && `🎧 Audio Listening (${q.audioMaxPlays || 3}x Putar)`}
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

                  {/* Pratinjau Media Stimulus Soal */}
                  {q.mediaType === 'image' && q.mediaUrl && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center gap-3">
                      <img
                        src={q.mediaUrl}
                        alt={q.mediaCaption || 'Stimulus Gambar'}
                        className="max-h-36 w-auto rounded-lg object-contain border border-slate-200 bg-white"
                      />
                      {q.mediaCaption && (
                        <span className="text-[11px] text-slate-600 italic">{q.mediaCaption}</span>
                      )}
                    </div>
                  )}

                  {q.mediaType === 'audio' && q.mediaUrl && (
                    <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-indigo-900">
                        🎧 {q.mediaCaption || 'Stimulus Audio Listening'} (Maks. {q.audioMaxPlays || 3}x putar)
                      </div>
                      <audio controls src={resolveCbtAudioSource(q.mediaUrl)} className="h-8 max-w-xs" />
                    </div>
                  )}

                  {q.mediaType === 'video' && q.mediaUrl && (() => {
                    const resolved = resolveCbtVideoSource(q.mediaUrl);
                    return (
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                        {resolved.mode === 'iframe' ? (
                          <div className="w-full max-w-md aspect-video rounded-lg overflow-hidden">
                            <iframe
                              src={resolved.src}
                              title={q.mediaCaption || 'Pratinjau Video Soal'}
                              sandbox="allow-scripts allow-same-origin allow-presentation"
                              className="w-full h-full border-0"
                            />
                          </div>
                        ) : (
                          <video
                            controls
                            playsInline
                            controlsList="nodownload nofullscreen"
                            disablePictureInPicture
                            src={resolved.src}
                            className="max-h-44 rounded-lg"
                          />
                        )}
                        {q.mediaCaption && (
                          <div className="text-[11px] text-slate-300 italic">{q.mediaCaption}</div>
                        )}
                      </div>
                    );
                  })()}

                  <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                    {q.question}
                  </p>

                  {/* Ringkasan Opsi */}
                  {q.type === 'pg' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg border ${
                            oIdx === q.correctOptionIndex
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="mr-1 font-mono">[{String.fromCharCode(65 + oIdx)}]</span>
                          {opt} {oIdx === q.correctOptionIndex && '✓ (Kunci)'}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'pg_kompleks' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {q.options.map((opt, oIdx) => {
                        const isKey = (q.correctOptionIndices || []).includes(oIdx);
                        return (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-lg border ${
                              isKey
                                ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className="mr-1 font-mono">[{String.fromCharCode(65 + oIdx)}]</span>
                            {opt} {isKey && '✓ (Kunci Benar)'}
                          </div>
                        );
                      })}
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
                    <div className="text-[11px] space-y-1.5">
                      {q.matchingPairs.map((p, pIdx) => (
                        <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 gap-1.5">
                          <span className="font-semibold text-slate-800 text-xs">
                            <span className="text-slate-400 font-mono mr-1">{pIdx + 1}.</span> {p.leftPrompt}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs">
                            <span className="text-emerald-600">✓ Kunci:</span> {p.rightMatch}
                          </span>
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
                  Tinjau perolehan skor nilai siswa dari database MariaDB dan unduh format Excel resmi.
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
                  {myPackages.map(p => (
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
                    <th className="px-3 py-2.5 w-28 text-center">Ketuntasan / Status</th>
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
                          ) : res.isLocked ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              🔒 TERKUNCI
                            </span>
                          ) : res.isWorking ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              ⏳ MENGERJAKAN
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium italic">
                              Belum Mengikuti
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-slate-500 text-[11px]">
                          {res.submittedAt
                            ? new Date(res.submittedAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Asia/Jakarta'
                              }) + ' WIB'
                            : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {res.hasAnySession ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (!selectedPackageForScores) return;
                                if (confirm(`Reset sesi ujian untuk ${res.studentName} dari database? Nilai dan jawaban sebelumnya akan dihapus sehingga siswa dapat mengikuti ujian kembali.`)) {
                                  resetStoredStudentCbtSession(selectedPackageForScores.id, res.studentId, res.studentNisn);
                                  setStudentSessions(getStoredStudentCbtSessions());
                                  showToast(`🔄 Sesi ujian ${res.studentName} berhasil di-reset di database MariaDB!`);
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-xs active:scale-95"
                              title="Reset ujian siswa ini di database agar bisa mengulang"
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

      {/* 5. MODAL FORM: BUAT PAKET UJIAN BARU (LANDSCAPE 2-KOLOM MODERN) */}
      {showCreatePackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-4xl w-full space-y-4 shadow-2xl border border-indigo-100 my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center text-xl font-bold shadow-xs">
                  📝
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Buat Paket Ujian CBT Baru
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur judul asesmen, rombel peserta, dan jam pelaksanaan secara terpadu (tersinkron ke MariaDB).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreatePackageModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold transition flex items-center justify-center cursor-pointer"
                title="Tutup Modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-4 text-xs">
              
              {/* Teacher Info Bar */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Guru Pengampu (Otomatis):</span>
                  <span className="font-bold text-slate-900">{teacherName || 'Guru Pengampu'}</span>
                </div>
                {teacherSubject && (
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] shadow-xs">
                    Mapel: {availableTeacherSubjects.length > 1 ? newSubject : teacherSubject}
                  </span>
                )}
              </div>

              {/* LANDSCAPE 2-COLUMN GRID CONTAINER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* ======================================================== */}
                {/* KOLOM KIRI: Identitas Asesmen & Rombel Sasaran            */}
                {/* ======================================================== */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama / Judul Ujian:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={`Contoh: Asesmen Tengah Semester (PTS) - ${availableTeacherSubjects.length > 1 ? newSubject : (teacherSubject || 'Informatika')}`}
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Mata Pelajaran:
                      </label>
                      {availableTeacherSubjects.length > 1 ? (
                        <select
                          value={newSubject}
                          onChange={(e) => {
                            setNewSubject(e.target.value);
                            if (onSelectSubject) onSelectSubject(e.target.value);
                          }}
                          className="w-full px-2.5 py-2 rounded-xl bg-indigo-50 border border-indigo-300 text-indigo-950 focus:outline-none focus:border-indigo-600 font-bold text-xs cursor-pointer"
                        >
                          {availableTeacherSubjects.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      ) : teacherSubject ? (
                        <div className="w-full px-3 py-2 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-900 font-bold flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 truncate">
                            <span>💻</span>
                            <span className="truncate">{teacherSubject}</span>
                          </span>
                          <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-semibold shadow-2xs shrink-0">
                            Mapel Anda
                          </span>
                        </div>
                      ) : (
                        <select
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                        >
                          <option value="Informatika">Informatika</option>
                          <option value="Ilmu Pengetahuan Alam (IPA)">Ilmu Pengetahuan Alam (IPA)</option>
                          <option value="Matematika">Matematika</option>
                          <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                          <option value="Bahasa Inggris">Bahasa Inggris</option>
                          <option value="Ilmu Pengetahuan Sosial (IPS)">Ilmu Pengetahuan Sosial (IPS)</option>
                          <option value="Pendidikan Agama Islam (PABP)">Pendidikan Agama Islam (PABP)</option>
                          <option value="PPKn">PPKn</option>
                          <option value="Seni Budaya (SBK)">Seni Budaya (SBK)</option>
                          <option value="PJOK">PJOK</option>
                          <option value="Bahasa Sunda">Bahasa Sunda</option>
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Tingkat &amp; Jenis Asesmen:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={newGrade}
                          onChange={(e) => handleGradeChange(e.target.value as any)}
                          className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 font-bold"
                        >
                          <option value="7">Kelas 7</option>
                          <option value="8">Kelas 8</option>
                          <option value="9">Kelas 9</option>
                        </select>
                        <select
                          value={newSemester}
                          onChange={(e) => setNewSemester(e.target.value as any)}
                          className="w-full px-2 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 font-medium text-[11px]"
                        >
                          <option value="Ganjil (PTS/STS)">PTS Ganjil</option>
                          <option value="Ganjil (PAS/SAS)">PAS Ganjil</option>
                          <option value="Genap (PTS/STS)">PTS Genap</option>
                          <option value="Genap (PAT/SAT)">PAT Genap</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Pilihan Rombel Sasaran (Multi-Checklist) */}
                  <div className="space-y-2 p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <label className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                        <span>🎯 Rombel Sasaran:</span>
                        <span className="text-indigo-700 font-black">({selectedTargetClasses.length} Kelas Dipilih)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setSelectedTargetClasses(SCHOOL_CLASSES.filter(c => c.id.startsWith(newGrade)).map(c => c.id))}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 transition cursor-pointer shadow-2xs"
                      >
                        Pilih Semua Kelas {newGrade}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {SCHOOL_CLASSES.filter(c => c.id.startsWith(newGrade)).map(c => {
                        const isSelected = selectedTargetClasses.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                if (selectedTargetClasses.length === 1) {
                                  alert('Paket ujian harus ditujukan untuk minimal 1 rombel/kelas!');
                                  return;
                                }
                                setSelectedTargetClasses(selectedTargetClasses.filter(id => id !== c.id));
                              } else {
                                setSelectedTargetClasses([...selectedTargetClasses, c.id].sort());
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{isSelected ? '✓' : '+'}</span>
                            <span>{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      💡 Siswa di luar rombel terpilih tidak akan melihat paket ujian ini.
                    </p>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* KOLOM KANAN: Jadwal Sesi & Parameter Waktu CBT           */}
                {/* ======================================================== */}
                <div className="space-y-3 flex flex-col justify-between">
                  
                  {/* SECTION: JADWAL PELAKSANAAN & WAKTU UJIAN */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🕒</span>
                      <label className="font-bold text-indigo-950 text-xs">
                        Jadwal & Waktu Pelaksanaan Ujian:
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Tanggal Ujian:
                        </label>
                        <input
                          type="date"
                          required
                          value={newExamDate}
                          onChange={(e) => setNewExamDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Jam Mulai:
                        </label>
                        <input
                          type="time"
                          required
                          value={newStartTime}
                          onChange={(e) => setNewStartTime(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Jam Selesai:
                        </label>
                        <input
                          type="time"
                          required
                          value={newEndTime}
                          onChange={(e) => setNewEndTime(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-indigo-700/80">
                      ℹ️ Sistem otomatis membuka akses ujian tepat jam mulai, dan auto-submit saat jam selesai.
                    </p>
                  </div>

                  {/* Durasi, KKM, Token Masuk */}
                  <div className="grid grid-cols-3 gap-2.5">
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
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
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
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
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

                  {/* Next Step Information Box */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed flex items-center gap-2">
                    <span className="text-base flex-shrink-0">💡</span>
                    <span>
                      Setelah disimpan, paket ujian langsung tercatat di <strong>MariaDB</strong> dan Anda diarahkan ke <strong>Editor Soal</strong> untuk mengisi butir pertanyaan.
                    </span>
                  </div>

                </div>

              </div>

              {/* Action Buttons Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreatePackageModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98 flex items-center gap-1.5"
                >
                  <span>Simpan & Masuk Editor Soal</span>
                  <span>→</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL ATUR JADWAL, JAM & PENGATURAN PAKET UJIAN GURU */}
      {scheduleModalPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center text-xl font-bold">
                  🕒
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pengaturan &amp; Jadwal Pelaksanaan Ujian
                  </h3>
                  <p className="text-xs text-slate-500 truncate max-w-xs">
                    {scheduleModalPkg.subject} • Kelas {scheduleModalPkg.gradeLevel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModalPkg(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePackageSchedule} className="space-y-3.5 text-xs">
              {/* Nama Paket */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Paket Ujian:
                </label>
                <input
                  type="text"
                  required
                  value={editPkgTitle}
                  onChange={(e) => setEditPkgTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {availableTeacherSubjects.length > 1 && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mata Pelajaran Paket Ujian:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTeacherSubjects.map((sub) => {
                      const isSel = editPkgSubject === sub;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setEditPkgSubject(sub)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition text-left cursor-pointer flex items-center gap-1.5 ${
                            isSel
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>{isSel ? '●' : '○'}</span>
                          <span className="truncate">{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Token, KKM, Semester */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Token Ujian:
                  </label>
                  <input
                    type="text"
                    required
                    value={editPkgToken}
                    onChange={(e) => setEditPkgToken(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-indigo-700 font-mono font-bold focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    KKM:
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={editPkgPassingGrade}
                    onChange={(e) => setEditPkgPassingGrade(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Semester:
                  </label>
                  <select
                    value={editPkgSemester}
                    onChange={(e) => setEditPkgSemester(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="Ganjil (PTS/STS)">PTS Ganjil</option>
                    <option value="Ganjil (PAS/SAS)">PAS Ganjil</option>
                    <option value="Genap (PTS/STS)">PTS Genap</option>
                    <option value="Genap (PAT/SAT)">PAT Genap</option>
                  </select>
                </div>
              </div>

              {/* Rombel Sasaran */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <label className="block font-bold text-slate-700 text-[11px]">
                  Rombel Sasaran ({editPkgTargetClasses.length} Kelas):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SCHOOL_CLASSES.filter(c =>
                    scheduleModalPkg.gradeLevel === 'Semua'
                      ? true
                      : c.id.startsWith(String(scheduleModalPkg.gradeLevel || '7'))
                  ).map(c => {
                    const isSelected = editPkgTargetClasses.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (editPkgTargetClasses.length === 1) return;
                            setEditPkgTargetClasses(editPkgTargetClasses.filter(id => id !== c.id));
                          } else {
                            setEditPkgTargetClasses([...editPkgTargetClasses, c.id].sort());
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{c.id}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tanggal & Durasi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Pelaksanaan Ujian:
                  </label>
                  <input
                    type="date"
                    required
                    value={editSchedDate}
                    onChange={(e) => setEditSchedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Durasi Pengerjaan (Menit):
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    required
                    value={editSchedDuration}
                    onChange={(e) => setEditSchedDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* Jam Mulai & Jam Selesai */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jam Mulai Sesi:
                  </label>
                  <input
                    type="time"
                    required
                    value={editSchedStartTime}
                    onChange={(e) => setEditSchedStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jam Selesai Sesi:
                  </label>
                  <input
                    type="time"
                    required
                    value={editSchedEndTime}
                    onChange={(e) => setEditSchedEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-900 leading-relaxed">
                💡 Perubahan jadwal, token, dan jam sesi ini langsung tersinkron otomatis ke database MariaDB, kartu ujian siswa, dan ruang pengawas.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalPkg(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  Simpan Pengaturan &amp; Jadwal ✓
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

      {/* TOAST NOTIFIKASI */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-fade-in flex items-center gap-2">
          <span>✅</span>
          <span>{toastMsg}</span>
        </div>
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
  const [audioMaxPlays, setAudioMaxPlays] = useState<number>(initialQuestion.audioMaxPlays || 3);
  const [scoreWeight, setScoreWeight] = useState<number>(initialQuestion.scoreWeight || 20);
  const [isCompressingMedia, setIsCompressingMedia] = useState<boolean>(false);

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

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingMedia(true);
    try {
      const compressed = await compressImage(file, 1000, 0.78);
      setMediaUrl(compressed);
      if (!mediaCaption.trim()) {
        setMediaCaption(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch {
      alert('Gagal memproses berkas gambar.');
    } finally {
      setIsCompressingMedia(false);
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3.5 * 1024 * 1024) {
      alert('Ukuran file audio maksimal 3.5 MB agar dapat disimpan langsung ke database. Untuk file lebih besar, silakan tempelkan URL MP3.');
      return;
    }
    setIsCompressingMedia(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMediaUrl(reader.result);
        if (!mediaCaption.trim()) {
          setMediaCaption(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
      setIsCompressingMedia(false);
    };
    reader.onerror = () => {
      alert('Gagal membaca file audio.');
      setIsCompressingMedia(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) {
      alert('Teks pertanyaan tidak boleh kosong.');
      return;
    }
    if (qType === 'pg_kompleks' && correctPgIndices.length === 0) {
      alert('Pilih minimal satu kunci jawaban benar untuk soal PG Kompleks.');
      return;
    }

    const compiled: CbtQuestion = {
      id: initialQuestion.id,
      number: initialQuestion.number,
      type: qType,
      question: qText.trim(),
      scoreWeight: scoreWeight,
      mediaType: mediaType,
      mediaUrl: mediaType !== 'none' && mediaUrl.trim() ? mediaUrl.trim() : undefined,
      mediaCaption: mediaType !== 'none' && mediaCaption.trim() ? mediaCaption.trim() : undefined,
      audioMaxPlays: mediaType === 'audio' ? Number(audioMaxPlays) || 3 : undefined
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
              Pilih tipe soal dan lampirkan stimulus media sesuai kebutuhan materi (tersinkron ke MariaDB).
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">
            ✕
          </button>
        </div>

        {/* Form Body with Fixed Bottom Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="space-y-4 overflow-y-auto flex-1 pr-1.5 text-xs pb-3">
          
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-bold text-slate-700">
                2. Lampiran Media Stimulus (Opsional):
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
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
              <div className="space-y-2.5 pt-1">
                {mediaType === 'image' && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shrink-0">
                      <span>📤 Upload Gambar dari Perangkat</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-400">atau tempelkan tautan URL gambar di bawah:</span>
                  </div>
                )}

                {mediaType === 'audio' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shrink-0">
                      <span>📤 Upload Audio MP3 (Maks 3.5MB)</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioFileChange}
                        className="hidden"
                      />
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600">Batas Putar Siswa:</span>
                      <select
                        value={audioMaxPlays}
                        onChange={(e) => setAudioMaxPlays(Number(e.target.value))}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-bold text-xs"
                      >
                        <option value={1}>1 Kali</option>
                        <option value={2}>2 Kali</option>
                        <option value={3}>3 Kali (Default)</option>
                        <option value={5}>5 Kali</option>
                      </select>
                    </div>
                  </div>
                )}

                {isCompressingMedia && (
                  <div className="text-xs font-bold text-indigo-600 animate-pulse">
                    ⏳ Memproses berkas media untuk disimpan ke database...
                  </div>
                )}

                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">
                    URL / Data Media ({mediaType === 'image' ? 'Gambar' : mediaType === 'audio' ? 'Audio MP3' : 'Video'}):
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={
                        mediaType === 'image'
                          ? 'https://contoh-domain.com/gambar-soal.jpg atau upload dari perangkat'
                          : mediaType === 'audio'
                          ? 'https://contoh-domain.com/audio-listening.mp3 atau link Google Drive MP3'
                          : 'https://youtu.be/... atau link Google Drive Video / file .mp4'
                      }
                      value={mediaUrl.startsWith('data:') ? '[Berkas Media Terunggah Siap Disimpan ke Database]' : mediaUrl}
                      readOnly={mediaUrl.startsWith('data:')}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                    {mediaUrl && (
                      <button
                        type="button"
                        onClick={() => setMediaUrl('')}
                        className="px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                        title="Hapus lampiran media"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>

                {mediaType === 'image' && mediaUrl && (
                  <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                    <img
                      src={mediaUrl}
                      alt="Pratinjau Stimulus"
                      className="max-h-40 w-auto object-contain rounded-lg"
                    />
                  </div>
                )}

                {mediaType === 'audio' && mediaUrl && (
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    <audio controls src={resolveCbtAudioSource(mediaUrl)} className="w-full h-9" />
                  </div>
                )}

                {mediaType === 'video' && mediaUrl && (() => {
                  const resolved = resolveCbtVideoSource(mediaUrl);
                  return (
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-200">
                      {resolved.mode === 'iframe' ? (
                        <div className="w-full aspect-video max-h-52 mx-auto rounded-lg overflow-hidden">
                          <iframe
                            src={resolved.src}
                            title="Pratinjau Video Stimulus"
                            sandbox="allow-scripts allow-same-origin allow-presentation"
                            className="w-full h-full border-0"
                          />
                        </div>
                      ) : (
                        <video
                          controls
                          playsInline
                          controlsList="nodownload nofullscreen"
                          disablePictureInPicture
                          src={resolved.src}
                          className="w-full max-h-52 mx-auto rounded-lg"
                        />
                      )}
                    </div>
                  );
                })()}

                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">
                    Keterangan / Judul Stimulus Media:
                  </span>
                  <input
                    type="text"
                    placeholder="Contoh: Perhatikan gambar jaringan komputer berikut / Audio Section 1"
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
                  {statements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setStatements(statements.filter((_, i) => i !== idx))}
                      className="px-2 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 text-xs cursor-pointer"
                      title="Hapus baris pernyataan"
                    >
                      ✕
                    </button>
                  )}
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
                  {pairs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPairs(pairs.filter((_, i) => i !== idx))}
                      className="px-2 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 text-xs cursor-pointer"
                      title="Hapus pasangan"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          </div>

          {/* Footer Save - Always Fixed at the Bottom */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 flex-shrink-0 bg-white">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              💡 Setiap butir soal yang disimpan langsung tersinkron ke MariaDB.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer text-xs transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isCompressingMedia}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold cursor-pointer shadow-md shadow-indigo-600/20 text-xs transition flex items-center gap-1.5"
              >
                <span>💾</span>
                <span>Simpan Butir Soal Ini ✓</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
