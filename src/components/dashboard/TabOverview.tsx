'use client';

import React from 'react';
import Image from 'next/image';
import { Leader, Teacher } from '@/lib/schoolData';
import { WartaItem } from '@/lib/wartaData';
import { Student } from '@/lib/elearningData';

interface TabOverviewProps {
  newsList: WartaItem[];
  leadersList: Leader[];
  teachersList: Teacher[];
  agendaList: Array<{ id: number; name: string; date: string; category: string; status: string }>;
  messagesList: Array<{ id: number; sender: string; contact: string; date: string; subject: string; message: string; read: boolean }>;
  studentsList: Student[];
  onNavigateTab: (tab: 'overview' | 'warta' | 'siswa' | 'pimpinan' | 'agenda' | 'galeri' | 'pesan' | 'pengaturan') => void;
}

export function TabOverview({
  newsList,
  leadersList,
  teachersList,
  agendaList,
  messagesList,
  studentsList,
  onNavigateTab
}: TabOverviewProps) {
  const unreadMessagesCount = messagesList.filter(m => !m.read).length;
  const totalStudents = studentsList.length || 535;

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {[
          {
            label: 'Siswa Aktif',
            value: `${totalStudents}`,
            desc: '17 Rombel Terdaftar',
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
            label: 'Pesan Masuk',
            value: `${messagesList.length}`,
            desc: unreadMessagesCount > 0 ? `${unreadMessagesCount} belum dibaca` : 'Semua telah dibaca',
            icon: '💬',
            onClick: () => onNavigateTab('pesan')
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
            <div className="text-[11px] font-extrabold text-indigo-700 flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
              <span className="truncate">{stat.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Grid 2 Column: Warta Terbaru + Agenda Terdekat & Status Akademik */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recent News (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-white border-2 border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b-2 border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-950">Warta & Berita Tayang</h3>
              <p className="text-xs text-slate-600 font-semibold">Status artikel di halaman beranda & warta</p>
            </div>
            <button 
              type="button"
              onClick={() => onNavigateTab('warta')}
              className="text-xs font-black text-indigo-700 hover:text-indigo-900 transition-colors cursor-pointer"
            >
              Lihat Semua →
            </button>
          </div>

          <div className="space-y-3">
            {newsList.slice(0, 4).map((item) => (
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
                      <span className="text-xs text-slate-600 font-mono font-bold">{item.date}</span>
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

        {/* Right Column: Upcoming Agenda & Status Akademik (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Agenda Card */}
          <div className="rounded-2xl bg-white border-2 border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b-2 border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-950">Agenda Akademik</h3>
                <p className="text-xs text-slate-600 font-semibold">Jadwal kegiatan terdekat</p>
              </div>
              <button 
                type="button"
                onClick={() => onNavigateTab('agenda')}
                className="text-xs font-black text-indigo-700 hover:text-indigo-900 cursor-pointer"
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

          {/* Status Akademik */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border-2 border-indigo-100 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-md shadow-indigo-600/25 shrink-0">
                🏫
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">Tahun Ajaran 2026/2027</p>
                <p className="text-xs text-indigo-700 font-bold">Semester Genap · Kurikulum Merdeka</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 shrink-0">
              ● Aktif
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
