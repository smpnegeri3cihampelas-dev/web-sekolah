'use client';

import { useState, useEffect, useCallback } from 'react';
export * from './agendaConstants';
import {
  AgendaItem,
  KaldikPdfInfo,
  OFFICIAL_KALDIK_SMPN3,
  DEFAULT_PDF_URL,
  DEFAULT_PDF_NAME,
  getAgendaSortTime,
  computeAutomaticStatus
} from './agendaConstants';

const STORAGE_KEY = 'smpn3_agenda_data_v2';
const EVENT_NAME = 'smpn3_agenda_updated';
const PDF_INFO_STORAGE_KEY = 'smpn3_kaldik_pdf_info_v2';

export function getStoredPdfInfo(): KaldikPdfInfo {
  if (typeof window === 'undefined') {
    return { url: DEFAULT_PDF_URL, fileName: DEFAULT_PDF_NAME };
  }
  try {
    const saved = localStorage.getItem(PDF_INFO_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.url) return parsed;
    }
  } catch {}
  return { url: DEFAULT_PDF_URL, fileName: DEFAULT_PDF_NAME };
}

export function saveStoredPdfInfo(info: Partial<KaldikPdfInfo>): KaldikPdfInfo {
  const current = getStoredPdfInfo();
  const updated: KaldikPdfInfo = {
    url: info.url || current.url || DEFAULT_PDF_URL,
    fileName: info.fileName || current.fileName || DEFAULT_PDF_NAME,
    updatedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PDF_INFO_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(EVENT_NAME));
      
      // Async sync to MariaDB Cloud
      fetch('/api/agenda', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_pdf', pdfInfo: updated })
      }).catch((err) => console.error('Cloud PDF sync error:', err));
    } catch (err) {
      console.error('Error saving PDF info to storage', err);
    }
  }
  return updated;
}

export function resetStoredPdfInfo(): KaldikPdfInfo {
  const defaultInfo: KaldikPdfInfo = {
    url: DEFAULT_PDF_URL,
    fileName: DEFAULT_PDF_NAME
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PDF_INFO_STORAGE_KEY, JSON.stringify(defaultInfo));
      window.dispatchEvent(new Event(EVENT_NAME));

      // Async sync to MariaDB Cloud
      fetch('/api/agenda', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_pdf' })
      }).catch((err) => console.error('Cloud reset PDF sync error:', err));
    } catch {}
  }
  return defaultInfo;
}

export function sortAgendaItems(items: AgendaItem[]): AgendaItem[] {
  return [...items].sort((a, b) => {
    const timeA = getAgendaSortTime(a.date);
    const timeB = getAgendaSortTime(b.date);
    if (timeA !== timeB) return timeA - timeB;
    return (a.id || 0) - (b.id || 0);
  });
}

export function getStoredAgenda(): AgendaItem[] {
  if (typeof window === 'undefined') return sortAgendaItems(OFFICIAL_KALDIK_SMPN3);
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      const initialSorted = sortAgendaItems(OFFICIAL_KALDIK_SMPN3);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSorted));
      return initialSorted;
    }
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const mapped = parsed.map((p) => ({
        id: Number(p.id) || Date.now(),
        name: p.name || p.title || 'Agenda Sekolah',
        date: p.date || 'Mendatang',
        category: p.category || p.type || 'Akademik',
        status: p.status || 'Mendatang',
        semester: p.semester || 'Semester 1',
        title: p.title || p.name || ''
      }));
      return sortAgendaItems(mapped);
    }
    return sortAgendaItems(OFFICIAL_KALDIK_SMPN3);
  } catch (err) {
    console.error('Error reading agenda from storage', err);
    return sortAgendaItems(OFFICIAL_KALDIK_SMPN3);
  }
}

