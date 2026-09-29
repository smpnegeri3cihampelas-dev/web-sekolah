export default function News() {
  const news = [
    {
      id: 1,
      title: 'Pendaftaran Ekskul Robotika dan Coding Dibuka',
      date: '20 Mei 2026',
      category: 'PENGUMUMAN',
      desc: 'Siswa kelas 7 dan 8 kini dapat mendaftar untuk klub sains terbaru kami.',
      image: '/gallery_1.jpg'
    },
    {
      id: 2,
      title: 'Tim Basket SMPN 3 Meraih Juara 1 Tingkat Kabupaten',
      date: '15 Mei 2026',
      category: 'PRESTASI',
      desc: 'Prestasi gemilang diraih oleh tim basket putra pada kejuaraan antar SMP/sederajat.',
      image: '/gallery_2.jpg'
    },
    {
      id: 3,
      title: 'Jadwal Pelaksanaan Ujian Akhir Semester Genap',
      date: '10 Mei 2026',
      category: 'AKADEMIK',
      desc: 'Jadwal dan tata tertib pelaksanaan UAS Genap Tahun Ajaran 2025/2026.',
      image: '/school_building.jpg'
    }
  ];

  return (
    <section id="berita" className="w-full py-28 bg-zinc-950 relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-16 gap-8">
          <div>
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-stone-300 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Latest Updates
            </div>
            <h2 className="text-4xl sm:text-5xl font-display font-medium text-stone-100 tracking-tight">
              Berita & <span className="text-amber-500/90 italic">Pengumuman</span>
            </h2>
          </div>
          
          <button className="btn-luxury px-8 py-3 rounded-full text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase">
            Lihat Semua Berita
          </button>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {news.map((item) => (
            <div key={item.id} className="group glass-luxury rounded-[2rem] p-4 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] cursor-pointer flex flex-col h-full">
              
              {/* Image Container */}
              <div className="w-full h-56 relative rounded-[1.5rem] overflow-hidden mb-6">
                <div 
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  style={{ backgroundImage: `url(${item.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-[9px] font-bold text-stone-100 uppercase tracking-[0.2em]">
                  {item.category}
                </div>
              </div>
              
              {/* Content */}
              <div className="px-2 pb-2 flex-1 flex flex-col">
                <p className="text-[10px] font-semibold text-amber-500/80 mb-3 tracking-[0.15em] uppercase">{item.date}</p>
                <h3 className="text-lg font-display font-medium text-stone-100 mb-3 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-stone-400 text-xs sm:text-sm font-sans leading-relaxed mb-6 line-clamp-2 font-light flex-1">
                  {item.desc}
                </p>
                
                <div className="inline-flex items-center text-[10px] sm:text-xs font-bold text-stone-300 group-hover:text-amber-400 uppercase tracking-[0.15em] transition-colors mt-auto">
                  Baca Selengkapnya
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
