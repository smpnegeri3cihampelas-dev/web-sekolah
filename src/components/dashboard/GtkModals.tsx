'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Leader, Teacher } from '@/lib/schoolData';
import { compressImage } from '@/lib/imageCompression';

export const GTK_PHOTO_PRESETS = [
  { label: 'Avatar Default', src: '/teachers/default_avatar.svg' },
  { label: 'Foto Guru 1', src: '/teachers/teacher_1.jpg' },
  { label: 'Foto Guru 2', src: '/teachers/teacher_2.jpg' },
  { label: 'Foto Guru 3', src: '/teachers/teacher_3.jpg' }
];

// =========================================================================
// MODAL: EDIT PIMPINAN (KEPALA SEKOLAH / WAKASEK)
// =========================================================================
interface EditLeaderModalProps {
  isOpen: boolean;
  leader: Leader | null;
  onClose: () => void;
  onSave: (leaderId: number, data: Partial<Leader>) => void;
  showToast: (msg: string) => void;
}

export function EditLeaderModal({ isOpen, leader, onClose, onSave, showToast }: EditLeaderModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [nip, setNip] = useState('');
  const [quote, setQuote] = useState('');
  const [photo, setPhoto] = useState('/teachers/default_avatar.svg');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (leader) {
      setName(leader.name || '');
      setRole(leader.role || '');
      setNip(leader.nip || '');
      setQuote(leader.quote || '');
      setPhoto(leader.photo || '/teachers/default_avatar.svg');
      setIsCompressing(false);
    }
  }, [leader]);

  if (!isOpen || !leader) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      showToast('⏳ Mengompres foto pimpinan...');
      const compressed = await compressImage(file, 800, 0.85);
      setPhoto(compressed);
      showToast('✅ Foto pimpinan berhasil dimuat.');
    } catch {
      showToast('❌ Gagal memproses foto.');
    } finally {
      setIsCompressing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('⚠️ Nama lengkap pimpinan wajib diisi!');
      return;
    }

    onSave(leader.id, {
      name: name.trim(),
      role: role.trim(),
      nip: nip.trim(),
      quote: quote.trim(),
      photo
    });
    showToast(`✅ Data pimpinan "${name}" tersimpan & tampil di Landing Page!`);
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
        className="w-full max-w-lg rounded-3xl bg-white border-2 border-slate-300 p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100 mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-950">Ubah Data / Ganti Pimpinan</h3>
            <p className="text-xs text-indigo-700 font-extrabold mt-0.5">Jabatan: {leader.role}</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-bold flex items-center justify-center cursor-pointer border border-slate-300 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Photo Selector */}
          <div>
            <label className="text-slate-800 block mb-1.5 font-black text-xs">Foto Profil Pimpinan</label>
            <div className="flex items-center gap-3.5 mb-3">
              <img 
                src={photo || '/teachers/default_avatar.svg'} 
                alt="Preview" 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-300 shadow-xs flex-shrink-0 bg-slate-100"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-2 border-indigo-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <span>📷</span>
                    <span>{isCompressing ? 'Memproses...' : 'Upload dari Perangkat'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  placeholder="Atau tempel URL gambar..."
                  className="w-full px-3 py-1.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-[11px] font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-700 font-black">Pilihan Cepat:</span>
              {GTK_PHOTO_PRESETS.map((p) => (
                <button
                  key={p.src}
                  type="button"
                  onClick={() => setPhoto(p.src)}
                  className={`px-3 py-1.5 rounded-lg border-2 text-xs flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                    photo === p.src
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-black'
                      : 'border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <img src={p.src} alt={p.label} className="w-4 h-4 rounded-full object-cover" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-800 block mb-1.5 font-black text-xs">Nama Lengkap & Gelar Pimpinan *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Dr. H. Ahmad Fauzi, M.Pd."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-800 block mb-1.5 font-black text-xs">Jabatan Pimpinan *</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
            <div>
              <label className="text-slate-800 block mb-1.5 font-black text-xs">NIP / NUPTK</label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="19740512..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-800 block mb-1.5 font-black text-xs">Kutipan Visi / Pesan Pimpinan</label>
            <textarea
              rows={3}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Kutipan arahan pimpinan yang tampil pada website..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 resize-none shadow-xs"
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
            >
              Simpan Perubahan Pimpinan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// MODAL: TAMBAH GURU BARU
// =========================================================================
interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (teacher: Omit<Teacher, 'id'>) => void;
  showToast: (msg: string) => void;
}

export function AddTeacherModal({ isOpen, onClose, onAdd, showToast }: AddTeacherModalProps) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [nip, setNip] = useState('');
  const [status, setStatus] = useState('PNS');
  const [photo, setPhoto] = useState('/teachers/default_avatar.svg');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSubject('');
      setNip('');
      setStatus('PNS');
      setPhoto('/teachers/default_avatar.svg');
      setIsCompressing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      showToast('⏳ Mengompres foto guru...');
      const compressed = await compressImage(file, 800, 0.85);
      setPhoto(compressed);
      showToast('✅ Foto guru berhasil dimuat.');
    } catch {
      showToast('❌ Gagal memproses foto.');
    } finally {
      setIsCompressing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('⚠️ Nama lengkap guru wajib diisi!');
      return;
    }

    onAdd({
      name: name.trim(),
      subject: subject.trim() || 'Guru Mata Pelajaran',
      nip: nip.trim() || '-',
      status,
      photo,
      active: true,
      category: 'MIPA',
      role: subject.trim() || 'Guru Mata Pelajaran',
      quote: 'Mendidik dengan keteladanan dan budi pekerti luhur.'
    });
    showToast(`👨‍🏫 Guru baru "${name}" berhasil ditambahkan!`);
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
        className="w-full max-w-md rounded-3xl bg-white border-2 border-slate-300 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200 mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-950">Tambah Guru / Pendidik Baru</h3>
            <p className="text-xs text-slate-700 font-bold mt-0.5">Daftarkan guru baru ke database sekolah</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-bold flex items-center justify-center border border-slate-300 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Photo Selector */}
          <div>
            <label className="text-slate-800 block mb-1.5 font-extrabold">Foto Profil Guru</label>
            <div className="flex items-center gap-3 mb-2.5">
              <img 
                src={photo || '/teachers/default_avatar.svg'} 
                alt="Preview" 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-300 shadow-sm flex-shrink-0 bg-slate-100"
              />
              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-2 border-indigo-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <span>📷</span>
                  <span>{isCompressing ? 'Memproses...' : 'Upload dari Perangkat'}</span>
                </button>
                <input
                  type="text"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  placeholder="Atau link foto..."
                  className="w-full px-3 py-1.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-[11px] font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-700 font-extrabold">Preset:</span>
              {GTK_PHOTO_PRESETS.map((p) => (
                <button
                  key={p.src}
                  type="button"
                  onClick={() => setPhoto(p.src)}
                  className={`px-2 py-1 rounded-lg border-2 text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                    photo === p.src
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-black'
                      : 'border-slate-300 bg-slate-100 text-slate-800 font-bold hover:bg-slate-200'
                  }`}
                >
                  <img src={p.src} alt={p.label} className="w-4 h-4 rounded-full object-cover" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-800 block mb-1.5 font-extrabold">Nama Lengkap & Gelar *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Hendra Gunawan, S.Pd., M.M."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="text-slate-800 block mb-1.5 font-extrabold">Mata Pelajaran / Tugas *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Contoh: Ilmu Pengetahuan Sosial (IPS)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-800 block mb-1.5 font-extrabold">NIP / NUPTK</label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="Boleh kosong jika GTT"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="text-slate-800 block mb-1.5 font-extrabold">Status Kepegawaian</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
              >
                <option value="PNS">PNS</option>
                <option value="PPPK">PPPK</option>
                <option value="GTT / Honorer">GTT / Honorer</option>
                <option value="Tenaga Kependidikan">Tenaga Kependidikan</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98 transition-all"
            >
              Simpan Guru Baru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// MODAL: EDIT GURU
// =========================================================================
interface EditTeacherModalProps {
  isOpen: boolean;
  teacher: Teacher | null;
  onClose: () => void;
  onSave: (teacherId: number, data: Partial<Teacher>) => void;
  onDelete?: (teacherId: number) => void;
  showToast: (msg: string) => void;
}

export function EditTeacherModal({ isOpen, teacher, onClose, onSave, onDelete, showToast }: EditTeacherModalProps) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [nip, setNip] = useState('');
  const [status, setStatus] = useState('PNS');
  const [photo, setPhoto] = useState('/teachers/default_avatar.svg');
  const [active, setActive] = useState(true);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (teacher) {
      setName(teacher.name || '');
      setSubject(teacher.subject || '');
      setNip(teacher.nip || '');
      setStatus(teacher.status || 'PNS');
      setPhoto(teacher.photo || '/teachers/default_avatar.svg');
      setActive(teacher.active !== false);
      setIsCompressing(false);
    }
  }, [teacher]);

  if (!isOpen || !teacher) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      showToast('⏳ Mengompres foto guru...');
      const compressed = await compressImage(file, 800, 0.85);
      setPhoto(compressed);
      showToast('✅ Foto guru berhasil dimuat.');
    } catch {
      showToast('❌ Gagal memproses foto.');
    } finally {
      setIsCompressing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('⚠️ Nama lengkap guru wajib diisi!');
      return;
    }

    onSave(teacher.id, {
      name: name.trim(),
      subject: subject.trim(),
      nip: nip.trim(),
      status,
      photo,
      active
    });
    showToast(`✅ Data guru "${name}" tersimpan!`);
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
        className="w-full max-w-md rounded-3xl bg-white border-2 border-slate-300 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200 mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-950">Ubah Data & Foto Guru</h3>
            <p className="text-xs text-slate-700 font-bold mt-0.5">Kelola identitas pendidik</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-bold flex items-center justify-center border border-slate-300 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Photo Selector */}
          <div>
            <label className="text-slate-800 block mb-1.5 font-extrabold">Foto Profil Guru</label>
            <div className="flex items-center gap-3 mb-2.5">
              <img 
                src={photo || '/teachers/default_avatar.svg'} 
                alt="Preview" 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-300 shadow-sm flex-shrink-0 bg-slate-100"
              />
              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-2 border-indigo-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <span>📷</span>
                  <span>{isCompressing ? 'Memproses...' : 'Upload dari Perangkat'}</span>
                </button>
                <input
                  type="text"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  placeholder="Atau link foto..."
                  className="w-full px-3 py-1.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-[11px] font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-700 font-extrabold">Pilihan Cepat:</span>
              {GTK_PHOTO_PRESETS.map((p) => (
                <button
                  key={p.src}
                  type="button"
                  onClick={() => setPhoto(p.src)}
                  className={`px-2 py-1 rounded-lg border-2 text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                    photo === p.src
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-black'
                      : 'border-slate-300 bg-slate-100 text-slate-800 font-bold hover:bg-slate-200'
                  }`}
                >
                  <img src={p.src} alt={p.label} className="w-4 h-4 rounded-full object-cover" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-800 block mb-1.5 font-extrabold">Nama Lengkap & Gelar *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
            />
          </div>

          <div>
            <label className="text-slate-800 block mb-1.5 font-extrabold">Mata Pelajaran / Tugas *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-800 block mb-1.5 font-extrabold">Status Kepegawaian</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
              >
                <option value="PNS">PNS</option>
                <option value="PPPK">PPPK</option>
                <option value="GTT / Honorer">GTT / Honorer</option>
                <option value="Tenaga Kependidikan">Tenaga Kependidikan</option>
              </select>
            </div>
            <div>
              <label className="text-slate-800 block mb-1.5 font-extrabold">Status Keaktifan</label>
              <select
                value={active ? 'true' : 'false'}
                onChange={(e) => setActive(e.target.value === 'true')}
                className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
              >
                <option value="true">● Aktif Mengajar</option>
                <option value="false">○ Mutasi / Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t-2 border-slate-200">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Yakin ingin menghapus guru "${teacher.name}"?`)) {
                    onDelete(teacher.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 font-extrabold cursor-pointer transition-colors text-xs active:scale-98"
              >
                🗑️ Hapus
              </button>
            ) : <span />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98 transition-all"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// MODAL: RESET PASSWORD AKUN GURU (E-LEARNING / SIAP SPENTIC)
// =========================================================================
interface ResetTeacherPasswordModalProps {
  isOpen: boolean;
  teacher: Teacher | null;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export function ResetTeacherPasswordModal({
  isOpen,
  teacher,
  onClose,
  showToast
}: ResetTeacherPasswordModalProps) {
  const [password, setPassword] = useState('guru123');
  const [showPassword, setShowPassword] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const cleanNip = (teacher?.nip || '').replace(/\s+/g, '');

  useEffect(() => {
    if (teacher && isOpen) {
      let currentPass = '';
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('smpn3_teacher_passwords');
          if (raw) {
            const map = JSON.parse(raw);
            currentPass = map[cleanNip] || map[teacher.id] || '';
          }
        } catch {}
      }
      setPassword(currentPass || 'guru123');
      setShowPassword(false);
      setHasCopied(false);
    }
  }, [teacher, isOpen, cleanNip]);

  if (!isOpen || !teacher) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      showToast('⚠️ Kata sandi tidak boleh kosong!');
      return;
    }
    if (password.length < 4) {
      showToast('⚠️ Kata sandi minimal harus 4 karakter!');
      return;
    }

    if (typeof window !== 'undefined') {
      try {
        let map: Record<string, string> = {};
        const raw = localStorage.getItem('smpn3_teacher_passwords');
        if (raw) map = JSON.parse(raw);
        if (cleanNip && cleanNip !== '-') map[cleanNip] = password.trim();
        map[teacher.name] = password.trim();
        map[teacher.id] = password.trim();
        localStorage.setItem('smpn3_teacher_passwords', JSON.stringify(map));
      } catch {}
    }

    showToast(`🔑 Kata sandi akun "${teacher.name}" berhasil diperbarui!`);
  };

  const shareMessage = `Yth. Bapak/Ibu ${teacher.name},
Berikut informasi akun masuk portal SIAP SPENTIC Anda:
• Akun Guru      : ${teacher.name}
• Kata Sandi Baru: ${password}
• Tautan Masuk   : https://smpn3cihampelas.sch.id/elearning

Petunjuk Masuk:
1. Buka tautan di atas dan pilih nama Anda pada daftar akun guru.
2. Masukkan kata sandi baru Anda.

Silakan simpan kata sandi ini dengan baik.
— Admin SMP Negeri 3 Cihampelas`;

  const handleCopyMessage = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareMessage);
      setHasCopied(true);
      showToast('📋 Info akun berhasil disalin! Silakan kirimkan ke WhatsApp guru.');
      setTimeout(() => setHasCopied(false), 3000);
    }
  };

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
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
        className="w-full max-w-lg rounded-3xl bg-white border-2 border-slate-300 p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-xl shrink-0">
              🔑
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-950">
                Reset Kata Sandi Akun Guru
              </h3>
              <p className="text-xs text-slate-600 font-bold mt-0.5">
                Akses portal e-learning & presensi SIAP SPENTIC
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

        {/* Teacher Identity Badge */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 mb-5 flex items-center gap-3.5">
          <img
            src={teacher.photo || '/teachers/default_avatar.svg'}
            alt={teacher.name}
            className="w-12 h-12 rounded-xl object-cover border border-indigo-200 bg-white shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black text-slate-950 truncate">{teacher.name}</h4>
            <p className="text-xs font-mono text-indigo-900 font-bold mt-0.5">
              NIP: {teacher.nip || '-'}
            </p>
            <p className="text-[11px] text-slate-600 font-medium truncate">
              Mapel: {teacher.subject}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
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
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi baru untuk guru..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold font-mono focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-600 block">Pilihan Cepat Standar:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPassword('guru123')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-[11px] border border-slate-300 transition-colors cursor-pointer"
              >
                guru123
              </button>
              {cleanNip && cleanNip !== '-' && (
                <button
                  type="button"
                  onClick={() => setPassword(cleanNip)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-[11px] border border-slate-300 transition-colors cursor-pointer"
                >
                  NIP Lengkap
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
                  setPassword(randomPin);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-mono font-bold text-[11px] border border-indigo-200 transition-colors cursor-pointer"
              >
                🎲 Acak PIN 6 Angka
              </button>
            </div>
          </div>

          {/* Action to Save */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>💾 Simpan Kata Sandi Ini</span>
            </button>
          </div>

          {/* Share Box for WhatsApp */}
          <div className="pt-3 border-t-2 border-slate-100 space-y-2">
            <label className="text-slate-800 font-black text-xs block">
              Kirimkan Akses ke Guru (WhatsApp):
            </label>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px] leading-relaxed select-all">
              {shareMessage}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-800 font-extrabold transition-all cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-1.5"
              >
                <span>{hasCopied ? '✅ Tersalin' : '📋 Salin Pesan'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold transition-all cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-1.5"
              >
                <span>💬 Buka WhatsApp</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

