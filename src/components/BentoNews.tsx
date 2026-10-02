'use client';

import React from 'react';

export default function BentoNews() {
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
          <a
            href="#arsip-berita"
            className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white hover:bg-indigo-50 border border-indigo-200/80 text-xs sm:text-sm font-medium text-slate-700 hover:text-indigo-700 transition-all duration-300 shadow-sm self-start md:self-end"
          >
            <span>Lihat Selengkapnya</span>
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs group-hover:translate-x-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              →
            </span>
          </a>
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
              {/* Subtle light reflex */}
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

            {/* CARD 4: Bottom Left Editorial Feature Card (Exact 520px on desktop) */}
            <div className="rounded-[2.2rem] bg-white text-[#0f172a] shadow-xl shadow-black/25 border border-white/30 overflow-hidden flex flex-col justify-between h-auto lg:h-[520px]">
              
              {/* Top Editorial Info Area */}
              <div className="p-7 sm:p-8 flex flex-col justify-between flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <span className="text-sm font-semibold tracking-tight text-[#0f172a]">
                      SMPN 3 Cihampelas
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500 tracking-tight">
                    smpn3cihampelas.sch.id
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-auto">
                  <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#0f172a] leading-[1.08] max-w-xs">
                    Langkah Pasti <br />
                    Menuju Prestasi
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 font-normal leading-relaxed max-w-[210px] sm:text-right">
                    Ekosistem Belajar Digital, Karakter Unggul & Berwawasan Global.
                  </p>
                </div>
              </div>

              {/* Bottom Photo Area (Exact 260px on desktop) */}
              <div className="relative w-full h-[240px] lg:h-[260px] overflow-hidden rounded-b-[2.2rem] shrink-0">
                <img 
                  src="/gallery_1.jpg" 
                  alt="Kegiatan Belajar Siswa SMPN 3 Cihampelas di Laboratorium Sains" 
                  className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
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
                
                {/* CARD 2: Top Center (Action Photo with Bold Overlay Text) */}
                <div className="rounded-[2.2rem] h-[230px] relative overflow-hidden group shadow-xl shadow-black/30 border border-white/10 shrink-0">
                  <img 
                    src="/gallery_2.jpg" 
                    alt="Pertandingan Basket Siswa SMPN 3" 
                    className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Subtle dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

                  {/* Text Overlay (Replicating "Pedrix" on Cyclist photo) */}
                  <div className="absolute bottom-5 left-6 right-6 z-10">
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-md block">
                      JUARA
                    </span>
                    <span className="text-[11px] text-stone-200/90 font-light tracking-wide block mt-0.5">
                      Porseni Basket KBB 2026
                    </span>
                  </div>
                </div>

                {/* CARD 5: Center Middle (Smartphone Screen Closeup Mockup - Exact 266px) */}
                <div className="rounded-[2.2rem] h-[266px] p-2 bg-[#1b1b20] border-2 border-white/10 shadow-xl shadow-black/30 flex flex-col relative overflow-hidden group shrink-0">
                  <div className="w-full h-full rounded-[1.7rem] bg-gradient-to-b from-[#f3e6e3] via-[#f7edf0] to-[#eaf2f8] p-4 flex flex-col justify-between relative overflow-hidden">
                    {/* Status bar indication */}
                    <div className="flex items-center justify-between text-[10px] text-stone-600 font-semibold px-1">
                      <span>09:41</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-700" />
                        <span className="text-[9px]">5G</span>
                      </div>
                    </div>

                    {/* School Notification Pill */}
                    <div className="bg-white/80 backdrop-blur-md p-2 rounded-xl border border-white/70 shadow-sm flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center text-[10px] shrink-0">
                        ✦
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-semibold text-stone-800 truncate">Portal PPDB 2026</span>
                        <span className="text-[9px] text-stone-500 truncate">Pendaftaran jalur zonasi dibuka</span>
                      </div>
                    </div>

                    {/* Phone App Dock (iOS style dock replicating reference) */}
                    <div className="flex items-center justify-around p-2 rounded-2xl bg-white/50 backdrop-blur-lg border border-white/40 shadow-sm">
                      {/* App 1: RIGAS App */}
                      <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer hover:scale-105 transition-transform">
                        R3
                      </div>
                      {/* App 2: Green Messages */}
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 text-white flex items-center justify-center text-sm shadow-md cursor-pointer hover:scale-105 transition-transform">
                        💬
                      </div>
                      {/* App 3: Browser */}
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-sky-400 text-white flex items-center justify-center text-sm shadow-md cursor-pointer hover:scale-105 transition-transform">
                        🌐
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* SUB-COLUMN 2: Card 3 (166px) + Gap (24px) + Card 6 (330px) = 520px */}
              <div className="flex flex-col gap-6">
                
                {/* CARD 3: Top Right (Dark Obsidian Stat Card with Bar Chart - Exact 166px) */}
                <div className="rounded-[2.2rem] h-[166px] bg-[#080b20] border border-indigo-500/20 text-white p-5 sm:p-6 shadow-xl shadow-indigo-950/30 flex flex-col justify-between group hover:border-indigo-400/40 transition-all shrink-0">
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-white tracking-tight">
                      Tingkat Kelulusan
                    </h4>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-white/[0.1] text-[9px] text-indigo-200 font-light mt-0.5">
                      5 Tahun Terakhir
                    </span>
                  </div>

                  {/* Frequency Histogram Bars (matching reference graphic) */}
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

                {/* CARD 6: Far Right Middle (Vertical Product Detail Card - Exact 330px) */}
                <div className="rounded-[2.2rem] h-[330px] relative overflow-hidden group shadow-xl shadow-black/30 border border-white/10 shrink-0">
                  <img 
                    src="/stem_robotics_hardware.jpg" 
                    alt="Detail Hardware Robotika & Ekskul STEM" 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Subtle vignette gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />

                  {/* Header Badge */}
                  <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-10">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-stone-200 uppercase tracking-widest font-mono">
                      STEM · 4.0
                    </span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
                  </div>

                  {/* Bottom Description */}
                  <div className="absolute bottom-5 left-5 right-5 z-10">
                    <h5 className="text-base font-semibold text-white tracking-tight leading-snug">
                      Robotika & IoT
                    </h5>
                    <p className="text-[11px] text-stone-300 font-light mt-0.5 leading-relaxed">
                      Praktik rekayasa digital & kecerdasan buatan terapan.
                    </p>
                  </div>
                </div>

              </div>

            </div>

            {/* CARD 7: Bottom Right Wide Analytics Card (Exact 260px - Aligning with Card 4 bottom!) */}
            <div className="rounded-[2.2rem] bg-white text-[#0f172a] shadow-xl shadow-black/25 border border-white/30 p-6 sm:p-7 flex flex-col justify-between h-[260px] relative overflow-hidden group shrink-0">
              
              {/* Top Row: Device Illustration + Stat Pills + Dial/Radar */}
              <div className="flex items-center justify-between gap-4">
                
                {/* Left Device Shot (AURA-7 Explorer) */}
                <div className="w-1/2 flex items-center justify-center">
                  <img 
                    src="/smart_campus_device.jpg" 
                    alt="Smart Campus Robotics Explorer" 
                    className="h-24 sm:h-28 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Right Analytics: Pills & Circular Dial */}
                <div className="w-1/2 flex flex-col gap-3">
                  {/* 3 Metric Pills (matching 45km, 55min, 130w from reference) */}
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
                      Akreditasi A
                    </span>
                  </div>

                  {/* Circular Dial & Dark Radar Indicator */}
                  <div className="flex items-center gap-3 pt-0.5">
                    {/* Circular Dial Gauge */}
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

                    {/* Dark Radar Circle (matching circular radar map in reference) */}
                    <div className="w-10 h-10 rounded-full bg-[#18181b] border border-stone-700 flex items-center justify-center relative shadow-sm shrink-0">
                      <div className="absolute inset-1 rounded-full border border-stone-800" />
                      <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8] animate-ping" />
                      <div className="absolute w-1.5 h-1.5 rounded-full bg-white" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-slate-800 truncate">Smart Campus</span>
                      <span className="text-[10px] text-slate-500 truncate">Sensor IoT Aktif</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Segmented Progress Bar (reproducing reference bar exactly) */}
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
                  Semester Genap 2026
                </span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
