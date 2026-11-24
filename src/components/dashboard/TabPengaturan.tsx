'use client';

import React, { useState, useEffect } from 'react';
import { useSettingsData } from '@/lib/settingsData';

interface TabPengaturanProps {
  onResetSchoolData: () => void;
  onResetStudents?: () => void;
  onResetAgenda?: () => void;
  onResetGallery?: () => void;
  onResetWarta?: () => void;
  onAfterMasterReset?: () => void;
  showToast: (msg: string) => void;
}

export function TabPengaturan({ 
  onResetSchoolData, 
  onResetStudents,
  onResetAgenda,
  onResetGallery,
  onResetWarta,
  onAfterMasterReset,
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
    if (confirm('⚠️ PERINGATAN BESAR: Apakah Anda yakin ingin mereset SELURUH data website (Identitas, Password Admin, Warta, GTK, Siswa, Agenda, dan Galeri) kembali ke setelan default awal sekolah di Database MariaDB?')) {
      showToast('⏳ Memproses pemulihan data master website di Database MariaDB...');
      const ok = await executeMasterReset();
      if (ok) {
        if (onAfterMasterReset) {
          onAfterMasterReset();
        }
        showToast('🔄 Seluruh modul website berhasil direset ke setelan standar sekolah di Database MariaDB!');
      } else {
        showToast('⚠️ Master reset selesai dengan catatan sebagian modul.');
      }
    }
  };

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      {/* 1. Identitas Sekolah */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-950">Identitas Sekolah</h3>
            {isSyncing && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-500 bg-slate-100 animate-pulse">
                Sinkronisasi...
              </span>
            )}
          </div>
          {identity.updatedAt && (
            <span className="text-[11px] font-mono font-bold text-slate-500">
              Diperbarui: {identity.updatedAt}
            </span>
          )}
        </div>
        
        <form onSubmit={handleSaveIdentity} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-slate-700 font-bold block mb-1 text-xs">Nama Sekolah *</label>
              <input 
                type="text" 
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1 text-xs">NPSN *</label>
              <input 
                type="text" 
                value={npsn}
                onChange={(e) => setNpsn(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1 text-xs">Akreditasi *</label>
              <input 
                type="text" 
                value={akreditasi}
                onChange={(e) => setAkreditasi(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1 text-xs">Wilayah *</label>
              <input 
                type="text" 
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-slate-700 font-bold block mb-1 text-xs">Alamat Lengkap</label>
              <input 
                type="text" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Kp. Sukawangi RT 02 / RW 09, Desa Situwangi..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1 text-xs">Email Resmi</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@smpn3cihampelas.sch.id"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1 text-xs">Telepon / WhatsApp</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812-3456-7890"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isSavingIdentity}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
            >
              {isSavingIdentity ? 'Menyimpan...' : '💾 Simpan Identitas'}
            </button>
            <button
              type="button"
              onClick={handleResetIdentityOnly}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-300"
            >
              Reset Standar
            </button>
          </div>
        </form>
      </div>

      {/* 2. Password Change */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-950">Kata Sandi Admin</h3>
            <p className="text-[11px] text-slate-500 font-semibold">
              Bawaan sistem: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-indigo-700 font-bold">admin123</code>
            </p>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border ${
            hasCustomPassword 
              ? 'bg-amber-50 text-amber-900 border-amber-300' 
              : 'bg-slate-100 text-slate-700 border-slate-300'
          }`}>
            {hasCustomPassword ? '● Sandi Kustom Aktif' : '● Sandi Bawaan'}
          </span>
        </div>
        
        <form onSubmit={handleSavePassword} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-bold text-xs">Kata Sandi Baru *</label>
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
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1 text-xs">Konfirmasi Kata Sandi *</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru..." 
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              type="submit"
              disabled={isSavingPassword}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
            >
              {isSavingPassword ? 'Menyimpan...' : '🔑 Simpan Kata Sandi'}
            </button>
            {hasCustomPassword && (
              <button
                type="button"
                onClick={handleResetPassword}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-all cursor-pointer border border-rose-300"
              >
                Reset ke Bawaan
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 3. Reset Data Modul */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-950">Pemulihan & Reset Data</h3>
            <p className="text-[11px] text-slate-500 font-semibold">Kembalikan data modul ke kondisi standar awal sekolah</p>
          </div>
          <button
            type="button"
            onClick={handleMasterReset}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-98"
          >
            <span>⚠️ Reset Semua Modul</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {onResetWarta && (
            <button
              type="button"
              onClick={() => {
                if (confirm('🔄 Reset seluruh artikel Warta & Berita ke 7 artikel awal?')) {
                  onResetWarta();
                  showToast('🔄 Warta & Berita berhasil direset!');
                }
              }}
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer active:scale-98"
            >
              <span className="text-lg block mb-0.5">📰</span>
              <span className="text-xs font-black text-slate-900 block">Reset Warta</span>
              <span className="text-[11px] text-slate-500 font-medium">7 artikel awal</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (confirm('🔄 Reset seluruh data Pimpinan & Guru ke setelan resmi?')) {
                onResetSchoolData();
                showToast('🔄 Data Pimpinan & Guru berhasil direset!');
              }
            }}
            className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer active:scale-98"
          >
            <span className="text-lg block mb-0.5">👨‍🏫</span>
            <span className="text-xs font-black text-slate-900 block">Reset GTK</span>
            <span className="text-[11px] text-slate-500 font-medium">Pimpinan & Guru</span>
          </button>

          {onResetStudents && (
            <button
              type="button"
              onClick={() => onResetStudents()}
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer active:scale-98"
            >
              <span className="text-lg block mb-0.5">🎒</span>
              <span className="text-xs font-black text-slate-900 block">Reset Siswa</span>
              <span className="text-[11px] text-slate-500 font-medium">535 siswa · 17 rombel</span>
            </button>
          )}

          {onResetAgenda && (
            <button
              type="button"
              onClick={() => {
                if (confirm('🔄 Reset Kalender Akademik ke 27 Kaldik resmi?')) {
                  onResetAgenda();
                  showToast('🔄 Kalender Akademik berhasil direset!');
                }
              }}
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer active:scale-98"
            >
              <span className="text-lg block mb-0.5">📅</span>
              <span className="text-xs font-black text-slate-900 block">Reset Kaldik</span>
              <span className="text-[11px] text-slate-500 font-medium">27 agenda resmi</span>
            </button>
          )}

          {onResetGallery && (
            <button
              type="button"
              onClick={() => {
                if (confirm('🔄 Reset Galeri Foto ke 8 foto dokumentasi standar?')) {
                  onResetGallery();
                  showToast('🔄 Galeri Foto berhasil direset!');
                }
              }}
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer active:scale-98"
            >
              <span className="text-lg block mb-0.5">📸</span>
              <span className="text-xs font-black text-slate-900 block">Reset Galeri</span>
              <span className="text-[11px] text-slate-500 font-medium">8 foto standar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
