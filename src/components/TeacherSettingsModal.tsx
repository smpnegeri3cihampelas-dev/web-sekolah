'use client';

import React, { useState, useEffect } from 'react';
import { AuthUserSession, getTeacherUsername } from '@/lib/elearningData';

interface TeacherSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUserSession | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

export default function TeacherSettingsModal({
  isOpen,
  onClose,
  currentUser,
  showToast
}: TeacherSettingsModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'profil' | 'keamanan'>('keamanan');

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setActiveTab('keamanan');
    }
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  const cleanNip = (currentUser.nipOrNisn || '').replace(/\s+/g, '');

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword.trim()) {
      showToast('⚠️ Silakan masukkan kata sandi saat ini!', 'warn');
      return;
    }

    if (!newPassword.trim()) {
      showToast('⚠️ Kata sandi baru tidak boleh kosong!', 'warn');
      return;
    }

    if (newPassword.trim().length < 4) {
      showToast('⚠️ Kata sandi baru minimal 4 karakter!', 'warn');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      showToast('⚠️ Konfirmasi kata sandi baru tidak cocok!', 'warn');
      return;
    }

    const teacherUsername = getTeacherUsername(currentUser);

    // Verify current active password
    let currentStoredPass = '';
    let map: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('smpn3_teacher_passwords');
        if (raw) {
          map = JSON.parse(raw);
          currentStoredPass = map[teacherUsername] || (cleanNip ? map[cleanNip] : '') || map[currentUser.name] || '';
        }
      } catch {}
    }

    const trimmedCurrent = currentPassword.trim();
    const isCurrentCorrect = currentStoredPass
      ? (trimmedCurrent === currentStoredPass || trimmedCurrent === 'guru123')
      : (trimmedCurrent === 'guru123' || trimmedCurrent === 'spentic2026' || trimmedCurrent === cleanNip);

    if (!isCurrentCorrect) {
      showToast('⚠️ Kata sandi saat ini salah! Masukkan sandi Anda dengan benar.', 'warn');
      return;
    }

    // Save newly changed password
    const newTrimmed = newPassword.trim();
    if (cleanNip && cleanNip !== '-') map[cleanNip] = newTrimmed;
    map[teacherUsername] = newTrimmed;
    if (currentUser.name) {
      map[currentUser.name] = newTrimmed;
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smpn3_teacher_passwords', JSON.stringify(map));
      } catch (err) {
        console.error(err);
      }
    }

    showToast(`✅ Kata sandi akun ${currentUser.name} berhasil diperbarui!`, 'success');
    onClose();
  };

  return (
    <div 
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      data-lenis-prevent-touch="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
    >
      <div 
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        className="w-full max-w-lg rounded-3xl bg-white border-2 border-slate-300 p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-900"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-xl shrink-0">
              ⚙️
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-950">
                Pengaturan Akun Guru
              </h3>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                Kelola profil & ubah kata sandi portal SIAP SPENTIC
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-bold flex items-center justify-center cursor-pointer border border-slate-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('keamanan')}
            className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'keamanan'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <span>🔑</span>
            <span>Ganti Kata Sandi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'profil'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <span>👤</span>
            <span>Identitas Akun</span>
          </button>
        </div>

        {/* Tab 1: Keamanan & Ganti Sandi */}
        {activeTab === 'keamanan' && (
          <form onSubmit={handleSavePassword} className="space-y-4 text-xs">
            {/* Account Badge */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-indigo-200 flex items-center justify-center text-lg shrink-0">
                👨‍🏫
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-950 truncate">{currentUser.name}</h4>
                <p className="text-[11px] font-mono text-indigo-900 font-bold mt-0.5">
                  NIP: {currentUser.nipOrNisn || '-'}
                </p>
              </div>
            </div>

            {/* Input: Current Password */}
            <div>
              <label className="text-slate-800 block mb-1.5 font-black text-xs">
                Kata Sandi Saat Ini *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi yang saat ini digunakan..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                *Jika belum pernah diubah, gunakan kata sandi awal: <span className="font-mono font-bold text-slate-700">guru123</span>
              </span>
            </div>

            {/* Input: New Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-800 font-black text-xs">
                  Kata Sandi Baru *
                </label>
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
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 4 karakter kombinasi..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>

            {/* Input: Confirm New Password */}
            <div>
              <label className="text-slate-800 block mb-1.5 font-black text-xs">
                Konfirmasi Kata Sandi Baru *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold border-2 border-slate-300 cursor-pointer shadow-xs active:scale-98"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98 transition-all flex items-center gap-1.5"
              >
                <span>💾 Simpan Sandi Baru</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Identitas Akun */}
        {activeTab === 'profil' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Nama Lengkap</span>
                <span className="font-black text-slate-950">{currentUser.name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">NIP / NUPTK</span>
                <span className="font-mono font-bold text-slate-900">{currentUser.nipOrNisn || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Mata Pelajaran</span>
                <span className="font-bold text-indigo-700">{currentUser.subject || 'Guru Mata Pelajaran'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Status Akun</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Aktif Terverifikasi
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Instansi</span>
                <span className="font-bold text-slate-900">SMP Negeri 3 Cihampelas</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              💡 <strong>Tips Keamanan:</strong> Jangan membagikan kata sandi akun Anda kepada siapapun. Jika Anda sewaktu-waktu lupa kata sandi yang telah Anda buat, segera hubungi Admin Sekolah untuk dilakukan pemulihan akses.
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold border-2 border-slate-300 cursor-pointer shadow-xs active:scale-98"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
