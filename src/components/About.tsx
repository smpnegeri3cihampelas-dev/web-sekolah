'use client';

import { useState, useEffect } from 'react';
import { useLenis } from 'lenis/react';
import { useSchoolData, isTendikOrTu } from '@/lib/schoolData';
import { useSettingsData } from '@/lib/settingsData';

export default function About() {
  const lenis = useLenis();
  const { leaders, teachers, dataPokok } = useSchoolData();
  const { identity } = useSettingsData();

  // Extract grade letter (A, B, C, etc.) from identity.akreditasi
  const akreditasiGrade = identity.akreditasi 
    ? (identity.akreditasi.match(/\b([A-C])\b/i)?.[1]?.toUpperCase() || identity.akreditasi.trim().charAt(0).toUpperCase() || 'B')
    : 'B';
  const akreditasiTitle = identity.akreditasi 
    ? (identity.akreditasi.toLowerCase().startsWith('terakreditasi') ? identity.akreditasi : `Terakreditasi "${identity.akreditasi}"`)
    : 'Terakreditasi "B" (Baik)';

  const [activeTab, setActiveTab] = useState<'visi' | 'sejarah' | 'akreditasi' | 'pimpinan'>('visi');
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isOrgChartModalOpen, setIsOrgChartModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const categories = ['Semua', 'Pimpinan', 'MIPA', 'Bahasa', 'Teknologi', 'Sosial & Agama', 'Olahraga & Seni', 'Tata Usaha (TU)'];

  const headmaster = leaders.find(l => l.role.toLowerCase().includes('kepala')) || leaders[0];
  const vicePrincipals = leaders.filter(l => l.id !== headmaster?.id);

  // Manage Lenis and page scroll cleanly when modal is opened/closed
  useEffect(() => {
    if (isTeacherModalOpen || isOrgChartModalOpen) {
      lenis?.stop();
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
        lenis?.start();
      };
    }
  }, [isTeacherModalOpen, isOrgChartModalOpen, lenis]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isOrgChartModalOpen) setIsOrgChartModalOpen(false);
        else if (isTeacherModalOpen) setIsTeacherModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTeacherModalOpen, isOrgChartModalOpen]);

  const activeTeachers = teachers.filter(t => t.active !== false);
  const tuStaffList = activeTeachers.filter(t => isTendikOrTu(t));
  const guruPendidikList = activeTeachers.filter(t => !isTendikOrTu(t));
  const bkTeachers = guruPendidikList.filter(t =>
    t.subject.toLowerCase().includes('konseling') ||
    (t.role || '').toLowerCase().includes('konseling') ||
    /\bbk\b/i.test(t.subject)
  );
  const labTeachers = guruPendidikList.filter(t =>
    /\blab\b|laboratorium/i.test(t.role || '')
  );
  const libraryTeachers = guruPendidikList.filter(t =>
    /perpustakaan|perpus/i.test(t.role || '')
  );
  const kesiswaanPembinaTeachers = guruPendidikList.filter(t => {
    const r = (t.role || '').toLowerCase();
    if (!r) return false;
    if (r.includes('pembina') || r.includes('ekstrakurikuler') || r.includes('wali kelas')) return true;
    // Tugas tambahan khusus lainnya yang bukan sekadar "Guru ...", bukan PKS/Kepala Sekolah, dan belum masuk Lab/Perpus/BK
    const isStandardGuruOnly = r.startsWith('guru ') || r === t.subject.toLowerCase();
    const isTopLeader = r.includes('kepala sekolah') || r.includes('pks');
    const isAlreadyGrouped = /\blab\b|laboratorium|perpustakaan|perpus|konseling|\bbk\b/i.test(r);
    return !isStandardGuruOnly && !isTopLeader && !isAlreadyGrouped;
  });

  const getPersonPhoto = (photo?: string, fallbackName?: string) => {
    if (photo && photo !== '/teachers/default_avatar.svg') return photo;
    if (fallbackName) {
      const matchedTeacher = teachers.find(t => t.name.toLowerCase() === fallbackName.toLowerCase());
      if (matchedTeacher?.photo && matchedTeacher.photo !== '/teachers/default_avatar.svg') {
        return matchedTeacher.photo;
      }
    }
    return photo || '/teachers/default_avatar.svg';
  };

  const filteredTeachers = activeTeachers.filter(teacher => {
    const matchSearch = teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        teacher.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (teacher.role && teacher.role.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCategory = selectedCategory === 'Semua' || 
                          teacher.category === selectedCategory ||
                          (selectedCategory === 'Tata Usaha (TU)' && isTendikOrTu(teacher)) ||
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
            Mengenal Lebih Dekat <span className="font-semibold text-indigo-900">{identity.schoolName || 'SMPN 3 Cihampelas'}</span>
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
                        src={getPersonPhoto(headmaster.photo, headmaster.name)} 
                        alt={headmaster.name} 
                        onError={(e) => { e.currentTarget.src = '/teachers/default_avatar.svg'; }}
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
                          src={getPersonPhoto(vp.photo, vp.name)} 
                          alt={vp.name} 
                          onError={(e) => { e.currentTarget.src = '/teachers/default_avatar.svg'; }}
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

                  {/* Tombol Struktur Organisasi & Lihat Seluruh Dewan Guru */}
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setIsOrgChartModalOpen(true)}
                      className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-indigo-950 text-white text-xs font-medium flex items-center justify-center gap-2 transition-all group shadow-md shadow-slate-900/15 cursor-pointer"
                    >
                      <span>🏛️ Bagan Struktur Organisasi</span>
                      <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-[11px] group-hover:translate-x-0.5 transition-transform">
                        ↗
                      </span>
                    </button>
                    <button
                      onClick={() => setIsTeacherModalOpen(true)}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center justify-center gap-2 transition-all group shadow-md shadow-indigo-600/25 cursor-pointer"
                    >
                      <span>👥 Direktori Lengkap ({activeTeachers.length} GTK)</span>
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
                    <span className="text-5xl font-light text-indigo-600 drop-shadow-sm">{akreditasiGrade}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2 tracking-wide uppercase">
                    {akreditasiTitle}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-md mx-auto mb-6 font-light">
                    Diakui secara resmi oleh Badan Akreditasi Nasional Sekolah/Madrasah (BAN-S/M) dengan peringkat {identity.akreditasi || 'Akreditasi B (Baik)'}, membuktikan konsistensi standar mutu pendidikan dan tata kelola berdaya saing.
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
                  Dewan Guru &amp; Tenaga Pendidik <span className="font-semibold text-indigo-600">{identity.schoolName || 'SMPN 3 Cihampelas'}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsTeacherModalOpen(false);
                    setIsOrgChartModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors cursor-pointer shadow-sm hidden sm:inline-flex items-center gap-1.5"
                >
                  <span>🏛️</span>
                  <span>Bagan Struktur</span>
                </button>
                <button 
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer text-lg font-bold"
                >
                  ✕
                </button>
              </div>
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
                          onError={(e) => { e.currentTarget.src = '/teachers/default_avatar.svg'; }}
                          className="w-14 h-14 rounded-2xl object-cover border border-indigo-100 group-hover:border-indigo-300 shadow-md flex-shrink-0 transition-transform group-hover:scale-105 bg-white" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap mb-1">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-medium tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700">
                              {teacher.subject}
                            </span>
                            {teacher.role &&
                              teacher.role.toLowerCase() !== teacher.subject.toLowerCase() &&
                              !teacher.role.toLowerCase().startsWith('guru ') &&
                              !isTendikOrTu(teacher) && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wider bg-amber-50 border border-amber-200 text-amber-800">
                                  {teacher.role.split('/')[0].trim()}
                                </span>
                              )}
                          </div>
                          <h4 className="text-slate-900 text-xs sm:text-sm font-semibold tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                            {teacher.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                            {teacher.nip && teacher.nip !== '-'
                              ? `NIP: ${teacher.nip}`
                              : teacher.nuptk
                              ? `NUPTK: ${teacher.nuptk}`
                              : `Status: ${teacher.status}`}
                          </p>
                          {teacher.nip && teacher.nip !== '-' && teacher.nuptk && (
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              NUPTK: {teacher.nuptk}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium">
                          {teacher.status}
                        </span>
                        {teacher.active !== false ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {isTendikOrTu(teacher) ? 'Aktif Bertugas' : 'Aktif Mengajar'}
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

      {/* Modal Bagan Struktur Organisasi Sekolah */}
      {isOrgChartModalOpen && (
        <div
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-[fadeIn_0.2s_ease-out] select-text"
          onClick={() => setIsOrgChartModalOpen(false)}
        >
          <div
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="w-full max-w-6xl h-[90vh] max-h-[860px] bg-white border border-indigo-100 rounded-[2rem] shadow-2xl shadow-indigo-950/30 flex flex-col overflow-hidden text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal Struktur Organisasi */}
            <div className="p-4 sm:p-6 border-b border-indigo-100 flex items-center justify-between bg-indigo-50/50 flex-shrink-0 gap-3">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] uppercase font-mono tracking-wider mb-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  Hierarki Tata Kelola &amp; Kepemimpinan
                </div>
                <h3 className="text-lg sm:text-2xl font-light text-slate-900 tracking-tight">
                  Bagan Struktur Organisasi <span className="font-semibold text-indigo-700">{identity.schoolName || 'SMP Negeri 3 Cihampelas'}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsOrgChartModalOpen(false);
                    setIsTeacherModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium transition-colors cursor-pointer shadow-xs hidden sm:inline-flex items-center gap-1.5"
                >
                  <span>👥</span>
                  <span>Direktori {activeTeachers.length} GTK</span>
                </button>
                <button
                  onClick={() => setIsOrgChartModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer text-lg font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Konten Bagan Hierarki - Scrollable */}
            <div
              data-lenis-prevent="true"
              data-lenis-prevent-wheel="true"
              data-lenis-prevent-touch="true"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-8 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/80 space-y-6 [scrollbar-width:thin] [scrollbar-color:rgba(99,102,241,0.5)_rgba(0,0,0,0.04)]"
            >
              {/* LEVEL 1: KEPALA SEKOLAH & KOMITE SEKOLAH */}
              <div className="flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 text-indigo-200 text-[10px] font-mono uppercase tracking-widest mb-3 shadow-sm">
                  <span>Level 1 • Pimpinan Tertinggi Satuan Pendidikan</span>
                </div>

                {headmaster && (
                  <div className="w-full max-w-md p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white border-2 border-indigo-400/40 shadow-xl shadow-indigo-950/15 flex items-center gap-4 relative">
                    <img
                      src={getPersonPhoto(headmaster.photo, headmaster.name)}
                      alt={headmaster.name}
                      onError={(e) => { e.currentTarget.src = '/teachers/default_avatar.svg'; }}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-300/60 shadow-lg bg-slate-800 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-400/20 text-cyan-200 border border-cyan-400/40">
                          {headmaster.role}
                        </span>
                        {headmaster.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-white/10 text-indigo-100">
                            {headmaster.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                        {headmaster.name}
                      </h4>
                      <p className="text-[11px] font-mono text-indigo-200 mt-0.5">
                        NIP: {headmaster.nip}
                      </p>
                      <p className="text-[10px] text-emerald-300 font-medium mt-0.5">
                        ● {headmaster.status}
                      </p>
                    </div>
                  </div>
                )}

                {/* Garis Vertikal Turun dari Kepala Sekolah */}
                <div className="w-0.5 h-6 bg-indigo-300" />
              </div>

              {/* LEVEL 2: GARIS KOORDINASI TATA USAHA (TU) & BIMBINGAN KONSELING (BK) */}
              <div className="relative">
                <div className="flex flex-col items-center mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-800 text-[10px] font-mono uppercase tracking-wider font-semibold">
                    <span>Level 2 • Unsur Pelaksana Administrasi (TU) &amp; Layanan Konseling (BK)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Box Kiri: Tata Usaha & Layanan Operasional */}
                  <div className="lg:col-span-8 p-4 sm:p-5 rounded-2xl bg-purple-50/50 border-2 border-purple-200/80 shadow-xs">
                    <div className="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-purple-200/70 flex-wrap">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-purple-700 font-bold block">
                          Garis Koordinasi Ketatausahaan &amp; Operasional
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900">
                          Staf Tata Usaha (TU) &amp; Caraka ({tuStaffList.length} Personel)
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white border border-purple-200 text-purple-800">
                        Tenaga Kependidikan
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {tuStaffList.map((staf) => (
                        <div
                          key={staf.id}
                          className="p-2.5 rounded-xl bg-white border border-purple-200/80 hover:border-purple-400 transition-all flex items-center gap-2.5 shadow-2xs"
                        >
                          <img
                            src={staf.photo || '/teachers/default_avatar.svg'}
                            alt={staf.name}
                            onError={(e) => { e.currentTarget.src = '/teachers/default_avatar.svg'; }}
                            className="w-11 h-11 rounded-xl object-cover border border-purple-200 bg-slate-100 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 mb-0.5 truncate max-w-full">
                              {staf.role || staf.subject}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 truncate">{staf.name}</h5>
                            <p className="text-[10px] font-mono text-slate-500 truncate">
                              {staf.nip && staf.nip !== '-' ? `NIP: ${staf.nip}` : staf.nuptk ? `NUPTK: ${staf.nuptk}` : staf.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Box Kanan: Bimbingan & Konseling (BK) */}
                  <div className="lg:col-span-4 p-4 sm:p-5 rounded-2xl bg-sky-50/50 border-2 border-sky-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-sky-200/70">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-sky-700 font-bold block">
                            Garis Koordinasi Konseling Siswa
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900">
                            Bimbingan &amp; Konseling (BK)
                          </h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white border border-sky-200 text-sky-800">
                          Layanan BK
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {bkTeachers.length > 0 ? (
                          bkTeachers.map((bk) => (
                            <div
                              key={bk.id}
                              className="p-3 rounded-xl bg-white border border-sky-200/90 flex items-center gap-3 shadow-2xs"
                            >
                              <img
                                src={bk.photo || '/teachers/default_avatar.svg'}
                                alt={bk.name}
                                onError={(e) => { e.currentTarget.src = '/teachers/default_avatar.svg'; }}
                                className="w-12 h-12 rounded-xl object-cover border border-sky-200 bg-slate-100 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 mb-0.5">
                                  Koordinator BK
                                </span>
                                <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{bk.name}</h5>
                                <p className="text-[10px] font-mono text-slate-500 truncate">
                                  {bk.nip && bk.nip !== '-' ? `NIP: ${bk.nip}` : bk.status}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 rounded-xl bg-white border border-sky-200 text-xs text-slate-500">
                            Guru Bimbingan &amp; Konseling
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-sky-200/60">
                      Berkoordinasi langsung dengan Kepala Sekolah, PKS Kesiswaan, dan Wali Kelas dalam pembinaan karakter siswa.
                    </p>
                  </div>
                </div>

                {/* Garis Vertikal Turun ke Level 3 */}
                <div className="flex justify-center">
                  <div className="w-0.5 h-6 bg-indigo-300 mt-4" />
                </div>
              </div>

              {/* LEVEL 3: 4 PEMBANTU KEPALA SEKOLAH (WAKASEK / PKS) */}
              <div>
                <div className="flex flex-col items-center mb-3.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 text-[10px] font-mono uppercase tracking-wider font-semibold">
                    <span>Level 3 • Jajaran Pembantu Kepala Sekolah (Wakasek / PKS)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {vicePrincipals.map((vp) => (
                    <div
                      key={vp.id}
                      className="p-4 rounded-2xl bg-white border-2 border-indigo-200/90 hover:border-indigo-400 transition-all shadow-sm flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={getPersonPhoto(vp.photo, vp.name)}
                          alt={vp.name}
                          onError={(e) => { e.currentTarget.src = '/teachers/default_avatar.svg'; }}
                          className="w-13 h-13 rounded-xl object-cover border border-indigo-200 bg-slate-100 shrink-0 shadow-xs"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1">
                            {vp.role}
                          </span>
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {vp.name}
                          </h5>
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                            {vp.nip}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-600 font-medium truncate">
                          {vp.badge || 'Bidang Manajemen'}
                        </span>
                        <span className="text-emerald-600 font-semibold shrink-0">● Aktif</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Garis Vertikal Turun ke Level 4 */}
                <div className="flex justify-center">
                  <div className="w-0.5 h-6 bg-indigo-300 mt-4" />
                </div>
              </div>

              {/* LEVEL 4: KEPALA UNIT TEKNIS (LAB IPA, PERPUSTAKAAN) & PEMBINA KESISWAAN */}
              <div>
                <div className="flex flex-col items-center mb-3.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-mono uppercase tracking-wider font-semibold">
                    <span>Level 4 • Unit Pelaksana Teknis, Laboratorium, Perpustakaan &amp; Pembina Kesiswaan</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Sub-Unit 1: Laboratorium IPA */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border-2 border-emerald-200/80 shadow-xs">
                    <div className="pb-2.5 mb-3 border-b border-emerald-200/70 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold block">
                          Unit Sarana Akademik
                        </span>
                        <h5 className="text-sm font-bold text-slate-900">Laboratorium IPA</h5>
                      </div>
                      <span className="text-base">🔬</span>
                    </div>
                    <div className="space-y-2.5">
                      {labTeachers.map((t) => (
                        <div key={t.id} className="p-2.5 rounded-xl bg-white border border-emerald-200/80 flex items-center gap-2.5 shadow-2xs">
                          <img
                            src={t.photo || '/teachers/default_avatar.svg'}
                            alt={t.name}
                            onError={(e) => { e.currentTarget.src = '/teachers/default_avatar.svg'; }}
                            className="w-11 h-11 rounded-xl object-cover border border-emerald-200 bg-slate-100 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-0.5">
                              {(t.role || 'Pengelola Lab').split('/')[0].trim()}
                            </span>
                            <h6 className="text-xs font-bold text-slate-900 truncate">{t.name}</h6>
                            <p className="text-[10px] text-slate-500 truncate">{t.subject}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-Unit 2: Perpustakaan Sekolah */}
                  <div className="p-4 rounded-2xl bg-amber-50/50 border-2 border-amber-200/80 shadow-xs">
                    <div className="pb-2.5 mb-3 border-b border-amber-200/70 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-amber-800 font-bold block">
                          Unit Literasi &amp; Pustaka
                        </span>
                        <h5 className="text-sm font-bold text-slate-900">Perpustakaan Sekolah</h5>
                      </div>
                      <span className="text-base">📚</span>
                    </div>
                    <div className="space-y-2.5">
                      {libraryTeachers.map((t) => (
                        <div key={t.id} className="p-2.5 rounded-xl bg-white border border-amber-200/80 flex items-center gap-2.5 shadow-2xs">
                          <img
                            src={t.photo || '/teachers/default_avatar.svg'}
                            alt={t.name}
                            onError={(e) => { e.currentTarget.src = '/teachers/default_avatar.svg'; }}
                            className="w-11 h-11 rounded-xl object-cover border border-amber-200 bg-slate-100 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-0.5">
                              {t.role?.toLowerCase().includes('ka.') || t.role?.toLowerCase().includes('kepala')
                                ? 'Kepala Perpustakaan'
                                : (t.role || 'Staf Perpustakaan').split('/')[0].trim()}
                            </span>
                            <h6 className="text-xs font-bold text-slate-900 truncate">{t.name}</h6>
                            <p className="text-[10px] text-slate-500 truncate">{t.subject}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-Unit 3: Pembina Organisasi & Ekstrakurikuler Siswa */}
                  <div className="p-4 rounded-2xl bg-rose-50/50 border-2 border-rose-200/80 shadow-xs">
                    <div className="pb-2.5 mb-3 border-b border-rose-200/70 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-rose-700 font-bold block">
                          Unit Pembinaan Karakter
                        </span>
                        <h5 className="text-sm font-bold text-slate-900">Pembina Kesiswaan &amp; OSIS</h5>
                      </div>
                      <span className="text-base">🏅</span>
                    </div>
                    <div className="space-y-2.5">
                      {kesiswaanPembinaTeachers.map((t) => (
                        <div key={t.id} className="p-2.5 rounded-xl bg-white border border-rose-200/80 flex items-center gap-2.5 shadow-2xs">
                          <img
                            src={t.photo || '/teachers/default_avatar.svg'}
                            alt={t.name}
                            onError={(e) => { e.currentTarget.src = '/teachers/default_avatar.svg'; }}
                            className="w-11 h-11 rounded-xl object-cover border border-rose-200 bg-slate-100 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-800 border border-rose-200 mb-0.5">
                              {(t.role || 'Pembina').split('/')[0].trim()}
                            </span>
                            <h6 className="text-xs font-bold text-slate-900 truncate">{t.name}</h6>
                            <p className="text-[10px] text-slate-500 truncate">{t.subject}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Garis Vertikal Turun ke Level 5 */}
                <div className="flex justify-center">
                  <div className="w-0.5 h-6 bg-indigo-300 mt-4" />
                </div>
              </div>

              {/* LEVEL 5: WALI KELAS, DEWAN GURU MATA PELAJARAN & PESERTA DIDIK */}
              <div className="flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 border border-slate-300 text-slate-800 text-[10px] font-mono uppercase tracking-wider font-semibold mb-3.5">
                  <span>Level 5 • Lini Akademik Rombongan Belajar &amp; Peserta Didik</span>
                </div>

                <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white border-2 border-indigo-200 shadow-xs flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-indigo-600 font-bold block">
                        Pendidik Akademik &amp; Pembina Rombel
                      </span>
                      <h5 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                        Wali Kelas ({dataPokok.rombel} Rombel) &amp; {guruPendidikList.length} Guru Mapel
                      </h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kelas 7-A s/d 9-E • Kurikulum Merdeka
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsOrgChartModalOpen(false);
                        setIsTeacherModalOpen(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold cursor-pointer shrink-0 transition-colors"
                    >
                      Lihat Guru →
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-950 text-white border-2 border-indigo-800 shadow-xs flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-cyan-300 font-bold block">
                        Subjek Utama Pendidikan
                      </span>
                      <h5 className="text-sm sm:text-base font-bold text-white mt-0.5">
                        Seluruh Peserta Didik ({dataPokok.siswa} Siswa Aktif)
                      </h5>
                      <p className="text-xs text-indigo-200 mt-0.5">
                        Generasi RIGAS (Religius, Inovatif, Gesit, Aktif, Santun)
                      </p>
                    </div>
                    <span className="text-2xl">🎓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal Struktur Organisasi */}
            <div className="p-4 px-6 border-t border-indigo-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>
                  Bagan ini tersinkronisasi otomatis dengan data <strong>Pimpinan &amp; GTK</strong> di Dashboard Admin (termasuk foto profil &amp; jabatan).
                </span>
              </div>
              <button
                onClick={() => setIsOrgChartModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer shadow-sm"
              >
                Tutup Bagan
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
