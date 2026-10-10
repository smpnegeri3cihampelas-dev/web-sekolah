'use client';

import React, { useState, useMemo } from 'react';
import { AgendaItem } from '@/lib/agendaData';
import { AddAgendaModal, EditAgendaModal } from './AgendaModal';

interface TabAgendaProps {
  agendaList: AgendaItem[];
  onAddAgenda: (data: { name: string; date: string; category: string; semester?: string }) => void;
  onUpdateAgenda?: (id: number, data: Partial<AgendaItem>) => void;
  onDeleteAgenda: (id: number) => void;
  onResetAgenda?: () => void;
  showToast: (msg: string) => void;
}

export function TabAgenda({
  agendaList,
  onAddAgenda,
  onUpdateAgenda,
  onDeleteAgenda,
  onResetAgenda,
  showToast
}: TabAgendaProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<'SEMUA' | 'SEM1' | 'SEM2'>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');

  const sem1Count = useMemo(() => {
    return agendaList.filter((a) => (a.semester || '').includes('1') || a.id <= 16).length;
  }, [agendaList]);

  const sem2Count = useMemo(() => {
    return agendaList.filter((a) => (a.semester || '').includes('2') || a.id > 16).length;
  }, [agendaList]);

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

  const handleReset = () => {
    if (confirm('⚠️ Apakah Anda yakin ingin mereset seluruh agenda kembali ke 27 Kaldik Resmi PDF (SK Kepala Sekolah)?')) {
      if (onResetAgenda) {
        onResetAgenda();
      }
      showToast('🔄 Agenda berhasil direset ke Kaldik Resmi PDF (27 agenda)!');
    }
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

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border-2 border-slate-200 shadow-xs">
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

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari agenda atau tanggal..."
            className="w-full pl-8 pr-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Agenda List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredList.map((agenda) => {
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

      {filteredList.length === 0 && (
        <div className="p-12 text-center text-slate-700 text-xs font-bold rounded-2xl bg-white border-2 border-slate-200">
          {searchQuery ? 'Tidak ada agenda yang cocok dengan pencarian.' : 'Belum ada agenda akademik yang terdaftar.'}
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
