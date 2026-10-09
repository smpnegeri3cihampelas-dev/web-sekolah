'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useWartaData, WartaItem } from '@/lib/wartaData';

const ITEMS_PER_PAGE = 6;

export default function WartaPage() {
  const { wartaList } = useWartaData();
  const [selectedCategory, setSelectedCategory] = useState('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'terbaru' | 'populer' | 'terlama'>('terbaru');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState<WartaItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Ambil warta yang berstatus "Published"
  const publishedList = useMemo(() => {
    const list = wartaList.filter(item => item.status === 'Published');
    return list.length > 0 ? list : wartaList;
  }, [wartaList]);

  // Filter berdasarkan kategori dan pencarian
  const filteredList = useMemo(() => {
    let result = publishedList;

    // Filter Kategori
    if (selectedCategory !== 'SEMUA') {
      result = result.filter(
        item => item.category.toUpperCase() === selectedCategory.toUpperCase()
      );
    }

    // Filter Search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.title.toLowerCase().includes(q) ||
          (item.excerpt && item.excerpt.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q))
      );
    }

    // Urutkan (Sorting)
    return [...result].sort((a, b) => {
      if (sortBy === 'populer') {
        const parseViews = (v?: string) => {
          if (!v) return 0;
          if (typeof v === 'number') return v;
          if (typeof v === 'string') {
            if (v.toLowerCase().endsWith('k')) {
              return parseFloat(v) * 1000;
            }
            return parseFloat(v) || 0;
          }
          return 0;
        };
        return parseViews(b.views) - parseViews(a.views);
      }
      if (sortBy === 'terlama') {
        return Number(a.id) - Number(b.id);
      }
      // default: terbaru
      return Number(b.id) - Number(a.id);
    });
  }, [publishedList, selectedCategory, searchQuery, sortBy]);

  // Hitung jumlah halaman (Pagination agar tidak lag)
  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));

  // Reset ke halaman 1 jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy]);

  // Potong item sesuai halaman aktif
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleCopyLink = (article: WartaItem) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/warta?id=${article.id}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const categories = ['SEMUA', 'PRESTASI', 'PENGUMUMAN', 'KEGIATAN', 'AKADEMIK', 'INOVASI'];

  return (
    <div className="min-h-screen bg-[#070919] text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* ============================================================== */}
      {/* TOP NAVBAR                                                     */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 w-full bg-[#080b20]/90 backdrop-blur-xl border-b border-indigo-950/70 px-4 sm:px-8 py-3.5 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <Image 
                src="/logo.png" 
                alt="Logo SMP Negeri 3 Cihampelas" 
                width={40} 
                height={40} 
                className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2 group-hover:text-indigo-300 transition-colors">
                SMPN 3 Cihampelas
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#6366f1]" />
              </span>
              <span className="text-[10px] font-mono text-indigo-300/80 uppercase tracking-widest hidden sm:inline">
                Pusat Warta &amp; Publikasi Resmi
              </span>
            </div>
          </Link>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            >
              <span>←</span>
              <span>Kembali ke Beranda</span>
            </Link>

            <Link 
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>⚙️</span>
              <span>Portal Admin</span>
            </Link>
          </div>

        </div>
      </header>

      {/* ============================================================== */}
      {/* HERO BANNER SECTION                                            */}
      {/* ============================================================== */}
      <section className="relative w-full py-16 sm:py-20 px-4 sm:px-8 overflow-hidden bg-gradient-to-b from-[#0b0e2b] via-[#070919] to-[#070919] border-b border-indigo-950/50">
        {/* Glow ambient effects */}
        <div className="absolute top-0 left-1/3 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-[500px] h-[300px] bg-purple-600/15 rounded-full blur-[130px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto text-center flex flex-col items-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8] animate-pulse" />
            <span>Kumpulan Warta &amp; Publikasi Resmi</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl mb-4">
            Informasi Terpadu <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200">&amp; Warta Sekolah</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-light leading-relaxed mb-8">
            Dapatkan berita terkini seputar agenda akademik, prestasi siswa, kegiatan kesiswaan, dan perkembangan SMP Negeri 3 Cihampelas secara lengkap dan transparan.
          </p>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-300 font-mono">
            <div className="px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center gap-2">
              <span className="text-indigo-400 font-bold text-sm">{publishedList.length}</span>
              <span>Warta Terpublikasi</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center gap-2">
              <span className="text-emerald-400 font-bold text-sm">6 Kategori</span>
              <span>Informasi Terpadu</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center gap-2">
              <span className="text-sky-400 font-bold text-sm">Real-time</span>
              <span>Sinkronisasi Dashboard</span>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* FILTER, SEARCH, & PAGINATION CONTROLS                          */}
      {/* ============================================================== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-10">
        
        {/* Search & Filter Bar */}
        <div className="bg-[#0b0e2b]/80 border border-indigo-900/40 rounded-3xl p-4 sm:p-6 mb-8 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input 
              type="text"
              placeholder="Cari berita berdasarkan judul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-400 focus:bg-white/[0.1] transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                title="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="terbaru" className="bg-[#0b0e2b] text-white">Terbaru Diterbitkan</option>
              <option value="populer" className="bg-[#0b0e2b] text-white">Paling Populer (Views)</option>
              <option value="terlama" className="bg-[#0b0e2b] text-white">Terlama</option>
            </select>
          </div>

        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            const count = cat === 'SEMUA' 
              ? publishedList.length 
              : publishedList.filter(item => item.category.toUpperCase() === cat.toUpperCase()).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <span>{cat}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Counter Info Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-6 px-1">
          <span>
            Menampilkan <strong className="text-white">{currentItems.length}</strong> dari total <strong className="text-white">{filteredList.length}</strong> warta
            {selectedCategory !== 'SEMUA' && <span> pada kategori <strong className="text-indigo-400">{selectedCategory}</strong></span>}
          </span>
          <span>
            Halaman <strong className="text-indigo-300">{currentPage}</strong> dari <strong className="text-slate-300">{totalPages}</strong>
          </span>
        </div>

        {/* ============================================================== */}
        {/* GRID DAFTAR WARTA (PAGINATED - RINGAN & TIDAK LAG)             */}
        {/* ============================================================== */}
        {currentItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {currentItems.map((article) => (
              <article 
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="rounded-3xl bg-[#0b0e2b]/90 border border-indigo-900/40 hover:border-indigo-400/60 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-indigo-950/50 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Photo Container */}
                  <div className="relative w-full h-52 overflow-hidden bg-slate-900">
                    <img 
                      src={article.src || '/slide4.jpeg'} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/slide4.jpeg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e2b] via-transparent to-transparent pointer-events-none" />
                    
                    {/* Category badge */}
                    <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-md">
                      {article.category}
                    </div>

                    {/* Views badge */}
                    <div className="absolute bottom-3 right-3.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-slate-300 font-mono flex items-center gap-1">
                      <span>👁️</span>
                      <span>{article.views || 120}x</span>
                    </div>
                  </div>

                  {/* Body Text */}
                  <div className="p-6">
                    <div className="text-[11px] font-mono text-indigo-300/80 mb-2 flex items-center gap-2">
                      <span>📅 {article.date}</span>
                      <span>•</span>
                      <span className="text-slate-400">Humas SMPN 3</span>
                    </div>

                    <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug mb-2.5">
                      {article.title}
                    </h2>

                    <p className="text-xs text-slate-300 font-light line-clamp-3 leading-relaxed">
                      {article.excerpt || 'Klik kartu untuk membaca dokumentasi dan rilis selengkapnya.'}
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-6 pb-6 pt-0">
                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                    <span>Baca Selengkapnya</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-3xl bg-[#0b0e2b]/50 border border-white/10 p-12 text-center my-8">
            <span className="text-4xl block mb-3">📰</span>
            <h3 className="text-lg font-bold text-white mb-1">Tidak ada warta yang ditemukan</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
              {searchQuery 
                ? `Tidak ditemukan warta yang cocok dengan kata kunci "${searchQuery}". Silakan coba kata kunci lain.`
                : `Belum ada warta yang tersedia pada kategori "${selectedCategory}".`
              }
            </p>
            {(searchQuery || selectedCategory !== 'SEMUA') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('SEMUA');
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* NUMBERED PAGINATION (HALAMAN 1, 2, 3 DST - ANTI LAG)           */}
        {/* ============================================================== */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-white/10 mt-6">
            
            <div className="text-xs text-slate-400">
              Menampilkan Halaman <strong className="text-white">{currentPage}</strong> dari total <strong className="text-white">{totalPages}</strong> Halaman
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              
              {/* Tombol Sebelumnya */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  currentPage === 1
                    ? 'opacity-40 cursor-not-allowed bg-white/5 text-slate-500'
                    : 'bg-white/10 text-white hover:bg-indigo-600'
                }`}
              >
                <span>←</span>
                <span>Sebelumnya</span>
              </button>

              {/* Angka Halaman (1, 2, 3, dst) */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`min-w-[38px] h-[38px] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-2 ring-indigo-400'
                        : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.15] hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Tombol Selanjutnya */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  currentPage === totalPages
                    ? 'opacity-40 cursor-not-allowed bg-white/5 text-slate-500'
                    : 'bg-white/10 text-white hover:bg-indigo-600'
                }`}
              >
                <span>Selanjutnya</span>
                <span>→</span>
              </button>

            </div>

          </div>
        )}

      </main>

      {/* ============================================================== */}
      {/* ARTICLE READER MODAL (FULL SCREEN DIALOG)                      */}
      {/* ============================================================== */}
      {selectedArticle && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setSelectedArticle(null)}
        >
          <div 
            className="w-full max-w-3xl rounded-3xl bg-[#0b0e2b] border border-indigo-800/60 overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Cover Image */}
            <div className="relative w-full h-64 sm:h-80 bg-slate-900 shrink-0">
              <img 
                src={selectedArticle.src || '/slide4.jpeg'} 
                alt={selectedArticle.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/slide4.jpeg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e2b] via-[#0b0e2b]/50 to-transparent" />
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white font-bold flex items-center justify-center cursor-pointer border border-white/20 transition-all z-20"
                title="Tutup"
              >
                ✕
              </button>

              <div className="absolute bottom-5 left-5 right-5 z-10">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                    {selectedArticle.category}
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    📅 {selectedArticle.date}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    • 👁️ {selectedArticle.views || 120} views
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-snug drop-shadow-md">
                  {selectedArticle.title}
                </h2>
              </div>
            </div>

            {/* Content Scrollable Area */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 text-sm text-slate-200 leading-relaxed font-normal">
              
              {/* Excerpt Box */}
              <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-700/40 text-indigo-200 font-semibold text-sm">
                {selectedArticle.excerpt || selectedArticle.title}
              </div>

              {/* Main Content */}
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedArticle.content || (
                  <>
                    Warta ini dirilis secara resmi oleh Humas SMP Negeri 3 Cihampelas sebagai sarana keterbukaan informasi publik bagi seluruh warga sekolah, orang tua siswa, dan masyarakat luas.
                    {'\n\n'}
                    SMP Negeri 3 Cihampelas terus berupaya meningkatkan mutu pendidikan, pembinaan karakter RIGAS, serta prestasi peserta didik baik di bidang akademik maupun non-akademik melalui kolaborasi aktif dan pemanfaatan teknologi digital terpadu.
                  </>
                )}
              </p>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="text-slate-400">
                  Diterbitkan oleh: <strong className="text-white">Humas SMPN 3 Cihampelas</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(selectedArticle)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🔗</span>
                    <span>{copiedLink ? 'Tautan Disalin!' : 'Salin Tautan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedArticle(null)}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FOOTER                                                         */}
      {/* ============================================================== */}
      <footer className="w-full border-t border-indigo-950/70 bg-[#050716] py-8 px-4 sm:px-8 text-xs text-slate-500 text-center font-light mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; {new Date().getFullYear()} SMP Negeri 3 Cihampelas. Pusat Warta &amp; Publikasi Digital.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
            <span>•</span>
            <Link href="/elearning" className="hover:text-white transition-colors">E-Learning</Link>
            <span>•</span>
            <Link href="/dashboard" className="hover:text-white transition-colors">Admin Dashboard</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
