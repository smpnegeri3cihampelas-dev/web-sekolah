'use client';

import React, { useState, useEffect } from 'react';

interface AgendaItem {
  id: number;
  name?: string;
  title?: string;
  date: string;
  category?: string;
  type?: string;
  status?: string;
}

const DEFAULT_EVENTS: AgendaItem[] = [
  {
    id: 1,
    name: 'Masa Pengenalan Lingkungan Sekolah (MPLS)',
    date: '15 - 20 Juli 2026',
    category: 'Akademik',
    status: 'Selesai'
  },
  {
    id: 2,
    name: 'Upacara Peringatan Hari Kemerdekaan RI Ke-81',
    date: '17 Agustus 2026',
    category: 'Kegiatan',
    status: 'Selesai'
  },
  {
    id: 3,
    name: 'Asesmen Sumatif Tengah Semester (ASTS) Ganjil',
    date: '21 - 26 September 2026',
    category: 'Ujian CBT',
    status: 'Selesai'
  },
  {
    id: 4,
    name: 'Asesmen Sumatif Akhir Semester (ASAS) Ganjil',
    date: '01 - 08 Desember 2026',
    category: 'Ujian CBT',
    status: 'Berlangsung'
  },
  {
    id: 5,
    name: 'Gelar Karya P5 & Pentas Seni Budaya',
    date: '15 Desember 2026',
    category: 'Kreativitas',
    status: 'Mendatang'
  },
  {
    id: 6,
    name: 'Pembagian Buku Laporan Hasil Belajar (Rapor)',
    date: '19 Desember 2026',
    category: 'Akademik',
    status: 'Mendatang'
  },
  {
    id: 7,
    name: 'Libur Akhir Semester Ganjil',
    date: '21 Des 2026 - 03 Jan 2027',
    category: 'Libur Semester',
    status: 'Mendatang'
  },
  {
    id: 8,
    name: 'Awal Masuk Pembelajaran Semester Genap',
    date: '04 Januari 2027',
    category: 'Akademik',
    status: 'Mendatang'
  }
];

const INITIAL_LIMIT = 5;

// Helper to extract day range and month safely
function parseDateParts(dateStr: string) {
  if (!dateStr) return { day: '•', month: 'Agenda', full: 'Mendatang' };
  
  const trimmed = dateStr.trim();
  
  // Format range: "15 - 20 Juli 2026"
  const rangeMatch = trimmed.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)/i);
  if (rangeMatch) {
    return {
      day: `${rangeMatch[1]}-${rangeMatch[2]}`,
      month: rangeMatch[3].toUpperCase(),
      full: trimmed
    };
  }

  // Format single date: "17 Agustus 2026"
  const singleMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)/i);
  if (singleMatch) {
    return {
      day: singleMatch[1],
      month: singleMatch[2].toUpperCase(),
      full: trimmed
    };
  }

  // Cross month range: "21 Des 2026 - 03 Jan 2027"
  const crossMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+).+[-–]\s*(\d{1,2})\s+([A-Za-z]+)/i);
  if (crossMatch) {
    return {
      day: `${crossMatch[1]}-${crossMatch[3]}`,
      month: `${crossMatch[2].substring(0, 3)}/${crossMatch[4].substring(0, 3)}`.toUpperCase(),
      full: trimmed
    };
  }

  return { day: '🗓️', month: 'AGENDA', full: trimmed };
}

