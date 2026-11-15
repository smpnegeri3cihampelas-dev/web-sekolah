'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AgendaItem } from '@/lib/agendaData';

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const MONTH_INDEX_MAP: Record<string, number> = {
  jan: 0, januari: 0,
  feb: 1, februari: 1,
  mar: 2, maret: 2,
  apr: 3, april: 3,
  mei: 4,
  jun: 5, juni: 5,
  jul: 6, juli: 6,
  agu: 7, agustus: 7,
  sep: 8, september: 8,
  okt: 9, oktober: 9,
  nov: 10, november: 10,
  des: 11, desember: 11
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatDateRange(startStr: string, endStr?: string): string {
  if (!startStr) return '';
  const [sY, sM, sD] = startStr.split('-').map(Number);
  if (!sY || !sM || !sD) return '';

  if (!endStr || endStr === startStr) {
    return `${sD} ${MONTH_NAMES_ID[sM - 1]} ${sY}`;
  }

  const [eY, eM, eD] = endStr.split('-').map(Number);
  if (!eY || !eM || !eD) {
    return `${sD} ${MONTH_NAMES_ID[sM - 1]} ${sY}`;
  }

  // Same year and same month: "03 - 26 Agustus 2026"
  if (sY === eY && sM === eM) {
    return `${pad(sD)} - ${pad(eD)} ${MONTH_NAMES_ID[sM - 1]} ${sY}`;
  }

  // Same year, different month: "30 Nov - 11 Des 2026"
  if (sY === eY && sM !== eM) {
    return `${pad(sD)} ${MONTH_SHORT_ID[sM - 1]} - ${pad(eD)} ${MONTH_SHORT_ID[eM - 1]} ${sY}`;
  }

  // Different year: "28 Des 2026 - 08 Jan 2027"
  return `${pad(sD)} ${MONTH_SHORT_ID[sM - 1]} ${sY} - ${pad(eD)} ${MONTH_SHORT_ID[eM - 1]} ${eY}`;
}

export function parseDateStringToRange(dateStr: string): { startDate: string; endDate: string; isRange: boolean } | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();

  // 1. Cross year range: "28 Des 2026 - 08 Jan 2027"
  const crossYear = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
  if (crossYear) {
    const sM = MONTH_INDEX_MAP[crossYear[2].toLowerCase().slice(0, 3)];
    const eM = MONTH_INDEX_MAP[crossYear[5].toLowerCase().slice(0, 3)];
    if (sM !== undefined && eM !== undefined) {
      return {
        startDate: `${crossYear[3]}-${pad(sM + 1)}-${pad(parseInt(crossYear[1], 10))}`,
        endDate: `${crossYear[6]}-${pad(eM + 1)}-${pad(parseInt(crossYear[4], 10))}`,
        isRange: true
      };
    }
  }

  // 2. Cross month range: "30 Nov - 11 Des 2026"
  const crossMonth = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
  if (crossMonth) {
    const sM = MONTH_INDEX_MAP[crossMonth[2].toLowerCase().slice(0, 3)];
    const eM = MONTH_INDEX_MAP[crossMonth[4].toLowerCase().slice(0, 3)];
    const year = crossMonth[5];
    if (sM !== undefined && eM !== undefined) {
      return {
        startDate: `${year}-${pad(sM + 1)}-${pad(parseInt(crossMonth[1], 10))}`,
        endDate: `${year}-${pad(eM + 1)}-${pad(parseInt(crossMonth[3], 10))}`,
        isRange: true
      };
    }
  }

  // 3. Multi range in same month: "15 - 17 & 20 - 21 Juli 2026"
  const multiRange = trimmed.match(/^(\d{1,2}).+[-–]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
  if (multiRange) {
    const m = MONTH_INDEX_MAP[multiRange[3].toLowerCase().slice(0, 3)];
    const year = multiRange[4];
    if (m !== undefined) {
      return {
        startDate: `${year}-${pad(m + 1)}-${pad(parseInt(multiRange[1], 10))}`,
        endDate: `${year}-${pad(m + 1)}-${pad(parseInt(multiRange[2], 10))}`,
        isRange: true
      };
    }
  }

  // 4. Same month range: "03 - 26 Agustus 2026"
  const stdRange = trimmed.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
  if (stdRange) {
    const m = MONTH_INDEX_MAP[stdRange[3].toLowerCase().slice(0, 3)];
    const year = stdRange[4];
    if (m !== undefined) {
      return {
        startDate: `${year}-${pad(m + 1)}-${pad(parseInt(stdRange[1], 10))}`,
        endDate: `${year}-${pad(m + 1)}-${pad(parseInt(stdRange[2], 10))}`,
        isRange: true
      };
    }
  }

  // 5. Month range: "Juni - Juli 2027"
  const monthRange = trimmed.match(/^([A-Za-z]+)\s*[-–]\s*([A-Za-z]+)\s+(\d{4})/i);
  if (monthRange) {
    const sM = MONTH_INDEX_MAP[monthRange[1].toLowerCase().slice(0, 3)];
    const eM = MONTH_INDEX_MAP[monthRange[2].toLowerCase().slice(0, 3)];
    const year = monthRange[3];
    if (sM !== undefined && eM !== undefined) {
      return {
        startDate: `${year}-${pad(sM + 1)}-01`,
        endDate: `${year}-${pad(eM + 1)}-28`,
        isRange: true
      };
    }
  }

  // 6. Single date: "13 Juli 2026"
  const single = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
  if (single) {
    const m = MONTH_INDEX_MAP[single[2].toLowerCase().slice(0, 3)];
    const year = single[3];
    if (m !== undefined) {
      const d = `${year}-${pad(m + 1)}-${pad(parseInt(single[1], 10))}`;
      return {
        startDate: d,
        endDate: d,
        isRange: false
      };
    }
  }

  return null;
}

// Subcomponent: Pure Visual Date Picker (Satu Hari atau Rentang Mulai - Selesai)
function DateRangePicker({
  value,
  onChange
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const parsed = useMemo(() => parseDateStringToRange(value), [value]);
  const [isRange, setIsRange] = useState<boolean>(() => parsed?.isRange ?? true);
  const [startDate, setStartDate] = useState<string>(() => parsed?.startDate ?? '');
  const [endDate, setEndDate] = useState<string>(() => (parsed?.isRange ? parsed?.endDate : '') ?? '');

  useEffect(() => {
    const p = parseDateStringToRange(value);
    if (p) {
      setIsRange(p.isRange);
      setStartDate(p.startDate);
      setEndDate(p.isRange ? p.endDate : '');
    } else if (!value) {
      setStartDate('');
      setEndDate('');
      setIsRange(true);
    }
  }, [value]);

  const handleStartChange = (val: string) => {
    setStartDate(val);
    const effectiveEnd = isRange ? (endDate && endDate >= val ? endDate : val) : '';
    if (isRange && (!endDate || endDate < val)) {
      setEndDate(val);
    }
    const formatted = formatDateRange(val, effectiveEnd);
    onChange(formatted);
  };

  const handleEndChange = (val: string) => {
    setEndDate(val);
    const formatted = formatDateRange(startDate, val);
    onChange(formatted);
  };

  const handleToggleRange = (range: boolean) => {
    setIsRange(range);
    if (!range) {
      setEndDate('');
      const formatted = formatDateRange(startDate, '');
      onChange(formatted);
    } else {
      const effectiveEnd = endDate && endDate >= startDate ? endDate : startDate;
      setEndDate(effectiveEnd);
      const formatted = formatDateRange(startDate, effectiveEnd);
      onChange(formatted);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-slate-800 block font-black text-xs">Rentang Tanggal *</label>

      <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
        {/* Tipe: Satu Hari Saja vs Rentang Tanggal */}
        <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="dateTypeSelection"
              checked={!isRange}
              onChange={() => handleToggleRange(false)}
              className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Satu Hari Saja</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="dateTypeSelection"
              checked={isRange}
              onChange={() => handleToggleRange(true)}
              className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Rentang (Mulai - Selesai)</span>
          </label>
        </div>

        {/* Input Pemilih Kalender HTML5 */}
        <div className={`grid gap-2.5 ${isRange ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          <div>
            <span className="text-[11px] font-bold text-slate-700 block mb-1">
              {isRange ? 'Tanggal Mulai *' : 'Tanggal Kegiatan *'}
            </span>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => handleStartChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-2xs"
            />
          </div>

          {isRange && (
            <div>
              <span className="text-[11px] font-bold text-slate-700 block mb-1">Tanggal Selesai *</span>
              <input
                type="date"
                required
                min={startDate || undefined}
                value={endDate}
                onChange={(e) => handleEndChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-2xs"
              />
            </div>
          )}
        </div>

        {/* Kotak Preview Format Otomatis */}
        <div className="pt-2 flex items-center justify-between text-[11px] border-t border-slate-200">
          <span className="text-slate-600 font-semibold">Hasil Format Kalender:</span>
          <span className="font-mono font-black text-indigo-950 bg-white border-2 border-indigo-200 px-2.5 py-1 rounded-lg shadow-2xs">
            {value ? `📅 ${value}` : 'Pilih tanggal pada kalender'}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 font-semibold">
        Format otomatis disesuaikan dengan kalender pendidikan dan sistem status kegiatan sekolah.
      </p>
    </div>
  );
}

interface AddAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; date: string; category: string; semester?: string }) => void;
  showToast: (msg: string) => void;
}

export function AddAgendaModal({ isOpen, onClose, onAdd, showToast }: AddAgendaModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Akademik');
  const [semester, setSemester] = useState('Semester 1');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDate('');
      setCategory('Akademik');
      setSemester('Semester 1');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('⚠️ Nama agenda kegiatan wajib diisi!');
      return;
    }
    if (!date.trim()) {
      showToast('⚠️ Harap pilih tanggal agenda pada kalender!');
      return;
    }

    onAdd({
      name: name.trim(),
      date: date.trim() || 'Mendatang',
      category,
      semester
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
        className="w-full max-w-lg rounded-3xl bg-white border-2 border-slate-300 p-6 shadow-2xl relative"
      >
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100 mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-950">Tambah Agenda Akademik</h3>
            <p className="text-xs text-slate-600 font-bold mt-0.5">Jadwal kegiatan atau ujian sekolah (Tersinkron Database MariaDB)</p>
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

          {/* Pure Visual Date Picker */}
          <DateRangePicker value={date} onChange={setDate} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-800 block mb-1.5 font-black text-xs">Semester *</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
              >
                <option value="Semester 1">Semester 1 (Ganjil)</option>
                <option value="Semester 2">Semester 2 (Genap)</option>
              </select>
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
                <option value="Kesiswaan">Kesiswaan</option>
                <option value="Kreativitas">Kreativitas</option>
                <option value="Libur Resmi">Libur Resmi</option>
                <option value="Libur Semester">Libur Semester</option>
              </select>
            </div>
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

interface EditAgendaModalProps {
  isOpen: boolean;
  item: AgendaItem | null;
  onClose: () => void;
  onSave: (id: number, data: Partial<AgendaItem>) => void;
  showToast: (msg: string) => void;
}

export function EditAgendaModal({ isOpen, item, onClose, onSave, showToast }: EditAgendaModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Akademik');
  const [semester, setSemester] = useState('Semester 1');

  useEffect(() => {
    if (item) {
      setName(item.name || item.title || '');
      setDate(item.date || '');
      setCategory(item.category || item.type || 'Akademik');
      setSemester(item.semester || 'Semester 1');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('⚠️ Nama agenda kegiatan wajib diisi!');
      return;
    }
    if (!date.trim()) {
      showToast('⚠️ Harap pilih tanggal agenda pada kalender!');
      return;
    }

    onSave(item.id, {
      name: name.trim(),
      date: date.trim() || 'Mendatang',
      category,
      semester
    });
    showToast('✏️ Agenda berhasil diperbarui!');
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
        className="w-full max-w-lg rounded-3xl bg-white border-2 border-slate-300 p-6 shadow-2xl relative"
      >
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100 mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-950">Edit Agenda Akademik</h3>
            <p className="text-xs text-slate-600 font-bold mt-0.5">Perbarui nama kegiatan, jadwal, atau kategori (Database MariaDB)</p>
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
            />
          </div>

          {/* Pure Visual Date Picker */}
          <DateRangePicker value={date} onChange={setDate} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-800 block mb-1.5 font-black text-xs">Semester *</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-xs"
              >
                <option value="Semester 1">Semester 1 (Ganjil)</option>
                <option value="Semester 2">Semester 2 (Genap)</option>
              </select>
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
                <option value="Kesiswaan">Kesiswaan</option>
                <option value="Kreativitas">Kreativitas</option>
                <option value="Libur Resmi">Libur Resmi</option>
                <option value="Libur Semester">Libur Semester</option>
              </select>
            </div>
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
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
