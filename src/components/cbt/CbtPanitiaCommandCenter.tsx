'use client';

import React, { useState, useEffect, useMemo, useDeferredValue, useRef, startTransition } from 'react';
import {
  CbtExamPackage,
  CbtExamRoomConfig,
  CbtPanitiaConfig,
  CbtRoomAttendance,
  CbtStudentAnswerState,
  getStoredCbtPanitiaConfig,
  saveStoredCbtPanitiaConfig,
  getStoredCbtPackages,
  saveStoredCbtPackages,
  getStoredStudentCbtSessions,
  resetStoredStudentCbtSession,
  getStoredCbtRoomAttendances,
  getStudentsForRoom,
  updateRoomMetadata,
  splitTwoClassesAcrossTwoRooms,
  getDefaultSchoolRooms,
  registerEmergencyStudentToCbt
} from '@/lib/cbtData';
import { Student, SCHOOL_CLASSES } from '@/lib/elearningData';
import { exportCbtSchoolRekapBapToExcel, exportCbtRoomBapToExcel } from '@/lib/elearningExport';

interface FastSearchInputProps {
  value: string;
  onSearchChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  icon?: string;
}

// Dedicated Lag-Free Search Input Component
// State lives locally to eliminate input lag and prevent parent re-renders on keystroke
const FastSearchInput = React.memo(function FastSearchInput({
  value,
  onSearchChange,
  placeholder,
  className,
  icon = '🔍'
}: FastSearchInputProps) {
  const [localVal, setLocalVal] = useState(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocalVal(next); // 0ms instant local response
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearchChange(next);
    }, 120);
  };

  const handleClear = () => {
    setLocalVal('');
    if (timerRef.current) clearTimeout(timerRef.current);
    onSearchChange('');
  };

  return (
    <div className="relative w-full">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
          {icon}
        </span>
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={localVal}
        onChange={handleChange}
        className={className}
      />
      {localVal && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-100"
          title="Hapus pencarian"
        >
          ✕
        </button>
      )}
    </div>
  );
});

interface CbtPanitiaCommandCenterProps {
  activeStudents: Student[];
  onOpenRoomView?: (roomLabel: string) => void;
}

