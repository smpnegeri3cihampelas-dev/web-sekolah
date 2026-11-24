'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Leader, Teacher, isTendikOrTu } from '@/lib/schoolData';
import { compressImage } from '@/lib/imageCompression';
import { getTeacherUsername, formatWhatsAppUrl } from '@/lib/elearningData';



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
        className="w-full max-w-2xl rounded-3xl bg-white border-2 border-slate-300 p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto"
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
          {/* Foto Profil Bersih & Minimalis */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200">
            <div className="relative shrink-0">
              <img 
                src={photo || '/teachers/default_avatar.svg'} 
                alt="Preview" 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-300 bg-white shadow-xs"
              />
              {photo && photo !== '/teachers/default_avatar.svg' && (
                <button
                  type="button"
                  onClick={() => setPhoto('/teachers/default_avatar.svg')}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs cursor-pointer"
                  title="Kembalikan ke avatar default"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black text-slate-800 block mb-1">Foto Profil Pimpinan</span>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-98 transition-all"
                >
                  <span>📷</span>
                  <span>{isCompressing ? 'Memproses...' : 'Upload Foto'}</span>
                </button>
                {photo && photo !== '/teachers/default_avatar.svg' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto('/teachers/default_avatar.svg');
                      showToast('🔄 Dikembalikan ke Foto Default.');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <span>🔄</span>
                    <span>Pakai Foto Default</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                    ✓ Foto Default Aktif
                  </span>
                )}
              </div>
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
// MATA PELAJARAN RESMI SMP & SELECTOR DROPDOWN
// =========================================================================
export interface SubjectOption {
  label: string;
  category: 'MIPA' | 'Bahasa' | 'Teknologi' | 'Sosial & Agama' | 'Olahraga & Seni' | 'Tata Usaha (TU)';
}

export const STANDARD_SMP_SUBJECTS: SubjectOption[] = [
  { label: 'Matematika', category: 'MIPA' },
  { label: 'Ilmu Pengetahuan Alam (IPA)', category: 'MIPA' },
  { label: 'Bahasa Indonesia', category: 'Bahasa' },
  { label: 'Bahasa Inggris', category: 'Bahasa' },
  { label: 'Bahasa Sunda', category: 'Bahasa' },
  { label: 'Ilmu Pengetahuan Sosial (IPS)', category: 'Sosial & Agama' },
  { label: 'Pendidikan Agama Islam & Budi Pekerti', category: 'Sosial & Agama' },
  { label: 'Pendidikan Pancasila & Kewarganegaraan', category: 'Sosial & Agama' },
  { label: 'Pendidikan Jasmani, Olahraga & Kesehatan', category: 'Olahraga & Seni' },
  { label: 'Informatika', category: 'Teknologi' },
  { label: 'Seni Budaya & Keterampilan (SBK)', category: 'Olahraga & Seni' },
  { label: 'Prakarya & Kewirausahaan', category: 'Teknologi' },
  { label: 'Bimbingan & Konseling (BK)', category: 'Sosial & Agama' },
  { label: 'Tata Usaha (TU) - Penata Layanan Operasional', category: 'Tata Usaha (TU)' },
  { label: 'Tata Usaha (TU) - Operator Layanan Operasional', category: 'Tata Usaha (TU)' },
  { label: 'Caraka - Operator Layanan Operasional', category: 'Tata Usaha (TU)' },
  { label: 'Tenaga Kependidikan / Tata Usaha (TU)', category: 'Tata Usaha (TU)' }
];

export function getCategoryForSubject(subjectName: string): 'MIPA' | 'Bahasa' | 'Teknologi' | 'Sosial & Agama' | 'Olahraga & Seni' | 'Tata Usaha (TU)' {
  const found = STANDARD_SMP_SUBJECTS.find(s => s.label.toLowerCase() === subjectName.toLowerCase());
  if (found) return found.category;
  
  const lower = subjectName.toLowerCase();
  if (lower.includes('tata usaha') || lower.includes('caraka') || lower.includes('tenaga kependidikan') || /\btu\b/.test(lower) || lower.includes('layanan operasional')) return 'Tata Usaha (TU)';
  if (lower.includes('matematika') || lower.includes('ipa') || lower.includes('sains') || lower.includes('fisika') || lower.includes('biologi')) return 'MIPA';
  if (lower.includes('inggris') || lower.includes('indonesia') || lower.includes('sunda') || lower.includes('bahasa')) return 'Bahasa';
  if (lower.includes('informatika') || lower.includes('komputer') || lower.includes('tik') || lower.includes('prakarya')) return 'Teknologi';
  if (lower.includes('pjok') || lower.includes('olahraga') || lower.includes('jasmani') || lower.includes('seni') || lower.includes('musik') || lower.includes('budaya')) return 'Olahraga & Seni';
  return 'Sosial & Agama';
}

function SubjectSelectInput({
  value,
  onChange
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const isPredefined = useMemo(() => {
    return STANDARD_SMP_SUBJECTS.some(s => s.label.toLowerCase() === value.trim().toLowerCase());
  }, [value]);

  const [selectedOption, setSelectedOption] = useState<string>(() => {
    if (!value) return '';
    return isPredefined ? value : 'LAINNYA';
  });

  const [customSubject, setCustomSubject] = useState<string>(() => {
    return isPredefined ? '' : value;
  });

  useEffect(() => {
    if (!value) {
      setSelectedOption('');
      setCustomSubject('');
      return;
    }
    const matched = STANDARD_SMP_SUBJECTS.find(s => s.label.toLowerCase() === value.trim().toLowerCase());
    if (matched) {
      setSelectedOption(matched.label);
      setCustomSubject('');
    } else {
      setSelectedOption('LAINNYA');
      setCustomSubject(value);
    }
  }, [value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedOption(val);
    if (val !== 'LAINNYA') {
      onChange(val);
    } else {
      onChange(customSubject);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomSubject(val);
    onChange(val);
  };

  return (
    <div>
      <label className="text-slate-800 block mb-1.5 font-extrabold text-xs">Mata Pelajaran / Tugas *</label>
      <select
        required
        value={selectedOption}
        onChange={handleSelectChange}
        className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs text-xs"
      >
        <option value="" disabled>-- Pilih Mata Pelajaran Resmi SMP --</option>
        <optgroup label="Mata Pelajaran Kurikulum SMP">
          {STANDARD_SMP_SUBJECTS.map((s) => (
            <option key={s.label} value={s.label}>
              {s.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="Khusus / Tambahan">
          <option value="LAINNYA">✏️ Lainnya / Tulis Mata Pelajaran Khusus...</option>
        </optgroup>
      </select>

      {selectedOption === 'LAINNYA' && (
        <div className="mt-2 animate-[fadeIn_0.15s_ease-out]">
          <input
            type="text"
            required
            autoFocus
            value={customSubject}
            onChange={handleCustomChange}
            placeholder="Tulis nama mapel atau tugas tambahan (contoh: PABP & Bahasa Sunda)..."
            className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-400 text-xs"
          />
          <p className="text-[10px] text-slate-500 font-semibold mt-1">
            Gunakan opsi ini jika guru mengampu mapel gabungan atau tugas khusus.
          </p>
        </div>
      )}
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
  const [role, setRole] = useState('');
  const [nip, setNip] = useState('');
  const [nuptk, setNuptk] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('PNS');
  const [photo, setPhoto] = useState('/teachers/default_avatar.svg');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSubject('');
      setRole('');
      setNip('');
      setNuptk('');
      setPhone('');
      setStatus('PNS');
      setPhoto('/teachers/default_avatar.svg');
      setIsCompressing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isSelectedTendik = isTendikOrTu({
    category: getCategoryForSubject(subject),
    subject,
    status
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      showToast('⏳ Mengompres foto...');
      const compressed = await compressImage(file, 800, 0.85);
      setPhoto(compressed);
      showToast('✅ Foto berhasil dimuat.');
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
      showToast('⚠️ Nama lengkap wajib diisi!');
      return;
    }

    const finalSubject = subject.trim() || 'Guru Mata Pelajaran';
    const finalCategory = getCategoryForSubject(finalSubject);
    const isTendik = isTendikOrTu({ category: finalCategory, subject: finalSubject, status });
    const generatedUsername = isTendik ? undefined : getTeacherUsername({ name: name.trim() });

    // Auto-seed default password guru123 into smpn3_teacher_passwords map (only for teachers)
    if (!isTendik && generatedUsername && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('smpn3_teacher_passwords');
        const map = raw ? JSON.parse(raw) : {};
        map[generatedUsername] = 'guru123';
        if (nip.trim() && nip.trim() !== '-') {
          map[nip.trim().replace(/\s+/g, '')] = 'guru123';
        }
        map[name.trim()] = 'guru123';
        localStorage.setItem('smpn3_teacher_passwords', JSON.stringify(map));
      } catch (err) {
        console.error('Failed auto-seeding password', err);
      }
    }

    onAdd({
      name: name.trim(),
      username: generatedUsername,
      phone: phone.trim() || undefined,
      subject: finalSubject,
      nip: nip.trim() || '-',
      nuptk: nuptk.trim() || undefined,
      status,
      photo,
      active: true,
      category: finalCategory,
      role: role.trim() || finalSubject,
      quote: isTendik
        ? 'Melayani administrasi dan operasional sekolah secara tertib dan akuntabel.'
        : 'Mendidik dengan keteladanan dan budi pekerti luhur.'
    });
    showToast(
      isTendik
        ? `✅ Staf TU "${name}" berhasil ditambahkan (Tanpa Akun Login)!`
        : `👨‍🏫 Guru baru "${name}" & Akun @${generatedUsername} berhasil dibuat!`
    );
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
        className="w-full max-w-2xl rounded-3xl bg-white border-2 border-slate-300 p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200 mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-950">Tambah Guru / Pendidik Baru</h3>
            <p className="text-xs text-slate-600 font-bold mt-0.5">Daftarkan pendidik baru ke database sekolah</p>
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
          {/* Foto Profil Bersih & Minimalis */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200">
            <div className="relative shrink-0">
              <img 
                src={photo || '/teachers/default_avatar.svg'} 
                alt="Preview" 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-300 bg-white shadow-xs"
              />
              {photo && photo !== '/teachers/default_avatar.svg' && (
                <button
                  type="button"
                  onClick={() => setPhoto('/teachers/default_avatar.svg')}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs cursor-pointer"
                  title="Kembalikan ke avatar default"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black text-slate-800 block mb-1">Foto Profil</span>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-98 transition-all"
                >
                  <span>📷</span>
                  <span>{isCompressing ? 'Memproses...' : 'Upload Foto'}</span>
                </button>
                {photo && photo !== '/teachers/default_avatar.svg' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto('/teachers/default_avatar.svg');
                      showToast('🔄 Dikembalikan ke Foto Default.');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <span>🔄</span>
                    <span>Pakai Foto Default</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                    ✓ Foto Default Aktif
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Nama Lengkap & Gelar */}
          <div>
            <label className="text-slate-800 block mb-1.5 font-extrabold text-xs">Nama Lengkap & Gelar *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Hendra Gunawan, S.Pd., M.M."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-400"
            />
          </div>

          {/* Dropdown Mata Pelajaran dengan Opsi Lainnya */}
          <SubjectSelectInput value={subject} onChange={setSubject} />

          {/* Jabatan / Tugas Tambahan (Tampil di Struktur Organisasi) */}
          {!isSelectedTendik && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-800 font-extrabold text-xs">
                  Jabatan / Tugas Tambahan (Tampil di Struktur Organisasi)
                </label>
                <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  Opsional
                </span>
              </div>
              <input
                type="text"
                list="structural-role-presets-add"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Kosongkan jika guru mapel biasa, atau isi misal: Kepala Lab IPA / Pembina OSIS"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-400"
              />
              <datalist id="structural-role-presets-add">
                <option value="Kepala Lab IPA" />
                <option value="Staf Lab IPA" />
                <option value="Ka. Perpustakaan" />
                <option value="Staf Perpustakaan" />
                <option value="Pembina OSIS" />
                <option value="Pembina PMR" />
                <option value="Pembina Keputrian" />
              </datalist>
            </div>
          )}

          {/* Grid 2 Kolom: NIP & NUPTK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-800 block mb-1.5 font-extrabold text-xs">NIP</label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="Boleh kosong jika non-NIP"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="text-slate-800 block mb-1.5 font-extrabold text-xs">NUPTK</label>
              <input
                type="text"
                value={nuptk}
                onChange={(e) => setNuptk(e.target.value)}
                placeholder="Boleh kosong jika belum ada"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Grid 2 Kolom: Status Kepegawaian & Nomor WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-800 block mb-1.5 font-extrabold text-xs">Status Kepegawaian</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
              >
                <option value="PNS">PNS</option>
                <option value="PPPK">PPPK</option>
                <option value="PPPK PW">PPPK PW</option>
                <option value="GTT / Honorer">GTT / Honorer</option>
                <option value="Tenaga Kependidikan">Tenaga Kependidikan</option>
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-800 font-extrabold text-xs">Nomor WhatsApp</label>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Opsional
                </span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Ringkas: Akun E-Learning Otomatis vs Staf TU Tanpa Akun */}
          {isSelectedTendik ? (
            <div className="p-3 rounded-2xl bg-slate-100 border-2 border-slate-300 text-xs flex items-center justify-between text-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🗂️</span>
                <span className="font-bold">Staf Tata Usaha (TU) / Tenaga Kependidikan:</span>
              </div>
              <span className="text-[11px] font-extrabold text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-300">
                Disimpan ke Direktori GTK (Tanpa Akun Login E-Learning)
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-indigo-50/80 border-2 border-indigo-200 text-xs flex items-center justify-between text-indigo-950 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <span className="font-semibold">Akun Login E-Learning:</span>
                <span className="font-mono font-black text-indigo-800 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
                  @{name.trim() ? getTeacherUsername({ name: name.trim() }) : 'username'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Sandi Awal: <strong className="font-mono text-slate-900">guru123</strong>
              </div>
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold cursor-pointer transition-colors active:scale-98"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98 transition-all"
            >
              {isSelectedTendik ? 'Simpan Staf TU Baru' : 'Simpan Guru Baru'}
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
  const [role, setRole] = useState('');
  const [nip, setNip] = useState('');
  const [nuptk, setNuptk] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('PNS');
  const [photo, setPhoto] = useState('/teachers/default_avatar.svg');
  const [active, setActive] = useState(true);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (teacher) {
      setName(teacher.name || '');
      setSubject(teacher.subject || '');
      setRole(
        teacher.role &&
          teacher.role.toLowerCase() !== (teacher.subject || '').toLowerCase() &&
          !teacher.role.toLowerCase().startsWith('guru ')
          ? teacher.role
          : ''
      );
      setNip(teacher.nip || '');
      setNuptk(teacher.nuptk || '');
      setPhone(teacher.phone || '');
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
      showToast('⏳ Mengompres foto...');
      const compressed = await compressImage(file, 800, 0.85);
      setPhoto(compressed);
      showToast('✅ Foto berhasil dimuat.');
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
      showToast('⚠️ Nama lengkap wajib diisi!');
      return;
    }

    const finalSubject = subject.trim() || 'Guru Mata Pelajaran';
    const finalCategory = getCategoryForSubject(finalSubject);
    const isTendik = isTendikOrTu({ category: finalCategory, subject: finalSubject, status });

    onSave(teacher.id, {
      name: name.trim(),
      username: isTendik ? undefined : getTeacherUsername({ name: name.trim() }),
      subject: finalSubject,
      category: finalCategory,
      role: role.trim() || finalSubject,
      nip: nip.trim(),
      nuptk: nuptk.trim() || undefined,
      phone: phone.trim() || undefined,
      status,
      photo,
      active
    });
    showToast(`✅ Data "${name}" tersimpan!`);
    onClose();
  };

  const isSelectedTendik = isTendikOrTu({
    category: getCategoryForSubject(subject.trim() || 'Guru Mata Pelajaran'),
    subject,
    status
  });

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
        className="w-full max-w-2xl rounded-3xl bg-white border-2 border-slate-300 p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200 mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-950">Ubah Data & Foto Guru</h3>
            <p className="text-xs text-slate-600 font-bold mt-0.5">Kelola identitas pendidik</p>
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
          {/* Foto Profil Bersih & Minimalis */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200">
            <div className="relative shrink-0">
              <img 
                src={photo || '/teachers/default_avatar.svg'} 
                alt="Preview" 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-300 bg-white shadow-xs"
              />
              {photo && photo !== '/teachers/default_avatar.svg' && (
                <button
                  type="button"
                  onClick={() => setPhoto('/teachers/default_avatar.svg')}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs cursor-pointer"
                  title="Kembalikan ke avatar default"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black text-slate-800 block mb-1">Foto Profil</span>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-98 transition-all"
                >
                  <span>📷</span>
                  <span>{isCompressing ? 'Memproses...' : 'Upload Foto'}</span>
                </button>
                {photo && photo !== '/teachers/default_avatar.svg' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto('/teachers/default_avatar.svg');
                      showToast('🔄 Dikembalikan ke Foto Default.');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <span>🔄</span>
                    <span>Pakai Foto Default</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                    ✓ Foto Default Aktif
                  </span>
                )}
              </div>
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

          {/* Dropdown Mata Pelajaran dengan Opsi Lainnya */}
          <SubjectSelectInput value={subject} onChange={setSubject} />

          {/* Jabatan / Tugas Tambahan (Tampil di Struktur Organisasi) */}
          {!isSelectedTendik && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-800 font-extrabold text-xs">
                  Jabatan / Tugas Tambahan (Tampil di Struktur Organisasi)
                </label>
                <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  Opsional
                </span>
              </div>
              <input
                type="text"
                list="structural-role-presets-add"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Kosongkan jika guru mapel biasa, atau isi misal: Kepala Lab IPA / Pembina OSIS"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-400"
              />
              <datalist id="structural-role-presets-add">
                <option value="Kepala Lab IPA" />
                <option value="Staf Lab IPA" />
                <option value="Ka. Perpustakaan" />
                <option value="Staf Perpustakaan" />
                <option value="Pembina OSIS" />
                <option value="Pembina PMR" />
                <option value="Pembina Keputrian" />
              </datalist>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-800 block mb-1.5 font-extrabold">NIP</label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="Boleh kosong jika non-NIP"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
            <div>
              <label className="text-slate-800 block mb-1.5 font-extrabold">NUPTK</label>
              <input
                type="text"
                value={nuptk}
                onChange={(e) => setNuptk(e.target.value)}
                placeholder="Boleh kosong jika belum ada"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-800 block mb-1.5 font-extrabold">Nomor WhatsApp</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
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
                <option value="PPPK PW">PPPK PW</option>
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
                <option value="true">● Aktif Mengajar / Bertugas</option>
                <option value="false">○ Mutasi / Nonaktif</option>
              </select>
            </div>
          </div>

          {isSelectedTendik && (
            <div className="p-3 rounded-2xl bg-slate-100 border-2 border-slate-300 text-xs flex items-center justify-between text-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🗂️</span>
                <span className="font-bold">Staf Tata Usaha (TU) / Tenaga Kependidikan</span>
              </div>
              <span className="text-[11px] font-extrabold text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-300">
                Tanpa Akun Login E-Learning
              </span>
            </div>
          )}

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
  onSaveTeacher?: (teacherId: number, data: Partial<Teacher>) => void;
}

export function ResetTeacherPasswordModal({
  isOpen,
  teacher,
  onClose,
  showToast,
  onSaveTeacher
}: ResetTeacherPasswordModalProps) {
  const [password, setPassword] = useState('guru123');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const cleanNip = (teacher?.nip || '').replace(/\s+/g, '');
  const teacherUsername = teacher ? getTeacherUsername(teacher) : 'guru';

  useEffect(() => {
    if (teacher && isOpen) {
      setPhone(teacher.phone || '');
      let currentPass = '';
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('smpn3_teacher_passwords');
          if (raw) {
            const map = JSON.parse(raw);
            currentPass = map[teacherUsername] || map[cleanNip] || map[teacher.id] || '';
          }
        } catch {}
      }
      setPassword(teacher.password || currentPass || 'guru123');
      setShowPassword(false);
      setHasCopied(false);
    }
  }, [teacher, isOpen, cleanNip, teacherUsername]);

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
        map[teacherUsername] = password.trim();
        map[teacher.name] = password.trim();
        map[teacher.id] = password.trim();
        localStorage.setItem('smpn3_teacher_passwords', JSON.stringify(map));
      } catch {}
    }

    if (onSaveTeacher && teacher) {
      onSaveTeacher(teacher.id, { 
        password: password.trim(),
        phone: phone.trim() || undefined 
      });
    }

    showToast(`🔑 Kata sandi akun "${teacher.name}" berhasil diperbarui!`);
  };

  const shareMessage = `Yth. Bapak/Ibu ${teacher.name},
Berikut informasi akun masuk portal SIAP SPENTIC Anda:
• Username Masuk : ${teacherUsername}
• Kata Sandi     : ${password}
• Tautan Masuk   : https://smpn3cihampelas.sch.id/elearning

Silakan gunakan username dan kata sandi di atas untuk masuk.
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
    const url = formatWhatsAppUrl(phone, shareMessage);
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
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-mono text-indigo-900 font-bold">
                NIP: {teacher.nip || '-'}
              </span>
              <span className="text-[11px] font-mono font-bold bg-white text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200 shadow-xs">
                Username: @{teacherUsername}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium truncate mt-1">
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

            {/* Target WhatsApp Phone Number */}
            <div className="pt-1 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-800 font-extrabold text-xs block">
                  Nomor WhatsApp Guru:
                </label>
                {phone.trim() ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ✓ Chat Personal Langsung
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Pilih Kontak di WhatsApp
                  </span>
                )}
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890 (Ketik untuk kirim langsung ke nomor guru)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-xs font-bold focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 shadow-xs placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-500 font-medium">
                *Jika diisi, klik Simpan akan menyimpan nomor HP guru ke sistem dan tombol hijau langsung membuka chat personal ke nomor tersebut.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-800 font-extrabold transition-all cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-1.5 text-xs"
              >
                <span>{hasCopied ? '✅ Tersalin' : '📋 Salin Pesan'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold transition-all cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-1.5 text-xs"
              >
                <span>💬</span>
                <span>{phone.trim() ? `Kirim ke WA (${phone.trim()})` : 'Buka WhatsApp'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

