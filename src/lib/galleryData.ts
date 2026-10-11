'use client';

import { useState, useEffect } from 'react';

export interface GalleryItem {
  id: number;
  src: string;
  category: 'FASILITAS' | 'KEGIATAN' | 'EKSTRAKURIKULER' | 'AKADEMIK' | string;
  title: string;
  desc?: string;
}

export const DEFAULT_GALLERY_PHOTOS: GalleryItem[] = [
  { 
    id: 1, 
    src: '/gallery_2.jpg', 
    category: 'FASILITAS', 
    title: 'Laboratorium Komputer & Praktikum TIK',
    desc: 'Sarana pembelajaran komputasi, literasi digital, dan pelaksanaan asesmen nasional ANBK.'
  },
  { 
    id: 2, 
    src: '/gallery_1.jpg', 
    category: 'FASILITAS', 
    title: 'Perpustakaan & Pojok Baca Siswa',
    desc: 'Pusat sumber belajar, koleksi buku literasi harian, dan ruang baca yang nyaman bagi siswa.'
  },
  { 
    id: 3, 
    src: '/slide1.jpeg', 
    category: 'KEGIATAN', 
    title: 'Upacara Bendera & Apel Kedisiplinan',
    desc: 'Pembiasaan rutin hari Senin untuk menanamkan jiwa patriotisme, budi pekerti, dan kepemimpinan.'
  },
  { 
    id: 4, 
    src: '/slide3.jpeg', 
    category: 'EKSTRAKURIKULER', 
    title: 'Kegiatan Olahraga & Pengembangan Bakat',
    desc: 'Wadah pembinaan bakat olahraga, sportivitas, dan kebugaran jasmani seluruh siswa.'
  },
  { 
    id: 5, 
    src: '/slide4.jpeg', 
    category: 'KEGIATAN', 
    title: 'Pentas Seni & Gelar Budaya Sunda',
    desc: 'Apresiasi bakat seni budaya daerah, pelestarian kearifan lokal, dan unjuk kreativitas siswa.'
  },
  { 
    id: 6, 
    src: '/slide7.jpeg', 
    category: 'AKADEMIK', 
    title: 'Praktikum Sains & Diskusi Berdiferensiasi',
    desc: 'Pembelajaran kontekstual melalui observasi langsung, eksperimen ilmiah, dan kerja sama tim.'
  },
  { 
    id: 7, 
    src: '/slide2.jpeg', 
    category: 'AKADEMIK', 
    title: 'Gelar Karya Projek Penguatan P5',
    desc: 'Pameran hasil karya inovatif, daur ulang ramah lingkungan, dan kewirausahaan siswa.'
  },
  { 
    id: 8, 
    src: '/slide6.jpeg', 
    category: 'KEGIATAN', 
    title: 'Senam Sehat & Jumat Bersih Lingkungan',
    desc: 'Pembiasaan rutin hidup sehat dan gotong royong memelihara keasrian lingkungan sekolah.'
  },
];

const STORAGE_KEY = 'smpn3_gallery_data_v1';
const EVENT_NAME = 'smpn3_gallery_updated';

export function getStoredGallery(): GalleryItem[] {
  if (typeof window === 'undefined') return DEFAULT_GALLERY_PHOTOS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_GALLERY_PHOTOS));
      return DEFAULT_GALLERY_PHOTOS;
    }
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((p) => ({
        id: p.id || Date.now(),
        src: p.src || '/gallery_2.jpg',
        category: (p.category || 'KEGIATAN').toUpperCase(),
        title: p.title || 'Dokumentasi Sekolah',
        desc: p.desc || (p.category === 'FASILITAS' ? 'Sarana penunjang kegiatan di SMPN 3 Cihampelas.' : 'Dokumentasi kegiatan siswa dan guru SMP Negeri 3 Cihampelas.')
      }));
    }
    return DEFAULT_GALLERY_PHOTOS;
  } catch (err) {
    console.error('Error reading gallery from storage', err);
    return DEFAULT_GALLERY_PHOTOS;
  }
}

export function saveStoredGallery(items: GalleryItem[]): GalleryItem[] {
  if (typeof window === 'undefined') return items;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT_NAME));
    return items;
  } catch (err) {
    console.error('Error saving gallery to storage', err);
    return items;
  }
}

export function addStoredGallery(item: Omit<GalleryItem, 'id'>): GalleryItem[] {
  const current = getStoredGallery();
  const newItem: GalleryItem = {
    ...item,
    id: Date.now(),
    category: (item.category || 'KEGIATAN').toUpperCase(),
    desc: item.desc || (item.category === 'FASILITAS' ? 'Sarana penunjang kegiatan di SMPN 3 Cihampelas.' : 'Dokumentasi kegiatan siswa dan guru SMP Negeri 3 Cihampelas.')
  };
  const updated = [newItem, ...current];
  return saveStoredGallery(updated);
}

export function updateStoredGallery(id: number, patch: Partial<GalleryItem>): GalleryItem[] {
  const current = getStoredGallery();
  const updated = current.map((item) => {
    if (item.id === id) {
      const merged = { ...item, ...patch };
      if (merged.category) merged.category = merged.category.toUpperCase();
      return merged;
    }
    return item;
  });
  return saveStoredGallery(updated);
}

export function deleteStoredGallery(id: number): GalleryItem[] {
  const current = getStoredGallery();
  const updated = current.filter((item) => item.id !== id);
  return saveStoredGallery(updated);
}

export function resetStoredGallery(): GalleryItem[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_GALLERY_PHOTOS));
    window.dispatchEvent(new Event(EVENT_NAME));
  }
  return DEFAULT_GALLERY_PHOTOS;
}

export function useGalleryData() {
  const [galleryList, setGalleryList] = useState<GalleryItem[]>(DEFAULT_GALLERY_PHOTOS);

  useEffect(() => {
    // Initial load
    setGalleryList(getStoredGallery());

    const handleUpdate = () => {
      setGalleryList(getStoredGallery());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return {
    galleryList,
    addGallery: (item: Omit<GalleryItem, 'id'>) => addStoredGallery(item),
    updateGallery: (id: number, patch: Partial<GalleryItem>) => updateStoredGallery(id, patch),
    deleteGallery: (id: number) => deleteStoredGallery(id),
    resetGallery: () => resetStoredGallery()
  };
}
