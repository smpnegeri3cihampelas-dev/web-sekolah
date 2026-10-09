'use client';

import React, { useState, useEffect } from 'react';

interface AddAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; date: string; category: string }) => void;
  showToast: (msg: string) => void;
}

export function AddAgendaModal({ isOpen, onClose, onAdd, showToast }: AddAgendaModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Akademik');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDate('');
      setCategory('Akademik');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('⚠️ Nama agenda kegiatan wajib diisi!');
      return;
    }

    onAdd({
      name: name.trim(),
      date: date.trim() || 'Mendatang',
      category
    });
    showToast('📅 Agenda akademik berhasil ditambahkan!');
    onClose();
  };

  return (
    <div 
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      data-lenis-prevent-touch="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
    >
      <div 
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        className="w-full max-w-md rounded-3xl bg-white border-2 border-slate-300 p-6 shadow-2xl relative"
      >
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100 mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-950">Tambah Agenda Akademik</h3>
            <p className="text-xs text-slate-600 font-bold mt-0.5">Jadwal kegiatan atau ujian sekolah</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-bold flex items-center justify-center cursor-pointer border border-slate-300 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-800 block mb-1.5 font-black text-xs">Nama Kegiatan *</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Ujian Asesmen Akhir Semester..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
            />
          </div>

          <div>
            <label className="text-slate-800 block mb-1.5 font-black text-xs">Rentang Tanggal *</label>
            <input
              type="text"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Contoh: 12 - 18 Desember 2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
            />
          </div>

          <div>
            <label className="text-slate-800 block mb-1.5 font-black text-xs">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
            >
              <option value="Akademik">Akademik</option>
              <option value="Ujian CBT">Ujian CBT</option>
              <option value="Kegiatan">Kegiatan</option>
              <option value="Kreativitas">Kreativitas</option>
              <option value="Libur Semester">Libur Semester</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold border-2 border-slate-300 cursor-pointer shadow-xs active:scale-98"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
            >
              Simpan Agenda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
