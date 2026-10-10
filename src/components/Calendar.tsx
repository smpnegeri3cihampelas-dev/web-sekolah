'use client';

import React, { useState, useEffect } from 'react';

export interface AgendaItem {
  id: number;
  name: string;
  date: string;
  category: string;
  status: string;
  semester?: string;
  title?: string;
  type?: string;
}

export const OFFICIAL_KALDIK_SMPN3: AgendaItem[] = [
  // SEMESTER 1 (2026)
  {
    id: 1,
    name: 'Hari Pertama Masuk Sekolah',
    date: '13 Juli 2026',
    category: 'Akademik',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 2,
    name: 'Pengenalan Lingkungan Sekolah (MPLS)',
    date: '15 - 17 & 20 - 21 Juli 2026',
    category: 'Akademik',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 3,
    name: 'Pelaksanaan Sulingjar (Survei Lingkungan Belajar)',
    date: '03 - 26 Agustus 2026',
    category: 'Akademik',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 4,
    name: 'Kegiatan Hari Pramuka Nasional',
    date: '14 Agustus 2026',
    category: 'Kegiatan',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 5,
    name: 'Libur Hari Proklamasi Kemerdekaan RI',
    date: '17 Agustus 2026',
    category: 'Libur Resmi',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 6,
    name: 'Olimpiade Olahraga Siswa Nasional (O2SN) Tk. Nasional',
    date: '19 - 23 Agustus 2026',
    category: 'Kesiswaan',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 7,
    name: 'Libur Maulid Nabi Muhammad SAW',
    date: '25 Agustus 2026',
    category: 'Libur Resmi',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 8,
    name: 'Olimpiade Sains Nasional (OSN) Jenjang Dikdas Tk. Nasional',
    date: '25 - 31 Agustus 2026',
    category: 'Akademik',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 9,
    name: 'FLS2N Jenjang Pendidikan Dasar Tk. Nasional (Daring)',
    date: '28 Sep - 03 Okt 2026',
    category: 'Kreativitas',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 10,
    name: 'Gelar Aksi Karakter Siswa Indonesia Tk. Provinsi',
    date: '21 November 2026',
    category: 'Kesiswaan',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 11,
    name: 'Peringatan Hari Guru Nasional',
    date: '25 November 2026',
    category: 'Kegiatan',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 12,
    name: 'Pelaksanaan Sumatif Akhir Semester 1 (SAS 1)',
    date: '30 Nov - 11 Des 2026',
    category: 'Ujian CBT',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 13,
    name: 'Hari Disabilitas Internasional',
    date: '03 Desember 2026',
    category: 'Kegiatan',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 14,
    name: 'Penetapan dan Pembagian Rapor Semester 1',
    date: '23 Desember 2026',
    category: 'Akademik',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 15,
    name: 'Cuti Bersama & Libur Hari Natal',
    date: '24 - 25 Desember 2026',
    category: 'Libur Resmi',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 16,
    name: 'Libur Semester 1',
    date: '28 Des 2026 - 08 Jan 2027',
    category: 'Libur Semester',
    semester: 'Semester 1',
    status: 'Mendatang'
  },

  // SEMESTER 2 (2027)
  {
    id: 17,
    name: 'Hari Pertama Masuk Sekolah Semester 2',
    date: '11 Januari 2027',
    category: 'Akademik',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 18,
    name: 'Kegiatan Penumbuhan Budi Pekerti (SMARTTREN Ramadhan)',
    date: '15 Feb - 05 Mar 2027',
    category: 'Kegiatan',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 19,
    name: 'Perkiraan Libur Hari Raya Idul Fitri 1448 H',
    date: '08 - 19 Maret 2027',
    category: 'Libur Resmi',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 20,
    name: 'Libur Wafat Isa Almasih',
    date: '26 April 2027',
    category: 'Libur Resmi',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 21,
    name: 'Hari Pendidikan Nasional (Hardiknas)',
    date: '02 Mei 2027',
    category: 'Kegiatan',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 22,
    name: 'Perkiraan Sumatif Akhir Jenjang SMP (Ujian Sekolah Kelas 9)',
    date: '11 - 21 Mei 2027',
    category: 'Ujian CBT',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 23,
    name: 'Perkiraan Penetapan Kelulusan Siswa Kelas 9',
    date: '02 Juni 2027',
    category: 'Akademik',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 24,
    name: 'Perkiraan Sumatif Akhir Tahun (SAT) / Akhir Fase',
    date: '07 - 18 Juni 2027',
    category: 'Ujian CBT',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 25,
    name: 'Tanggal Penetapan dan Pembagian Rapor Semester 2',
    date: '25 Juni 2027',
    category: 'Akademik',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 26,
    name: 'Libur Akhir Tahun Pelajaran',
    date: '28 Juni - 09 Juli 2027',
    category: 'Libur Semester',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 27,
    name: 'Masa SPMB / PPDB Tahun Pelajaran 2027/2028',
    date: 'Juni - Juli 2027',
    category: 'Akademik',
    semester: 'Semester 2',
    status: 'Mendatang'
  }
];

