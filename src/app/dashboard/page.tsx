'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSchoolData, Leader, Teacher, DataPokok } from '@/lib/schoolData';
import { useWartaData, WartaItem } from '@/lib/wartaData';
import { AddNewsModal, EditNewsModal } from '@/components/WartaModals';
import { 
  Student, 
  INITIAL_STUDENTS, 
  getStoredStudents, 
  saveStoredStudents 
} from '@/lib/elearningData';

// Tab Subcomponents (Semua terisolasi agar render super ringan dan 100% anti-lag)
import { TabOverview } from '@/components/dashboard/TabOverview';
import { TabWarta } from '@/components/dashboard/TabWarta';
import { TabSiswa } from '@/components/dashboard/TabSiswa';
import { TabPimpinan } from '@/components/dashboard/TabPimpinan';
import { TabAgenda } from '@/components/dashboard/TabAgenda';
import { TabGaleri } from '@/components/dashboard/TabGaleri';
import { TabPesan } from '@/components/dashboard/TabPesan';
import { TabPengaturan } from '@/components/dashboard/TabPengaturan';

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

const DEFAULT_AGENDA = [
  { id: 1, name: 'Masa Pengenalan Lingkungan Sekolah (MPLS)', date: '15 - 20 Juli 2026', category: 'Akademik', status: 'Selesai' },
  { id: 2, name: 'Upacara Peringatan Hari Kemerdekaan RI Ke-81', date: '17 Agustus 2026', category: 'Kegiatan', status: 'Selesai' },
  { id: 3, name: 'Asesmen Tengah Semester (Sumatif) Ganjil', date: '21 - 26 September 2026', category: 'Ujian CBT', status: 'Berlangsung' },
  { id: 4, name: 'Asesmen Akhir Semester (PAS) Berbasis Digital', date: '04 - 12 Desember 2026', category: 'Ujian CBT', status: 'Mendatang' },
  { id: 5, name: 'Gelar Karya P5 Kewirausahaan & Pentas Seni', date: '18 Desember 2026', category: 'Kreativitas', status: 'Mendatang' },
];

const DEFAULT_GALLERY = [
  { id: 1, title: 'Laboratorium Komputer & Digital 4.0', category: 'FASILITAS', src: '/gallery_2.jpg' },
  { id: 2, title: 'Perpustakaan Digital Terpadu', category: 'FASILITAS', src: '/gallery_1.jpg' },
  { id: 3, title: 'Upacara Bendera & Pembinaan Karakter', category: 'KEGIATAN', src: '/slide1.jpeg' },
  { id: 4, title: 'Turnamen & Kejuaraan Olahraga KBB', category: 'EKSTRAKURIKULER', src: '/slide3.jpeg' },
  { id: 5, title: 'Creative STEM & Robotika Room', category: 'FASILITAS', src: '/slide4.jpeg' },
  { id: 6, title: 'Praktikum Sains & Kolaborasi Kelas', category: 'AKADEMIK', src: '/slide7.jpeg' },
];