export default function Calendar() {
  const [events, setEvents] = useState<AgendaItem[]>(DEFAULT_EVENTS);
  const [filter, setFilter] = useState<string>('SEMUA');
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_LIMIT);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Sync with Dashboard LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smpn3_agenda_data_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEvents(parsed);
          }
        }
      } catch {}
    }
  }, []);

  // Filter categorization
  const filteredEvents = events.filter((item) => {
    const cat = item.category || item.type || 'Akademik';
    if (filter === 'SEMUA') return true;
    if (filter === 'UJIAN') return cat === 'Ujian CBT' || cat.toLowerCase().includes('ujian') || cat.toLowerCase().includes('asesmen');
    if (filter === 'KEGIATAN') return cat === 'Kegiatan' || cat === 'Kreativitas';
    if (filter === 'LIBUR') return cat === 'Libur Semester' || cat.toLowerCase().includes('libur');
    if (filter === 'AKADEMIK') return cat === 'Akademik';
    return true;
  });

  const displayedEvents = filteredEvents.slice(0, visibleCount);
  const remainingCount = filteredEvents.length - visibleCount;
  const hasMore = remainingCount > 0;

  const getBadgeStyle = (cat?: string) => {
    const c = (cat || 'Akademik').toLowerCase();
    if (c.includes('cbt') || c.includes('ujian')) return 'bg-sky-50 text-sky-700 border-sky-200/80';
    if (c.includes('kegiatan')) return 'bg-purple-50 text-purple-700 border-purple-200/80';
    if (c.includes('kreativitas')) return 'bg-pink-50 text-pink-700 border-pink-200/80';
    if (c.includes('libur')) return 'bg-rose-50 text-rose-700 border-rose-200/80';
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
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Header & Sticky Description */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-indigo-50/80 border border-indigo-200/70 text-indigo-700 text-[11px] font-medium tracking-[0.15em] uppercase mb-4 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
              <span>Agenda & Kegiatan Resmi</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900 mb-5 leading-[1.12] tracking-tight">
              Kalender Akademik <br/> 
              <span className="font-semibold text-indigo-950">Tahun Ajaran 2026/2027</span>
            </h2>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 font-light max-w-md">
              Panduan resmi jadwal pembelajaran, evaluasi sumatif ASTS & ASAS, kegiatan kesiswaan, dan libur semester di lingkungan SMP Negeri 3 Cihampelas.
            </p>

            {/* Quick Action Button - Opens Print / Summary Modal */}
            <button 
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="group inline-flex items-center gap-3 px-5 py-3 rounded-full bg-white hover:bg-indigo-50 border border-indigo-200/90 text-xs sm:text-sm font-semibold text-slate-800 hover:text-indigo-700 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                📄
              </span>
              <span>Lihat & Cetak Kalender Lengkap</span>
              <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform">↗</span>
            </button>

            {/* Summary Tag */}
            <div className="mt-8 pt-6 border-t border-slate-200/80 flex items-center gap-6 text-xs text-slate-500">
              <div>
                <span className="font-bold text-slate-800 text-sm block">{events.length}</span>
                <span>Total Agenda</span>
              </div>
              <div className="h-7 w-px bg-slate-200" />
              <div>
                <span className="font-bold text-amber-700 text-sm block">
                  {events.filter(e => (e.status || '').toLowerCase() === 'berlangsung').length}
                </span>
                <span>Sedang Berlangsung</span>
              </div>
              <div className="h-7 w-px bg-slate-200" />
              <div>
                <span className="font-bold text-emerald-700 text-sm block">
                  {events.filter(e => (e.status || 'mendatang').toLowerCase() === 'mendatang').length}
                </span>
                <span>Mendatang</span>
              </div>
            </div>
          </div>

          {/* Timeline & Filter List */}
          <div className="lg:col-span-7">
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {[
                { key: 'SEMUA', label: 'Semua' },
                { key: 'AKADEMIK', label: 'Akademik' },
                { key: 'UJIAN', label: 'Asesmen & CBT' },
                { key: 'KEGIATAN', label: 'Kegiatan Siswa' },
                { key: 'LIBUR', label: 'Libur Semester' }
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    setFilter(f.key);
                    setVisibleCount(INITIAL_LIMIT);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                    filter === f.key
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                      : 'bg-white text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Timeline Cards */}
            <div className="flex flex-col gap-3.5">
              {displayedEvents.map((item) => {
                const dateParts = parseDateParts(item.date);
                const title = item.name || item.title || 'Agenda Sekolah';
                const category = item.category || item.type || 'Akademik';

                return (
                  <div 
                    key={item.id} 
                    className="group flex flex-col sm:flex-row items-start sm:items-center p-4 sm:p-5 rounded-2xl bg-white hover:bg-indigo-50/30 border border-slate-200/90 hover:border-indigo-300 transition-all duration-300 gap-4 sm:gap-5 shadow-xs hover:shadow-md"
                  >
                    
                    {/* Date Badge */}
                    <div className="shrink-0 flex sm:flex-col items-center justify-between sm:justify-center w-full sm:w-20 h-14 sm:h-20 px-3 sm:px-1 rounded-xl bg-slate-50 border border-slate-200/90 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-colors">
                      <span className="text-lg sm:text-2xl font-bold text-slate-900 group-hover:text-white transition-colors leading-none tracking-tight">
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

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 5)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 text-xs font-bold border border-indigo-200 shadow-xs hover:shadow-sm transition-all cursor-pointer"
                >
                  <span>+ Tampilkan Lebih Banyak Agenda</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono text-[10px]">
                    {remainingCount} lagi
                  </span>
                </button>
              </div>
            )}

            {/* Show Less Option */}
            {!hasMore && filteredEvents.length > INITIAL_LIMIT && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setVisibleCount(INITIAL_LIMIT);
                    const el = document.getElementById('kalender');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline underline-offset-4 cursor-pointer"
                >
                  Tampilkan Lebih Sedikit ↑
                </button>
              </div>
            )}

            {filteredEvents.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 text-xs font-semibold">
                  Belum ada agenda pada kategori ini.
                </p>
              </div>
            )}

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
            className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-300 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Controls */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Kalender Pendidikan Resmi
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Cetak atau Simpan PDF"
                >
                  <span>🖨️ Cetak / PDF</span>
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

            {/* Document Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {/* Kop Surat Header */}
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                  Dinas Pendidikan Kabupaten Bandung Barat
                </p>
                <h3 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-tight">
                  SMP Negeri 3 Cihampelas
                </h3>
                <p className="text-xs text-slate-600">
                  Kalender Akademik & Jadwal Kegiatan Siswa — Tahun Ajaran 2026/2027
                </p>
              </div>

              {/* Table of Events */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">No</th>
                      <th className="py-3 px-4">Tanggal Pelaksanaan</th>
                      <th className="py-3 px-4">Nama Agenda / Kegiatan</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {events.map((evt, idx) => (
                      <tr key={evt.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-slate-900">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-indigo-900 whitespace-nowrap">{evt.date}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{evt.name || evt.title}</td>
                        <td className="py-3 px-4 text-slate-600">{evt.category || evt.type || 'Akademik'}</td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {getStatusBadge(evt.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Note */}
              <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-700 mb-1">Catatan Penting:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Jadwal sewaktu-waktu dapat disesuaikan mengikuti edaran resmi Dinas Pendidikan KBB.</li>
                  <li>Pelaksanaan asesmen sumatif CBT membutuhkan kelengkapan akun peserta didik.</li>
                  <li>Untuk informasi lebih lanjut, silakan hubungi bagian Tata Usaha atau Kurikulum sekolah.</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}
