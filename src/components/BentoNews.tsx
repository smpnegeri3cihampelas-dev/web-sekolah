'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useWartaData, WartaItem } from '@/lib/wartaData';

export default function BentoNews() {
  const { wartaList } = useWartaData();
  const [selectedArticle, setSelectedArticle] = useState<WartaItem | null>(null);

  const publishedList = useMemo(() => {
    const list = wartaList.filter(item => item.status === 'Published');
    return list.length > 0 ? list : wartaList;
  }, [wartaList]);

  // Warta yang disorot di Bento Grid Informasi Terpadu
  const topWarta = publishedList[0] || null;
  const secondWarta = publishedList[1] || topWarta;
  const thirdWarta = publishedList[2] || topWarta;
  const fourthWarta = publishedList[3] || null;

  return (
    <section id="berita" className="relative w-full py-20 sm:py-28 bg-[#f8fafc] text-slate-900 overflow-hidden select-none border-b border-indigo-100/70">
      {/* Subtle Studio Backdrop Ambient Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-100/40 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[500px] bg-purple-100/30 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14 gap-4">
          <div>
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-indigo-50/80 border border-indigo-200/70 text-indigo-700 text-[11px] font-medium tracking-[0.15em] uppercase mb-3 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
              <span>Warta & Pengumuman Sekolah</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.12]">
              Informasi Terpadu <span className="font-semibold text-indigo-900">&amp; Prestasi Terkini</span>
            </h2>
          </div>
          
          {/* Tombol Lihat Semua Warta -> Menuju Halaman Kumpulan Berita Berhalaman (/warta) */}
          <Link
            href="/warta"
            className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white hover:bg-indigo-50 border border-indigo-200/80 text-xs sm:text-sm font-medium text-slate-700 hover:text-indigo-700 transition-all duration-300 shadow-sm self-start md:self-end cursor-pointer"
          >
            <span>Lihat Semua Warta ({publishedList.length})</span>
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs group-hover:translate-x-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              →
            </span>
          </Link>
        </div>

        {/* ============================================================== */}
        {/* BENTO GRID (1:1 Exact Mathematical Alignment & Asymmetry)     */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ============================================================== */}
          {/* LEFT COLUMN: 50% Width (Card 1: 260px + Gap 24px + Card 4: 520px = 804px) */}
          {/* ============================================================== */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* CARD 1: Top Left Brand Hero (Soft Lavender Card matching Marklab) */}
            <div className="rounded-[2.2rem] p-8 sm:p-10 flex flex-col items-center justify-center text-center h-[260px] bg-gradient-to-br from-[#e0e7ff] via-[#eef2ff] to-[#f5f3ff] text-[#0f172a] shadow-md shadow-indigo-950/5 border border-indigo-200/80 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/60 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center">
                <span className="inline-block px-3 py-1 rounded-full bg-white/80 border border-indigo-200/70 text-[10px] tracking-[0.2em] font-semibold text-indigo-700 uppercase mb-3 shadow-sm">
                  Official School Portal
                </span>
                <h3 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-[-0.04em] text-[#0f172a] leading-none mb-1 group-hover:scale-[1.02] transition-transform duration-300">
                  SMPN 3
                </h3>
                <span className="text-xs sm:text-sm font-medium tracking-[0.3em] uppercase text-indigo-600/80 mt-2">
                  Cihampelas · Rigas
                </span>
              </div>
            </div>

            {/* CARD 4: Bottom Left Editorial Feature Card (Warta Utama #1 dari Admin Dashboard) */}
            <div 
              onClick={() => topWarta && setSelectedArticle(topWarta)}
              className="rounded-[2.2rem] bg-white text-[#0f172a] shadow-xl shadow-black/25 border border-white/30 overflow-hidden flex flex-col justify-between h-auto lg:h-[520px] cursor-pointer group hover:border-indigo-300 transition-all duration-300"
            >
              {/* Top Editorial Info Area */}
              <div className="p-7 sm:p-8 flex flex-col justify-between flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <span className="text-sm font-semibold tracking-tight text-[#0f172a]">
                      Warta Utama SMPN 3
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    {topWarta ? topWarta.category : 'PRESTASI'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-auto">
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0f172a] leading-[1.15] max-w-sm group-hover:text-indigo-900 transition-colors">
                    {topWarta ? topWarta.title : 'SMPN 3 Cihampelas Menyongsong Era Pendidikan Digital Berkarakter'}
                  </h3>
                  <p className="text-xs text-stone-500 font-normal leading-relaxed max-w-[210px] sm:text-right line-clamp-3">
                    {topWarta ? (topWarta.excerpt || 'Klik untuk membaca selengkapnya warta sekolah ini.') : 'Ekosistem Belajar Digital, Karakter Unggul & Berwawasan Global.'}
                  </p>
                </div>
              </div>

              {/* Bottom Photo Area (Exact 260px on desktop) */}
              <div className="relative w-full h-[240px] lg:h-[260px] overflow-hidden rounded-b-[2.2rem] shrink-0 bg-slate-100">
                <img 
                  src={topWarta ? (topWarta.src || '/slide4.jpeg') : '/slide4.jpeg'} 
                  alt={topWarta ? topWarta.title : 'Warta Utama'}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/slide4.jpeg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                  {topWarta ? topWarta.date : 'Terbaru'}
                </div>
              </div>
            </div>

          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: 50% Width (Top Subgrid: 520px + Gap 24px + Card 7: 260px = 804px) */}
          {/* ============================================================== */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* Top Sub-Grid: 2 Columns with EXACT 520px total height */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
              
              {/* SUB-COLUMN 1: Card 2 (230px) + Gap (24px) + Card 5 (266px) = 520px */}
              <div className="flex flex-col gap-6">
                
                {/* CARD 2: Top Center (Warta #2 dari Admin Dashboard) */}
                <div 
                  onClick={() => secondWarta && setSelectedArticle(secondWarta)}
                  className="rounded-[2.2rem] h-[230px] relative overflow-hidden group shadow-xl shadow-black/30 border border-white/10 shrink-0 cursor-pointer"
                >
                  <img 
                    src={secondWarta ? (secondWarta.src || '/gallery_2.jpg') : '/gallery_2.jpg'} 
                    alt={secondWarta ? secondWarta.title : 'Warta Pilihan'} 
                    className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/gallery_2.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                  {/* Header Badge */}
                  <div className="absolute top-4 left-5 right-5 flex justify-between items-center z-10">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                      {secondWarta ? secondWarta.category : 'PENGUMUMAN'}
                    </span>
                    <span className="text-[10px] text-stone-300 font-mono">
                      {secondWarta ? secondWarta.date : 'Terkini'}
                    </span>
                  </div>

                  {/* Text Overlay */}
                  <div className="absolute bottom-5 left-5 right-5 z-10">
                    <span className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-md block line-clamp-2 leading-snug group-hover:text-indigo-200 transition-colors">
                      {secondWarta ? secondWarta.title : 'Warta Terkini Sekolah'}
                    </span>
                    <span className="text-[10px] text-stone-300/90 font-light tracking-wide block mt-1 line-clamp-1">
                      {secondWarta ? (secondWarta.excerpt || 'Klik untuk membaca warta selengkapnya →') : 'Klik untuk membaca warta selengkapnya →'}
                    </span>
                  </div>
                </div>

                {/* CARD 5: Center Middle (Smartphone Closeup Mockup - Warta #3 dari Admin Dashboard) */}
                <div 
                  onClick={() => thirdWarta && setSelectedArticle(thirdWarta)}
                  className="rounded-[2.2rem] h-[266px] p-2 bg-[#1b1b20] border-2 border-white/10 shadow-xl shadow-black/30 flex flex-col relative overflow-hidden group shrink-0 cursor-pointer"
                >
                  <div className="w-full h-full rounded-[1.7rem] bg-gradient-to-b from-[#f3e6e3] via-[#f7edf0] to-[#eaf2f8] p-4 flex flex-col justify-between relative overflow-hidden">
                    {/* Status bar */}
                    <div className="flex items-center justify-between text-[10px] text-stone-600 font-semibold px-1">
                      <span>09:41</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-700" />
                        <span className="text-[9px]">5G</span>
                      </div>
                    </div>

                    {/* Dynamic School Notification Pill */}
                    <div className="bg-white/90 backdrop-blur-md p-2.5 rounded-xl border border-white/70 shadow-sm flex items-center gap-2.5 group-hover:bg-white transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        ✦
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-slate-900 truncate">
                          {thirdWarta ? `${thirdWarta.category} · ${thirdWarta.title}` : 'Agenda Kegiatan Siswa'}
                        </span>
                        <span className="text-[9px] text-slate-600 truncate">
                          {thirdWarta ? (thirdWarta.excerpt || thirdWarta.date) : 'Informasi resmi SMPN 3 Cihampelas'}
                        </span>
                      </div>
                    </div>

                    {/* Phone App Dock */}
                    <div className="flex items-center justify-around p-2 rounded-2xl bg-white/50 backdrop-blur-lg border border-white/40 shadow-sm">
                      <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center text-xs font-bold shadow-md">
                        R3
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 text-white flex items-center justify-center text-sm shadow-md">
                        💬
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-sky-400 text-white flex items-center justify-center text-sm shadow-md">
                        🌐
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* SUB-COLUMN 2: Card 3 (166px) + Gap (24px) + Card 6 (330px) = 520px */}
              <div className="flex flex-col gap-6">
                
                {/* CARD 3: Top Right (Dark Obsidian Stat Card with Bar Chart) */}
                <div className="rounded-[2.2rem] h-[166px] bg-[#080b20] border border-indigo-500/20 text-white p-5 sm:p-6 shadow-xl shadow-indigo-950/30 flex flex-col justify-between group hover:border-indigo-400/40 transition-all shrink-0">
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-white tracking-tight">
                      Tingkat Kelulusan
                    </h4>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-white/[0.1] text-[9px] text-indigo-200 font-light mt-0.5">
                      5 Tahun Terakhir
                    </span>
                  </div>

                  <div className="flex items-end justify-between pt-1">
                    <div className="flex items-end gap-1.5 h-9">
                      <div className="w-1.5 h-4 rounded-full bg-indigo-900/60" />
                      <div className="w-1.5 h-5 rounded-full bg-indigo-800" />
                      <div className="w-1.5 h-6 rounded-full bg-indigo-600" />
                      <div className="w-1.5 h-8 rounded-full bg-indigo-400" />
                      <div className="w-1.5 h-9 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-none">100%</span>
                      <span className="text-[10px] text-indigo-300 font-medium mt-1">Lulus Paripurna</span>
                    </div>
                  </div>
                </div>

                {/* CARD 6: Far Right Middle (Warta #4 dari Admin Dashboard atau Budaya Sekolah) */}
                <div 
                  onClick={() => fourthWarta ? setSelectedArticle(fourthWarta) : null}
                  className="rounded-[2.2rem] h-[330px] relative overflow-hidden group shadow-xl shadow-black/30 border border-white/10 shrink-0 cursor-pointer"
                >
                  <img 
                    src={fourthWarta ? (fourthWarta.src || '/slide2.jpeg') : '/slide2.jpeg'} 
                    alt={fourthWarta ? fourthWarta.title : 'Kampus SMPN 3 Cihampelas'} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/slide2.jpeg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />

                  <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-10">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-stone-200 uppercase tracking-widest font-mono font-bold">
                      {fourthWarta ? fourthWarta.category : 'RIGAS · 2026'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8] animate-pulse" />
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 z-10">
                    <h5 className="text-base font-semibold text-white tracking-tight leading-snug line-clamp-2">
                      {fourthWarta ? fourthWarta.title : 'Budaya Disiplin & Prestasi'}
                    </h5>
                    <p className="text-[11px] text-stone-300 font-light mt-0.5 leading-relaxed line-clamp-2">
                      {fourthWarta ? (fourthWarta.excerpt || fourthWarta.date) : 'Membina generasi berakhlak mulia dan berdaya saing global.'}
                    </p>
                  </div>
                </div>

              </div>

            </div>

            {/* CARD 7: Bottom Right Wide Analytics Card */}
            <div className="rounded-[2.2rem] bg-white text-[#0f172a] shadow-xl shadow-black/25 border border-white/30 p-6 sm:p-7 flex flex-col justify-between h-[260px] relative overflow-hidden group shrink-0">
              
              <div className="flex items-center justify-between gap-4">
                
                <div className="w-1/2 flex items-center justify-center">
                  <img 
                    src="/smart_campus_device.jpg" 
                    alt="Smart Campus Robotics Explorer" 
                    className="h-24 sm:h-28 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="w-1/2 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0f172a] text-[10px] font-medium border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      1.200+ Siswa
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0f172a] text-[10px] font-medium border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      100% Lulus
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0f172a] text-[10px] font-medium border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                      Akreditasi B
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-0.5">
                    <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="14" 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="3" 
                          strokeDasharray="88" 
                          strokeDashoffset="22" 
                          strokeLinecap="round" 
                        />
                      </svg>
                      <span className="absolute text-[9px] font-bold text-slate-800">75%</span>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-[#18181b] border border-stone-700 flex items-center justify-center relative shadow-sm shrink-0">
                      <div className="absolute inset-1 rounded-full border border-stone-800" />
                      <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8] animate-ping" />
                      <div className="absolute w-1.5 h-1.5 rounded-full bg-white" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-slate-800 truncate">Smart Campus</span>
                      <span className="text-[10px] text-slate-500 truncate">Sistem Terintegrasi</span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 mt-1">
                <span className="text-xs font-semibold text-slate-700 min-w-[28px]">75%</span>
                <div className="flex-1 flex gap-1 sm:gap-1.5">
                  {[...Array(15)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-3.5 sm:h-4 flex-1 rounded-[3px] transition-all duration-300 ${
                        i < 11 ? 'bg-sky-200' : 'bg-slate-100'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap hidden sm:inline">
                  Semester Ganjil 2026/2027
                </span>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ============================================================== */}
      {/* MODAL PRATINJAU / DETAIL ARTIKEL WARTA                         */}
      {/* ============================================================== */}
      {selectedArticle && (
        <div 
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setSelectedArticle(null)}
        >
          <div 
            data-lenis-prevent="true"
            className="w-full max-w-2xl rounded-3xl bg-white border-2 border-slate-300 overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Cover */}
            <div className="relative w-full h-64 sm:h-80 bg-slate-100 shrink-0">
              <img 
                src={selectedArticle.src || '/slide4.jpeg'} 
                alt={selectedArticle.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/slide4.jpeg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white font-bold flex items-center justify-center cursor-pointer border border-white/20 transition-all z-20"
                title="Tutup"
              >
                ✕
              </button>

              <div className="absolute bottom-5 left-5 right-5 z-10 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-mono font-black uppercase tracking-wider">
                    {selectedArticle.category}
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    {selectedArticle.date}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-snug drop-shadow-md">
                  {selectedArticle.title}
                </h3>
              </div>
            </div>

            {/* Content Scroll Area */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 text-sm text-slate-800 leading-relaxed font-normal">
              <div className="p-4 rounded-2xl bg-indigo-50/70 border-2 border-indigo-100 text-indigo-950 font-bold text-sm">
                {selectedArticle.excerpt || selectedArticle.title}
              </div>

              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedArticle.content || (
                  <>
                    Warta ini diterbitkan secara resmi oleh Humas SMP Negeri 3 Cihampelas sebagai bagian dari keterbukaan informasi publik dan dokumentasi kegiatan pembelajaran, prestasi, serta program inovasi sekolah.
                  </>
                )}
              </p>

              <div className="pt-6 border-t-2 border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>Dipublikasikan oleh: <strong>Humas SMPN 3 Cihampelas</strong></span>
                <div className="flex items-center gap-2">
                  <Link
                    href="/warta"
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors"
                  >
                    Katalog Warta
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedArticle(null)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black cursor-pointer shadow-md transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
