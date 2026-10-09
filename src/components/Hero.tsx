'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 26;
const LERP_FACTOR = 0.08;

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const targetFrameRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  const needsRedrawRef = useRef<boolean>(true);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let isDestroyed = false;
    let rafId: number | null = null;
    let lastRenderedIndex = -1;

    // 1. Retina / DPR responsive canvas sizing
    const handleResize = () => {
      if (!canvas || !stickyRef.current) return;
      const isMobile = window.innerWidth < 768;
      const dpr = isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 2);
      const width = stickyRef.current.clientWidth || window.innerWidth;
      const height = stickyRef.current.clientHeight || window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      needsRedrawRef.current = true;
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    // 2. Draw Frame onto canvas (Aspect-ratio Cover)
    const drawFrame = (frameIndex: number) => {
      if (isDestroyed || !ctx || !stickyRef.current) return;

      const width = stickyRef.current.clientWidth || window.innerWidth;
      const height = stickyRef.current.clientHeight || window.innerHeight;

      // Find target frame or nearest available loaded frame
      let img = imagesRef.current[frameIndex];
      if (!img || !img.complete || img.naturalWidth === 0) {
        for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
          const down = frameIndex - offset;
          const up = frameIndex + offset;
          if (down >= 0 && imagesRef.current[down]?.complete && imagesRef.current[down]!.naturalWidth > 0) {
            img = imagesRef.current[down];
            break;
          }
          if (up < TOTAL_FRAMES && imagesRef.current[up]?.complete && imagesRef.current[up]!.naturalWidth > 0) {
            img = imagesRef.current[up];
            break;
          }
        }
      }

      if (!img || !img.complete || img.naturalWidth === 0) return;

      const hRatio = width / img.width;
      const vRatio = height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const drawW = img.width * ratio;
      const drawH = img.height * ratio;
      const drawX = (width - drawW) / 2;
      const drawY = (height - drawH) / 2;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    };

    // 3. Progressive Image Preloading (Frame 1 instant, then remaining frames)
    const preloadFrames = () => {
      const loadFrame = (index: number) => {
        if (imagesRef.current[index]) return;
        const img = new Image();
        const frameNumber = String(index + 1).padStart(3, '0');
        img.src = `/frames_26/frame-${frameNumber}.png`;
        img.onload = () => {
          if (isDestroyed) return;
          imagesRef.current[index] = img;
          if (index === 0 || Math.round(currentFrameRef.current) === index) {
            needsRedrawRef.current = true;
          }
        };
      };

      // Load first frame immediately
      loadFrame(0);

      // Progressively load remaining frames
      for (let i = 1; i < TOTAL_FRAMES; i++) {
        loadFrame(i);
      }
    };

    preloadFrames();

    // 4. Scroll progress mapping: 0% scroll -> frame 1 (index 0), 100% scroll -> frame 26 (index 25)
    const updateScrollProgress = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const maxScroll = containerRef.current.offsetHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const currentScroll = Math.max(0, Math.min(maxScroll, -rect.top));
      const progress = currentScroll / maxScroll;
      targetFrameRef.current = progress * (TOTAL_FRAMES - 1);
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();

    // GSAP ScrollTrigger synchronization
    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        targetFrameRef.current = self.progress * (TOTAL_FRAMES - 1);
      }
    });

    // 5. Persistent Animation Loop with smooth Lerp interpolation
    const renderLoop = () => {
      if (isDestroyed) return;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isMobile = window.innerWidth < 768;
      const lerpFactor = isMobile ? 0.75 : LERP_FACTOR;

      if (prefersReduced) {
        currentFrameRef.current = targetFrameRef.current;
      } else {
        currentFrameRef.current += (targetFrameRef.current - currentFrameRef.current) * lerpFactor;
      }

      if (Math.abs(targetFrameRef.current - currentFrameRef.current) < (isMobile ? 0.05 : 0.008)) {
        currentFrameRef.current = targetFrameRef.current;
      }

      const frameIndex = Math.round(currentFrameRef.current);
      const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex));

      if (clampedIndex !== lastRenderedIndex || needsRedrawRef.current) {
        drawFrame(clampedIndex);
        lastRenderedIndex = clampedIndex;
        needsRedrawRef.current = false;
      }

      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);

    // 6. Foreground UI animations
    const ctxAnim = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        contentRef.current?.children ? Array.from(contentRef.current.children) : [],
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, stagger: 0.12 }
      );

      // Smoothly fade out foreground text toward the end of the scroll
      const isMobileScreen = window.innerWidth < 768;
      gsap.to(contentRef.current, {
        y: -40,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: isMobileScreen ? '45% top' : '75% top',
          end: isMobileScreen ? '85% top' : '95% top',
          scrub: true,
        }
      });
    }, containerRef);

    return () => {
      isDestroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateScrollProgress);
      st.kill();
      ctxAnim.revert();
    };
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative w-full h-[125vh] sm:h-[220vh] md:h-[400vh] bg-[#f8fafc] selection:bg-indigo-500/25 selection:text-indigo-200"
    >
      {/* Full-screen Sticky Viewport */}
      <div 
        ref={stickyRef}
        className="sticky top-0 w-full h-screen h-[100dvh] overflow-hidden flex flex-col justify-end bg-[#f8fafc]"
      >
        {/* 1. Full-screen Sticky HTML5 Canvas */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none block" 
          />

          {/* Clean White Cloud-Like Edge Mist (desktop only) */}
          <div className="hidden sm:block absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-white/30 via-white/10 to-transparent pointer-events-none" />
          <div className="hidden sm:block absolute -bottom-16 left-1/4 w-[600px] h-[220px] bg-white/20 rounded-full blur-[90px] pointer-events-none" />
          <div className="hidden sm:block absolute -bottom-16 right-1/4 w-[500px] h-[200px] bg-white/15 rounded-full blur-[80px] pointer-events-none" />

          {/* Subtle perimeter white cloud tint around edges (desktop only) */}
          <div className="hidden sm:block absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_65%,rgba(255,255,255,0.08)_100%)] pointer-events-none" />

          {/* Subtle indigo atmospheric ambient tint matching new palette */}
          <div className="absolute inset-0 bg-indigo-950/[0.04] mix-blend-color pointer-events-none" />
          <div className="hidden sm:block absolute top-1/4 right-0 w-[500px] h-[500px] bg-indigo-600/[0.04] rounded-full blur-[160px] pointer-events-none" />
        </div>

        {/* 2. Hero Editorial Content (100% Sharp & Readable Typography with clean contrast) */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-12 sm:pb-16 lg:pb-20 pt-32 sm:pt-40 flex flex-col items-start">
          
          {/* Headline + Subtext + 2 Minimalist CTA Buttons */}
          <div ref={contentRef} className="max-w-md sm:max-w-lg lg:max-w-xl flex flex-col items-start">

            {/* Headline with drop shadow for 100% crisp readability over canvas */}
            <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] xl:text-[2.85rem] tracking-tight leading-[1.15] mb-3.5 sm:mb-4 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              <span className="font-light text-slate-200 block drop-shadow-md">SMPN 3 Cihampelas</span>
              <span className="font-bold text-white block drop-shadow-lg">Mencetak Generasi Unggul</span>
            </h1>

            {/* High-Contrast Subheadline */}
            <p className="text-xs sm:text-sm md:text-[15px] text-white font-medium leading-relaxed max-w-sm sm:max-w-md mb-6 sm:mb-7 tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              Membina integritas, menguasai teknologi masa depan, dan mencetak pemimpin berwawasan global dalam ekosistem belajar modern.
            </p>

            {/* 2 Minimalist CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
              
              {/* Primary Pill Button (Clean White Pill with dark arrow circle) */}
              <a 
                href="https://ppdb.jabarprov.go.id" 
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-between sm:justify-start gap-4 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-white text-black font-semibold text-xs sm:text-sm tracking-wide uppercase hover:bg-stone-200 hover:scale-[1.01] active:scale-95 transition-all duration-300 shadow-xl shadow-black/40"
              >
                <span>Daftar PPDB 2026</span>
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-normal group-hover:rotate-45 transition-transform duration-300 shrink-0">
                  ↗
                </span>
              </a>

              {/* Secondary Frosted Glass Pill Button (Clean Frosted Glass, No Black) */}
              <a 
                href="#profil" 
                className="inline-flex items-center justify-center px-6 sm:px-7 py-3 sm:py-3.5 rounded-full border border-white/40 bg-white/20 hover:bg-white/35 hover:border-white text-white font-semibold text-xs sm:text-sm tracking-wide uppercase transition-all duration-300 active:scale-95 backdrop-blur-xl shadow-lg shadow-black/20"
              >
                <span>Jelajahi Profil</span>
              </a>

            </div>

          </div>

        </div>

        {/* Ultra-subtle hairline bottom divider (desktop only) */}
        <div className="hidden sm:block w-full h-px bg-white/[0.06]" />
      </div>
    </section>
  );
}



