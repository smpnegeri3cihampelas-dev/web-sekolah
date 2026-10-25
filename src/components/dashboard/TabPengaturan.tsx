'use client';

import React, { useState, useEffect } from 'react';

interface TabPengaturanProps {
  onResetSchoolData: () => void;
  onResetStudents?: () => void;
  onResetAgenda?: () => void;
  onResetGallery?: () => void;
  showToast: (msg: string) => void;
}

export function TabPengaturan({ 
  onResetSchoolData, 
  onResetStudents,
  onResetAgenda,
  onResetGallery,
  showToast 
}: TabPengaturanProps) {
  const [schoolName, setSchoolName] = useState('SMP Negeri 3 Cihampelas');
  const [npsn, setNpsn] = useState('20279930');
  const [akreditasi, setAkreditasi] = useState('B (Baik) - BAN S/M');
  const [region, setRegion] = useState('Cihampelas, Kab. Bandung Barat');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  const handleMasterReset = () => {
    if (confirm('⚠️ PERINGATAN: Apakah Anda yakin ingin mereset SELURUH data website (GTK, Siswa, Agenda, dan Galeri) kembali ke setelan default awal sekolah?')) {
      onResetSchoolData();
      if (onResetStudents) onResetStudents();
      if (onResetAgenda) onResetAgenda();
      if (onResetGallery) onResetGallery();
      showToast('🔄 Seluruh modul website berhasil direset ke setelan standar sekolah!');
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-950 tracking-tight">Pengaturan & Pemeliharaan Web</h2>
          <p className="text-xs text-slate-700 font-semibold mt-0.5">
            Identitas resmi lembaga, manajemen kata sandi masuk admin, dan pusat pemulihan data master
          </p>
        </div>
        <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[11px] font-mono font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          Sistem Terhubung Realtime
        </span>
      </div>

      {/* 1. School Master Data */}
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs font-mono"
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

      {/* 2. Password Change */}
      <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-950 pb-1">
            Keamanan & Kata Sandi Admin
          </h3>
          <p className="text-xs text-slate-600 font-semibold">
            Perbarui kata sandi untuk masuk ke Dashboard Portal Admin (Password bawaan sistem: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-indigo-700 font-bold">smpn3juara</code>)
          </p>
        </div>
        
        <form onSubmit={handleSavePassword} className="space-y-4 text-xs pt-2 border-t-2 border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-800 font-black text-xs">Kata Sandi Baru</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter..." 
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
            <div>
              <label className="text-slate-800 font-black block mb-1.5 text-xs">Ulangi Konfirmasi Kata Sandi</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru..." 
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

      {/* 3. Centralized Maintenance Hub */}
      <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-950 pb-1">
            Pusat Pemeliharaan & Reset Data Sekolah
          </h3>
          <p className="text-xs text-slate-600 font-semibold leading-relaxed">
            Gunakan tombol berikut jika Anda membutuhkan pemulihan data master ke kondisi resmi standar sekolah:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t-2 border-slate-100">
          {/* Reset GTK */}
          <button
            type="button"
            onClick={() => {
              if (confirm('🔄 Reset seluruh data Pimpinan & Guru ke 36 GTK resmi?')) {
                onResetSchoolData();
                showToast('🔄 Data Pimpinan & Guru berhasil direset!');
              }
            }}
            className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-left transition-all cursor-pointer active:scale-98 group"
          >
            <span className="text-xl block mb-1 group-hover:scale-110 transition-transform">👨‍🏫</span>
            <span className="text-xs font-black text-slate-900 block">Reset GTK & Guru</span>
            <span className="text-[11px] text-slate-500 font-medium">Pulihkan 36 data GTK</span>
          </button>

          {/* Reset Siswa */}
          {onResetStudents && (
            <button
              type="button"
              onClick={() => {
                if (confirm('🔄 Reset seluruh Data Siswa ke 535 siswa (17 rombel)?')) {
                  onResetStudents();
                  showToast('🔄 Data Siswa & Rombel berhasil direset!');
                }
              }}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-left transition-all cursor-pointer active:scale-98 group"
            >
              <span className="text-xl block mb-1 group-hover:scale-110 transition-transform">🎒</span>
              <span className="text-xs font-black text-slate-900 block">Reset Siswa & Rombel</span>
              <span className="text-[11px] text-slate-500 font-medium">Pulihkan 535 data siswa</span>
            </button>
          )}

          {/* Reset Agenda */}
          {onResetAgenda && (
            <button
              type="button"
              onClick={() => {
                if (confirm('🔄 Reset Kalender Akademik ke 27 Kaldik SK resmi?')) {
                  onResetAgenda();
                  showToast('🔄 Kalender Akademik berhasil direset!');
                }
              }}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-left transition-all cursor-pointer active:scale-98 group"
            >
              <span className="text-xl block mb-1 group-hover:scale-110 transition-transform">📅</span>
              <span className="text-xs font-black text-slate-900 block">Reset Kaldik Resmi</span>
              <span className="text-[11px] text-slate-500 font-medium">Pulihkan 27 Kaldik SK</span>
            </button>
          )}

          {/* Reset Galeri */}
          {onResetGallery && (
            <button
              type="button"
              onClick={() => {
                if (confirm('🔄 Reset Galeri Foto ke 8 foto dokumentasi standar?')) {
                  onResetGallery();
                  showToast('🔄 Galeri Foto berhasil direset!');
                }
              }}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-left transition-all cursor-pointer active:scale-98 group"
            >
              <span className="text-xl block mb-1 group-hover:scale-110 transition-transform">📸</span>
              <span className="text-xs font-black text-slate-900 block">Reset Galeri Foto</span>
              <span className="text-[11px] text-slate-500 font-medium">Pulihkan 8 foto standar</span>
            </button>
          )}
        </div>

        {/* Master Reset Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <p className="text-[11px] text-slate-500 font-medium">
            Tindakan reset akan mengembalikan data tersimpan di browser ke cetak biru master sekolah.
          </p>
          <button
            type="button"
            onClick={handleMasterReset}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-800 text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-xs active:scale-98"
          >
            <span>⚠️</span>
            <span>Reset Seluruh Modul Sekaligus</span>
          </button>
        </div>
      </div>
    </div>
  );
}
