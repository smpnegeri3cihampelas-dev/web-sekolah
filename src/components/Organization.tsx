'use client';

import React from 'react';
import { useSchoolData } from '@/lib/schoolData';

export default function Organization() {
  const { leaders } = useSchoolData();

  return (
    <section id="organisasi" className="relative w-full py-20 sm:py-28 bg-black text-stone-100 border-b border-white/[0.06] overflow-hidden select-none">
      
      {/* Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-cyan-900/[0.06] blur-[160px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-900/[0.06] blur-[160px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-14 sm:mb-18 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-stone-300 text-[11px] font-normal tracking-[0.2em] uppercase mb-3 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
            <span>Manajemen & Pimpinan Sekolah</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-tight leading-[1.12] mb-4">
            Pimpinan Berdedikasi <span className="font-normal text-stone-200">& Berintegritas</span>
          </h2>
          <p className="text-stone-400 text-xs sm:text-sm font-light leading-relaxed max-w-xl mx-auto">
            Jajaran kepemimpinan SMP Negeri 3 Cihampelas yang berkolaborasi mewujudkan standar mutu pendidikan unggul dan pembentukan karakter peserta didik.
          </p>
        </div>

        {/* Leaders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 justify-center">
          {leaders.map((leader, index) => (
            <div 
              key={leader.id} 
              className={`rounded-[2.2rem] bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.08] hover:border-cyan-400/30 backdrop-blur-xl p-8 transition-all duration-300 text-center flex flex-col items-center group shadow-xl shadow-black/30 ${
                index === 0 ? 'sm:col-span-2 lg:col-span-3 max-w-md mx-auto border-white/15' : ''
              }`}
            >
              {/* Avatar Icon */}
              <div className="w-20 h-20 rounded-2xl bg-white/[0.03] mb-5 border border-white/10 shadow-lg flex items-center justify-center relative overflow-hidden group-hover:scale-105 group-hover:border-cyan-400/40 transition-all duration-300">
                <img 
                  src={leader.photo || '/teachers/default_avatar.svg'} 
                  alt={leader.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <span className={`inline-block px-3 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full border mb-3 ${leader.badgeColor || 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10'}`}>
                {leader.badge || leader.role}
              </span>

              <h3 className="text-lg sm:text-xl font-normal text-white mb-1 tracking-tight group-hover:text-cyan-200 transition-colors">
                {leader.name}
              </h3>

              <p className="text-xs text-stone-400 font-light mb-1">
                {leader.role}
              </p>
              <p className="text-[11px] font-mono text-stone-500 mb-4">
                NIP/Gol: {leader.nip}
              </p>

              <p className="text-xs text-stone-300/90 font-light leading-relaxed border-t border-white/[0.06] pt-4 mt-auto italic">
                "{leader.quote}"
              </p>
            </div>
          ))}
        </div>

        {/* Teachers / Staff Link */}
        <div className="mt-12 text-center">
          <a 
            href="#profil" 
            className="group inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/30 text-xs sm:text-sm font-normal text-stone-300 hover:text-white backdrop-blur-xl transition-all duration-300 shadow-md"
          >
            <span>Lihat Profil Lengkap & Seluruh GTK</span>
            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs group-hover:bg-cyan-400 group-hover:text-black transition-colors">
              →
            </span>
          </a>
        </div>

      </div>
    </section>
  );
}
