'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { GalleryItem } from '@/lib/galleryData';
import { AddGalleryModal, EditGalleryModal } from './GalleryModal';

interface TabGaleriProps {
  galleryList: GalleryItem[];
  onAddGallery: (data: { title: string; category: string; src: string; desc?: string }) => void;
  onUpdateGallery?: (id: number, data: Partial<GalleryItem>) => void;
  onDeleteGallery: (id: number) => void;
  onResetGallery?: () => void;
  showToast: (msg: string) => void;
}

const CATEGORIES = [
  { key: 'SEMUA', label: 'Semua' },
  { key: 'FASILITAS', label: 'Fasilitas' },
  { key: 'AKADEMIK', label: 'Akademik' },
  { key: 'KEGIATAN', label: 'Kegiatan Siswa' },
  { key: 'EKSTRAKURIKULER', label: 'Ekstrakurikuler' },
];

export function TabGaleri({ 
  galleryList, 
  onAddGallery, 
  onUpdateGallery,
  onDeleteGallery, 
  onResetGallery,
  showToast 
}: TabGaleriProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredList = useMemo(() => {
    return galleryList.filter((item) => {
      const cat = (item.category || '').toUpperCase();
      if (activeFilter !== 'SEMUA' && cat !== activeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchDesc = (item.desc || '').toLowerCase().includes(q);
        const matchCat = cat.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchCat;
      }
      return true;
    });
  }, [galleryList, activeFilter, searchQuery]);

  const handleReset = () => {
    if (confirm('⚠️ Apakah Anda yakin ingin mereset seluruh galeri ke 8 foto dokumentasi standar sekolah?')) {
      if (onResetGallery) {
        onResetGallery();
      }
      showToast('🔄 Galeri berhasil direset ke 8 foto dokumentasi standar!');
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-950 tracking-tight">Manajemen Galeri & Fasilitas</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black bg-indigo-100 text-indigo-800 border border-indigo-300">
              {galleryList.length} Foto
            </span>
          </div>
          <p className="text-xs text-slate-700 font-semibold mt-0.5">
            Dokumentasi kegiatan belajar, kesiswaan, dan sarana sekolah (Tersinkron otomatis ke Landing Page)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onResetGallery && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300 active:scale-98"
              title="Kembalikan semua foto galeri ke foto bawaan (8 foto)"
            >
              <span>🔄 Reset ke Default</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
          >
            <span>+ Unggah Media Baru</span>
          </button>
        </div>
      </div>

      {/* Toolbar Filter & Pencarian */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border-2 border-slate-200 shadow-xs">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {CATEGORIES.map((cat) => {
            const count = cat.key === 'SEMUA' 
              ? galleryList.length 
              : galleryList.filter((g) => (g.category || '').toUpperCase() === cat.key).length;
            const isActive = activeFilter === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveFilter(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul dokumentasi..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Upload Drag & Drop Area (Quick Trigger) */}
      <div 
        onClick={() => setIsAddOpen(true)}
        className="p-6 sm:p-7 rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/20 hover:bg-indigo-50/40 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2 shadow-xs group"
      >
        <div className="w-11 h-11 rounded-2xl bg-indigo-100 group-hover:scale-105 border-2 border-indigo-300 flex items-center justify-center text-indigo-700 text-xl font-black transition-transform">
          📁
        </div>
        <p className="text-sm font-black text-slate-950">Klik di sini untuk mengunggah foto baru</p>
        <p className="text-xs text-slate-700 font-mono font-semibold">Kompresi otomatis aktif — aman, cepat, dan anti-lag</p>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredList.map((photo) => (
          <div 
            key={photo.id}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-200 shadow-sm"
          >
            <Image 
              src={photo.src} 
              alt={photo.title} 
              fill 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent p-4 flex flex-col justify-between">
              {/* Top Bar: Category Pill & Action Buttons */}
              <div className="flex justify-between items-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black text-white border border-white/30 bg-slate-900/80 backdrop-blur-md">
                  {photo.category}
                </span>
                
                <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  {onUpdateGallery && (
                    <button
                      type="button"
                      onClick={() => setEditingPhoto(photo)}
                      className="p-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-900 text-xs font-bold shadow-md cursor-pointer transition-colors active:scale-95"
                      title="Edit Foto"
                    >
                      ✏️
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Yakin ingin menghapus foto "${photo.title}" dari galeri?`)) {
                        onDeleteGallery(photo.id);
                      }
                    }}
                    className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer transition-colors active:scale-95"
                    title="Hapus Foto"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Bottom Info: Title & Desc */}
              <div>
                <h4 className="text-sm font-black text-white line-clamp-2 leading-snug drop-shadow-sm">
                  {photo.title}
                </h4>
                {photo.desc && (
                  <p className="text-[11px] text-slate-300 line-clamp-1 mt-1 font-light drop-shadow-xs">
                    {photo.desc}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredList.length === 0 && (
        <div className="p-12 text-center text-slate-700 text-xs font-bold rounded-2xl bg-white border-2 border-slate-200">
          Tidak ada foto ditemukan dengan kata kunci atau filter ini.
        </div>
      )}

      {/* Modals */}
      <AddGalleryModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={onAddGallery}
        showToast={showToast}
      />

      <EditGalleryModal
        isOpen={!!editingPhoto}
        item={editingPhoto}
        onClose={() => setEditingPhoto(null)}
        onSave={(id, data) => {
          if (onUpdateGallery) {
            onUpdateGallery(id, data);
          }
        }}
        showToast={showToast}
      />
    </div>
  );
}
