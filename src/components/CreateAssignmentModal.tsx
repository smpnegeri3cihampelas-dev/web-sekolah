'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Assignment, QuizQuestion, SCHOOL_CLASSES } from '@/lib/elearningData';

interface CreateAssignmentModalProps {
  currentTeacher: {
    nip: string;
    name: string;
    subject: string;
    classes: string[];
  };
  onClose: () => void;
  onSubmit: (newAssignment: Assignment) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
  defaultClass?: string;
}

// -------------------------------------------------------------
// SUB-COMPONENT: KARTU SOAL KUIS (MEMOIZED - ZERO TYPING LAG)
// -------------------------------------------------------------
interface QuizQuestionCardProps {
  q: QuizQuestion;
  qIdx: number;
  total: number;
  onUpdate: (qIdx: number, patch: Partial<QuizQuestion>) => void;
  onDelete: (qIdx: number) => void;
}

const QuizQuestionCard = React.memo(function QuizQuestionCard({
  q,
  qIdx,
  total,
  onUpdate,
  onDelete
}: QuizQuestionCardProps) {
  const letters = ['A', 'B', 'C', 'D'];

  const getCleanOptionText = (opt: string) => {
    if (!opt) return '';
    return opt.replace(/^[A-D]\.\s*/, '');
  };

  const handleOptionTextChange = (optIdx: number, text: string) => {
    const prefix = letters[optIdx];
    const newOptions = [...q.options];
    newOptions[optIdx] = prefix + '. ' + text;
    onUpdate(qIdx, { options: newOptions });
  };

  const handleSelectKey = (optIdx: number) => {
    onUpdate(qIdx, { correctOptionIndex: optIdx });
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-purple-100 hover:border-purple-200 shadow-sm p-4 sm:p-5 space-y-4 transition-all">
      {/* HEADER SOAL */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
            {qIdx + 1}
          </span>
          <div>
            <span className="font-extrabold text-slate-800 text-sm">Soal Nomor {qIdx + 1}</span>
            <span className="text-[11px] text-slate-400 ml-2 font-medium">dari {total} soal</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge Kunci Jawaban */}
          <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black inline-flex items-center justify-center">✓</span>
            <span>Kunci: Pilihan {letters[q.correctOptionIndex] || 'A'}</span>
          </div>

          {/* Tombol Hapus Soal */}
          <button
            type="button"
            onClick={() => onDelete(qIdx)}
            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="Hapus soal ini"
          >
            <span>🗑️</span>
            <span className="hidden sm:inline">Hapus</span>
          </button>
        </div>
      </div>

      {/* PERTANYAAN */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
          <span>Pertanyaan Soal *</span>
          <span className="text-[11px] text-slate-400 font-normal">Tuliskan teks pertanyaan secara jelas</span>
        </label>
        <textarea
          rows={3}
          value={q.question}
          onChange={(e) => onUpdate(qIdx, { question: e.target.value })}
          placeholder="Ketik pertanyaan soal di sini... (Contoh: Apa fungsi utama klorofil pada tumbuhan?)"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 text-xs bg-slate-50/50 hover:bg-white focus:bg-white resize-none leading-relaxed transition font-medium"
        />
      </div>

      {/* 4 PILIHAN GANDA (A, B, C, D) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <span>Pilihan Jawaban (Klik huruf atau tombol hijau untuk memilih KUNCI BENAR):</span>
          </label>
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
            🟢 Klik opsi untuk set Kunci
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {letters.map((prefix, optIdx) => {
            const isCorrect = q.correctOptionIndex === optIdx;
            const currentText = getCleanOptionText(q.options[optIdx] || '');

            return (
              <div
                key={prefix}
                className={'flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ' + (
                  isCorrect
                    ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-purple-200 hover:bg-slate-50/50'
                )}
              >
                {/* Tombol Huruf (Klik untuk kunci) */}
                <button
                  type="button"
                  onClick={() => handleSelectKey(optIdx)}
                  title={'Klik untuk menjadikan pilihan ' + prefix + ' sebagai kunci jawaban'}
                  className={'w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center transition flex-shrink-0 cursor-pointer ' + (
                    isCorrect
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700'
                  )}
                >
                  {isCorrect ? '✓' : prefix}
                </button>

                {/* Input Teks Jawaban (Murni teks tanpa prefix yang membingungkan) */}
                <input
                  type="text"
                  value={currentText}
                  onChange={(e) => handleOptionTextChange(optIdx, e.target.value)}
                  placeholder={'Pilihan ' + prefix + '...'}
                  className="flex-1 min-w-0 px-2 py-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none border-b border-transparent focus:border-purple-500 font-medium"
                />

                {/* Tombol Kunci / Indikator */}
                <button
                  type="button"
                  onClick={() => handleSelectKey(optIdx)}
                  className={'text-[11px] px-2 py-1 rounded-lg font-bold flex-shrink-0 transition cursor-pointer flex items-center gap-1 ' + (
                    isCorrect
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                  )}
                >
                  {isCorrect ? '✓ Kunci' : 'Pilih'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* PEMBAHASAN / ALASAN JAWABAN (OPSIONAL) */}
      <div className="pt-2">
        <label className="block text-[11px] font-bold text-slate-500 mb-1">
          💡 Pembahasan / Penjelasan Jawaban (Opsional untuk evaluasi siswa):
        </label>
        <input
          type="text"
          value={q.explanation || ''}
          onChange={(e) => onUpdate(qIdx, { explanation: e.target.value })}
          placeholder="Contoh: Klorofil adalah zat hijau daun yang mengikat energi matahari dalam fotosintesis."
          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-purple-500 text-slate-700 placeholder-slate-400 italic"
        />
      </div>
    </div>
  );
});

export default function CreateAssignmentModal({
  currentTeacher,
  defaultClass,
  onClose,
  onSubmit,
  showToast
}: CreateAssignmentModalProps) {
  // Local isolated form states - typing here NEVER re-renders the 4000+ line main page!
  const availableTeacherSubjects: string[] = React.useMemo(() => {
    const raw = currentTeacher.subject || 'Umum';
    if (raw.includes('&') || raw.includes(' dan ')) {
      const parts = raw.split(/&|dan/i).map(s => s.trim()).filter(Boolean);
      return parts.map(s => {
        if (s.toLowerCase().includes('pabp') || s.toLowerCase().includes('agama')) {
          return 'Pendidikan Agama Islam (PABP)';
        }
        if (s.toLowerCase().includes('sunda')) {
          return 'Bahasa Sunda';
        }
        return s;
      });
    }
    return [raw];
  }, [currentTeacher.subject]);

  const [selectedSubject, setSelectedSubject] = useState<string>(() => availableTeacherSubjects[0]);
  const [title, setTitle] = useState('');
  const [targetClass, setTargetClass] = useState(defaultClass || '7-A');
  const [dueDate, setDueDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  });
  const [desc, setDesc] = useState('');

  // Video, Material, & Quiz
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [materialName, setMaterialName] = useState('');
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  const handleAutoFillSubjectQuiz = () => {
    const sLower = (currentTeacher.subject || '').toLowerCase();
    let sampleQuestions: QuizQuestion[] = [];

    if (sLower.includes('inggris') || sLower.includes('english')) {
      sampleQuestions = [
        {
          id: `q-${Date.now()}-1`,
          question: 'Complete the sentence: "She always ___ up at 05.00 AM every morning."',
          options: ['A. wake', 'B. wakes', 'C. waking', 'D. waked'],
          correctOptionIndex: 1,
          explanation: 'Third-person singular subject takes verb + s/es in Simple Present.'
        },
        {
          id: `q-${Date.now()}-2`,
          question: '"They ___ badminton in the yard on Sundays."',
          options: ['A. plays', 'B. play', 'C. played', 'D. playing'],
          correctOptionIndex: 1,
          explanation: 'Subject "They" uses bare verb "play".'
        },
        {
          id: `q-${Date.now()}-3`,
          question: 'Which of the following words is an adverb of frequency?',
          options: ['A. Quickly', 'B. Usually', 'C. Tomorrow', 'D. Beautiful'],
          correctOptionIndex: 1,
          explanation: '"Usually" indicates frequency of action.'
        }
      ];
    } else if (sLower.includes('agama') || sLower.includes('pai') || sLower.includes('pabp')) {
      sampleQuestions = [
        {
          id: `q-${Date.now()}-1`,
          question: 'Sikap terpuji yang mencerminkan keselarasan antara perkataan dan perbuatan yang benar disebut...',
          options: ['A. Amanah', 'B. Shiddiq (Jujur)', 'C. Fathanah', 'D. Tabligh'],
          correctOptionIndex: 1,
          explanation: 'Shiddiq berarti jujur dan benar dalam perkataan maupun perbuatan.'
        },
        {
          id: `q-${Date.now()}-2`,
          question: 'Tujuan utama membaca doa sebelum belajar adalah...',
          options: ['A. Cepat selesai', 'B. Memohon kemudahan dan keberkahan pemahaman ilmu', 'C. Mendapat pujian', 'D. Bebas ulangan'],
          correctOptionIndex: 1,
          explanation: 'Mengharap rida Allah agar ilmu mudah dipahami dan membawa manfaat.'
        },
        {
          id: `q-${Date.now()}-3`,
          question: 'Salah satu wujud adab birrul walidain kepada orang tua di rumah adalah...',
          options: ['A. Membantah', 'B. Berbicara santun dan menaati nasihat kebaikan', 'C. Acuh tak acuh', 'D. Menunda shalat'],
          correctOptionIndex: 1,
          explanation: 'Berbicara sopan, lembut, dan tawadhu adalah wujud bakti kepada kedua orang tua.'
        }
      ];
    } else if (sLower.includes('sunda')) {
      sampleQuestions = [
        {
          id: `q-${Date.now()}-1`,
          question: 'Ragam basa Sunda anu luyu digunakeun ka saluhureun (sepuh/guru) nyaeta...',
          options: ['A. Basa loma', 'B. Basa lemes / hormat', 'C. Basa garihal', 'D. Basa wewengkon'],
          correctOptionIndex: 1,
          explanation: 'Basa lemes hormat ka batur dianggo pikeun ngajenan jalma anu saluhureun.'
        },
        {
          id: `q-${Date.now()}-2`,
          question: 'Kecap lemes keur diri sorangan tina kecap "dahar" nyaeta...',
          options: ['A. Neda', 'B. Tuang', 'C. Nyatu', 'D. Lebok'],
          correctOptionIndex: 0,
          explanation: 'Keur diri sorangan nganggo "neda".'
        },
        {
          id: `q-${Date.now()}-3`,
          question: 'Dina istilah pancakaki Sunda, sebutan pikeun anakna anak urang nyaeta...',
          options: ['A. Buyut', 'B. Incu', 'C. Bao', 'D. Alo'],
          correctOptionIndex: 1,
          explanation: 'Anakna anak urang nyaeta incu.'
        }
      ];
    } else if (sLower.includes('matematika') || sLower.includes('mtk')) {
      sampleQuestions = [
        {
          id: `q-${Date.now()}-1`,
          question: 'Bentuk sederhana dari 3x + 5y - x + 2y adalah...',
          options: ['A. 2x + 7y', 'B. 4x + 7y', 'C. 2x + 3y', 'D. 3x + 7y'],
          correctOptionIndex: 0,
          explanation: '(3x - x) + (5y + 2y) = 2x + 7y.'
        },
        {
          id: `q-${Date.now()}-2`,
          question: 'Koefisien dari variabel x pada bentuk aljabar 5x² - 7x + 9 adalah...',
          options: ['A. 5', 'B. -7', 'C. 7', 'D. 9'],
          correctOptionIndex: 1,
          explanation: 'Koefisien di depan variabel x berpangkat satu adalah -7.'
        },
        {
          id: `q-${Date.now()}-3`,
          question: 'Jika x = 3 dan y = 2, maka nilai dari 2x + 3y adalah...',
          options: ['A. 10', 'B. 12', 'C. 15', 'D. 18'],
          correctOptionIndex: 1,
          explanation: '2(3) + 3(2) = 6 + 6 = 12.'
        }
      ];
    } else if (sLower.includes('ipa') || sLower.includes('sains') || sLower.includes('alam')) {
      sampleQuestions = [
        {
          id: `q-${Date.now()}-1`,
          question: 'Unit terkecil struktural dan fungsional penyusun tubuh makhluk hidup disebut...',
          options: ['A. Jaringan', 'B. Sel', 'C. Organ', 'D. Sistem Organ'],
          correctOptionIndex: 1,
          explanation: 'Sel adalah satuan terkecil kehidupan yang menyusun setiap organisme.'
        },
        {
          id: `q-${Date.now()}-2`,
          question: 'Organel sel yang berperan sebagai tempat berlangsungnya proses fotosintesis pada tumbuhan adalah...',
          options: ['A. Mitokondria', 'B. Kloroplas', 'C. Ribosom', 'D. Vakuola'],
          correctOptionIndex: 1,
          explanation: 'Kloroplas mengandung pigmen klorofil yang menangkap energi cahaya matahari.'
        },
        {
          id: `q-${Date.now()}-3`,
          question: 'Bagian mikroskop yang berfungsi untuk memfokuskan bayangan preparat secara cepat dan kasar adalah...',
          options: ['A. Makrometer (Pemutar Kasar)', 'B. Mikrometer (Pemutar Halus)', 'C. Diafragma', 'D. Kondensor'],
          correctOptionIndex: 0,
          explanation: 'Makrometer menaikkan atau menurunkan tabung mikroskop secara cepat untuk mencari fokus bayangan awal.'
        }
      ];
    } else if (sLower.includes('indonesia')) {
      sampleQuestions = [
        {
          id: `q-${Date.now()}-1`,
          question: 'Teks yang menggambarkan suatu objek secara rinci sehingga pembaca seolah melihat atau merasakan sendiri objek tersebut disebut teks...',
          options: ['A. Narasi', 'B. Deskripsi', 'C. Prosedur', 'D. Eksplanasi'],
          correctOptionIndex: 1,
          explanation: 'Teks deskripsi memaparkan ciri fisik dan suasana suatu objek secara rinci dan pancaindra.'
        },
        {
          id: `q-${Date.now()}-2`,
          question: 'Gagasan utama yang menjadi dasar pengembangan sebuah paragraf disebut...',
          options: ['A. Ide pokok (Kalimat utama)', 'B. Kalimat penjelas', 'C. Ringkasan', 'D. Kesimpulan'],
          correctOptionIndex: 0,
          explanation: 'Ide pokok merupakan inti permasalahan yang dibahas dalam paragraf.'
        },
        {
          id: `q-${Date.now()}-3`,
          question: 'Penulisan huruf kapital yang tepat di bawah ini adalah...',
          options: ['A. sungai Citarum', 'B. Sungai Citarum', 'C. sungai citarum', 'D. Sungai citarum'],
          correctOptionIndex: 1,
          explanation: 'Nama unsur geografi yang diikuti nama diri ditulis dengan huruf awal kapital (Sungai Citarum).'
        }
      ];
    } else if (sLower.includes('ips') || sLower.includes('sosial')) {
      sampleQuestions = [
        {
          id: `q-${Date.now()}-1`,
          question: 'Letak suatu wilayah berdasarkan garis lintang dan garis bujur pada peta disebut letak...',
          options: ['A. Geografis', 'B. Astronomis', 'C. Geologis', 'D. Geomorfologis'],
          correctOptionIndex: 1,
          explanation: 'Letak astronomis ditentukan oleh koordinat garis lintang dan garis bujur bumi.'
        },
        {
          id: `q-${Date.now()}-2`,
          question: 'Kegiatan menyalurkan barang atau jasa dari produsen ke konsumen disebut...',
          options: ['A. Produksi', 'B. Distribusi', 'C. Konsumsi', 'D. Investasi'],
          correctOptionIndex: 1,
          explanation: 'Distribusi adalah mata rantai penyalur barang/jasa kepada pihak pemakai.'
        },
        {
          id: `q-${Date.now()}-3`,
          question: 'Interaksi timbal balik antara individu dengan individu, atau individu dengan kelompok disebut...',
          options: ['A. Status sosial', 'B. Interaksi sosial', 'C. Norma sosial', 'D. Peran sosial'],
          correctOptionIndex: 1,
          explanation: 'Interaksi sosial adalah hubungan timbal balik dinamis antarmanusia.'
        }
      ];
    } else if (sLower.includes('pkn') || sLower.includes('pancasila')) {
      sampleQuestions = [
        {
          id: `q-${Date.now()}-1`,
          question: 'Pancasila berkedudukan sebagai pedoman tingkah laku dan cita-cita luhur bangsa Indonesia, fungsi ini disebut sebagai...',
          options: ['A. Pandangan hidup bangsa', 'B. Dasar negara hukum', 'C. Perjanjian luhur', 'D. Sumber hukum semata'],
          correctOptionIndex: 0,
          explanation: 'Pandangan hidup (way of life) membimbing sikap dan perilaku seluruh warga negara.'
        },
        {
          id: `q-${Date.now()}-2`,
          question: 'Sikap menghargai perbedaan keyakinan dan saling tolong menolong antarumat beragama mencerminkan pengamalan sila...',
          options: ['A. Pertama (Ketuhanan Yang Maha Esa)', 'B. Kedua', 'C. Ketiga', 'D. Kelima'],
          correctOptionIndex: 0,
          explanation: 'Toleransi dan kerukunan beragama merupakan perwujudan Sila ke-1.'
        },
        {
          id: `q-${Date.now()}-3`,
          question: 'Musyawarah untuk mufakat dalam mengambil keputusan bersama merupakan perwujudan dari sila...',
          options: ['A. Kedua', 'B. Ketiga', 'C. Keempat (Kerakyatan yang dipimpin oleh hikmat kebijaksanaan)', 'D. Kelima'],
          correctOptionIndex: 2,
          explanation: 'Musyawarah mufakat adalah ciri khas demokrasi Pancasila pada sila ke-4.'
        }
      ];
    } else if (sLower.includes('penjas') || sLower.includes('pjok') || sLower.includes('olahraga')) {
      sampleQuestions = [
        {
          id: `q-${Date.now()}-1`,
          question: 'Gerakan menggiring bola dalam permainan sepak bola bertujuan untuk...',
          options: ['A. Mengulur waktu', 'B. Melewati lawan dan mendekati gawang', 'C. Menendang sekuat tenaga', 'D. Melakukan lemparan ke dalam'],
          correctOptionIndex: 1,
          explanation: 'Dribbling dilakukan untuk mengontrol dan membawa bola mendekati area pertahanan lawan.'
        },
        {
          id: `q-${Date.now()}-2`,
          question: 'Berapa jumlah pemain dalam satu regu pada permainan bola voli resmi?',
          options: ['A. 5 pemain', 'B. 6 pemain', 'C. 7 pemain', 'D. 11 pemain'],
          correctOptionIndex: 1,
          explanation: 'Setiap regu bola voli terdiri dari 6 pemain di dalam lapangan.'
        },
        {
          id: `q-${Date.now()}-3`,
          question: 'Latihan push-up secara teratur bermanfaat utama untuk melatih kekuatan otot...',
          options: ['A. Lengan dan dada', 'B. Kaki dan betis', 'C. Leher', 'D. Jari-jari kaki'],
          correctOptionIndex: 0,
          explanation: 'Push-up melatih otot pectoralis (dada) dan triceps (lengan atas).'
        }
      ];
    } else if (sLower.includes('informatika')) {
      sampleQuestions = [
        {
          id: `q-${Date.now()}-1`,
          question: 'Komponen perangkat keras yang berfungsi sebagai otak pemroses utama komputer adalah...',
          options: ['A. RAM', 'B. CPU', 'C. Hard Disk', 'D. PSU'],
          correctOptionIndex: 1,
          explanation: 'CPU (Central Processing Unit) mengeksekusi instruksi komputasi.'
        },
        {
          id: `q-${Date.now()}-2`,
          question: 'Memori komputer yang bersifat sementara saat dialiri listrik adalah...',
          options: ['A. ROM', 'B. RAM', 'C. SSD', 'D. Flashdisk'],
          correctOptionIndex: 1,
          explanation: 'RAM menyimpan data sementara untuk aplikasi yang sedang aktif.'
        },
        {
          id: `q-${Date.now()}-3`,
          question: 'Manakah dari perangkat berikut yang termasuk perangkat masukan (input)?',
          options: ['A. Monitor', 'B. Keyboard & Mouse', 'C. Speaker', 'D. Printer'],
          correctOptionIndex: 1,
          explanation: 'Keyboard dan mouse memasukkan input ke komputer.'
        }
      ];
    } else {
      sampleQuestions = [
        {
          id: `q-${Date.now()}-1`,
          question: `Apa konsep pokok yang paling mendasari materi ${currentTeacher.subject || 'pelajaran'} bab ini?`,
          options: ['A. Pemahaman fakta dasar', 'B. Analisis dan aplikasi konsep', 'C. Penghafalan istilah', 'D. Teori umum'],
          correctOptionIndex: 1,
          explanation: 'Penerapan konsep kontekstual menjadi fokus pembelajaran kurikulum merdeka.'
        },
        {
          id: `q-${Date.now()}-2`,
          question: 'Manakah langkah awal yang paling tepat dalam menyelesaikan soal latihan ini?',
          options: ['A. Menuliskan kesimpulan langsung', 'B. Membaca petunjuk dan mencatat poin penting', 'C. Menebak jawaban', 'D. Mengabaikan data'],
          correctOptionIndex: 1,
          explanation: 'Memahami petunjuk dan merangkum informasi esensial adalah langkah pertama.'
        },
        {
          id: `q-${Date.now()}-3`,
          question: 'Bagaimana penerapan nilai materi ini dalam kehidupan sehari-hari?',
          options: ['A. Hanya untuk ujian', 'B. Diterapkan secara kritis dan bertanggung jawab', 'C. Tidak relevan', 'D. Bersifat teoritis semata'],
          correctOptionIndex: 1,
          explanation: 'Pembelajaran bermakna diaplikasikan dalam kehidupan nyata sehari-hari.'
        }
      ];
    }

    setQuizQuestions(sampleQuestions);
    setIsQuizActive(true);
    showToast(`3 Soal Kuis untuk ${currentTeacher.subject} berhasil disiapkan!`, 'info');
  };

  type TeacherTab = 'info' | 'kuis' | 'lampiran';
  const [activeTab, setActiveTab] = useState<TeacherTab>('info');

  const attachmentCount = (videoUrl.trim() ? 1 : 0) + (materialUrl.trim() ? 1 : 0);
  const activeQuizCount = isQuizActive ? quizQuestions.length : 0;

  const tabs: { id: TeacherTab; label: string; icon: string; badge?: string }[] = [
    { id: 'info', label: '1. Info & Deskripsi Tugas', icon: '📋' },
    { id: 'kuis', label: '2. Soal Kuis (Auto-Grade)', icon: '📝', badge: isQuizActive ? quizQuestions.length + ' Soal' : undefined },
    { id: 'lampiran', label: '3. Lampiran Berkas & Video', icon: '📎', badge: attachmentCount > 0 ? String(attachmentCount) : undefined }
  ];
  const activeIdx = tabs.findIndex(t => t.id === activeTab);
  const prevTab = activeIdx > 0 ? tabs[activeIdx - 1] : null;
  const nextTab = activeIdx < tabs.length - 1 ? tabs[activeIdx + 1] : null;

  // Question update helpers (useCallback to prevent child re-renders)
  const handleUpdateQuestion = useCallback((qIdx: number, patch: Partial<QuizQuestion>) => {
    setQuizQuestions(prev => prev.map((q, i) => (i === qIdx ? { ...q, ...patch } : q)));
  }, []);

  const handleDeleteQuestion = useCallback((qIdx: number) => {
    setQuizQuestions(prev => prev.filter((_, idx) => idx !== qIdx));
  }, []);

  const addManualQuestion = () => {
    setIsQuizActive(true);
    setQuizQuestions(prev => [
      ...prev,
      {
        id: 'q-' + Date.now() + '-' + (prev.length + 1),
        question: '',
        options: ['A. ', 'B. ', 'C. ', 'D. '],
        correctOptionIndex: 0,
        explanation: ''
      }
    ]);
  };

  const handleSubmit = () => {
    if (!title.trim() || !dueDate) {
      showToast('Mohon isi judul tugas dan tenggat waktu terlebih dahulu!', 'warn');
      setActiveTab('info');
      return;
    }

    if (isQuizActive) {
      if (quizQuestions.length === 0) {
        showToast('Kuis aktif tetapi belum ada soal. Tambahkan soal atau matikan toggle kuis.', 'warn');
        setActiveTab('kuis');
        return;
      }
      const emptyIdx = quizQuestions.findIndex(q => !q.question.trim());
      if (emptyIdx !== -1) {
        showToast('Soal Nomor ' + (emptyIdx + 1) + ' pertanyaannya masih kosong. Lengkapi atau hapus soal tersebut.', 'warn');
        setActiveTab('kuis');
        return;
      }
    }

    const newAssignment: Assignment = {
      id: 'asg-' + Date.now(),
      title: title.trim(),
      subject: selectedSubject,
      teacherName: currentTeacher.name,
      teacherNip: currentTeacher.nip,
      targetClass,
      dueDate,
      description: desc.trim() || 'Kerjakan tugas sesuai petunjuk guru dan kumpulkan berkas sebelum batas waktu.',
      allowUpload: true,
      createdAt: new Date().toISOString().split('T')[0],
      materialUrl: materialUrl.trim() || undefined,
      materialName: materialName.trim() || (materialUrl.trim() ? 'Bahan_Ajar_Materi.pdf' : undefined),
      videoUrl: videoUrl.trim() || undefined,
      videoTitle: videoTitle.trim() || (videoUrl.trim() ? ('Video Pembelajaran ' + currentTeacher.subject) : undefined),
      quizQuestions: isQuizActive && quizQuestions.length > 0 ? quizQuestions : undefined
    };

    onSubmit(newAssignment);
  };

  // ---------- TAB 1: INFO TUGAS ----------
  const renderInfoTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
      {/* Kolom Kiri: Form Detail */}
      <div className="space-y-4 bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-200">
        <div>
          <label className="block font-bold text-slate-800 text-xs mb-1.5">
            Judul Tugas / Modul Ajar *
          </label>
          <input
            id="create-asg-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Tugas Mandiri Bab 2 - Sistem Pencernaan Manusia"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 text-xs bg-white font-medium shadow-2xs"
          />
        </div>

        {availableTeacherSubjects.length > 1 && (
          <div>
            <label className="block font-bold text-slate-800 text-xs mb-1.5">Mata Pelajaran *</label>
            <div className="grid grid-cols-2 gap-2">
              {availableTeacherSubjects.map((sub) => {
                const isSelected = selectedSubject === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubject(sub)}
                    className={'py-2 px-3 rounded-xl border text-xs font-bold transition text-left cursor-pointer flex items-center gap-2 ' + (
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <span>{isSelected ? '●' : '○'}</span>
                    <span className="truncate">{sub}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-800 text-xs mb-1.5">Target Kelas / Rombel *</label>
            <select
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs cursor-pointer bg-white font-semibold"
            >
              {SCHOOL_CLASSES.map((c) => (
                <option key={c.id} value={c.id}>Kelas {c.name} ({c.totalStudents} Siswa)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-800 text-xs mb-1.5">Tenggat Waktu Pengumpulan *</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs bg-white font-semibold"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-800 leading-relaxed space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-indigo-950">
            <span>✨</span> Tips Guru:
          </div>
          <p>
            Bapak/Ibu dapat melengkapi tugas ini dengan <b>Kuis Pilihan Ganda</b> (tab ke-2) agar sistem otomatis mengoreksi nilai siswa (0–100), atau melampirkan video dan file LKPD (tab ke-3).
          </p>
        </div>
      </div>

      {/* Kolom Kanan: Deskripsi & Instruksi */}
      <div className="flex flex-col bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-200">
        <label className="block font-bold text-slate-800 text-xs mb-1.5">
          Petunjuk &amp; Instruksi Pengerjaan untuk Siswa
        </label>
        <textarea
          rows={10}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={'Tuliskan petunjuk pengerjaan tugas secara rinci, misalnya:\n1. Pelajari materi pada buku paket halaman 45-50\n2. Jawab soal kuis pilihan ganda yang tersedia\n3. Unggah foto atau ringkasan tugas sebelum batas waktu berakhir.'}
          className="w-full flex-1 px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs resize-none bg-white leading-relaxed font-medium shadow-2xs"
        />
      </div>
    </div>
  );

  // ---------- TAB 2: SOAL KUIS (AUTO-GRADE) ----------
  const renderKuisTab = () => (
    <div className="space-y-4 text-xs">
      {/* BANNER CONTROL KUIS */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-2 border-purple-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <input
            id="toggle-quiz-active"
            type="checkbox"
            checked={isQuizActive}
            onChange={(e) => {
              const val = e.target.checked;
              setIsQuizActive(val);
              if (val && quizQuestions.length === 0) {
                addManualQuestion();
              }
            }}
            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer mt-0.5"
          />
          <label htmlFor="toggle-quiz-active" className="cursor-pointer select-none">
            <div className="font-extrabold text-purple-950 text-sm flex items-center gap-2">
              <span>Aktifkan Kuis Pilihan Ganda (Auto-Grading 0–100)</span>
              {isQuizActive && (
                <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-black text-[11px]">
                  {quizQuestions.length} Soal
                </span>
              )}
            </div>
            <p className="text-xs text-purple-800/80 mt-0.5">
              Siswa menjawab langsung di web, dan nilai otomatis masuk ke rekap nilai guru begitu dikumpulkan.
            </p>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addManualQuestion}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 cursor-pointer flex items-center gap-1.5 transition active:scale-95"
          >
            <span>+</span>
            <span>Tambah Soal</span>
          </button>
          <button
            type="button"
            onClick={handleAutoFillSubjectQuiz}
            className="px-3 py-2 rounded-xl bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95"
          >
            <span>⚡ Contoh Soal ({currentTeacher.subject})</span>
          </button>
          {quizQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Yakin ingin mengosongkan semua soal kuis ini?')) {
                  setQuizQuestions([]);
                }
              }}
              className="px-2.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
            >
              Hapus Semua
            </button>
          )}
        </div>
      </div>

      {/* SOAL LIST AREA */}
      {!isQuizActive ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 space-y-3">
          <div className="text-4xl">📝</div>
          <h4 className="font-bold text-slate-800 text-sm">Kuis Pilihan Ganda Sedang Nonaktif</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Tugas ini akan berlaku sebagai tugas penugasan berkas (upload file atau ketik rangkuman). Centang kotak di atas atau klik tombol di bawah untuk mengaktifkan soal kuis.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsQuizActive(true);
                if (quizQuestions.length === 0) addManualQuestion();
              }}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 cursor-pointer transition inline-flex items-center gap-2 active:scale-95"
            >
              <span>+ Buat Soal Pertama</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsQuizActive(true);
                handleAutoFillSubjectQuiz();
              }}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-purple-700 border border-purple-300 font-bold text-xs shadow-xs cursor-pointer transition inline-flex items-center gap-2 active:scale-95"
            >
              <span>⚡ Contoh Soal ({currentTeacher.subject})</span>
            </button>
          </div>
        </div>
      ) : quizQuestions.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-purple-50/50 border-2 border-dashed border-purple-200 space-y-3">
          <div className="text-3xl">❓</div>
          <h4 className="font-bold text-purple-950 text-sm">Belum Ada Soal yang Ditambahkan</h4>
          <p className="text-xs text-purple-700/80 max-w-md mx-auto">
            Klik tombol &quot;+ Tambah Soal&quot; untuk membuat soal baru secara manual, atau gunakan tombol &quot;⚡ Contoh Soal&quot; untuk template cepat sesuai mata pelajaran.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={addManualQuestion}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              + Tambah Soal Manual
            </button>
            <button
              type="button"
              onClick={handleAutoFillSubjectQuiz}
              className="px-4 py-2 rounded-xl bg-white border border-purple-300 text-purple-700 font-bold text-xs cursor-pointer"
            >
              ⚡ Isi Otomatis
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs px-1 text-slate-500">
            <span>Daftar {quizQuestions.length} Soal Kuis</span>
            <span className="font-medium text-purple-700">Setiap soal bernilai rata-rata {Math.round(100 / quizQuestions.length)} poin</span>
          </div>

          {quizQuestions.map((q, qIdx) => (
            <QuizQuestionCard
              key={q.id || ('q-' + qIdx)}
              q={q}
              qIdx={qIdx}
              total={quizQuestions.length}
              onUpdate={handleUpdateQuestion}
              onDelete={handleDeleteQuestion}
            />
          ))}

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={addManualQuestion}
              className="px-5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border-2 border-dashed border-purple-300 hover:border-purple-400 font-bold text-xs cursor-pointer transition flex items-center gap-2"
            >
              <span>+ Tambah Soal Nomor {quizQuestions.length + 1}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ---------- TAB 3: LAMPIRAN (VIDEO & FILE) ----------
  const renderLampiranTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
      {/* VIDEO PEMBELAJARAN */}
      <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3.5 flex flex-col justify-between shadow-2xs">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-amber-950 flex items-center gap-1.5 text-xs">
              <span>🎬</span> Video Pembelajaran (Opsional)
            </span>
            <span className="text-[10px] text-amber-800 font-bold bg-amber-100/90 px-2 py-0.5 rounded font-mono">
              YouTube / MP4 / Drive
            </span>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tautan Video URL:</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-600 text-xs bg-white font-medium shadow-2xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Judul / Keterangan Video:</label>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Contoh: Video Penjelasan Bab 2 Sains Terpadu"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-600 text-xs bg-white font-medium shadow-2xs"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-amber-200/80">
          <span className="text-[11px] text-slate-400">Pintasan:</span>
          <button
            type="button"
            onClick={() => {
              setVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
              setVideoTitle('Video Pembelajaran ' + currentTeacher.subject + ' - SMPN 3 Cihampelas');
            }}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold transition cursor-pointer"
          >
            + Isi Video Contoh
          </button>
          {videoUrl && (
            <button
              type="button"
              onClick={() => { setVideoUrl(''); setVideoTitle(''); }}
              className="text-[11px] text-rose-600 hover:underline cursor-pointer ml-auto font-semibold"
            >
              Hapus Video
            </button>
          )}
        </div>
      </div>

      {/* DOKUMEN / LKPD */}
      <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3.5 flex flex-col justify-between shadow-2xs">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-blue-950 flex items-center gap-1.5 text-xs">
              <span>📄</span> Modul Ajar / LKPD / Berkas PDF (Opsional)
            </span>
            <span className="text-[10px] text-blue-800 font-bold bg-blue-100/90 px-2 py-0.5 rounded font-mono">
              PDF / Word / PPT
            </span>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tautan File Dokumen URL:</label>
            <input
              type="url"
              value={materialUrl}
              onChange={(e) => setMaterialUrl(e.target.value)}
              placeholder="https://.../LKPD_Materi_Bab2.pdf"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 text-xs bg-white font-medium shadow-2xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Berkas / Label Tampilan:</label>
            <input
              type="text"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              placeholder="Contoh: LKPD_Praktikum_IPA_Kelas7A.pdf"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 text-xs bg-white font-medium shadow-2xs"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-blue-200/80">
          <span className="text-[11px] text-slate-400">Pintasan:</span>
          <button
            type="button"
            onClick={() => {
              setMaterialUrl('https://example.com/LKPD_SMPN3Cihampelas.pdf');
              setMaterialName('LKPD_' + currentTeacher.subject.replace(/\s+/g, '_') + '_Kelas' + targetClass + '.pdf');
            }}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-blue-100 text-blue-900 border border-blue-300 font-bold transition cursor-pointer"
          >
            + Isi LKPD Contoh
          </button>
          {materialUrl && (
            <button
              type="button"
              onClick={() => { setMaterialUrl(''); setMaterialName(''); }}
              className="text-[11px] text-rose-600 hover:underline cursor-pointer ml-auto font-semibold"
            >
              Hapus File
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      data-lenis-prevent-touch="true"
      className="fixed inset-0 z-[80] bg-slate-900/80 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex items-center justify-center animate-in fade-in duration-150 font-elearning"
    >
      <div className="bg-white rounded-3xl max-w-6xl w-full shadow-2xl h-[94vh] max-h-[94vh] flex flex-col overflow-hidden border border-slate-100">
        {/* HEADER MODAL (DIPERLUAS & LEGA) */}
        <div className="px-6 sm:px-8 pt-5 pb-4 flex items-start justify-between gap-4 flex-shrink-0 border-b border-slate-100 bg-slate-50/50">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Buat Tugas &amp; Kuis Pembelajaran Baru
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Mata Pelajaran: <span className="font-bold text-indigo-700">{currentTeacher.subject}</span> • Guru: <span className="font-semibold text-slate-700">{currentTeacher.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl cursor-pointer p-1.5 rounded-xl hover:bg-slate-200/60 transition flex-shrink-0"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* TAB NAVIGATION (3 TAHAP JELAS) */}
        <div className="px-6 sm:px-8 border-b border-slate-200 flex-shrink-0 bg-white">
          <div className="flex gap-2 overflow-x-auto" role="tablist">
            {tabs.map(t => {
              const isActive = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  id={'create-asg-tab-' + t.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(t.id)}
                  className={'relative px-4 py-3 text-xs font-extrabold whitespace-nowrap flex items-center gap-2 transition cursor-pointer rounded-t-xl ' + (
                    isActive
                      ? 'text-indigo-700 bg-indigo-50/80'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  )}
                >
                  <span className="text-sm">{t.icon}</span>
                  <span>{t.label}</span>
                  {t.badge && (
                    <span className={'ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ' + (
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                    )}>
                      {t.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-indigo-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ISI KONTEN (SCROLLABLE & LUAS) */}
        <div
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-5"
        >
          {activeTab === 'info' && renderInfoTab()}
          {activeTab === 'kuis' && renderKuisTab()}
          {activeTab === 'lampiran' && renderLampiranTab()}
        </div>

        {/* FOOTER BAR (LEGA & JELAS) */}
        <div className="px-6 sm:px-8 py-3.5 border-t border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
            <span>Target Rombel: <b className="text-slate-800 font-bold">Kelas {targetClass}</b></span>
            <span>•</span>
            <span className={activeQuizCount > 0 ? 'text-purple-700 font-bold' : ''}>
              📝 {activeQuizCount > 0 ? (activeQuizCount + ' Soal Kuis (Auto-Grade)') : 'Tanpa Kuis'}
            </span>
            <span>•</span>
            <span>📎 {attachmentCount} Lampiran</span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 text-xs font-semibold cursor-pointer transition"
            >
              Batal
            </button>
            {prevTab && (
              <button
                key={'btn-prev-' + prevTab.id}
                type="button"
                onClick={() => setActiveTab(prevTab.id)}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-2xs"
              >
                <span>← {prevTab.label}</span>
              </button>
            )}
            {nextTab && (
              <button
                key={'btn-next-' + nextTab.id}
                type="button"
                onClick={() => setActiveTab(nextTab.id)}
                className="px-4 py-2 rounded-xl bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-xs font-bold cursor-pointer transition shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <span>Lanjut: {nextTab.label}</span>
                <span>→</span>
              </button>
            )}
            <button
              key="btn-publish-asg"
              id="create-asg-submit"
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition shadow-md shadow-indigo-600/25 cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <span>🚀 Terbitkan Tugas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
