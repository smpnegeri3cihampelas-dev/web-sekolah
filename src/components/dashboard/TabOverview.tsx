'use client';

import React from 'react';
import { Leader, Teacher } from '@/lib/schoolData';
import { WartaItem } from '@/lib/wartaData';
import { Student } from '@/lib/elearningData';
import { GalleryItem } from '@/lib/galleryData';

interface TabOverviewProps {
  newsList: WartaItem[];
  leadersList: Leader[];
  teachersList: Teacher[];
  agendaList: Array<{ id: number; name: string; date: string; category: string; status: string }>;
  galleryList: GalleryItem[];
  studentsList: Student[];
  onNavigateTab: (tab: 'overview' | 'warta' | 'siswa' | 'pimpinan' | 'agenda' | 'galeri' | 'pengaturan') => void;
}

export function TabOverview({
  newsList,
  leadersList,
  teachersList,
  agendaList,
  galleryList,
  studentsList,
  onNavigateTab
}: TabOverviewProps) {
  const totalStudents = studentsList.length || 535;
  const activeCount = studentsList.filter(s => s.status !== 'Keluar').length;
  const keluarCount = studentsList.filter(s => s.status === 'Keluar').length;

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {[
          {
            label: 'Siswa Aktif',
            value: `${activeCount}`,
            desc: `${totalStudents} Total ${keluarCount > 0 ? `· ${keluarCount} Keluar` : '· 17 Rombel'}`,
            icon: '🎒',
            onClick: () => onNavigateTab('siswa')
          },
          {
            label: 'Pimpinan & Guru',
            value: `${leadersList.length + teachersList.length}`,
            desc: `${leadersList.length} Pimpinan · ${teachersList.length} Guru`,
            icon: '👨‍🏫',
            onClick: () => onNavigateTab('pimpinan')
          },
          {
            label: 'Warta Terbit',
            value: `${newsList.length}`,
            desc: 'Artikel Berita Aktif',
            icon: '📰',
            onClick: () => onNavigateTab('warta')
          },
          {
            label: 'Agenda Sekolah',
            value: `${agendaList.length}`,
            desc: 'Kegiatan Terjadwal',
            icon: '📅',
            onClick: () => onNavigateTab('agenda')
          },
          {
            label: 'Galeri Foto',
            value: `${galleryList.length}`,
            desc: 'Dokumentasi Sekolah',
            icon: '📸',
            onClick: () => onNavigateTab('galeri')
          }
        ].map((stat, i) => (
          <div 
            key={i}
            onClick={stat.onClick}
            className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-400 hover:-translate-y-0.5 transition-all cursor-pointer select-none group"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider truncate mr-1">
                {stat.label}
              </span>
              <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">
                {stat.icon}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mb-1">
              {stat.value}
            </div>
            <div className="text-[11px] font-semibold text-slate-700 truncate">
              {stat.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Data Pokok Sekolah & Agenda Terdekat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Data Pokok Singkat */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  🏫
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-950 tracking-tight">Status Operasional Sekolah</h3>
                  <p className="text-[11px] text-slate-600 font-bold">SMP Negeri 3 Cihampelas · Akreditasi B</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                ● Aktif & Berjalan
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block mb-0.5">NPSN</span>
                <span className="text-xs font-mono font-black text-slate-900">20279930</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block mb-0.5">Bentuk Pendidikan</span>
                <span className="text-xs font-black text-slate-900">SMP Negeri</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block mb-0.5">Status Sekolah</span>
                <span className="text-xs font-black text-emerald-700">Negeri</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block mb-0.5">Kurikulum</span>
                <span className="text-xs font-black text-slate-900">Kurikulum Merdeka</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block mb-0.5">Tahun Ajaran</span>
                <span className="text-xs font-mono font-black text-indigo-700">2026/2027</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block mb-0.5">Total Rombel</span>
                <span className="text-xs font-mono font-black text-slate-900">17 Rombel</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-600 font-semibold border-t border-slate-100">
              <span>Alamat: Kp. Sukawangi RT 02/09, Situwangi, Bandung Barat</span>
              <button
                type="button"
                onClick={() => onNavigateTab('pimpinan')}
                className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
              >
                Kelola Data Pokok →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Agenda Mendatang */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-base">📅</span>
                <h3 className="text-sm font-black text-slate-950 tracking-tight">Agenda Terdekat</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('agenda')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Lihat Semua ({agendaList.length}) →
              </button>
            </div>

            <div className="space-y-2.5">
              {agendaList.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{item.date}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 shrink-0">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
