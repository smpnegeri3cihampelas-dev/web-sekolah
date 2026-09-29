'use client';

import { useState } from 'react';

export default function CTA() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
    }, 1200);
  };

  return (
    <section id="daftar" className="w-full py-28 px-4 sm:px-8 relative bg-[#f4f7fb] overflow-hidden border-t border-slate-200/60">
      {/* Intense Ambient Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[350px] bg-gradient-to-r from-blue-400/15 to-cyan-400/15 blur-[140px] rounded-full" />
      </div>
      
      <div className="max-w-4xl mx-auto glass-awesmos-card bg-gradient-to-br from-white via-sky-50/40 to-blue-50/30 rounded-[36px] p-8 sm:p-14 text-center border border-white shadow-[0_20px_60px_-15px_rgba(37,99,235,0.1)] relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono tracking-widest uppercase mb-6 font-semibold">
          <span className="w-2 h-2 rounded-full bg-blue-600 pulse-dot" />
          PENDAFTARAN PESERTA DIDIK BARU (PPDB 2026/2027)
        </div>

        <h2 className="font-display font-black text-3xl sm:text-5xl text-slate-900 uppercase tracking-tight mb-4">
          SIAP MENJADI BAGIAN <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500">
            GENERASI UNGGUL?
          </span>
        </h2>
        
        <p className="text-slate-600 mb-10 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          Kembangkan potensimu bersama SMP Negeri 3 Cihampelas dengan lingkungan belajar cerdas, berprestasi, dan siap menghadapi tantangan masa depan.
        </p>

        {status === 'success' ? (
          <div className="bg-white text-slate-900 p-8 rounded-3xl border border-emerald-400/60 max-w-xl mx-auto shadow-xl animate-[fadeIn_0.5s_ease-out]">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-3 shadow-md shadow-emerald-500/30">
              ✓
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900 mb-1">Registrasi Minat Berhasil!</h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Terima kasih telah mendaftar. Tim PPDB SMPN 3 Cihampelas akan menghubungi kontak Anda melalui email/WhatsApp dengan panduan lengkap.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email Anda untuk info PPDB..." 
              className="flex-1 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-full px-6 py-4 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm shadow-sm transition-all"
            />
            <button 
              type="submit"
              disabled={status === 'loading'}
              className="btn-blue-glow text-white rounded-full px-8 py-4 font-semibold text-sm uppercase tracking-wider transition-all disabled:opacity-70 shadow-lg cursor-pointer"
            >
              {status === 'loading' ? 'Memproses...' : 'Daftar Sekarang →'}
            </button>
          </form>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="text-blue-600 font-bold">✓</span> Kuota Terbuka
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="text-blue-600 font-bold">✓</span> Jalur Prestasi & Zonasi
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="text-blue-600 font-bold">✓</span> Konsultasi Online Gratis
          </span>
        </div>
      </div>
    </section>
  );
}


