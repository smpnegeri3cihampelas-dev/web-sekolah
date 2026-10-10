'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AgendaItem, KaldikPdfInfo } from '@/lib/agendaData';
import { AddAgendaModal, EditAgendaModal } from './AgendaModal';

interface TabAgendaProps {
  agendaList: AgendaItem[];
  pdfInfo?: KaldikPdfInfo;
  onAddAgenda: (data: { name: string; date: string; category: string; semester?: string }) => void;
  onUpdateAgenda?: (id: number, data: Partial<AgendaItem>) => void;
  onDeleteAgenda: (id: number) => void;
  onResetAgenda?: () => void;
  onUpdatePdfInfo?: (info: Partial<KaldikPdfInfo>) => void;
  onResetPdfInfo?: () => void;
  showToast: (msg: string) => void;
}

export function TabAgenda({
  agendaList,
  pdfInfo,
  onAddAgenda,
  onUpdateAgenda,
  onDeleteAgenda,
  onResetAgenda,
  onUpdatePdfInfo,
  onResetPdfInfo,
  showToast
}: TabAgendaProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<'SEMUA' | 'SEM1' | 'SEM2'>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');
  const [pdfLinkInput, setPdfLinkInput] = useState('');

  // View Mode & Pagination State
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  const sem1Count = useMemo(() => {
    return agendaList.filter((a) => (a.semester || '').includes('1') || a.id <= 16).length;
  }, [agendaList]);

  const sem2Count = useMemo(() => {
    return agendaList.filter((a) => (a.semester || '').includes('2') || a.id > 16).length;
  }, [agendaList]);

  // Reset to page 1 when filter/search/pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery, pageSize]);

  const filteredList = useMemo(() => {
    return agendaList.filter((item) => {
      const sem = (item.semester || '').toLowerCase();
      const isSem1 = sem.includes('1') || item.id <= 16;
      const isSem2 = sem.includes('2') || item.id > 16;

      if (activeFilter === 'SEM1' && !isSem1) return false;
      if (activeFilter === 'SEM2' && !isSem2) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (item.name || item.title || '').toLowerCase().includes(q);
        const dateMatch = (item.date || '').toLowerCase().includes(q);
        const catMatch = (item.category || item.type || '').toLowerCase().includes(q);
        return nameMatch || dateMatch || catMatch;
      }

      return true;
    });
  }, [agendaList, activeFilter, searchQuery]);

  // Pagination calculation
  const totalItems = filteredList.length;
  const effectivePageSize = pageSize === 0 ? totalItems || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  
  const paginatedList = useMemo(() => {
    if (pageSize === 0) return filteredList;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredList.slice(startIndex, startIndex + pageSize);
  }, [filteredList, currentPage, pageSize]);

  const handleReset = () => {
    if (confirm('⚠️ Apakah Anda yakin ingin mereset seluruh agenda kembali ke 27 Kaldik Resmi PDF (SK Kepala Sekolah)?')) {
      if (onResetAgenda) {
        onResetAgenda();
      }
      showToast('🔄 Agenda berhasil direset ke Kaldik Resmi PDF (27 agenda)!');
    }
  };

  const handlePdfFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('⚠️ Harap pilih berkas dengan format PDF (.pdf)!');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('⚠️ Ukuran file PDF terlalu besar (maksimal 15MB)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (onUpdatePdfInfo) {
        onUpdatePdfInfo({
          url: dataUrl,
          fileName: file.name
        });
      }
      showToast(`✅ Berkas PDF "${file.name}" berhasil diunggah & tersinkron ke Landing Page!`);
    };
    reader.onerror = () => {
      showToast('❌ Gagal memproses berkas PDF.');
    };
    reader.readAsDataURL(file);
  };

  const handleSavePdfLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfLinkInput.trim()) {
      showToast('⚠️ Harap masukkan tautan link PDF atau Google Drive!');
      return;
    }

    if (onUpdatePdfInfo) {
      onUpdatePdfInfo({
        url: pdfLinkInput.trim(),
        fileName: 'Kalender-Akademik-Dokumen.pdf'
      });
    }
    setPdfLinkInput('');
    showToast('✅ Tautan dokumen PDF berhasil disimpan & aktif di Beranda!');
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-950 tracking-tight">Manajemen Kalender & Agenda</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
              ⚡ Tersinkron Otomatis
            </span>
          </div>
          <p className="text-xs text-slate-700 font-semibold mt-0.5">
            Jadwal kegiatan akademik, ujian CBT, dan agenda resmi (Langsung terhubung dengan tampilan Halaman Utama)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onResetAgenda && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300 active:scale-98"
              title="Kembalikan semua agenda ke Kaldik Resmi PDF SMPN 3 Cihampelas"
            >
              <span>🔄 Reset ke Kaldik Resmi (27)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
          >
            <span>+ Tambah Agenda Baru</span>
          </button>
        </div>
      </div>

      {/* CARD KELOLA DOKUMEN PDF KALDIK */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-600 flex items-center justify-center text-2xl shrink-0">
              📑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-950">File Dokumen PDF Kalender Resmi</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-50 text-rose-700 border border-rose-200">
                  Unduhan Pengunjung
                </span>
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                Dokumen ini otomatis diunduh saat pengunjung klik tombol <strong>&ldquo;Unduh PDF Asli&rdquo;</strong> di Kalender Beranda.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <a
              href={pdfInfo?.url || '/kalender-akademik-smpn3.pdf'}
              target="_blank"
              rel="noopener noreferrer"
              download={pdfInfo?.fileName || 'Kalender-Pendidikan-SMPN-3-Cihampelas-2026-2027.pdf'}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-300 cursor-pointer shadow-2xs"
            >
              <span>👁️ Pratinjau / Unduh File Aktif</span>
            </a>

            {onResetPdfInfo && (
              <button
                type="button"
                onClick={() => {
                  onResetPdfInfo();
                  showToast('🔄 Dokumen PDF dikembalikan ke file server bawaan.');
                }}
                className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-all border border-slate-200 cursor-pointer"
                title="Kembalikan tautan ke file PDF bawaan server"
              >
                Reset Bawaan
              </button>
            )}
          </div>
        </div>

        {/* 2 Opsi Penggantian Dokumen PDF */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          {/* Opsi 1: Upload File PDF */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base">📤</span>
              <h4 className="text-xs font-black text-slate-900">Opsi 1: Upload File PDF Langsung</h4>
            </div>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              Pilih file PDF kalender bertanda tangan dari komputer/laptop/HP Anda. File langsung tersimpan & aktif di Beranda.
            </p>
            <div className="pt-1 flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs active:scale-98">
                <span>📁 Pilih Berkas PDF Baru</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handlePdfFileUpload}
                />
              </label>
              <span className="text-[11px] text-slate-600 font-mono truncate max-w-[200px]" title={pdfInfo?.fileName}>
                {pdfInfo?.fileName || 'kalender-akademik-smpn3.pdf'}
              </span>
            </div>
          </div>

          {/* Opsi 2: Link Google Drive / Cloud */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base">🔗</span>
              <h4 className="text-xs font-black text-slate-900">Opsi 2: Tautkan Link Google Drive / Cloud</h4>
            </div>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              Jika file disimpan di Google Drive sekolah atau link cloud, masukkan link berbagi publik dokumen tersebut.
            </p>
            <form onSubmit={handleSavePdfLink} className="pt-1 flex items-center gap-2">
              <input
                type="url"
                value={pdfLinkInput}
                onChange={(e) => setPdfLinkInput(e.target.value)}
                placeholder="https://drive.google.com/file/d/... atau https://..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98 shrink-0"
              >
                Simpan
              </button>
            </form>
          </div>
        </div>

        {/* Petunjuk Server / cPanel Hostinger */}
        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-2.5">
          <span className="text-base shrink-0">💡</span>
          <div className="space-y-0.5 text-[11px]">
            <p className="font-bold">
              Lokasi File Permanen di Server (Hostinger / cPanel):
            </p>
            <p className="text-indigo-900 leading-relaxed">
              Anda juga bisa menaruh atau menimpa file fisik secara langsung di folder: <code className="bg-white/80 px-1.5 py-0.5 rounded text-indigo-950 font-mono font-bold">public/kalender-akademik-smpn3.pdf</code> melalui File Manager Hostinger atau Git. File tersebut adalah sumber utama berkas unduhan website.
            </p>
          </div>
        </div>
      </div>

      {/* TOOLBAR FILTER, PENCARIAN & VIEW TOGGLE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border-2 border-slate-200 shadow-xs">
        {/* Semester Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveFilter('SEMUA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'SEMUA'
                ? 'bg-white text-indigo-900 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({agendaList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('SEM1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'SEM1'
                ? 'bg-white text-indigo-900 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semester 1 ({sem1Count})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('SEM2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'SEM2'
                ? 'bg-white text-indigo-900 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semester 2 ({sem2Count})
          </button>
        </div>

        {/* Right Controls: Search, View Mode, Items Per Page */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari agenda atau tanggal..."
              className="w-full pl-8 pr-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Tabel Ringkas (Hemat Ruang & Cepat)"
            >
              <span>📑 Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Kartu Grid"
            >
              <span>🗂️ Kartu</span>
            </button>
          </div>

          {/* Page Size Selector */}
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-600 cursor-pointer"
            title="Jumlah agenda yang dimuat per halaman"
          >
            <option value={8}>8 per hal</option>
            <option value={16}>16 per hal</option>
            <option value={0}>Semua</option>
          </select>
        </div>
      </div>

      {/* TAMPILAN 1: MODE TABEL RINGKAS (COMPACT TABLE VIEW) */}
      {viewMode === 'table' && paginatedList.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b-2 border-slate-200 text-slate-700 font-black uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Kegiatan & Jadwal</th>
                  <th className="py-3 px-3">Semester</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 font-semibold text-slate-800">
                {paginatedList.map((agenda, index) => {
                  const semesterLabel = agenda.semester || (agenda.id <= 16 ? 'Semester 1' : 'Semester 2');
                  const itemIndex = pageSize === 0 ? index + 1 : (currentPage - 1) * pageSize + index + 1;
                  return (
                    <tr 
                      key={agenda.id}
                      className="hover:bg-indigo-50/40 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center text-slate-500 font-mono font-bold">
                        {itemIndex}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-950 text-sm leading-snug">
                          {agenda.name || agenda.title}
                        </div>
                        <div className="text-[11px] font-mono text-indigo-700 font-bold flex items-center gap-1.5 mt-0.5">
                          <span>🗓️</span>
                          <span>{agenda.date}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black text-purple-900 border border-purple-200 bg-purple-50">
                          {semesterLabel}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black text-indigo-900 border border-indigo-200 bg-indigo-50">
                          {agenda.category || agenda.type || 'Akademik'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
                          agenda.status === 'Berlangsung' 
                            ? 'text-amber-950 bg-amber-100 border border-amber-300' 
                            : agenda.status === 'Selesai'
                            ? 'text-slate-600 bg-slate-100 border border-slate-300'
                            : 'text-emerald-950 bg-emerald-100 border border-emerald-300'
                        }`}>
                          {agenda.status || 'Mendatang'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {onUpdateAgenda && (
                            <button
                              type="button"
                              onClick={() => setEditingItem(agenda)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 border border-slate-200 transition-colors cursor-pointer"
                              title="Edit Agenda"
                            >
                              ✏️
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteAgenda(agenda.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors cursor-pointer"
                            title="Hapus Agenda"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAMPILAN 2: MODE KARTU GRID (CARD VIEW) */}
      {viewMode === 'grid' && paginatedList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedList.map((agenda) => {
            const semesterLabel = agenda.semester || (agenda.id <= 16 ? 'Semester 1' : 'Semester 2');
            return (
              <div 
                key={agenda.id}
                className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-400 transition-all flex items-start justify-between gap-4 shadow-sm group"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black text-indigo-900 border border-indigo-300 bg-indigo-100">
                      {agenda.category || agenda.type || 'Akademik'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black text-purple-900 border border-purple-300 bg-purple-50">
                      {semesterLabel}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
                      agenda.status === 'Berlangsung' 
                        ? 'text-amber-950 bg-amber-100 border border-amber-300' 
                        : agenda.status === 'Selesai'
                        ? 'text-slate-600 bg-slate-100 border border-slate-300'
                        : 'text-emerald-950 bg-emerald-100 border border-emerald-300'
                    }`}>
                      {agenda.status || 'Mendatang'}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-950 leading-snug break-words">
                    {agenda.name || agenda.title}
                  </h4>
                  <p className="text-xs font-mono font-black text-indigo-700 flex items-center gap-1.5">
                    <span>🗓️</span>
                    <span>{agenda.date}</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {onUpdateAgenda && (
                    <button
                      type="button"
                      onClick={() => setEditingItem(agenda)}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border-2 border-slate-200 hover:border-indigo-300 transition-colors shadow-xs cursor-pointer active:scale-98"
                      title="Edit Agenda"
                    >
                      ✏️
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteAgenda(agenda.id)}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-300 transition-colors shadow-xs cursor-pointer active:scale-98"
                    title="Hapus Agenda"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KOSONG / TIDAK DITEMUKAN */}
      {filteredList.length === 0 && (
        <div className="p-12 text-center text-slate-700 text-xs font-bold rounded-2xl bg-white border-2 border-slate-200">
          {searchQuery ? 'Tidak ada agenda yang cocok dengan pencarian.' : 'Belum ada agenda akademik yang terdaftar.'}
        </div>
      )}

      {/* KONTROL PAGINASI (PAGINATION) ANTI-LAG */}
      {totalItems > 0 && pageSize > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-600">
            Menampilkan <span className="text-indigo-900 font-black">{(currentPage - 1) * pageSize + 1}</span> - <span className="text-indigo-900 font-black">{Math.min(currentPage * pageSize, totalItems)}</span> dari <span className="text-indigo-900 font-black">{totalItems}</span> agenda
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer transition-all active:scale-98"
            >
              « Sebelumnya
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer transition-all active:scale-98"
            >
              Selanjutnya »
            </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <AddAgendaModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={onAddAgenda}
        showToast={showToast}
      />

      {/* Edit Modal */}
      <EditAgendaModal
        isOpen={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={(id, data) => {
          if (onUpdateAgenda) {
            onUpdateAgenda(id, data);
          }
        }}
        showToast={showToast}
      />
    </div>
  );
}
