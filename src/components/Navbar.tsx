'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const portalRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setPortalOpen(true);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setPortalOpen(false);
    }, 220); // Buffer delay 220ms agar kursor tidak gampang lepas
  };

  useEffect(() => {
    // Start strictly from completely invisible (kosong), then smoothly fade in
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 120);

    return () => {
      clearTimeout(timer);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Click outside listener to close portal dropdown automatically
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (portalRef.current && !portalRef.current.contains(event.target as Node)) {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        setPortalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const portalMenuItems = [
    {
      title: 'e-Rapor Kurikulum Merdeka',
      desc: 'Portal penilaian siswa khusus Dewan Guru',
      href: 'https://erapor.smpn3cihampelas.sch.id',
      isExternal: true,
      badgeColor: 'bg-indigo-50 border-indigo-200/80 text-indigo-700 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'E-Learning Siswa & Guru',
      desc: 'Presensi digital, bahan ajar, & CBT lab',
      href: '/elearning',
      isExternal: false,
      badgeColor: 'bg-violet-50 border-violet-200/80 text-violet-700 group-hover:bg-violet-600 group-hover:border-violet-600 group-hover:text-white',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 14l9-5-9-5-9 5 9 5z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14v7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Login Admin Website',
      desc: 'Kelola berita, pengumuman, & struktur organisasi',
      href: '/login',
      isExternal: false,
      badgeColor: 'bg-sky-50 border-sky-200/80 text-sky-700 group-hover:bg-sky-600 group-hover:border-sky-600 group-hover:text-white',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 lg:px-12 pt-4 sm:pt-8 pb-3 sm:pb-4 bg-transparent transition-all duration-1000 ease-out ${
        isLoaded 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Brand (Left) */}
        <div className="flex items-center justify-start shrink-0">
          <a href="#" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0">
              <Image 
                src="/logo.png" 
                alt="Logo SMP Negeri 3 Cihampelas" 
                width={40} 
                height={40} 
                className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-base font-semibold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                SMPN 3 Cihampelas
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#6366f1]" />
              </span>
            </div>
          </a>
        </div>

        {/* Center Floating Pill Menu (Clean Frosted Glass Pill - Desktop Only) */}
        <div className="hidden md:flex items-center justify-center">
          <nav 
            className="flex items-center gap-4 lg:gap-6 px-5 lg:px-6 py-2 rounded-full glass-pill-nav text-xs sm:text-sm font-medium text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] transition-all duration-300 whitespace-nowrap"
          >
            <a href="#" className="hover:text-indigo-200 transition-colors">
              Beranda
            </a>
            <a href="#profil" className="hover:text-indigo-200 transition-colors">
              Profil
            </a>
            <a href="#kurikulum" className="hover:text-indigo-200 transition-colors">
              Program
            </a>
            <a href="#fasilitas" className="hover:text-indigo-200 transition-colors">
              Fasilitas
            </a>
            <a href="/warta" className="hover:text-indigo-200 transition-colors">
              Warta
            </a>
            <a href="#kontak" className="hover:text-indigo-200 transition-colors">
              Kontak
            </a>
          </nav>
        </div>

        {/* Right Actions: Portal Dropdown + Mobile Menu Trigger */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
          
          {/* Dropdown Portal Button (Accessible on both Mobile & Desktop) */}
          <div 
            ref={portalRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button 
              type="button"
              onClick={() => {
                if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                setPortalOpen(!portalOpen);
                if (!portalOpen) setMobileMenuOpen(false);
              }}
              className={`px-3.5 sm:px-4 lg:px-5 py-1.5 sm:py-2 rounded-full glass-pill-btn text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 cursor-pointer text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] ${
                portalOpen 
                  ? 'bg-white/40 border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.25)]' 
                  : 'hover:bg-white/35'
              }`}
              aria-expanded={portalOpen}
              aria-haspopup="true"
            >
              <span>Portal</span>
              <svg 
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  portalOpen ? 'rotate-180 text-white' : 'text-white'
                }`}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Glassmorphism Luxury Dropdown Menu Container */}
            <div 
              className={`fixed inset-x-4 top-[76px] max-w-sm mx-auto sm:max-w-none sm:inset-auto sm:absolute sm:right-0 sm:top-full sm:pt-2 sm:w-[340px] z-50 transition-all duration-300 transform sm:origin-top-right ${
                portalOpen 
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              }`}
            >
              <div className="rounded-3xl sm:rounded-2xl bg-white/95 backdrop-blur-2xl border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.25)] p-3 sm:p-2.5 overflow-hidden relative">
                {/* Subtle top ambient glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-10 bg-indigo-100/60 rounded-full blur-xl pointer-events-none" />

                <div className="px-3 py-2 border-b border-indigo-100/80 mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-indigo-700">
                    Portal Sistem Terpadu
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-[0_0_8px_#6366f1]" />
                </div>

                <div className="flex flex-col gap-1">
                  {portalMenuItems.map((item, idx) => {
                    const content = (
                      <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-indigo-50/80 border border-transparent hover:border-indigo-100/80 transition-all duration-200 group cursor-pointer">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 shadow-sm ${item.badgeColor}`}>
                          {item.icon}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-900 transition-colors truncate">
                              {item.title}
                            </span>
                            {item.isExternal && (
                              <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors ml-1 font-bold">
                                ↗
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 group-hover:text-slate-700 font-normal leading-snug line-clamp-2 mt-0.5 transition-colors">
                            {item.desc}
                          </span>
                        </div>
                      </div>
                    );

                    return item.isExternal ? (
                      <a
                        key={idx}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                          setPortalOpen(false);
                        }}
                        className="block"
                      >
                        {content}
                      </a>
                    ) : (
                      <Link
                        key={idx}
                        href={item.href}
                        onClick={() => {
                          if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                          setPortalOpen(false);
                        }}
                        className="block"
                      >
                        {content}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* Mobile backdrop for Portal */}
          {portalOpen && (
            <div 
              onClick={() => setPortalOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs sm:hidden animate-[fadeIn_0.2s_ease-out]"
            />
          )}

          {/* Mobile menu trigger (garis 3) - pas dan tidak terpotong */}
          <button 
            type="button"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              if (!mobileMenuOpen) setPortalOpen(false);
            }}
            className="md:hidden p-2 rounded-full glass-pill-btn text-white hover:text-white transition-colors shrink-0 cursor-pointer"
            aria-label="Buka Menu Navigasi"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>

      </div>

      {/* Mobile Glass Drawer (Hanya isi: Beranda, Profil, Program, Fasilitas, Warta, Kontak) */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 max-w-sm mx-auto p-4 rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/80 shadow-2xl flex flex-col gap-1 text-sm font-semibold text-slate-800 animate-[fadeIn_0.2s_ease-out]">
          <a 
            href="#" 
            onClick={() => setMobileMenuOpen(false)} 
            className="px-4 py-2.5 rounded-xl hover:bg-indigo-50/80 hover:text-indigo-700 transition-colors"
          >
            Beranda
          </a>
          <a 
            href="#profil" 
            onClick={() => setMobileMenuOpen(false)} 
            className="px-4 py-2.5 rounded-xl hover:bg-indigo-50/80 hover:text-indigo-700 transition-colors"
          >
            Profil
          </a>
          <a 
            href="#kurikulum" 
            onClick={() => setMobileMenuOpen(false)} 
            className="px-4 py-2.5 rounded-xl hover:bg-indigo-50/80 hover:text-indigo-700 transition-colors"
          >
            Program
          </a>
          <a 
            href="#fasilitas" 
            onClick={() => setMobileMenuOpen(false)} 
            className="px-4 py-2.5 rounded-xl hover:bg-indigo-50/80 hover:text-indigo-700 transition-colors"
          >
            Fasilitas
          </a>
          <a 
            href="/warta" 
            onClick={() => setMobileMenuOpen(false)} 
            className="px-4 py-2.5 rounded-xl hover:bg-indigo-50/80 hover:text-indigo-700 transition-colors"
          >
            Warta
          </a>
          <a 
            href="#kontak" 
            onClick={() => setMobileMenuOpen(false)} 
            className="px-4 py-2.5 rounded-xl hover:bg-indigo-50/80 hover:text-indigo-700 transition-colors"
          >
            Kontak
          </a>
        </div>
      )}
    </header>
  );
}
