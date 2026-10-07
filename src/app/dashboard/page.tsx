'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSchoolData, Leader, Teacher, DataPokok } from '@/lib/schoolData';
import { 
  Student, 
  SCHOOL_CLASSES, 
  INITIAL_STUDENTS, 
  getStoredStudents, 
  saveStoredStudents 
} from '@/lib/elearningData';
import { downloadStudentTemplateExcel } from '@/lib/elearningExport';

// Isolated Clock Component to prevent whole dashboard re-renders every 1000ms
const DashboardClock = React.memo(function DashboardClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span>{time || 'Memuat...'}</span>;
});

export default function DashboardPage() {
  const router = useRouter();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'overview' | 'warta' | 'siswa' | 'pimpinan' | 'agenda' | 'galeri' | 'pesan' | 'pengaturan'>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- MOCK DATA STATES ---
  // --- STUDENTS & CLASS MANAGEMENT STATE ---
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('ALL');
  const [studentPage, setStudentPage] = useState(1);
  const STUDENTS_PER_PAGE = 25;
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    name: '',
    nisn: '',
    nis: '',
    classId: '7-A'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStudentsList(getStoredStudents());
    const handleUpdate = () => setStudentsList(getStoredStudents());
    window.addEventListener('elearningStudentsUpdated', handleUpdate);
    return () => window.removeEventListener('elearningStudentsUpdated', handleUpdate);
  }, []);

  useEffect(() => {
    setStudentPage(1);
  }, [studentSearch, studentClassFilter]);

  const [newsList, setNewsList] = useState([
    {
      id: 1,
      title: 'Siswa SMPN 3 Cihampelas Sabet Juara 1 Porseni Basket KBB 2026',
      category: 'Prestasi',
      date: '22 Sep 2026',
      views: '1.4k',
      status: 'Published',
      src: '/gallery_2.jpg'
    },
    {
      id: 2,
      title: 'Pembukaan Jalur Zonasi PPDB Tahun Ajaran 2026/2027',
      category: 'Pengumuman',
      date: '18 Sep 2026',
      views: '3.2k',
      status: 'Published',
      src: '/slide1.jpeg'
    },
    {
      id: 3,
      title: 'Workshop Robotika & Pemrograman AI Tingkat Menengah Pertama',
      category: 'Inovasi',
      date: '14 Sep 2026',
      views: '920',
      status: 'Published',
      src: '/slide4.jpeg'
    },
    {
      id: 4,
      title: 'Pelaksanaan Asesmen Sumatif Tengah Semester (CBT Berbasis Digital)',
      category: 'Akademik',
      date: '10 Sep 2026',
      views: '2.1k',
      status: 'Draft',
      src: '/gallery_1.jpg'
    },
  ]);

  // School Data Store (Synchronized with Landing Page via LocalStorage & Custom Events)
  const { 
    leaders: storedLeaders, 
    teachers: storedTeachers, 
    dataPokok: storedDataPokok, 
    setLeaders: saveLeaders, 
    setTeachers: saveTeachers, 
    setDataPokok: saveDataPokok,
    resetData: resetSchoolData
  } = useSchoolData();

  // Pimpinan Sekolah (Kepala Sekolah & Wakasek)
  const [leadersList, setLeadersList] = useState<Leader[]>(storedLeaders);
  // Dewan Guru & Tenaga Kependidikan
  const [teachersList, setTeachersList] = useState<Teacher[]>(storedTeachers);
  // Data Pokok Statistik Sekolah
  const [dataPokok, setDataPokok] = useState<DataPokok>(storedDataPokok);

  // Keep local state in sync whenever stored data changes
  useEffect(() => {
    setLeadersList(storedLeaders);
  }, [storedLeaders]);

  useEffect(() => {
    setTeachersList(storedTeachers);
  }, [storedTeachers]);

  useEffect(() => {
    setDataPokok(storedDataPokok);
  }, [storedDataPokok]);

  const [agendaList, setAgendaList] = useState([
    { id: 1, name: 'Masa Pengenalan Lingkungan Sekolah (MPLS)', date: '15 - 20 Juli 2026', category: 'Akademik', status: 'Selesai' },
    { id: 2, name: 'Upacara Peringatan Hari Kemerdekaan RI Ke-81', date: '17 Agustus 2026', category: 'Kegiatan', status: 'Selesai' },
    { id: 3, name: 'Asesmen Tengah Semester (Sumatif) Ganjil', date: '21 - 26 September 2026', category: 'Ujian CBT', status: 'Berlangsung' },
    { id: 4, name: 'Asesmen Akhir Semester (PAS) Berbasis Digital', date: '04 - 12 Desember 2026', category: 'Ujian CBT', status: 'Mendatang' },
    { id: 5, name: 'Gelar Karya P5 Kewirausahaan & Pentas Seni', date: '18 Desember 2026', category: 'Kreativitas', status: 'Mendatang' },
  ]);

  const [galleryList, setGalleryList] = useState([
    { id: 1, title: 'Laboratorium Komputer & Digital 4.0', category: 'FASILITAS', src: '/gallery_2.jpg' },
    { id: 2, title: 'Perpustakaan Digital Terpadu', category: 'FASILITAS', src: '/gallery_1.jpg' },
    { id: 3, title: 'Upacara Bendera & Pembinaan Karakter', category: 'KEGIATAN', src: '/slide1.jpeg' },
    { id: 4, title: 'Turnamen & Kejuaraan Olahraga KBB', category: 'EKSTRAKURIKULER', src: '/slide3.jpeg' },
    { id: 5, title: 'Creative STEM & Robotika Room', category: 'FASILITAS', src: '/slide4.jpeg' },
    { id: 6, title: 'Praktikum Sains & Kolaborasi Kelas', category: 'AKADEMIK', src: '/slide7.jpeg' },
  ]);

  const [messagesList, setMessagesList] = useState([
    {
      id: 1,
      sender: 'Rina Kusuma (Wali Murid)',
      contact: '0812-3456-7890 · rina.kusuma@gmail.com',
      date: 'Hari ini, 14:20',
      subject: 'Pertanyaan Alur Verifikasi Berkas PPDB',
      message: 'Selamat siang bapak/ibu panitia, untuk pendaftaran PPDB jalur prestasi apakah sertifikat kejuaraan tingkat kabupaten perlu dilegalisir dinas?',
      read: false
    },
    {
      id: 2,
      sender: 'Dedi Suryadi (Komite Sekolah)',
      contact: '0813-9876-5432 · dedi.suryadi@gmail.com',
      date: 'Kemarin, 09:45',
      subject: 'Jadwal Rapat Koordinasi Program Smart Campus',
      message: 'Menindaklanjuti rencana penambahan perangkat IoT laboratorium, kami usulkan pertemuan koordinasi hari Jumat pekan depan.',
      read: true
    },
    {
      id: 3,
      sender: 'Ahmad Fauzi (Alumni 2023)',
      contact: '0857-1122-3344 · ahmad.alumni@yahoo.com',
      date: '22 Sep 2026',
      subject: 'Permohonan Legalisir Ijazah Digital',
      message: 'Permisi staf TU, apakah layanan legalisir ijazah bisa dikirimkan salinan dokumen yang sudah bertanda tangan elektronik?',
      read: true
    }
  ]);

  // --- MODAL STATES ---
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Prestasi');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newImage, setNewImage] = useState('/slide6.jpeg');

  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [newAgendaName, setNewAgendaName] = useState('');
  const [newAgendaDate, setNewAgendaDate] = useState('');
  const [newAgendaCategory, setNewAgendaCategory] = useState('Akademik');

  // Modal Pimpinan
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<any | null>(null);
  const [leaderFormName, setLeaderFormName] = useState('');
  const [leaderFormRole, setLeaderFormRole] = useState('');
  const [leaderFormNip, setLeaderFormNip] = useState('');
  const [leaderFormQuote, setLeaderFormQuote] = useState('');
  const [leaderFormPhoto, setLeaderFormPhoto] = useState('/teachers/default_avatar.svg');

  // Modal Tambah Guru
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('');
  const [newTeacherNip, setNewTeacherNip] = useState('');
  const [newTeacherStatus, setNewTeacherStatus] = useState('PNS');
  const [newTeacherPhoto, setNewTeacherPhoto] = useState('/teachers/default_avatar.svg');

  // Modal Edit Guru
  const [isEditTeacherModalOpen, setIsEditTeacherModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editTeacherSubject, setEditTeacherSubject] = useState('');
  const [editTeacherNip, setEditTeacherNip] = useState('');
  const [editTeacherStatus, setEditTeacherStatus] = useState('PNS');
  const [editTeacherPhoto, setEditTeacherPhoto] = useState('/teachers/default_avatar.svg');
  const [editTeacherActive, setEditTeacherActive] = useState(true);

  const [teacherSearch, setTeacherSearch] = useState('');

  const PHOTO_PRESETS = [
    { label: 'Avatar Default (Kosong)', src: '/teachers/default_avatar.svg' },
    { label: 'Foto Resmi 1', src: '/teachers/teacher_1.jpg' },
    { label: 'Foto Resmi 2', src: '/teachers/teacher_2.jpg' },
    { label: 'Foto Resmi 3', src: '/teachers/teacher_3.jpg' }
  ];

  // Search in News CMS
  const [newsSearch, setNewsSearch] = useState('');
  const [newsFilter, setNewsFilter] = useState('SEMUA');

  // Handlers
  const handleAddNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem = {
      id: Date.now(),
      title: newTitle,
      category: newCategory,
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      views: '0',
      status: 'Published',
      src: newImage
    };

    setNewsList([newItem, ...newsList]);
    setNewTitle('');
    setNewExcerpt('');
    setIsNewsModalOpen(false);
    showToast('✨ Warta baru berhasil diterbitkan ke website!');
  };

  const handleDeleteNews = (id: number) => {
    setNewsList(newsList.filter(n => n.id !== id));
    showToast('🗑️ Artikel warta telah dihapus.');
  };

  const handleAddAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgendaName.trim()) return;

    const newItem = {
      id: Date.now(),
      name: newAgendaName,
      date: newAgendaDate || 'Mendatang',
      category: newAgendaCategory,
      status: 'Mendatang'
    };

    setAgendaList([...agendaList, newItem]);
    setNewAgendaName('');
    setNewAgendaDate('');
    setIsAgendaModalOpen(false);
    showToast('📅 Agenda akademik baru berhasil ditambahkan.');
  };

  const handleDeleteAgenda = (id: number) => {
    setAgendaList(agendaList.filter(a => a.id !== id));
    showToast('🗑️ Agenda berhasil dihapus.');
  };

  // Pimpinan & Guru Handlers
  const handleOpenEditLeader = (leader: any) => {
    setSelectedLeader(leader);
    setLeaderFormName(leader.name);
    setLeaderFormRole(leader.role);
    setLeaderFormNip(leader.nip);
    setLeaderFormQuote(leader.quote);
    setLeaderFormPhoto(leader.photo || '/teachers/headmaster.jpg');
    setIsLeaderModalOpen(true);
  };

  const handleSaveLeader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeader) return;
    const updated = leadersList.map(l => l.id === selectedLeader.id ? {
      ...l,
      name: leaderFormName,
      role: leaderFormRole,
      nip: leaderFormNip,
      quote: leaderFormQuote,
      photo: leaderFormPhoto
    } : l);
    setLeadersList(updated);
    saveLeaders(updated);
    setIsLeaderModalOpen(false);
    showToast(`✅ Data pimpinan "${leaderFormName}" tersimpan & tampil di Landing Page!`);
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;
    const newT: Teacher = {
      id: Date.now(),
      name: newTeacherName,
      subject: newTeacherSubject || 'Guru Mata Pelajaran',
      nip: newTeacherNip || '-',
      status: newTeacherStatus,
      photo: newTeacherPhoto,
      active: true,
      category: 'MIPA',
      role: newTeacherSubject || 'Guru Mata Pelajaran',
      quote: 'Mendidik dengan keteladanan dan budi pekerti luhur.'
    };
    const updated = [newT, ...teachersList];
    setTeachersList(updated);
    saveTeachers(updated);
    setNewTeacherName('');
    setNewTeacherSubject('');
    setNewTeacherNip('');
    setNewTeacherPhoto('/teachers/teacher_1.jpg');
    setIsTeacherModalOpen(false);
    showToast(`👨‍🏫 Guru baru "${newT.name}" berhasil ditambahkan ke direktori & Landing Page.`);
  };

  const handleOpenEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setEditTeacherName(teacher.name);
    setEditTeacherSubject(teacher.subject);
    setEditTeacherNip(teacher.nip);
    setEditTeacherStatus(teacher.status);
    setEditTeacherPhoto(teacher.photo || '/teachers/teacher_1.jpg');
    setEditTeacherActive(teacher.active !== false);
    setIsEditTeacherModalOpen(true);
  };

  const handleSaveEditTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    const updated = teachersList.map(t => t.id === selectedTeacher.id ? {
      ...t,
      name: editTeacherName,
      subject: editTeacherSubject,
      nip: editTeacherNip,
      status: editTeacherStatus,
      photo: editTeacherPhoto,
      active: editTeacherActive
    } : t);
    setTeachersList(updated);
    saveTeachers(updated);
    setIsEditTeacherModalOpen(false);
    showToast(`✅ Data guru "${editTeacherName}" tersimpan & tampil di Landing Page!`);
  };

  const handleToggleTeacherActive = (id: number) => {
    const updated = teachersList.map(t => {
      if (t.id === id) {
        const nextActive = !t.active;
        showToast(nextActive ? `Guru "${t.name}" diaktifkan kembali di Landing Page.` : `Guru "${t.name}" dinonaktifkan / mutasi di Landing Page.`);
        return { ...t, active: nextActive };
      }
      return t;
    });
    setTeachersList(updated);
    saveTeachers(updated);
  };

  const handleDeleteTeacher = (id: number) => {
    const updated = teachersList.filter(t => t.id !== id);
    setTeachersList(updated);
    saveTeachers(updated);
    showToast('🗑️ Data guru telah dihapus dari direktori & Landing Page.');
  };

  const handleSaveDataPokok = () => {
    saveDataPokok(dataPokok);
    showToast('✅ Angka statistik Data Pokok berhasil diperbarui ke Landing Page!');
  };

  const handleDeleteGallery = (id: number) => {
    setGalleryList(galleryList.filter(g => g.id !== id));
    showToast('🗑️ Foto telah dihapus dari galeri.');
  };

  const handleDeleteMessage = (id: number) => {
    setMessagesList(messagesList.filter(m => m.id !== id));
    showToast('🗑️ Pesan berhasil dihapus.');
  };

  const handleLogout = () => {
    showToast('Keluar dari sesi admin...');
    setTimeout(() => {
      router.push('/login');
    }, 500);
  };

  // Filtered news
  const filteredNews = newsList.filter(n => {
    const matchCategory = newsFilter === 'SEMUA' || n.category.toUpperCase() === newsFilter;
    const matchSearch = n.title.toLowerCase().includes(newsSearch.toLowerCase());
    return matchCategory && matchSearch;
  });

  // --- HANDLERS FOR STUDENT MANAGEMENT ---
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });
        
        let allImported: Student[] = [];

        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (rawJson.length < 2) return;

          let headerRowIndex = 0;
          let colNISN = -1, colNIS = -1, colName = -1, colClass = -1;

          for (let r = 0; r < Math.min(rawJson.length, 6); r++) {
            const row = rawJson[r];
            if (!Array.isArray(row)) continue;
            row.forEach((cell: any, cIdx: number) => {
              const cellStr = String(cell || '').toLowerCase().trim();
              if (cellStr.includes('nisn')) colNISN = cIdx;
              else if (cellStr === 'nis') colNIS = cIdx;
              else if (cellStr.includes('nama')) colName = cIdx;
              else if (cellStr.includes('kelas') || cellStr.includes('rombel')) colClass = cIdx;
            });
            if (colName !== -1) {
              headerRowIndex = r;
              break;
            }
          }

          if (colName === -1) {
            colNISN = 1;
            colNIS = 2;
            colName = 3;
            colClass = 4;
          }

          for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
            const row = rawJson[r];
            if (!row || !row[colName]) continue;

            const rawName = String(row[colName] || '').trim();
            if (!rawName || rawName.toLowerCase() === 'nama siswa' || rawName.toLowerCase() === 'nama') continue;

            const rawNisn = String(row[colNISN] || '').replace(/[^0-9]/g, '').trim() || `01${Math.floor(10000000 + Math.random() * 90000000)}`;
            const rawNis = colNIS !== -1 && row[colNIS] ? String(row[colNIS]).trim() : '';
            
            let rawClass = colClass !== -1 && row[colClass] ? String(row[colClass]).toUpperCase().trim() : '';
            if (!rawClass) {
              rawClass = sheetName.toUpperCase().trim();
            }
            rawClass = rawClass.replace(/KELAS\s*/i, '').replace(/\s+/g, '');
            if (/^[789][A-F]$/.test(rawClass)) {
              rawClass = `${rawClass[0]}-${rawClass[1]}`;
            }
            if (!rawClass || !rawClass.includes('-')) {
              rawClass = '7-A';
            }

            allImported.push({
              id: `${rawClass.replace('-', '')}-${String(allImported.length + 1).padStart(2, '0')}`,
              nisn: rawNisn,
              nis: rawNis,
              name: rawName,
              classId: rawClass,
              gender: '-'
            });
          }
        });

        if (allImported.length === 0) {
          showToast('Tidak ada data siswa yang valid ditemukan di file Excel!');
          return;
        }

        saveStoredStudents(allImported);
        setStudentsList(allImported);
        showToast(`Alhamdulillah! Berhasil mengimpor ${allImported.length} siswa baru ke sistem!`);
      } catch (err: any) {
        console.error('Import error:', err);
        showToast('Gagal memproses file Excel: ' + (err.message || 'Format tidak sesuai'));
      } finally {
        if (e.target) e.target.value = '';
      }
    };
      reader.readAsBinaryString(file);
    } catch (err: any) {
      console.error('Import module error:', err);
      showToast('Gagal memuat modul Excel: ' + (err.message || 'Error'));
    }
  };

  const handleAddStudentManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentData.name.trim()) {
      showToast('Nama siswa wajib diisi!');
      return;
    }
    const newStudent: Student = {
      id: `${newStudentData.classId.replace('-', '')}-${String(studentsList.length + 1).padStart(2, '0')}`,
      name: newStudentData.name.trim(),
      nisn: newStudentData.nisn.trim() || `01${Math.floor(10000000 + Math.random() * 90000000)}`,
      nis: newStudentData.nis.trim() || '',
      classId: newStudentData.classId,
      gender: '-'
    };
    const updated = [newStudent, ...studentsList];
    saveStoredStudents(updated);
    setStudentsList(updated);
    setIsAddStudentModalOpen(false);
    setNewStudentData({ name: '', nisn: '', nis: '', classId: '7-A' });
    showToast(`Siswa "${newStudent.name}" berhasil ditambahkan ke ${newStudent.classId}!`);
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    if (!confirm(`Yakin ingin menghapus data siswa "${studentName}"?`)) return;
    const updated = studentsList.filter(s => s.id !== studentId);
    saveStoredStudents(updated);
    setStudentsList(updated);
    showToast(`Data siswa "${studentName}" berhasil dihapus.`);
  };

  const handleResetStudents = () => {
    if (!confirm('Yakin ingin mereset seluruh data kembali ke daftar 535 siswa awal 2026/2027?')) return;
    saveStoredStudents(INITIAL_STUDENTS);
    setStudentsList(INITIAL_STUDENTS);
    showToast('Data siswa berhasil direset ke 535 siswa awal!');
  };

  // Filtered Students (Memoized for optimal responsive performance)
  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase().trim();
    return studentsList.filter(s => {
      const matchClass = studentClassFilter === 'ALL' || s.classId === studentClassFilter;
      const matchSearch = !q || 
        s.name.toLowerCase().includes(q) || 
        s.nisn.includes(q) || 
        (s.nis && s.nis.includes(q));
      return matchClass && matchSearch;
    });
  }, [studentsList, studentClassFilter, studentSearch]);

  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * STUDENTS_PER_PAGE;
    return filteredStudents.slice(start, start + STUDENTS_PER_PAGE);
  }, [filteredStudents, studentPage]);

  // Filtered teachers (Memoized)
  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.toLowerCase().trim();
    if (!q) return teachersList;
    return teachersList.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.subject.toLowerCase().includes(q)
    );
  }, [teachersList, teacherSearch]);

  return (
    <div className="theme-marklab-app min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col antialiased selection:bg-indigo-500/25 selection:text-indigo-900 font-dashboard">
      
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-indigo-200 text-slate-900 text-xs sm:text-sm font-medium shadow-2xl backdrop-blur-xl animate-[fadeIn_0.2s_ease-out]">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[700px] h-[400px] bg-indigo-100/40 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-purple-100/35 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ========================================================================= */}
        {/* SIDEBAR NAVIGATION */}
        {/* ========================================================================= */}
        <aside 
          className={`fixed inset-y-0 left-0 z-40 w-64 sm:w-72 bg-white border-r-2 border-slate-200 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
            mobileSidebarOpen ? 'translate-x-0 shadow-2xl shadow-slate-950/20' : '-translate-x-full'
          }`}
        >
          {/* Top Brand Identity */}
          <div>
            <div className="p-5 sm:p-6 border-b-2 border-slate-100 flex items-center justify-between">
              <button 
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  setMobileSidebarOpen(false);
                }} 
                className="flex items-center gap-3 group text-left cursor-pointer transition-transform active:scale-98"
                title="Buka Ringkasan Dashboard"
              >
                <div className="relative w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
                  <Image 
                    src="/logo.png" 
                    alt="Logo SMPN 3 Cihampelas" 
                    width={40} 
                    height={40} 
                    className="w-full h-full object-contain drop-shadow-sm"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold tracking-tight text-slate-950 flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                    SMPN 3 Cihampelas
                  </span>
                  <span className="text-[11px] font-mono text-indigo-700 font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    Admin Portal
                  </span>
                </div>
              </button>

              {/* Close button for mobile */}
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden w-8 h-8 rounded-xl text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Navigation Menu Links */}
            <nav className="p-3 sm:p-4 space-y-1.5">
              {[
                {
                  id: 'overview',
                  label: 'Ringkasan',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect width="7" height="9" x="3" y="3" rx="1" />
                      <rect width="7" height="5" x="14" y="3" rx="1" />
                      <rect width="7" height="9" x="14" y="12" rx="1" />
                      <rect width="7" height="5" x="3" y="16" rx="1" />
                    </svg>
                  ),
                  badge: null
                },
                {
                  id: 'warta',
                  label: 'Kelola Warta',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                      <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z" />
                    </svg>
                  ),
                  badge: `${newsList.length}`
                },
                {
                  id: 'siswa',
                  label: 'Data Siswa & Rombel',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                  badge: `${studentsList.length}`
                },
                {
                  id: 'pimpinan',
                  label: 'Pimpinan & Guru (GTK)',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                  badge: `${leadersList.length + teachersList.length}`
                },
                  {
                  id: 'agenda',
                  label: 'Kalender Akademik',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect width="18" height="18" x="3" y="4" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                  ),
                  badge: `${agendaList.length}`
                },
                {
                  id: 'galeri',
                  label: 'Galeri & Fasilitas',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  ),
                  badge: `${galleryList.length}`
                },
                {
                  id: 'pesan',
                  label: 'Pesan Masuk',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  ),
                  badge: `${messagesList.filter(m => !m.read).length}`
                },
                {
                  id: 'pengaturan',
                  label: 'Pengaturan Web',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ),
                  badge: null
                }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm tracking-wide transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-bold'
                      : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100 font-bold border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={activeTab === item.id ? 'text-white' : 'text-slate-600'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold border ${
                      activeTab === item.id
                        ? 'bg-white text-indigo-700 border-white'
                        : 'bg-slate-200 text-slate-800 border-slate-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Bottom Admin User Capsule & Logout */}
          <div className="p-4 border-t-2 border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white border-2 border-slate-200 shadow-xs mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 border border-indigo-500 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
                  AD
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-slate-950">Administrator</span>
                  <span className="text-[11px] text-slate-700 font-mono font-semibold">admin@smpn3.sch.id</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-800 text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Keluar (Logout)</span>
            </button>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {mobileSidebarOpen && (
          <div 
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* ========================================================================= */}
        {/* MAIN DASHBOARD CONTENT AREA */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

          {/* Top Header Bar */}
          <header className="sticky top-0 z-20 w-full h-16 bg-white/95 backdrop-blur-xl border-b-2 border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4 shadow-xs">
            
            {/* Left Header: Mobile Toggle & Page Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-100 border-2 border-slate-300 text-slate-900 hover:bg-slate-200"
                aria-label="Buka Menu"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-slate-950 capitalize tracking-tight">
                  {activeTab === 'overview' && 'Ringkasan Sistem & Konten'}
                  {activeTab === 'warta' && 'Manajemen Warta & Berita'}
                  {activeTab === 'siswa' && 'Manajemen Data Siswa & Rombel'}
                  {activeTab === 'pimpinan' && 'Manajemen Pimpinan & Guru (GTK)'}
                    {activeTab === 'agenda' && 'Kalender & Agenda Akademik'}
                  {activeTab === 'galeri' && 'Manajemen Galeri & Fasilitas'}
                  {activeTab === 'pesan' && 'Kotak Pesan Masuk Wali Murid'}
                  {activeTab === 'pengaturan' && 'Pengaturan Profil & Website'}
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold text-emerald-900 border-2 border-emerald-300 bg-emerald-100">
                  v1.0 Live
                </span>
              </div>
            </div>

            {/* Right Header: Clock, View Website Button, Notification */}
            <div className="flex items-center gap-2 sm:gap-4">
              
              {/* Live Clock Indicator */}
              <div className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border-2 border-slate-300 text-xs font-mono text-slate-900 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <DashboardClock />
              </div>

              {/* View Public Website */}
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-white hover:bg-slate-100 border-2 border-slate-300 text-xs font-extrabold text-slate-900 transition-all hover:border-indigo-400 hover:text-indigo-600 shadow-xs"
              >
                <span>Lihat Website</span>
                <span className="text-xs text-indigo-600 font-bold">↗</span>
              </Link>
            </div>
          </header>

          {/* Main Body View */}
          <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">

            {/* ========================================================================= */}
            {/* TAB 1: OVERVIEW (RINGKASAN) */}
            {/* ========================================================================= */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                
                {/* 4 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  {[
                    {
                      label: 'Warta Terbit',
                      value: `${newsList.length}`,
                      desc: '+2 minggu ini',
                      icon: '📰',
                    },
                    {
                      label: 'Pimpinan & Guru',
                      value: `${leadersList.length + teachersList.length}`,
                      desc: `${leadersList.length} Pimpinan · ${teachersList.length} Guru Aktif`,
                      icon: '👨‍🏫',
                    },
                    {
                      label: 'Agenda Sekolah',
                      value: `${agendaList.length}`,
                      desc: '2 aktif bulan ini',
                      icon: '📅',
                    },
                    {
                      label: 'Pesan Masuk',
                      value: `${messagesList.length}`,
                      desc: `${messagesList.filter(m => !m.read).length} belum dibaca`,
                      icon: '💬',
                    }
                  ].map((stat, i) => (
                    <div 
                      key={i}
                      className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{stat.label}</span>
                        <span className="text-2xl">{stat.icon}</span>
                      </div>
                      <div className="text-3xl font-black text-slate-950 tracking-tight mb-1">
                        {stat.value}
                      </div>
                      <div className="text-xs font-extrabold text-indigo-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                        <span>{stat.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions Row */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-indigo-700 text-xl font-black">
                      ⚡
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-950">Aksi Cepat Pengelolaan</h3>
                      <p className="text-xs text-slate-700 font-semibold">Perbarui konten website langsung dari panel di bawah</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={() => setIsNewsModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <span>+ Tulis Warta Baru</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('pimpinan')}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-900 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                    >
                      <span>👨‍🏫 Kelola Pimpinan & Guru</span>
                    </button>
                    <button
                      onClick={() => setIsAgendaModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-900 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                    >
                      <span>+ Tambah Agenda</span>
                    </button>
                  </div>
                </div>

                {/* Grid 2 Column: Warta Terbaru + Agenda Terdekat */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Recent News (7 Cols) */}
                  <div className="lg:col-span-7 rounded-2xl bg-white border-2 border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3.5 border-b-2 border-slate-100">
                      <div>
                        <h3 className="text-base font-black text-slate-950">Warta & Berita Tayang</h3>
                        <p className="text-xs text-slate-700 font-semibold">Status artikel di halaman bento grid</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('warta')}
                        className="text-xs font-black text-indigo-700 hover:text-indigo-900 transition-colors"
                      >
                        Lihat Semua →
                      </button>
                    </div>

                    <div className="space-y-3">
                      {newsList.slice(0, 3).map((item) => (
                        <div 
                          key={item.id}
                          className="p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 hover:border-indigo-400 hover:bg-white transition-all flex items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl overflow-hidden relative flex-shrink-0 bg-slate-200 border border-slate-300">
                              <Image src={item.src} alt={item.title} fill className="object-cover" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold text-indigo-800 border border-indigo-300 bg-indigo-50">
                                  {item.category}
                                </span>
                                <span className="text-xs text-slate-700 font-mono font-bold">{item.date}</span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-950 truncate max-w-sm">
                                {item.title}
                              </h4>
                            </div>
                          </div>
                          <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Upcoming Agenda & System Health (5 Cols) */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Agenda Card */}
                    <div className="rounded-2xl bg-white border-2 border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-3.5 border-b-2 border-slate-100">
                        <h3 className="text-base font-black text-slate-950">Agenda Akademik Terdekat</h3>
                        <button 
                          onClick={() => setActiveTab('agenda')}
                          className="text-xs font-black text-indigo-700 hover:text-indigo-900"
                        >
                          Kelola →
                        </button>
                      </div>

                      <div className="space-y-3">
                        {agendaList.slice(0, 3).map((agenda) => (
                          <div key={agenda.id} className="p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 flex items-center justify-between shadow-xs">
                            <div>
                              <h5 className="text-sm text-slate-950 font-bold mb-1">{agenda.name}</h5>
                              <p className="text-xs font-mono font-extrabold text-indigo-700">{agenda.date}</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-800 px-2.5 py-1 rounded-full bg-white border border-slate-300">
                              {agenda.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* System Server Health */}
                    <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-800 text-sm font-black">
                          ●
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-950">Sistem Sekolah Berjalan Normal</p>
                          <p className="text-xs text-slate-700 font-mono font-semibold">Next.js 16 (App Router) · Turbopack</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-extrabold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                        99.9% Uptime
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: KELOLA WARTA & BERITA (NEWS CMS) */}
            {/* ========================================================================= */}
            {activeTab === 'warta' && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                
                {/* CMS Header & Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
                  <div>
                    <h2 className="text-xl font-black text-slate-950 tracking-tight">Manajemen Warta & Berita</h2>
                    <p className="text-xs text-slate-700 font-semibold mt-0.5">Kelola artikel warta yang tampil pada Bento Grid halaman utama</p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setIsNewsModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
                    >
                      <span>+ Tulis Warta Baru</span>
                    </button>
                  </div>
                </div>

                {/* Filters & Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {['SEMUA', 'PRESTASI', 'PENGUMUMAN', 'INOVASI', 'AKADEMIK'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setNewsFilter(cat)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-mono font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                          newsFilter === cat
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-slate-800 border-2 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={newsSearch}
                      onChange={(e) => setNewsSearch(e.target.value)}
                      placeholder="Cari judul warta..."
                      className="w-full sm:w-64 pl-8 pr-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-bold">
                      🔍
                    </span>
                  </div>
                </div>

                {/* Table of Articles */}
                <div className="rounded-2xl bg-white border-2 border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-900 font-mono uppercase text-xs tracking-wider border-b-2 border-slate-300 font-black">
                        <tr>
                          <th className="py-4 px-4 sm:px-6">Artikel</th>
                          <th className="py-4 px-4">Kategori</th>
                          <th className="py-4 px-4">Tanggal</th>
                          <th className="py-4 px-4">Status</th>
                          <th className="py-4 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800">
                        {filteredNews.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-4 sm:px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden relative flex-shrink-0 bg-slate-200 border border-slate-300">
                                  <Image src={item.src} alt={item.title} fill className="object-cover" />
                                </div>
                                <span className="font-black text-slate-950 text-sm max-w-md truncate">
                                  {item.title}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold text-indigo-900 border border-indigo-300 bg-indigo-50">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-700 font-mono font-bold text-xs">{item.date}</td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold ${
                                item.status === 'Published'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => showToast(`Fitur edit "${item.title.substring(0, 20)}..." dibuka.`)}
                                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
                                  title="Edit Warta"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteNews(item.id)}
                                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 transition-colors"
                                  title="Hapus Warta"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredNews.length === 0 && (
                    <div className="py-12 text-center text-slate-700 text-xs font-bold">
                      Tidak ada artikel yang cocok dengan pencarian.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB: DATA SISWA & ROMBEL (STUDENT MANAGEMENT & EXCEL IMPORT) */}
            {/* ========================================================================= */}
            {activeTab === 'siswa' && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                
                {/* Header Action Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-800 text-[10px] font-mono font-black uppercase mb-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                      Database Peserta Didik
                    </div>
                    <h2 className="text-xl font-black text-slate-950 tracking-tight">
                      Data Siswa & Rombongan Belajar <span className="font-extrabold text-indigo-700">(2026/2027)</span>
                    </h2>
                    <p className="text-xs text-slate-700 font-semibold mt-0.5">
                      Kelola daftar resmi peserta didik. Seluruh data di sini otomatis tersinkronisasi ke modul Presensi & E-Learning kelas.
                    </p>
                  </div>

                  {/* Actions: Download Template, Upload Excel, Add Student, Reset */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Hidden File Input */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept=".xlsx,.xls" 
                      onChange={handleExcelFileUpload} 
                      className="hidden" 
                    />

                    {/* Download Template */}
                    <button
                      type="button"
                      onClick={downloadStudentTemplateExcel}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-900 text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-98"
                      title="Unduh format tabel Excel kosong untuk diisi data siswa baru"
                    >
                      <span>📥</span>
                      <span>Format Template Excel</span>
                    </button>

                    {/* Import Excel */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-98"
                      title="Upload file Excel daftar siswa baru (.xlsx)"
                    >
                      <span>📤</span>
                      <span>Import File Excel (.xlsx)</span>
                    </button>

                    {/* Add Manual */}
                    <button
                      type="button"
                      onClick={() => setIsAddStudentModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
                    >
                      <span>+ Tambah Siswa</span>
                    </button>

                    {/* Reset */}
                    <button
                      type="button"
                      onClick={handleResetStudents}
                      className="p-2.5 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 border-2 border-slate-300 transition-all text-xs cursor-pointer shadow-xs active:scale-98 font-bold"
                      title="Reset kembali ke data 535 siswa awal"
                    >
                      🔄
                    </button>
                  </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
                    <div className="text-xs font-black text-slate-700 uppercase tracking-wider">Total Siswa Terdaftar</div>
                    <div className="text-3xl font-black text-slate-950 mt-1">{studentsList.length}</div>
                    <div className="text-xs text-slate-600 mt-1 font-semibold">Siswa Aktif Dapodik & Presensi</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
                    <div className="text-xs font-black text-slate-700 uppercase tracking-wider">Rombongan Belajar</div>
                    <div className="text-3xl font-black text-indigo-700 mt-1">{SCHOOL_CLASSES.length} Kelas</div>
                    <div className="text-xs text-slate-600 mt-1 font-semibold">7-A s/d 7-F, 8-A s/d 8-F, 9-A s/d 9-E</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
                    <div className="text-xs font-black text-slate-700 uppercase tracking-wider">Status Sinkronisasi</div>
                    <div className="text-3xl font-black text-emerald-700 mt-1">Live Aktif</div>
                    <div className="text-xs text-emerald-800 mt-1 font-bold">Terhubung ke Portal Presensi E-Learning</div>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-xs">
                  {/* Select Class Filter */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider mr-1 whitespace-nowrap">
                      Pilih Kelas:
                    </span>
                    <select
                      value={studentClassFilter}
                      onChange={(e) => setStudentClassFilter(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 text-xs font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
                    >
                      <option value="ALL">Semua Kelas ({studentsList.length} Siswa)</option>
                      {SCHOOL_CLASSES.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({studentsList.filter(s => s.classId === cls.id).length} Siswa)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Cari nama siswa atau NISN..."
                      className="w-full md:w-72 pl-8 pr-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-bold">
                      🔍
                    </span>
                  </div>
                </div>

                {/* Students Table */}
                <div className="rounded-2xl bg-white border-2 border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-3.5 bg-slate-100 border-b-2 border-slate-200 flex items-center justify-between text-xs text-slate-800 font-bold">
                    <span>
                      Menampilkan <span className="font-black text-slate-950">{filteredStudents.length}</span> dari {studentsList.length} siswa
                    </span>
                    {studentClassFilter !== 'ALL' && (
                      <span className="px-2.5 py-0.5 rounded font-mono font-black text-xs bg-indigo-100 text-indigo-900 border border-indigo-300">
                        Filter: Kelas {studentClassFilter}
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto [scrollbar-width:thin]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-900 font-mono uppercase text-xs tracking-wider border-b-2 border-slate-300 sticky top-0 font-black backdrop-blur-md">
                        <tr>
                          <th className="py-3.5 px-4 w-12 text-center">No</th>
                          <th className="py-3.5 px-4 w-32">NISN</th>
                          <th className="py-3.5 px-4 w-28">NIS</th>
                          <th className="py-3.5 px-4">Nama Lengkap Siswa</th>
                          <th className="py-3.5 px-4 w-24">Kelas</th>
                          <th className="py-3.5 px-4 w-20 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {paginatedStudents.map((st, idx) => {
                          const absoluteIndex = (studentPage - 1) * STUDENTS_PER_PAGE + idx + 1;
                          return (
                            <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 text-center font-mono text-slate-700 font-bold">{absoluteIndex}</td>
                              <td className="py-3 px-4 font-mono font-black text-indigo-700">{st.nisn}</td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-800">{st.nis || '-'}</td>
                              <td className="py-3 px-4 font-black text-slate-950 text-sm">{st.name}</td>
                              <td className="py-3 px-4">
                                <span className="px-2.5 py-1 rounded text-xs font-black bg-indigo-100 border border-indigo-300 text-indigo-900 font-mono">
                                  {st.classId}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudent(st.id, st.name)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 transition cursor-pointer"
                                  title="Hapus siswa"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {filteredStudents.length > 0 && (
                    <div className="p-3.5 bg-slate-100 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-800 font-bold">
                      <div>
                        Menampilkan <span className="text-slate-950 font-black">{(studentPage - 1) * STUDENTS_PER_PAGE + 1}</span> - <span className="text-slate-950 font-black">{Math.min(studentPage * STUDENTS_PER_PAGE, filteredStudents.length)}</span> dari <span className="text-slate-950 font-black">{filteredStudents.length}</span> siswa
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={studentPage <= 1}
                          onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                          className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border-2 border-slate-300 text-slate-900 text-xs font-extrabold transition cursor-pointer shadow-xs"
                        >
                          ◀ Sebelumnya
                        </button>
                        <span className="px-3.5 py-1.5 rounded-lg bg-white border-2 border-slate-300 text-slate-950 font-mono font-black text-xs shadow-xs">
                          Hal {studentPage} / {totalStudentPages}
                        </span>
                        <button
                          type="button"
                          disabled={studentPage >= totalStudentPages}
                          onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))}
                          className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border-2 border-slate-300 text-slate-900 text-xs font-extrabold transition cursor-pointer shadow-xs"
                        >
                          Berikutnya ▶
                        </button>
                      </div>
                    </div>
                  )}

                  {filteredStudents.length === 0 && (
                    <div className="py-16 text-center text-slate-700 text-xs font-bold">
                      Tidak ada siswa yang cocok dengan filter atau kata kunci pencarian.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: MANAJEMEN PIMPINAN & DEWAN GURU (GTK) - NEW! */}
            {/* ========================================================================= */}
            {activeTab === 'pimpinan' && (
              <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                
                {/* Header Section */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-800 text-[10px] font-mono font-black uppercase mb-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                      Manajemen Personalia Sekolah
                    </div>
                    <h2 className="text-xl font-black text-slate-950 tracking-tight">
                      Pimpinan & Dewan Guru <span className="font-extrabold text-indigo-700">(GTK)</span>
                    </h2>
                    <p className="text-xs text-slate-700 font-semibold mt-0.5">
                      Kelola data Kepala Sekolah, para Wakasek, dewan guru pendidik, dan pembaruan data pokok sekolah yang tampil di website.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={() => setIsTeacherModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
                    >
                      <span>+ Tambah Guru / Pendidik</span>
                    </button>
                  </div>
                </div>

                {/* --- BAGIAN 1: JAJARAN PIMPINAN SEKOLAH --- */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                        <span>Pimpinan Utama & Wakil Kepala Sekolah</span>
                        <span className="text-xs font-mono font-black text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-300">
                          {leadersList.length} Pimpinan
                        </span>
                      </h3>
                      <p className="text-xs text-slate-700 font-semibold">Data ini langsung disinkronkan ke tab "Pimpinan" pada halaman Profil depan.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {leadersList.map((leader) => (
                      <div 
                        key={leader.id}
                        className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between gap-4 shadow-sm group relative overflow-hidden"
                      >
                        <div className="flex items-start gap-4">
                          <img 
                            src={leader.photo || '/teachers/default_avatar.svg'} 
                            alt={leader.name}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-300 flex-shrink-0 shadow-xs"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="text-base font-black text-slate-950 truncate">{leader.name}</h4>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border border-indigo-300 bg-indigo-100 text-indigo-900">
                                {leader.role}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-slate-700 mb-2 font-bold">NIP/Gol: {leader.nip}</p>
                            <p className="text-xs text-slate-800 font-medium leading-relaxed italic bg-slate-100 p-3 rounded-xl border border-slate-300">
                              "{leader.quote}"
                            </p>
                          </div>
                        </div>

                        {/* Leader Actions */}
                        <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-mono font-black text-emerald-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                            {leader.status}
                          </span>

                          <button
                            onClick={() => handleOpenEditLeader(leader)}
                            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-xs font-extrabold text-slate-900 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                          >
                            <span>✏️ Ubah Profil / Ganti Pimpinan</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* --- BAGIAN 2: PEMBARUAN DATA POKOK PENDIDIKAN --- */}
                <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3.5 border-b-2 border-slate-100">
                    <div>
                      <h3 className="text-base font-black text-slate-950">Statistik Data Pokok Pendidikan</h3>
                      <p className="text-xs text-slate-700 font-semibold">Angka metrik ini tampil pada kartu Data Pokok di halaman profil utama</p>
                    </div>
                    <button
                      onClick={handleSaveDataPokok}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-98"
                    >
                      Simpan Data Pokok
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="text-slate-800 font-black block mb-1.5 text-xs">Siswa Aktif</label>
                      <input 
                        type="text" 
                        value={dataPokok.siswa}
                        onChange={(e) => setDataPokok({ ...dataPokok, siswa: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-sm font-black focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-800 font-black block mb-1.5 text-xs">Rombongan Belajar</label>
                      <input 
                        type="text" 
                        value={dataPokok.rombel}
                        onChange={(e) => setDataPokok({ ...dataPokok, rombel: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-sm font-black focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-800 font-black block mb-1.5 text-xs">Dewan Guru</label>
                      <input 
                        type="text" 
                        value={dataPokok.guru}
                        onChange={(e) => setDataPokok({ ...dataPokok, guru: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-sm font-black focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-800 font-black block mb-1.5 text-xs">Tenaga Kependidikan</label>
                      <input 
                        type="text" 
                        value={dataPokok.staf}
                        onChange={(e) => setDataPokok({ ...dataPokok, staf: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-sm font-black focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* --- BAGIAN 3: DAFTAR DEWAN GURU & TENAGA PENDIDIK (GTK) --- */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                        <span>Daftar Guru & Tenaga Kependidikan</span>
                        <span className="text-xs font-mono font-black text-slate-900 bg-slate-200 px-2.5 py-0.5 rounded-full border border-slate-300">
                          {teachersList.length} Pendidik Terdaftar
                        </span>
                      </h3>
                      <p className="text-xs text-slate-700 font-semibold">Status keaktifan guru dapat diubah jika ada yang mutasi atau purnabakti.</p>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        placeholder="Cari nama guru / mapel..."
                        className="w-full sm:w-64 pl-8 pr-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-bold">
                        🔍
                      </span>
                    </div>
                  </div>

                  {/* Teachers Table */}
                  <div className="rounded-2xl bg-white border-2 border-slate-200 overflow-hidden shadow-sm">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left text-xs table-auto">
                        <thead className="bg-slate-100 text-slate-900 font-mono uppercase text-xs tracking-wider border-b-2 border-slate-300 font-black">
                          <tr>
                            <th className="py-4 px-4 sm:px-5">Guru & Tenaga Pendidik</th>
                            <th className="py-4 px-3 sm:px-4">Mata Pelajaran / Tugas</th>
                            <th className="py-4 px-3">Kepegawaian</th>
                            <th className="py-4 px-3">Status Keaktifan</th>
                            <th className="py-4 px-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                          {filteredTeachers.map((teacher) => (
                            <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                              {/* Kolom 1: Foto + Nama + NIP di bawahnya */}
                              <td className="py-4 px-4 sm:px-5">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={teacher.photo || '/teachers/default_avatar.svg'} 
                                    alt={teacher.name}
                                    className="w-11 h-11 rounded-xl object-cover border-2 border-slate-300 flex-shrink-0 shadow-xs"
                                  />
                                  <div className="min-w-0">
                                    <span className="block font-black text-slate-950 truncate text-sm">{teacher.name}</span>
                                    <span className="block text-xs font-mono text-slate-700 truncate mt-0.5 font-bold">
                                      {teacher.nip && teacher.nip !== '-' ? `NIP/Gol. ${teacher.nip}` : teacher.status}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Kolom 2: Mata Pelajaran */}
                              <td className="py-4 px-3 sm:px-4 text-slate-950">
                                <span className="font-bold leading-relaxed">{teacher.subject}</span>
                              </td>

                              {/* Kolom 3: Status Kepegawaian */}
                              <td className="py-4 px-3 whitespace-nowrap">
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-black bg-slate-100 text-slate-900 border-2 border-slate-300">
                                  {teacher.status}
                                </span>
                              </td>

                              {/* Kolom 4: Status Keaktifan */}
                              <td className="py-4 px-3 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTeacherActive(teacher.id)}
                                  title={teacher.active ? 'Klik untuk mengubah status jadi Mutasi / Nonaktif' : 'Klik untuk mengaktifkan kembali mengajar'}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer border-2 select-none group shadow-xs ${
                                    teacher.active 
                                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-400' 
                                      : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-400'
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${
                                    teacher.active 
                                      ? 'bg-emerald-600 animate-pulse' 
                                      : 'bg-slate-500'
                                  }`} />
                                  <span className="font-sans">
                                    {teacher.active ? 'Aktif' : 'Nonaktif'}
                                  </span>
                                  <span className="text-xs opacity-60 group-hover:opacity-100 transition-opacity">
                                    ⇄
                                  </span>
                                </button>
                              </td>

                              {/* Kolom 5: Aksi */}
                              <td className="py-4 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleOpenEditTeacher(teacher)}
                                    className="p-2 rounded-xl bg-white hover:bg-slate-100 text-indigo-700 border-2 border-slate-300 transition-all cursor-pointer shadow-xs"
                                    title="Ubah Data & Foto Guru"
                                  >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleToggleTeacherActive(teacher.id)}
                                    className={`p-2 rounded-xl border-2 transition-all cursor-pointer shadow-xs ${
                                      teacher.active 
                                        ? 'bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border-slate-300' 
                                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-400'
                                    }`}
                                    title={teacher.active ? 'Ubah jadi Mutasi / Nonaktif' : 'Aktifkan Kembali Mengajar'}
                                  >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path d="m17 2 4 4-4 4" />
                                      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                                      <path d="m7 22-4-4 4-4" />
                                      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTeacher(teacher.id)}
                                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-300 transition-all cursor-pointer shadow-xs"
                                    title="Hapus Guru dari Sistem"
                                  >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path d="M3 6h18" />
                                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            
            {/* TAB 4: KALENDER AKADEMIK */}
            {/* ========================================================================= */}
            {activeTab === 'agenda' && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
                  <div>
                    <h2 className="text-xl font-black text-slate-950 tracking-tight">Manajemen Kalender & Agenda</h2>
                    <p className="text-xs text-slate-700 font-semibold mt-0.5">Jadwal pelaksanaan kegiatan akademik, ujian CBT, dan agenda resmi</p>
                  </div>

                  <button
                    onClick={() => setIsAgendaModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
                  >
                    <span>+ Tambah Agenda Baru</span>
                  </button>
                </div>

                {/* Agenda List Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agendaList.map((agenda) => (
                    <div 
                      key={agenda.id}
                      className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-400 transition-all flex items-start justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black text-indigo-900 border border-indigo-300 bg-indigo-100">
                            {agenda.category}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
                            agenda.status === 'Berlangsung' 
                              ? 'text-amber-950 bg-amber-100 border border-amber-300' 
                              : 'text-slate-800 bg-slate-200 border border-slate-300'
                          }`}>
                            {agenda.status}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-slate-950">{agenda.name}</h4>
                        <p className="text-xs font-mono font-black text-indigo-700 flex items-center gap-1.5">
                          <span>🗓️</span>
                          <span>{agenda.date}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteAgenda(agenda.id)}
                        className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-300 transition-colors shadow-xs cursor-pointer active:scale-98"
                        title="Hapus Agenda"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: GALERI & FASILITAS */}
            {/* ========================================================================= */}
            {activeTab === 'galeri' && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                
                {/* Header */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-950 tracking-tight">Manajemen Galeri & Fasilitas</h2>
                    <p className="text-xs text-slate-700 font-semibold mt-0.5">Foto dokumentasi kegiatan belajar dan sarana kampus terpadu</p>
                  </div>

                  <button
                    onClick={() => showToast('Pilih file foto dari komputer Anda untuk diunggah.')}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
                  >
                    <span>+ Unggah Media Baru</span>
                  </button>
                </div>

                {/* Upload Drag & Drop Simulation Area */}
                <div 
                  onClick={() => showToast('Simulasi unggah: foto siap dihubungkan ke Supabase Storage.')}
                  className="p-8 rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/20 hover:bg-indigo-50/40 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2 shadow-xs"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 border-2 border-indigo-300 flex items-center justify-center text-indigo-700 text-xl font-black">
                    📁
                  </div>
                  <p className="text-sm sm:text-base font-black text-slate-950">Tarik & lepas foto ke sini, atau klik untuk memilih berkas</p>
                  <p className="text-xs text-slate-700 font-mono font-semibold">Format didukung: JPG, PNG, WebP (Maks. 5 MB/foto)</p>
                </div>

                {/* Photo Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {galleryList.map((photo) => (
                    <div 
                      key={photo.id}
                      className="group relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-200 shadow-sm"
                    >
                      <Image src={photo.src} alt={photo.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent p-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black text-white border border-white/30 bg-slate-900/80 backdrop-blur-md">
                            {photo.category}
                          </span>
                          <button
                            onClick={() => handleDeleteGallery(photo.id)}
                            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-md"
                            title="Hapus Foto"
                          >
                            🗑️
                          </button>
                        </div>
                        <h4 className="text-sm font-black text-white line-clamp-2">{photo.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: PESAN MASUK (INBOX) */}
            {/* ========================================================================= */}
            {activeTab === 'pesan' && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                
                {/* Header */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
                  <h2 className="text-xl font-black text-slate-950 tracking-tight">Kotak Pesan Masuk (Kontak & Aduan)</h2>
                  <p className="text-xs text-slate-700 font-semibold mt-0.5">Pesan dan pertanyaan resmi dari masyarakat dan wali murid via website</p>
                </div>

                {/* Message Cards */}
                <div className="space-y-4">
                  {messagesList.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`p-5 rounded-2xl border-2 transition-all ${
                        msg.read 
                          ? 'bg-white border-slate-200 shadow-xs' 
                          : 'bg-indigo-50/60 border-indigo-300 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${msg.read ? 'bg-slate-400' : 'bg-indigo-600 animate-pulse'}`} />
                          <h4 className="text-base font-black text-slate-950">{msg.sender}</h4>
                          <span className="text-xs text-slate-700 font-mono font-bold">({msg.contact})</span>
                        </div>
                        <span className="text-xs font-mono text-slate-700 font-bold">{msg.date}</span>
                      </div>

                      <h5 className="text-sm font-black text-indigo-900 mb-1.5">{msg.subject}</h5>
                      <p className="text-xs text-slate-800 font-medium leading-relaxed mb-4">{msg.message}</p>

                      <div className="flex items-center gap-2.5">
                        <a
                          href={`https://wa.me/?text=Halo%20${encodeURIComponent(msg.sender)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-xs active:scale-98"
                        >
                          Balas via WhatsApp
                        </a>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-800 text-xs font-extrabold transition-all shadow-xs active:scale-98"
                        >
                          Hapus Pesan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 7: PENGATURAN WEB & AKUN */}
            {/* ========================================================================= */}
            {activeTab === 'pengaturan' && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                
                {/* School Master Data */}
                <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-base font-black text-slate-950 pb-3.5 border-b-2 border-slate-100">
                    Identitas Resmi Sekolah
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-slate-800 font-black block mb-1.5 text-xs">Nama Satuan Pendidikan</label>
                      <input 
                        type="text" 
                        defaultValue="SMP Negeri 3 Cihampelas" 
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-800 font-black block mb-1.5 text-xs">NPSN</label>
                      <input 
                        type="text" 
                        defaultValue="20224133" 
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-800 font-black block mb-1.5 text-xs">Status Akreditasi</label>
                      <input 
                        type="text" 
                        defaultValue="B (Baik) - BAN S/M" 
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-800 font-black block mb-1.5 text-xs">Kecamatan / Kabupaten</label>
                      <input 
                        type="text" 
                        defaultValue="Cihampelas, Kab. Bandung Barat" 
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => showToast('Identitas sekolah berhasil diperbarui!')}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-98"
                  >
                    Simpan Perubahan
                  </button>
                </div>

                {/* Password Change */}
                <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-base font-black text-slate-950 pb-3.5 border-b-2 border-slate-100">
                    Keamanan & Kata Sandi Admin
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-slate-800 font-black block mb-1.5 text-xs">Kata Sandi Baru</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-800 font-black block mb-1.5 text-xs">Konfirmasi Kata Sandi</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => showToast('Kata sandi admin berhasil diperbarui!')}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-900 text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    Perbarui Kata Sandi
                  </button>
                </div>

                {/* Synchronization & Data Reset */}
                <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b-2 border-slate-100 gap-2">
                    <div>
                      <h3 className="text-base font-black text-slate-950">Sinkronisasi & Reset Data Sekolah</h3>
                      <p className="text-xs text-slate-700 font-semibold">Data pimpinan, direktori guru, dan data pokok tersimpan otomatis di LocalStorage browser.</p>
                    </div>
                    <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[10px] font-mono font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      Tersinkronisasi Realtime
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    Semua perubahan yang Anda simpan di Admin Dashboard langsung terhubung dan otomatis mengubah tampilan di halaman publik (Landing Page). Jika Anda ingin mengembalikan seluruh data pimpinan dan guru ke setelan awal pabrik, gunakan tombol reset di bawah:
                  </p>

                  <button
                    onClick={() => {
                      if (confirm('Apakah Anda yakin ingin mereset seluruh data pimpinan, guru, dan data pokok ke setelan default awal?')) {
                        resetSchoolData();
                        showToast('🔄 Seluruh data berhasil direset ke setelan awal!');
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-800 text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-xs active:scale-98"
                  >
                    <span>🔄 Reset Data ke Setelan Awal</span>
                  </button>
                </div>

              </div>
            )}

          </main>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH WARTA BARU */}
      {/* ========================================================================= */}
      {isNewsModalOpen && (
        <div 
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        >
          <div 
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="w-full max-w-lg rounded-3xl bg-white border-2 border-slate-300 p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100 mb-5">
              <h3 className="text-lg font-black text-slate-950">Tulis Warta Baru</h3>
              <button 
                onClick={() => setIsNewsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-bold flex items-center justify-center cursor-pointer border border-slate-300 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNews} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-800 block mb-1.5 font-black text-xs">Judul Warta *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Tim Robotika Meraih Medali Emas..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-800 block mb-1.5 font-black text-xs">Kategori</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
                  >
                    <option value="Prestasi">Prestasi</option>
                    <option value="Pengumuman">Pengumuman</option>
                    <option value="Inovasi">Inovasi</option>
                    <option value="Akademik">Akademik</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-800 block mb-1.5 font-black text-xs">Pilih Foto Sampul</label>
                  <select
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
                  >
                    <option value="/gallery_2.jpg">Foto Basket (Juara)</option>
                    <option value="/slide1.jpeg">Foto Upacara Bendera</option>
                    <option value="/slide4.jpeg">Foto Robotika / Senam</option>
                    <option value="/gallery_1.jpg">Foto Lab Sains</option>
                    <option value="/slide6.jpeg">Foto Lab Komputer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-800 block mb-1.5 font-black text-xs">Ringkasan / Kutipan</label>
                <textarea
                  rows={3}
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  placeholder="Kutipan singkat berita untuk cuplikan depan..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-medium placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 resize-none shadow-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold border-2 border-slate-300 cursor-pointer shadow-xs active:scale-98"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
                >
                  Terbitkan Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TAMBAH AGENDA BARU */}
      {/* ========================================================================= */}
      {isAgendaModalOpen && (
        <div 
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        >
          <div 
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="w-full max-w-md rounded-3xl bg-white border-2 border-slate-300 p-6 shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100 mb-5">
              <h3 className="text-lg font-black text-slate-950">Tambah Agenda Akademik</h3>
              <button 
                onClick={() => setIsAgendaModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-bold flex items-center justify-center cursor-pointer border border-slate-300 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAgenda} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-800 block mb-1.5 font-black text-xs">Nama Kegiatan *</label>
                <input
                  type="text"
                  required
                  value={newAgendaName}
                  onChange={(e) => setNewAgendaName(e.target.value)}
                  placeholder="Contoh: Ujian Asesmen Akhir Semester..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                />
              </div>

              <div>
                <label className="text-slate-800 block mb-1.5 font-black text-xs">Rentang Tanggal *</label>
                <input
                  type="text"
                  required
                  value={newAgendaDate}
                  onChange={(e) => setNewAgendaDate(e.target.value)}
                  placeholder="Contoh: 12 - 18 Desember 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                />
              </div>

              <div>
                <label className="text-slate-800 block mb-1.5 font-black text-xs">Kategori</label>
                <select
                  value={newAgendaCategory}
                  onChange={(e) => setNewAgendaCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
                >
                  <option value="Akademik">Akademik</option>
                  <option value="Ujian CBT">Ujian CBT</option>
                  <option value="Kegiatan">Kegiatan</option>
                  <option value="Kreativitas">Kreativitas</option>
                  <option value="Libur Semester">Libur Semester</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAgendaModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold border-2 border-slate-300 cursor-pointer shadow-xs active:scale-98"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: UBAH PROFIL / GANTI PIMPINAN (KEPALA SEKOLAH & WAKASEK) */}
      {/* ========================================================================= */}
      {isLeaderModalOpen && selectedLeader && (
        <div 
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        >
          <div 
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="w-full max-w-lg rounded-3xl bg-white border-2 border-slate-300 p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-black text-slate-950">Ubah Data / Ganti Pimpinan</h3>
                <p className="text-xs text-indigo-700 font-extrabold mt-0.5">Jabatan: {selectedLeader.role}</p>
              </div>
              <button 
                onClick={() => setIsLeaderModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-bold flex items-center justify-center cursor-pointer border border-slate-300 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLeader} className="space-y-4 text-xs">
              {/* Photo Selector */}
              <div>
                <label className="text-slate-800 block mb-1.5 font-black text-xs">Foto Profil Pimpinan</label>
                <div className="flex items-center gap-3.5 mb-3">
                  <img 
                    src={leaderFormPhoto || '/teachers/default_avatar.svg'} 
                    alt="Preview" 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-300 shadow-xs flex-shrink-0"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={leaderFormPhoto}
                      onChange={(e) => setLeaderFormPhoto(e.target.value)}
                      placeholder="URL foto pimpinan..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-xs font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                    />
                    <p className="text-xs text-slate-600 font-semibold mt-1">Bisa gunakan link gambar atau pilih foto preset di bawah.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-700 font-black">Pilihan Cepat:</span>
                  {PHOTO_PRESETS.map((p) => (
                    <button
                      key={p.src}
                      type="button"
                      onClick={() => setLeaderFormPhoto(p.src)}
                      className={`px-3 py-1.5 rounded-lg border-2 text-xs flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                        leaderFormPhoto === p.src
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-black'
                          : 'border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <img src={p.src} alt={p.label} className="w-4 h-4 rounded-full object-cover" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-800 block mb-1.5 font-black text-xs">Nama Lengkap & Gelar Pimpinan *</label>
                <input
                  type="text"
                  required
                  value={leaderFormName}
                  onChange={(e) => setLeaderFormName(e.target.value)}
                  placeholder="Contoh: Dr. H. Ahmad Fauzi, M.Pd."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-800 block mb-1.5 font-black text-xs">Jabatan Pimpinan *</label>
                  <input
                    type="text"
                    required
                    value={leaderFormRole}
                    onChange={(e) => setLeaderFormRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-800 block mb-1.5 font-black text-xs">NIP / NUPTK</label>
                  <input
                    type="text"
                    value={leaderFormNip}
                    onChange={(e) => setLeaderFormNip(e.target.value)}
                    placeholder="19740512..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-800 block mb-1.5 font-black text-xs">Kutipan Visi / Pesan Pimpinan</label>
                <textarea
                  rows={3}
                  value={leaderFormQuote}
                  onChange={(e) => setLeaderFormQuote(e.target.value)}
                  placeholder="Kutipan arahan pimpinan yang tampil pada website..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-medium placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 resize-none shadow-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLeaderModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold border-2 border-slate-300 cursor-pointer shadow-xs active:scale-98"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
                >
                  Simpan Perubahan Pimpinan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: TAMBAH DEWAN GURU BARU */}
      {/* ========================================================================= */}
      {isTeacherModalOpen && (
        <div 
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        >
          <div 
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="w-full max-w-md rounded-3xl bg-white border-2 border-slate-300 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200 mb-5">
              <div>
                <h3 className="text-lg font-black text-slate-950">Tambah Guru / Pendidik Baru</h3>
                <p className="text-xs text-slate-700 font-bold mt-0.5">Daftarkan guru baru ke database sekolah</p>
              </div>
              <button 
                onClick={() => setIsTeacherModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-bold flex items-center justify-center border border-slate-300 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-4 text-xs">
              {/* Photo Selector */}
              <div>
                <label className="text-slate-800 block mb-1.5 font-extrabold">Foto Profil Guru</label>
                <div className="flex items-center gap-3 mb-2.5">
                  <img 
                    src={newTeacherPhoto || '/teachers/default_avatar.svg'} 
                    alt="Preview" 
                    className="w-12 h-12 rounded-xl object-cover border-2 border-slate-300 shadow-sm flex-shrink-0"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newTeacherPhoto}
                      onChange={(e) => setNewTeacherPhoto(e.target.value)}
                      placeholder="URL foto..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-xs font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-700 font-extrabold">Preset Foto:</span>
                  {PHOTO_PRESETS.map((p) => (
                    <button
                      key={p.src}
                      type="button"
                      onClick={() => setNewTeacherPhoto(p.src)}
                      className={`px-2 py-1 rounded-lg border-2 text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                        newTeacherPhoto === p.src
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-black'
                          : 'border-slate-300 bg-slate-100 text-slate-800 font-bold hover:bg-slate-200'
                      }`}
                    >
                      <img src={p.src} alt={p.label} className="w-4 h-4 rounded-full object-cover" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-800 block mb-1.5 font-extrabold">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="Contoh: Hendra Gunawan, S.Pd., M.M."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="text-slate-800 block mb-1.5 font-extrabold">Mata Pelajaran / Tugas *</label>
                <input
                  type="text"
                  required
                  value={newTeacherSubject}
                  onChange={(e) => setNewTeacherSubject(e.target.value)}
                  placeholder="Contoh: Ilmu Pengetahuan Sosial (IPS)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-800 block mb-1.5 font-extrabold">NIP / NUPTK</label>
                  <input
                    type="text"
                    value={newTeacherNip}
                    onChange={(e) => setNewTeacherNip(e.target.value)}
                    placeholder="Boleh kosong jika GTT"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="text-slate-800 block mb-1.5 font-extrabold">Status Kepegawaian</label>
                  <select
                    value={newTeacherStatus}
                    onChange={(e) => setNewTeacherStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="GTT / Honorer">GTT / Honorer</option>
                    <option value="Tenaga Kependidikan">Tenaga Kependidikan</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t-2 border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98 transition-all"
                >
                  Simpan Guru Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT DATA & GANTI FOTO GURU */}
      {/* ========================================================================= */}
      {isEditTeacherModalOpen && selectedTeacher && (
        <div 
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        >
          <div 
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="w-full max-w-md rounded-3xl bg-white border-2 border-slate-300 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200 mb-5">
              <div>
                <h3 className="text-lg font-black text-slate-950">Ubah Data & Foto Guru</h3>
                <p className="text-xs text-slate-700 font-bold mt-0.5">Kelola identitas pendidik</p>
              </div>
              <button 
                onClick={() => setIsEditTeacherModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-bold flex items-center justify-center border border-slate-300 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditTeacher} className="space-y-4 text-xs">
              {/* Photo Selector */}
              <div>
                <label className="text-slate-800 block mb-1.5 font-extrabold">Foto Profil Guru</label>
                <div className="flex items-center gap-3 mb-2.5">
                  <img 
                    src={editTeacherPhoto || '/teachers/default_avatar.svg'} 
                    alt="Preview" 
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-300 shadow-sm flex-shrink-0"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editTeacherPhoto}
                      onChange={(e) => setEditTeacherPhoto(e.target.value)}
                      placeholder="URL foto..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-xs font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-500"
                    />
                    <p className="text-[10px] text-slate-600 font-bold mt-1">Ganti dengan URL gambar atau pilih foto preset.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-700 font-extrabold">Pilihan Cepat:</span>
                  {PHOTO_PRESETS.map((p) => (
                    <button
                      key={p.src}
                      type="button"
                      onClick={() => setEditTeacherPhoto(p.src)}
                      className={`px-2 py-1 rounded-lg border-2 text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                        editTeacherPhoto === p.src
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-black'
                          : 'border-slate-300 bg-slate-100 text-slate-800 font-bold hover:bg-slate-200'
                      }`}
                    >
                      <img src={p.src} alt={p.label} className="w-4 h-4 rounded-full object-cover" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-800 block mb-1.5 font-extrabold">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={editTeacherName}
                  onChange={(e) => setEditTeacherName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                />
              </div>

              <div>
                <label className="text-slate-800 block mb-1.5 font-extrabold">Mata Pelajaran / Tugas *</label>
                <input
                  type="text"
                  required
                  value={editTeacherSubject}
                  onChange={(e) => setEditTeacherSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-800 block mb-1.5 font-extrabold">Status Kepegawaian</label>
                  <select
                    value={editTeacherStatus}
                    onChange={(e) => setEditTeacherStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="GTT / Honorer">GTT / Honorer</option>
                    <option value="Tenaga Kependidikan">Tenaga Kependidikan</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-800 block mb-1.5 font-extrabold">Status Keaktifan</label>
                  <select
                    value={editTeacherActive ? 'true' : 'false'}
                    onChange={(e) => setEditTeacherActive(e.target.value === 'true')}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
                  >
                    <option value="true">● Aktif Mengajar</option>
                    <option value="false">○ Mutasi / Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t-2 border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditTeacherModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98 transition-all"
                >
                  Simpan Perubahan Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Siswa Manual */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200 mb-4">
              <h3 className="text-lg font-black text-slate-950">Tambah Siswa Baru</h3>
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-bold flex items-center justify-center border border-slate-300 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStudentManual} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-800 block mb-1 font-extrabold">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  value={newStudentData.name}
                  onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-800 block mb-1 font-extrabold">NISN (10 Digit)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 0134567890"
                    value={newStudentData.nisn}
                    onChange={(e) => setNewStudentData({ ...newStudentData, nisn: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="text-slate-800 block mb-1 font-extrabold">NIS Sekolah</label>
                  <input
                    type="text"
                    placeholder="Contoh: 262707050"
                    value={newStudentData.nis}
                    onChange={(e) => setNewStudentData({ ...newStudentData, nis: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-800 block mb-1 font-extrabold">Kelas / Rombongan Belajar *</label>
                <select
                  value={newStudentData.classId}
                  onChange={(e) => setNewStudentData({ ...newStudentData, classId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
                >
                  {SCHOOL_CLASSES.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t-2 border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98 transition-all"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
