'use client';

import { useState, useEffect } from 'react';

export interface AgendaItem {
  id: number;
  name: string;
  date: string;
  category: string;
  status: string;
  semester?: 'Semester 1' | 'Semester 2' | string;
  title?: string;
  type?: string;
}

export const OFFICIAL_KALDIK_SMPN3: AgendaItem[] = [
  // SEMESTER 1 (2026)
  {
    id: 1,
    name: 'Hari Pertama Masuk Sekolah',
    date: '13 Juli 2026',
    category: 'Akademik',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 2,
    name: 'Pengenalan Lingkungan Sekolah (MPLS)',
    date: '15 - 17 & 20 - 21 Juli 2026',
    category: 'Akademik',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 3,
    name: 'Pelaksanaan Sulingjar (Survei Lingkungan Belajar)',
    date: '03 - 26 Agustus 2026',
    category: 'Akademik',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 4,
    name: 'Kegiatan Hari Pramuka Nasional',
    date: '14 Agustus 2026',
    category: 'Kegiatan',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 5,
    name: 'Libur Hari Proklamasi Kemerdekaan RI',
    date: '17 Agustus 2026',
    category: 'Libur Resmi',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 6,
    name: 'Olimpiade Olahraga Siswa Nasional (O2SN) Tk. Nasional',
    date: '19 - 23 Agustus 2026',
    category: 'Kesiswaan',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 7,
    name: 'Libur Maulid Nabi Muhammad SAW',
    date: '25 Agustus 2026',
    category: 'Libur Resmi',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 8,
    name: 'Olimpiade Sains Nasional (OSN) Jenjang Dikdas Tk. Nasional',
    date: '25 - 31 Agustus 2026',
    category: 'Akademik',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 9,
    name: 'FLS2N Jenjang Pendidikan Dasar Tk. Nasional (Daring)',
    date: '28 Sep - 03 Okt 2026',
    category: 'Kreativitas',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 10,
    name: 'Gelar Aksi Karakter Siswa Indonesia Tk. Provinsi',
    date: '21 November 2026',
    category: 'Kesiswaan',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 11,
    name: 'Peringatan Hari Guru Nasional',
    date: '25 November 2026',
    category: 'Kegiatan',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 12,
    name: 'Pelaksanaan Sumatif Akhir Semester 1 (SAS 1)',
    date: '30 Nov - 11 Des 2026',
    category: 'Ujian CBT',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 13,
    name: 'Hari Disabilitas Internasional',
    date: '03 Desember 2026',
    category: 'Kegiatan',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 14,
    name: 'Penetapan dan Pembagian Rapor Semester 1',
    date: '23 Desember 2026',
    category: 'Akademik',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 15,
    name: 'Cuti Bersama & Libur Hari Natal',
    date: '24 - 25 Desember 2026',
    category: 'Libur Resmi',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 16,
    name: 'Libur Semester 1',
    date: '28 Des 2026 - 08 Jan 2027',
    category: 'Libur Semester',
    semester: 'Semester 1',
    status: 'Mendatang'
  },

  // SEMESTER 2 (2027)
  {
    id: 17,
    name: 'Hari Pertama Masuk Sekolah Semester 2',
    date: '11 Januari 2027',
    category: 'Akademik',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 18,
    name: 'Kegiatan Penumbuhan Budi Pekerti (SMARTTREN Ramadhan)',
    date: '15 Feb - 05 Mar 2027',
    category: 'Kegiatan',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 19,
    name: 'Perkiraan Libur Hari Raya Idul Fitri 1448 H',
    date: '08 - 19 Maret 2027',
    category: 'Libur Resmi',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 20,
    name: 'Libur Wafat Isa Almasih',
    date: '26 April 2027',
    category: 'Libur Resmi',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 21,
    name: 'Hari Pendidikan Nasional (Hardiknas)',
    date: '02 Mei 2027',
    category: 'Kegiatan',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 22,
    name: 'Perkiraan Sumatif Akhir Jenjang SMP (Ujian Sekolah Kelas 9)',
    date: '11 - 21 Mei 2027',
    category: 'Ujian CBT',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 23,
    name: 'Perkiraan Penetapan Kelulusan Siswa Kelas 9',
    date: '02 Juni 2027',
    category: 'Akademik',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 24,
    name: 'Perkiraan Sumatif Akhir Tahun (SAT) / Akhir Fase',
    date: '07 - 18 Juni 2027',
    category: 'Ujian CBT',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 25,
    name: 'Tanggal Penetapan dan Pembagian Rapor Semester 2',
    date: '25 Juni 2027',
    category: 'Akademik',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 26,
    name: 'Libur Akhir Tahun Pelajaran',
    date: '28 Juni - 09 Juli 2027',
    category: 'Libur Semester',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 27,
    name: 'Masa SPMB / PPDB Tahun Pelajaran 2027/2028',
    date: 'Juni - Juli 2027',
    category: 'Akademik',
    semester: 'Semester 2',
    status: 'Mendatang'
  }
];

