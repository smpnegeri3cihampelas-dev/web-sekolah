'use client';

import React, { useState, useEffect } from 'react';
import { Student, SCHOOL_CLASSES } from '@/lib/elearningData';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; nisn: string; nis: string; classId: string }) => void;
  showToast: (msg: string) => void;
}

export function AddStudentModal({ isOpen, onClose, onAdd, showToast }: AddStudentModalProps) {
  const [name, setName] = useState('');
  const [nisn, setNisn] = useState('');
  const [nis, setNis] = useState('');
  const [classId, setClassId] = useState('7-A');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setNisn('');
      setNis('');
      setClassId('7-A');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('⚠️ Nama lengkap siswa wajib diisi!');
      return;
    }

    onAdd({
      name: name.trim(),
      nisn: nisn.trim() || `01${Math.floor(10000000 + Math.random() * 90000000)}`,
      nis: nis.trim(),
      classId
    });
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
        className="bg-white border-2 border-slate-300 rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200 mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-950">Tambah Siswa Baru</h3>
            <p className="text-xs text-slate-600 font-bold mt-0.5">Daftarkan peserta didik secara manual</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-bold flex items-center justify-center border border-slate-300 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-800 block mb-1 font-extrabold">Nama Lengkap Siswa *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Contoh: Muhammad Rizky Pratama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-800 block mb-1 font-extrabold">NISN (10 Digit)</label>
              <input
                type="text"
                placeholder="Contoh: 0134567890"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="text-slate-800 block mb-1 font-extrabold">NIS Sekolah</label>
              <input
                type="text"
                placeholder="Contoh: 262707050"
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-800 block mb-1 font-extrabold">Kelas / Rombongan Belajar *</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
            >
              {SCHOOL_CLASSES.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold cursor-pointer transition-colors active:scale-98"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98 transition-all"
            >
              Simpan Siswa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditStudentModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onSave: (id: string, data: { name: string; nisn: string; nis: string; classId: string }) => void;
  onDelete?: (id: string, name: string) => void;
  showToast: (msg: string) => void;
}

export function EditStudentModal({ isOpen, student, onClose, onSave, onDelete, showToast }: EditStudentModalProps) {
  const [name, setName] = useState('');
  const [nisn, setNisn] = useState('');
  const [nis, setNis] = useState('');
  const [classId, setClassId] = useState('7-A');

  useEffect(() => {
    if (student) {
      setName(student.name || '');
      setNisn(student.nisn || '');
      setNis(student.nis || '');
      setClassId(student.classId || '7-A');
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('⚠️ Nama lengkap siswa wajib diisi!');
      return;
    }

    onSave(student.id, {
      name: name.trim(),
      nisn: nisn.trim(),
      nis: nis.trim(),
      classId
    });
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
        className="bg-white border-2 border-slate-300 rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200 mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-950">Edit Data Siswa</h3>
            <p className="text-xs text-indigo-700 font-bold mt-0.5">ID: {student.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-bold flex items-center justify-center border border-slate-300 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-800 block mb-1 font-extrabold">Nama Lengkap Siswa *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-800 block mb-1 font-extrabold">NISN</label>
              <input
                type="text"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
            <div>
              <label className="text-slate-800 block mb-1 font-extrabold">NIS</label>
              <input
                type="text"
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-800 block mb-1 font-extrabold">Kelas / Rombel *</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
            >
              {SCHOOL_CLASSES.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex items-center justify-between border-t-2 border-slate-200">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(student.id, student.name);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 font-extrabold cursor-pointer transition-colors text-xs active:scale-98"
              >
                🗑️ Hapus
              </button>
            ) : <span />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold cursor-pointer transition-colors active:scale-98"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98 transition-all"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
