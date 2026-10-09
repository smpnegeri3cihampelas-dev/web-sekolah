'use client';

import React from 'react';
import Image from 'next/image';
import { Leader, Teacher } from '@/lib/schoolData';
import { WartaItem } from '@/lib/wartaData';

interface TabOverviewProps {
  newsList: WartaItem[];
  leadersList: Leader[];
  teachersList: Teacher[];
  agendaList: Array<{ id: number; name: string; date: string; category: string; status: string }>;
  messagesList: Array<{ id: number; sender: string; contact: string; date: string; subject: string; message: string; read: boolean }>;
  onNavigateTab: (tab: 'overview' | 'warta' | 'siswa' | 'pimpinan' | 'agenda' | 'galeri' | 'pesan' | 'pengaturan') => void;
  onOpenAddNews: () => void;
  onOpenAddAgenda: () => void;
}

export function TabOverview({
  newsList,
  leadersList,
  teachersList,
  agendaList,
  messagesList,
  onNavigateTab,
  onOpenAddNews,
  onOpenAddAgenda
}: TabOverviewProps) {
  const unreadMessagesCount = messagesList.filter(m => !m.read).length;

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[
          {
            label: 'Warta Terbit',
            value: `${newsList.length}`,
            desc: '+2 minggu ini',
            icon: '📰',
            onClick: () => onNavigateTab('warta')
          },
          {
            label: 'Pimpinan & Guru',
            value: `${leadersList.length + teachersList.length}`,
            desc: `${leadersList.length} Pimpinan · ${teachersList.length} Guru Aktif`,
            icon: '👨‍🏫',
            onClick: () => onNavigateTab('pimpinan')
          },
          {
            label: 'Agenda Sekolah',
            value: `${agendaList.length}`,
            desc: '2 aktif bulan ini',
            icon: '📅',
            onClick: () => onNavigateTab('agenda')
          },
          {
            label: 'Pesan Masuk',
            value: `${messagesList.length}`,
            desc: `${unreadMessagesCount} belum dibaca`,
            icon: '💬',
            onClick: () => onNavigateTab('pesan')
          }
        ].map((stat, i) => (
          <div 
            key={i}
            onClick={stat.onClick}
            className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer"
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
            type="button"
            onClick={onOpenAddNews}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <span>+ Tulis Warta Baru</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('pimpinan')}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-900 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
          >
            <span>👨‍🏫 Kelola Pimpinan & Guru</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddAgenda}
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
              type="button"
              onClick={() => onNavigateTab('warta')}
              className="text-xs font-black text-indigo-700 hover:text-indigo-900 transition-colors cursor-pointer"
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
  );
}