const STORAGE_KEY = 'smpn3_agenda_data_v2';
const EVENT_NAME = 'smpn3_agenda_updated';
const PDF_INFO_STORAGE_KEY = 'smpn3_kaldik_pdf_info_v2';
export const DEFAULT_PDF_URL = '/kalender-akademik-smpn3.pdf';
export const DEFAULT_PDF_NAME = 'Kalender-Pendidikan-SMPN-3-Cihampelas-2026-2027.pdf';

export interface KaldikPdfInfo {
  url: string;
  fileName: string;
  updatedAt?: string;
}

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
    } catch {}
  }
  return defaultInfo;
}

export function getStoredAgenda(): AgendaItem[] {
  if (typeof window === 'undefined') return OFFICIAL_KALDIK_SMPN3;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // First time initialization: populate storage with the 27 official kaldik items
      localStorage.setItem(STORAGE_KEY, JSON.stringify(OFFICIAL_KALDIK_SMPN3));
      return OFFICIAL_KALDIK_SMPN3;
    }
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((p) => ({
        id: p.id || Date.now(),
        name: p.name || p.title || 'Agenda Sekolah',
        date: p.date || 'Mendatang',
        category: p.category || p.type || 'Akademik',
        status: p.status || 'Mendatang',
        semester: p.semester || 'Semester 1'
      }));
    }
    return OFFICIAL_KALDIK_SMPN3;
  } catch (err) {
    console.error('Error reading agenda from storage', err);
    return OFFICIAL_KALDIK_SMPN3;
  }
}

export function saveStoredAgenda(items: AgendaItem[]): AgendaItem[] {
  if (typeof window === 'undefined') return items;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT_NAME));
    return items;
  } catch (err) {
    console.error('Error saving agenda to storage', err);
    return items;
  }
}

export function addStoredAgenda(item: Omit<AgendaItem, 'id' | 'status'> & { status?: string }): AgendaItem[] {
  const current = getStoredAgenda();
  const newItem: AgendaItem = {
    ...item,
    id: Date.now(),
    status: item.status || 'Mendatang',
    semester: item.semester || 'Semester 1'
  };
  const updated = [...current, newItem];
  return saveStoredAgenda(updated);
}

export function updateStoredAgenda(id: number, patch: Partial<AgendaItem>): AgendaItem[] {
  const current = getStoredAgenda();
  const updated = current.map((item) => (item.id === id ? { ...item, ...patch } : item));
  return saveStoredAgenda(updated);
}

export function deleteStoredAgenda(id: number): AgendaItem[] {
  const current = getStoredAgenda();
  const updated = current.filter((item) => item.id !== id);
  return saveStoredAgenda(updated);
}

export function resetStoredAgenda(): AgendaItem[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(OFFICIAL_KALDIK_SMPN3));
    window.dispatchEvent(new Event(EVENT_NAME));
  }
  return OFFICIAL_KALDIK_SMPN3;
}

export function useAgendaData() {
  const [agendaList, setAgendaList] = useState<AgendaItem[]>(OFFICIAL_KALDIK_SMPN3);
  const [pdfInfo, setPdfInfo] = useState<KaldikPdfInfo>({
    url: DEFAULT_PDF_URL,
    fileName: DEFAULT_PDF_NAME
  });

  useEffect(() => {
    // Initial sync
    setAgendaList(getStoredAgenda());
    setPdfInfo(getStoredPdfInfo());

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
  }, []);

  return {
    agendaList,
    pdfInfo,
    addAgenda: (item: Omit<AgendaItem, 'id' | 'status'> & { status?: string }) => addStoredAgenda(item),
    updateAgenda: (id: number, patch: Partial<AgendaItem>) => updateStoredAgenda(id, patch),
    deleteAgenda: (id: number) => deleteStoredAgenda(id),
    resetAgenda: () => resetStoredAgenda(),
    updatePdfInfo: (info: Partial<KaldikPdfInfo>) => saveStoredPdfInfo(info),
    resetPdfInfo: () => resetStoredPdfInfo()
  };
}

