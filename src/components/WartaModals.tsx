'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WartaItem } from '@/lib/wartaData';

export const WARTA_PHOTO_PRESETS = [
  { label: 'Gedung & Lapangan', src: '/slide4.jpeg' },
  { label: 'Pagi & Pegunungan', src: '/slide2.jpeg' },
  { label: 'Upacara Bendera', src: '/slide1.jpeg' },
  { label: 'Kegiatan Siswa', src: '/slide5.jpeg' },
  { label: 'Pramuka & Senam', src: '/slide6.jpeg' },
  { label: 'Turnamen Basket', src: '/gallery_2.jpg' },
  { label: 'Laboratorium Sains', src: '/gallery_1.jpg' }
];

/**
 * Kompresi gambar client-side via HTML5 Canvas agar ringan dan cepat (anti-lag)
 */
function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    // Jika bukan file gambar atau format SVG/GIF, langsung baca apa adanya
    if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Hasilkan JPEG berukuran kecil (~100KB)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// =========================================================================
// MODAL TAMBAH WARTA (ISOLASI STATE AGAR TIDAK ME-RENDER ULANG DASHBOARD)
// =========================================================================
interface AddNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: Omit<WartaItem, 'id'>) => void;
  showToast: (msg: string) => void;
}

export function AddNewsModal({ isOpen, onClose, onAdd, showToast }: AddNewsModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Prestasi');
  const [excerpt, setExcerpt] = useState('');
  const [image, setImage] = useState('/slide4.jpeg');
  const [status, setStatus] = useState<'Published' | 'Draft'>('Published');
  const [isCompressing, setIsCompressing] = useState(false);

  // Reset form ketika modal dibuka
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setCategory('Prestasi');
      setExcerpt('');
      setImage('/slide4.jpeg');
      setStatus('Published');
      setIsCompressing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('⚠️ Ukuran berkas gambar maksimal 10MB');
      return;
    }

    try {
      setIsCompressing(true);
      const optimizedBase64 = await compressImage(file, 1200, 0.8);
      setImage(optimizedBase64);
      showToast('🖼️ Foto warta dioptimalkan & berhasil diunggah!');
    } catch (err) {
      console.error(err);
      showToast('⚠️ Gagal memproses gambar');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd({
      title: title.trim(),
      category,
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      views: '1',
      status,
      src: image,
      excerpt: excerpt.trim()
    });

    onClose();
    showToast(`✅ Warta "${title.substring(0, 30)}..." berhasil diterbitkan!`);
  };

  return (
    <div 
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      data-lenis-prevent-touch="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
    >
      <div 
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        className="w-full max-w-lg rounded-3xl bg-white border-2 border-slate-300 p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100 mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-950">Tulis Warta Baru</h3>
            <p className="text-xs text-slate-600 font-bold mt-0.5">Warta otomatis tampil di Bento Grid &amp; Katalog</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-bold flex items-center justify-center cursor-pointer border border-slate-300 transition-colors"
            title="Tutup Modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Judul Warta */}
          <div>
            <label className="text-slate-800 block mb-1.5 font-black text-xs">Judul Warta *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Prestasi Gemilang Siswa SMPN 3 Cihampelas..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs transition-all"
            />
          </div>

          {/* Kategori & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-800 block mb-1.5 font-black text-xs">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
              >
                <option value="Prestasi">Prestasi</option>
                <option value="Pengumuman">Pengumuman</option>
                <option value="Kegiatan">Kegiatan</option>
                <option value="Inovasi">Inovasi</option>
                <option value="Akademik">Akademik</option>
              </select>
            </div>
            <div>
              <label className="text-slate-800 block mb-1.5 font-black text-xs">Status Publikasi</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Published' | 'Draft')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
              >
                <option value="Published">Publikasikan (Tayang)</option>
                <option value="Draft">Draf (Disimpan Dulu)</option>
              </select>
            </div>
          </div>

          {/* Foto Sampul */}
          <div>
            <label className="text-slate-800 block mb-1.5 font-black text-xs">Foto Sampul Warta *</label>
            
            {/* Live Preview Box */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-100 shadow-inner mb-3 flex items-center justify-center">
              <img 
                src={image || '/slide4.jpeg'} 
                alt="Pratinjau Foto Warta" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/slide4.jpeg';
                }}
              />
              <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[10px] font-mono font-bold">
                {isCompressing ? 'Mengompres...' : 'Pratinjau Gambar'}
              </div>
            </div>

            {/* Upload Button & URL Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2.5">
              <label className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 text-indigo-700 font-extrabold flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors shrink-0">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
                <span>📁 Unggah dari Perangkat</span>
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="Atau tempel URL gambar..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>

            {/* Preset Cepat Foto Sekolah */}
            <div>
              <span className="text-[10px] text-slate-600 font-extrabold block mb-1">Pilihan Cepat Foto Sekolah:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {WARTA_PHOTO_PRESETS.map((p) => (
                  <button
                    key={p.src}
                    type="button"
                    onClick={() => setImage(p.src)}
                    className={`px-2.5 py-1 rounded-lg border-2 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      image === p.src
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-black'
                        : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    <img src={p.src} alt={p.label} className="w-3.5 h-3.5 rounded object-cover" />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ringkasan Berita */}
          <div>
            <label className="text-slate-800 block mb-1.5 font-black text-xs">Ringkasan / Kutipan Berita *</label>
            <textarea
              rows={3}
              required
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Kutipan singkat berita untuk cuplikan depan di Landing Page..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 resize-none shadow-xs transition-all"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold border-2 border-slate-300 cursor-pointer shadow-xs active:scale-98 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCompressing}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98 transition-all disabled:opacity-50"
            >
              {isCompressing ? 'Memproses Foto...' : 'Terbitkan Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// MODAL SUNTING WARTA (ISOLASI STATE AGAR TIDAK ME-RENDER ULANG DASHBOARD)
// =========================================================================
interface EditNewsModalProps {
  isOpen: boolean;
  item: WartaItem | null;
  onClose: () => void;
  onSave: (id: number, data: Partial<WartaItem>) => void;
  onDelete?: (id: number) => void;
  showToast: (msg: string) => void;
}

export function EditNewsModal({ isOpen, item, onClose, onSave, onDelete, showToast }: EditNewsModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Prestasi');
  const [excerpt, setExcerpt] = useState('');
  const [image, setImage] = useState('/slide4.jpeg');
  const [status, setStatus] = useState<'Published' | 'Draft'>('Published');
  const [isCompressing, setIsCompressing] = useState(false);

  // Isi data form saat item berubah
  useEffect(() => {
    if (item && isOpen) {
      setTitle(item.title || '');
      setCategory(item.category || 'Prestasi');
      setExcerpt(item.excerpt || '');
      setImage(item.src || '/slide4.jpeg');
      setStatus((item.status as 'Published' | 'Draft') || 'Published');
      setIsCompressing(false);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('⚠️ Ukuran berkas gambar maksimal 10MB');
      return;
    }

    try {
      setIsCompressing(true);
      const optimizedBase64 = await compressImage(file, 1200, 0.8);
      setImage(optimizedBase64);
      showToast('🖼️ Foto warta dioptimalkan & berhasil diunggah!');
    } catch (err) {
      console.error(err);
      showToast('⚠️ Gagal memproses gambar');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(item.id, {
      title: title.trim(),
      category,
      excerpt: excerpt.trim(),
      src: image,
      status
    });

    onClose();
    showToast(`✅ Warta "${title.substring(0, 30)}..." berhasil diperbarui!`);
  };

  return (
    <div 
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      data-lenis-prevent-touch="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
    >
      <div 
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        className="w-full max-w-lg rounded-3xl bg-white border-2 border-slate-300 p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100 mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-950">Sunting Warta &amp; Berita</h3>
            <p className="text-xs text-slate-600 font-bold mt-0.5">Perubahan otomatis diperbarui di Landing Page</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-bold flex items-center justify-center cursor-pointer border border-slate-300 transition-colors"
            title="Tutup Modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Judul Warta */}
          <div>
            <label className="text-slate-800 block mb-1.5 font-black text-xs">Judul Warta *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs transition-all"
            />
          </div>

          {/* Kategori & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-800 block mb-1.5 font-black text-xs">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
              >
                <option value="Prestasi">Prestasi</option>
                <option value="Pengumuman">Pengumuman</option>
                <option value="Kegiatan">Kegiatan</option>
                <option value="Inovasi">Inovasi</option>
                <option value="Akademik">Akademik</option>
              </select>
            </div>
            <div>
              <label className="text-slate-800 block mb-1.5 font-black text-xs">Status Publikasi</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Published' | 'Draft')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
              >
                <option value="Published">Publikasikan (Tayang)</option>
                <option value="Draft">Draf (Disimpan Dulu)</option>
              </select>
            </div>
          </div>

          {/* Foto Sampul */}
          <div>
            <label className="text-slate-800 block mb-1.5 font-black text-xs">Ganti Foto Sampul *</label>
            
            {/* Live Preview Box */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-100 shadow-inner mb-3 flex items-center justify-center">
              <img 
                src={image || '/slide4.jpeg'} 
                alt="Pratinjau Foto Warta" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/slide4.jpeg';
                }}
              />
              <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[10px] font-mono font-bold">
                {isCompressing ? 'Mengompres...' : 'Pratinjau Gambar'}
              </div>
            </div>

            {/* Upload Button & URL Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2.5">
              <label className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 text-indigo-700 font-extrabold flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors shrink-0">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
                <span>📁 Unggah dari Perangkat</span>
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="Atau tempel URL gambar..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>

            {/* Preset Cepat Foto Sekolah */}
            <div>
              <span className="text-[10px] text-slate-600 font-extrabold block mb-1">Pilihan Cepat Foto Sekolah:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {WARTA_PHOTO_PRESETS.map((p) => (
                  <button
                    key={p.src}
                    type="button"
                    onClick={() => setImage(p.src)}
                    className={`px-2.5 py-1 rounded-lg border-2 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      image === p.src
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-black'
                        : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    <img src={p.src} alt={p.label} className="w-3.5 h-3.5 rounded object-cover" />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ringkasan Berita */}
          <div>
            <label className="text-slate-800 block mb-1.5 font-black text-xs">Ringkasan / Kutipan Berita *</label>
            <textarea
              rows={3}
              required
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-medium placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 resize-none shadow-xs transition-all"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="pt-3 flex items-center justify-between gap-2.5 border-t-2 border-slate-200">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus warta "${item.title}"?`)) {
                    onDelete(item.id);
                    onClose();
                    showToast('🗑️ Warta berhasil dihapus.');
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold border-2 border-rose-200 cursor-pointer shadow-xs active:scale-98 transition-colors"
              >
                Hapus
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold border-2 border-slate-300 cursor-pointer shadow-xs active:scale-98 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isCompressing}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98 transition-all disabled:opacity-50"
              >
                {isCompressing ? 'Memproses Foto...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
