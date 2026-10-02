'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-indigo-950/60 pt-16 sm:pt-20 pb-10 px-4 sm:px-8 bg-[#080b20] text-slate-400 relative overflow-hidden select-none">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/10 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-purple-600/10 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mb-14 relative z-10">
        
        {/* Left Col: School Identity */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3.5 mb-6">
              <div className="relative w-12 h-12">
                <Image 
                  src="/logo.png" 
                  alt="Logo SMP Negeri 3 Cihampelas" 
                  fill
                  className="rounded-full p-0.5 object-cover bg-white/10 border border-white/20 shadow-lg"
                />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-white flex items-center gap-2">
                  SMPN 3 Cihampelas
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#6366f1]" />
                </h2>
                <div className="flex gap-2.5 items-center mt-0.5">
                  <span className="text-[10px] tracking-widest text-indigo-400 uppercase font-mono">Berkarakter RIGAS</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[10px] tracking-wider text-slate-400 font-mono">NPSN: 20224133</span>
                </div>
              </div>
            </div>
            
            <p className="text-slate-400 max-w-md mb-8 text-xs sm:text-sm leading-relaxed font-light">
              Membangun generasi unggul yang menguasai teknologi masa depan, menjunjung tinggi integritas budi pekerti, dan berdaya saing global.
            </p>
          </div>

          <div className="p-6 rounded-[2rem] bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl relative">
            <div className="text-indigo-400 uppercase tracking-widest text-[10px] font-mono mb-2">
              Sekretariat & Kampus Utama
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-light mb-3">
              Jl. Raya Cihampelas, Desa Cipatik, Kec. Cihampelas, Kabupaten Bandung Barat, Jawa Barat 40562
            </p>
            <div className="pt-3 border-t border-white/[0.06] text-slate-400 flex flex-col gap-1 text-[11px] font-light">
              <span>Email: info@smpn3cihampelas.sch.id</span>
              <span>Telepon: (022) 12345678</span>
            </div>
          </div>
        </div>
        
        {/* Right Col: Campus Landmark Photo Card */}
        <div className="lg:col-span-7 rounded-[2.2rem] overflow-hidden border border-white/10 h-72 sm:h-80 lg:h-full min-h-[300px] relative bg-white/[0.02] group shadow-2xl shadow-black/50">
          <Image 
            src="/school_building.jpg"
            alt="Kampus SMPN 3 Cihampelas"
            fill
            className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700 ease-out"
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#080b20] via-[#080b20]/40 to-transparent z-10" />
          
          <div className="absolute top-5 right-5 px-3.5 py-1 rounded-full bg-[#080b20]/80 backdrop-blur-md border border-white/20 text-[10px] text-indigo-300 font-mono shadow-xl z-20 tracking-widest uppercase">
            Terakreditasi A Unggul
          </div>

          <div className="absolute bottom-6 left-6 right-6 z-20">
            <h3 className="text-xl sm:text-2xl font-light text-white mb-1.5 leading-snug">
              Ekosistem Belajar Inspiratif & Kolaboratif
            </h3>
            <p className="text-slate-300 text-xs font-light max-w-lg">
              Mendidik dengan hati, menginspirasi dengan prestasi, dan menyongsong peradaban digital berkarakter.
            </p>
          </div>
        </div>

      </div>
      
      {/* Bottom Copyright & Socials */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 border-t border-white/[0.08] pt-6 gap-4 font-light">
        <p>&copy; {new Date().getFullYear()} SMP Negeri 3 Cihampelas. Hak Cipta Dilindungi Undang-Undang.</p>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6 text-xs">
          <a href="https://disdik.jabarprov.go.id/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-300 transition-colors">Dinas Pendidikan</a>
          <span className="text-white/20">•</span>
          <a 
            href="https://www.instagram.com/smpn_3cihampelas?stkn=Z2F3cnJqYXg1bGpw" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-indigo-300 transition-colors"
          >
            Instagram
          </a>
          <span className="text-white/20">•</span>
          <a 
            href="https://youtube.com/@smpnegeri3cihampelas?si=GrYmOcm9m04EHQ4q" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-indigo-300 transition-colors"
          >
            YouTube
          </a>
          <span className="text-white/20">•</span>
          <Link href="/login" className="hover:text-indigo-300 text-indigo-400 font-medium transition-colors">
            Portal Admin
          </Link>
        </div>
      </div>

    </footer>
  );
}
