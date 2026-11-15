'use client';

import React, { useState, useEffect } from 'react';
import { useSettingsData } from '@/lib/settingsData';

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
  const {
    identity,
    hasCustomPassword,
    isSyncing,
    saveIdentity,
    updatePassword,
    resetPassword,
    resetIdentity,
    executeMasterReset
  } = useSettingsData();

  const [schoolName, setSchoolName] = useState(identity.schoolName);
  const [npsn, setNpsn] = useState(identity.npsn);
  const [akreditasi, setAkreditasi] = useState(identity.akreditasi);
  const [region, setRegion] = useState(identity.region);
  const [address, setAddress] = useState(identity.address || '');
  const [email, setEmail] = useState(identity.email || '');
  const [phone, setPhone] = useState(identity.phone || '');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Sync internal state when cloud identity changes
  useEffect(() => {
    if (identity) {
      setSchoolName(identity.schoolName || 'SMP Negeri 3 Cihampelas');
      setNpsn(identity.npsn || '20279930');
      setAkreditasi(identity.akreditasi || 'B (Baik) - BAN S/M');
      setRegion(identity.region || 'Cihampelas, Kab. Bandung Barat');
      setAddress(identity.address || '');
      setEmail(identity.email || '');
      setPhone(identity.phone || '0812-3456-7890');
    }
  }, [identity]);

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingIdentity(true);
    try {
      saveIdentity({
        schoolName,
        npsn,
        akreditasi,
        region,
        address,
        email,
        phone
      });
      showToast('✅ Identitas resmi sekolah berhasil disimpan ke Database MariaDB & aktif di seluruh sistem!');
    } catch {
      showToast('❌ Gagal menyimpan identitas sekolah.');
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
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

    setIsSavingPassword(true);
    try {
      const success = await updatePassword(password);
      if (success) {
        showToast('🔑 Kata sandi admin berhasil diperbarui di Database MariaDB & langsung aktif untuk login!');
        setPassword('');
        setConfirmPassword('');
      } else {
        showToast('❌ Gagal memperbarui kata sandi di database.');
      }
    } catch {
      showToast('❌ Terjadi kesalahan saat memperbarui kata sandi.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleResetPassword = async () => {
    if (confirm('⚠️ Kembalikan kata sandi admin ke password bawaan sistem (admin123)?')) {
      const ok = await resetPassword();
      if (ok) {
        showToast('🔄 Kata sandi admin berhasil dikembalikan ke bawaan sistem (admin123) di MariaDB!');
      } else {
        showToast('❌ Gagal mereset kata sandi.');
      }
    }
  };

  const handleResetIdentityOnly = async () => {
    if (confirm('🔄 Kembalikan identitas sekolah ke setelan resmi (SMP Negeri 3 Cihampelas, NPSN: 20279930)?')) {
      await resetIdentity();
      showToast('🔄 Identitas sekolah berhasil direset ke standar resmi di Database MariaDB!');
    }
  };

  const handleMasterReset = async () => {
    if (confirm('⚠️ PERINGATAN BESAR: Apakah Anda yakin ingin mereset SELURUH data website (Identitas, Password Admin, GTK, Siswa, Agenda, dan Galeri) kembali ke setelan default awal sekolah di Database MariaDB?')) {
      showToast('⏳ Memproses pemulihan data master website di Database MariaDB...');
      const ok = await executeMasterReset();
      if (ok) {
        onResetSchoolData();
        if (onResetStudents) onResetStudents();
        if (onResetAgenda) onResetAgenda();
        if (onResetGallery) onResetGallery();
        showToast('🔄 Seluruh modul website berhasil direset ke setelan standar sekolah di Database MariaDB!');
      } else {
        showToast('⚠️ Master reset selesai dengan catatan sebagian modul.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-slate-950 tracking-tight">Pengaturan & Pemeliharaan Web</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Live MariaDB
            </span>
            {isSyncing && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 animate-pulse">
                Menyinkronkan...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 font-semibold mt-0.5">
            Identitas resmi lembaga, manajemen kata sandi masuk admin, dan pusat pemulihan data master (Tersinkron otomatis ke MariaDB)
          </p>
        </div>
        <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[11px] font-mono font-black bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center gap-1.5">
          <span>⚡</span>
          <span>Database Aktif & Tersinkron</span>
        </span>
      </div>

      {/* 1. School Master Data */}
      <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-black text-slate-950 pb-1">
              Identitas Resmi Sekolah
            </h3>
            <p className="text-xs text-slate-600 font-semibold">
              Data pokok kelembagaan dan akreditasi resmi SMP Negeri 3 Cihampelas di Database MariaDB
            </p>
          </div>
          {identity.updatedAt && (
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              Diperbarui: {identity.updatedAt}
            </span>
          )}
        </div>
        
        <form onSubmit={handleSaveIdentity} className="space-y-4 text-xs pt-2 border-t-2 border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-800 font-black block mb-1.5 text-xs">Nama Satuan Pendidikan *</label>
              <input 
                type="text" 
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
            <div>
              <label className="text-slate-800 font-black block mb-1.5 text-xs">NPSN (Nomor Pokok Sekolah Nasional) *</label>
              <input 
                type="text" 
                value={npsn}
                onChange={(e) => setNpsn(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs font-mono"
              />
            </div>
            <div>
              <label className="text-slate-800 font-black block mb-1.5 text-xs">Status Akreditasi *</label>
              <input 
                type="text" 
                value={akreditasi}
                onChange={(e) => setAkreditasi(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
            <div>
              <label className="text-slate-800 font-black block mb-1.5 text-xs">Kecamatan / Kabupaten *</label>
              <input 
                type="text" 
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
            <div>
              <label className="text-slate-800 font-black block mb-1.5 text-xs">Alamat Kampus Lengkap</label>
              <input 
                type="text" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Kp. Sukawangi RT 02 / RW 09, Desa Situwangi..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
            <div>
              <label className="text-slate-800 font-black block mb-1.5 text-xs">Email Resmi Sekolah</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@smpn3cihampelas.sch.id"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs font-mono"
              />
            </div>
            <div>
              <label className="text-slate-800 font-black block mb-1.5 text-xs">Nomor Telepon / WhatsApp Resmi</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812-3456-7890"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={isSavingIdentity}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>💾</span>
              <span>{isSavingIdentity ? 'Menyimpan ke MariaDB...' : 'Simpan Perubahan Identitas'}</span>
            </button>
            <button
              type="button"
              onClick={handleResetIdentityOnly}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-300"
            >
              Reset Identitas Bawaan
            </button>
          </div>
        </form>
      </div>

      {/* 2. Password Change */}
      <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-black text-slate-950 pb-1">
              Keamanan & Kata Sandi Admin
            </h3>
            <p className="text-xs text-slate-600 font-semibold">
              Perbarui kata sandi untuk masuk ke Dashboard Portal Admin (Password bawaan sistem: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-indigo-700 font-bold">admin123</code>)
            </p>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border ${
            hasCustomPassword 
              ? 'bg-amber-50 text-amber-900 border-amber-300' 
              : 'bg-slate-100 text-slate-700 border-slate-300'
          }`}>
            {hasCustomPassword ? '● Password Kustom Aktif di MariaDB' : '● Password Default (admin123)'}
          </span>
        </div>
        
        <form onSubmit={handleSavePassword} className="space-y-4 text-xs pt-2 border-t-2 border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-800 font-black text-xs">Kata Sandi Baru *</label>
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
              <label className="text-slate-800 font-black block mb-1.5 text-xs">Ulangi Konfirmasi Kata Sandi *</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru..." 
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 flex-wrap">
            <button
              type="submit"
              disabled={isSavingPassword}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>🔑</span>
              <span>{isSavingPassword ? 'Menyimpan ke MariaDB...' : 'Perbarui Kata Sandi di MariaDB'}</span>
            </button>
            {hasCustomPassword && (
              <button
                type="button"
                onClick={handleResetPassword}
                className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-all cursor-pointer border border-rose-300"
              >
                Kembalikan ke Password Default (admin123)
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 3. Centralized Maintenance Hub */}
      <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-950 pb-1">
            Pusat Pemeliharaan & Reset Data Sekolah
          </h3>
          <p className="text-xs text-slate-600 font-semibold leading-relaxed">
            Gunakan tombol berikut jika Anda membutuhkan pemulihan data master ke kondisi resmi standar sekolah di Database MariaDB:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t-2 border-slate-100">
          {/* Reset GTK */}
          <button
            type="button"
            onClick={() => {
              if (confirm('🔄 Reset seluruh data Pimpinan & Guru ke 36 GTK resmi di Database MariaDB?')) {
                onResetSchoolData();
                showToast('🔄 Data Pimpinan & Guru berhasil direset di Database MariaDB!');
              }
            }}
            className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-left transition-all cursor-pointer active:scale-98 group"
          >
            <span className="text-xl block mb-1 group-hover:scale-110 transition-transform">👨‍🏫</span>
            <span className="text-xs font-black text-slate-900 block">Reset GTK & Guru</span>
            <span className="text-[11px] text-slate-500 font-medium">Pulihkan 36 data GTK di MariaDB</span>
          </button>

          {/* Reset Siswa */}
          {onResetStudents && (
            <button
              type="button"
              onClick={() => {
                if (confirm('🔄 Reset seluruh Data Siswa ke 535 siswa (17 rombel) di Database MariaDB?')) {
                  onResetStudents();
                  showToast('🔄 Data Siswa & Rombel berhasil direset di Database MariaDB!');
                }
              }}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-left transition-all cursor-pointer active:scale-98 group"
            >
              <span className="text-xl block mb-1 group-hover:scale-110 transition-transform">🎒</span>
              <span className="text-xs font-black text-slate-900 block">Reset Siswa & Rombel</span>
              <span className="text-[11px] text-slate-500 font-medium">Pulihkan 535 data siswa di MariaDB</span>
            </button>
          )}

          {/* Reset Agenda */}
          {onResetAgenda && (
            <button
              type="button"
              onClick={() => {
                if (confirm('🔄 Reset Kalender Akademik ke 27 Kaldik SK resmi di Database MariaDB?')) {
                  onResetAgenda();
                  showToast('🔄 Kalender Akademik berhasil direset di Database MariaDB!');
                }
              }}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-left transition-all cursor-pointer active:scale-98 group"
            >
              <span className="text-xl block mb-1 group-hover:scale-110 transition-transform">📅</span>
              <span className="text-xs font-black text-slate-900 block">Reset Kaldik Resmi</span>
              <span className="text-[11px] text-slate-500 font-medium">Pulihkan 27 Kaldik SK di MariaDB</span>
            </button>
          )}

          {/* Reset Galeri */}
          {onResetGallery && (
            <button
              type="button"
              onClick={() => {
                if (confirm('🔄 Reset Galeri Foto ke 8 foto dokumentasi standar di Database MariaDB?')) {
                  onResetGallery();
                  showToast('🔄 Galeri Foto berhasil direset di Database MariaDB!');
                }
              }}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-left transition-all cursor-pointer active:scale-98 group"
            >
              <span className="text-xl block mb-1 group-hover:scale-110 transition-transform">📸</span>
              <span className="text-xs font-black text-slate-900 block">Reset Galeri Foto</span>
              <span className="text-[11px] text-slate-500 font-medium">Pulihkan 8 foto standar di MariaDB</span>
            </button>
          )}
        </div>

        {/* Master Reset Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <p className="text-[11px] text-slate-500 font-medium">
            Tindakan reset akan mengembalikan data master di database cloud MariaDB ke cetak biru master sekolah.
          </p>
          <button
            type="button"
            onClick={handleMasterReset}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-800 text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-xs active:scale-98"
          >
            <span>⚠️</span>
            <span>Reset Seluruh Modul Sekaligus (Database MariaDB)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
