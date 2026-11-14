'use client';

import { useState, useEffect } from 'react';
import { WartaItem, DEFAULT_WARTA } from './wartaConstants';

export type { WartaItem };
export { DEFAULT_WARTA };

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

/**
 * Sync warta data with MariaDB cloud database.
 * If fetch succeeds, cloud database serves as the authoritative source of truth.
 */
export async function syncWartaWithCloud(): Promise<WartaItem[]> {
  if (typeof window === 'undefined') return DEFAULT_WARTA;
  try {
    const res = await fetch('/api/warta');
    if (!res.ok) return getStoredWarta();
    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      const cloudItems: WartaItem[] = json.data;
      saveStoredWarta(cloudItems);
      return cloudItems;
    }
  } catch (e) {
    console.warn('Could not sync warta from cloud API:', e);
  }
  return getStoredWarta();
}

export function addStoredWarta(item: Omit<WartaItem, 'id'>): WartaItem[] {
  const current = getStoredWarta();
  const tempId = Date.now();
  const newItem: WartaItem = {
    ...item,
    id: tempId,
    views: item.views || '1',
    status: item.status || 'Published'
  };
  const updated = [newItem, ...current];
  saveStoredWarta(updated);

  // Background push to database
  if (typeof window !== 'undefined') {
    fetch('/api/warta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.insertId) {
          const fresh = getStoredWarta().map(it => it.id === tempId ? { ...it, id: json.insertId } : it);
          saveStoredWarta(fresh);
        }
      })
      .catch(err => console.warn('Background sync add warta to cloud failed:', err));
  }

  return updated;
}

export function updateStoredWarta(id: number, patch: Partial<WartaItem>): WartaItem[] {
  const current = getStoredWarta();
  const updated = current.map(item => item.id === id ? { ...item, ...patch } : item);
  saveStoredWarta(updated);

  // Background update to database
  if (typeof window !== 'undefined') {
    fetch('/api/warta', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch })
    }).catch(err => console.warn('Background sync update warta to cloud failed:', err));
  }

  return updated;
}

export function deleteStoredWarta(id: number): WartaItem[] {
  const current = getStoredWarta();
  const updated = current.filter(item => item.id !== id);
  saveStoredWarta(updated);

  // Background delete from database
  if (typeof window !== 'undefined') {
    fetch('/api/warta', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).catch(err => console.warn('Background sync delete warta to cloud failed:', err));
  }

  return updated;
}

export function resetStoredWarta(): WartaItem[] {
  if (typeof window !== 'undefined') {
    saveStoredWarta(DEFAULT_WARTA);
    fetch('/api/warta', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' })
    }).catch(err => console.warn('Background sync reset warta to cloud failed:', err));
  }
  return DEFAULT_WARTA;
}

export function useWartaData() {
  const [wartaList, setWartaList] = useState<WartaItem[]>(() => {
    if (typeof window !== 'undefined') {
      return getStoredWarta();
    }
    return DEFAULT_WARTA;
  });

  useEffect(() => {
    // 1. Initial read from local cache for instant zero-lag render
    setWartaList(getStoredWarta());

    // 2. Immediate cloud synchronization with MariaDB database
    syncWartaWithCloud().then(cloudList => {
      if (cloudList && cloudList.length > 0) {
        setWartaList(cloudList);
      }
    });

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
    resetWarta: () => resetStoredWarta(),
    refreshWarta: () => syncWartaWithCloud()
  };
}
