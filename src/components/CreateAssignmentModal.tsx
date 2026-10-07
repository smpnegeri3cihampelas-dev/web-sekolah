'use client';

import React, { useState } from 'react';
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

export default function CreateAssignmentModal({
  currentTeacher,
  defaultClass,
  onClose,
  onSubmit,
  showToast
}: CreateAssignmentModalProps) {
  // Local isolated form states - typing here NEVER re-renders the 4000+ line main page!
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

  type TeacherTab = 'info' | 'lampiran' | 'kuis';
  const [activeTab, setActiveTab] = useState<TeacherTab>('info');

  const attachmentCount = (videoUrl.trim() ? 1 : 0) + (materialUrl.trim() ? 1 : 0);
  const activeQuizCount = isQuizActive ? quizQuestions.length : 0;

  const tabs: { id: TeacherTab; label: string; icon: string }[] = [
    { id: 'info', label: 'Info Tugas', icon: '📋' },
    { id: 'lampiran', label: 'Lampiran Materi', icon: '📎' },
    { id: 'kuis', label: 'Kuis', icon: '📝' }
  ];
  const activeIdx = tabs.findIndex(t => t.id === activeTab);
  const nextTab = activeIdx < tabs.length - 1 ? tabs[activeIdx + 1] : null;

  // Immutable helpers for editing quiz questions
  const updateQuestion = (qIdx: number, patch: Partial<QuizQuestion>) => {
    setQuizQuestions(prev => prev.map((q, i) => (i === qIdx ? { ...q, ...patch } : q)));
  };
  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    const prefix = ['A', 'B', 'C', 'D'][optIdx];
    setQuizQuestions(prev =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const options = [...q.options];
        options[optIdx] = `${prefix}. ${value}`;
        return { ...q, options };
      })
    );
  };
  const addManualQuestion = () => {
    setIsQuizActive(true);
    setQuizQuestions(prev => [
      ...prev,
      {
        id: `q-${Date.now()}-${prev.length + 1}`,
        question: '',
        options: ['A. ', 'B. ', 'C. ', 'D. '],
        correctOptionIndex: 0,
        explanation: ''
      }
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      showToast('Mohon isi judul tugas dan tenggat waktu!', 'warn');
      setActiveTab('info');
      return;
    }

    if (isQuizActive && quizQuestions.some(q => !q.question.trim())) {
      showToast('Ada soal kuis yang pertanyaannya masih kosong. Lengkapi atau hapus soal tersebut.', 'warn');
      setActiveTab('kuis');
      return;
    }

    const newAssignment: Assignment = {
      id: `asg-${Date.now()}`,
      title: title.trim(),
      subject: currentTeacher.subject,
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
      videoTitle: videoTitle.trim() || (videoUrl.trim() ? `Video Pembelajaran ${currentTeacher.subject}` : undefined),
      quizQuestions: isQuizActive && quizQuestions.length > 0 ? quizQuestions : undefined
    };

    onSubmit(newAssignment);
  };

  // ---------- TAB CONTENTS ----------

  const renderInfoTab = () => (
    <div className="space-y-4 text-xs">
      <div>
        <label className="block font-bold text-slate-700 mb-1">Judul Tugas / PR *</label>
        <input
          id="create-asg-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Tugas Praktikum Uji Makanan Bab 2"
          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Target Kelas *</label>
          <select
            value={targetClass}
            onChange={(e) => setTargetClass(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs cursor-pointer"
          >
            {SCHOOL_CLASSES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Tenggat Waktu (Deadline) *</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs"
          />
        </div>
      </div>

      <div>
        <label className="block font-bold text-slate-700 mb-1">Petunjuk &amp; Deskripsi Tugas</label>
        <textarea
          rows={5}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Tuliskan petunjuk pengerjaan tugas, nomor halaman buku paket, atau instruksi pengumpulan file..."
          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs resize-none"
        />
      </div>

      <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-700 leading-relaxed">
        💡 Setelah mengisi info tugas, Bapak/Ibu bisa menambahkan video/modul di tab <b>Lampiran Materi</b> dan soal pilihan ganda di tab <b>Kuis</b> (opsional).
      </div>
    </div>
  );

  const renderLampiranTab = () => (
    <div className="space-y-4 text-xs">
      {/* VIDEO */}
      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
            <span>🎬</span> Video Pembelajaran (Opsional)
          </span>
          <span className="text-[10px] text-amber-700 font-medium">YouTube / Google Drive / MP4</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tautan Video URL:</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Judul / Keterangan Video:</label>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Contoh: Video Penjelasan Materi Bab 2"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs bg-white"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-[10px] text-slate-400">Contoh Cepat:</span>
          <button
            type="button"
            onClick={() => {
              setVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
              setVideoTitle(`Video Pembelajaran ${currentTeacher.subject} - SMPN 3 Cihampelas`);
            }}
            className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 font-medium transition cursor-pointer"
          >
            + Isi Contoh Video YouTube
          </button>
          {videoUrl && (
            <button
              type="button"
              onClick={() => { setVideoUrl(''); setVideoTitle(''); }}
              className="text-[10px] text-rose-600 hover:underline cursor-pointer ml-auto"
            >
              Hapus Video
            </button>
          )}
        </div>
      </div>

      {/* MODUL / LKPD */}
      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
            <span>📄</span> Bahan Ajar / Modul LKPD (Opsional)
          </span>
          <span className="text-[10px] text-blue-700 font-medium">PDF / PPT / Word</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tautan File Dokumen URL:</label>
            <input
              type="url"
              value={materialUrl}
              onChange={(e) => setMaterialUrl(e.target.value)}
              placeholder="https://.../LKPD_Materi.pdf"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama File / Label Dokumen:</label>
            <input
              type="text"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              placeholder="Contoh: Modul_LKPD_Aljabar_Siswa.pdf"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 text-xs bg-white"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-[10px] text-slate-400">Contoh Cepat:</span>
          <button
            type="button"
            onClick={() => {
              setMaterialUrl('https://example.com/LKPD_Pembelajaran_SMPN3Cihampelas.pdf');
              setMaterialName(`LKPD_${currentTeacher.subject.replace(/\s+/g, '_')}_Kelas${targetClass}.pdf`);
            }}
            className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 font-medium transition cursor-pointer"
          >
            + Isi Contoh Modul LKPD.pdf
          </button>
          {materialUrl && (
            <button
              type="button"
              onClick={() => { setMaterialUrl(''); setMaterialName(''); }}
              className="text-[10px] text-rose-600 hover:underline cursor-pointer ml-auto"
            >
              Hapus Modul
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderKuisTab = () => (
    <div className="space-y-3 text-xs">
      {/* Toggle + actions */}
      <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2.5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isQuizActive}
            onChange={(e) => {
              const val = e.target.checked;
              setIsQuizActive(val);
              if (val && quizQuestions.length === 0) handleAutoFillSubjectQuiz();
            }}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
          />
          <span className="font-bold text-purple-950 text-xs">Aktifkan Kuis Pilihan Ganda (nilai otomatis 0–100)</span>
          {isQuizActive && (
            <span className="ml-auto px-2 py-0.5 rounded bg-purple-200/80 text-purple-900 font-bold text-[10px]">{quizQuestions.length} Soal</span>
          )}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAutoFillSubjectQuiz}
            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-xs cursor-pointer flex items-center gap-1 transition"
          >
            ⚡ Isi Otomatis 3 Soal ({currentTeacher.subject})
          </button>
          <button
            type="button"
            onClick={addManualQuestion}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-50 text-purple-700 border border-purple-300 font-bold text-[11px] cursor-pointer transition"
          >
            + Tambah Soal Manual
          </button>
        </div>
      </div>

      {!isQuizActive ? (
        <div className="text-center py-8 space-y-2 text-slate-500">
          <div className="text-3xl">📝</div>
          <p className="text-xs">Kuis belum diaktifkan. Tugas ini hanya meminta siswa mengunggah berkas.</p>
          <p className="text-[11px] text-slate-400">Centang kotak di atas atau klik &quot;Isi Otomatis&quot; untuk menambahkan soal.</p>
        </div>
      ) : quizQuestions.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs">Belum ada soal. Klik &quot;+ Tambah Soal Manual&quot;.</div>
      ) : (
        quizQuestions.map((q, qIdx) => (
          <div key={q.id} className="p-3.5 bg-white rounded-2xl border border-purple-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-purple-800 text-xs">Soal Nomor {qIdx + 1}</span>
              <button
                type="button"
                onClick={() => setQuizQuestions(prev => prev.filter((_, idx) => idx !== qIdx))}
                className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer px-1.5 py-0.5 rounded hover:bg-rose-50"
              >
                ✕ Hapus
              </button>
            </div>

            <textarea
              rows={2}
              value={q.question}
              onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
              placeholder="Tuliskan pertanyaan soal kuis di sini..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-purple-600 resize-none"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {q.options.map((opt, optIdx) => {
                const isCorrect = q.correctOptionIndex === optIdx;
                const optionPrefix = ['A', 'B', 'C', 'D'][optIdx];
                return (
                  <div
                    key={optIdx}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition ${
                      isCorrect ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <label className="flex items-center gap-1 cursor-pointer flex-shrink-0" title={`Tandai ${optionPrefix} sebagai kunci jawaban`}>
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={isCorrect}
                        onChange={() => updateQuestion(qIdx, { correctOptionIndex: optIdx })}
                        className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className={`font-bold text-[11px] ${isCorrect ? 'text-emerald-700' : 'text-slate-600'}`}>{optionPrefix}:</span>
                    </label>
                    <input
                      type="text"
                      value={opt.replace(/^[A-D]\.\s*/, '')}
                      onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                      placeholder={`Pilihan ${optionPrefix}`}
                      className="w-full px-2 py-0.5 rounded bg-transparent text-xs focus:outline-none border-b border-transparent focus:border-purple-400"
                    />
                    {isCorrect && (
                      <span className="text-[10px] font-bold text-emerald-700 flex-shrink-0 bg-emerald-100 px-1 rounded">✓ Kunci</span>
                    )}
                  </div>
                );
              })}
            </div>

            <input
              type="text"
              value={q.explanation || ''}
              onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
              placeholder="Pembahasan singkat / alasan jawaban benar (opsional)..."
              className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-purple-500 text-slate-600 italic"
            />
          </div>
        ))
      )}
    </div>
  );

  const tabBadge = (id: TeacherTab) => {
    if (id === 'info' && title.trim()) {
      return <span className="ml-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-black inline-flex items-center justify-center">✓</span>;
    }
    if (id === 'lampiran' && attachmentCount > 0) {
      return <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">{attachmentCount}</span>;
    }
    if (id === 'kuis' && activeQuizCount > 0) {
      return <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black">{activeQuizCount}</span>;
    }
    return null;
  };

  return (
    <div
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      data-lenis-prevent-touch="true"
      className="fixed inset-0 z-[80] bg-slate-900/80 backdrop-blur-xs p-3 sm:p-4 flex items-center justify-center animate-in fade-in duration-150 font-elearning"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* HEADER (fixed) */}
        <div className="px-5 sm:px-7 pt-5 pb-3 flex items-start justify-between gap-3 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900">Buat Tugas / PR Baru</h3>
            <p className="text-xs text-slate-500 truncate">
              Mata Pelajaran: <span className="font-semibold text-indigo-700">{currentTeacher.subject}</span> • Guru: <span className="font-semibold text-slate-700">{currentTeacher.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition flex-shrink-0"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* TAB BAR (fixed) */}
        <div className="px-5 sm:px-7 border-b border-slate-200 flex-shrink-0">
          <div className="flex gap-1 overflow-x-auto" role="tablist">
            {tabs.map(t => {
              const isActive = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  id={`create-asg-tab-${t.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(t.id)}
                  className={`relative px-3 sm:px-4 py-2.5 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer rounded-t-xl ${
                    isActive ? 'text-indigo-700 bg-indigo-50/70' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {tabBadge(t.id)}
                  {isActive && <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-indigo-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENT (scrollable) */}
        <div
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-7 py-4"
        >
          {activeTab === 'info' && renderInfoTab()}
          {activeTab === 'lampiran' && renderLampiranTab()}
          {activeTab === 'kuis' && renderKuisTab()}
        </div>

        {/* FOOTER (fixed) */}
        <div className="px-5 sm:px-7 py-3 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>Kelas <b className="text-slate-700">{targetClass}</b></span>
            <span>•</span>
            <span>📎 {attachmentCount} lampiran</span>
            <span>•</span>
            <span>📝 {activeQuizCount} soal</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-200/60 text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            {nextTab && (
              <button
                type="button"
                onClick={() => setActiveTab(nextTab.id)}
                className="px-3.5 py-2 rounded-xl bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-xs font-bold cursor-pointer transition"
              >
                Lanjut: {nextTab.label} →
              </button>
            )}
            <button
              id="create-asg-submit"
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              Terbitkan Tugas
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
