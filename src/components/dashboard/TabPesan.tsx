'use client';

import React from 'react';

interface MessageItem {
  id: number;
  sender: string;
  contact: string;
  date: string;
  subject: string;
  message: string;
  read: boolean;
}

interface TabPesanProps {
  messagesList: MessageItem[];
  onDeleteMessage: (id: number) => void;
}

export function TabPesan({ messagesList, onDeleteMessage }: TabPesanProps) {
  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-950 tracking-tight">Kotak Pesan Masuk (Kontak & Aduan)</h2>
        <p className="text-xs text-slate-700 font-semibold mt-0.5">Pesan dan pertanyaan resmi dari masyarakat dan wali murid via website</p>
      </div>

      {/* Message Cards */}
      <div className="space-y-4">
        {messagesList.map((msg) => (
          <div 
            key={msg.id}
            className={`p-5 rounded-2xl border-2 transition-all ${
              msg.read 
                ? 'bg-white border-slate-200 shadow-xs' 
                : 'bg-indigo-50/60 border-indigo-300 shadow-sm'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${msg.read ? 'bg-slate-400' : 'bg-indigo-600 animate-pulse'}`} />
                <h4 className="text-base font-black text-slate-950">{msg.sender}</h4>
                <span className="text-xs text-slate-700 font-mono font-bold">({msg.contact})</span>
              </div>
              <span className="text-xs font-mono text-slate-700 font-bold">{msg.date}</span>
            </div>

            <h5 className="text-sm font-black text-indigo-900 mb-1.5">{msg.subject}</h5>
            <p className="text-xs text-slate-800 font-medium leading-relaxed mb-4">{msg.message}</p>

            <div className="flex items-center gap-2.5">
              <a
                href={`https://wa.me/?text=Halo%20${encodeURIComponent(msg.sender)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-xs active:scale-98"
              >
                Balas via WhatsApp
              </a>
              <button
                type="button"
                onClick={() => onDeleteMessage(msg.id)}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-800 text-xs font-extrabold transition-all shadow-xs active:scale-98 cursor-pointer"
              >
                Hapus Pesan
              </button>
            </div>
          </div>
        ))}
      </div>

      {messagesList.length === 0 && (
        <div className="p-12 text-center text-slate-700 text-xs font-bold rounded-2xl bg-white border-2 border-slate-200">
          Tidak ada pesan masuk.
        </div>
      )}
    </div>
  );
}
