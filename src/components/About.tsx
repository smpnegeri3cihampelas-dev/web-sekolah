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
    <section id="profil" className="relative w-full py-20 sm:py-28 bg-white text-slate-900 overflow-hidden select-none border-b border-indigo-100/70">
      {/* Subtle Soft Lavender Ambient Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[400px] bg-indigo-100/35 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[400px] bg-purple-100/30 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-[11px] font-medium tracking-[0.15em] uppercase mb-3 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
            <span>Profil &amp; Identitas Sekolah</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.12]">
            Mengenal Lebih Dekat <span className="font-semibold text-indigo-900">SMPN 3 Cihampelas</span>
          </h2>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          
          {/* Left: Tabs Navigation & Content */}
          <div className="lg:col-span-7 rounded-[2.2rem] bg-[#f8fafc] border border-indigo-100/80 p-3 sm:p-5 shadow-lg shadow-indigo-950/5 relative flex flex-col">
            
            {/* Tab Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-4 p-1.5 rounded-2xl bg-slate-200/60 border border-slate-200/80">
              <button
                onClick={() => setActiveTab('visi')}
                className={`py-2.5 px-2 text-xs tracking-wide transition-all whitespace-nowrap rounded-xl cursor-pointer text-center ${
                  activeTab === 'visi' 
                    ? 'bg-white text-indigo-700 font-semibold shadow-sm border border-indigo-200/80' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent font-medium'
                }`}
              >
                Visi &amp; Misi
              </button>
              <button
                onClick={() => setActiveTab('pimpinan')}
                className={`py-2.5 px-2 text-xs tracking-wide transition-all whitespace-nowrap rounded-xl cursor-pointer text-center ${
                  activeTab === 'pimpinan' 
                    ? 'bg-white text-indigo-700 font-semibold shadow-sm border border-indigo-200/80' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent font-medium'
                }`}
              >
                Pimpinan
              </button>
              <button
                onClick={() => setActiveTab('sejarah')}
                className={`py-2.5 px-2 text-xs tracking-wide transition-all whitespace-nowrap rounded-xl cursor-pointer text-center ${
                  activeTab === 'sejarah' 
                    ? 'bg-white text-indigo-700 font-semibold shadow-sm border border-indigo-200/80' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent font-medium'
                }`}
              >
                Sejarah
              </button>
              <button
                onClick={() => setActiveTab('akreditasi')}
                className={`py-2.5 px-2 text-xs tracking-wide transition-all whitespace-nowrap rounded-xl cursor-pointer text-center ${
                  activeTab === 'akreditasi' 
                    ? 'bg-white text-indigo-700 font-semibold shadow-sm border border-indigo-200/80' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent font-medium'
                }`}
              >
                Akreditasi
              </button>
            </div>

            {/* Tab Content Panel */}
            <div className="p-6 sm:p-8 bg-white rounded-[1.8rem] flex-1 min-h-[360px] border border-indigo-100 shadow-sm flex flex-col justify-center">
              
              {/* Visi Misi Content */}
              {activeTab === 'visi' && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <div className="inline-flex items-center gap-2 text-[10px] font-semibold text-indigo-600 tracking-[0.2em] uppercase mb-3">
                    <span className="w-1 h-1 rounded-full bg-indigo-500" />
                    Visi Sekolah
                  </div>
                  <p className="text-slate-900 text-base sm:text-lg md:text-xl font-light leading-relaxed mb-6 pb-6 border-b border-indigo-100">
                    "Terwujudnya peserta didik yang <span className="font-semibold text-indigo-700">Religius, Inovatif, Gesit, Aktif, dan Santun (RIGAS)</span>"
                  </p>
                  
                  <div className="inline-flex items-center gap-2 text-[10px] font-semibold text-indigo-600 tracking-[0.2em] uppercase mb-3.5">
                    <span className="w-1 h-1 rounded-full bg-indigo-500" />
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
                      <li key={i} className="flex items-start gap-3 text-slate-700 text-xs sm:text-sm leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-600 text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          {i + 1}
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
                  <div className="inline-flex items-center gap-2 text-[10px] font-semibold text-indigo-600 tracking-[0.2em] uppercase mb-1">
                    <span className="w-1 h-1 rounded-full bg-indigo-500" />
                    Manajemen &amp; Pimpinan Sekolah
                  </div>

                  {/* Kepala Sekolah Card */}
                  {headmaster && (
                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 hover:border-indigo-300 transition-all flex items-start gap-4 shadow-sm">
                      <img 
                        src={headmaster.photo || '/teachers/default_avatar.svg'} 
                        alt={headmaster.name} 
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-indigo-200 shadow-md flex-shrink-0 bg-white"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-slate-900 text-sm sm:text-base font-semibold tracking-tight">{headmaster.name}</h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium text-indigo-700 border border-indigo-200 bg-indigo-50">
                            {headmaster.role}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs font-light leading-relaxed italic">
                          "{headmaster.quote}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Wakasek Cards in Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {vicePrincipals.map((vp) => (
                      <div key={vp.id} className="p-3.5 rounded-2xl bg-white border border-indigo-100/80 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5 transition-all flex items-start gap-3 shadow-sm">
                        <img 
                          src={vp.photo || '/teachers/default_avatar.svg'} 
                          alt={vp.name} 
                          className="w-11 h-11 rounded-xl object-cover border border-indigo-100 flex-shrink-0 bg-slate-50"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-slate-800 text-xs sm:text-sm font-semibold">{vp.name}</h5>
                          <p className="text-indigo-600 text-[10px] font-medium mb-0.5">{vp.role}</p>
                          <p className="text-slate-500 text-[11px] font-light line-clamp-2">
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
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center justify-center gap-2 transition-all group shadow-md shadow-indigo-600/25 cursor-pointer"
                    >
                      <span>👥 Lihat Seluruh Dewan Guru &amp; Tenaga Pendidik ({teachers.length} GTK)</span>
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px] group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sejarah Content */}
              {activeTab === 'sejarah' && (
                <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col gap-4">
                  <div className="inline-flex items-center gap-2 text-[10px] font-semibold text-indigo-600 tracking-[0.2em] uppercase mb-1">
                    <span className="w-1 h-1 rounded-full bg-indigo-500" />
                    Perjalanan Bersejarah
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs sm:text-sm font-light">
                    SMP Negeri 3 Cihampelas didirikan pada tahun 2007 sebagai respons atas tingginya animo masyarakat di wilayah Cihampelas dan sekitarnya akan pendidikan tingkat menengah pertama yang berkualitas.
                  </p>
                  <p className="text-slate-600 leading-relaxed text-xs sm:text-sm font-light">
                    Pada awal berdirinya, sekolah ini beroperasi dengan menumpang di bangunan sekolah dasar terdekat sebelum akhirnya memiliki gedung mandiri yang megah pada tahun 2009.
                  </p>
                  <p className="text-slate-600 leading-relaxed text-xs sm:text-sm font-light">
                    Kini, SMPN 3 Cihampelas telah berkembang menjadi salah satu institusi pendidikan pionir di Kabupaten Bandung Barat yang memadukan karakter lokal dengan ekosistem digital modern.
                  </p>
                </div>
              )}

              {/* Akreditasi Content */}
              {activeTab === 'akreditasi' && (
                <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col items-center justify-center text-center py-4">
                  <div className="w-24 h-24 border border-indigo-300 bg-indigo-50 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/10 mb-6 relative">
                    <div className="absolute inset-1.5 border border-indigo-200 rounded-full" />
                    <span className="text-5xl font-light text-indigo-600 drop-shadow-sm">B</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2 tracking-wide uppercase">
                    Terakreditasi "B" (Baik)
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-md mx-auto mb-6 font-light">
                    Diakui secara resmi oleh Badan Akreditasi Nasional Sekolah/Madrasah (BAN-S/M) dengan peringkat Akreditasi B (Baik), membuktikan konsistensi standar mutu pendidikan dan tata kelola berdaya saing.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2.5">
                    <span className="px-3.5 py-1.5 border border-indigo-200 bg-indigo-50 rounded-full text-indigo-700 text-[11px] font-medium uppercase tracking-wider">
                      Kurikulum Merdeka
                    </span>
                    <span className="px-3.5 py-1.5 border border-indigo-200 bg-indigo-50 rounded-full text-indigo-700 text-[11px] font-medium uppercase tracking-wider">
                      Sekolah Penggerak
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Statistics Grid */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="rounded-[2.2rem] bg-[#f8fafc] border border-indigo-100/80 p-7 sm:p-10 h-full flex flex-col justify-between shadow-lg shadow-indigo-950/5 relative overflow-hidden group">
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 text-[10px] font-semibold text-indigo-600 tracking-[0.2em] uppercase mb-8">
                  <span className="w-6 h-[1.5px] bg-indigo-500" />
                  Data Pokok Pendidikan
                </div>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-10">
                  {/* Stat 1 */}
                  <div>
                    <div className="text-4xl sm:text-5xl font-light text-slate-900 tracking-tight mb-1">
                      {dataPokok.siswa}
                    </div>
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                      Siswa Aktif
                    </div>
                  </div>
                  
                  {/* Stat 2 */}
                  <div>
                    <div className="text-4xl sm:text-5xl font-light text-slate-900 tracking-tight mb-1">
                      {dataPokok.rombel}
                    </div>
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                      Rombongan Belajar
                    </div>
                  </div>
                  
                  {/* Stat 3 */}
                  <div>
                    <div className="text-4xl sm:text-5xl font-light text-slate-900 tracking-tight mb-1">
                      {dataPokok.guru}
                    </div>
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                      Guru &amp; Pendidik
                    </div>
                  </div>
                  
                  {/* Stat 4 */}
                  <div>
                    <div className="text-4xl sm:text-5xl font-light text-slate-900 tracking-tight mb-1">
                      {dataPokok.staf}
                    </div>
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                      Staf Akademik
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-10 pt-6 border-t border-indigo-100 relative z-10">
                <p className="text-xs text-slate-500 leading-relaxed font-light">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-[fadeIn_0.2s_ease-out] select-text"
          onClick={() => setIsTeacherModalOpen(false)}
        >
          <div 
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="w-full max-w-5xl h-[88vh] max-h-[820px] bg-white border border-indigo-100 rounded-[2rem] shadow-2xl shadow-indigo-950/30 flex flex-col overflow-hidden text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-indigo-100 flex items-center justify-between bg-indigo-50/40 flex-shrink-0">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-100/80 border border-indigo-200 text-indigo-700 text-[10px] uppercase font-mono tracking-wider mb-1.5 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  Direktori Resmi GTK
                </div>
                <h3 className="text-xl sm:text-2xl font-light text-slate-900 tracking-tight">
                  Dewan Guru &amp; Tenaga Pendidik <span className="font-semibold text-indigo-600">SMPN 3 Cihampelas</span>
                </h3>
              </div>
              <button 
                onClick={() => setIsTeacherModalOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 sm:p-6 border-b border-indigo-100 bg-slate-50/70 space-y-3 flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Cari nama guru, gelar, atau mata pelajaran yang diampu..."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-indigo-200/80 focus:border-indigo-600 focus:outline-none text-slate-800 text-xs sm:text-sm placeholder-slate-400 transition-colors shadow-sm"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
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
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-semibold'
                        : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
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
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 [scrollbar-width:thin] [scrollbar-color:rgba(99,102,241,0.5)_rgba(0,0,0,0.04)] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-indigo-400 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-indigo-600"
            >
              {filteredTeachers.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">
                  Tidak ditemukan tenaga pendidik dengan kata kunci "{searchQuery}".
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredTeachers.map((teacher) => (
                    <div 
                      key={teacher.id}
                      className="p-4 rounded-2xl bg-[#f8fafc] hover:bg-white border border-indigo-100 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 transition-all flex flex-col justify-between group shadow-sm"
                    >
                      <div className="flex items-start gap-3.5 mb-3">
                        <img 
                          src={teacher.photo || '/teachers/default_avatar.svg'} 
                          alt={teacher.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-indigo-100 group-hover:border-indigo-300 shadow-md flex-shrink-0 transition-transform group-hover:scale-105 bg-white" 
                        />
                        <div className="flex-1 min-w-0">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-medium tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700 mb-1">
                            {teacher.subject}
                          </span>
                          <h4 className="text-slate-900 text-xs sm:text-sm font-semibold tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                            {teacher.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                            {teacher.nip && teacher.nip !== '-' ? `NIP: ${teacher.nip}` : `Status: ${teacher.status}`}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium">
                          {teacher.status}
                        </span>
                        {teacher.active !== false ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif Mengajar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
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
            <div className="p-4 px-6 border-t border-indigo-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span>Menampilkan <strong>{filteredTeachers.length}</strong> dari <strong>{teachers.length}</strong> Dewan Guru &amp; Tenaga Kependidikan</span>
                </div>
                <span className="text-[11px] text-slate-400 italic hidden sm:inline">↕ Gulir untuk melihat pendidik lainnya</span>
              </div>
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer shadow-sm"
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