function parseDateParts(dateStr: string) {
  if (!dateStr) return { day: '•', month: 'AGENDA' };
  const trimmed = dateStr.trim();
  
  // Cross month range e.g. "30 Nov - 11 Des 2026" or "28 Des 2026 - 08 Jan 2027"
  const crossMonth = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+).+[-–]\s*(\d{1,2})\s+([A-Za-z]+)/i);
  if (crossMonth) {
    return {
      day: `${crossMonth[1]}-${crossMonth[3]}`,
      month: `${crossMonth[2].slice(0, 3)}/${crossMonth[4].slice(0, 3)}`.toUpperCase()
    };
  }

  // Multi range e.g. "15 - 17 & 20 - 21 Juli 2026"
  const multiRange = trimmed.match(/^(\d{1,2}).+[-–]\s*(\d{1,2})\s+([A-Za-z]+)/i);
  if (multiRange) {
    return {
      day: `${multiRange[1]}-${multiRange[2]}`,
      month: multiRange[3].slice(0, 3).toUpperCase()
    };
  }

  // Standard range e.g. "03 - 26 Agustus 2026"
  const stdRange = trimmed.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)/i);
  if (stdRange) {
    return {
      day: `${stdRange[1]}-${stdRange[2]}`,
      month: stdRange[3].slice(0, 3).toUpperCase()
    };
  }

  // Single date e.g. "13 Juli 2026"
  const singleDate = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)/i);
  if (singleDate) {
    return {
      day: singleDate[1],
      month: singleDate[2].slice(0, 3).toUpperCase()
    };
  }

  return { day: '🗓️', month: 'AGENDA' };
}

