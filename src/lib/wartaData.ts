'use client';

import { useState, useEffect } from 'react';

export interface WartaItem {
  id: number;
  title: string;
  category: 'Prestasi' | 'Pengumuman' | 'Inovasi' | 'Akademik' | 'Kegiatan' | string;
  date: string;
  views?: string;
  status: 'Published' | 'Draft';
  src: string;
  excerpt?: string;
  content?: string;
  author?: string;
}

export const DEFAULT_WARTA: WartaItem[] = [
  {
    id: 1,
    title: 'Siswa SMPN 3 Cihampelas Sabet Juara 1 Porseni Basket KBB 2026',
    category: 'Prestasi',
    date: '22 Sep 2026',
    views: '1.4k',
    status: 'Published',
    src: '/gallery_2.jpg',
    excerpt: 'Prestasi membanggakan kembali ditorehkan oleh tim basket putra SMPN 3 Cihampelas dalam kompetisi bergengsi tingkat Kabupaten Bandung Barat.'
  },
  {
    id: 2,
    title: 'Pembukaan Jalur Zonasi & Afirmasi PPDB Tahun Ajaran 2026/2027',
    category: 'Pengumuman',
    date: '18 Sep 2026',
    views: '3.2k',
    status: 'Published',
    src: '/slide1.jpeg',
    excerpt: 'Pendaftaran Penerimaan Peserta Didik Baru (PPDB) resmi dibuka dengan sistem verifikasi berkas terpadu dan transparan.'
  },
  {
    id: 3,
    title: 'Upacara Bendera Khidmat & Pembinaan Karakter Profil Pelajar Pancasila',
    category: 'Kegiatan',
    date: '14 Sep 2026',
    views: '920',
    status: 'Published',
    src: '/slide4.jpeg',
    excerpt: 'Kegiatan upacara bendera hari Senin yang dirangkaikan dengan penguatan disiplin dan nilai integritas peserta didik.'
  },
  {
    id: 4,
    title: 'Pelaksanaan Asesmen Sumatif Tengah Semester (CBT Berbasis Digital)',
    category: 'Akademik',
    date: '10 Sep 2026',
    views: '2.1k',
    status: 'Published',
    src: '/gallery_1.jpg',
    excerpt: 'Pemanfaatan sistem asesmen digital terintegrasi untuk mengukur capaian kompetensi belajar siswa secara akurat dan objektif.'
  }
];

const STORAGE_KEY = 'smpn3_warta_data_v1';
const EVENT_NAME = 'wartaDataUpdated';

export function getStoredWarta(): WartaItem[] {
  if (typeof window === 'undefined') return DEFAULT_WARTA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WARTA));
      return DEFAULT_WARTA;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_WARTA;
  } catch (err) {
    console.error('Error reading warta from localStorage', err);
    return DEFAULT_WARTA;
  }
}

export function saveStoredWarta(items: WartaItem[]): WartaItem[] {
  if (typeof window === 'undefined') return items;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT_NAME));
    return items;
  } catch (err) {
    console.error('Error saving warta to localStorage', err);
    return items;
  }
}

export function addStoredWarta(item: Omit<WartaItem, 'id'>): WartaItem[] {
  const current = getStoredWarta();
  const newItem: WartaItem = {
    ...item,
    id: Date.now(),
    views: item.views || '1',
    status: item.status || 'Published'
  };
  const updated = [newItem, ...current];
  return saveStoredWarta(updated);
}

export function updateStoredWarta(id: number, patch: Partial<WartaItem>): WartaItem[] {
  const current = getStoredWarta();
  const updated = current.map(item => item.id === id ? { ...item, ...patch } : item);
  return saveStoredWarta(updated);
}

export function deleteStoredWarta(id: number): WartaItem[] {
  const current = getStoredWarta();
  const updated = current.filter(item => item.id !== id);
  return saveStoredWarta(updated);
}

export function resetStoredWarta(): WartaItem[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WARTA));
    window.dispatchEvent(new Event(EVENT_NAME));
  }
  return DEFAULT_WARTA;
}

export function useWartaData() {
  const [wartaList, setWartaList] = useState<WartaItem[]>(DEFAULT_WARTA);

  useEffect(() => {
    setWartaList(getStoredWarta());

    const handleUpdate = () => {
      setWartaList(getStoredWarta());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return {
    wartaList,
    addWarta: (item: Omit<WartaItem, 'id'>) => addStoredWarta(item),
    updateWarta: (id: number, patch: Partial<WartaItem>) => updateStoredWarta(id, patch),
    deleteWarta: (id: number) => deleteStoredWarta(id),
    resetWarta: () => resetStoredWarta()
  };
}
