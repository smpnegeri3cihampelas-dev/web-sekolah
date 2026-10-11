'use client';

import React, { useState, useEffect } from 'react';

interface TabPengaturanProps {
  onResetSchoolData: () => void;
  showToast: (msg: string) => void;
}

export function TabPengaturan({ onResetSchoolData, showToast }: TabPengaturanProps) {
  const [schoolName, setSchoolName] = useState('SMP Negeri 3 Cihampelas');
  const [npsn, setNpsn] = useState('20279930');
  const [akreditasi, setAkreditasi] = useState('B (Baik) - BAN S/M');
  const [region, setRegion] = useState('Cihampelas, Kab. Bandung Barat');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load saved identity from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smpn3_school_identity');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.schoolName) setSchoolName(parsed.schoolName);
          if (parsed.npsn) setNpsn(parsed.npsn);
          if (parsed.akreditasi) setAkreditasi(parsed.akreditasi);
          if (parsed.region) setRegion(parsed.region);
        }
      } catch {}
    }
  }, []);

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'smpn3_school_identity',
          JSON.stringify({ schoolName, npsn, akreditasi, region })
        );
      } catch {}
    }
    showToast('✅ Identitas resmi sekolah berhasil diperbarui!');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      showToast('⚠️ Silakan masukkan kata sandi baru!');
      return;
    }
    if (password.length < 6) {
      showToast('⚠️ Kata sandi minimal harus 6 karakter!');
      return;
    }
    if (password !== confirmPassword) {
      showToast('⚠️ Konfirmasi kata sandi tidak cocok!');
      return;
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smpn3_admin_password', password);
      } catch {}
    }

    showToast('🔑 Kata sandi admin berhasil diperbarui & langsung aktif untuk login!');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* School Master Data */}
      <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-950 pb-1">
            Identitas Resmi Sekolah
          </h3>
          <p className="text-xs text-slate-600 font-semibold">
            Data pokok kelembagaan dan akreditasi resmi SMP Negeri 3 Cihampelas
          </p>
        </div>
        
        <form onSubmit={handleSaveIdentity} className="space-y-4 text-xs pt-2 border-t-2 border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-800 font-black block mb-1.5 text-xs">Nama Satuan Pendidikan</label>
              <input 
                type="text" 
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
            <div>
              <label className="text-slate-800 font-black block mb-1.5 text-xs">NPSN (Nomor Pokok Sekolah Nasional)</label>
              <input 
                type="text" 
                value={npsn}
                onChange={(e) => setNpsn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
            <div>
              <label className="text-slate-800 font-black block mb-1.5 text-xs">Status Akreditasi</label>
              <input 
                type="text" 
                value={akreditasi}
                onChange={(e) => setAkreditasi(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
            <div>
              <label className="text-slate-800 font-black block mb-1.5 text-xs">Kecamatan / Kabupaten</label>
              <input 
                type="text" 
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-98"
          >
            Simpan Perubahan Identitas
          </button>
        </form>
      </div>

      {/* Password Change */}
      <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-950 pb-1">
            Keamanan & Kata Sandi Admin
          </h3>
          <p className="text-xs text-slate-600 font-semibold">
            Perbarui kata sandi untuk masuk ke Dashboard Portal Admin (Password bawaan: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-indigo-700 font-bold">smpn3juara</code>)
          </p>
        </div>
        
        <form onSubmit={handleSavePassword} className="space-y-4 text-xs pt-2 border-t-2 border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-800 font-black block mb-1.5 text-xs">Kata Sandi Baru (Min. 6 Karakter)</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi baru..." 
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
            <div>
              <label className="text-slate-800 font-black block mb-1.5 text-xs">Ulangi Konfirmasi Kata Sandi</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru..." 
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-900 text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-98"
          >
            Perbarui Kata Sandi
          </button>
        </form>
      </div>

      {/* Synchronization & Data Reset */}
      <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b-2 border-slate-100 gap-2">
          <div>
            <h3 className="text-base font-black text-slate-950">Sinkronisasi & Reset Data Sekolah</h3>
            <p className="text-xs text-slate-700 font-semibold">Data pimpinan, direktori guru, dan data pokok tersimpan otomatis di LocalStorage browser.</p>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[10px] font-mono font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Tersinkronisasi Realtime
          </span>
        </div>

        <p className="text-xs text-slate-800 leading-relaxed font-medium">
          Semua perubahan yang Anda simpan di Admin Dashboard langsung terhubung dan otomatis mengubah tampilan di halaman publik (Landing Page). Jika Anda ingin mengembalikan seluruh data pimpinan dan guru ke setelan awal pabrik, gunakan tombol reset di bawah:
        </p>

        <button
          type="button"
          onClick={() => {
            if (confirm('Apakah Anda yakin ingin mereset seluruh data pimpinan, guru, dan data pokok ke setelan default awal?')) {
              onResetSchoolData();
              showToast('🔄 Seluruh data berhasil direset ke setelan awal!');
            }
          }}
          className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-800 text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-xs active:scale-98"
        >
          <span>⚠️</span>
          <span>Reset Seluruh Data Pimpinan & Guru ke Bawaan</span>
        </button>
      </div>
    </div>
  );
}
