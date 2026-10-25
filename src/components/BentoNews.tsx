'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useWartaData, WartaItem, DEFAULT_WARTA } from '@/lib/wartaData';

export default function BentoNews() {
  const { wartaList } = useWartaData();
  const [selectedArticle, setSelectedArticle] = useState<WartaItem | null>(null);

  const publishedList = useMemo(() => {
    const list = wartaList.filter(item => item.status === 'Published');
    return list.length > 0 ? list : wartaList;
  }, [wartaList]);

  // Mengambil artikel untuk ke-7 slot kartu Bento Grid
  // Jika artikel di dashboard kurang dari 7, gunakan fallback dari DEFAULT_WARTA
  const getArticle = (index: number): WartaItem => {
    if (publishedList && publishedList[index]) return publishedList[index];
    if (DEFAULT_WARTA && DEFAULT_WARTA[index]) return DEFAULT_WARTA[index];
    return publishedList[index % Math.max(1, publishedList.length)] || DEFAULT_WARTA[0];
  };

  // 7 Kartu Warta
  const articleSlot2 = getArticle(0); // Warta Utama #1 (Kiri Bawah - 520px)
  const articleSlot1 = getArticle(1); // Warta #2 (Kiri Atas - 260px - Pengganti Official School Portal)
  const articleSlot3 = getArticle(2); // Warta #3 (Tengah Atas - 230px)
  const articleSlot4 = getArticle(3); // Warta #4 (Tengah Bawah - 266px - Pengganti Layar HP)
  const articleSlot5 = getArticle(4); // Warta #5 (Kanan Atas - 166px - Pengganti Tingkat Kelulusan)
  const articleSlot6 = getArticle(5); // Warta #6 (Kanan Tengah - 330px)
  const articleSlot7 = getArticle(6); // Warta #7 (Kanan Bawah - 260px - Pengganti Gambar Motor/Smart Campus)

  return (
    <section id="berita" className="relative w-full py-20 sm:py-28 bg-[#f8fafc] text-slate-900 overflow-hidden select-none border-b border-indigo-100/70">
      {/* Ambient Backdrop Studio Light */}
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
          
          {/* Tombol Lihat Semua Warta (1 Tombol Saja) */}
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
        {/* BENTO GRID (SELURUH 7 KARTU DIISI WARTA SEKOLAH LENGKAP)      */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ============================================================== */}
          {/* LEFT COLUMN: 50% Width (Card 1: 260px + Gap 24px + Card 2: 520px = 804px) */}
          {/* ============================================================== */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* CARD 1: Top Left Warta Card (Pengganti Official School Portal) */}
            <div 
              onClick={() => setSelectedArticle(articleSlot1)}
              className="rounded-[2.2rem] h-[260px] bg-white border border-indigo-100 shadow-xl shadow-indigo-950/5 overflow-hidden flex flex-col sm:flex-row group hover:border-indigo-300 transition-all duration-300 cursor-pointer shrink-0"
            >
              {/* Foto Kiri */}
              <div className="w-full sm:w-5/12 h-28 sm:h-full relative overflow-hidden bg-slate-100 shrink-0">
                <img 
                  src={articleSlot1.src || '/gallery_2.jpg'} 
                  alt={articleSlot1.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/gallery_2.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent sm:hidden" />
                <div className="absolute top-3.5 left-3.5 px-2.5 py-0.5 rounded-full bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm">
                  {articleSlot1.category}
                </div>
              </div>

              {/* Konten Kanan */}
              <div className="w-full sm:w-7/12 p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="hidden sm:flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2">
                    <span className="text-indigo-600 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      {articleSlot1.category}
                    </span>
                    <span>{articleSlot1.date}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-900 transition-colors line-clamp-2 leading-snug">
                    {articleSlot1.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-normal line-clamp-2 mt-1.5 leading-relaxed">
                    {articleSlot1.excerpt || 'Klik untuk membaca laporan warta sekolah selengkapnya.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                  <span>Baca Warta</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>

            {/* CARD 2: Bottom Left Editorial Feature Card (Warta Utama #1) */}
            <div 
              onClick={() => setSelectedArticle(articleSlot2)}
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
                    {articleSlot2.category}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-auto">
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0f172a] leading-[1.15] max-w-sm group-hover:text-indigo-900 transition-colors">
                    {articleSlot2.title}
                  </h3>
                  <p className="text-xs text-stone-500 font-normal leading-relaxed max-w-[210px] sm:text-right line-clamp-3">
                    {articleSlot2.excerpt || 'Klik untuk membaca selengkapnya warta sekolah ini.'}
                  </p>
                </div>
              </div>

              {/* Bottom Photo Area (Exact 260px on desktop) */}
              <div className="relative w-full h-[240px] lg:h-[260px] overflow-hidden rounded-b-[2.2rem] shrink-0 bg-slate-100">
                <img 
                  src={articleSlot2.src || '/slide4.jpeg'} 
                  alt={articleSlot2.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/slide4.jpeg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                  {articleSlot2.date}
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
              
              {/* SUB-COLUMN 1: Card 3 (230px) + Gap (24px) + Card 4 (266px) = 520px */}
              <div className="flex flex-col gap-6">
                
                {/* CARD 3: Top Center Warta Card */}
                <div 
                  onClick={() => setSelectedArticle(articleSlot3)}
                  className="rounded-[2.2rem] h-[230px] relative overflow-hidden group shadow-xl shadow-black/30 border border-white/10 shrink-0 cursor-pointer"
                >
                  <img 
                    src={articleSlot3.src || '/gallery_2.jpg'} 
                    alt={articleSlot3.title} 
                    className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/gallery_2.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                  {/* Header Badge */}
                  <div className="absolute top-4 left-5 right-5 flex justify-between items-center z-10">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                      {articleSlot3.category}
                    </span>
                    <span className="text-[10px] text-stone-300 font-mono">
                      {articleSlot3.date}
                    </span>
                  </div>

                  {/* Text Overlay */}
                  <div className="absolute bottom-5 left-5 right-5 z-10">
                    <span className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-md block line-clamp-2 leading-snug group-hover:text-indigo-200 transition-colors">
                      {articleSlot3.title}
                    </span>
                    <span className="text-[10px] text-stone-300/90 font-light tracking-wide block mt-1 line-clamp-1">
                      {articleSlot3.excerpt || 'Klik untuk membaca warta selengkapnya →'}
                    </span>
                  </div>
                </div>

                {/* CARD 4: Middle Center Warta Card (Pengganti Layar HP) */}
                <div 
                  onClick={() => setSelectedArticle(articleSlot4)}
                  className="rounded-[2.2rem] h-[266px] bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col justify-between group hover:border-indigo-300 transition-all duration-300 cursor-pointer shrink-0"
                >
                  {/* Foto Atas */}
                  <div className="relative w-full h-[125px] overflow-hidden bg-slate-100 shrink-0">
                    <img 
                      src={articleSlot4.src || '/slide1.jpeg'} 
                      alt={articleSlot4.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/slide1.jpeg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                      {articleSlot4.category}
                    </div>
                    <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[9px] font-mono">
                      {articleSlot4.date}
                    </div>
                  </div>

                  {/* Info Bawah */}
                  <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                        {articleSlot4.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-normal line-clamp-2 mt-1 leading-relaxed">
                        {articleSlot4.excerpt || 'Informasi agenda dan kegiatan resmi siswa SMP Negeri 3 Cihampelas.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-indigo-600 group-hover:text-indigo-700">
                      <span>Baca Warta</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* SUB-COLUMN 2: Card 5 (166px) + Gap (24px) + Card 6 (330px) = 520px */}
              <div className="flex flex-col gap-6">
                
                {/* CARD 5: Top Right Warta Card (Foto Background) */}
                <div 
                  onClick={() => setSelectedArticle(articleSlot5)}
                  className="rounded-[2.2rem] h-[166px] relative overflow-hidden group shadow-xl shadow-indigo-950/30 border border-white/10 shrink-0 cursor-pointer"
                >
                  <img 
                    src={articleSlot5.src || '/gallery_1.jpg'} 
                    alt={articleSlot5.title} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/gallery_1.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />

                  <div className="relative z-10 p-5 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/90 backdrop-blur-md text-[10px] font-mono font-bold text-white uppercase tracking-wider shadow-sm">
                        {articleSlot5.category}
                      </span>
                      <span className="text-[10px] text-stone-300 font-mono">
                        {articleSlot5.date}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight line-clamp-2 leading-snug group-hover:text-indigo-200 transition-colors drop-shadow-sm">
                        {articleSlot5.title}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-indigo-300 font-semibold pt-1.5 mt-1 border-t border-white/10">
                        <span>Warta Terkini</span>
                        <span className="group-hover:translate-x-0.5 transition-transform">Baca →</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 6: Middle Right Warta Card */}
                <div 
                  onClick={() => setSelectedArticle(articleSlot6)}
                  className="rounded-[2.2rem] h-[330px] relative overflow-hidden group shadow-xl shadow-black/30 border border-white/10 shrink-0 cursor-pointer"
                >
                  <img 
                    src={articleSlot6.src || '/slide4.jpeg'} 
                    alt={articleSlot6.title} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/slide4.jpeg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-10">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-stone-200 uppercase tracking-widest font-mono font-bold">
                      {articleSlot6.category}
                    </span>
                    <span className="text-[10px] text-stone-300 font-mono">
                      {articleSlot6.date}
                    </span>
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 z-10">
                    <h5 className="text-base font-semibold text-white tracking-tight leading-snug line-clamp-2 group-hover:text-indigo-200 transition-colors">
                      {articleSlot6.title}
                    </h5>
                    <p className="text-[11px] text-stone-300 font-light mt-1 leading-relaxed line-clamp-2">
                      {articleSlot6.excerpt || 'Klik untuk membaca dokumentasi kegiatan sekolah selengkapnya.'}
                    </p>
                  </div>
                </div>

              </div>

            </div>

            {/* CARD 7: Bottom Right Wide Warta Card (Pengganti Gambar Motor/Smart Campus Device) */}
            <div 
              onClick={() => setSelectedArticle(articleSlot7)}
              className="rounded-[2.2rem] bg-white text-[#0f172a] shadow-xl shadow-black/25 border border-white/30 overflow-hidden flex flex-col sm:flex-row h-[260px] relative group hover:border-indigo-300 transition-all duration-300 cursor-pointer shrink-0"
            >
              {/* Foto Kiri */}
              <div className="w-full sm:w-5/12 h-28 sm:h-full relative overflow-hidden bg-slate-100 shrink-0">
                <img 
                  src={articleSlot7.src || '/slide6.jpeg'} 
                  alt={articleSlot7.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/slide6.jpeg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent sm:hidden" />
                <div className="absolute top-3.5 left-3.5 px-2.5 py-0.5 rounded-full bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm">
                  {articleSlot7.category}
                </div>
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[9px] font-mono hidden sm:block">
                  👁️ {articleSlot7.views || '1.2k'}
                </div>
              </div>

              {/* Konten Kanan */}
              <div className="w-full sm:w-7/12 p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2">
                    <span className="text-indigo-600 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 hidden sm:inline-block">
                      {articleSlot7.category}
                    </span>
                    <span>📅 {articleSlot7.date}</span>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-900 transition-colors line-clamp-2 leading-snug">
                    {articleSlot7.title}
                  </h4>

                  <p className="text-xs text-slate-600 font-normal line-clamp-2 mt-1.5 leading-relaxed">
                    {articleSlot7.excerpt || 'Klik untuk membaca laporan warta inovasi dan program sekolah.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                  <span>Baca Selengkapnya</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
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