export function saveStoredAgenda(items: AgendaItem[]): AgendaItem[] {
  if (typeof window === 'undefined') return items;
  try {
    const sorted = sortAgendaItems(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    window.dispatchEvent(new Event(EVENT_NAME));
    return sorted;
  } catch (err) {
    console.error('Error saving agenda to storage', err);
    return items;
  }
}

// Full Two-Way Cloud Sync with MariaDB
export async function syncAgendaWithCloud(): Promise<{ agendaList: AgendaItem[]; pdfInfo: KaldikPdfInfo }> {
  try {
    const res = await fetch('/api/agenda', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();

    let fetchedAgenda: AgendaItem[] = [];
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      const mapped = json.data.map((r: any) => ({
        id: Number(r.id),
        name: r.name || r.title || 'Agenda Sekolah',
        date: r.date || 'Mendatang',
        category: r.category || 'Akademik',
        status: r.status || 'Mendatang',
        semester: r.semester || 'Semester 1',
        title: r.title || r.name || ''
      }));
      fetchedAgenda = sortAgendaItems(mapped);

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedAgenda));
      }
    }

    let fetchedPdf: KaldikPdfInfo = { url: DEFAULT_PDF_URL, fileName: DEFAULT_PDF_NAME };
    if (json.pdfInfo && json.pdfInfo.url) {
      fetchedPdf = json.pdfInfo;
      if (typeof window !== 'undefined') {
        localStorage.setItem(PDF_INFO_STORAGE_KEY, JSON.stringify(fetchedPdf));
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(EVENT_NAME));
    }

    return {
      agendaList: fetchedAgenda.length > 0 ? fetchedAgenda : getStoredAgenda(),
      pdfInfo: fetchedPdf
    };
  } catch (err) {
    console.warn('Sync with cloud agenda failed, using local cache:', err);
    return {
      agendaList: getStoredAgenda(),
      pdfInfo: getStoredPdfInfo()
    };
  }
}

export function addStoredAgenda(item: Omit<AgendaItem, 'id' | 'status'> & { status?: string }): AgendaItem[] {
  const current = getStoredAgenda();
  const tempId = Date.now();
  const newItem: AgendaItem = {
    ...item,
    id: tempId,
    status: item.status || 'Mendatang',
    semester: item.semester || 'Semester 1',
    title: item.name
  };
  const updated = [...current, newItem];
  saveStoredAgenda(updated);

  // Sync to MariaDB Cloud asynchronously
  fetch('/api/agenda', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem)
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.insertId) {
        // Update temp ID with MariaDB auto-increment ID
        const finalCurrent = getStoredAgenda();
        const adjusted = finalCurrent.map((ag) => (ag.id === tempId ? { ...ag, id: Number(data.insertId) } : ag));
        saveStoredAgenda(adjusted);
      }
    })
    .catch((err) => console.error('Cloud add agenda error:', err));

  return updated;
}

export function updateStoredAgenda(id: number, patch: Partial<AgendaItem>): AgendaItem[] {
  const current = getStoredAgenda();
  const updated = current.map((item) => (item.id === id ? { ...item, ...patch } : item));
  saveStoredAgenda(updated);

  // Sync to MariaDB Cloud asynchronously
  fetch('/api/agenda', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...patch })
  }).catch((err) => console.error('Cloud update agenda error:', err));

  return updated;
}

export function deleteStoredAgenda(id: number): AgendaItem[] {
  const current = getStoredAgenda();
  const updated = current.filter((item) => item.id !== id);
  saveStoredAgenda(updated);

  // Sync to MariaDB Cloud asynchronously
  fetch(`/api/agenda?id=${id}`, {
    method: 'DELETE'
  }).catch((err) => console.error('Cloud delete agenda error:', err));

  return updated;
}

export function resetStoredAgenda(): AgendaItem[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(OFFICIAL_KALDIK_SMPN3));
    window.dispatchEvent(new Event(EVENT_NAME));

    // Sync to MariaDB Cloud asynchronously
    fetch('/api/agenda?action=reset', {
      method: 'DELETE'
    }).catch((err) => console.error('Cloud reset agenda error:', err));
  }
  return OFFICIAL_KALDIK_SMPN3;
}

export function useAgendaData() {
  const [agendaList, setAgendaList] = useState<AgendaItem[]>(() => getStoredAgenda());
  const [pdfInfo, setPdfInfo] = useState<KaldikPdfInfo>(() => getStoredPdfInfo());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshFromCloud = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await syncAgendaWithCloud();
      setAgendaList(res.agendaList);
      setPdfInfo(res.pdfInfo);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch from cloud on component mount
    refreshFromCloud();

    const handleUpdate = () => {
      setAgendaList(getStoredAgenda());
      setPdfInfo(getStoredPdfInfo());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshFromCloud]);

  return {
    agendaList,
    pdfInfo,
    isSyncing,
    refreshFromCloud,
    addAgenda: (item: Omit<AgendaItem, 'id' | 'status'> & { status?: string }) => addStoredAgenda(item),
    updateAgenda: (id: number, patch: Partial<AgendaItem>) => updateStoredAgenda(id, patch),
    deleteAgenda: (id: number) => deleteStoredAgenda(id),
    resetAgenda: () => resetStoredAgenda(),
    updatePdfInfo: (info: Partial<KaldikPdfInfo>) => saveStoredPdfInfo(info),
    resetPdfInfo: () => resetStoredPdfInfo()
  };
}
