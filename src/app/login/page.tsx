'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Username tidak boleh kosong!');
      return;
    }

    if (!password) {
      setErrorMessage('Password tidak boleh kosong!');
      return;
    }

    setIsLoading(true);

    // Simulasi verifikasi login
    setTimeout(() => {
      setIsLoading(false);
      // Demo password check: Jika password bukan "smpn3juara" atau "admin123", tampilkan error password salah warna merah
      if (password !== 'smpn3juara' && password !== 'admin123') {
        setErrorMessage('Password salah! Periksa kembali kata sandi Anda.');
      } else {
        // Berhasil login -> langsung arahkan ke /dashboard
        router.push('/dashboard');
      }
    }, 600);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none font-sans">
      
      {/* Background Atmosphere: Subtle Indigo/Lavender Glow & Concentric Rings matching landing page */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        {/* Soft Ambient Glows */}
        <div className="absolute top-1/4 w-[600px] h-[400px] bg-indigo-100/50 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 w-[600px] h-[400px] bg-purple-100/40 rounded-full blur-[160px]" />
        
        {/* Concentric Subtle Radiant Arcs */}
        <div className="absolute w-[480px] h-[480px] sm:w-[560px] sm:h-[560px] rounded-full border border-indigo-200/30 pointer-events-none" />
        <div className="absolute w-[680px] h-[680px] sm:w-[780px] sm:h-[780px] rounded-full border border-indigo-200/20 pointer-events-none" />
        <div className="absolute w-[880px] h-[880px] sm:w-[1020px] sm:h-[1020px] rounded-full border border-indigo-200/10 pointer-events-none" />
      </div>

      {/* Top Navbar / Brand Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between py-2">
        <Link 
          href="/" 
          className="flex items-center gap-2.5 group transition-opacity hover:opacity-85"
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-transform group-hover:scale-105">
            <Image 
              src="/logo.png" 
              alt="Logo SMP Negeri 3 Cihampelas" 
              width={36} 
              height={36} 
              className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
              priority
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-semibold tracking-tight text-slate-900">
              SMPN 3 Cihampelas
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
          </div>
        </Link>

        {/* Back to Home Link */}
        <Link 
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white border border-indigo-100 shadow-sm backdrop-blur-md"
        >
          <span>←</span>
          <span>Kembali ke Beranda</span>
        </Link>
      </header>

      {/* Main Center Area: Login Card */}
      <main className="relative z-10 w-full flex items-center justify-center my-auto py-8">
        <div className="w-full max-w-[420px] rounded-[2.2rem] bg-white text-[#0f172a] shadow-xl shadow-indigo-500/10 border border-indigo-100 overflow-hidden relative group">
          
          {/* Top Soft Lavender / Indigo Glow Gradient */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-indigo-50/90 via-purple-50/40 to-transparent pointer-events-none" />

          <div className="relative z-10 p-7 sm:p-9 pt-8 flex flex-col items-center">
            
            {/* Top Icon Badge */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50/90 border border-indigo-100 shadow-sm flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300 text-indigo-600">
              <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl sm:text-[1.65rem] font-bold tracking-tight text-slate-900 text-center mb-1.5 font-display">
              Masuk ke Portal
            </h1>
            <p className="text-xs text-slate-500 font-normal text-center leading-relaxed max-w-[280px] mb-6">
              Akses sistem informasi akademik, nilai, dan pembelajaran digital SMPN 3 Cihampelas.
            </p>

            {/* Error Message */}
            {errorMessage && (
              <div className="w-full mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-600 animate-[fadeIn_0.2s_ease-out]">
                <svg className="w-4 h-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3.5">
              
              {/* Field 1: Username */}
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Username / NISN"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-slate-200/90 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  autoComplete="username"
                />
              </div>

              {/* Field 2: Password */}
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Password"
                  className={`w-full pl-10 pr-11 py-2.5 sm:py-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 border ${
                    errorMessage ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-200/90 focus:border-indigo-400'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all`}
                  autoComplete="current-password"
                />
                
                {/* Tombol Lihat/Sembunyikan Password */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Forgot password link */}
              <div className="flex justify-end -mt-1">
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setErrorMessage('Silakan hubungi administrator sekolah untuk reset kata sandi.');
                  }}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
                >
                  Lupa kata sandi?
                </a>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold tracking-wide shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Masuk</span>
                )}
              </button>

            </form>

            {/* Divider "Or sign in with" */}
            <div className="w-full flex items-center justify-between my-5">
              <div className="h-[1px] flex-1 bg-slate-200/80" />
              <span className="text-[11px] text-slate-400 font-normal px-3 uppercase tracking-wider">
                Or sign in with
              </span>
              <div className="h-[1px] flex-1 bg-slate-200/80" />
            </div>

            {/* SSO / Alternative Login Buttons (Google, Belajar.id, Apple from reference) */}
            <div className="w-full grid grid-cols-3 gap-2.5">
              {/* Google Button */}
              <button 
                type="button"
                onClick={() => setErrorMessage('Layanan SSO Google sedang dalam sinkronisasi.')}
                className="py-2.5 px-3 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 shadow-sm flex items-center justify-center transition-all hover:scale-[1.02] cursor-pointer"
                title="Masuk dengan Akun Google / Belajar.id"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.13C3.26 21.35 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.27C.46 8.19 0 10.04 0 12s.46 3.81 1.27 5.43l4.01-3.14z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.65 1.27 6.57l4.01 3.14c.95-2.83 3.6-4.96 6.72-4.96z" />
                </svg>
              </button>

              {/* Belajar.id / Facebook button position */}
              <button 
                type="button"
                onClick={() => setErrorMessage('Gunakan akun resmi @belajar.id atau username sekolah.')}
                className="py-2.5 px-3 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 shadow-sm flex items-center justify-center transition-all hover:scale-[1.02] cursor-pointer"
                title="Masuk dengan Portal Belajar.id"
              >
                <div className="w-4 h-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[10px] font-bold">
                  f
                </div>
              </button>

              {/* Apple Button */}
              <button 
                type="button"
                onClick={() => setErrorMessage('Layanan SSO Apple ID segera hadir.')}
                className="py-2.5 px-3 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 shadow-sm flex items-center justify-center transition-all hover:scale-[1.02] cursor-pointer"
                title="Masuk dengan Apple ID"
              >
                <svg className="w-4 h-4 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.66-.8 1.11-1.92.99-3.04-.95.04-2.1.63-2.77 1.43-.59.68-1.11 1.82-.97 2.91 1.06.08 2.14-.53 2.75-1.3z" />
                </svg>
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto py-3 text-center">
        <p className="text-[11px] text-stone-500 font-light">
          © {new Date().getFullYear()} SMP Negeri 3 Cihampelas · All Rights Reserved
        </p>
      </footer>

    </div>
  );
}
