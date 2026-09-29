'use client';

import React from 'react';

export default function Contact() {
  return (
    <section id="kontak" className="relative w-full py-20 sm:py-28 bg-black text-stone-100 border-b border-white/[0.06] overflow-hidden select-none">
      {/* Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-900/[0.06] blur-[160px] rounded-full" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-purple-900/[0.06] blur-[160px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left: Map & Location Card */}
          <div className="lg:col-span-6 rounded-[2.2rem] bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl p-4 sm:p-6 shadow-xl shadow-black/40">
            <div className="w-full h-[360px] sm:h-[400px] rounded-[1.8rem] overflow-hidden relative border border-white/10 bg-[#0d0d10] flex items-center justify-center">
              
              {/* Radar Grid Pattern */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(rgba(56, 189, 248, 0.4) 1px, transparent 1px)`,
                  backgroundSize: '32px 32px'
                }}
              />
              
              {/* Circular Concentric Rings */}
              <div className="absolute w-64 h-64 rounded-full border border-cyan-500/20" />
              <div className="absolute w-44 h-44 rounded-full border border-cyan-500/25 border-dashed animate-[spin_60s_linear_infinite]" />
              <div className="absolute w-24 h-24 rounded-full border border-cyan-400/30" />

              {/* Center Map Pin */}
              <div className="relative z-10 flex flex-col items-center text-center p-4">
                <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(56,189,248,0.3)]">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping absolute" />
                  <div className="w-3 h-3 bg-cyan-300 rounded-full relative z-10 shadow-[0_0_8px_#38bdf8]" />
                </div>
                <span className="text-sm font-medium text-white tracking-wide">Kampus SMPN 3 Cihampelas</span>
                <span className="text-[11px] text-cyan-300/80 font-mono mt-0.5">Kab. Bandung Barat · Jawa Barat</span>
                <a 
                  href="https://maps.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-4 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] font-medium text-white transition-all shadow-sm"
                >
                  Buka di Google Maps ↗
                </a>
              </div>
            </div>
          </div>

          {/* Right: Contact Information */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-stone-300 text-[11px] font-normal tracking-[0.2em] uppercase mb-4 backdrop-blur-md self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              <span>Hubungi Kami</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-8 leading-[1.12] tracking-tight">
              Layanan Informasi <br /> 
              <span className="font-normal text-stone-200">& Kunjungan Sekolah</span>
            </h2>

            <div className="flex flex-col gap-6">
              
              {/* Address */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-cyan-400/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center shrink-0 text-cyan-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 mb-1">Alamat Resmi</h4>
                  <p className="text-stone-300 text-xs sm:text-sm leading-relaxed font-light">
                    Jl. Raya Cihampelas, Desa Cipatik, Kec. Cihampelas, Kabupaten Bandung Barat, Jawa Barat 40562
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-cyan-400/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center shrink-0 text-purple-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-purple-300 mb-1">Pusat Panggilan & WhatsApp</h4>
                  <p className="text-stone-300 text-xs sm:text-sm font-light">0812-3456-7890 <span className="text-[10px] text-stone-500 font-mono ml-2">(Layanan Informasi & PPDB)</span></p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-cyan-400/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center shrink-0 text-indigo-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 mb-1">Surat Elektronik (Email)</h4>
                  <p className="text-stone-300 text-xs sm:text-sm font-light">info@smpn3cihampelas.sch.id</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
