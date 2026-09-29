export default function PPDB() {
  return (
    <section id="daftar" className="w-full py-28 bg-zinc-950 relative overflow-hidden border-t border-white/5">
      {/* Elegant Ambient Lighting */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-amber-600/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-stone-500/5 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text */}
          <div>
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-stone-300 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase mb-8 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Admissions Open
            </div>
            
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-medium text-stone-100 leading-[1.1] mb-6">
              Jadilah Bagian dari <br />
              <span className="text-amber-500/90 italic">
                Generasi Unggul
              </span>
            </h2>
            
            <p className="text-stone-400 font-sans text-sm md:text-base mb-10 leading-relaxed max-w-lg font-light">
              Penerimaan Peserta Didik Baru (PPDB) SMP Negeri 3 Cihampelas dilakukan secara terpusat melalui portal resmi Dinas Pendidikan. Siapkan dokumen Anda dan pilih jalur yang tepat.
            </p>
            
            {/* Call to action button */}
            <a 
              href="https://ppdb.jabarprov.go.id" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-zinc-950 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-stone-200 hover:scale-105 transition-all duration-400 group"
            >
              <span>Akses Portal PPDB</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
              </svg>
            </a>
          </div>

          {/* Right Grid of Paths */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Jalur Zonasi */}
            <div className="glass-luxury rounded-[2rem] p-8 hover:bg-white/5 transition-all duration-400 group relative">
              <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 text-amber-500 flex items-center justify-center mb-6 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-display font-medium text-stone-100 mb-2">Jalur Zonasi</h3>
              <div className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest mb-3">Kuota 50%</div>
              <p className="text-xs font-sans text-stone-400 leading-relaxed font-light">
                Penerimaan berdasarkan jarak domisili terdekat dengan sekolah yang dibuktikan dengan Kartu Keluarga.
              </p>
            </div>

            {/* Jalur Afirmasi */}
            <div className="glass-luxury rounded-[2rem] p-8 hover:bg-white/5 transition-all duration-400 group relative sm:mt-8">
              <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 text-amber-500 flex items-center justify-center mb-6 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-display font-medium text-stone-100 mb-2">Jalur Afirmasi</h3>
              <div className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest mb-3">Kuota 15%</div>
              <p className="text-xs font-sans text-stone-400 leading-relaxed font-light">
                Diperuntukkan bagi calon peserta didik dari keluarga tidak mampu dan penyandang disabilitas.
              </p>
            </div>

            {/* Jalur Prestasi */}
            <div className="glass-luxury rounded-[2rem] p-8 hover:bg-white/5 transition-all duration-400 group relative">
              <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 text-amber-500 flex items-center justify-center mb-6 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-display font-medium text-stone-100 mb-2">Jalur Prestasi</h3>
              <div className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest mb-3">Kuota 30%</div>
              <p className="text-xs font-sans text-stone-400 leading-relaxed font-light">
                Berdasarkan nilai rapor dan prestasi akademik/non-akademik di tingkat kabupaten atau provinsi.
              </p>
            </div>

            {/* Jalur Perpindahan */}
            <div className="glass-luxury rounded-[2rem] p-8 hover:bg-white/5 transition-all duration-400 group relative sm:mt-8">
              <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 text-amber-500 flex items-center justify-center mb-6 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-display font-medium text-stone-100 mb-2">Perpindahan</h3>
              <div className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest mb-3">Kuota 5%</div>
              <p className="text-xs font-sans text-stone-400 leading-relaxed font-light">
                Jalur khusus bagi calon peserta didik yang mengikuti perpindahan tugas orang tua atau anak guru.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
