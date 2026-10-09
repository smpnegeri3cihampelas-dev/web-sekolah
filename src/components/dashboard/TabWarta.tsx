'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { WartaItem } from '@/lib/wartaData';

interface TabWartaProps {
  newsList: WartaItem[];
  onOpenAdd: () => void;
  onOpenEdit: (item: WartaItem) => void;
  onDelete: (id: number) => void;
}

export function TabWarta({ newsList, onOpenAdd, onOpenEdit, onDelete }: TabWartaProps) {
  const [newsSearch, setNewsSearch] = useState('');
  const [newsFilter, setNewsFilter] = useState('SEMUA');

  // Filtered news memoized
  const filteredNews = useMemo(() => {
    const q = newsSearch.toLowerCase().trim();
    return newsList.filter(n => {
      const matchCategory = newsFilter === 'SEMUA' || n.category.toUpperCase() === newsFilter;
      const matchSearch = !q || n.title.toLowerCase().includes(q) || (n.excerpt && n.excerpt.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [newsList, newsFilter, newsSearch]);

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* CMS Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-950 tracking-tight">Manajemen Warta & Berita</h2>
          <p className="text-xs text-slate-700 font-semibold mt-0.5">Kelola artikel warta yang tampil pada Bento Grid halaman utama</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="/warta"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border-2 border-slate-300 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Buka halaman publik kumpulan warta berhalaman"
          >
            <span>🌐</span>
            <span>Lihat Halaman Warta Publik</span>
          </a>
          <button
            type="button"
            onClick={onOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98"
          >
            <span>+ Tulis Warta Baru</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['SEMUA', 'PRESTASI', 'PENGUMUMAN', 'INOVASI', 'AKADEMIK', 'KEGIATAN'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setNewsFilter(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                newsFilter === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-800 border-2 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={newsSearch}
            onChange={(e) => setNewsSearch(e.target.value)}
            placeholder="Cari judul warta..."
            className="w-full sm:w-64 pl-8 pr-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-xs font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
            🔍
          </span>
        </div>
      </div>

      {/* Table of Articles */}
      <div className="rounded-2xl bg-white border-2 border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-900 font-mono uppercase text-xs tracking-wider border-b-2 border-slate-300 font-black">
              <tr>
                <th className="py-4 px-4 sm:px-6">Artikel</th>
                <th className="py-4 px-4">Kategori</th>
                <th className="py-4 px-4">Tanggal</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredNews.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden relative flex-shrink-0 bg-slate-200 border border-slate-300">
                        <Image src={item.src} alt={item.title} fill className="object-cover" />
                      </div>
                      <span className="font-black text-slate-950 text-sm max-w-md truncate">
                        {item.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold text-indigo-900 border border-indigo-300 bg-indigo-50">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-700 font-mono font-bold text-xs">{item.date}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold ${
                      item.status === 'Published'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenEdit(item)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border-2 border-slate-300 transition-colors cursor-pointer"
                        title="Edit Warta"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-300 transition-colors cursor-pointer"
                        title="Hapus Warta"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredNews.length === 0 && (
          <div className="py-12 text-center text-slate-700 text-xs font-bold">
            Tidak ada artikel warta yang cocok dengan pencarian.
          </div>
        )}
      </div>
    </div>
  );
}
