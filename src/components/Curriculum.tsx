'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Curriculum() {
  const [activeTab, setActiveTab] = useState<number>(0);

  const programs = [
    {
      id: 'ai-steam',
      title: 'Digital & AI Literacy',
      badge: 'Fokus 01',
      tagline: 'Membekali pemikiran komputasional dan adopsi AI sejak dini.',
      desc: 'Siswa diajarkan dasar-dasar logika algoritma, pemanfaatan teknologi kecerdasan buatan secara produktif dan etis, serta penguasaan perangkat digital untuk menyongsong era revolusi industri 4.0.',
      metrics: [
        { label: 'Kurikulum', value: '12 Modul' },
        { label: 'Fasilitas', value: 'Smart Lab' },
        { label: 'Hasil Karya', value: 'Portofolio' },
      ],
      image: '/slide6.jpeg',
    },
    {
      id: 'steam-lab',
      title: 'STEAM & Creative Robotics',
      badge: 'Fokus 02',
      tagline: 'Eksperimen langsung dengan rekayasa teknologi dan sains terapan.',
      desc: 'Menggabungkan sains, teknologi, rekayasa, seni, dan matematika dalam proyek kolaboratif terintegrasi yang dirancang untuk memecahkan persoalan dunia nyata dan inovasi hijau.',
      metrics: [
        { label: 'Laboratorium', value: 'Sains Modern' },
        { label: 'Teknologi', value: 'IoT & Robotika' },
        { label: 'Kompetisi', value: 'Olimpiade' },
      ],
      image: '/slide7.jpeg',
    },
    {
      id: 'karakter',
      title: 'Character & Leadership',
      badge: 'Fokus 03',
      tagline: 'Intelektual unggul dengan akhlak mulia dan kepedulian sosial.',
      desc: 'Pendidikan holistik yang menanamkan keimanan, kemandirian, dan kepedulian lingkungan sebagai fondasi pembentukan profil pelajar Pancasila yang tangguh dan berwawasan global.',
      metrics: [
        { label: 'Pembiasaan', value: 'Harian' },
        { label: 'Kepemimpinan', value: 'OSIS & Pramuka' },
        { label: 'Bimbingan', value: 'Konseling 1-on-1' },
      ],
      image: '/slide1.jpeg',
    },
  ];

  return (
    <section id="kurikulum" className="relative w-full py-20 sm:py-28 px-4 sm:px-8 bg-white text-slate-900 border-b border-indigo-100/70 overflow-hidden select-none">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-indigo-100/35 blur-[160px] pointer-events-none -translate-x-1/4" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-purple-100/30 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div>
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-indigo-50/80 border border-indigo-200/70 text-indigo-700 text-[11px] font-medium tracking-[0.15em] uppercase mb-3 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
              <span>Program Unggulan & Kurikulum</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.12]">
              Pembelajaran Modern <span className="font-semibold text-indigo-950">Kurikulum Merdeka</span>
            </h2>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm font-light max-w-md leading-relaxed">
            Mempersiapkan generasi masa depan melalui pendekatan pembelajaran terdiferensiasi, kecerdasan digital, dan penanaman budi pekerti luhur.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/80">
          {programs.map((prog, idx) => (
            <button
              key={prog.id}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center justify-between p-4 rounded-xl text-left transition-all duration-300 cursor-pointer ${
                activeTab === idx
                  ? 'bg-white border border-indigo-200/80 shadow-md shadow-indigo-900/5'
                  : 'hover:bg-white/60 border border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <div>
                <span className={`text-[10px] font-mono tracking-widest uppercase block mb-1 ${activeTab === idx ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                  {prog.badge}
                </span>
                <span className={`text-sm sm:text-base font-normal block ${activeTab === idx ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                  {prog.title}
                </span>
              </div>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-transform ${activeTab === idx ? 'bg-indigo-600 text-white rotate-45' : 'text-slate-400'}`}>
                ↗
              </span>
            </button>
          ))}
        </div>

        {/* Selected Program Showcase Card */}
        <div className="rounded-[2.2rem] bg-gradient-to-br from-[#e0e7ff]/60 via-[#eef2ff]/70 to-[#f5f3ff]/60 border border-indigo-200/70 p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden">
          {/* Subtle light reflex */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/60 rounded-full blur-3xl pointer-events-none" />
          
          {/* Content Left */}
          <div className="lg:col-span-6 flex flex-col justify-between relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-indigo-200/80 text-indigo-700 text-[10px] font-semibold tracking-widest uppercase mb-4 shadow-sm">
                <span>{programs[activeTab].badge}</span>
                <span>•</span>
                <span>Prioritas Akademik</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mb-3">
                {programs[activeTab].title}
              </h3>
              
              <p className="text-sm font-medium text-indigo-900 mb-4 leading-relaxed">
                {programs[activeTab].tagline}
              </p>

              <p className="text-xs sm:text-sm text-slate-600 font-light leading-relaxed mb-8">
                {programs[activeTab].desc}
              </p>
            </div>

            {/* Metrics Chips */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-indigo-200/60">
              {programs[activeTab].metrics.map((m, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/80 border border-indigo-100 shadow-sm">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">
                    {m.label}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 block">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Image Right */}
          <div className="lg:col-span-6 relative z-10">
            <div className="relative w-full h-[280px] sm:h-[360px] rounded-[1.8rem] overflow-hidden border border-indigo-100 shadow-lg group">
              <Image
                src={programs[activeTab].image}
                alt={programs[activeTab].title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
