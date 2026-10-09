'use client';

import React, { useState, useEffect, useRef } from 'react';
import { compressImage } from '@/lib/imageCompression';

interface AddGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { title: string; category: string; src: string }) => void;
  showToast: (msg: string) => void;
}

const GALLERY_PRESETS = [
  { label: 'Lab Komputer', src: '/gallery_2.jpg' },
  { label: 'Perpustakaan', src: '/gallery_1.jpg' },
  { label: 'Upacara', src: '/slide1.jpeg' },
  { label: 'Olahraga', src: '/slide3.jpeg' },
  { label: 'STEM & Robotika', src: '/slide4.jpeg' },
  { label: 'Praktikum Sains', src: '/slide7.jpeg' }
];

export function AddGalleryModal({ isOpen, onClose, onAdd, showToast }: AddGalleryModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('FASILITAS');
  const [src, setSrc] = useState('/gallery_2.jpg');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setCategory('FASILITAS');
      setSrc('/gallery_2.jpg');
      setIsCompressing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      showToast('⏳ Mengompres foto galeri...');
      const compressed = await compressImage(file, 1200, 0.82);
      setSrc(compressed);
      showToast('✅ Foto galeri berhasil dimuat!');
    } catch {
      showToast('❌ Gagal memproses gambar.');
    } finally {
      setIsCompressing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('⚠️ Judul dokumentasi wajib diisi!');
      return;
    }

    onAdd({
      title: title.trim(),
      category,
      src
    });
    showToast('📸 Foto berhasil ditambahkan ke Galeri & Fasilitas!');
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
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100 mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-950">Unggah Dokumentasi & Fasilitas</h3>
            <p className="text-xs text-slate-600 font-bold mt-0.5">Tambah foto kegiatan atau sarana kampus</p>
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
          {/* Image Upload / Preview */}
          <div>
            <label className="text-slate-800 block mb-1.5 font-black text-xs">Foto Media *</label>
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border-2 border-slate-300 mb-2.5 bg-slate-100">
              <img src={src} alt="Preview" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-2">
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
                className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-2 border-indigo-200 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>📷</span>
                <span>{isCompressing ? 'Memproses Kompresi...' : 'Pilih Foto dari Perangkat (Anti-Lag)'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
              <span className="text-xs text-slate-700 font-bold">Preset:</span>
              {GALLERY_PRESETS.map((p) => (
                <button
                  key={p.src}
                  type="button"
                  onClick={() => setSrc(p.src)}
                  className={`px-2 py-1 rounded-lg border-2 text-[10px] font-bold cursor-pointer transition-all ${
                    src === p.src
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-black'
                      : 'border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-800 block mb-1.5 font-black text-xs">Judul Foto / Fasilitas *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Gedung Laboratorium Komputer Baru..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
            />
          </div>

          <div>
            <label className="text-slate-800 block mb-1.5 font-black text-xs">Kategori Galeri</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
            >
              <option value="FASILITAS">FASILITAS</option>
              <option value="KEGIATAN">KEGIATAN</option>
              <option value="EKSTRAKURIKULER">EKSTRAKURIKULER</option>
              <option value="AKADEMIK">AKADEMIK</option>
            </select>
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
              Simpan Foto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
