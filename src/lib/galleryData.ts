'use client';

import { useState, useEffect, useCallback } from 'react';
export * from './galleryConstants';
import {
  GalleryItem,
  DEFAULT_GALLERY_PHOTOS,
  GALLERY_CATEGORIES
} from './galleryConstants';

const STORAGE_KEY = 'smpn3_gallery_data_v2';
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
        id: Number(p.id) || Date.now(),
        src: p.src || p.image_url || '/gallery_2.jpg',
        category: (p.category || 'FASILITAS').toUpperCase(),
        title: p.title || 'Dokumentasi Sekolah',
        desc: p.desc || p.caption || (p.category === 'FASILITAS' ? 'Sarana penunjang kegiatan di SMPN 3 Cihampelas.' : 'Dokumentasi kegiatan siswa dan guru SMP Negeri 3 Cihampelas.'),
        created_at: p.created_at
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

// Full Two-Way Cloud Sync with MariaDB
export async function syncGalleryWithCloud(): Promise<{ galleryList: GalleryItem[] }> {
  try {
    const res = await fetch('/api/gallery', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();

    let fetchedGallery: GalleryItem[] = [];
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      fetchedGallery = json.data.map((r: any) => ({
        id: Number(r.id),
        title: r.title || 'Dokumentasi Sekolah',
        category: (r.category || 'FASILITAS').toUpperCase(),
        src: r.src || r.image_url || '/gallery_2.jpg',
        desc: r.desc || r.caption || '',
        created_at: r.created_at
      }));

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedGallery));
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(EVENT_NAME));
    }

    return {
      galleryList: fetchedGallery.length > 0 ? fetchedGallery : getStoredGallery()
    };
  } catch (err) {
    console.warn('Sync with cloud gallery failed, using local cache:', err);
    return {
      galleryList: getStoredGallery()
    };
  }
}

export function addStoredGallery(item: Omit<GalleryItem, 'id'>): GalleryItem[] {
  const current = getStoredGallery();
  const tempId = Date.now();
  const newItem: GalleryItem = {
    ...item,
    id: tempId,
    category: (item.category || 'FASILITAS').toUpperCase(),
    desc: item.desc || (item.category === 'FASILITAS' ? 'Sarana penunjang kegiatan di SMPN 3 Cihampelas.' : 'Dokumentasi kegiatan siswa dan guru SMP Negeri 3 Cihampelas.')
  };
  const updated = [newItem, ...current];
  saveStoredGallery(updated);

  // Sync to MariaDB Cloud asynchronously
  fetch('/api/gallery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem)
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.insertId) {
        const finalCurrent = getStoredGallery();
        const adjusted = finalCurrent.map((g) => (g.id === tempId ? { ...g, id: Number(data.insertId) } : g));
        saveStoredGallery(adjusted);
      }
    })
    .catch((err) => console.error('Cloud add gallery error:', err));

  return updated;
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
  saveStoredGallery(updated);

  // Sync to MariaDB Cloud asynchronously
  fetch('/api/gallery', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...patch })
  }).catch((err) => console.error('Cloud update gallery error:', err));

  return updated;
}

export function deleteStoredGallery(id: number): GalleryItem[] {
  const current = getStoredGallery();
  const updated = current.filter((item) => item.id !== id);
  saveStoredGallery(updated);

  // Sync to MariaDB Cloud asynchronously
  fetch(`/api/gallery?id=${id}`, {
    method: 'DELETE'
  }).catch((err) => console.error('Cloud delete gallery error:', err));

  return updated;
}

export function resetStoredGallery(): GalleryItem[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_GALLERY_PHOTOS));
    window.dispatchEvent(new Event(EVENT_NAME));

    // Sync to MariaDB Cloud asynchronously
    fetch('/api/gallery?action=reset', {
      method: 'DELETE'
    }).catch((err) => console.error('Cloud reset gallery error:', err));
  }
  return DEFAULT_GALLERY_PHOTOS;
}

export function useGalleryData() {
  const [galleryList, setGalleryList] = useState<GalleryItem[]>(() => getStoredGallery());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshFromCloud = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await syncGalleryWithCloud();
      setGalleryList(res.galleryList);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch from cloud on component mount
    refreshFromCloud();

    const handleUpdate = () => {
      setGalleryList(getStoredGallery());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshFromCloud]);

  return {
    galleryList,
    isSyncing,
    refreshFromCloud,
    addGallery: (item: Omit<GalleryItem, 'id'>) => addStoredGallery(item),
    updateGallery: (id: number, patch: Partial<GalleryItem>) => updateStoredGallery(id, patch),
    deleteGallery: (id: number) => deleteStoredGallery(id),
    resetGallery: () => resetStoredGallery()
  };
}
