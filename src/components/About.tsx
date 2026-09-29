'use client';

import { useState, useEffect } from 'react';
import { useLenis } from 'lenis/react';
import { useSchoolData } from '@/lib/schoolData';

export default function About() {
  const lenis = useLenis();
  const { leaders, teachers, dataPokok } = useSchoolData();

  const [activeTab, setActiveTab] = useState<'visi' | 'sejarah' | 'akreditasi' | 'pimpinan'>('visi');
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const categories = ['Semua', 'Pimpinan', 'MIPA', 'Bahasa', 'Teknologi', 'Sosial & Agama', 'Olahraga & Seni'];

  const headmaster = leaders.find(l => l.role.toLowerCase().includes('kepala')) || leaders[0];
  const vicePrincipals = leaders.filter(l => l.id !== headmaster?.id);

  // Manage Lenis and page scroll cleanly when modal is opened/closed
  useEffect(() => {
    if (isTeacherModalOpen) {
      lenis?.stop();
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
        lenis?.start();
      };
    }
  }, [isTeacherModalOpen, lenis]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTeacherModalOpen) {
        setIsTeacherModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTeacherModalOpen]);

  const filteredTeachers = teachers.filter(teacher => {
    const matchSearch = teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        teacher.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (teacher.role && teacher.role.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCategory = selectedCategory === 'Semua' || 
                          teacher.category === selectedCategory ||
                          (selectedCategory === 'Pimpinan' && teacher.role && (teacher.role.toLowerCase().includes('pks') || teacher.role.toLowerCase().includes('kepala')));
    return matchSearch && matchCategory;
  });

  return (
    <section id="profil" className="relative w-full py-20 sm:py-28 bg-black text-stone-100 overflow-hidden select-none border-b border-white/[0.06]">
      {/* Subtle Cosmic Ambient Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[400px] bg-cyan-900/[0.08] rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[400px] bg-purple-900/[0.06] rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-stone-300 text-[11px] font-normal tracking-[0.2em] uppercase mb-3 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
            <span>Profil & Identitas Sekolah</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-tight leading-[1.12]">
            Mengenal Lebih Dekat <span className="font-normal text-stone-200">SMPN 3 Cihampelas</span>
          </h2>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          
          {/* Left: Tabs Navigation & Content */}
          <div className="lg:col-span-7 rounded-[2.2rem] bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl p-3 sm:p-5 shadow-xl shadow-black/40 relative flex flex-col">
            
            {/* Tab Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-4 p-1.5 rounded-2xl bg-black/40 border border-white/[0.05]">
              <button
                onClick={() => setActiveTab('visi')}
                className={`py-2.5 px-2 text-xs font-medium tracking-wide transition-all whitespace-nowrap rounded-xl cursor-pointer text-center ${
                  activeTab === 'visi' 
                    ? 'bg-white/[0.08] text-white shadow-sm border border-white/15' 
                    : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                Visi & Misi
              </button>
              <button
                onClick={() => setActiveTab('pimpinan')}
                className={`py-2.5 px-2 text-xs font-medium tracking-wide transition-all whitespace-nowrap rounded-xl cursor-pointer text-center ${
                  activeTab === 'pimpinan' 
                    ? 'bg-white/[0.08] text-white shadow-sm border border-white/15' 
                    : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                Pimpinan
              </button>
              <button
                onClick={() => setActiveTab('sejarah')}
                className={`py-2.5 px-2 text-xs font-medium tracking-wide transition-all whitespace-nowrap rounded-xl cursor-pointer text-center ${
                  activeTab === 'sejarah' 
                    ? 'bg-white/[0.08] text-white shadow-sm border border-white/15' 
                    : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                Sejarah
              </button>
              <button
                onClick={() => setActiveTab('akreditasi')}
                className={`py-2.5 px-2 text-xs font-medium tracking-wide transition-all whitespace-nowrap rounded-xl cursor-pointer text-center ${
                  activeTab === 'akreditasi' 
                    ? 'bg-white/[0.08] text-white shadow-sm border border-white/15' 
                    : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                Akreditasi
              </button>
            </div>

            {/* Tab Content Panel */}
            <div className="p-6 sm:p-8 bg-black/30 rounded-[1.8rem] flex-1 min-h-[360px] border border-white/[0.04] flex flex-col justify-center">
              
              {/* Visi Misi Content */}
              {activeTab === 'visi' && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <div className="inline-flex items-center gap-2 text-[10px] font-semibold text-cyan-400 tracking-[0.2em] uppercase mb-3">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    Visi Sekolah
                  </div>
                  <p className="text-white text-base sm:text-lg md:text-xl font-light leading-relaxed mb-6 pb-6 border-b border-white/[0.08]">
                    "Terwujudnya peserta didik yang <span className="font-normal text-cyan-300">Religius, Inovatif, Gesit, Aktif, dan Santun (RIGAS)</span>"
                  </p>
                  
                  <div className="inline-flex items-center gap-2 text-[10px] font-semibold text-cyan-400 tracking-[0.2em] uppercase mb-3.5">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    Misi Sekolah
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Menyelenggarakan pendidikan yang religius dan berorientasi pada peningkatan iman dan taqwa.',
                      'Mengembangkan potensi kecerdasan intelektual, emosional, spiritual, dan kinestetik untuk mewujudkan generasi unggul dan berprestasi.',
                      'Mewujudkan generasi yang sehat jasmani dan rohani, serta memiliki keterampilan hidup (life skill).',
                      'Mengembangkan sikap berperan aktif memberikan kontribusi positif terhadap lingkungan sekolah dan masyarakat sekitar.',
                      'Menumbuhkan budaya positif bagi warga sekolah sehingga menjadi sumber kearifan dalam bertindak.'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-stone-300 text-xs sm:text-sm leading-relaxed">
                        <span className="flex-shrink-0 text-cyan-400 font-mono text-xs border border-cyan-400/30 bg-cyan-400/10 rounded-lg w-6 h-6 flex items-center justify-center mt-0.5">
                          0{i+1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pimpinan Sekolah Content */}
              {activeTab === 'pimpinan' && (
                <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col gap-3.5">
                  <div className="inline-flex items-center gap-2 text-[10px] font-semibold text-cyan-400 tracking-[0.2em] uppercase mb-1">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    Manajemen & Pimpinan Sekolah
                  </div>

                  {/* Kepala Sekolah Card */}
                  {headmaster && (
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-cyan-400/30 transition-all flex items-start gap-4">
                      <img 
                        src={headmaster.photo || '/teachers/default_avatar.svg'} 
                        alt={headmaster.name} 
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-cyan-400/40 shadow-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-white text-sm sm:text-base font-medium tracking-tight">{headmaster.name}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-cyan-300 border border-cyan-400/30 bg-cyan-500/10">
                            {headmaster.role}
                          </span>
                        </div>
                        <p className="text-stone-400 text-xs font-light leading-relaxed">
                          "{headmaster.quote}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Wakasek Cards in Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {vicePrincipals.map((vp) => (
                      <div key={vp.id} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all flex items-start gap-3">
                        <img 
                          src={vp.photo || '/teachers/default_avatar.svg'} 
                          alt={vp.name} 
                          className="w-11 h-11 rounded-xl object-cover border border-white/10 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-stone-200 text-xs sm:text-sm font-medium">{vp.name}</h5>
                          <p className="text-cyan-300/90 text-[10px] font-mono mb-1">{vp.role}</p>
                          <p className="text-stone-400 text-[11px] font-light line-clamp-2">
                            {vp.quote}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tombol Lihat Seluruh Dewan Guru */}
                  <div className="pt-2">
                    <button
                      onClick={() => setIsTeacherModalOpen(true)}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-400/30 hover:border-cyan-400/50 text-cyan-300 hover:text-cyan-200 text-xs font-medium flex items-center justify-center gap-2 transition-all group shadow-md"
                    >
                      <span>👥 Lihat Seluruh Dewan Guru & Tenaga Pendidik ({teachers.length} GTK)</span>
                      <span className="w-5 h-5 rounded-full bg-cyan-400/20 flex items-center justify-center text-[11px] group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sejarah Content */}
              {activeTab === 'sejarah' && (
                <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col gap-4">
                  <div className="inline-flex items-center gap-2 text-[10px] font-semibold text-cyan-400 tracking-[0.2em] uppercase mb-1">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    Perjalanan Bersejarah
                  </div>
                  <p className="text-stone-300 leading-relaxed text-xs sm:text-sm font-light">
                    SMP Negeri 3 Cihampelas didirikan pada tahun 2007 sebagai respons atas tingginya animo masyarakat di wilayah Cihampelas dan sekitarnya akan pendidikan tingkat menengah pertama yang berkualitas.
                  </p>
                  <p className="text-stone-300 leading-relaxed text-xs sm:text-sm font-light">
                    Pada awal berdirinya, sekolah ini beroperasi dengan menumpang di bangunan sekolah dasar terdekat sebelum akhirnya memiliki gedung mandiri yang megah pada tahun 2009.
                  </p>
                  <p className="text-stone-300 leading-relaxed text-xs sm:text-sm font-light">
                    Kini, SMPN 3 Cihampelas telah berkembang menjadi salah satu institusi pendidikan pionir di Kabupaten Bandung Barat yang memadukan karakter lokal dengan ekosistem digital modern.
                  </p>
                </div>
              )}

              {/* Akreditasi Content */}
              {activeTab === 'akreditasi' && (
                <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col items-center justify-center text-center py-4">
                  <div className="w-24 h-24 border border-cyan-400/30 bg-cyan-400/5 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.15)] mb-6 relative">
                    <div className="absolute inset-1.5 border border-cyan-400/20 rounded-full" />
                    <span className="text-5xl font-light text-cyan-400 drop-shadow-md">A</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-normal text-white mb-2 tracking-wide uppercase">
                    Terakreditasi "A" (Unggul)
                  </h3>
                  <p className="text-stone-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto mb-6 font-light">
                    Diakui secara resmi oleh Badan Akreditasi Nasional Sekolah/Madrasah (BAN-S/M) dengan predikat Unggul, membuktikan konsistensi standar mutu pendidikan dan tata kelola berdaya saing.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2.5">
                    <span className="px-3.5 py-1.5 border border-white/10 bg-white/5 rounded-full text-stone-300 text-[11px] font-normal uppercase tracking-wider">
                      Kurikulum Merdeka
                    </span>
                    <span className="px-3.5 py-1.5 border border-white/10 bg-white/5 rounded-full text-stone-300 text-[11px] font-normal uppercase tracking-wider">
                      Sekolah Penggerak
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Statistics Grid */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="rounded-[2.2rem] bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl p-7 sm:p-10 h-full flex flex-col justify-between shadow-xl shadow-black/40 relative overflow-hidden group">
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 text-[10px] font-semibold text-stone-400 tracking-[0.2em] uppercase mb-8">
                  <span className="w-6 h-[1px] bg-cyan-400/50" />
                  Data Pokok Pendidikan
                </div>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-10">
                  {/* Stat 1 */}
                  <div>
                    <div className="text-4xl sm:text-5xl font-light text-white tracking-tight mb-1">
                      {dataPokok.siswa}
                    </div>
                    <div className="text-[11px] text-stone-400 uppercase tracking-wider font-light">
                      Siswa Aktif
                    </div>
                  </div>
                  
                  {/* Stat 2 */}
                  <div>
                    <div className="text-4xl sm:text-5xl font-light text-white tracking-tight mb-1">
                      {dataPokok.rombel}
                    </div>
                    <div className="text-[11px] text-stone-400 uppercase tracking-wider font-light">
                      Rombongan Belajar
                    </div>
                  </div>
                  
                  {/* Stat 3 */}
                  <div>
                    <div className="text-4xl sm:text-5xl font-light text-white tracking-tight mb-1">
                      {dataPokok.guru}
                    </div>
                    <div className="text-[11px] text-stone-400 uppercase tracking-wider font-light">
                      Guru & Pendidik
                    </div>
                  </div>
                  
                  {/* Stat 4 */}
                  <div>
                    <div className="text-4xl sm:text-5xl font-light text-white tracking-tight mb-1">
                      {dataPokok.staf}
                    </div>
                    <div className="text-[11px] text-stone-400 uppercase tracking-wider font-light">
                      Staf Akademik
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-10 pt-6 border-t border-white/[0.08] relative z-10">
                <p className="text-xs text-stone-400 leading-relaxed font-light">
                  Ekosistem belajar modern ramah lingkungan yang didukung fasilitas cerdas dan tata kelola digital terintegrasi.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Modal Direktori Dewan Guru */}
      {isTeacherModalOpen && (
        <div 
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-[fadeIn_0.2s_ease-out] select-text"
          onClick={() => setIsTeacherModalOpen(false)}
        >
          <div 
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="w-full max-w-5xl h-[88vh] max-h-[820px] bg-[#0c0d12] border border-white/10 rounded-[2rem] shadow-2xl shadow-cyan-950/40 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02] flex-shrink-0">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 text-[10px] uppercase font-mono tracking-wider mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Direktori Resmi GTK
                </div>
                <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight">
                  Dewan Guru & Tenaga Pendidik <span className="font-normal text-cyan-400">SMPN 3 Cihampelas</span>
                </h3>
              </div>
              <button 
                onClick={() => setIsTeacherModalOpen(false)}
                className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 sm:p-6 border-b border-white/[0.06] bg-black/40 space-y-3 flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Cari nama guru, gelar, atau mata pelajaran yang diampu..."
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-white text-xs sm:text-sm placeholder-stone-500 transition-colors"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-semibold'
                        : 'bg-white/[0.03] text-stone-400 hover:text-stone-200 hover:bg-white/[0.06] border border-white/[0.06]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Teacher Cards Grid - Smooth Scrollable */}
            <div 
              data-lenis-prevent="true"
              data-lenis-prevent-wheel="true"
              data-lenis-prevent-touch="true"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 [scrollbar-width:thin] [scrollbar-color:rgba(56,189,248,0.5)_rgba(255,255,255,0.04)] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-white/[0.02] [&::-webkit-scrollbar-thumb]:bg-cyan-500/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400"
            >
              {filteredTeachers.length === 0 ? (
                <div className="text-center py-16 text-stone-500 text-sm">
                  Tidak ditemukan tenaga pendidik dengan kata kunci "{searchQuery}".
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredTeachers.map((teacher) => (
                    <div 
                      key={teacher.id}
                      className="p-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] hover:border-cyan-400/30 transition-all flex flex-col justify-between group shadow-sm"
                    >
                      <div className="flex items-start gap-3.5 mb-3">
                        <img 
                          src={teacher.photo || '/teachers/default_avatar.svg'} 
                          alt={teacher.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-white/10 group-hover:border-cyan-400/50 shadow-md flex-shrink-0 transition-transform group-hover:scale-105" 
                        />
                        <div className="flex-1 min-w-0">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider bg-white/[0.05] border border-white/10 text-stone-300 mb-1">
                            {teacher.subject}
                          </span>
                          <h4 className="text-white text-xs sm:text-sm font-medium tracking-tight truncate group-hover:text-cyan-200 transition-colors">
                            {teacher.name}
                          </h4>
                          <p className="text-[10px] text-stone-400 font-mono mt-0.5 truncate">
                            {teacher.nip && teacher.nip !== '-' ? `NIP/Gol: ${teacher.nip}` : `Status: ${teacher.status}`}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-400/20 text-cyan-300 font-mono">
                          {teacher.status}
                        </span>
                        {teacher.active !== false ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Aktif Mengajar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-stone-500 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                            Mutasi / Nonaktif
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-white/[0.08] bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Menampilkan <strong>{filteredTeachers.length}</strong> dari <strong>{teachers.length}</strong> Dewan Guru & Tenaga Kependidikan</span>
                </div>
                <span className="text-[11px] text-stone-500 italic hidden sm:inline">↕ Gulir untuk melihat pendidik lainnya</span>
              </div>
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-stone-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
