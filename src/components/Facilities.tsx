'use client';

import Image from 'next/image';

export default function Facilities() {
  const facilities = [
    {
      title: 'Laboratorium Komputer & Digital 4.0',
      desc: 'Dilengkapi perangkat komputasi modern, jaringan internet serat optik, dan sarana coding interaktif.',
      image: '/slide2.jpeg',
      badge: 'Fasilitas 01',
      className: 'md:col-span-2 md:row-span-2 min-h-[380px]',
    },
    {
      title: 'Perpustakaan Digital Terpadu',
      desc: 'Koleksi ribuan e-book, repositori karya siswa, serta ruang baca ergonomis yang tenang.',
      image: '/slide3.jpeg',
      badge: 'Fasilitas 02',
      className: 'md:col-span-1 md:row-span-1 min-h-[240px]',
    },
    {
      title: 'Creative STEM & Robotika Room',
      desc: 'Area perakitan hardware, sensor IoT, serta eksperimen otomasi siswa.',
      image: '/slide4.jpeg',
      badge: 'Fasilitas 03',
      className: 'md:col-span-1 md:row-span-1 min-h-[240px]',
    },
    {
      title: 'Kawasan Smart Eco-Campus',
      desc: 'Lingkungan sekolah asri bebas polusi dengan sarana olahraga terpadu dan ruang terbuka hijau.',
      image: '/slide5.jpeg',
      badge: 'Fasilitas 04',
      className: 'md:col-span-2 md:row-span-1 min-h-[260px]',
    },
  ];

  return (
    <section id="fasilitas" className="relative w-full py-20 sm:py-28 px-4 sm:px-8 bg-black text-stone-100 border-b border-white/[0.06] overflow-hidden select-none">
      
      {/* Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-cyan-900/[0.06] blur-[160px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-900/[0.06] blur-[160px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-stone-300 text-[11px] font-normal tracking-[0.2em] uppercase mb-3 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
            <span>Sarana & Prasarana Modern</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-tight leading-[1.12] mb-4">
            Fasilitas Kampus Cerdas <span className="font-normal text-stone-200">Standar Unggul</span>
          </h2>
          <p className="text-stone-400 text-xs sm:text-sm font-light leading-relaxed max-w-xl mx-auto">
            Mendukung eksplorasi akademik dan pengembangan potensi non-akademik siswa melalui infrastruktur modern yang adaptif dan terintegrasi.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {facilities.map((fac, idx) => (
            <div 
              key={idx} 
              className={`group relative rounded-[2.2rem] overflow-hidden border border-white/10 bg-white/[0.02] flex flex-col justify-between p-7 sm:p-8 transition-all duration-500 shadow-xl shadow-black/40 hover:border-cyan-400/40 ${fac.className}`}
            >
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <Image 
                  src={fac.image} 
                  alt={fac.title}
                  fill 
                  className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
              </div>

              {/* Top Card Badge */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="px-3.5 py-1 rounded-full border border-white/20 bg-black/50 backdrop-blur-md text-[10px] tracking-widest text-cyan-300 font-mono uppercase shadow-md">
                  {fac.badge}
                </span>
                <span className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-cyan-400 group-hover:text-black group-hover:border-cyan-400 transition-all duration-300 shadow-md">
                  <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
                </span>
              </div>

              {/* Bottom Card Content */}
              <div className="relative z-10 pt-16">
                <h3 className="text-xl sm:text-2xl font-normal text-white mb-2 group-hover:text-cyan-200 transition-colors drop-shadow leading-snug">
                  {fac.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 line-clamp-2 leading-relaxed font-light drop-shadow">
                  {fac.desc}
                </p>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
