'use client';

import React, { useState } from 'react';
import { AddAgendaModal } from './AgendaModal';

interface AgendaItem {
  id: number;
  name: string;
  date: string;
  category: string;
  status: string;
}

interface TabAgendaProps {
  agendaList: AgendaItem[];
  onAddAgenda: (data: { name: string; date: string; category: string }) => void;
  onDeleteAgenda: (id: number) => void;
  showToast: (msg: string) => void;
}

export function TabAgenda({ agendaList, onAddAgenda, onDeleteAgenda, showToast }: TabAgendaProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-950 tracking-tight">Manajemen Kalender & Agenda</h2>
          <p className="text-xs text-slate-700 font-semibold mt-0.5">Jadwal pelaksanaan kegiatan akademik, ujian CBT, dan agenda resmi</p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
        >
          <span>+ Tambah Agenda Baru</span>
        </button>
      </div>

      {/* Agenda List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agendaList.map((agenda) => (
          <div 
            key={agenda.id}
            className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-400 transition-all flex items-start justify-between gap-4 shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black text-indigo-900 border border-indigo-300 bg-indigo-100">
                  {agenda.category}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
                  agenda.status === 'Berlangsung' 
                    ? 'text-amber-950 bg-amber-100 border border-amber-300' 
                    : 'text-slate-800 bg-slate-200 border border-slate-300'
                }`}>
                  {agenda.status}
                </span>
              </div>
              <h4 className="text-base font-black text-slate-950">{agenda.name}</h4>
              <p className="text-xs font-mono font-black text-indigo-700 flex items-center gap-1.5">
                <span>🗓️</span>
                <span>{agenda.date}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => onDeleteAgenda(agenda.id)}
              className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-300 transition-colors shadow-xs cursor-pointer active:scale-98"
              title="Hapus Agenda"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {agendaList.length === 0 && (
        <div className="p-12 text-center text-slate-700 text-xs font-bold rounded-2xl bg-white border-2 border-slate-200">
          Belum ada agenda akademik yang terdaftar.
        </div>
      )}

      {/* Modal */}
      <AddAgendaModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={onAddAgenda}
        showToast={showToast}
      />
    </div>
  );
}