const DEFAULT_MESSAGES = [
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
];

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

  // --- DATA SOURCES ---
  // 1. Siswa (535 Siswa)
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  useEffect(() => {
    setStudentsList(getStoredStudents());
    const handleUpdate = () => setStudentsList(getStoredStudents());
    window.addEventListener('elearningStudentsUpdated', handleUpdate);
    return () => window.removeEventListener('elearningStudentsUpdated', handleUpdate);
  }, []);

  const handleAddStudent = (data: { name: string; nisn: string; nis: string; classId: string }) => {
    const newStudent: Student = {
      id: `${data.classId.replace('-', '')}-${String(studentsList.length + 1).padStart(2, '0')}`,
      name: data.name,
      nisn: data.nisn,
      nis: data.nis,
      classId: data.classId,
      gender: '-'
    };
    const updated = [newStudent, ...studentsList];
    saveStoredStudents(updated);
    setStudentsList(updated);
    showToast(`✅ Siswa "${newStudent.name}" berhasil ditambahkan ke ${newStudent.classId}!`);
  };

  const handleEditStudent = (id: string, data: { name: string; nisn: string; nis: string; classId: string }) => {
    const updated = studentsList.map(s => s.id === id ? { ...s, ...data } : s);
    saveStoredStudents(updated);
    setStudentsList(updated);
    showToast(`✅ Data siswa "${data.name}" berhasil diperbarui!`);
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    if (!confirm(`Yakin ingin menghapus data siswa "${studentName}"?`)) return;
    const updated = studentsList.filter(s => s.id !== studentId);
    saveStoredStudents(updated);
    setStudentsList(updated);
    showToast(`Data siswa "${studentName}" berhasil dihapus.`);
  };

  const handleImportStudents = (allImported: Student[]) => {
    saveStoredStudents(allImported);
    setStudentsList(allImported);
  };

  const handleResetStudents = () => {
    if (!confirm('Yakin ingin mereset seluruh data kembali ke daftar 535 siswa awal 2026/2027?')) return;
    saveStoredStudents(INITIAL_STUDENTS);
    setStudentsList(INITIAL_STUDENTS);
    showToast('Data siswa berhasil direset ke 535 siswa awal!');
  };

  // 2. Warta (Berita & Informasi Bento Grid)
  const { 
    wartaList, 
    addWarta, 
    updateWarta, 
    deleteWarta 
  } = useWartaData();

  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isEditNewsModalOpen, setIsEditNewsModalOpen] = useState(false);
  const [editingNewsItem, setEditingNewsItem] = useState<WartaItem | null>(null);

  const handleOpenEditNews = (item: WartaItem) => {
    setEditingNewsItem(item);
    setIsEditNewsModalOpen(true);
  };

  // 3. School Data (Pimpinan, Dewan Guru GTK, Data Pokok)
  const { 
    leaders, 
    teachers, 
    dataPokok, 
    setLeaders: saveLeaders, 
    setTeachers: saveTeachers, 
    setDataPokok: saveDataPokok,
    resetData: resetSchoolData
  } = useSchoolData();

  const handleSaveLeader = (leaderId: number, data: Partial<Leader>) => {
    const updated = leaders.map(l => l.id === leaderId ? { ...l, ...data } : l);
    saveLeaders(updated);
  };

  const handleAddTeacher = (newTData: Omit<Teacher, 'id'>) => {
    const newT: Teacher = {
      id: Date.now(),
      ...newTData
    };
    const updated = [newT, ...teachers];
    saveTeachers(updated);
  };

  const handleSaveTeacher = (teacherId: number, data: Partial<Teacher>) => {
    const updated = teachers.map(t => t.id === teacherId ? { ...t, ...data } : t);
    saveTeachers(updated);
  };

  const handleToggleTeacherActive = (id: number) => {
    const updated = teachers.map(t => {
      if (t.id === id) {
        const nextActive = !t.active;
        showToast(nextActive ? `Guru "${t.name}" diaktifkan kembali di Landing Page.` : `Guru "${t.name}" dinonaktifkan / mutasi di Landing Page.`);
        return { ...t, active: nextActive };
      }
      return t;
    });
    saveTeachers(updated);
  };

  const handleDeleteTeacher = (id: number) => {
    const updated = teachers.filter(t => t.id !== id);
    saveTeachers(updated);
    showToast('🗑️ Data guru telah dihapus dari direktori & Landing Page.');
  };

  // 4. Agenda Akademik
  const [agendaList, setAgendaList] = useState<typeof DEFAULT_AGENDA>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smpn3_agenda_data_v1');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_AGENDA;
  });

  const handleAddAgenda = (data: { name: string; date: string; category: string }) => {
    const newItem = {
      id: Date.now(),
      name: data.name,
      date: data.date,
      category: data.category,
      status: 'Mendatang'
    };
    const updated = [...agendaList, newItem];
    setAgendaList(updated);
    try { localStorage.setItem('smpn3_agenda_data_v1', JSON.stringify(updated)); } catch {}
  };

  const handleDeleteAgenda = (id: number) => {
    const updated = agendaList.filter(a => a.id !== id);
    setAgendaList(updated);
    try { localStorage.setItem('smpn3_agenda_data_v1', JSON.stringify(updated)); } catch {}
    showToast('🗑️ Agenda berhasil dihapus.');
  };

  // 5. Galeri & Fasilitas
  const [galleryList, setGalleryList] = useState<typeof DEFAULT_GALLERY>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smpn3_gallery_data_v1');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_GALLERY;
  });

  const handleAddGallery = (data: { title: string; category: string; src: string }) => {
    const newItem = {
      id: Date.now(),
      ...data
    };
    const updated = [newItem, ...galleryList];
    setGalleryList(updated);
    try { localStorage.setItem('smpn3_gallery_data_v1', JSON.stringify(updated)); } catch {}
  };

  const handleDeleteGallery = (id: number) => {
    const updated = galleryList.filter(g => g.id !== id);
    setGalleryList(updated);
    try { localStorage.setItem('smpn3_gallery_data_v1', JSON.stringify(updated)); } catch {}
    showToast('🗑️ Foto telah dihapus dari galeri.');
  };

  // 6. Pesan Masuk
  const [messagesList, setMessagesList] = useState<typeof DEFAULT_MESSAGES>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smpn3_messages_data_v1');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_MESSAGES;
  });

  const handleDeleteMessage = (id: number) => {
    const updated = messagesList.filter(m => m.id !== id);
    setMessagesList(updated);
    try { localStorage.setItem('smpn3_messages_data_v1', JSON.stringify(updated)); } catch {}
    showToast('🗑️ Pesan berhasil dihapus.');
  };

  const handleLogout = () => {
    showToast('Keluar dari sesi admin...');
    setTimeout(() => {
      router.push('/login');
    }, 500);
  };

  const unreadMessagesCount = messagesList.filter(m => !m.read).length;

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
                type="button"
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
                  badge: `${wartaList.length}`
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
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                  badge: `${teachers.length}`
                },
                {
                  id: 'agenda',
                  label: 'Kalender Akademik',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                  ),
                  badge: `${agendaList.length}`
                },
                {
                  id: 'galeri',
                  label: 'Galeri & Fasilitas',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
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
                  badge: `${unreadMessagesCount || messagesList.length}`
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
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={activeTab === item.id ? 'text-white' : 'text-slate-600'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                      activeTab === item.id
                        ? 'bg-white text-indigo-700'
                        : 'bg-slate-200 text-slate-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Bottom Admin User & Logout */}
          <div className="p-4 border-t-2 border-slate-100">
            <div className="p-3 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-between mb-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                  AD
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-950">Admin Utama</span>
                  <span className="text-[10px] font-mono text-emerald-800 font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Superadmin
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 px-3.5 rounded-xl border-2 border-slate-300 hover:border-rose-400 bg-white hover:bg-rose-50 text-slate-800 hover:text-rose-700 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
            >
              <span>🚪</span>
              <span>Keluar Sesi</span>
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div 
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm lg:hidden animate-[fadeIn_0.2s_ease-out]"
          />
        )}

        {/* ========================================================================= */}
        {/* MAIN DASHBOARD CONTENT AREA */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          
          {/* Top Navbar Header */}
          <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b-2 border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl border-2 border-slate-300 text-slate-800 hover:bg-slate-100"
                aria-label="Buka Menu Sidebar"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </button>

              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-950 tracking-tight capitalize flex items-center gap-2">
                  {activeTab === 'overview' && 'Ringkasan Sistem & Konten'}
                  {activeTab === 'warta' && 'Manajemen Warta & Berita'}
                  {activeTab === 'siswa' && 'Manajemen Data Siswa & Rombel'}
                  {activeTab === 'pimpinan' && 'Manajemen Pimpinan & Guru (GTK)'}
                  {activeTab === 'agenda' && 'Kalender & Agenda Akademik'}
                  {activeTab === 'galeri' && 'Manajemen Galeri & Fasilitas'}
                  {activeTab === 'pesan' && 'Kotak Pesan Masuk Wali Murid'}
                  {activeTab === 'pengaturan' && 'Pengaturan Profil & Website'}
                </h1>
                <p className="text-xs text-slate-600 font-semibold hidden sm:block">
                  Sistem Informasi & Manajemen Konten SMP Negeri 3 Cihampelas
                </p>
              </div>
            </div>

            {/* Right Quick Nav & Time Badge */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-mono font-black text-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <DashboardClock />
              </div>

              <Link
                href="/"
                target="_blank"
                className="px-3 sm:px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-900 text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-xs"
                title="Buka Website Sekolah di Tab Baru"
              >
                <span>🌐</span>
                <span className="hidden sm:inline">Lihat Web Sekolah</span>
              </Link>
            </div>
          </header>

          {/* Main Tab Render Body */}
          <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
            {activeTab === 'overview' && (
              <TabOverview
                newsList={wartaList}
                leadersList={leaders}
                teachersList={teachers}
                agendaList={agendaList}
                messagesList={messagesList}
                onNavigateTab={setActiveTab}
                onOpenAddNews={() => setIsNewsModalOpen(true)}
                onOpenAddAgenda={() => setActiveTab('agenda')}
              />
            )}

            {activeTab === 'warta' && (
              <TabWarta
                newsList={wartaList}
                onOpenAdd={() => setIsNewsModalOpen(true)}
                onOpenEdit={handleOpenEditNews}
                onDelete={(id) => {
                  deleteWarta(id);
                  showToast('🗑️ Artikel warta telah dihapus dari sistem.');
                }}
              />
            )}

            {activeTab === 'siswa' && (
              <TabSiswa
                studentsList={studentsList}
                onAddStudent={handleAddStudent}
                onEditStudent={handleEditStudent}
                onDeleteStudent={handleDeleteStudent}
                onImportStudents={handleImportStudents}
                onResetStudents={handleResetStudents}
                showToast={showToast}
              />
            )}

            {activeTab === 'pimpinan' && (
              <TabPimpinan
                leadersList={leaders}
                teachersList={teachers}
                dataPokok={dataPokok}
                onSaveLeader={handleSaveLeader}
                onAddTeacher={handleAddTeacher}
                onSaveTeacher={handleSaveTeacher}
                onDeleteTeacher={handleDeleteTeacher}
                onToggleTeacherActive={handleToggleTeacherActive}
                onSaveDataPokok={(updatedPokok) => {
                  saveDataPokok(updatedPokok);
                }}
                showToast={showToast}
              />
            )}

            {activeTab === 'agenda' && (
              <TabAgenda
                agendaList={agendaList}
                onAddAgenda={handleAddAgenda}
                onDeleteAgenda={handleDeleteAgenda}
                showToast={showToast}
              />
            )}

            {activeTab === 'galeri' && (
              <TabGaleri
                galleryList={galleryList}
                onAddGallery={handleAddGallery}
                onDeleteGallery={handleDeleteGallery}
                showToast={showToast}
              />
            )}

            {activeTab === 'pesan' && (
              <TabPesan
                messagesList={messagesList}
                onDeleteMessage={handleDeleteMessage}
              />
            )}

            {activeTab === 'pengaturan' && (
              <TabPengaturan
                onResetSchoolData={resetSchoolData}
                showToast={showToast}
              />
            )}
          </main>
        </div>

      </div>

      {/* Global Warta Modals (Isolated & Zero Lag) */}
      <AddNewsModal
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        onAdd={addWarta}
        showToast={showToast}
      />

      <EditNewsModal
        isOpen={isEditNewsModalOpen}
        item={editingNewsItem}
        onClose={() => setIsEditNewsModalOpen(false)}
        onSave={(id, data) => updateWarta(id, data)}
        onDelete={(id) => deleteWarta(id)}
        showToast={showToast}
      />

    </div>
  );
}
