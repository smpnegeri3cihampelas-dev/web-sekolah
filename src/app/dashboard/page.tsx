'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSchoolData, Leader, Teacher, DataPokok } from '@/lib/schoolData';

export default function DashboardPage() {
  const router = useRouter();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'overview' | 'warta' | 'pimpinan' | 'agenda' | 'galeri' | 'pesan' | 'pengaturan'>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- MOCK DATA STATES ---
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

  // Filtered teachers
  const filteredTeachers = teachersList.filter(t => 
    t.name.toLowerCase().includes(teacherSearch.toLowerCase()) || 
    t.subject.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070709] text-stone-100 flex flex-col antialiased selection:bg-cyan-500/25 selection:text-cyan-200">
      
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-stone-900/90 border border-cyan-400/40 text-white text-xs sm:text-sm font-medium shadow-2xl backdrop-blur-xl animate-[fadeIn_0.2s_ease-out]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[700px] h-[400px] bg-cyan-950/20 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-purple-950/15 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ========================================================================= */}
        {/* SIDEBAR NAVIGATION */}
        {/* ========================================================================= */}
        <aside 
          className={`fixed inset-y-0 left-0 z-40 w-64 sm:w-72 bg-black/90 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
            mobileSidebarOpen ? 'translate-x-0 shadow-2xl shadow-black' : '-translate-x-full'
          }`}
        >
          {/* Top Brand Identity */}
          <div>
            <div className="p-5 sm:p-6 border-b border-white/[0.07] flex items-center justify-between">
              <button 
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  setMobileSidebarOpen(false);
                }} 
                className="flex items-center gap-3 group text-left cursor-pointer transition-transform active:scale-98"
                title="Buka Ringkasan Dashboard"
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/15 p-0.5 bg-black/60 shadow-lg group-hover:border-cyan-400/50 transition-colors">
                  <Image 
                    src="/logo.png" 
                    alt="Logo SMPN 3 Cihampelas" 
                    width={36} 
                    height={36} 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium tracking-tight text-white flex items-center gap-1.5 group-hover:text-cyan-200 transition-colors">
                    SMPN 3 Cihampelas
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400/90 tracking-wider uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Admin Portal
                  </span>
                </div>
              </button>

              {/* Close button for mobile */}
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/[0.05]"
              >
                ✕
              </button>
            </div>

            {/* Navigation Menu Links */}
            <nav className="p-3 sm:p-4 space-y-1">
              {[
                {
                  id: 'overview',
                  label: 'Ringkasan',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                      <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z" />
                    </svg>
                  ),
                  badge: `${newsList.length}`
                },
                {
                  id: 'pimpinan',
                  label: 'Pimpinan & Guru (GTK)',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-normal tracking-wide transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/30 shadow-lg shadow-cyan-950/20'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={activeTab === item.id ? 'text-cyan-400' : 'text-stone-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.08] text-stone-300 border border-white/10">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Bottom Admin User Capsule & Logout */}
          <div className="p-4 border-t border-white/[0.07] bg-white/[0.01]">
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-600/30 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-semibold text-xs">
                  AD
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-medium text-white">Administrator</span>
                  <span className="text-[10px] text-stone-400 font-mono">admin@smpn3.sch.id</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs font-normal transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* ========================================================================= */}
        {/* MAIN DASHBOARD CONTENT AREA */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

          {/* Top Header Bar */}
          <header className="sticky top-0 z-20 w-full h-16 bg-[#070709]/80 backdrop-blur-xl border-b border-white/[0.07] px-4 sm:px-8 flex items-center justify-between gap-4">
            
            {/* Left Header: Mobile Toggle & Page Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-white/[0.04] border border-white/10 text-stone-300"
                aria-label="Buka Menu"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-white capitalize">
                  {activeTab === 'overview' && 'Ringkasan Sistem & Konten'}
                  {activeTab === 'warta' && 'Manajemen Warta & Berita'}
                  {activeTab === 'pimpinan' && 'Manajemen Pimpinan & Guru (GTK)'}
                  {activeTab === 'agenda' && 'Kalender & Agenda Akademik'}
                  {activeTab === 'galeri' && 'Manajemen Galeri & Fasilitas'}
                  {activeTab === 'pesan' && 'Kotak Pesan Masuk Wali Murid'}
                  {activeTab === 'pengaturan' && 'Pengaturan Profil & Website'}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono text-cyan-300 border border-cyan-400/30 bg-cyan-500/10">
                  v1.0 Live
                </span>
              </div>
            </div>

            {/* Right Header: Clock, View Website Button, Notification */}
            <div className="flex items-center gap-2 sm:gap-4">
              
              {/* Live Clock Indicator */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.07] text-[11px] font-mono text-stone-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{currentTime || 'Loading...'}</span>
              </div>

              {/* View Public Website */}
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-stone-200 transition-all hover:border-cyan-400/30"
              >
                <span>Lihat Website</span>
                <span className="text-[10px] text-cyan-400">↗</span>
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
                      borderColor: 'hover:border-cyan-400/40'
                    },
                    {
                      label: 'Pimpinan & Guru',
                      value: `${leadersList.length + teachersList.length}`,
                      desc: `${leadersList.length} Pimpinan · ${teachersList.length} Guru Aktif`,
                      icon: '👨‍🏫',
                      borderColor: 'hover:border-purple-400/40'
                    },
                    {
                      label: 'Agenda Sekolah',
                      value: `${agendaList.length}`,
                      desc: '2 aktif bulan ini',
                      icon: '📅',
                      borderColor: 'hover:border-emerald-400/40'
                    },
                    {
                      label: 'Pesan Masuk',
                      value: `${messagesList.length}`,
                      desc: `${messagesList.filter(m => !m.read).length} belum dibaca`,
                      icon: '💬',
                      borderColor: 'hover:border-amber-400/40'
                    }
                  ].map((stat, i) => (
                    <div 
                      key={i}
                      className={`p-5 rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl shadow-lg transition-all ${stat.borderColor}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-normal text-stone-400">{stat.label}</span>
                        <span className="text-lg">{stat.icon}</span>
                      </div>
                      <div className="text-3xl font-light text-white tracking-tight mb-1">
                        {stat.value}
                      </div>
                      <div className="text-[11px] font-mono text-cyan-400/90 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-cyan-400" />
                        <span>{stat.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions Row */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.07] backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300">
                      ⚡
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">Aksi Cepat Pengelolaan</h3>
                      <p className="text-xs text-stone-400 font-light">Perbarui konten website langsung dari panel di bawah</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={() => setIsNewsModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-cyan-500 text-black text-xs font-medium hover:bg-cyan-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
                    >
                      <span>+ Tulis Warta Baru</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('pimpinan')}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-normal transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>👨‍🏫 Kelola Pimpinan & Guru</span>
                    </button>
                    <button
                      onClick={() => setIsAgendaModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-normal transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>+ Tambah Agenda</span>
                    </button>
                  </div>
                </div>

                {/* Grid 2 Column: Warta Terbaru + Agenda Terdekat */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Recent News (7 Cols) */}
                  <div className="lg:col-span-7 rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
                      <div>
                        <h3 className="text-sm font-medium text-white">Warta & Berita Tayang</h3>
                        <p className="text-xs text-stone-400 font-light">Status artikel di halaman bento grid</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('warta')}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Lihat Semua →
                      </button>
                    </div>

                    <div className="space-y-3">
                      {newsList.slice(0, 3).map((item) => (
                        <div 
                          key={item.id}
                          className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/15 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0 bg-stone-900 border border-white/10">
                              <Image src={item.src} alt={item.title} fill className="object-cover" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-cyan-300 border border-cyan-400/30 bg-cyan-500/10">
                                  {item.category}
                                </span>
                                <span className="text-[10px] text-stone-400 font-mono">{item.date}</span>
                              </div>
                              <h4 className="text-xs font-normal text-white truncate max-w-sm">
                                {item.title}
                              </h4>
                            </div>
                          </div>
                          <span className="flex-shrink-0 px-2 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-400/30">
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Upcoming Agenda & System Health (5 Cols) */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Agenda Card */}
                    <div className="rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
                        <h3 className="text-sm font-medium text-white">Agenda Akademik Terdekat</h3>
                        <button 
                          onClick={() => setActiveTab('agenda')}
                          className="text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          Kelola →
                        </button>
                      </div>

                      <div className="space-y-3">
                        {agendaList.slice(0, 3).map((agenda) => (
                          <div key={agenda.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                            <div>
                              <h5 className="text-xs text-white font-normal mb-1">{agenda.name}</h5>
                              <p className="text-[10px] font-mono text-cyan-400">{agenda.date}</p>
                            </div>
                            <span className="text-[10px] font-mono text-stone-400 px-2 py-0.5 rounded-full bg-white/[0.04]">
                              {agenda.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* System Server Health */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.07] backdrop-blur-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 text-xs">
                          ●
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">Sistem Sekolah Berjalan Normal</p>
                          <p className="text-[10px] text-stone-400 font-mono">Next.js 16 (App Router) · Turbopack</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl">
                  <div>
                    <h2 className="text-lg font-light text-white tracking-tight">Manajemen Warta & Berita</h2>
                    <p className="text-xs text-stone-400 font-light">Kelola artikel warta yang tampil pada Bento Grid halaman utama</p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setIsNewsModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-cyan-500 text-black text-xs font-medium hover:bg-cyan-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                          newsFilter === cat
                            ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30'
                            : 'bg-white/[0.03] text-stone-400 border border-white/[0.06] hover:text-stone-200'
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
                      className="w-full sm:w-64 pl-8 pr-4 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-cyan-400/50"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 text-xs">
                      🔍
                    </span>
                  </div>
                </div>

                {/* Table of Articles */}
                <div className="rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/[0.03] text-stone-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/[0.06]">
                        <tr>
                          <th className="py-3.5 px-4 sm:px-6">Artikel</th>
                          <th className="py-3.5 px-4">Kategori</th>
                          <th className="py-3.5 px-4">Tanggal</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-stone-300">
                        {filteredNews.map((item) => (
                          <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 sm:px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden relative flex-shrink-0 bg-stone-900 border border-white/10">
                                  <Image src={item.src} alt={item.title} fill className="object-cover" />
                                </div>
                                <span className="font-normal text-white max-w-md truncate">
                                  {item.title}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-cyan-300 border border-cyan-400/30 bg-cyan-500/10">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-stone-400 font-mono">{item.date}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                                item.status === 'Published'
                                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/30'
                                  : 'bg-amber-500/10 text-amber-300 border border-amber-400/30'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => showToast(`Fitur edit "${item.title.substring(0, 20)}..." dibuka.`)}
                                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 text-stone-300 transition-colors"
                                  title="Edit Warta"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteNews(item.id)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-colors"
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
                    <div className="py-12 text-center text-stone-500 text-xs">
                      Tidak ada artikel yang cocok dengan pencarian.
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
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono uppercase mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      Manajemen Personalia Sekolah
                    </div>
                    <h2 className="text-xl font-light text-white tracking-tight">
                      Pimpinan & Dewan Guru <span className="font-normal text-stone-300">(GTK)</span>
                    </h2>
                    <p className="text-xs text-stone-400 font-light mt-0.5">
                      Kelola data Kepala Sekolah, para Wakasek, dewan guru pendidik, dan pembaruan data pokok sekolah yang tampil di website.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={() => setIsTeacherModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-cyan-500 text-black text-xs font-medium hover:bg-cyan-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
                    >
                      <span>+ Tambah Guru / Pendidik</span>
                    </button>
                  </div>
                </div>

                {/* --- BAGIAN 1: JAJARAN PIMPINAN SEKOLAH --- */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <span>Pimpinan Utama & Wakil Kepala Sekolah</span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-400/30">
                          {leadersList.length} Pimpinan
                        </span>
                      </h3>
                      <p className="text-xs text-stone-400 font-light">Data ini langsung disinkronkan ke tab "Pimpinan" pada halaman Profil depan.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {leadersList.map((leader) => (
                      <div 
                        key={leader.id}
                        className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl hover:border-cyan-400/40 transition-all flex flex-col justify-between gap-4 shadow-xl group relative overflow-hidden"
                      >
                        <div className="flex items-start gap-4">
                          <img 
                            src={leader.photo || '/teachers/default_avatar.svg'} 
                            alt={leader.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-cyan-400/30 flex-shrink-0 shadow-lg"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="text-sm font-medium text-white truncate">{leader.name}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${leader.badgeColor}`}>
                                {leader.role}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-stone-400 mb-2">NIP/Gol: {leader.nip}</p>
                            <p className="text-xs text-stone-300/90 font-light leading-relaxed italic bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                              "{leader.quote}"
                            </p>
                          </div>
                        </div>

                        {/* Leader Actions */}
                        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {leader.status}
                          </span>

                          <button
                            onClick={() => handleOpenEditLeader(leader)}
                            className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-cyan-500/20 hover:text-cyan-200 border border-white/10 text-xs font-normal text-stone-300 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>✏️ Ubah Profil / Ganti Pimpinan</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* --- BAGIAN 2: PEMBARUAN DATA POKOK PENDIDIKAN --- */}
                <div className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
                    <div>
                      <h3 className="text-sm font-medium text-white">Statistik Data Pokok Pendidikan</h3>
                      <p className="text-xs text-stone-400 font-light">Angka metrik ini tampil pada kartu Data Pokok di halaman profil utama</p>
                    </div>
                    <button
                      onClick={handleSaveDataPokok}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-500 text-black text-xs font-medium hover:bg-cyan-400 transition-all cursor-pointer shadow-md shadow-cyan-500/20"
                    >
                      Simpan Data Pokok
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="text-stone-400 block mb-1">Siswa Aktif</label>
                      <input 
                        type="text" 
                        value={dataPokok.siswa}
                        onChange={(e) => setDataPokok({ ...dataPokok, siswa: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-cyan-400/50"
                      />
                    </div>
                    <div>
                      <label className="text-stone-400 block mb-1">Rombongan Belajar</label>
                      <input 
                        type="text" 
                        value={dataPokok.rombel}
                        onChange={(e) => setDataPokok({ ...dataPokok, rombel: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-cyan-400/50"
                      />
                    </div>
                    <div>
                      <label className="text-stone-400 block mb-1">Dewan Guru</label>
                      <input 
                        type="text" 
                        value={dataPokok.guru}
                        onChange={(e) => setDataPokok({ ...dataPokok, guru: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-cyan-400/50"
                      />
                    </div>
                    <div>
                      <label className="text-stone-400 block mb-1">Tenaga Kependidikan</label>
                      <input 
                        type="text" 
                        value={dataPokok.staf}
                        onChange={(e) => setDataPokok({ ...dataPokok, staf: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-cyan-400/50"
                      />
                    </div>
                  </div>
                </div>

                {/* --- BAGIAN 3: DAFTAR DEWAN GURU & TENAGA PENDIDIK (GTK) --- */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <span>Daftar Guru & Tenaga Kependidikan</span>
                        <span className="text-[10px] font-mono text-stone-400 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/10">
                          {teachersList.length} Pendidik Terdaftar
                        </span>
                      </h3>
                      <p className="text-xs text-stone-400 font-light">Status keaktifan guru dapat diubah jika ada yang mutasi atau purnabakti.</p>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        placeholder="Cari nama guru / mapel..."
                        className="w-full sm:w-64 pl-8 pr-4 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-cyan-400/50"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 text-xs">
                        🔍
                      </span>
                    </div>
                  </div>

                  {/* Teachers Table */}
                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl overflow-hidden shadow-xl">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left text-xs table-auto">
                        <thead className="bg-white/[0.03] text-stone-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/[0.06]">
                          <tr>
                            <th className="py-3.5 px-4 sm:px-5">Guru & Tenaga Pendidik</th>
                            <th className="py-3.5 px-3 sm:px-4">Mata Pelajaran / Tugas</th>
                            <th className="py-3.5 px-3">Kepegawaian</th>
                            <th className="py-3.5 px-3">Status Keaktifan</th>
                            <th className="py-3.5 px-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] text-stone-300">
                          {filteredTeachers.map((teacher) => (
                            <tr key={teacher.id} className="hover:bg-white/[0.02] transition-colors">
                              {/* Kolom 1: Foto + Nama + NIP di bawahnya */}
                              <td className="py-3.5 px-4 sm:px-5">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={teacher.photo || '/teachers/default_avatar.svg'} 
                                    alt={teacher.name}
                                    className="w-10 h-10 rounded-xl object-cover border border-white/10 flex-shrink-0 shadow-sm"
                                  />
                                  <div className="min-w-0">
                                    <span className="block font-medium text-white truncate text-xs sm:text-sm">{teacher.name}</span>
                                    <span className="block text-[11px] font-mono text-stone-400 truncate mt-0.5">
                                      {teacher.nip && teacher.nip !== '-' ? `NIP/Gol. ${teacher.nip}` : teacher.status}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Kolom 2: Mata Pelajaran */}
                              <td className="py-3.5 px-3 sm:px-4 text-stone-200">
                                <span className="font-normal leading-relaxed">{teacher.subject}</span>
                              </td>

                              {/* Kolom 3: Status Kepegawaian */}
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.04] text-stone-300 border border-white/10">
                                  {teacher.status}
                                </span>
                              </td>

                              {/* Kolom 4: Status Keaktifan (Non-wrapping, modern glowing dot, direct toggle) */}
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTeacherActive(teacher.id)}
                                  title={teacher.active ? 'Klik untuk mengubah status jadi Mutasi / Nonaktif' : 'Klik untuk mengaktifkan kembali mengajar'}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer border select-none group shadow-sm ${
                                    teacher.active 
                                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-400/30 hover:border-emerald-400/60 shadow-emerald-950/20' 
                                      : 'bg-zinc-800/80 hover:bg-zinc-800 text-stone-400 border-white/10 hover:border-white/20'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full transition-transform group-hover:scale-125 ${
                                    teacher.active 
                                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' 
                                      : 'bg-stone-500'
                                  }`} />
                                  <span className="font-sans font-normal">
                                    {teacher.active ? 'Aktif' : 'Nonaktif'}
                                  </span>
                                  <span className="text-[10px] opacity-40 group-hover:opacity-100 transition-opacity">
                                    ⇄
                                  </span>
                                </button>
                              </td>

                              {/* Kolom 5: Aksi */}
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditTeacher(teacher)}
                                    className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/20 transition-all cursor-pointer shadow-sm"
                                    title="Ubah Data & Foto Guru"
                                  >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleToggleTeacherActive(teacher.id)}
                                    className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
                                      teacher.active 
                                        ? 'bg-white/[0.03] hover:bg-amber-500/10 text-stone-400 hover:text-amber-300 border-white/10 hover:border-amber-400/30' 
                                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                                    }`}
                                    title={teacher.active ? 'Ubah jadi Mutasi / Nonaktif' : 'Aktifkan Kembali Mengajar'}
                                  >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="m17 2 4 4-4 4" />
                                      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                                      <path d="m7 22-4-4 4-4" />
                                      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTeacher(teacher.id)}
                                    className="p-1.5 sm:p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 transition-all cursor-pointer shadow-sm"
                                    title="Hapus Guru dari Sistem"
                                  >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl">
                  <div>
                    <h2 className="text-lg font-light text-white tracking-tight">Manajemen Kalender & Agenda</h2>
                    <p className="text-xs text-stone-400 font-light">Jadwal pelaksanaan kegiatan akademik, ujian CBT, dan agenda resmi</p>
                  </div>

                  <button
                    onClick={() => setIsAgendaModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500 text-black text-xs font-medium hover:bg-cyan-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    <span>+ Tambah Agenda Baru</span>
                  </button>
                </div>

                {/* Agenda List Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agendaList.map((agenda) => (
                    <div 
                      key={agenda.id}
                      className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl hover:border-cyan-400/30 transition-all flex items-start justify-between gap-4 shadow-xl"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-cyan-300 border border-cyan-400/30 bg-cyan-500/10">
                            {agenda.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                            agenda.status === 'Berlangsung' ? 'text-amber-300 bg-amber-500/10' : 'text-stone-400 bg-white/[0.03]'
                          }`}>
                            {agenda.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-normal text-white">{agenda.name}</h4>
                        <p className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                          <span>🗓️</span>
                          <span>{agenda.date}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteAgenda(agenda.id)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-colors"
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
                <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-light text-white tracking-tight">Manajemen Galeri & Fasilitas</h2>
                    <p className="text-xs text-stone-400 font-light">Foto dokumentasi kegiatan belajar dan sarana kampus terpadu</p>
                  </div>

                  <button
                    onClick={() => showToast('Pilih file foto dari komputer Anda untuk diunggah.')}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500 text-black text-xs font-medium hover:bg-cyan-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    <span>+ Unggah Media Baru</span>
                  </button>
                </div>

                {/* Upload Drag & Drop Simulation Area */}
                <div 
                  onClick={() => showToast('Simulasi unggah: foto siap dihubungkan ke Supabase Storage.')}
                  className="p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-cyan-400/40 bg-white/[0.015] hover:bg-white/[0.03] transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300 text-xl">
                    📁
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-white">Tarik & lepas foto ke sini, atau klik untuk memilih berkas</p>
                  <p className="text-[11px] text-stone-500 font-mono">Format didukung: JPG, PNG, WebP (Maks. 5 MB/foto)</p>
                </div>

                {/* Photo Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {galleryList.map((photo) => (
                    <div 
                      key={photo.id}
                      className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] shadow-xl"
                    >
                      <Image src={photo.src} alt={photo.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-cyan-300 border border-cyan-400/30 bg-black/60 backdrop-blur-md">
                            {photo.category}
                          </span>
                          <button
                            onClick={() => handleDeleteGallery(photo.id)}
                            className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Hapus Foto"
                          >
                            🗑️
                          </button>
                        </div>
                        <h4 className="text-xs font-normal text-white line-clamp-2">{photo.title}</h4>
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
                <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl">
                  <h2 className="text-lg font-light text-white tracking-tight">Kotak Pesan Masuk (Kontak & Aduan)</h2>
                  <p className="text-xs text-stone-400 font-light">Pesan dan pertanyaan resmi dari masyarakat dan wali murid via website</p>
                </div>

                {/* Message Cards */}
                <div className="space-y-4">
                  {messagesList.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        msg.read 
                          ? 'bg-white/[0.02] border-white/[0.06]' 
                          : 'bg-cyan-950/15 border-cyan-400/30 shadow-lg'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <h4 className="text-sm font-medium text-white">{msg.sender}</h4>
                          <span className="text-[11px] text-stone-400 font-mono">({msg.contact})</span>
                        </div>
                        <span className="text-[10px] font-mono text-stone-400">{msg.date}</span>
                      </div>

                      <h5 className="text-xs font-semibold text-cyan-300 mb-1.5">{msg.subject}</h5>
                      <p className="text-xs text-stone-300 font-light leading-relaxed mb-4">{msg.message}</p>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/?text=Halo%20${encodeURIComponent(msg.sender)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-300 text-xs font-normal transition-all"
                        >
                          Balas via WhatsApp
                        </a>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs font-normal transition-all"
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
                <div className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl space-y-4">
                  <h3 className="text-sm font-medium text-white pb-3 border-b border-white/[0.07]">
                    Identitas Resmi Sekolah
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-stone-400 block mb-1">Nama Satuan Pendidikan</label>
                      <input 
                        type="text" 
                        defaultValue="SMP Negeri 3 Cihampelas" 
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-cyan-400/50"
                      />
                    </div>
                    <div>
                      <label className="text-stone-400 block mb-1">NPSN</label>
                      <input 
                        type="text" 
                        defaultValue="20224133" 
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-cyan-400/50"
                      />
                    </div>
                    <div>
                      <label className="text-stone-400 block mb-1">Status Akreditasi</label>
                      <input 
                        type="text" 
                        defaultValue="A (Unggul) - BAN S/M" 
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-cyan-400/50"
                      />
                    </div>
                    <div>
                      <label className="text-stone-400 block mb-1">Kecamatan / Kabupaten</label>
                      <input 
                        type="text" 
                        defaultValue="Cihampelas, Kab. Bandung Barat" 
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-cyan-400/50"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => showToast('Identitas sekolah berhasil diperbarui!')}
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-xs font-medium hover:bg-cyan-400 transition-all cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>

                {/* Password Change */}
                <div className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl space-y-4">
                  <h3 className="text-sm font-medium text-white pb-3 border-b border-white/[0.07]">
                    Keamanan & Kata Sandi Admin
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-stone-400 block mb-1">Kata Sandi Baru</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-cyan-400/50"
                      />
                    </div>
                    <div>
                      <label className="text-stone-400 block mb-1">Konfirmasi Kata Sandi</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-cyan-400/50"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => showToast('Kata sandi admin berhasil diperbarui!')}
                    className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-normal transition-all cursor-pointer"
                  >
                    Perbarui Kata Sandi
                  </button>
                </div>

                {/* Synchronization & Data Reset */}
                <div className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/[0.07] gap-2">
                    <div>
                      <h3 className="text-sm font-medium text-white">Sinkronisasi & Reset Data Sekolah</h3>
                      <p className="text-xs text-stone-400 font-light">Data pimpinan, direktori guru, dan data pokok tersimpan otomatis di LocalStorage browser.</p>
                    </div>
                    <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Tersinkronisasi Realtime
                    </span>
                  </div>

                  <p className="text-xs text-stone-300/80 leading-relaxed font-light">
                    Semua perubahan yang Anda simpan di Admin Dashboard langsung terhubung dan otomatis mengubah tampilan di halaman publik (Landing Page). Jika Anda ingin mengembalikan seluruh data pimpinan dan guru ke setelan awal pabrik, gunakan tombol reset di bawah:
                  </p>

                  <button
                    onClick={() => {
                      if (confirm('Apakah Anda yakin ingin mereset seluruh data pimpinan, guru, dan data pokok ke setelan default awal?')) {
                        resetSchoolData();
                        showToast('🔄 Seluruh data berhasil direset ke setelan awal!');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-normal transition-all cursor-pointer flex items-center gap-2"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
        >
          <div 
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="w-full max-w-lg rounded-[2rem] bg-[#0c0d11] border border-white/15 p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <h3 className="text-base font-normal text-white">Tulis Warta Baru</h3>
              <button 
                onClick={() => setIsNewsModalOpen(false)}
                className="text-stone-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNews} className="space-y-4 text-xs">
              <div>
                <label className="text-stone-300 block mb-1.5 font-medium">Judul Warta</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Tim Robotika Meraih Medali Emas..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 block mb-1.5 font-medium">Kategori</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#14151b] border border-white/10 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Prestasi">Prestasi</option>
                    <option value="Pengumuman">Pengumuman</option>
                    <option value="Inovasi">Inovasi</option>
                    <option value="Akademik">Akademik</option>
                  </select>
                </div>
                <div>
                  <label className="text-stone-300 block mb-1.5 font-medium">Pilih Foto Sampul</label>
                  <select
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#14151b] border border-white/10 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
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
                <label className="text-stone-300 block mb-1.5 font-medium">Ringkasan / Kutipan</label>
                <textarea
                  rows={3}
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  placeholder="Kutipan singkat berita untuk cuplikan depan..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-medium cursor-pointer shadow-lg shadow-cyan-500/20"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
        >
          <div 
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="w-full max-w-md rounded-[2rem] bg-[#0c0d11] border border-white/15 p-6 shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <h3 className="text-base font-normal text-white">Tambah Agenda Akademik</h3>
              <button 
                onClick={() => setIsAgendaModalOpen(false)}
                className="text-stone-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAgenda} className="space-y-4 text-xs">
              <div>
                <label className="text-stone-300 block mb-1.5 font-medium">Nama Kegiatan</label>
                <input
                  type="text"
                  required
                  value={newAgendaName}
                  onChange={(e) => setNewAgendaName(e.target.value)}
                  placeholder="Contoh: Ujian Asesmen Akhir Semester..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-stone-300 block mb-1.5 font-medium">Rentang Tanggal</label>
                <input
                  type="text"
                  required
                  value={newAgendaDate}
                  onChange={(e) => setNewAgendaDate(e.target.value)}
                  placeholder="Contoh: 12 - 18 Desember 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-stone-300 block mb-1.5 font-medium">Kategori</label>
                <select
                  value={newAgendaCategory}
                  onChange={(e) => setNewAgendaCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#14151b] border border-white/10 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
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
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-medium cursor-pointer shadow-lg shadow-cyan-500/20"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
        >
          <div 
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="w-full max-w-lg rounded-[2rem] bg-[#0c0d11] border border-white/15 p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <div>
                <h3 className="text-base font-normal text-white">Ubah Data / Ganti Pimpinan</h3>
                <p className="text-xs text-stone-400 font-light mt-0.5">Jabatan: {selectedLeader.role}</p>
              </div>
              <button 
                onClick={() => setIsLeaderModalOpen(false)}
                className="text-stone-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLeader} className="space-y-4 text-xs">
              {/* Photo Selector */}
              <div>
                <label className="text-stone-300 block mb-1.5 font-medium">Foto Profil Pimpinan</label>
                <div className="flex items-center gap-3 mb-2.5">
                  <img 
                    src={leaderFormPhoto || '/teachers/default_avatar.svg'} 
                    alt="Preview" 
                    className="w-14 h-14 rounded-2xl object-cover border border-cyan-400/40 shadow-md flex-shrink-0"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={leaderFormPhoto}
                      onChange={(e) => setLeaderFormPhoto(e.target.value)}
                      placeholder="URL foto pimpinan..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                    />
                    <p className="text-[10px] text-stone-500 mt-1">Bisa gunakan link gambar atau pilih foto preset di bawah.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-stone-400">Pilihan Cepat:</span>
                  {PHOTO_PRESETS.map((p) => (
                    <button
                      key={p.src}
                      type="button"
                      onClick={() => setLeaderFormPhoto(p.src)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                        leaderFormPhoto === p.src
                          ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200'
                          : 'border-white/10 bg-white/[0.02] text-stone-400 hover:text-white'
                      }`}
                    >
                      <img src={p.src} alt={p.label} className="w-4 h-4 rounded-full object-cover" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-stone-300 block mb-1.5 font-medium">Nama Lengkap & Gelar Pimpinan</label>
                <input
                  type="text"
                  required
                  value={leaderFormName}
                  onChange={(e) => setLeaderFormName(e.target.value)}
                  placeholder="Contoh: Dr. H. Ahmad Fauzi, M.Pd."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 block mb-1.5 font-medium">Jabatan Pimpinan</label>
                  <input
                    type="text"
                    required
                    value={leaderFormRole}
                    onChange={(e) => setLeaderFormRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-stone-300 block mb-1.5 font-medium">NIP / NUPTK</label>
                  <input
                    type="text"
                    value={leaderFormNip}
                    onChange={(e) => setLeaderFormNip(e.target.value)}
                    placeholder="19740512..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-300 block mb-1.5 font-medium">Kutipan Visi / Pesan Pimpinan</label>
                <textarea
                  rows={3}
                  value={leaderFormQuote}
                  onChange={(e) => setLeaderFormQuote(e.target.value)}
                  placeholder="Kutipan arahan pimpinan yang tampil pada website..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLeaderModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-medium cursor-pointer shadow-lg shadow-cyan-500/20"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
        >
          <div 
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="w-full max-w-md rounded-[2rem] bg-[#0c0d11] border border-white/15 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <div>
                <h3 className="text-base font-normal text-white">Tambah Guru / Pendidik Baru</h3>
                <p className="text-xs text-stone-400 font-light mt-0.5">Daftarkan guru baru ke database sekolah</p>
              </div>
              <button 
                onClick={() => setIsTeacherModalOpen(false)}
                className="text-stone-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-4 text-xs">
              {/* Photo Selector */}
              <div>
                <label className="text-stone-300 block mb-1.5 font-medium">Foto Profil Guru</label>
                <div className="flex items-center gap-3 mb-2.5">
                  <img 
                    src={newTeacherPhoto || '/teachers/default_avatar.svg'} 
                    alt="Preview" 
                    className="w-12 h-12 rounded-xl object-cover border border-cyan-400/40 shadow-md flex-shrink-0"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newTeacherPhoto}
                      onChange={(e) => setNewTeacherPhoto(e.target.value)}
                      placeholder="URL foto..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-stone-400">Preset Foto:</span>
                  {PHOTO_PRESETS.map((p) => (
                    <button
                      key={p.src}
                      type="button"
                      onClick={() => setNewTeacherPhoto(p.src)}
                      className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                        newTeacherPhoto === p.src
                          ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200'
                          : 'border-white/10 bg-white/[0.02] text-stone-400 hover:text-white'
                      }`}
                    >
                      <img src={p.src} alt={p.label} className="w-4 h-4 rounded-full object-cover" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-stone-300 block mb-1.5 font-medium">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="Contoh: Hendra Gunawan, S.Pd., M.M."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-stone-300 block mb-1.5 font-medium">Mata Pelajaran / Tugas</label>
                <input
                  type="text"
                  required
                  value={newTeacherSubject}
                  onChange={(e) => setNewTeacherSubject(e.target.value)}
                  placeholder="Contoh: Ilmu Pengetahuan Sosial (IPS)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 block mb-1.5 font-medium">NIP / NUPTK</label>
                  <input
                    type="text"
                    value={newTeacherNip}
                    onChange={(e) => setNewTeacherNip(e.target.value)}
                    placeholder="Boleh kosong jika GTT"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-stone-300 block mb-1.5 font-medium">Status Kepegawaian</label>
                  <select
                    value={newTeacherStatus}
                    onChange={(e) => setNewTeacherStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#14151b] border border-white/10 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="GTT / Honorer">GTT / Honorer</option>
                    <option value="Tenaga Kependidikan">Tenaga Kependidikan</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-medium cursor-pointer shadow-lg shadow-cyan-500/20"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
        >
          <div 
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="w-full max-w-md rounded-[2rem] bg-[#0c0d11] border border-white/15 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <div>
                <h3 className="text-base font-normal text-white">Ubah Data & Foto Guru</h3>
                <p className="text-xs text-stone-400 font-light mt-0.5">Kelola identitas pendidik</p>
              </div>
              <button 
                onClick={() => setIsEditTeacherModalOpen(false)}
                className="text-stone-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditTeacher} className="space-y-4 text-xs">
              {/* Photo Selector */}
              <div>
                <label className="text-stone-300 block mb-1.5 font-medium">Foto Profil Guru</label>
                <div className="flex items-center gap-3 mb-2.5">
                  <img 
                    src={editTeacherPhoto || '/teachers/default_avatar.svg'} 
                    alt="Preview" 
                    className="w-14 h-14 rounded-2xl object-cover border border-cyan-400/40 shadow-md flex-shrink-0"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editTeacherPhoto}
                      onChange={(e) => setEditTeacherPhoto(e.target.value)}
                      placeholder="URL foto..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                    />
                    <p className="text-[10px] text-stone-500 mt-1">Ganti dengan URL gambar atau pilih foto preset.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-stone-400">Pilihan Cepat:</span>
                  {PHOTO_PRESETS.map((p) => (
                    <button
                      key={p.src}
                      type="button"
                      onClick={() => setEditTeacherPhoto(p.src)}
                      className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                        editTeacherPhoto === p.src
                          ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200'
                          : 'border-white/10 bg-white/[0.02] text-stone-400 hover:text-white'
                      }`}
                    >
                      <img src={p.src} alt={p.label} className="w-4 h-4 rounded-full object-cover" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-stone-300 block mb-1.5 font-medium">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={editTeacherName}
                  onChange={(e) => setEditTeacherName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-stone-300 block mb-1.5 font-medium">Mata Pelajaran / Tugas</label>
                <input
                  type="text"
                  required
                  value={editTeacherSubject}
                  onChange={(e) => setEditTeacherSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 block mb-1.5 font-medium">Status Kepegawaian</label>
                  <select
                    value={editTeacherStatus}
                    onChange={(e) => setEditTeacherStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#14151b] border border-white/10 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="GTT / Honorer">GTT / Honorer</option>
                    <option value="Tenaga Kependidikan">Tenaga Kependidikan</option>
                  </select>
                </div>
                <div>
                  <label className="text-stone-300 block mb-1.5 font-medium">Status Keaktifan</label>
                  <select
                    value={editTeacherActive ? 'true' : 'false'}
                    onChange={(e) => setEditTeacherActive(e.target.value === 'true')}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#14151b] border border-white/10 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="true">● Aktif Mengajar</option>
                    <option value="false">○ Mutasi / Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditTeacherModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-medium cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  Simpan Perubahan Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