export default function Calendar() {
  const [events, setEvents] = useState<AgendaItem[]>(OFFICIAL_KALDIK_SMPN3);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalFilter, setModalFilter] = useState<string>('SEMUA');

  // Sync with Dashboard LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smpn3_agenda_data_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEvents(parsed.map((p) => ({
              id: p.id || Date.now(),
              name: p.name || p.title || 'Agenda Sekolah',
              date: p.date || 'Mendatang',
              category: p.category || p.type || 'Akademik',
              status: p.status || 'Mendatang',
              semester: p.semester || 'Semester 1'
            })));
          }
        }
      } catch {}
    }
  }, []);

  // Filter ONLY Upcoming / Active Events for the main landing page
  const upcomingEvents = events.filter((e) => (e.status || '').toLowerCase() !== 'selesai');
  const displayedLandingEvents = (upcomingEvents.length > 0 ? upcomingEvents : events.slice(-4)).slice(0, 4);

  // Filter for the complete modal
  const filteredModalEvents = events.filter((item) => {
    const cat = (item.category || item.type || 'Akademik').toLowerCase();
    const sem = (item.semester || '').toLowerCase();

    if (modalFilter === 'SEMUA') return true;
    if (modalFilter === 'SEM1') return sem.includes('1') || (!sem && item.id <= 16);
    if (modalFilter === 'SEM2') return sem.includes('2') || (!sem && item.id > 16);
    if (modalFilter === 'UJIAN') return cat.includes('cbt') || cat.includes('ujian') || cat.includes('sumatif');
    if (modalFilter === 'LIBUR') return cat.includes('libur');
    return true;
  });

  const getBadgeStyle = (cat?: string) => {
    const c = (cat || 'Akademik').toLowerCase();
    if (c.includes('cbt') || c.includes('ujian') || c.includes('sumatif')) return 'bg-sky-50 text-sky-700 border-sky-200/80';
    if (c.includes('kegiatan')) return 'bg-purple-50 text-purple-700 border-purple-200/80';
    if (c.includes('kreativitas')) return 'bg-pink-50 text-pink-700 border-pink-200/80';
    if (c.includes('libur')) return 'bg-rose-50 text-rose-700 border-rose-200/80';
    if (c.includes('kesiswaan')) return 'bg-amber-50 text-amber-800 border-amber-200/80';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || 'Mendatang').toLowerCase();
    if (s === 'berlangsung') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Berlangsung
        </span>
      );
    }
    if (s === 'selesai') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Selesai
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Mendatang
      </span>
    );
  };

  return (
    <section id="kalender" className="relative w-full py-20 sm:py-28 bg-[#f8fafc] text-slate-900 overflow-hidden select-none border-b border-indigo-100/70">
      {/* Ambient Lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[400px] bg-indigo-100/40 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[400px] bg-purple-100/30 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* Header & Sticky Description */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-indigo-50/80 border border-indigo-200/70 text-indigo-700 text-[11px] font-medium tracking-[0.15em] uppercase mb-4 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span>Agenda Terdekat Sekolah</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900 mb-5 leading-[1.12] tracking-tight">
              Jadwal & Agenda <br/> 
              <span className="font-semibold text-indigo-950">Mendatang</span>
            </h2>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 font-light max-w-md">
              Menampilkan kegiatan resmi terdekat di SMP Negeri 3 Cihampelas. Untuk melihat jadwal lengkap 1 tahun ajaran atau mengunduh surat ketetapan resmi, silakan buka rekap kalender.
            </p>

            {/* Official Signature Badge */}
            <div className="mb-6 p-4 rounded-2xl bg-white border border-indigo-100 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-lg shrink-0">
                🏛️
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900">Ditetapkan oleh Kepala Sekolah</p>
                <p className="text-slate-500 text-[11px]">H. Rustandi, M.Pd. · NIP. 197006081998021001</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
              {/* Primary: Open Complete 27-Event Modal */}
              <button 
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="group inline-flex items-center justify-center sm:justify-start gap-3 px-6 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition-all duration-300 shadow-md shadow-indigo-600/20 active:scale-98 cursor-pointer"
              >
                <span className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                  📋
                </span>
                <span>Buka Rekap Lengkap (27 Agenda)</span>
                <span className="text-indigo-200 group-hover:translate-x-1 transition-transform">➔</span>
              </button>

              {/* Secondary: Download Official Signed PDF */}
              <a 
                href="/kalender-akademik-smpn3.pdf" 
                target="_blank"
                rel="noopener noreferrer"
                download="Kalender-Akademik-SMPN3-Cihampelas-2026-2027.pdf"
                className="inline-flex items-center justify-center sm:justify-start gap-2.5 px-6 py-3 rounded-full bg-white hover:bg-indigo-50 border border-indigo-200 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-700 transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <span>📥</span>
                <span>Unduh Dokumen PDF Resmi</span>
              </a>
            </div>

            {/* Info Hint */}
            <div className="mt-8 pt-6 border-t border-slate-200/80 flex items-center gap-6 text-xs text-slate-500">
              <div>
                <span className="font-bold text-indigo-900 text-sm block">{displayedLandingEvents.length} Agenda</span>
                <span>Tampil di Beranda</span>
              </div>
              <div className="h-7 w-px bg-slate-200" />
              <div>
                <span className="font-bold text-slate-800 text-sm block">{events.length} Agenda</span>
                <span>Total 1 Tahun Ajaran</span>
              </div>
            </div>
          </div>

          {/* Right Side: ONLY 3-4 UPCOMING EVENTS */}
          <div className="lg:col-span-7">
            
            {/* Header Tag for List */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Agenda Mendatang Terdekat
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Periode Berjalan 2026/2027
              </span>
            </div>

            {/* Event Cards */}
            <div className="flex flex-col gap-3.5">
              {displayedLandingEvents.map((item) => {
                const dateParts = parseDateParts(item.date);
                const title = item.name || item.title || 'Agenda Sekolah';
                const category = item.category || item.type || 'Akademik';

                return (
                  <div 
                    key={item.id} 
                    className="group flex flex-col sm:flex-row items-start sm:items-center p-4 sm:p-5 rounded-2xl bg-white hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 transition-all duration-300 gap-4 sm:gap-5 shadow-xs hover:shadow-md"
                  >
                    
                    {/* Date Badge */}
                    <div className="shrink-0 flex sm:flex-col items-center justify-between sm:justify-center w-full sm:w-20 h-14 sm:h-20 px-3 sm:px-1 rounded-xl bg-slate-50 border border-slate-200 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-colors">
                      <span className="text-base sm:text-xl font-bold text-slate-900 group-hover:text-white transition-colors leading-none tracking-tight">
                        {dateParts.day}
                      </span>
                      <span className="text-[10px] font-bold tracking-wider text-indigo-700 sm:mt-1 group-hover:text-indigo-100 transition-colors">
                        {dateParts.month}
                      </span>
                    </div>

                    {/* Content Block */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getBadgeStyle(category)}`}>
                          {category}
                        </span>
                        {item.semester && (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.semester}
                          </span>
                        )}
                        {getStatusBadge(item.status)}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-900 transition-colors leading-snug mb-1">
                        {title}
                      </h3>

                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <span className="text-indigo-500">🗓️</span>
                        <span>{item.date}</span>
                      </p>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Bottom Invitation Banner (Zero Confusion) */}
            <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 border border-indigo-100/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold text-slate-900">
                  Butuh melihat seluruh 27 jadwal Semester 1 & 2?
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Termasuk kegiatan yang telah lalu, jadwal libur, dan asesmen akhir tahun.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-bold border border-indigo-200 hover:border-indigo-600 shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-98"
              >
                Lihat Rekap Lengkap ➔
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Official Calendar Modal (Printable & Clean) */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-300 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Controls */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Rekap Kalender Pendidikan Resmi SMPN 3 Cihampelas
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/kalender-akademik-smpn3.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  download="Kalender-Akademik-SMPN3-Cihampelas-2026-2027.pdf"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Unduh File PDF Asli"
                >
                  <span>📥 Unduh PDF Asli</span>
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
                  title="Cetak Tabel"
                >
                  <span>🖨️ Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                  title="Tutup (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-5">
              {/* Kop Surat Header */}
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                  Dinas Pendidikan Kabupaten Bandung Barat
                </p>
                <h3 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-tight">
                  SMP Negeri 3 Cihampelas
                </h3>
                <p className="text-xs text-slate-600">
                  Kalender Pendidikan Tahun Pelajaran 2026 / 2027 — Semester 1 & 2
                </p>
              </div>

              {/* Modal Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[
                  { key: 'SEMUA', label: `Semua (${events.length})` },
                  { key: 'SEM1', label: 'Semester 1' },
                  { key: 'SEM2', label: 'Semester 2' },
                  { key: 'UJIAN', label: 'Ujian / Asesmen' },
                  { key: 'LIBUR', label: 'Libur Resmi' }
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setModalFilter(f.key)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      modalFilter === f.key
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Table of Events */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Tanggal Pelaksanaan</th>
                      <th className="py-2.5 px-4">Nama Agenda / Kegiatan</th>
                      <th className="py-2.5 px-3">Semester</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredModalEvents.map((evt, idx) => (
                      <tr key={evt.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-indigo-900 whitespace-nowrap">{evt.date}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{evt.name || evt.title}</td>
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{evt.semester || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{evt.category || evt.type || 'Akademik'}</td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {getStatusBadge(evt.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signoff Block */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between pt-4 border-t border-slate-200 gap-4 text-xs">
                <div className="text-[11px] text-slate-500 space-y-0.5 max-w-sm">
                  <p className="font-bold text-slate-700">Catatan Resmi Sekolah:</p>
                  <p>• Jeda tengah semester diisi perlombaan antar kelas, pentas seni, pameran karya P5, dan studi wisata.</p>
                  <p>• Penetapan kelulusan kelas 9 mengikuti jadwal rapat penentuan kelulusan sekolah.</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Cihampelas, 13 Juli 2026</p>
                  <p className="font-bold text-slate-900">Kepala SMP Negeri 3 Cihampelas</p>
                  <div className="h-10" />
                  <p className="font-black text-slate-950 underline">H. Rustandi, M.Pd.</p>
                  <p className="text-[11px] text-slate-500 font-mono">NIP. 197006081998021001</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}
