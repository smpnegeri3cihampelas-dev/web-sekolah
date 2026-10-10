'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { AddGalleryModal } from './GalleryModal';

interface GalleryItem {
  id: number;
  title: string;
  category: string;
  src: string;
}

interface TabGaleriProps {
  galleryList: GalleryItem[];
  onAddGallery: (data: { title: string; category: string; src: string }) => void;
  onDeleteGallery: (id: number) => void;
  showToast: (msg: string) => void;
}

export function TabGaleri({ galleryList, onAddGallery, onDeleteGallery, showToast }: TabGaleriProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-950 tracking-tight">Manajemen Galeri & Fasilitas</h2>
          <p className="text-xs text-slate-700 font-semibold mt-0.5">Foto dokumentasi kegiatan belajar, kesiswaan, dan sarana sekolah</p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
        >
          <span>+ Unggah Media Baru</span>
        </button>
      </div>

      {/* Upload Drag & Drop Area (Quick Trigger) */}
      <div 
        onClick={() => setIsAddOpen(true)}
        className="p-8 rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/20 hover:bg-indigo-50/40 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2 shadow-xs group"
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 group-hover:scale-105 border-2 border-indigo-300 flex items-center justify-center text-indigo-700 text-xl font-black transition-transform">
          📁
        </div>
        <p className="text-sm sm:text-base font-black text-slate-950">Klik di sini untuk mengunggah foto baru</p>
        <p className="text-xs text-slate-700 font-mono font-semibold">Kompresi otomatis aktif — aman, cepat, dan anti-lag</p>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {galleryList.map((photo) => (
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
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black text-white border border-white/30 bg-slate-900/80 backdrop-blur-md">
                  {photo.category}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteGallery(photo.id)}
                  className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-md cursor-pointer"
                  title="Hapus Foto"
                >
                  🗑️
                </button>
              </div>
              <h4 className="text-sm font-black text-white line-clamp-2">{photo.title}</h4>
            </div>
          </div>
        ))}
      </div>

      {galleryList.length === 0 && (
        <div className="p-12 text-center text-slate-700 text-xs font-bold rounded-2xl bg-white border-2 border-slate-200">
          Belum ada foto dalam galeri.
        </div>
      )}

      {/* Modal */}
      <AddGalleryModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={onAddGallery}
        showToast={showToast}
      />
    </div>
  );
}