export default function CbtPanitiaCommandCenter({
  activeStudents,
  onOpenRoomView
}: CbtPanitiaCommandCenterProps) {
  // Panitia Config State (17 Official Pure Rooms + 2 Labs)
  const [config, setConfig] = useState<CbtPanitiaConfig>(() => getStoredCbtPanitiaConfig());

  // Packages & Sessions
  const [packages, setPackages] = useState<CbtExamPackage[]>([]);
  const [studentSessions, setStudentSessions] = useState(() => getStoredStudentCbtSessions());
  const [roomAttendances, setRoomAttendances] = useState(() => getStoredCbtRoomAttendances());

  // Active Tab: 'monitoring' | 'arrangement' | 'search' | 'bap'
  const [activeTab, setActiveTab] = useState<'monitoring' | 'arrangement' | 'search' | 'bap'>('monitoring');

  // Room Custom Edit Modal State (Edit Pengawas, Nama, Kapasitas & Kelas manual)
  const [editingRoom, setEditingRoom] = useState<CbtExamRoomConfig | null>(null);
  const [editRoomClasses, setEditRoomClasses] = useState<string[]>([]);
  const [editRoomSupervisor, setEditRoomSupervisor] = useState<string>('');
  const [editRoomName, setEditRoomName] = useState<string>('');
  const [editRoomCapacity, setEditRoomCapacity] = useState<number>(36);

  // Add Room Modal State (Tambah Ruangan Baru)
  const [showAddRoomModal, setShowAddRoomModal] = useState<boolean>(false);
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [newRoomCapacity, setNewRoomCapacity] = useState<number>(36);
  const [newRoomSupervisor, setNewRoomSupervisor] = useState<string>('Guru Pengawas');
  const [newRoomClasses, setNewRoomClasses] = useState<string[]>([]);

  // Student Search / Emergency Reset State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'all' | '7' | '8' | '9'>('all');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'in_progress' | 'submitted' | 'has_session' | 'no_session'>('all');
  const [searchPage, setSearchPage] = useState<number>(1);
  const [searchPageSize, setSearchPageSize] = useState<number>(25);
  const [resetModalStudent, setResetModalStudent] = useState<Student | null>(null);
  const [previewMonitoringRoom, setPreviewMonitoringRoom] = useState<CbtExamRoomConfig | null>(null);
  const [previewBapRoom, setPreviewBapRoom] = useState<CbtExamRoomConfig | null>(null);
  const [showRekapPrintModal, setShowRekapPrintModal] = useState<boolean>(false);

  // ==========================================
  // ROOM ARRANGEMENT STATE (Penyusunan Ruangan)
  // ==========================================
  const [selectedArrangementRoomId, setSelectedArrangementRoomId] = useState<string>('ruang-01');

  // Split 50:50 Modal State
  const [showSplitModal, setShowSplitModal] = useState<boolean>(false);
  const [splitClassA, setSplitClassA] = useState<string>('7-A');
  const [splitClassB, setSplitClassB] = useState<string>('8-A');
  const [splitRoomAId, setSplitRoomAId] = useState<string>('ruang-01');
  const [splitRoomBId, setSplitRoomBId] = useState<string>('ruang-02');

  // Emergency Student Modal State (Daftarkan Siswa Darurat ke CBT & Master Sekolah)
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [emName, setEmName] = useState<string>('');
  const [emNisn, setEmNisn] = useState<string>('');
  const [emClass, setEmClass] = useState<string>('7-A');
  const [emGender, setEmGender] = useState<'L' | 'P'>('L');
  const [emTargetRoomId, setEmTargetRoomId] = useState<string>('ruang-01');

  // Student Picker inside Room Arrangement:
  const [pickerClassFilter, setPickerClassFilter] = useState<string>('7-A');
  const [pickerSearchQuery, setPickerSearchQuery] = useState<string>('');
  const [pickerStatusFilter, setPickerStatusFilter] = useState<'all' | 'unassigned' | 'other_room'>('all');
  const [selectedStudentIdsToAdd, setSelectedStudentIdsToAdd] = useState<string[]>([]);
  const [selectedStudentIdsToRemove, setSelectedStudentIdsToRemove] = useState<string[]>([]);
  const [roomStudentSearch, setRoomStudentSearch] = useState<string>('');

  // Toast / Notification
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showAlert = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 3500);
  };

  // Sync data on mount and updates
  useEffect(() => {
    setPackages(getStoredCbtPackages());
    setConfig(getStoredCbtPanitiaConfig());
    setStudentSessions(getStoredStudentCbtSessions());
    setRoomAttendances(getStoredCbtRoomAttendances());

    const handlePkgs = () => setPackages(getStoredCbtPackages());
    const handleSessions = () => setStudentSessions(getStoredStudentCbtSessions());
    const handleConfig = () => setConfig(getStoredCbtPanitiaConfig());
    const handleAttendances = () => setRoomAttendances(getStoredCbtRoomAttendances());

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes('cbt')) {
        handlePkgs();
        handleSessions();
        handleConfig();
        handleAttendances();
      }
    };

    window.addEventListener('cbtPackagesUpdated', handlePkgs);
    window.addEventListener('cbtSessionsUpdated', handleSessions);
    window.addEventListener('cbtPanitiaConfigUpdated', handleConfig);
    window.addEventListener('cbtRoomAttendancesUpdated', handleAttendances);
    window.addEventListener('cbtAttendanceUpdated', handleAttendances);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('cbtPackagesUpdated', handlePkgs);
      window.removeEventListener('cbtSessionsUpdated', handleSessions);
      window.removeEventListener('cbtPanitiaConfigUpdated', handleConfig);
      window.removeEventListener('cbtRoomAttendancesUpdated', handleAttendances);
      window.removeEventListener('cbtAttendanceUpdated', handleAttendances);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Open Add Room Modal with auto next room number
  const handleOpenAddRoomModal = () => {
    let nextNum = config.rooms.length + 1;
    const roomNumbers = config.rooms
      .map(r => {
        const match = r.name.match(/Ruang\s*(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => n > 0);

    if (roomNumbers.length > 0) {
      nextNum = Math.max(...roomNumbers) + 1;
    }

    setNewRoomName(`Ruang ${String(nextNum).padStart(2, '0')}`);
    setNewRoomCapacity(36);
    setNewRoomSupervisor('Guru Pengawas');
    setNewRoomClasses([]);
    setShowAddRoomModal(true);
  };

  // Submit Add New Room
  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newRoomName.trim();
    if (!trimmedName) {
      alert('Nama ruangan tidak boleh kosong!');
      return;
    }

    if (config.rooms.some(r => r.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert(`Ruangan dengan nama "${trimmedName}" sudah ada! Gunakan nama yang berbeda.`);
      return;
    }

    const roomId = `ruang-${Date.now().toString(36)}`;
    const labelSuffix = newRoomClasses.length > 0
      ? `Kelas ${newRoomClasses.join(' & ')}`
      : 'Kosong / Kustom';

    const newRoom: CbtExamRoomConfig = {
      id: roomId,
      name: trimmedName,
      classes: newRoomClasses,
      capacity: newRoomCapacity > 0 ? newRoomCapacity : 36,
      label: `${trimmedName} (${labelSuffix})`,
      supervisorName: newRoomSupervisor.trim() || 'Guru Pengawas',
      assignedStudentIds: []
    };

    const updatedRooms = [...config.rooms, newRoom];
    const updatedConfig: CbtPanitiaConfig = {
      ...config,
      rooms: updatedRooms
    };

    saveStoredCbtPanitiaConfig(updatedConfig);
    setConfig(updatedConfig);
    setSelectedArrangementRoomId(roomId);
    setShowAddRoomModal(false);
    showAlert(`🎉 Ruangan "${trimmedName}" berhasil ditambahkan! Silakan atur siswa.`);
  };

  // Emergency Student Registration (Terkoneksi langsung ke Master Siswa & Ruang Ujian CBT)
  const handleRegisterEmergencyStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = emName.trim();
    const trimmedNisn = emNisn.trim();
    if (!trimmedName || !trimmedNisn) {
      alert('Nama dan NISN wajib diisi.');
      return;
    }

    const newStudent = registerEmergencyStudentToCbt({
      name: trimmedName,
      nisn: trimmedNisn,
      classId: emClass,
      gender: emGender
    });

    const targetRoom = config.rooms.find(r => r.id === emTargetRoomId) || config.rooms[0];
    if (targetRoom) {
      const updatedRooms = config.rooms.map(r => {
        if (r.id === targetRoom.id) {
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
      const updatedConfig = { ...config, rooms: updatedRooms };
      saveStoredCbtPanitiaConfig(updatedConfig);
      setConfig(updatedConfig);
    }

    setEmName('');
    setEmNisn('');
    setShowEmergencyModal(false);
    showAlert(`🎉 Siswa "${newStudent.name}" (NISN: ${newStudent.nisn}) berhasil didaftarkan dan langsung masuk ke ${targetRoom?.name || 'Ruang Ujian'} serta Master Data Sekolah!`);
  };

  // Delete Room Handler
  const handleDeleteRoom = (roomId: string) => {
    const targetRoom = config.rooms.find(r => r.id === roomId);
    if (!targetRoom) return;

    if (config.rooms.length <= 1) {
      alert('Minimal harus ada 1 ruangan ujian aktif.');
      return;
    }

    if (!confirm(`Hapus ruangan "${targetRoom.name}"? Siswa di dalamnya akan kembali ke penempatan berbasis rombel atau belum ditempatkan.`)) {
      return;
    }

    const updatedRooms = config.rooms.filter(r => r.id !== roomId);
    const updatedConfig: CbtPanitiaConfig = {
      ...config,
      rooms: updatedRooms
    };

    saveStoredCbtPanitiaConfig(updatedConfig);
    setConfig(updatedConfig);

    if (selectedArrangementRoomId === roomId) {
      setSelectedArrangementRoomId(updatedRooms[0]?.id || '');
    }
    if (editingRoom?.id === roomId) {
      setEditingRoom(null);
    }

    showAlert(`🗑️ Ruangan "${targetRoom.name}" berhasil dihapus.`);
  };

  // Open Edit Modal for a Room (Ganti Pengawas, Nama, Kapasitas, Rombel)
  const handleOpenEditRoom = (room: CbtExamRoomConfig) => {
    setEditingRoom(room);
    setEditRoomName(room.name);
    setEditRoomCapacity(room.capacity || 36);
    setEditRoomClasses([...room.classes]);
    setEditRoomSupervisor(room.supervisorName || 'Guru Pengawas');
  };

  // Save Room Custom Edit
  const handleSaveRoomEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    const trimmedName = editRoomName.trim() || editingRoom.name;
    const capacityVal = Number(editRoomCapacity) > 0 ? Number(editRoomCapacity) : editingRoom.capacity;

    if (config.rooms.some(r => r.id !== editingRoom.id && r.name.toLowerCase().trim() === trimmedName.toLowerCase().trim())) {
      alert(`Ruangan dengan nama "${trimmedName}" sudah ada! Silakan gunakan nama lain.`);
      return;
    }

    const updatedRooms = config.rooms.map(r => {
      if (r.id === editingRoom.id) {
        const labelSuffix = editRoomClasses.length > 0 ? editRoomClasses.join(' & ') : 'Kosong / Kustom';
        return {
          ...r,
          name: trimmedName,
          capacity: capacityVal,
          classes: editRoomClasses,
          supervisorName: editRoomSupervisor.trim() || 'Guru Pengawas',
          label: `${trimmedName} (${labelSuffix})`
        };
      }
      return r;
    });

    const updatedConfig: CbtPanitiaConfig = {
      ...config,
      rooms: updatedRooms
    };

    saveStoredCbtPanitiaConfig(updatedConfig);
    setConfig(updatedConfig);
    setEditingRoom(null);
    showAlert(`Pengaturan ${trimmedName} berhasil diperbarui!`);
  };

  // Toggle All Exam Packages Status (Master Start / Pause)
  const handleToggleAllPackages = (newStatus: 'active' | 'draft') => {
    const updated = packages.map(p => ({ ...p, status: newStatus }));
    saveStoredCbtPackages(updated);
    setPackages(updated);
    showAlert(
      newStatus === 'active'
        ? '▶️ Seluruh paket ujian CBT berhasil DIAKTIFKAN serentak!'
        : '⏸️ Seluruh paket ujian CBT berhasil DIJEDA (Draft) serentak!'
    );
  };

  // ==========================================
  // HIGH-PERFORMANCE REACTIVE INDEXING (O(1))
  // ==========================================

  // Deferred values for butter-smooth 60fps typing without freezing the main thread
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredPickerSearchQuery = useDeferredValue(pickerSearchQuery);
  const deferredRoomStudentSearch = useDeferredValue(roomStudentSearch);

  // Inverted Map of studentId -> CbtStudentAnswerState[] (O(1) instant lookup)
  const sessionsByStudentId = useMemo(() => {
    const map = new Map<string, CbtStudentAnswerState[]>();
    const sessionList = Object.values(studentSessions);
    for (let i = 0; i < sessionList.length; i++) {
      const s = sessionList[i];
      let arr = map.get(s.studentId);
      if (!arr) {
        arr = [];
        map.set(s.studentId, arr);
      }
      arr.push(s);
    }
    return map;
  }, [studentSessions]);

  // Pre-computed Map of roomId -> Student[] (O(1) instant lookup)
  const roomStudentsMap = useMemo(() => {
    const map = new Map<string, Student[]>();
    for (let i = 0; i < config.rooms.length; i++) {
      const room = config.rooms[i];
      map.set(room.id, getStudentsForRoom(room, activeStudents));
    }
    return map;
  }, [config.rooms, activeStudents]);

  // Pre-computed room statistics for Monitoring Tab (O(1) instant lookup)
  const roomStatusStatsMap = useMemo(() => {
    const map = new Map<string, { submitted: number; inProgress: number; notStarted: number; total: number }>();
    for (let i = 0; i < config.rooms.length; i++) {
      const room = config.rooms[i];
      const students = roomStudentsMap.get(room.id) || [];
      let submitted = 0;
      let inProgress = 0;
      let notStarted = 0;

      for (let j = 0; j < students.length; j++) {
        const sessList = sessionsByStudentId.get(students[j].id);
        if (!sessList || sessList.length === 0) {
          notStarted++;
        } else if (sessList.some(s => s.isSubmitted)) {
          submitted++;
        } else {
          inProgress++;
        }
      }
      map.set(room.id, { submitted, inProgress, notStarted, total: students.length });
    }
    return map;
  }, [config.rooms, roomStudentsMap, sessionsByStudentId]);

  // Pre-computed class student counts for dropdown options (O(1) instant lookup)
  const classCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < activeStudents.length; i++) {
      const cId = activeStudents[i].classId;
      map.set(cId, (map.get(cId) || 0) + 1);
    }
    return map;
  }, [activeStudents]);

  // Macro Statistics (Header KPI)
  const macroStats = useMemo(() => {
    const totalStudents = activeStudents.length;
    let submittedCount = 0;
    let inProgressCount = 0;
    let totalViolations = 0;

    const sessionList = Object.values(studentSessions);
    for (let i = 0; i < sessionList.length; i++) {
      const sess = sessionList[i];
      if (sess.isSubmitted) submittedCount++;
      else inProgressCount++;
      if (sess.violationCount) totalViolations += sess.violationCount;
    }

    const activePackagesCount = packages.filter(p => p.status === 'active').length;

    return {
      totalStudents,
      submittedCount,
      inProgressCount,
      totalViolations,
      activePackagesCount,
      totalPackages: packages.length
    };
  }, [activeStudents, studentSessions, packages]);

  // Fast Single-Pass Map of studentId -> RoomConfig (O(N) instead of O(N*M))
  const studentRoomMap = useMemo(() => {
    const map = new Map<string, CbtExamRoomConfig>();
    
    // 1. Assign students based on class match first
    const classToRoomMap = new Map<string, CbtExamRoomConfig>();
    for (let i = 0; i < config.rooms.length; i++) {
      const r = config.rooms[i];
      if (!r.assignedStudentIds || r.assignedStudentIds.length === 0) {
        for (let j = 0; j < r.classes.length; j++) {
          classToRoomMap.set(r.classes[j], r);
        }
      }
    }
    for (let i = 0; i < activeStudents.length; i++) {
      const st = activeStudents[i];
      const r = classToRoomMap.get(st.classId);
      if (r) map.set(st.id, r);
    }

    // 2. Explicit assignedStudentIds override class default
    for (let i = 0; i < config.rooms.length; i++) {
      const r = config.rooms[i];
      if (r.assignedStudentIds && r.assignedStudentIds.length > 0) {
        for (let k = 0; k < r.assignedStudentIds.length; k++) {
          map.set(r.assignedStudentIds[k], r);
        }
      }
    }
    return map;
  }, [activeStudents, config.rooms]);

  // Map of examId -> CbtExamPackage (O(1) instant lookup)
  const packagesMap = useMemo(() => {
    return new Map<string, CbtExamPackage>(packages.map(p => [p.id, p]));
  }, [packages]);

  // Pre-indexed attendances by roomName (O(1) instant lookup)
  const attendancesByRoomMap = useMemo(() => {
    const map = new Map<string, CbtRoomAttendance[]>();
    const list = Object.values(roomAttendances);
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.roomName) {
        let arr = map.get(a.roomName);
        if (!arr) {
          arr = [];
          map.set(a.roomName, arr);
        }
        arr.push(a);
      }
    }
    return map;
  }, [roomAttendances]);

  // Pre-computed room unique classes and mixed status (O(1) instant lookup)
  const roomUniqueClassesMap = useMemo(() => {
    const map = new Map<string, { uniqueClasses: string[]; isMixed: boolean }>();
    for (let i = 0; i < config.rooms.length; i++) {
      const room = config.rooms[i];
      const students = roomStudentsMap.get(room.id) || [];
      const unique = Array.from(new Set(students.map(s => s.classId))).sort();
      map.set(room.id, { uniqueClasses: unique, isMixed: unique.length > 1 });
    }
    return map;
  }, [config.rooms, roomStudentsMap]);

  // Fast Set lookups for student picker selection
  const selectedStudentIdsToAddSet = useMemo(() => {
    return new Set(selectedStudentIdsToAdd);
  }, [selectedStudentIdsToAdd]);

  const selectedStudentIdsToRemoveSet = useMemo(() => {
    return new Set(selectedStudentIdsToRemove);
  }, [selectedStudentIdsToRemove]);

  // Batched Filter & Tab Handlers (prevents cascading re-renders)
  const handleTabSwitch = (tab: 'monitoring' | 'arrangement' | 'search' | 'bap') => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  const handleSearchQueryChange = (q: string) => {
    setSearchQuery(q);
    setSearchPage(1);
  };

  const handleGradeFilterChange = (grade: 'all' | '7' | '8' | '9') => {
    setSelectedGradeFilter(grade);
    setSearchPage(1);
  };

  const handleRoomFilterChange = (roomId: string) => {
    setSelectedRoomFilter(roomId);
    setSearchPage(1);
  };

  const handleStatusFilterChange = (status: 'all' | 'in_progress' | 'submitted' | 'has_session' | 'no_session') => {
    setSelectedStatusFilter(status);
    setSearchPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGradeFilter('all');
    setSelectedRoomFilter('all');
    setSelectedStatusFilter('all');
    setSearchPage(1);
  };

  const handleExportSchoolBapExcel = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const roomRows = config.rooms.map((room, idx) => {
      const attendances = attendancesByRoomMap.get(room.name) || [];
      const latestAttendance = attendances[0];
      const isSubmitted = attendances.some(a => a.isBapSubmitted);
      const roomStudents = roomStudentsMap.get(room.id) || [];
      const uniqueClasses = Array.from(new Set(roomStudents.map(s => s.classId))).sort();

      let presentCount = 0;
      let sickCount = 0;
      let permitCount = 0;
      let absentCount = 0;

      if (latestAttendance && latestAttendance.records) {
        Object.values(latestAttendance.records).forEach(status => {
          if (status === 'H') presentCount++;
          else if (status === 'S') sickCount++;
          else if (status === 'I') permitCount++;
          else if (status === 'A') absentCount++;
        });
      } else {
        presentCount = roomStudents.length;
      }

      return {
        no: idx + 1,
        roomName: room.name,
        classes: uniqueClasses.length > 0 ? uniqueClasses.join(', ') : room.classes.join(', '),
        supervisor: room.supervisorName || 'Guru Pengawas',
        total: roomStudents.length,
        present: presentCount,
        sick: sickCount,
        permit: permitCount,
        absent: absentCount,
        isSubmitted,
        notes: latestAttendance?.notes || '-'
      };
    });

    exportCbtSchoolRekapBapToExcel({
      academicYear: config.academicYear || '2026/2027',
      semester: config.semester || 'PTS / STS Ganjil',
      date: todayStr,
      rooms: roomRows
    });
  };

  const handleExportSingleRoomBap = (targetRoom: CbtExamRoomConfig) => {
    const attendances = attendancesByRoomMap.get(targetRoom.name) || [];
    const latestAttendance = attendances[0];
    const roomStudents = roomStudentsMap.get(targetRoom.id) || [];
    const todayStr = new Date().toISOString().split('T')[0];
    const activeExam = packages[0] || {
      id: 'exam-cbt',
      title: 'Asesmen Sumatif Tengah Semester (STS)',
      subject: 'Asesmen Berbasis Komputer (CBT)',
      token: 'SPENTIC'
    };

    exportCbtRoomBapToExcel({
      examTitle: latestAttendance?.examTitle || activeExam.title,
      subject: activeExam.subject || 'Asesmen CBT',
      roomName: targetRoom.name,
      supervisorName: targetRoom.supervisorName || 'Guru Pengawas Ruang',
      token: latestAttendance?.token || activeExam.token || 'SPENTIC',
      date: latestAttendance?.date || todayStr,
      notes: latestAttendance?.notes,
      students: roomStudents.map(st => ({
        nisn: st.nisn,
        name: st.name,
        classId: st.classId,
        status: (latestAttendance?.records?.[st.id] as any) || 'H'
      }))
    });
  };

  // Search Tab KPI Stats (O(1) lookups per student)
  const searchKpiStats = useMemo(() => {
    const total = activeStudents.length;
    let inProgress = 0;
    let submitted = 0;
    let hasSession = 0;

    for (let i = 0; i < activeStudents.length; i++) {
      const sessList = sessionsByStudentId.get(activeStudents[i].id);
      if (sessList && sessList.length > 0) {
        hasSession++;
        if (sessList.some(s => !s.isSubmitted)) {
          inProgress++;
        } else if (sessList.some(s => s.isSubmitted)) {
          submitted++;
        }
      }
    }

    return {
      total,
      inProgress,
      submitted,
      hasSession,
      noSession: Math.max(0, total - hasSession)
    };
  }, [activeStudents, sessionsByStudentId]);

  // Filtered Students for Emergency Reset Search (Only computed when activeTab === 'search')
  const filteredStudents = useMemo(() => {
    if (activeTab !== 'search') return [];
    const query = deferredSearchQuery.trim().toLowerCase();

    return activeStudents.filter(st => {
      const assignedRoom = studentRoomMap.get(st.id);
      const roomName = assignedRoom ? assignedRoom.name.toLowerCase() : '';

      const matchQuery = !query ||
        st.name.toLowerCase().includes(query) ||
        st.nisn.includes(query) ||
        st.classId.toLowerCase().includes(query) ||
        roomName.includes(query);

      if (!matchQuery) return false;

      const matchGrade =
        selectedGradeFilter === 'all' ||
        st.classId.startsWith(selectedGradeFilter);

      if (!matchGrade) return false;

      const matchRoom =
        selectedRoomFilter === 'all' ||
        assignedRoom?.id === selectedRoomFilter ||
        assignedRoom?.name.toLowerCase() === selectedRoomFilter.toLowerCase();

      if (!matchRoom) return false;

      // Student sessions via O(1) Map lookup
      const sessions = sessionsByStudentId.get(st.id) || [];
      const hasSession = sessions.length > 0;

      if (selectedStatusFilter === 'in_progress') {
        return sessions.some(s => !s.isSubmitted);
      } else if (selectedStatusFilter === 'submitted') {
        return sessions.some(s => s.isSubmitted);
      } else if (selectedStatusFilter === 'has_session') {
        return hasSession;
      } else if (selectedStatusFilter === 'no_session') {
        return !hasSession;
      }

      return true;
    });
  }, [activeTab, activeStudents, deferredSearchQuery, selectedGradeFilter, selectedRoomFilter, selectedStatusFilter, studentRoomMap, sessionsByStudentId]);

  const totalSearchPages = Math.max(1, Math.ceil(filteredStudents.length / (searchPageSize === 9999 ? filteredStudents.length || 1 : searchPageSize)));
  const paginatedStudents = useMemo(() => {
    if (searchPageSize === 9999) return filteredStudents;
    const start = (searchPage - 1) * searchPageSize;
    return filteredStudents.slice(start, start + searchPageSize);
  }, [filteredStudents, searchPage, searchPageSize]);

  // Count unassigned students
  const unassignedStudentsCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < activeStudents.length; i++) {
      if (!studentRoomMap.has(activeStudents[i].id)) count++;
    }
    return count;
  }, [activeStudents, studentRoomMap]);

  // Currently selected room in arrangement tab
  const currentArrangementRoom = useMemo(() => {
    return config.rooms.find(r => r.id === selectedArrangementRoomId) || config.rooms[0];
  }, [config.rooms, selectedArrangementRoomId]);

  // Students currently in selected room (O(1) lookup)
  const currentRoomStudents = useMemo(() => {
    return currentArrangementRoom ? (roomStudentsMap.get(currentArrangementRoom.id) || []) : [];
  }, [currentArrangementRoom, roomStudentsMap]);

  // Search filter within current room
  const filteredCurrentRoomStudents = useMemo(() => {
    if (activeTab !== 'arrangement') return [];
    const q = deferredRoomStudentSearch.trim().toLowerCase();
    if (!q) return currentRoomStudents;
    return currentRoomStudents.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.nisn.includes(q) ||
      s.classId.toLowerCase().includes(q)
    );
  }, [activeTab, currentRoomStudents, deferredRoomStudentSearch]);

  // Candidate students for the picker (Only computed when activeTab === 'arrangement')
  const pickerCandidates = useMemo(() => {
    if (activeTab !== 'arrangement') return [];
    const q = deferredPickerSearchQuery.trim().toLowerCase();
    return activeStudents.filter(s => {
      // Class filter
      const matchClass = pickerClassFilter === 'all' || s.classId === pickerClassFilter;
      if (!matchClass) return false;

      // Search query
      const matchQuery = !q ||
        s.name.toLowerCase().includes(q) ||
        s.nisn.includes(q) ||
        s.classId.toLowerCase().includes(q);
      if (!matchQuery) return false;

      // Status filter
      const currentRoom = studentRoomMap.get(s.id);
      if (pickerStatusFilter === 'unassigned') {
        return !currentRoom;
      }
      if (pickerStatusFilter === 'other_room') {
        return currentRoom && currentRoom.id !== currentArrangementRoom?.id;
      }

      return true;
    });
  }, [activeTab, activeStudents, pickerClassFilter, deferredPickerSearchQuery, pickerStatusFilter, studentRoomMap, currentArrangementRoom]);

  // Apply Split 50:50 Between 2 Classes and 2 Rooms
  const handleApplySplit5050 = () => {
    if (splitRoomAId === splitRoomBId) {
      alert('Pilih dua ruangan yang berbeda untuk pembagian silang!');
      return;
    }
    if (splitClassA === splitClassB) {
      alert('Pilih dua kelas yang berbeda untuk disilangkan!');
      return;
    }

    const updatedRooms = splitTwoClassesAcrossTwoRooms(
      splitClassA,
      splitClassB,
      splitRoomAId,
      splitRoomBId,
      config.rooms,
      activeStudents
    );

    const updatedConfig: CbtPanitiaConfig = {
      ...config,
      rooms: updatedRooms
    };

    saveStoredCbtPanitiaConfig(updatedConfig);
    setConfig(updatedConfig);
    setShowSplitModal(false);
    showAlert(`⚡ Berhasil membagi silang Kelas ${splitClassA} & ${splitClassB} ke ${splitRoomAId} & ${splitRoomBId}!`);
  };

  // Add selected students to current room
  const handleAddSelectedStudentsToRoom = () => {
    if (!currentArrangementRoom || selectedStudentIdsToAdd.length === 0) return;

    const targetRoomId = currentArrangementRoom.id;
    const idsToAddSet = new Set(selectedStudentIdsToAdd);

    // Current students in target room + new ones
    const existingInRoom = getStudentsForRoom(currentArrangementRoom, activeStudents);
    const combinedIds = Array.from(new Set([...existingInRoom.map(s => s.id), ...selectedStudentIdsToAdd]));
    const targetStudents = activeStudents.filter(s => combinedIds.includes(s.id));

    const updatedRooms = config.rooms.map(room => {
      if (room.id === targetRoomId) {
        return {
          ...updateRoomMetadata(room, targetStudents),
          assignedStudentIds: combinedIds
        };
      }

      // Remove these students from any other room where they were placed
      const studentsHere = getStudentsForRoom(room, activeStudents);
      const hasOverlap = studentsHere.some(s => idsToAddSet.has(s.id));
      if (hasOverlap) {
        const remainingIds = studentsHere.filter(s => !idsToAddSet.has(s.id)).map(s => s.id);
        const remainingStudents = activeStudents.filter(s => remainingIds.includes(s.id));
        return {
          ...updateRoomMetadata(room, remainingStudents),
          assignedStudentIds: remainingIds
        };
      }

      return room;
    });

    const updatedConfig: CbtPanitiaConfig = {
      ...config,
      rooms: updatedRooms
    };

    saveStoredCbtPanitiaConfig(updatedConfig);
    setConfig(updatedConfig);
    setSelectedStudentIdsToAdd([]);
    showAlert(`✅ Berhasil menambahkan ${selectedStudentIdsToAdd.length} siswa ke ${currentArrangementRoom.name}!`);
  };

  // Remove students from current room
  const handleRemoveStudentsFromRoom = (studentIdsToRemove: string[]) => {
    if (!currentArrangementRoom || studentIdsToRemove.length === 0) return;

    const removeSet = new Set(studentIdsToRemove);
    const currentInRoom = getStudentsForRoom(currentArrangementRoom, activeStudents);
    const remainingStudents = currentInRoom.filter(s => !removeSet.has(s.id));
    const remainingIds = remainingStudents.map(s => s.id);

    const updatedRooms = config.rooms.map(room => {
      if (room.id === currentArrangementRoom.id) {
        return {
          ...updateRoomMetadata(room, remainingStudents),
          assignedStudentIds: remainingIds
        };
      }
      return room;
    });

    const updatedConfig: CbtPanitiaConfig = {
      ...config,
      rooms: updatedRooms
    };

    saveStoredCbtPanitiaConfig(updatedConfig);
    setConfig(updatedConfig);
    setSelectedStudentIdsToRemove([]);
    showAlert(`✓ ${studentIdsToRemove.length} siswa dikeluarkan dari ${currentArrangementRoom.name}`);
  };

  // Clear all students from a room
  const handleClearRoom = (roomId: string) => {
    const room = config.rooms.find(r => r.id === roomId);
    if (!room) return;

    if (!confirm(`Kosongkan seluruh siswa dari ${room.name}? Ruangan akan menjadi kosong.`)) return;

    const updatedRooms = config.rooms.map(r => {
      if (r.id === roomId) {
        return {
          ...r,
          classes: [],
          assignedStudentIds: [],
          label: `${r.name} (Kosong)`
        };
      }
      return r;
    });

    const updatedConfig: CbtPanitiaConfig = {
      ...config,
      rooms: updatedRooms
    };

    saveStoredCbtPanitiaConfig(updatedConfig);
    setConfig(updatedConfig);
    showAlert(`Ruangan ${room.name} telah dikosongkan.`);
  };

  // Reset all rooms to default pure single-class rooms
  const handleResetToDefaultPureRooms = () => {
    if (!confirm('Apakah Anda yakin ingin MENGEMBALIKAN susunan ruangan ke default (17 Ruangan Kelas Murni: 7-A s.d 9-E)? Seluruh pembagian kustom akan direset.')) {
      return;
    }

    const defaultRooms = getDefaultSchoolRooms();
    const updatedConfig: CbtPanitiaConfig = {
      ...config,
      rooms: defaultRooms
    };

    saveStoredCbtPanitiaConfig(updatedConfig);
    setConfig(updatedConfig);
    showAlert('🔄 Susunan ruangan berhasil dikembalikan ke 17 Ruangan Kelas Murni!');
  };

  // Quick Half Selector for Picker (Top 50% or Bottom 50%)
  const handleQuickSelectHalf = (half: 'top' | 'bottom') => {
    if (pickerCandidates.length === 0) return;
    const halfIdx = Math.ceil(pickerCandidates.length / 2);
    const slice = half === 'top'
      ? pickerCandidates.slice(0, halfIdx)
      : pickerCandidates.slice(halfIdx);

    const ids = slice.map(s => s.id);
    setSelectedStudentIdsToAdd(Array.from(new Set([...selectedStudentIdsToAdd, ...ids])));
    showAlert(`Memilih ${ids.length} siswa (${half === 'top' ? '50% Atas' : '50% Bawah'}).`);
  };

  // Calculate live preview for Split 50:50 Modal
  const splitModalPreview = useMemo(() => {
    const classAStudents = activeStudents
      .filter(s => s.classId === splitClassA)
      .sort((a, b) => a.name.localeCompare(b.name));
    const classBStudents = activeStudents
      .filter(s => s.classId === splitClassB)
      .sort((a, b) => a.name.localeCompare(b.name));

    const halfA = Math.ceil(classAStudents.length / 2);
    const halfB = Math.ceil(classBStudents.length / 2);

    const roomATotal = halfA + halfB;
    const roomBTotal = (classAStudents.length - halfA) + (classBStudents.length - halfB);

    const roomAObj = config.rooms.find(r => r.id === splitRoomAId);
    const roomBObj = config.rooms.find(r => r.id === splitRoomBId);

    return {
      classACount: classAStudents.length,
      classBCount: classBStudents.length,
      halfA,
      remA: classAStudents.length - halfA,
      halfB,
      remB: classBStudents.length - halfB,
      roomATotal,
      roomBTotal,
      roomACapacity: roomAObj?.capacity || 35,
      roomBCapacity: roomBObj?.capacity || 35,
      roomAName: roomAObj?.name || 'Ruang A',
      roomBName: roomBObj?.name || 'Ruang B'
    };
  }, [activeStudents, splitClassA, splitClassB, splitRoomAId, splitRoomBId, config.rooms]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {alertMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between animate-fade-in ${
          alertMsg.type === 'success'
            ? 'bg-emerald-600 text-white'
            : alertMsg.type === 'warning'
            ? 'bg-amber-500 text-slate-950'
            : 'bg-indigo-600 text-white'
        }`}>
          <span>{alertMsg.text}</span>
          <button type="button" onClick={() => setAlertMsg(null)} className="ml-3 font-mono font-black text-sm cursor-pointer">✕</button>
        </div>
      )}

      {/* 1. HEADER PUSAT KOMANDO PANITIA */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-500/30 relative overflow-hidden space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg shadow-amber-400/20">
                🏛️
              </span>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  POSKO PUSAT CBT • {config.academicYear} • {config.semester}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Pusat Komando Panitia Ujian CBT
                </h1>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              SMP Negeri 3 Cihampelas • Panel Pengendali Asesmen Sekolah. Monitoring Live Ruangan, Penyusunan Fleksibel Siswa & Pembagian Silang 50:50, Reset Sesi Peserta, dan Rekapitulasi BAP Resmi.
            </p>
          </div>

          {/* Quick Master Controls */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-right pr-2 border-r border-white/10 hidden sm:block">
              <span className="block text-[10px] text-slate-400">Status Master CBT:</span>
              <span className="text-xs font-bold text-amber-300">
                {macroStats.activePackagesCount} / {macroStats.totalPackages} Paket Aktif
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggleAllPackages('active')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Aktifkan seluruh paket soal ujian serentak"
            >
              <span>▶️</span>
              <span>Aktifkan Semua</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleAllPackages('draft')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white font-bold text-xs transition border border-white/15 flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Jeda seluruh ujian serentak"
            >
              <span>⏸️</span>
              <span>Jeda Semua</span>
            </button>
          </div>
        </div>

        {/* Macro Scoreboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10 pt-2 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px] font-semibold">Total Siswa Terdaftar</span>
            <span className="text-xl font-black text-white">{macroStats.totalStudents}</span>
            <span className="text-[10px] text-slate-400 block">535 Siswa (17 Rombel)</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px] font-semibold">Sedang Mengerjakan</span>
            <span className="text-xl font-black text-amber-300">{macroStats.inProgressCount}</span>
            <span className="text-[10px] text-amber-200/80 block">Live di Ruang Ujian</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px] font-semibold">Sudah Mengumpulkan</span>
            <span className="text-xl font-black text-emerald-300">{macroStats.submittedCount}</span>
            <span className="text-[10px] text-emerald-200/80 block">Selesai Dinilai</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px] font-semibold">Status Penempatan Siswa</span>
            <span className="text-sm font-black text-white">
              {unassignedStudentsCount === 0 ? '✓ 100% Terdistribusi' : `${unassignedStudentsCount} Belum Ada Ruang`}
            </span>
            <span className="text-[10px] text-indigo-300 block">{config.rooms.length} Ruang Ujian Siap</span>
          </div>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/10 relative z-10 text-xs">
          <button
            type="button"
            onClick={() => handleTabSwitch('monitoring')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'monitoring'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <span>📺</span>
            <span>Monitoring Ruang Ujian</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('arrangement')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'arrangement'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <span>🗂️</span>
            <span>Penyusunan Ruangan & Siswa</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-black">
              Baru
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('search')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'search'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <span>🛠️</span>
            <span>Pencarian Siswa & Reset Sesi</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('bap')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bap'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <span>📋</span>
            <span>Rekapitulasi BAP Sekolah</span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT: PENYUSUNAN RUANGAN & SISWA (FITUR BARU FLEKSIBEL & SPLIT 50:50) */}
      {activeTab === 'arrangement' && (
        <div className="space-y-6">
          {/* Header & Quick Action Toolbar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm">
                  🗂️
                </span>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Penyusunan & Pengaturan Ruang Ujian Bebas
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Atur penempatan peserta per ruangan secara custom: bisa membagi 2 kelas bersilang 50% - 50% (contoh: 50% 7-A + 50% 8-A di Ruang 1, sisanya di Ruang 2), atau bebas memilih siswa spesifik per ruangan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddRoomModal}
                className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-md shadow-amber-400/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>➕</span>
                <span>Tambah Ruangan</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSplitModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>⚡</span>
                <span>Bagi Silang 2 Kelas (50:50)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowEmergencyModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Daftarkan siswa baru/darurat yang belum terdaftar di CBT"
              >
                <span>👤➕</span>
                <span>Daftarkan Siswa Darurat</span>
              </button>
              <button
                type="button"
                onClick={handleResetToDefaultPureRooms}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition border border-slate-200 flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Kembalikan semua ruangan ke 1 rombel utuh (7A s.d 9E)"
              >
                <span>🔄</span>
                <span>Reset ke Kelas Murni</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Arrangement Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: ROOM SELECTOR CARDS (4 Cols) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Daftar Ruangan ({config.rooms.length})
                </span>
                <button
                  type="button"
                  onClick={handleOpenAddRoomModal}
                  className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                  title="Tambah Ruangan Ujian Baru"
                >
                  <span>➕</span>
                  <span>Tambah</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[780px] overflow-y-auto pr-1">
                {config.rooms.map(room => {
                  const students = roomStudentsMap.get(room.id) || [];
                  const isSelected = room.id === currentArrangementRoom?.id;
                  const isFull = students.length >= room.capacity;
                  const percent = Math.min(100, Math.round((students.length / room.capacity) * 100));

                  // Represented classes via O(1) map
                  const classInfo = roomUniqueClassesMap.get(room.id) || { uniqueClasses: [], isMixed: false };
                  const uniqueClasses = classInfo.uniqueClasses;
                  const isMixed = classInfo.isMixed;

                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => {
                        setSelectedArrangementRoomId(room.id);
                        setSelectedStudentIdsToAdd([]);
                        setSelectedStudentIdsToRemove([]);
                        setRoomStudentSearch('');
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl transition border cursor-pointer relative ${
                        isSelected
                          ? 'bg-amber-50/80 border-amber-500 shadow-md ring-2 ring-amber-400/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900 text-sm">
                              {room.name}
                            </span>
                            {isMixed ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                                🔀 Campur {uniqueClasses.join(' & ')}
                              </span>
                            ) : uniqueClasses.length === 1 ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Kelas {uniqueClasses[0]}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500">
                                Kosong
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            👤 {room.supervisorName || 'Guru Pengawas'}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className={`text-xs font-black ${
                            isFull ? 'text-amber-600' : students.length === 0 ? 'text-slate-400' : 'text-emerald-700'
                          }`}>
                            {students.length} / {room.capacity}
                          </span>
                          <span className="text-[10px] text-slate-400 block">Kursi</span>
                        </div>
                      </div>

                      {/* Mini Capacity Bar */}
                      <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full transition-all duration-300 ${
                            isFull ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: ROOM EDITOR & STUDENT PICKER (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Card 1: Selected Room Active Banner */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider">
                        {currentArrangementRoom?.name}
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        {currentArrangementRoom?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span>Kapasitas: <strong className="text-slate-900">{currentArrangementRoom?.capacity} Siswa</strong></span>
                      <span>•</span>
                      <span>Terisi: <strong className="text-emerald-600">{currentRoomStudents.length} Siswa</strong></span>
                      <span>•</span>
                      <span>Pengawas: <strong className="text-slate-900">{currentArrangementRoom?.supervisorName || 'Guru Pengawas'}</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditRoom(currentArrangementRoom)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                      title="Edit nama, kapasitas, dan pengawas ruangan ini"
                    >
                      <span>✏️</span>
                      <span>Edit Ruang</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearRoom(currentArrangementRoom.id)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                      title="Keluarkan seluruh siswa dari ruangan ini"
                    >
                      <span>🗑️</span>
                      <span>Kosongkan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoom(currentArrangementRoom.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                      title="Hapus ruangan ini dari sistem CBT"
                    >
                      <span>✕</span>
                      <span>Hapus Ruang</span>
                    </button>
                  </div>
                </div>

                {/* Section A: Daftar Siswa Saat Ini di Ruangan Ini */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        Daftar Peserta di {currentArrangementRoom?.name} ({currentRoomStudents.length} Siswa)
                      </span>
                      {selectedStudentIdsToRemove.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStudentsFromRoom(selectedStudentIdsToRemove)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] transition shadow-xs hover:bg-rose-700 cursor-pointer"
                        >
                          Hapus {selectedStudentIdsToRemove.length} Terpilih ✕
                        </button>
                      )}
                    </div>

                    <div className="w-full sm:w-56">
                      <FastSearchInput
                        value={roomStudentSearch}
                        onSearchChange={setRoomStudentSearch}
                        placeholder="Cari siswa di ruangan ini..."
                        className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white"
                      />
                    </div>
                  </div>

                  {currentRoomStudents.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      Ruangan ini saat ini kosong. Gunakan panel &quot;Tambah Siswa ke Ruangan&quot; di bawah untuk menambahkan siswa.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                          <tr>
                            <th className="py-2.5 px-3 w-8">
                              <input
                                type="checkbox"
                                checked={
                                  filteredCurrentRoomStudents.length > 0 &&
                                  filteredCurrentRoomStudents.every(s => selectedStudentIdsToRemoveSet.has(s.id))
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudentIdsToRemove(filteredCurrentRoomStudents.map(s => s.id));
                                  } else {
                                    setSelectedStudentIdsToRemove([]);
                                  }
                                }}
                                className="rounded text-rose-600 cursor-pointer"
                              />
                            </th>
                            <th className="py-2.5 px-3">No / Meja</th>
                            <th className="py-2.5 px-3">Nama Siswa</th>
                            <th className="py-2.5 px-3">NISN</th>
                            <th className="py-2.5 px-3">Kelas Asal</th>
                            <th className="py-2.5 px-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredCurrentRoomStudents.map((st, idx) => {
                            const isChecked = selectedStudentIdsToRemoveSet.has(st.id);
                            return (
                              <tr key={st.id} className="hover:bg-slate-50 transition">
                                <td className="py-2 px-3">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedStudentIdsToRemove([...selectedStudentIdsToRemove, st.id]);
                                      } else {
                                        setSelectedStudentIdsToRemove(selectedStudentIdsToRemove.filter(id => id !== st.id));
                                      }
                                    }}
                                    className="rounded text-rose-600 cursor-pointer"
                                  />
                                </td>
                                <td className="py-2 px-3 font-mono font-bold text-slate-500">
                                  {String(idx + 1).padStart(2, '0')}
                                </td>
                                <td className="py-2 px-3 font-bold text-slate-900">
                                  {st.name}
                                </td>
                                <td className="py-2 px-3 font-mono text-slate-600">
                                  {st.nisn}
                                </td>
                                <td className="py-2 px-3">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                    {st.classId}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStudentsFromRoom([st.id])}
                                    className="text-slate-400 hover:text-rose-600 font-bold text-xs p-1 cursor-pointer"
                                    title="Keluarkan siswa ini"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Tambah Siswa ke Ruangan Ini (Student Picker) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>➕</span>
                      <span>Tambah / Pindahkan Siswa ke {currentArrangementRoom?.name}</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pilih siswa dari kelas mana pun untuk dimasukkan ke ruangan ini secara fleksibel.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSelectedStudentsToRoom}
                    disabled={selectedStudentIdsToAdd.length === 0}
                    className={`px-4 py-2 rounded-xl font-black text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer ${
                      selectedStudentIdsToAdd.length > 0
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>+ Masukkan {selectedStudentIdsToAdd.length} Siswa Terpilih</span>
                  </button>
                </div>

                {/* Filters & Quick Selector Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      1. Pilih Kelas Asal:
                    </label>
                    <select
                      value={pickerClassFilter}
                      onChange={(e) => {
                        setPickerClassFilter(e.target.value);
                        setSelectedStudentIdsToAdd([]);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="all">Semua Kelas</option>
                      {SCHOOL_CLASSES.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      2. Filter Status Ruangan:
                    </label>
                    <select
                      value={pickerStatusFilter}
                      onChange={(e) => setPickerStatusFilter(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="all">Semua Siswa</option>
                      <option value="unassigned">Hanya yang Belum Dapat Ruangan</option>
                      <option value="other_room">Dari Ruangan Lain (Pindahkan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      3. Cari Nama / NISN:
                    </label>
                    <FastSearchInput
                      value={pickerSearchQuery}
                      onSearchChange={setPickerSearchQuery}
                      placeholder="Ketik nama atau NISN..."
                      className="w-full pl-8 pr-7 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Quick Selection Shortcuts (50% Atas / 50% Bawah) */}
                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs">
                  <span className="text-[11px] font-bold text-amber-900 mr-1">
                    ⚡ Bantuan Pilih Cepat:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickSelectHalf('top')}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 font-bold text-[11px] transition cursor-pointer"
                    title="Pilih setengah pertama siswa dari kelas ini (Absen 1 s.d Tengah)"
                  >
                    Pilih 50% Pertama (Atas)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelectHalf('bottom')}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 font-bold text-[11px] transition cursor-pointer"
                    title="Pilih setengah sisa siswa dari kelas ini (Tengah s.d Terakhir)"
                  >
                    Pilih 50% Kedua (Bawah)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = pickerCandidates.map(s => s.id);
                      setSelectedStudentIdsToAdd(allIds);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[11px] transition cursor-pointer"
                  >
                    Pilih Semua ({pickerCandidates.length})
                  </button>
                  {selectedStudentIdsToAdd.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIdsToAdd([])}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px] transition cursor-pointer ml-auto"
                    >
                      Batal Pilih (0)
                    </button>
                  )}
                </div>

                {/* Picker Candidate List Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-80 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-8">
                          <input
                            type="checkbox"
                            checked={
                              pickerCandidates.length > 0 &&
                              pickerCandidates.every(s => selectedStudentIdsToAddSet.has(s.id))
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIdsToAdd(pickerCandidates.map(s => s.id));
                              } else {
                                setSelectedStudentIdsToAdd([]);
                              }
                            }}
                            className="rounded text-indigo-600 cursor-pointer"
                          />
                        </th>
                        <th className="py-2.5 px-3">Nama Siswa</th>
                        <th className="py-2.5 px-3">NISN</th>
                        <th className="py-2.5 px-3">Kelas</th>
                        <th className="py-2.5 px-3">Status Ruangan Saat Ini</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pickerCandidates.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            Tidak ditemukan siswa dengan filter ini.
                          </td>
                        </tr>
                      ) : (
                        pickerCandidates.map(st => {
                          const isChecked = selectedStudentIdsToAddSet.has(st.id);
                          const assignedRoom = studentRoomMap.get(st.id);
                          const isAlreadyInCurrentRoom = assignedRoom?.id === currentArrangementRoom?.id;

                          return (
                            <tr
                              key={st.id}
                              onClick={() => {
                                if (isChecked) {
                                  setSelectedStudentIdsToAdd(selectedStudentIdsToAdd.filter(id => id !== st.id));
                                } else {
                                  setSelectedStudentIdsToAdd([...selectedStudentIdsToAdd, st.id]);
                                }
                              }}
                              className={`cursor-pointer transition ${
                                isChecked
                                  ? 'bg-amber-50/70'
                                  : isAlreadyInCurrentRoom
                                  ? 'bg-emerald-50/30 text-slate-500'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedStudentIdsToAdd([...selectedStudentIdsToAdd, st.id]);
                                    } else {
                                      setSelectedStudentIdsToAdd(selectedStudentIdsToAdd.filter(id => id !== st.id));
                                    }
                                  }}
                                  className="rounded text-indigo-600 cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-900">
                                {st.name}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-600">
                                {st.nisn}
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {st.classId}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                {isAlreadyInCurrentRoom ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    ✓ Sudah di {currentArrangementRoom?.name}
                                  </span>
                                ) : assignedRoom ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    📍 Sedang di {assignedRoom.name}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                    ⚪ Belum Ada Ruang
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT: MONITORING 17 RUANGAN LIVE GRID */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>📺</span>
                <span>Monitoring Live Ruang Ujian</span>
              </h2>
              <p className="text-xs text-slate-500">
                Data sinkron realtime dengan presensi dan pengerjaan siswa di seluruh ruangan ujian.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('arrangement');
                  handleOpenAddRoomModal();
                }}
                className="px-3 py-1.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <span>➕</span>
                <span>Tambah Ruangan</span>
              </button>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {config.rooms.length} Ruangan Ujian • {activeStudents.length} Peserta Terdaftar
              </span>
            </div>
          </div>

          {/* Grid Seluruh Ruang Ujian */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <span>🏫 Daftar Ruang Ujian ({config.rooms.length} Ruangan)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {config.rooms.map(room => {
                const studentsInRoom = roomStudentsMap.get(room.id) || [];
                const stats = roomStatusStatsMap.get(room.id) || { submitted: 0, inProgress: 0, notStarted: 0, total: 0 };
                const roomSubmitted = stats.submitted;
                const roomInProgress = stats.inProgress;
                const roomNotStarted = stats.notStarted;

                const total = studentsInRoom.length;
                const percent = total > 0 ? Math.round((roomSubmitted / total) * 100) : 0;
                const uniqueClasses = Array.from(new Set(studentsInRoom.map(s => s.classId))).sort();
                const isMixed = uniqueClasses.length > 1;

                return (
                  <div
                    key={room.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                              {room.name}
                            </span>
                            {isMixed ? (
                              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-purple-50 text-purple-700 border border-purple-200">
                                🔀 Campur {uniqueClasses.join(' & ')}
                              </span>
                            ) : uniqueClasses.length === 1 ? (
                              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Kelas {uniqueClasses[0]}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-500">
                                Kosong
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm mt-1">
                            {total} Siswa Terdaftar
                          </h3>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          percent === 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : percent > 0
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {percent}% Selesai
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${percent}%` }}
                            className="bg-emerald-500 transition-all duration-500"
                          />
                          <div
                            style={{ width: `${total > 0 ? (roomInProgress / total) * 100 : 0}%` }}
                            className="bg-amber-400 transition-all duration-500"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                          <span>✅ {roomSubmitted} Selesai</span>
                          <span>⏳ {roomInProgress} Mengerjakan</span>
                          <span>⚪ {roomNotStarted} Belum</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 truncate max-w-[130px]">
                        <span className="text-[11px] text-slate-600 truncate" title={room.supervisorName || 'Pengawas Ruang'}>
                          👤 {room.supervisorName || 'Guru Pengawas'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditRoom(room)}
                          className="text-slate-400 hover:text-indigo-600 cursor-pointer ml-1"
                          title="Ubah Pengawas"
                        >
                          ✏️
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenRoomView) onOpenRoomView(room.label || room.name);
                          setPreviewMonitoringRoom(room);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs cursor-pointer transition flex items-center gap-1 active:scale-95 shadow-2xs"
                        title={`Pantau langsung peserta di ${room.name}`}
                      >
                        <span>Pantau Ruang</span>
                        <span>➔</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: PENCARIAN SISWA & RESET SESI MANDIRI */}
      {activeTab === 'search' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 space-y-4 shadow-sm">
          {/* Header & Quick Horizontal KPI Strip */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>🛠️</span>
                <span>Pencarian Peserta & Reset Sesi Mandiri (Posko Pusat)</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Buka kunci sesi pengerjaan siswa yang mengalami kendala teknis (HP restart, browser crash) secara instan.
              </p>
            </div>

            {/* Compact Horizontal KPI Filter Badges */}
            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedStatusFilter === 'all'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
                title="Tampilkan semua siswa"
              >
                <span>👥 Semua</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  selectedStatusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 font-bold'
                }`}>
                  {searchKpiStats.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusFilter('in_progress')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedStatusFilter === 'in_progress'
                    ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs'
                    : 'bg-amber-50 border-amber-200 hover:bg-amber-100/80 text-amber-800'
                }`}
                title="Filter siswa yang sedang aktif ujian"
              >
                <span className="animate-pulse">⏳ Aktif</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  selectedStatusFilter === 'in_progress' ? 'bg-amber-600 text-white' : 'bg-amber-200/80 text-amber-900 font-black'
                }`}>
                  {searchKpiStats.inProgress}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusFilter('submitted')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedStatusFilter === 'submitted'
                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/80 text-emerald-800'
                }`}
                title="Filter siswa yang sudah selesai"
              >
                <span>✓ Selesai</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  selectedStatusFilter === 'submitted' ? 'bg-emerald-700 text-white' : 'bg-emerald-200/80 text-emerald-900 font-black'
                }`}>
                  {searchKpiStats.submitted}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusFilter('no_session')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedStatusFilter === 'no_session'
                    ? 'bg-slate-700 border-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'
                }`}
                title="Filter siswa belum masuk"
              >
                <span>⚪ Belum</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  selectedStatusFilter === 'no_session' ? 'bg-slate-600 text-white' : 'bg-slate-200 text-slate-700 font-bold'
                }`}>
                  {searchKpiStats.noSession}
                </span>
              </button>
            </div>
          </div>

          {/* Compact Filter Toolbar: Search, Room, Grade */}
          <div className="bg-slate-50/90 p-3 sm:p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              {/* Search Bar */}
              <div className="sm:col-span-7">
                <FastSearchInput
                  value={searchQuery}
                  onSearchChange={setSearchQuery}
                  placeholder="Cari Nama Siswa, NISN, Kelas (misal 7-A), atau Ruang Ujian..."
                  className="w-full pl-8 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 transition shadow-2xs"
                />
              </div>

              {/* Room Dropdown */}
              <div className="sm:col-span-5">
                <select
                  value={selectedRoomFilter}
                  onChange={(e) => setSelectedRoomFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="all">🏢 Semua Ruangan ({config.rooms.length})</option>
                  {config.rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.supervisorName ? `Pengawas: ${r.supervisorName}` : r.label})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sub-row: Grade buttons + Active filter reset */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">
                  Tingkat:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedGradeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer transition ${
                    selectedGradeFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua Tingkat
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGradeFilter('7')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer transition ${
                    selectedGradeFilter === '7'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Kelas 7 (A-F)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGradeFilter('8')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer transition ${
                    selectedGradeFilter === '8'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Kelas 8 (A-F)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGradeFilter('9')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer transition ${
                    selectedGradeFilter === '9'
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Kelas 9 (A-E)
                </button>
              </div>

              <div className="flex items-center gap-2">
                {(searchQuery || selectedGradeFilter !== 'all' || selectedRoomFilter !== 'all' || selectedStatusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedGradeFilter('all');
                      setSelectedRoomFilter('all');
                      setSelectedStatusFilter('all');
                    }}
                    className="px-2 py-0.5 text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer transition flex items-center gap-1"
                  >
                    <span>✕</span>
                    <span>Reset Filter</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(true)}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                  title="Daftarkan siswa baru / darurat yang belum memiliki akun ke CBT"
                >
                  <span>👤➕</span>
                  <span>Daftarkan Siswa Darurat</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-700">
                Ditemukan <strong>{filteredStudents.length}</strong> siswa
                {filteredStudents.length !== activeStudents.length && ` (dari ${activeStudents.length} total siswa)`}:
              </span>

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>Tampilkan per halaman:</span>
                <div className="flex items-center gap-1">
                  {[25, 50, 100, 9999].map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSearchPageSize(sz)}
                      className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition ${
                        searchPageSize === sz
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sz === 9999 ? 'Semua' : sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <span className="text-3xl block">🔍</span>
                <p className="font-bold text-slate-700 text-sm">Tidak ada siswa yang cocok dengan filter pencarian.</p>
                <p className="text-slate-400 max-w-md mx-auto">Siswa mungkin belum terdaftar di database sekolah atau merupakan siswa baru/susulan darurat.</p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (searchQuery.trim()) {
                        setEmName(searchQuery.trim());
                      }
                      setShowEmergencyModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>👤➕</span>
                    <span>Daftarkan Siswa Ini ke CBT & Master Sekolah</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-4">NISN / Kelas</th>
                      <th className="py-3 px-4">Lokasi Ruangan</th>
                      <th className="py-3 px-4">Status Sesi Ujian</th>
                      <th className="py-3 px-4 text-right">Tindakan Panitia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedStudents.map(st => {
                      const sessions = sessionsByStudentId.get(st.id) || [];
                      // Deduplicate sessions by examId to ensure no duplicates
                      const uniqueSessions = Array.from(
                        new Map(sessions.map(s => [s.examId, s])).values()
                      );

                      // Determine official room based on actual assignment
                      const assignedRoom = studentRoomMap.get(st.id);

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                st.gender === 'P'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-indigo-100 text-indigo-700'
                              }`}>
                                {st.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block leading-tight">
                                  {st.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {st.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono text-slate-700 font-medium">
                              {st.nisn}
                            </div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded font-bold text-[9px] bg-slate-100 text-slate-600">
                              Kelas {st.classId}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-800 border border-slate-200/80 inline-block">
                              {assignedRoom ? assignedRoom.name : 'Belum Ditentukan'}
                            </span>
                            {assignedRoom?.supervisorName && (
                              <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[140px]" title={`Pengawas: ${assignedRoom.supervisorName}`}>
                                👤 {assignedRoom.supervisorName}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {uniqueSessions.length === 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 inline-block">
                                ⚪ Belum Masuk
                              </span>
                            ) : uniqueSessions.length === 1 ? (
                              (() => {
                                const sess = uniqueSessions[0];
                                const pkg = packages.find(p => p.id === sess.examId);
                                const subjectName = pkg?.subject || pkg?.title || 'Ujian';
                                return (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                      sess.isSubmitted
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                                    }`}
                                    title={`${pkg?.title || subjectName}: ${sess.isSubmitted ? 'Sudah Selesai' : 'Sedang Mengerjakan'}`}
                                  >
                                    <span>{sess.isSubmitted ? '✓' : '⏳'}</span>
                                    <span>{subjectName}</span>
                                    <span className="text-[9px] opacity-75">
                                      ({sess.isSubmitted ? 'Selesai' : 'Aktif'})
                                    </span>
                                  </span>
                                );
                              })()
                            ) : (
                              (() => {
                                const allSubmitted = uniqueSessions.every(s => s.isSubmitted);
                                const activeCount = uniqueSessions.filter(s => !s.isSubmitted).length;
                                return (
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap inline-flex items-center gap-1 ${
                                        allSubmitted
                                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                          : 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                                      }`}
                                      title={uniqueSessions.map(s => {
                                        const p = packages.find(pkg => pkg.id === s.examId);
                                        return `${p?.subject || p?.title || 'Ujian'}: ${s.isSubmitted ? 'Selesai' : 'Aktif'}`;
                                      }).join(' | ')}
                                    >
                                      <span>{allSubmitted ? '✓' : '⏳'}</span>
                                      <span>
                                        {allSubmitted
                                          ? `${uniqueSessions.length} Mapel Selesai`
                                          : `${activeCount} Aktif (${uniqueSessions.length} Mapel)`}
                                      </span>
                                    </span>
                                  </div>
                                );
                              })()
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {uniqueSessions.length === 0 ? (
                              <span className="text-slate-400 text-[11px]">Tidak ada sesi aktif</span>
                            ) : uniqueSessions.length === 1 ? (
                              (() => {
                                const sess = uniqueSessions[0];
                                const pkg = packages.find(p => p.id === sess.examId);
                                const subjectName = pkg?.subject || pkg?.title || 'Sesi';
                                const examTitle = pkg?.title || subjectName;

                                return (
                                  <button
                                    key={sess.examId}
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Yakin ingin mereset sesi ujian "${examTitle}" untuk siswa "${st.name}"?\n\nSiswa akan dapat mengerjakan kembali dari awal.`)) {
                                        resetStoredStudentCbtSession(sess.examId, st.id);
                                        showAlert(`Sesi ujian ${subjectName} untuk ${st.name} berhasil di-reset!`);
                                      }
                                    }}
                                    title={`Reset sesi ujian ${examTitle} untuk ${st.name}`}
                                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition cursor-pointer active:scale-95 inline-flex items-center gap-1 shadow-2xs"
                                  >
                                    <span>🔄</span>
                                    <span>Reset Sesi</span>
                                  </button>
                                );
                              })()
                            ) : (
                              <button
                                type="button"
                                onClick={() => setResetModalStudent(st)}
                                title={`Buka jendela kelola & reset sesi (${uniqueSessions.length} mapel) untuk ${st.name}`}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs transition cursor-pointer active:scale-95 inline-flex items-center gap-1.5 shadow-2xs"
                              >
                                <span>⚙️</span>
                                <span>Kelola Reset ({uniqueSessions.length} Mapel)</span>
                                <span className="text-[10px]">↗</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredStudents.length > 0 && searchPageSize !== 9999 && totalSearchPages > 1 && (
              <div className="pt-3 flex items-center justify-between gap-3 text-xs border-t border-slate-100">
                <span className="text-slate-500 text-[11px]">
                  Halaman <strong>{searchPage}</strong> dari <strong>{totalSearchPages}</strong>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={searchPage <= 1}
                    onClick={() => setSearchPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-xs"
                  >
                    ◀ Sebelumnya
                  </button>
                  <span className="px-2 font-mono font-bold text-slate-600">
                    {searchPage} / {totalSearchPages}
                  </span>
                  <button
                    type="button"
                    disabled={searchPage >= totalSearchPages}
                    onClick={() => setSearchPage(p => Math.min(totalSearchPages, p + 1))}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-xs"
                  >
                    Selanjutnya ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: REKAPITULASI BAP SEKOLAH */}
      {activeTab === 'bap' && (() => {
        let bapSubmittedCount = 0;
        config.rooms.forEach(room => {
          const attendances = Object.values(roomAttendances).filter(a => a.roomName?.includes(room.name));
          if (attendances.some(a => a.isBapSubmitted)) bapSubmittedCount++;
        });

        return (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 space-y-5 shadow-sm">
            {/* Header & KPI Summary */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>📋</span>
                  <span>Rekapitulasi Berita Acara Pelaksanaan (BAP) Seluruh Ruangan</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pantau kelengkapan Berita Acara Pelaksanaan ujian dari seluruh ruangan pengawas untuk keperluan arsip administrasi panitia asesmen.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                  🏢 Total {config.rooms.length} Ruangan
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                  ✓ {bapSubmittedCount} BAP Terkirim
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                  ⏳ {Math.max(0, config.rooms.length - bapSubmittedCount)} Menunggu BAP
                </span>
                <button
                  type="button"
                  onClick={handleExportSchoolBapExcel}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                  title="Unduh seluruh rekapitulasi BAP sekolah ke Excel (.xlsx)"
                >
                  <span>📥</span>
                  <span>Export Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRekapPrintModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                  title="Cetak seluruh rekapitulasi BAP sekolah"
                >
                  <span>🖨️</span>
                  <span>Cetak Rekapitulasi</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Ruang Ujian</th>
                    <th className="py-3 px-4">Kelas Sasaran</th>
                    <th className="py-3 px-4">Pengawas Ruang</th>
                    <th className="py-3 px-4">Kehadiran Peserta</th>
                    <th className="py-3 px-4">Status BAP</th>
                    <th className="py-3 px-4">Catatan Kejadian Khusus</th>
                    <th className="py-3 px-4 text-right">Aksi Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {config.rooms.map(room => {
                    const attendances = Object.values(roomAttendances).filter(a => a.roomName?.includes(room.name));
                    const latestAttendance = attendances[0];
                    const isSubmitted = attendances.some(a => a.isBapSubmitted);
                    const latestNote = latestAttendance?.notes || '-';
                    const roomStudents = roomStudentsMap.get(room.id) || [];
                    const uniqueClasses = Array.from(new Set(roomStudents.map(s => s.classId))).sort();

                    // Calculate attendance breakdown strictly for registered room students
                    let presentCount = 0;
                    let sickCount = 0;
                    let permitCount = 0;
                    let absentCount = 0;

                    roomStudents.forEach(st => {
                      const status = latestAttendance?.records?.[st.id] || 'H';
                      if (status === 'H') presentCount++;
                      else if (status === 'S') sickCount++;
                      else if (status === 'I') permitCount++;
                      else if (status === 'A') absentCount++;
                    });

                    return (
                      <tr key={room.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {room.name}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {roomStudents.length} Peserta Terdaftar
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-700">
                            {uniqueClasses.length > 0 ? uniqueClasses.join(', ') : room.classes.join(', ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {room.supervisorName || 'Guru Pengawas'}
                        </td>
                        <td className="py-3 px-4">
                          {isSubmitted ? (
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                H: {presentCount}
                              </span>
                              {(sickCount > 0 || permitCount > 0 || absentCount > 0) && (
                                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                                  {sickCount > 0 ? `S:${sickCount} ` : ''}
                                  {permitCount > 0 ? `I:${permitCount} ` : ''}
                                  {absentCount > 0 ? `A:${absentCount}` : ''}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">
                              Total: {roomStudents.length} Siswa
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isSubmitted ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              ✓ BAP Terkirim
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              ⏳ Belum Diserahkan
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                          {latestNote}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => handleExportSingleRoomBap(room)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs transition cursor-pointer active:scale-95 inline-flex items-center gap-1 shadow-2xs"
                              title={`Download Berita Acara & Daftar Hadir ${room.name} ke Excel (.xlsx)`}
                            >
                              <span>📥</span>
                              <span>Excel</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewBapRoom(room)}
                              className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs transition cursor-pointer active:scale-95 inline-flex items-center gap-1 shadow-2xs"
                              title={`Buka dokumen Berita Acara ${room.name}`}
                            >
                              <span>📄</span>
                              <span>Buka Dokumen</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 6. MODAL EDIT PENGATURAN RUANGAN / PENGAWAS */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl border border-indigo-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 block uppercase tracking-wider">Pengaturan Ruangan</span>
                <h3 className="text-base font-bold text-slate-900">{editingRoom.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoomEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Ruangan:
                  </label>
                  <input
                    type="text"
                    required
                    value={editRoomName}
                    onChange={(e) => setEditRoomName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    placeholder="Contoh: Ruang 01"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kapasitas (Kursi):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={editRoomCapacity}
                    onChange={(e) => setEditRoomCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Guru Pengawas:
                </label>
                <input
                  type="text"
                  value={editRoomSupervisor}
                  onChange={(e) => setEditRoomSupervisor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                  placeholder="Contoh: Dani Ramdani, S.Pd."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Rombel Sasaran Ruangan (Opsional):
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 max-h-40 overflow-y-auto">
                  {SCHOOL_CLASSES.map(c => {
                    const isSelected = editRoomClasses.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setEditRoomClasses(editRoomClasses.filter(id => id !== c.id));
                          } else {
                            setEditRoomClasses([...editRoomClasses, c.id].sort());
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{isSelected ? '✓' : '+'}</span>
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteRoom(editingRoom.id)}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition border border-rose-200 cursor-pointer"
                  title="Hapus ruangan ini"
                >
                  🗑️ Hapus Ruangan
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRoom(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6B. MODAL TAMBAH RUANGAN BARU */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl border border-amber-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                  ➕ Ruang Ujian Baru
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  Tambah Ruangan CBT
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tambahkan ruangan ujian baru ke jadwal dan monitoring panitia.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRoomModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Ruangan:
                </label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  placeholder="Contoh: Ruang 18, Ruang Cadangan, Aula Utama"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 py-0.5">Saran nama:</span>
                  {['Ruang Cadangan', 'Ruang Aula', 'Ruang Multimedia', 'Ruang Susulan'].map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setNewRoomName(sug)}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-900 font-medium cursor-pointer transition"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kapasitas Siswa (Kursi):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Guru Pengawas:
                  </label>
                  <input
                    type="text"
                    value={newRoomSupervisor}
                    onChange={(e) => setNewRoomSupervisor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                    placeholder="Nama Pengawas"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tautkan Rombel Otomatis (Opsional):
                </label>
                <p className="text-[10px] text-slate-400 mb-2">
                  Jika dipilih, siswa dari rombel tersebut akan otomatis masuk ke ruangan ini. Atau biarkan kosong untuk penempatan siswa kustom.
                </p>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 max-h-36 overflow-y-auto">
                  {SCHOOL_CLASSES.map(c => {
                    const isSelected = newRoomClasses.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewRoomClasses(newRoomClasses.filter(id => id !== c.id));
                          } else {
                            setNewRoomClasses([...newRoomClasses, c.id].sort());
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{isSelected ? '✓' : '+'}</span>
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black transition shadow-md shadow-amber-400/20 cursor-pointer active:scale-95"
                >
                  ➕ Simpan & Buat Ruangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL PEMBAGIAN SILANG 2 KELAS (SPLIT 50:50) */}
      {showSplitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full space-y-5 shadow-2xl border border-amber-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                  ⚡ Wizard Otomasi Panitia
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  Pembagian Silang 2 Kelas ke 2 Ruangan (50% - 50%)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Membagi dua kelas menjadi dua bagian sama rata dan menggabungkannya secara silang ke 2 ruangan untuk mencegah kerja sama antarteman sekelas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSplitModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Row 1: Pilih 2 Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kelas Pertama (A):
                  </label>
                  <select
                    value={splitClassA}
                    onChange={(e) => setSplitClassA(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {SCHOOL_CLASSES.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({classCountMap.get(c.id) || 0} Siswa)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kelas Kedua (B):
                  </label>
                  <select
                    value={splitClassB}
                    onChange={(e) => setSplitClassB(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {SCHOOL_CLASSES.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({classCountMap.get(c.id) || 0} Siswa)</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Target Ruangan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Target Ruangan 1:
                  </label>
                  <select
                    value={splitRoomAId}
                    onChange={(e) => setSplitRoomAId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {config.rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name} (Kapasitas: {r.capacity})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Target Ruangan 2:
                  </label>
                  <select
                    value={splitRoomBId}
                    onChange={(e) => setSplitRoomBId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {config.rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name} (Kapasitas: {r.capacity})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Interactive Live Calculation Preview Card */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300/80 space-y-3">
                <span className="text-[11px] font-black uppercase text-amber-900 tracking-wider block">
                  🔍 Pratinjau Hasil Pembagian Silang:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white border border-amber-200 space-y-1">
                    <span className="font-black text-slate-900 block text-xs">
                      📍 {splitModalPreview.roomAName}
                    </span>
                    <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
                      <li><strong>{splitModalPreview.halfA} Siswa</strong> dari Kelas {splitClassA} (Absen 1 - {splitModalPreview.halfA})</li>
                      <li><strong>{splitModalPreview.halfB} Siswa</strong> dari Kelas {splitClassB} (Absen 1 - {splitModalPreview.halfB})</li>
                    </ul>
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Total di Ruangan:</span>
                      <strong className="text-emerald-700 font-black">
                        {splitModalPreview.roomATotal} / {splitModalPreview.roomACapacity} Siswa ✓
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-amber-200 space-y-1">
                    <span className="font-black text-slate-900 block text-xs">
                      📍 {splitModalPreview.roomBName}
                    </span>
                    <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
                      <li><strong>{splitModalPreview.remA} Siswa</strong> dari Kelas {splitClassA} (Absen {splitModalPreview.halfA + 1} - {splitModalPreview.classACount})</li>
                      <li><strong>{splitModalPreview.remB} Siswa</strong> dari Kelas {splitClassB} (Absen {splitModalPreview.halfB + 1} - {splitModalPreview.classBCount})</li>
                    </ul>
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Total di Ruangan:</span>
                      <strong className="text-emerald-700 font-black">
                        {splitModalPreview.roomBTotal} / {splitModalPreview.roomBCapacity} Siswa ✓
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSplitModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplySplit5050}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black transition shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
                >
                  ⚡ Terapkan Pembagian Silang Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 6D. MODAL KELOLA & RESET SESI SPESIFIK SISWA */}
      {resetModalStudent && (() => {
        const st = resetModalStudent;
        const currentSessions = Array.from(
          new Map(
            (sessionsByStudentId.get(st.id) || []).map(s => [s.examId, s])
          ).values()
        );
        const assignedRoom = studentRoomMap.get(st.id);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚙️</span>
                    <h3 className="font-black text-slate-900 text-base">
                      Kelola Reset Sesi Ujian Siswa
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-bold text-slate-800">{st.name}</span> • NISN: <span className="font-mono">{st.nisn}</span> • Kelas: <span className="font-bold">{st.classId}</span> ({assignedRoom ? assignedRoom.name : 'Ruangan -'})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setResetModalStudent(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold cursor-pointer transition text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Content: List of active sessions */}
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {currentSessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                    ✓ Semua sesi ujian siswa ini sudah di-reset atau belum ada sesi aktif.
                  </div>
                ) : (
                  currentSessions.map(sess => {
                    const pkg = packages.find(p => p.id === sess.examId);
                    const subjectName = pkg?.subject || pkg?.title || 'Mata Pelajaran CBT';
                    const examTitle = pkg?.title || subjectName;

                    return (
                      <div
                        key={sess.examId}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {subjectName}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                sess.isSubmitted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {sess.isSubmitted ? '✓ Selesai' : '⏳ Mengerjakan'}
                            </span>
                            {sess.violationCount && sess.violationCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
                                ⚠️ {sess.violationCount}x Pindah Tab
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {examTitle}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            {sess.startedAt && (
                              <span>
                                Mulai: {new Date(sess.startedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                              </span>
                            )}
                            {sess.isSubmitted && sess.score !== undefined && (
                              <span>
                                Skor: <strong className="text-slate-700">{sess.score} / 100</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Yakin ingin mereset sesi ujian "${examTitle}" untuk siswa "${st.name}"?\n\nSiswa akan dapat mengerjakan kembali mata pelajaran ini dari awal.`)) {
                              resetStoredStudentCbtSession(sess.examId, st.id);
                              showAlert(`Sesi ${subjectName} untuk ${st.name} berhasil di-reset!`);
                              if (currentSessions.length <= 1) {
                                setResetModalStudent(null);
                              }
                            }
                          }}
                          className="shrink-0 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition cursor-pointer active:scale-95 flex items-center gap-1 shadow-2xs"
                        >
                          <span>🔄</span>
                          <span>Reset Sesi Ini</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                {currentSessions.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Yakin ingin mereset SEMUA (${currentSessions.length}) sesi ujian untuk siswa "${st.name}"?\n\nSemua mata pelajaran yang telah dikerjakan akan dikosongkan kembali dari awal.`)) {
                        currentSessions.forEach(sess => {
                          resetStoredStudentCbtSession(sess.examId, st.id);
                        });
                        showAlert(`Semua (${currentSessions.length}) sesi ujian untuk ${st.name} berhasil di-reset!`);
                        setResetModalStudent(null);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer active:scale-95 shadow-xs flex items-center gap-1.5"
                  >
                    <span>⚠️</span>
                    <span>Reset SEMUA Sesi ({currentSessions.length})</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    {currentSessions.length} sesi terdeteksi
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setResetModalStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* 6E. MODAL LIVE DETAIL MONITORING RUANG UJIAN */}
      {previewMonitoringRoom && (() => {
        const room = previewMonitoringRoom;
        const studentsInRoom = roomStudentsMap.get(room.id) || [];
        const stats = roomStatusStatsMap.get(room.id) || { submitted: 0, inProgress: 0, notStarted: 0, total: 0 };
        const roomSubmitted = stats.submitted;
        const roomInProgress = stats.inProgress;
        const roomNotStarted = stats.notStarted;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-black text-xs uppercase">
                      {room.name}
                    </span>
                    <h3 className="font-black text-slate-900 text-base">
                      {room.label || 'Ruang Ujian CBT'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span>Pengawas: <strong className="text-slate-800">{room.supervisorName || 'Guru Pengawas'}</strong></span>
                    <span>•</span>
                    <span>Kapasitas: <strong className="text-slate-800">{room.capacity} Kursi</strong></span>
                    <span>•</span>
                    <span>Terdaftar: <strong className="text-slate-800">{studentsInRoom.length} Siswa</strong></span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewMonitoringRoom(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold cursor-pointer transition text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Status KPI Strip */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                  <span className="block text-lg font-black">{roomSubmitted}</span>
                  <span className="text-[10px]">✓ Sudah Selesai</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                  <span className="block text-lg font-black animate-pulse">{roomInProgress}</span>
                  <span className="text-[10px]">⏳ Sedang Mengerjakan</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-bold">
                  <span className="block text-lg font-black">{roomNotStarted}</span>
                  <span className="text-[10px]">⚪ Belum Masuk</span>
                </div>
              </div>

              {/* Student Roster Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Daftar Peserta di {room.name} ({studentsInRoom.length} Siswa):
                </span>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-72 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">No</th>
                        <th className="py-2.5 px-3">Nama Siswa</th>
                        <th className="py-2.5 px-3">NISN / Kelas</th>
                        <th className="py-2.5 px-3">Status CBT</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentsInRoom.map((st, idx) => {
                        const sessions = sessionsByStudentId.get(st.id) || [];
                        const hasSubmitted = sessions.some(s => s.isSubmitted);
                        const hasInProgress = sessions.some(s => !s.isSubmitted);

                        return (
                          <tr key={st.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{st.name}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">{st.nisn} ({st.classId})</td>
                            <td className="py-2.5 px-3">
                              {hasSubmitted ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  ✓ Selesai
                                </span>
                              ) : hasInProgress ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                                  ⏳ Mengerjakan
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                                  ⚪ Belum
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {sessions.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewMonitoringRoom(null);
                                    setResetModalStudent(st);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] transition cursor-pointer"
                                  title="Reset sesi ujian siswa ini"
                                >
                                  🔄 Reset
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Data sinkron live dengan presensi ruangan
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewMonitoringRoom(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 6F. MODAL PRATINJAU DOKUMEN RESMI BERITA ACARA PELAKSANAAN (BAP) */}
      {previewBapRoom && (() => {
        const room = previewBapRoom;
        const attendances = attendancesByRoomMap.get(room.name) || [];
        const latestAttendance = attendances[0];
        const roomStudents = roomStudentsMap.get(room.id) || [];
        const uniqueClasses = Array.from(new Set(roomStudents.map(s => s.classId))).sort();

        let presentCount = 0;
        let sickCount = 0;
        let permitCount = 0;
        let absentCount = 0;

        roomStudents.forEach(st => {
          const status = latestAttendance?.records?.[st.id] || 'H';
          if (status === 'H') presentCount++;
          else if (status === 'S') sickCount++;
          else if (status === 'I') permitCount++;
          else if (status === 'A') absentCount++;
        });

        const currentDateStr = new Date().toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-scaleUp my-4 sm:my-8 relative">
              {/* Sticky Modal Control Bar */}
              <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs flex items-center justify-between pb-3 border-b border-slate-100 print:hidden -mx-6 sm:-mx-8 px-6 sm:px-8 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📄</span>
                  <span className="font-bold text-slate-900 text-sm">Dokumen Resmi Berita Acara</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={() => handleExportSingleRoomBap(room)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                    title="Unduh format spreadsheet Excel (.xlsx)"
                  >
                    <span>📥</span>
                    <span>Download Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                  >
                    <span>🖨️</span>
                    <span>Cetak Lembar BAP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBapRoom(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold cursor-pointer transition text-sm"
                    title="Tutup Pratinjau"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* AUTHENTIC OFFICIAL BAP SHEET (PRINTABLE) */}
              <div className="border border-slate-300 rounded-2xl p-6 sm:p-8 bg-white text-slate-900 space-y-5 text-xs shadow-inner">
                {/* Official Letterhead (Kop Surat Sekolah) */}
                <div className="text-center border-b-2 border-slate-900 pb-3 space-y-0.5">
                  <p className="font-bold text-[11px] uppercase tracking-wider text-slate-700">
                    Pemerintah Daerah Kabupaten Bandung Barat
                  </p>
                  <p className="font-bold text-[11px] uppercase tracking-wider text-slate-700">
                    Dinas Pendidikan
                  </p>
                  <h2 className="font-black text-sm uppercase tracking-wider text-slate-950">
                    SMP Negeri 3 Cihampelas
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    Jalan Babakan Caringin, Desa Cihampelas, Kec. Cihampelas, Kab. Bandung Barat 40562
                  </p>
                </div>

                {/* Title */}
                <div className="text-center space-y-1">
                  <h3 className="font-black text-sm uppercase tracking-wide underline underline-offset-4">
                    Berita Acara Pelaksanaan Asesmen Sumatif (CBT)
                  </h3>
                  <p className="text-[11px] font-mono font-medium text-slate-600">
                    Tahun Ajaran {config.academicYear || '2026/2027'} • Posko Panitia Asesmen CBT
                  </p>
                </div>

                {/* Body Paragraph */}
                <p className="text-justify leading-relaxed">
                  Pada hari ini <strong>{currentDateStr}</strong>, telah dilaksanakan Asesmen Berbasis Komputer (CBT) di SMP Negeri 3 Cihampelas dengan rincian pelaksanaan sebagai berikut:
                </p>

                {/* Metadata Table */}
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-3 bg-slate-50 font-bold w-44">Ruang Ujian</td>
                      <td className="py-1.5 px-3 font-semibold">{room.name} ({room.label || 'Reguler'})</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-3 bg-slate-50 font-bold">Kelas Sasaran</td>
                      <td className="py-1.5 px-3">{uniqueClasses.join(', ') || room.classes.join(', ')}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-3 bg-slate-50 font-bold">Guru Pengawas Ruang</td>
                      <td className="py-1.5 px-3 font-semibold">{room.supervisorName || 'Guru Pengawas'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-3 bg-slate-50 font-bold">Jumlah Peserta Terdaftar</td>
                      <td className="py-1.5 px-3 font-bold">{roomStudents.length} Siswa</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-3 bg-slate-50 font-bold">Jumlah Peserta Hadir</td>
                      <td className="py-1.5 px-3 font-bold text-emerald-700">{presentCount} Siswa</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1.5 px-3 bg-slate-50 font-bold">Jumlah Tidak Hadir</td>
                      <td className="py-1.5 px-3">
                        {sickCount + permitCount + absentCount > 0 ? (
                          <span>{sickCount + permitCount + absentCount} Siswa (Sakit: {sickCount}, Izin: {permitCount}, Alpa: {absentCount})</span>
                        ) : (
                          <span className="text-emerald-700 font-bold">Nihil (Hadir Lengkap 100%)</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 bg-slate-50 font-bold align-top">Catatan Selama Ujian</td>
                      <td className="py-2 px-3 italic">{latestAttendance?.notes || 'Ujian berlangsung dengan tertib, aman, dan lancar tanpa kendala teknis.'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="pt-6 grid grid-cols-2 text-center text-xs">
                  <div className="space-y-12">
                    <p>Mengetahui,<br />Ketua Panitia CBT</p>
                    <p className="font-bold underline">Panitia Asesmen SPENTIC<br /><span className="font-normal text-[10px] text-slate-500">NIP. 19850312 201101 1 004</span></p>
                  </div>
                  <div className="space-y-12">
                    <p>Cihampelas, {new Date().toLocaleDateString('id-ID')}<br />Guru Pengawas Ruang</p>
                    <p className="font-bold underline">{room.supervisorName || 'Guru Pengawas'}<br /><span className="font-normal text-[10px] text-slate-500">Guru Pengawas CBT</span></p>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 print:hidden flex-wrap gap-2">
                <span className="text-[11px] text-slate-400">
                  Dokumen resmi Berita Acara Pelaksanaan (BAP) SMP Negeri 3 Cihampelas
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportSingleRoomBap(room)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                  >
                    <span>📥</span>
                    <span>Download Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                  >
                    <span>🖨️</span>
                    <span>Cetak Lembar BAP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBapRoom(null)}
                    className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 6G. MODAL PRATINJAU & CETAK REKAPITULASI BAP SEKOLAH (OFFICIAL SCHOOL SUMMARY) */}
      {showRekapPrintModal && (() => {
        let totalStudentsAll = 0;
        let totalPresentAll = 0;
        let totalSickAll = 0;
        let totalPermitAll = 0;
        let totalAbsentAll = 0;
        let totalBapSubmitted = 0;

        const roomRows = config.rooms.map((room, idx) => {
          const attendances = attendancesByRoomMap.get(room.name) || [];
          const latestAttendance = attendances[0];
          const isSubmitted = attendances.some(a => a.isBapSubmitted);
          if (isSubmitted) totalBapSubmitted++;

          const roomStudents = roomStudentsMap.get(room.id) || [];
          const uniqueClasses = Array.from(new Set(roomStudents.map(s => s.classId))).sort();
          totalStudentsAll += roomStudents.length;

          let presentCount = 0;
          let sickCount = 0;
          let permitCount = 0;
          let absentCount = 0;

          roomStudents.forEach(st => {
            const status = latestAttendance?.records?.[st.id] || 'H';
            if (status === 'H') presentCount++;
            else if (status === 'S') sickCount++;
            else if (status === 'I') permitCount++;
            else if (status === 'A') absentCount++;
          });

          totalPresentAll += presentCount;
          totalSickAll += sickCount;
          totalPermitAll += permitCount;
          totalAbsentAll += absentCount;

          return {
            no: idx + 1,
            roomName: room.name,
            classes: uniqueClasses.length > 0 ? uniqueClasses.join(', ') : room.classes.join(', '),
            supervisor: room.supervisorName || 'Guru Pengawas',
            total: roomStudents.length,
            present: presentCount,
            sick: sickCount,
            permit: permitCount,
            absent: absentCount,
            isSubmitted,
            notes: latestAttendance?.notes || '-'
          };
        });

        const currentDateStr = new Date().toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-scaleUp my-4 sm:my-8 relative">
              {/* Sticky Modal Control Bar */}
              <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs flex items-center justify-between pb-3 border-b border-slate-100 print:hidden -mx-6 sm:-mx-8 px-6 sm:px-8 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <span className="font-bold text-slate-900 text-sm">Dokumen Rekapitulasi BAP Pelaksanaan Asesmen Sekolah</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportSchoolBapExcel}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                    title="Unduh format spreadsheet Excel (.xlsx)"
                  >
                    <span>📥</span>
                    <span>Download Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                  >
                    <span>🖨️</span>
                    <span>Cetak Lembar Rekapitulasi (PDF / Cetak)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRekapPrintModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold cursor-pointer transition text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* AUTHENTIC OFFICIAL REKAPITULASI SHEET (PRINTABLE) */}
              <div className="border border-slate-300 rounded-2xl p-6 sm:p-8 bg-white text-slate-900 space-y-5 text-xs shadow-inner">
                {/* Kop Surat Sekolah */}
                <div className="text-center border-b-2 border-slate-900 pb-3 space-y-0.5">
                  <p className="font-bold text-[11px] uppercase tracking-wider text-slate-700">
                    Pemerintah Daerah Kabupaten Bandung Barat
                  </p>
                  <p className="font-bold text-[11px] uppercase tracking-wider text-slate-700">
                    Dinas Pendidikan
                  </p>
                  <h2 className="font-black text-sm sm:text-base uppercase tracking-wider text-slate-950">
                    SMP Negeri 3 Cihampelas
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    Jalan Babakan Caringin, Desa Cihampelas, Kec. Cihampelas, Kab. Bandung Barat 40562
                  </p>
                </div>

                {/* Title */}
                <div className="text-center space-y-1">
                  <h3 className="font-black text-sm uppercase tracking-wide underline underline-offset-4">
                    Rekapitulasi Berita Acara Pelaksanaan Asesmen Sumatif (CBT)
                  </h3>
                  <p className="text-[11px] font-mono font-medium text-slate-600">
                    Tahun Ajaran {config.academicYear || '2026/2027'} • {config.semester || 'PTS / STS Ganjil'} • Posko Panitia Asesmen CBT
                  </p>
                </div>

                {/* Summary Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Hari / Tanggal</span>
                    <strong className="text-slate-800">{currentDateStr}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Ruangan</span>
                    <strong className="text-slate-800">{config.rooms.length} Ruang Ujian</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Peserta Sekolah</span>
                    <strong className="text-slate-800">{totalStudentsAll} Siswa Terdaftar</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Kelengkapan BAP</span>
                    <strong className="text-emerald-700">{totalBapSubmitted} / {config.rooms.length} Terkirim</strong>
                  </div>
                </div>

                {/* Table of all 17 Rooms */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-300 text-[11px]">
                    <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                      <tr>
                        <th className="py-2 px-2 border border-slate-300 text-center w-8">No</th>
                        <th className="py-2 px-3 border border-slate-300 text-left">Ruang Ujian</th>
                        <th className="py-2 px-2 border border-slate-300 text-left">Kelas Sasaran</th>
                        <th className="py-2 px-3 border border-slate-300 text-left">Pengawas Ruang</th>
                        <th className="py-2 px-2 border border-slate-300 text-center">Jml</th>
                        <th className="py-2 px-2 border border-slate-300 text-center text-emerald-800">H</th>
                        <th className="py-2 px-2 border border-slate-300 text-center text-amber-800">S</th>
                        <th className="py-2 px-2 border border-slate-300 text-center text-amber-800">I</th>
                        <th className="py-2 px-2 border border-slate-300 text-center text-rose-800">A</th>
                        <th className="py-2 px-2 border border-slate-300 text-center">BAP</th>
                        <th className="py-2 px-3 border border-slate-300 text-left">Catatan Khusus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomRows.map(r => (
                        <tr key={r.no} className="border-b border-slate-200">
                          <td className="py-1 px-2 border border-slate-300 text-center font-bold">{r.no}</td>
                          <td className="py-1 px-3 border border-slate-300 font-semibold">{r.roomName}</td>
                          <td className="py-1 px-2 border border-slate-300">{r.classes}</td>
                          <td className="py-1 px-3 border border-slate-300">{r.supervisor}</td>
                          <td className="py-1 px-2 border border-slate-300 text-center font-bold">{r.total}</td>
                          <td className="py-1 px-2 border border-slate-300 text-center font-bold text-emerald-700">{r.present}</td>
                          <td className="py-1 px-2 border border-slate-300 text-center">{r.sick || '-'}</td>
                          <td className="py-1 px-2 border border-slate-300 text-center">{r.permit || '-'}</td>
                          <td className="py-1 px-2 border border-slate-300 text-center font-bold text-rose-700">{r.absent || '-'}</td>
                          <td className="py-1 px-2 border border-slate-300 text-center">
                            {r.isSubmitted ? (
                              <span className="font-bold text-emerald-700">✓ Lengkap</span>
                            ) : (
                              <span className="text-amber-700">⏳ Belum</span>
                            )}
                          </td>
                          <td className="py-1 px-3 border border-slate-300 text-slate-600 text-[10px] max-w-xs truncate">{r.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-900">
                      <tr>
                        <td colSpan={4} className="py-2 px-3 border border-slate-300 text-right uppercase">Total Akumulasi Sekolah:</td>
                        <td className="py-2 px-2 border border-slate-300 text-center font-bold">{totalStudentsAll}</td>
                        <td className="py-2 px-2 border border-slate-300 text-center font-bold text-emerald-700">{totalPresentAll}</td>
                        <td className="py-2 px-2 border border-slate-300 text-center font-bold text-amber-700">{totalSickAll}</td>
                        <td className="py-2 px-2 border border-slate-300 text-center font-bold text-amber-700">{totalPermitAll}</td>
                        <td className="py-2 px-2 border border-slate-300 text-center font-bold text-rose-700">{totalAbsentAll}</td>
                        <td className="py-2 px-2 border border-slate-300 text-center font-bold text-emerald-800">{totalBapSubmitted}/{config.rooms.length}</td>
                        <td className="py-2 px-3 border border-slate-300 text-slate-700 text-[10px]">
                          Tingkat Kehadiran: {totalStudentsAll > 0 ? ((totalPresentAll / totalStudentsAll) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Signatures */}
                <div className="pt-6 grid grid-cols-2 text-center text-xs">
                  <div className="space-y-12">
                    <p>Mengetahui,<br />Kepala SMP Negeri 3 Cihampelas</p>
                    <p className="font-bold underline">H. Rustandi, S.Pd., M.Pd.<br /><span className="font-normal text-[10px] text-slate-500">NIP. 19700608 199802 1 001</span></p>
                  </div>
                  <div className="space-y-12">
                    <p>Cihampelas, {new Date().toLocaleDateString('id-ID')}<br />Ketua Panitia Asesmen CBT</p>
                    <p className="font-bold underline">Panitia Asesmen SPENTIC<br /><span className="font-normal text-[10px] text-slate-500">NIP. 19850312 201101 1 004</span></p>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 print:hidden flex-wrap gap-2">
                <span className="text-[11px] text-slate-400">
                  Dokumen resmi Rekapitulasi Berita Acara Pelaksanaan (BAP) SMP Negeri 3 Cihampelas
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportSchoolBapExcel}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                    title="Unduh format spreadsheet Excel (.xlsx)"
                  >
                    <span>📥</span>
                    <span>Download Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                  >
                    <span>🖨️</span>
                    <span>Cetak Lembar Rekapitulasi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRekapPrintModal(false)}
                    className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 6H. MODAL PENDAFTARAN SISWA DARURAT DI POSKO PANITIA (TERKONEKSI KE MASTER DATA SEKOLAH) */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl border border-indigo-200 animate-scaleUp my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg shadow-2xs">
                  👤➕
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Daftarkan Siswa Darurat ke CBT
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tersimpan otomatis ke Master Siswa Sekolah & Ruang Ujian CBT
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold cursor-pointer transition text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterEmergencyStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Siswa: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Rizki Pratama"
                  value={emName}
                  onChange={(e) => setEmName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NISN Siswa: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 0098765432"
                    value={emNisn}
                    onChange={(e) => setEmNisn(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin: <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEmGender('L')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        emGender === 'L'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-extrabold shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      👦 Laki-laki
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmGender('P')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        emGender === 'P'
                          ? 'bg-pink-50 border-pink-500 text-pink-700 font-extrabold shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      👧 Perempuan
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rombel / Kelas Asal: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={emClass}
                    onChange={(e) => setEmClass(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {SCHOOL_CLASSES.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alokasikan ke Ruangan: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={emTargetRoomId}
                    onChange={(e) => setEmTargetRoomId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {config.rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.supervisorName || 'Pengawas Ruang'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <span>💡</span>
                  <span>Sinkronisasi Otomatis Terjamin:</span>
                </div>
                <p>
                  Siswa ini dapat langsung login CBT dengan <strong>NISN</strong>, otomatis masuk ke lembar presensi Pengawas Ruang, dan terdaftar permanen di Master Siswa Sekolah.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 cursor-pointer active:scale-95"
                >
                  Simpan & Daftarkan Siswa ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
