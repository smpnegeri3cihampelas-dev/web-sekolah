'use client';

import React from 'react';

export default function Contact() {
  return (
    <section id="kontak" className="relative w-full py-20 sm:py-28 bg-[#f8fafc] text-slate-900 border-b border-indigo-100/70 overflow-hidden select-none">
      {/* Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-100/35 blur-[160px] rounded-full" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-purple-100/30 blur-[160px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left: Map & Location Card */}
          <div className="lg:col-span-6 rounded-[2.2rem] bg-white border border-indigo-100 p-3 sm:p-5 shadow-md hover:shadow-xl transition-all duration-300">
            <div className="w-full h-[380px] sm:h-[430px] rounded-[1.8rem] overflow-hidden relative border border-indigo-100 shadow-inner bg-slate-100">
              
              {/* Actual Google Maps Embed with Map Visual */}
              <iframe
                src="https://maps.google.com/maps?q=SMPN+3+Cihampelas,+Situwangi,+Cihampelas,+Kabupaten+Bandung+Barat&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full object-cover"
                title="Peta Lokasi SMP Negeri 3 Cihampelas"
              />

              {/* Floating Top Badge */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-indigo-100 shadow-lg text-[11px] font-medium text-slate-800 pointer-events-auto">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Peta Kampus Interaktif</span>
              </div>

              {/* Floating Bottom Card */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-10 p-3 sm:p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-indigo-100 shadow-xl pointer-events-auto">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center shrink-0 text-indigo-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">SMP Negeri 3 Cihampelas</div>
                      <div className="text-[11px] text-slate-500 truncate">Kp. Sukawangi, Situwangi, Bandung Barat</div>
                    </div>
                  </div>
                  <a 
                    href="https://maps.google.com/?q=SMPN+3+Cihampelas" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium transition-colors shrink-0 shadow-sm flex items-center gap-1"
                  >
                    <span>Buka Rute</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* Right: Contact Information */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-indigo-50/80 border border-indigo-200/70 text-indigo-700 text-[11px] font-medium tracking-[0.15em] uppercase mb-4 shadow-sm self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
              <span>Hubungi Kami</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900 mb-8 leading-[1.12] tracking-tight">
              Layanan Informasi <br /> 
              <span className="font-semibold text-indigo-950">& Kunjungan Sekolah</span>
            </h2>

            <div className="flex flex-col gap-5">
              
              {/* Address */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-indigo-100 hover:border-indigo-300 transition-all shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center shrink-0 text-indigo-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-bold mb-1">Alamat Resmi</h4>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-light">
                    Kp. Sukawangi RT 02 / RW 09, Desa Situwangi, Kec. Cihampelas, Kabupaten Bandung Barat, Jawa Barat 40767
                  </p>
                  <a 
                    href="https://maps.google.com/?q=SMPN+3+Cihampelas" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 mt-2 font-mono group"
                  >
                    <span>Buka Petunjuk Arah di Google Maps</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">↗</span>
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-indigo-100 hover:border-indigo-300 transition-all shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center shrink-0 text-purple-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-purple-700 font-bold mb-1">Pusat Panggilan & WhatsApp</h4>
                  <p className="text-slate-600 text-xs sm:text-sm font-light">0812-3456-7890 <span className="text-[10px] text-slate-500 font-mono ml-2">(Layanan Informasi & PPDB)</span></p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-indigo-100 hover:border-indigo-300 transition-all shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0 text-blue-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-blue-700 font-bold mb-1">Surat Elektronik (Email)</h4>
                  <p className="text-slate-600 text-xs sm:text-sm font-light">info@smpn3cihampelas.sch.id</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
