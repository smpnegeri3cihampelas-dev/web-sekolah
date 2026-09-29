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
    <section id="kurikulum" className="relative w-full py-20 sm:py-28 px-4 sm:px-8 bg-black text-stone-100 border-b border-white/[0.06] overflow-hidden select-none">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-cyan-900/[0.06] blur-[160px] pointer-events-none -translate-x-1/4" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-purple-900/[0.06] blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div>
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-stone-300 text-[11px] font-normal tracking-[0.2em] uppercase mb-3 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              <span>Program Unggulan & Kurikulum</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-tight leading-[1.12]">
              Pembelajaran Modern <span className="font-normal text-stone-200">Kurikulum Merdeka</span>
            </h2>
          </div>
          <p className="text-stone-400 text-xs sm:text-sm font-light max-w-md leading-relaxed">
            Mempersiapkan generasi masa depan melalui pendekatan pembelajaran terdiferensiasi, kecerdasan digital, dan penanaman budi pekerti luhur.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 p-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          {programs.map((prog, idx) => (
            <button
              key={prog.id}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center justify-between p-4 rounded-xl text-left transition-all duration-300 cursor-pointer ${
                activeTab === idx
                  ? 'bg-white/[0.08] border border-white/15 shadow-lg'
                  : 'hover:bg-white/[0.03] border border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <div>
                <span className={`text-[10px] font-mono tracking-widest uppercase block mb-1 ${activeTab === idx ? 'text-cyan-400' : 'text-stone-400'}`}>
                  {prog.badge}
                </span>
                <span className={`text-sm sm:text-base font-normal block ${activeTab === idx ? 'text-white' : 'text-stone-300'}`}>
                  {prog.title}
                </span>
              </div>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-transform ${activeTab === idx ? 'bg-cyan-400 text-black rotate-45' : 'text-stone-500'}`}>
                ↗
              </span>
            </button>
          ))}
        </div>

        {/* Selected Program Showcase Card */}
        <div className="rounded-[2.2rem] bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl p-6 sm:p-10 shadow-2xl shadow-black/50 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Content Left */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-[10px] font-normal tracking-widest uppercase mb-4">
                <span>{programs[activeTab].badge}</span>
                <span>•</span>
                <span>Prioritas Akademik</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-normal text-white tracking-tight mb-3">
                {programs[activeTab].title}
              </h3>
              
              <p className="text-sm font-normal text-stone-200 mb-4 leading-relaxed">
                {programs[activeTab].tagline}
              </p>

              <p className="text-xs sm:text-sm text-stone-400 font-light leading-relaxed mb-8">
                {programs[activeTab].desc}
              </p>
            </div>

            {/* Metrics Chips */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/[0.08]">
              {programs[activeTab].metrics.map((m, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1">
                    {m.label}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-white block">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Image Right */}
          <div className="lg:col-span-6">
            <div className="relative w-full h-[280px] sm:h-[360px] rounded-[1.8rem] overflow-hidden border border-white/10 shadow-xl group">
              <Image
                src={programs[activeTab].image}
                alt={programs[activeTab].title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
