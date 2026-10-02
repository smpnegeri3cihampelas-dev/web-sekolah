'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        contentRef.current?.children ? Array.from(contentRef.current.children) : [],
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 1.1, stagger: 0.12 }
      );

      if (badgeRef.current) {
        gsap.fromTo(
          badgeRef.current,
          { opacity: 0, scale: 0.8, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 1.2, delay: 0.4, ease: 'back.out(1.5)' }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative w-full min-h-[92vh] sm:min-h-screen bg-[#080b20] overflow-hidden flex flex-col justify-between pt-32 sm:pt-40 select-none"
    >
      {/* 1. Exact Marklab Atmospheric Gradient Lights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* Dominant Left/Center Electric Indigo Bloom */}
        <div 
          className="absolute -top-20 left-[-10%] sm:left-[5%] w-[600px] sm:w-[850px] h-[600px] sm:h-[750px] rounded-full opacity-80"
          style={{
            background: 'radial-gradient(circle, rgba(67, 56, 202, 0.65) 0%, rgba(79, 70, 229, 0.45) 30%, rgba(99, 102, 241, 0.2) 55%, transparent 75%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Right Secondary Royal Violet Highlight */}
        <div 
          className="absolute top-10 right-[-15%] sm:right-[5%] w-[500px] sm:w-[700px] h-[500px] sm:h-[650px] rounded-full opacity-70"
          style={{
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.5) 0%, rgba(99, 102, 241, 0.3) 35%, rgba(67, 56, 202, 0.15) 60%, transparent 75%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Deep Midnight Backdrop Softener */}
        <div className="absolute inset-0 bg-[#080b20]/30 backdrop-blur-[1px]" />

        {/* Vertical subtle glass stripes on the right (matching Marklab aesthetic) */}
        <div className="hidden lg:flex absolute right-12 top-28 bottom-28 w-44 gap-3 opacity-20 pointer-events-none">
          <div className="flex-1 bg-white/[0.04] rounded-full border border-white/[0.06]" />
          <div className="flex-1 bg-white/[0.06] rounded-full border border-white/[0.08]" />
          <div className="flex-1 bg-white/[0.04] rounded-full border border-white/[0.06]" />
        </div>
      </div>

      {/* 2. Main Centered Hero Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-16 flex flex-col items-center text-center">
        
        <div ref={contentRef} className="flex flex-col items-center max-w-4xl">
          
          {/* Eyebrow Badge Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-xl text-xs font-normal text-indigo-100 mb-8 transition-all duration-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-300 shadow-[0_0_10px_#a5b4fc] animate-pulse" />
            <span className="tracking-wide">SMP Negeri 3 Cihampelas • Smart Campus RIGAS</span>
          </div>

          {/* Signature Headline matching Marklab typography & italic serif accent */}
          <h1 className="font-sans text-4xl sm:text-6xl md:text-7xl lg:text-[5rem] tracking-tight leading-[1.08] text-white font-light mb-6">
            Mencetak Generasi <br />
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-200">
              Unggul &amp; Berkarakter
            </span>
          </h1>

          {/* Clean modern subheadline */}
          <p className="text-sm sm:text-base md:text-lg text-indigo-200/85 font-light leading-relaxed max-w-2xl mb-10 tracking-wide">
            Membina integritas moral, menguasai sains &amp; teknologi masa depan, serta melahirkan insan pembelajar yang Religius, Inovatif, Gesit, Aktif, dan Santun (RIGAS).
          </p>

          {/* Action Row matching Marklab Buttons */}
          <div className="relative flex flex-wrap items-center justify-center gap-4 sm:gap-6 w-full">
            
            {/* Primary Pill Button (White with Dark Arrow Circle) */}
            <a 
              href="https://ppdb.jabarprov.go.id" 
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3.5 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white text-[#080b20] font-medium text-xs sm:text-sm tracking-wide uppercase hover:bg-indigo-50 hover:shadow-[0_10px_35px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-xl shadow-indigo-950/40 cursor-pointer"
            >
              <span>Daftar PPDB 2026</span>
              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#080b20] text-white flex items-center justify-center text-xs font-normal group-hover:rotate-45 transition-transform duration-300 shrink-0">
                ↗
              </span>
            </a>

            {/* Secondary Transparent Pill Button */}
            <a 
              href="#profil" 
              className="inline-flex items-center gap-2.5 px-6 sm:px-7 py-3.5 sm:py-4 rounded-full border border-white/20 bg-white/[0.06] hover:bg-white/[0.14] hover:border-white/35 text-white font-normal text-xs sm:text-sm tracking-wide transition-all duration-300 active:scale-95 backdrop-blur-md group"
            >
              <span>Jelajahi Profil</span>
              <span className="text-xs group-hover:translate-x-0.5 transition-transform duration-200">↗</span>
            </a>

            {/* Floating 3D Mascot / Smart Bell Element (matching the 3D bell in Marklab) */}
            <div 
              ref={badgeRef}
              className="hidden md:flex absolute -right-4 sm:-right-8 -bottom-4 items-center gap-2 px-3 py-2 rounded-2xl bg-gradient-to-br from-indigo-500/25 to-purple-600/20 border border-white/20 backdrop-blur-xl shadow-xl shadow-indigo-950/40 animate-[bounce_5s_ease-in-out_infinite]"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/30 text-white font-bold text-sm">
                🔔
              </div>
              <div className="text-left pr-1">
                <p className="text-[11px] font-semibold text-white leading-tight">Bel KBM Aktif</p>
                <p className="text-[9px] text-indigo-200/80 font-mono">Tahun Ajaran 2026/2027</p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 3. The Signature Marklab Ethereal Mist Transition into Light Section */}
      <div className="relative w-full h-28 sm:h-36 pointer-events-none z-10">
        <div 
          className="w-full h-full"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(224, 231, 255, 0.35) 45%, rgba(238, 242, 255, 0.75) 75%, #f8fafc 100%)',
          }}
        />
      </div>
    </section>
  );
}
