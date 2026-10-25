'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CbtExamPackage,
  CBT_EXAM_ROOMS,
  getStoredCbtPackages,
  getStoredCbtRoomAttendances,
  saveStoredCbtRoomAttendance,
  getStoredStudentCbtSessions,
  saveStoredStudentCbtSession,
  registerEmergencyStudentToCbt,
  resetStoredStudentCbtSession,
  getStoredCbtPanitiaConfig,
  saveStoredCbtPanitiaConfig,
  getStudentsForRoom,
  checkInRoomSupervisor,
  evaluateCbtPackageSchedule,
  CbtPanitiaConfig,
  CbtStudentAnswerState,
  CbtRoomAttendance,
  CbtSupervisorSchedule,
  CbtScheduleSessionSlot,
  DEFAULT_SCHEDULE_SESSIONS,
  getSupervisorForSlot,
  getStoredSupervisorSchedule
} from '@/lib/cbtData';
import { Student } from '@/lib/elearningData';
import { exportCbtRoomBapToExcel } from '@/lib/elearningExport';

interface CbtSupervisorRoomProps {
  currentTeacherName: string;
  activeStudents: Student[];
  onOpenExamForStudent?: (exam: CbtExamPackage, student: Student, roomName: string) => void;
}

export default function CbtSupervisorRoom({
  currentTeacherName,
  activeStudents,
  onOpenExamForStudent
}: CbtSupervisorRoomProps) {
  const [packages, setPackages] = useState<CbtExamPackage[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>(CBT_EXAM_ROOMS[0]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  // Attendance records for current room & exam: studentId -> 'H' | 'S' | 'I' | 'A'
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'H' | 'S' | 'I' | 'A'>>({});
  const [bapNotes, setBapNotes] = useState<string>('Ujian berlangsung tertib, aman, dan lancar tanpa kendala teknis.');
  const [supervisorNameInput, setSupervisorNameInput] = useState<string>('');
  const [isBapSaved, setIsBapSaved] = useState<boolean>(false);
  const [isCheckedInThisRoom, setIsCheckedInThisRoom] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [showSavedPulse, setShowSavedPulse] = useState<boolean>(false);

  // Helper Feedback Tersimpan Otomatis Real-time
  const triggerSaveFeedback = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;
    setLastSavedTime(timeStr);
    setShowSavedPulse(true);
    setTimeout(() => setShowSavedPulse(false), 2500);
  };

  // Emergency Student Modal State
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [emName, setEmName] = useState<string>('');
  const [emNisn, setEmNisn] = useState<string>('');
  const [emClass, setEmClass] = useState<string>('7-A');
  const [emGender, setEmGender] = useState<'L' | 'P'>('L');

  // Load packages & live sessions
  useEffect(() => {
    const handlePkgsUpdate = () => {
      const pkgs = getStoredCbtPackages();
      setPackages(pkgs);
      if (pkgs.length > 0 && !selectedExamId) {
        setSelectedExamId(pkgs[0].id);
      }
    };
    handlePkgsUpdate();
    window.addEventListener('cbtPackagesUpdated', handlePkgsUpdate);
    window.addEventListener('storage', handlePkgsUpdate);
    return () => {
      window.removeEventListener('cbtPackagesUpdated', handlePkgsUpdate);
      window.removeEventListener('storage', handlePkgsUpdate);
    };
  }, [selectedExamId]);

  const selectedExam = useMemo(() => {
    return packages.find(p => p.id === selectedExamId) || packages[0];
  }, [packages, selectedExamId]);

  // Evaluasi Jadwal Waktu Sesi Ujian (Tanggal & Jam)
  const examSchedule = useMemo(() => {
    return evaluateCbtPackageSchedule(selectedExam);
  }, [selectedExam]);

  const [panitiaConfig, setPanitiaConfig] = useState<CbtPanitiaConfig>(() => getStoredCbtPanitiaConfig());

  useEffect(() => {
    const handleConfigUpdate = () => {
      setPanitiaConfig(getStoredCbtPanitiaConfig());
    };
    window.addEventListener('cbtPanitiaConfigUpdated', handleConfigUpdate);
    return () => window.removeEventListener('cbtPanitiaConfigUpdated', handleConfigUpdate);
  }, []);

  // Room options from Panitia Config
  const roomOptions = useMemo(() => {
    return panitiaConfig.rooms;
  }, [panitiaConfig]);

  // Selected room object
  const currentRoomObj = useMemo(() => {
    return roomOptions.find(r => r.name === selectedRoom || r.label === selectedRoom) || roomOptions[0];
  }, [roomOptions, selectedRoom]);

  // Students assigned to this room (mixed classes or custom assignments)
  const roomStudents = useMemo(() => {
    return getStudentsForRoom(currentRoomObj, activeStudents);
  }, [currentRoomObj, activeStudents]);

  // Classes in this room (can be 7-A & 8-A!)
  const roomClasses = useMemo(() => {
    if (currentRoomObj?.assignedStudentIds && currentRoomObj.assignedStudentIds.length > 0) {
      const cls = Array.from(new Set(roomStudents.map(s => s.classId))).sort();
      return cls.length > 0 ? cls : (currentRoomObj.classes || ['7-A']);
    }
    return currentRoomObj?.classes || ['7-A'];
  }, [currentRoomObj, roomStudents]);

  // Supervisor Schedule from Panitia
  const [supervisorSchedule, setSupervisorSchedule] = useState<CbtSupervisorSchedule>(() => getStoredSupervisorSchedule());

  useEffect(() => {
    const handleScheduleUpdated = () => {
      setSupervisorSchedule(getStoredSupervisorSchedule());
    };
    window.addEventListener('cbtSupervisorScheduleUpdated', handleScheduleUpdated);
    window.addEventListener('storage', handleScheduleUpdated);
    return () => {
      window.removeEventListener('cbtSupervisorScheduleUpdated', handleScheduleUpdated);
      window.removeEventListener('storage', handleScheduleUpdated);
    };
  }, []);

  // Dynamic session slots from panitia schedule (Jam 1, Jam 2, Jam 3, etc.)
  const scheduleSessions: CbtScheduleSessionSlot[] = useMemo(() => {
    if (supervisorSchedule.sessions && supervisorSchedule.sessions.length > 0) {
      return supervisorSchedule.sessions;
    }
    return DEFAULT_SCHEDULE_SESSIONS;
  }, [supervisorSchedule.sessions]);

  // Sesi Jam Mengawas Aktif: Default ke sesi yang sedang berlangsung atau sesi pertama
  const [activeSlotId, setActiveSlotId] = useState<string>(() => {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const sched = getStoredSupervisorSchedule();
    const sess = (sched.sessions && sched.sessions.length > 0) ? sched.sessions : DEFAULT_SCHEDULE_SESSIONS;
    const match = sess.find(s => {
      const [sh, sm] = (s.startTime || '00:00').split(':').map(Number);
      const [eh, em] = (s.endTime || '23:59').split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      return currentMin >= startMin && currentMin <= endMin;
    });
    return match ? match.id : (sess[0]?.id || 'jam1');
  });

  // Current session slot object
  const currentSlot: CbtScheduleSessionSlot = useMemo(() => {
    return scheduleSessions.find(s => s.id === activeSlotId) || scheduleSessions[0] || {
      id: 'jam1',
      name: 'Jam Ke-1',
      startTime: '07:30',
      endTime: '09:00',
      subject: ''
    };
  }, [scheduleSessions, activeSlotId]);

  // Temukan ruangan tugas resmi guru untuk sesi jam yang sedang dipilih
  const assignedScheduleEntry = useMemo(() => {
    if (!currentTeacherName || currentTeacherName === 'Guru Pengawas Ruang' || !currentSlot) return null;
    const teacherBase = currentTeacherName.toLowerCase().split(',')[0].trim();
    return supervisorSchedule.entries.find(entry => {
      const scheduledTeacher = getSupervisorForSlot(entry, currentSlot.id);
      if (!scheduledTeacher) return false;
      const schedBase = scheduledTeacher.toLowerCase().split(',')[0].trim();
      return schedBase.includes(teacherBase) || teacherBase.includes(schedBase);
    }) || null;
  }, [currentTeacherName, supervisorSchedule, currentSlot]);

  // Otomatis kunci selectedRoom ke ruangan tugas resmi guru
  useEffect(() => {
    if (assignedScheduleEntry?.roomName) {
      setSelectedRoom(assignedScheduleEntry.roomName);
    }
  }, [assignedScheduleEntry]);

  // Otomatis sinkronkan paket ujian dengan sesi jam aktif (HANYA saat pertama kali atau saat user berganti jam/sesi)
  const lastSyncedSlotIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!packages || packages.length === 0 || !currentSlot) return;

    const isNewSlot = lastSyncedSlotIdRef.current !== currentSlot.id;
    const isCurrentExamValid = Boolean(selectedExamId && packages.some(p => p.id === selectedExamId));

    // Jika user sudah memilih paket ujian secara manual dan slot sesi belum berganti, jangan reset!
    if (!isNewSlot && isCurrentExamValid) {
      return;
    }

    lastSyncedSlotIdRef.current = currentSlot.id;

    // 1. Jika sesi ini tersambung ke paket tertentu
    if (currentSlot.linkedPackageId) {
      const pkg = packages.find(p => p.id === currentSlot.linkedPackageId);
      if (pkg) {
        setSelectedExamId(pkg.id);
        return;
      }
    }

    // 2. Jika sesi ini memiliki mapel, cocokkan dengan nama mapel paket ujian
    if (currentSlot.subject) {
      const subLower = currentSlot.subject.toLowerCase().trim();
      const pkgBySubject = packages.find(p => {
        const pSub = p.subject.toLowerCase().trim();
        return pSub.includes(subLower) || subLower.includes(pSub);
      });
      if (pkgBySubject) {
        setSelectedExamId(pkgBySubject.id);
        return;
      }
    }

    // 3. Fallback jika selectedExamId belum terisi atau tidak valid
    if (!isCurrentExamValid) {
      setSelectedExamId(packages[0].id);
    }
  }, [currentSlot, packages, selectedExamId]);

  const isAssignedByPanitia = Boolean(assignedScheduleEntry);

  // Auto-sync pengawas aktif secara real-time ke Posko Panitia secara tenang (quiet auto-sync)
  useEffect(() => {
    if (!selectedExam || !currentTeacherName || currentTeacherName === 'Guru Pengawas Ruang') return;
    checkInRoomSupervisor({
      roomName: selectedRoom,
      supervisorName: currentTeacherName.trim(),
      examId: selectedExam.id,
      examTitle: selectedExam.title,
      token: selectedExam.token,
      initialRecords: attendanceRecords
    });
  }, [selectedRoom, selectedExam?.id, currentTeacherName]);

  // Auto-fill supervisor name for BAP signature
  useEffect(() => {
    if (currentTeacherName && currentTeacherName !== 'Guru Pengawas Ruang' && !supervisorNameInput) {
      setSupervisorNameInput(currentTeacherName);
    }
  }, [currentTeacherName, supervisorNameInput]);

  // Filter specific class within the room (or 'all' for mixed view)
  const [filterClassInRoom, setFilterClassInRoom] = useState<string>('all');

  const filteredRoomStudents = useMemo(() => {
    if (filterClassInRoom === 'all') return roomStudents;
    return roomStudents.filter(s => s.classId === filterClassInRoom);
  }, [roomStudents, filterClassInRoom]);

  // Load existing room attendance if any & verify check-in status
  useEffect(() => {
    if (!selectedExam) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const all = getStoredCbtRoomAttendances();
    const key = `${selectedRoom}_${selectedExam.id}_${todayStr}`;
    const saved = all[key];

    const loggedInTeacher = (currentTeacherName && currentTeacherName !== 'Guru Pengawas Ruang') ? currentTeacherName.trim() : '';

    // Logika Pintar: Jika BAP belum resmi diserahkan, dahulukan nama guru yang saat ini sedang aktif login di ruangan
    let initialSupName = '';
    if (saved?.isBapSubmitted && saved?.supervisorName && saved.supervisorName !== 'Guru Pengawas Ruang') {
      // Jika BAP sudah diserahkan resmi, kunci ke nama penandatangan BAP yang asli
      initialSupName = saved.supervisorName;
    } else if (loggedInTeacher) {
      // Guru yang sedang membuka ruang pengawas saat ini
      initialSupName = loggedInTeacher;
    } else if (saved?.supervisorName && saved.supervisorName !== 'Guru Pengawas Ruang') {
      initialSupName = saved.supervisorName;
    } else if (currentRoomObj?.supervisorName && currentRoomObj.supervisorName !== 'Guru Pengawas') {
      initialSupName = currentRoomObj.supervisorName;
    } else {
      initialSupName = 'Guru Pengawas Ruang';
    }

    if (saved) {
      const mergedRecords: Record<string, 'H' | 'S' | 'I' | 'A'> = {};
      roomStudents.forEach(st => {
        mergedRecords[st.id] = (saved.records && saved.records[st.id]) ? saved.records[st.id] : 'H';
      });
      if (saved.records) {
        Object.keys(saved.records).forEach(stId => {
          mergedRecords[stId] = saved.records[stId];
        });
      }
      setAttendanceRecords(mergedRecords);
      setBapNotes(saved.notes || '');
      setIsBapSaved(Boolean(saved.isBapSubmitted));
      setSupervisorNameInput(initialSupName);
    } else {
      // Default all students to Hadir (H)
      const initial: Record<string, 'H' | 'S' | 'I' | 'A'> = {};
      roomStudents.forEach(st => {
        initial[st.id] = 'H';
      });
      setAttendanceRecords(initial);
      setIsBapSaved(false);
      setSupervisorNameInput(initialSupName);
    }

    // Tentukan apakah guru yang sedang login sudah check-in di ruangan ini
    const activeSupervisorInConfig = (currentRoomObj?.supervisorName && currentRoomObj.supervisorName !== 'Guru Pengawas')
      ? currentRoomObj.supervisorName
      : '';
    const activeSupervisorInAtt = (saved?.supervisorName && saved.supervisorName !== 'Guru Pengawas Ruang')
      ? saved.supervisorName
      : '';
    const effectiveActiveSupervisor = activeSupervisorInAtt || activeSupervisorInConfig;

    const teacherClean = (currentTeacherName && currentTeacherName !== 'Guru Pengawas Ruang') ? currentTeacherName.trim().toLowerCase() : '';
    const isTeacherAlreadyActive = Boolean(
      (effectiveActiveSupervisor && teacherClean && (
        effectiveActiveSupervisor.toLowerCase().includes(teacherClean) ||
        teacherClean.includes(effectiveActiveSupervisor.toLowerCase())
      )) ||
      Boolean(saved?.isBapSubmitted)
    );

    setIsCheckedInThisRoom(isTeacherAlreadyActive);
  }, [selectedRoom, selectedExam, roomStudents, currentRoomObj, currentTeacherName]);

  // Live student exam sessions from storage
  const [studentSessions, setStudentSessions] = useState(() => getStoredStudentCbtSessions());

  useEffect(() => {
    const handleUpdate = () => {
      setStudentSessions(getStoredStudentCbtSessions());
    };
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes('cbt')) {
        handleUpdate();
        setPanitiaConfig(getStoredCbtPanitiaConfig());
        setPackages(getStoredCbtPackages());
      }
    };
    window.addEventListener('cbtSessionsUpdated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('cbtSessionsUpdated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);


  // Update student attendance status (dengan auto-save presensi real-time ke storage & auto check-in)
  const handleSetStatus = (studentId: string, status: 'H' | 'S' | 'I' | 'A') => {
    const nextRecords: Record<string, 'H' | 'S' | 'I' | 'A'> = {
      ...attendanceRecords,
      [studentId]: status
    };
    setAttendanceRecords(nextRecords);

    // Persist ke storage secara real-time agar jika guru logout / ganti tab / refresh, data presensi seluruh siswa tetap tersimpan!
    if (selectedExam) {
      const todayStr = new Date().toISOString().split('T')[0];
      const supNameToUse = supervisorNameInput.trim() || currentTeacherName || 'Guru Pengawas Ruang';
      const key = `${selectedRoom}_${selectedExam.id}_${todayStr}`;
      const allAtt = getStoredCbtRoomAttendances();
      const existing = allAtt[key];

      const updatedAtt: CbtRoomAttendance = {
        roomName: selectedRoom,
        examId: selectedExam.id,
        examTitle: selectedExam.title,
        date: todayStr,
        supervisorName: supNameToUse,
        token: selectedExam.token,
        records: nextRecords, // Simpan seluruh status presensi terbaru
        notes: bapNotes || existing?.notes || 'Ujian berlangsung tertib, aman, dan lancar tanpa kendala teknis.',
        isBapSubmitted: Boolean(existing?.isBapSubmitted),
        submittedAt: existing?.submittedAt
      };
      saveStoredCbtRoomAttendance(updatedAtt);
      triggerSaveFeedback();

      // Otomatisasi Cerdas: Jika guru belum check-in tapi sudah mulai absen siswa di ruangan ini, langsung check-in otomatis
      if (!isCheckedInThisRoom && currentTeacherName && currentTeacherName !== 'Guru Pengawas Ruang') {
        checkInRoomSupervisor({
          roomName: selectedRoom,
          supervisorName: supNameToUse,
          examId: selectedExam.id,
          examTitle: selectedExam.title,
          token: selectedExam.token,
          initialRecords: nextRecords
        });
        setIsCheckedInThisRoom(true);
      }
    }
  };

  // Auto-save Catatan Kejadian Khusus (BAP Notes) secara Real-Time
  const handleBapNotesChange = (newNotes: string) => {
    setBapNotes(newNotes);
    if (selectedExam) {
      const todayStr = new Date().toISOString().split('T')[0];
      const supNameToUse = supervisorNameInput.trim() || currentTeacherName || 'Guru Pengawas Ruang';
      const key = `${selectedRoom}_${selectedExam.id}_${todayStr}`;
      const allAtt = getStoredCbtRoomAttendances();
      const existing = allAtt[key];

      const updatedAtt: CbtRoomAttendance = {
        roomName: selectedRoom,
        examId: selectedExam.id,
        examTitle: selectedExam.title,
        date: todayStr,
        supervisorName: supNameToUse,
        token: selectedExam.token,
        records: attendanceRecords,
        notes: newNotes,
        isBapSubmitted: Boolean(existing?.isBapSubmitted),
        submittedAt: existing?.submittedAt
      };
      saveStoredCbtRoomAttendance(updatedAtt);
      triggerSaveFeedback();
    }
  };

  // Save Room BAP and Attendance
  const handleSaveBap = () => {
    if (!selectedExam) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const finalSupervisor = supervisorNameInput.trim() || currentTeacherName || 'Guru Pengawas Ruang';
    const data: CbtRoomAttendance = {
      roomName: selectedRoom,
      examId: selectedExam.id,
      examTitle: selectedExam.title,
      date: todayStr,
      supervisorName: finalSupervisor,
      token: selectedExam.token,
      records: attendanceRecords,
      notes: bapNotes,
      isBapSubmitted: true,
      submittedAt: new Date().toISOString()
    };

    saveStoredCbtRoomAttendance(data);

    // Synchronize supervisor name to room configuration in panitia config
    if (finalSupervisor && finalSupervisor !== 'Guru Pengawas Ruang') {
      const currentConfig = getStoredCbtPanitiaConfig();
      const updatedRooms = currentConfig.rooms.map(r => {
        if (r.name === selectedRoom || r.label === selectedRoom) {
          return { ...r, supervisorName: finalSupervisor };
        }
        return r;
      });
      saveStoredCbtPanitiaConfig({ ...currentConfig, rooms: updatedRooms });
    }

    setIsBapSaved(true);
    triggerSaveFeedback();
    alert(`✓ Berita Acara Pelaksanaan (BAP) dan Presensi ${selectedRoom} Berhasil Diserahkan!\n\nPengawas: ${finalSupervisor}\nMode Terkunci Diaktifkan untuk mencegah klik tidak sengaja.\nData otomatis tersinkronisasi ke Dashboard Panitia.`);
  };

  // Export Room BAP to Excel
  const handleExportBapExcel = () => {
    if (!selectedExam) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const finalSupervisor = supervisorNameInput.trim() || currentTeacherName || 'Guru Pengawas Ruang';
    exportCbtRoomBapToExcel({
      examTitle: selectedExam.title,
      subject: selectedExam.subject,
      roomName: selectedRoom,
      supervisorName: finalSupervisor,
      token: selectedExam.token,
      date: todayStr,
      notes: bapNotes,
      students: roomStudents.map(st => ({
        nisn: st.nisn,
        name: st.name,
        classId: st.classId,
        status: attendanceRecords[st.id] || 'H'
      }))
    });
  };

  // Emergency Student Registration on-the-spot
  const handleRegisterEmergencyStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emName.trim() || !emNisn.trim()) {
      alert('Nama dan NISN wajib diisi.');
      return;
    }

    const newStudent = registerEmergencyStudentToCbt({
      name: emName.trim(),
      nisn: emNisn.trim(),
      classId: emClass,
      gender: emGender
    });

    // Jika ruangan ini memiliki konfigurasi assignedStudentIds khusus, masukkan juga ID siswa baru
    if (currentRoomObj && currentRoomObj.assignedStudentIds && currentRoomObj.assignedStudentIds.length > 0) {
      const updatedRooms = panitiaConfig.rooms.map(r => {
        if (r.id === currentRoomObj.id) {
          const currentIds = r.assignedStudentIds || [];
          if (!currentIds.includes(newStudent.id)) {
            return {
              ...r,
              assignedStudentIds: [...currentIds, newStudent.id]
            };
          }
        }
        return r;
      });
      saveStoredCbtPanitiaConfig({ ...panitiaConfig, rooms: updatedRooms });
    }

    // Mark as Hadir
    setAttendanceRecords(prev => ({
      ...prev,
      [newStudent.id]: 'H'
    }));

    // Reset and close
    setEmName('');
    setEmNisn('');
    setShowEmergencyModal(false);

    alert(`Siswa ${newStudent.name} (NISN: ${newStudent.nisn}) berhasil didaftarkan dan langsung aktif di Ujian CBT serta Master Data Sekolah!`);
  };

  // Counts
  const hadirCount = roomStudents.filter(s => (attendanceRecords[s.id] || 'H') === 'H').length;
  const susulanCount = roomStudents.filter(s => {
    const st = attendanceRecords[s.id];
    return st === 'S' || st === 'I';
  }).length;
  const alpaCount = roomStudents.filter(s => attendanceRecords[s.id] === 'A').length;

  // Jika guru login tidak memiliki jadwal mengawas pada sesi ini, tampilkan notifikasi ramah tanpa akses acak ke ruangan lain
  if (currentTeacherName && currentTeacherName !== 'Guru Pengawas Ruang' && !assignedScheduleEntry) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl mx-auto">
            ☕
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Tidak Ada Jadwal Mengawas di Sesi Ini
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Bapak/Ibu <strong className="text-slate-800">{currentTeacherName}</strong> tidak terdaftar mengawas pada <strong>{currentSlot.name} ({currentSlot.startTime} - {currentSlot.endTime} WIB{currentSlot.subject ? ` • ${currentSlot.subject}` : ''})</strong>.
            </p>
          </div>

          {/* Dynamic Session switcher buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {scheduleSessions.map((slot, idx) => {
              const isSelected = slot.id === currentSlot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => {
                    setActiveSlotId(slot.id);
                    setFilterClassInRoom('all');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black ring-2 ring-amber-500/40'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{idx % 2 === 0 ? '☀️' : '⛅'}</span>
                  <span>{slot.name} ({slot.startTime} - {slot.endTime})</span>
                  {slot.subject && (
                    <span className="text-[10px] font-semibold opacity-75">• {slot.subject}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl text-[11px] text-slate-500 border border-slate-100 text-left space-y-1">
            <div className="font-bold text-slate-700">💡 Informasi Jadwal Panitia:</div>
            <p>
              Penugasan ruangan dikendalikan secara resmi oleh <strong>Posko Panitia CBT</strong>. Jika ada perubahan atau pertukaran jadwal tugas antar guru, silakan hubungi panitia untuk disesuaikan di Posko CBT.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* 1. HEADER PENGAWAS RUANG */}
      <div className="bg-white border border-indigo-100 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-bold flex items-center justify-center text-sm">
                📋
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Mode Pengawas Ruang Ujian CBT
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mt-1">
              <span>Pengawas: <strong className="text-slate-800">{currentTeacherName}</strong></span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Tersinkron Live ke Posko Panitia
              </span>
              {isAssignedByPanitia && (
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md font-bold">
                  Sesuai Plotting Panitia
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Dynamic Session Switcher Pills (Jam 1, Jam 2, Jam 3, dst.) */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {scheduleSessions.map((slot, idx) => {
                const isSelected = slot.id === currentSlot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => {
                      setActiveSlotId(slot.id);
                      setFilterClassInRoom('all');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>{idx % 2 === 0 ? '☀️' : '⛅'}</span>
                    <span>{slot.name} ({slot.startTime} - {slot.endTime})</span>
                    {slot.subject && (
                      <span className="text-[10px] font-semibold opacity-80 hidden sm:inline">• {slot.subject}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowEmergencyModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span>➕ Daftarkan Siswa</span>
            </button>
          </div>
        </div>

        {/* Ruangan Tugas Resmi & Pemilih Paket Ujian */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                1. Ruangan Tugas Pengawas:
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                {currentSlot.name} ({currentSlot.startTime} - {currentSlot.endTime} WIB){currentSlot.subject ? ` • ${currentSlot.subject}` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900">
                  🚪 {assignedScheduleEntry ? assignedScheduleEntry.roomName : selectedRoom}
                </span>
                <span className="text-xs text-slate-500 font-semibold truncate max-w-[200px]" title={currentRoomObj?.label}>
                  ({currentRoomObj?.classes ? `Kelas ${currentRoomObj.classes.join(', ')}` : currentRoomObj?.label})
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Terkunci Otomatis
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              2. Paket Ujian:
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {packages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.status === 'active' ? '🟢 [AKTIF]' : '⏸️ [DIJEDA]'} {pkg.title} ({pkg.subject})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. KARTU TOKEN SESI & STATISTIK RUANGAN */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Token Card (Besar & Jelas untuk Ditulis di Papan Tulis) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md space-y-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
            <span>Token Sesi Ruangan</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${examSchedule.badgeClass}`}>
              {examSchedule.statusLabel}
            </span>
          </div>
          <div className="text-3xl font-mono font-black tracking-widest text-emerald-400 py-1">
            {selectedExam?.token || '---'}
          </div>
          <p className="text-[10px] text-slate-300 leading-tight">
            {examSchedule.scheduleState === 'emergency_paused' ? (
              <span className="text-rose-300 font-bold">⚠️ Ujian sedang dijeda darurat oleh panitia.</span>
            ) : examSchedule.scheduleState === 'upcoming' ? (
              <span className="text-amber-300 font-bold">⏳ Ujian dijadwalkan pukul {selectedExam?.startTime || '07:30'} WIB.</span>
            ) : examSchedule.scheduleState === 'expired' ? (
              <span className="text-slate-400 font-bold">🏁 Batas waktu sesi ({selectedExam?.endTime || '09:00'}) telah berakhir.</span>
            ) : (
              <span>Tuliskan token ini di papan tulis agar siswa dapat memulai ujian ({examSchedule.scheduleText}).</span>
            )}
          </p>
        </div>

        {/* Hadir Mengikuti Ujian */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Hadir di Ruangan
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {hadirCount} <span className="text-xs font-semibold text-slate-500">/ {roomStudents.length} Siswa</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Terverifikasi mengikuti ujian
          </div>
        </div>

        {/* Sakit / Izin (Otomatis Masuk Ujian Susulan) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Ujian Susulan (S / I)
          </div>
          <div className="text-2xl font-black text-amber-600">
            {susulanCount} <span className="text-xs font-semibold text-slate-500">Siswa</span>
          </div>
          <div className="text-[11px] text-amber-700 font-medium">
            Otomatis terdaftar ke Panitia
          </div>
        </div>

        {/* Alpa / Tanpa Keterangan */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Alpa / Tanpa Keterangan
          </div>
          <div className="text-2xl font-black text-rose-600">
            {alpaCount} <span className="text-xs font-semibold text-slate-500">Siswa</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Belum ada konfirmasi
          </div>
        </div>
      </div>

      {/* 3. TABEL DAFTAR HADIR PESERTA & MONITORING PENGERJAAN DI RUANGAN */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-0">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Daftar Hadir & Pengerjaan Peserta: {selectedRoom}
              </h3>
              {lastSavedTime && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-300 flex items-center gap-1.5 ${
                  showSavedPulse
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 scale-105 shadow-xs'
                    : 'bg-slate-200/70 text-slate-700 border-slate-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${showSavedPulse ? 'bg-emerald-500 animate-ping' : 'bg-emerald-600'}`} />
                  <span>💾 Tersimpan otomatis • {lastSavedTime}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Total {roomStudents.length} peserta terdaftar di rombel {roomClasses.join(' & ')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportBapExcel}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Unduh Daftar Hadir & Berita Acara (.xlsx)"
            >
              <span>📥 Export BAP (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Banner Mode Terkunci Pasca Penyerahan BAP */}
        {isBapSaved && (
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border-b border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔒</span>
              <div>
                <div className="font-extrabold text-xs text-emerald-950 flex items-center gap-2">
                  <span>BAP & Presensi Telah Resmi Diserahkan (Mode Terkunci)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                    Terkunci Aman
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Data presensi ruangan telah dikunci untuk mencegah klik tidak sengaja. Klik tombol di samping jika ingin melakukan koreksi.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Buka kunci presensi & BAP Ruang ${selectedRoom}?\n\nGunakan ini jika Anda perlu memperbaiki status kehadiran siswa atau catatan sebelum panitia menutup sesi.`)) {
                  setIsBapSaved(false);
                  if (selectedExam) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const key = `${selectedRoom}_${selectedExam.id}_${todayStr}`;
                    const allAtt = getStoredCbtRoomAttendances();
                    if (allAtt[key]) {
                      allAtt[key] = { ...allAtt[key], isBapSubmitted: false };
                      saveStoredCbtRoomAttendance(allAtt[key]);
                    }
                  }
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 font-extrabold text-xs transition shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95"
            >
              <span>🔓 Buka Kunci untuk Koreksi</span>
            </button>
          </div>
        )}

        {/* Sub-filter kelas campuran jika ruangan memiliki lebih dari 1 kelas */}
        {roomClasses.length > 1 && (
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-600 px-1">Filter Rombel di Ruangan Ini:</span>
            <button
              type="button"
              onClick={() => setFilterClassInRoom('all')}
              className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                filterClassInRoom === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua Peserta ({roomStudents.length})
            </button>
            {roomClasses.map(c => {
              const countInClass = roomStudents.filter(s => s.classId === c).length;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilterClassInRoom(c)}
                  className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    filterClassInRoom === c
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Kelas {c}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    filterClassInRoom === c ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {countInClass}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">No</th>
                <th className="px-3 py-2.5 w-28 font-mono">NISN</th>
                <th className="px-3 py-2.5">Nama Peserta Ujian</th>
                <th className="px-3 py-2.5 w-36 text-center">Status Kehadiran</th>
                <th className="px-3 py-2.5 w-40 text-center">Progres Pengerjaan</th>
                <th className="px-3 py-2.5 w-24 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoomStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Tidak ada siswa terdaftar di ruangan ini.
                  </td>
                </tr>
              ) : (
                filteredRoomStudents.map((st, idx) => {
                  const currentStatus = attendanceRecords[st.id] || 'H';
                  
                  // Check student live CBT session
                  const sessionKey = `${selectedExam?.id}_${st.id}`;
                  let session: CbtStudentAnswerState | undefined = studentSessions[sessionKey];
                  if (!session) {
                    session = Object.values(studentSessions).find(s => s.studentId === st.id);
                  }

                  return (
                    <tr key={st.id} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-2.5 text-center font-mono text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">
                        {st.nisn}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{st.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            st.classId.startsWith('7')
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : st.classId.startsWith('8')
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}>
                            {st.classId}
                          </span>
                        </div>
                        {currentStatus === 'S' && (
                          <span className="mt-1 inline-block text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Ujian Susulan
                          </span>
                        )}
                        {currentStatus === 'I' && (
                          <span className="ml-2 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            Izin
                          </span>
                        )}

                        {/* Anti-Human-Error: Peringatan Kontradiksi Alpa padahal siswa aktif/selesai CBT */}
                        {currentStatus === 'A' && Boolean(session) && (
                          <div className="mt-1.5 p-1.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 text-[10px] font-extrabold">
                              <span>⚠️</span>
                              <span>Ditandai Alpa, tapi {session?.isSubmitted ? 'sudah selesai CBT' : 'sedang aktif CBT'}!</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSetStatus(st.id, 'H')}
                              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
                              title="Klik untuk otomatis ubah ke Hadir (H)"
                            >
                              Ubah ke Hadir
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Selector Presensi: H, S, I, A */}
                      <td className="px-3 py-2.5 text-center">
                        <div className={`inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px] font-bold ${
                          isBapSaved ? 'opacity-80' : ''
                        }`}>
                          {(['H', 'S', 'I', 'A'] as const).map(code => (
                            <button
                              key={code}
                              type="button"
                              onClick={() => {
                                if (isBapSaved) {
                                  alert('⚠️ Presensi ruangan ini dalam Mode Terkunci karena BAP sudah diserahkan.\n\nKlik tombol "🔓 Buka Kunci untuk Koreksi" di bagian atas tabel jika Anda ingin mengubah status siswa.');
                                  return;
                                }
                                handleSetStatus(st.id, code);
                              }}
                              className={`px-2 py-0.5 rounded transition ${
                                isBapSaved ? 'cursor-not-allowed' : 'cursor-pointer'
                              } ${
                                currentStatus === code
                                  ? code === 'H' ? 'bg-emerald-600 text-white' :
                                    code === 'S' ? 'bg-blue-600 text-white' :
                                    code === 'I' ? 'bg-amber-600 text-white' :
                                    'bg-rose-600 text-white'
                                  : 'text-slate-500 hover:text-slate-900'
                              }`}
                              title={isBapSaved ? 'Terkunci (Buka kunci terlebih dahulu untuk mengedit)' : undefined}
                            >
                              {code}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Live Status CBT */}
                      <td className="px-3 py-2.5 text-center">
                        {session?.isSubmitted ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ Selesai ({session.score}/100)
                          </span>
                        ) : session?.violationCount && session.violationCount >= 1 ? (
                          <div className="space-y-0.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white animate-pulse shadow-xs">
                              🔒 TERKUNCI ({session.violationCount}x Keluar)
                            </span>
                            <div className="text-[9px] text-rose-600 font-semibold">
                              Pelanggaran Integritas
                            </div>
                          </div>
                        ) : session ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
                            Sedang Mengerjakan
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Belum Memulai
                          </span>
                        )}
                      </td>

                      {/* Action: Remote Unlock & Reset */}
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {session?.violationCount && session.violationCount >= 1 ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (!selectedExam || !session) return;
                                saveStoredStudentCbtSession({
                                  ...session,
                                  violationCount: 0
                                });
                                triggerSaveFeedback();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                              title={`Buka kunci ujian untuk ${st.name} (Pelanggaran ke-${session.violationCount})`}
                            >
                              <span>🔓</span>
                              <span>Buka Kunci</span>
                            </button>
                          ) : null}

                          {session ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Reset sesi ujian CBT untuk ${st.name}? Siswa akan dapat login dan memulai ulang pengerjaan ujian.`)) {
                                  const targetExamId = session?.examId || selectedExam?.id || '';
                                  resetStoredStudentCbtSession(targetExamId, st.id);
                                  resetStoredStudentCbtSession(targetExamId, st.nisn);
                                  if (selectedExam?.id && selectedExam.id !== targetExamId) {
                                    resetStoredStudentCbtSession(selectedExam.id, st.id);
                                    resetStoredStudentCbtSession(selectedExam.id, st.nisn);
                                  }
                                  setStudentSessions(getStoredStudentCbtSessions());
                                  alert(`✅ Sesi ujian untuk ${st.name} berhasil di-reset!\n\nSiswa sekarang dapat membuka kembali ruang ujian CBT dari berandanya.`);
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                              title="Reset sesi ujian siswa jika terjadi kendala teknis"
                            >
                              <span>🔄</span>
                              <span>Reset</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 font-mono text-xs">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. FORM BERITA ACARA PELAKSANAAN (BAP) DIGITAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>📝 Berita Acara Pelaksanaan Ujian (BAP) & Presensi Ruangan</span>
            {isBapSaved && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ Telah Diserahkan ke Panitia
              </span>
            )}
          </h3>
          <span className="text-[11px] font-medium text-slate-500">
            Ruangan: <strong className="text-indigo-600">{selectedRoom}</strong>
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-700">
                👤 Nama Pengawas Ruang:
              </label>
              {currentTeacherName && currentTeacherName !== 'Guru Pengawas Ruang' && supervisorNameInput !== currentTeacherName && (
                <button
                  type="button"
                  onClick={() => setSupervisorNameInput(currentTeacherName)}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                  title="Klik untuk menggunakan nama akun Anda yang sedang login"
                >
                  Gunakan Akun Saya ({currentTeacherName.split(' ')[0]})
                </button>
              )}
            </div>
            <input
              type="text"
              value={supervisorNameInput}
              onChange={(e) => setSupervisorNameInput(e.target.value)}
              placeholder="Contoh: Dra. Hj. Siti Rohmah, M.Pd."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Nama ini otomatis tampil di Dashboard Panitia & Rekap BAP Sekolah
            </span>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              📋 Catatan Pengawas Ruang (Kejadian Khusus / Situasi Ruang):
            </label>
            <input
              type="text"
              value={bapNotes}
              onChange={(e) => handleBapNotesChange(e.target.value)}
              placeholder="Contoh: Ujian berlangsung tertib, aman, dan lancar tanpa kendala teknis..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Catatan otomatis tersimpan real-time saat Anda mengetik
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
            <span>Penandatangan:</span>
            <strong className="text-slate-800">
              {supervisorNameInput.trim() || currentTeacherName || 'Guru Pengawas Ruang'}
            </strong>
            <span className="text-slate-400">• Pengawas Ruang Ujian</span>
          </div>

          <div className="flex items-center gap-2">
            {isBapSaved ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                  <span>✓</span>
                  <span>BAP Resmi Diserahkan (Terkunci)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsBapSaved(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                >
                  <span>🔓 Buka Kunci</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSaveBap}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <span>Kirim Berita Acara & Presensi ke Panitia</span>
                <span>✓</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. MODAL PENDAFTARAN SISWA DARURAT DI RUANGAN */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-amber-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">➕</span>
                <h3 className="text-base font-bold text-slate-900">
                  Daftarkan Siswa di Ruangan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Gunakan fitur ini jika ada siswa yang belum terdaftar di sistem. Data yang disimpan otomatis terhubung ke Master Siswa Sekolah dan siswa bisa langsung login detik ini juga.
            </p>

            <form onSubmit={handleRegisterEmergencyStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Siswa:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian Hidayat"
                  value={emName}
                  onChange={(e) => setEmName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  NISN (10 Digit):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 0098765432"
                  value={emNisn}
                  onChange={(e) => setEmNisn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kelas / Rombel:
                  </label>
                  <select
                    value={emClass}
                    onChange={(e) => setEmClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    {['7-A', '7-B', '7-C', '7-D', '7-E', '7-F', '8-A', '8-B', '8-C', '8-D', '8-E', '8-F', '9-A', '9-B', '9-C', '9-D', '9-E'].map(c => (
                      <option key={c} value={c}>Kelas {c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Kelamin:
                  </label>
                  <select
                    value={emGender}
                    onChange={(e) => setEmGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Daftarkan & Berikan Akses Ujian →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
