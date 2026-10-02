'use client';

import React from 'react';

export default function Calendar() {
  const events = [
    {
      id: 1,
      date: '15-20',
      month: 'Juli 2026',
      title: 'Masa Pengenalan Lingkungan Sekolah (MPLS)',
      type: 'Akademik',
      badgeClass: 'text-indigo-700 border-indigo-200/80 bg-indigo-50'
    },
    {
      id: 2,
      date: '17',
      month: 'Agustus 2026',
      title: 'Upacara Peringatan Hari Kemerdekaan RI Ke-81',
      type: 'Kegiatan',
      badgeClass: 'text-purple-700 border-purple-200/80 bg-purple-50'
    },
    {
      id: 3,
      date: '21-26',
      month: 'September 2026',
      title: 'Asesmen Tengah Semester (Sumatif) Ganjil',
      type: 'Ujian CBT',
      badgeClass: 'text-sky-700 border-sky-200/80 bg-sky-50'
    },
    {
      id: 4,
      date: '04-12',
      month: 'Desember 2026',
      title: 'Asesmen Akhir Semester (PAS) Berbasis Digital',
      type: 'Ujian CBT',
      badgeClass: 'text-emerald-700 border-emerald-200/80 bg-emerald-50'
    }
  ];

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

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-8 font-light max-w-md">
              Jadwal pelaksanaan kegiatan pembelajaran, evaluasi sumatif CBT, agenda ekstrakurikuler, dan kalender libur semester. Pastikan untuk selalu memantau pembaruan berkala.
            </p>

            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); alert('Kalender akademik versi PDF sedang disiapkan.'); }}
              className="group inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white hover:bg-indigo-50 border border-indigo-200/80 text-xs sm:text-sm font-medium text-slate-700 hover:text-indigo-700 transition-all duration-300 shadow-sm"
            >
              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                ↓
              </span>
              <span>Unduh Kalender Akademik (PDF)</span>
            </a>
          </div>

          {/* Timeline List */}
          <div className="lg:col-span-7">
            <div className="flex flex-col gap-4">
              {events.map((item) => (
                <div 
                  key={item.id} 
                  className="group flex flex-col sm:flex-row items-start sm:items-center p-5 sm:p-6 rounded-[2rem] bg-white hover:bg-indigo-50/40 border border-indigo-100 hover:border-indigo-300 transition-all duration-300 gap-5 sm:gap-6 shadow-sm hover:shadow-md hover:shadow-indigo-500/5"
                >
                  
                  {/* Date Block */}
                  <div className="shrink-0 flex flex-col items-center justify-center w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-indigo-50/80 border border-indigo-100 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all duration-300">
                    <span className="text-2xl sm:text-3xl font-light text-slate-900 leading-none mb-1 group-hover:text-white group-hover:scale-105 transition-all">
                      {item.date}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 group-hover:text-indigo-100 text-center px-1 transition-colors">
                      {item.month.split(' ')[0]}
                    </span>
                  </div>

                  {/* Info Block */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${item.badgeClass}`}>
                        {item.type}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {item.month}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-normal text-slate-900 group-hover:text-indigo-900 transition-colors leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="hidden sm:flex w-8 h-8 rounded-full border border-slate-200 items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all shrink-0">
                    →
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
