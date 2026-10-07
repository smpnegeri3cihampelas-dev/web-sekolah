'use client';

// Types for E-Learning & Presensi Sekolah
export interface Student {
  id: string;
  nisn: string;
  nis?: string;
  name: string;
  gender?: string;
  classId: string;
}

export type AttendanceStatus = 'H' | 'S' | 'I' | 'A' | 'T'; // Hadir, Sakit, Izin, Alpa, Terlambat

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
  updatedAt?: string;
}

export interface ClassSessionAttendance {
  classId: string;
  date: string; // YYYY-MM-DD
  subject: string;
  teacherName: string;
  teacherNip: string;
  isSubmitted: boolean;
  submittedAt?: string;
  records: Record<string, AttendanceStatus>; // studentId -> status
  notes?: Record<string, string>; // studentId -> note
}

export interface TeacherUser {
  nip: string;
  name: string;
  role: 'mapel' | 'piket' | 'both';
  subject: string;
  classes: string[];
}

export interface StudentUser {
  nisn: string;
  name: string;
  classId: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  totalStudents: number;
  waliKelas?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // ['A. ...', 'B. ...', 'C. ...', 'D. ...']
  correctOptionIndex: number; // 0, 1, 2, 3
  explanation?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  teacherName: string;
  teacherNip: string;
  targetClass: string;
  dueDate: string;
  description: string;
  allowUpload: boolean;
  createdAt: string;
  materialUrl?: string;
  materialName?: string;
  videoUrl?: string;
  videoTitle?: string;
  quizQuestions?: QuizQuestion[];
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  submittedAt: string;
  fileName?: string;
  fileSize?: string;
  fileData?: string;
  videoUrl?: string;
  answerText?: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
  quizAnswers?: number[];
  quizScore?: number;
}

// All Official Classes at SMP Negeri 3 Cihampelas (Tahun Pelajaran 2026/2027)
export const SCHOOL_CLASSES: SchoolClass[] = [
  {
    "id": "7-A",
    "name": "Kelas 7-A",
    "waliKelas": "Wali Kelas 7-A",
    "totalStudents": 35
  },
  {
    "id": "7-B",
    "name": "Kelas 7-B",
    "waliKelas": "Wali Kelas 7-B",
    "totalStudents": 35
  },
  {
    "id": "7-C",
    "name": "Kelas 7-C",
    "waliKelas": "Wali Kelas 7-C",
    "totalStudents": 34
  },
  {
    "id": "7-D",
    "name": "Kelas 7-D",
    "waliKelas": "Wali Kelas 7-D",
    "totalStudents": 34
  },
  {
    "id": "7-E",
    "name": "Kelas 7-E",
    "waliKelas": "Wali Kelas 7-E",
    "totalStudents": 33
  },
  {
    "id": "7-F",
    "name": "Kelas 7-F",
    "waliKelas": "Wali Kelas 7-F",
    "totalStudents": 35
  },
  {
    "id": "8-A",
    "name": "Kelas 8-A",
    "waliKelas": "Wali Kelas 8-A",
    "totalStudents": 30
  },
  {
    "id": "8-B",
    "name": "Kelas 8-B",
    "waliKelas": "Wali Kelas 8-B",
    "totalStudents": 32
  },
  {
    "id": "8-C",
    "name": "Kelas 8-C",
    "waliKelas": "Wali Kelas 8-C",
    "totalStudents": 32
  },
  {
    "id": "8-D",
    "name": "Kelas 8-D",
    "waliKelas": "Wali Kelas 8-D",
    "totalStudents": 31
  },
  {
    "id": "8-E",
    "name": "Kelas 8-E",
    "waliKelas": "Wali Kelas 8-E",
    "totalStudents": 31
  },
  {
    "id": "8-F",
    "name": "Kelas 8-F",
    "waliKelas": "Wali Kelas 8-F",
    "totalStudents": 30
  },
  {
    "id": "9-A",
    "name": "Kelas 9-A",
    "waliKelas": "Wali Kelas 9-A",
    "totalStudents": 27
  },
  {
    "id": "9-B",
    "name": "Kelas 9-B",
    "waliKelas": "Wali Kelas 9-B",
    "totalStudents": 29
  },
  {
    "id": "9-C",
    "name": "Kelas 9-C",
    "waliKelas": "Wali Kelas 9-C",
    "totalStudents": 29
  },
  {
    "id": "9-D",
    "name": "Kelas 9-D",
    "waliKelas": "Wali Kelas 9-D",
    "totalStudents": 28
  },
  {
    "id": "9-E",
    "name": "Kelas 9-E",
    "waliKelas": "Wali Kelas 9-E",
    "totalStudents": 30
  }
];

// 535 Official Students of SMP Negeri 3 Cihampelas (Tahun Pelajaran 2026/2027)
export const INITIAL_STUDENTS: Student[] = [
  {
    "id": "7A-01",
    "nisn": "0133138158",
    "nis": "262707001",
    "name": "Abdul Hanan",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-02",
    "nisn": "0133419568",
    "nis": "262707002",
    "name": "Agus Muslih Miptahudin",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-03",
    "nisn": "0131975318",
    "nis": "262707003",
    "name": "Ahmad Ikbal Ramdan",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-04",
    "nisn": "3138483222",
    "nis": "262707004",
    "name": "Akbar Caesar Nurfattah",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-05",
    "nisn": "3144816342",
    "nis": "262707005",
    "name": "Alisa Nurhadianti",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-06",
    "nisn": "0132819815",
    "nis": "262707006",
    "name": "Alya Siti Aisyah",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-07",
    "nisn": "0142481760",
    "nis": "262707007",
    "name": "Anggi",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-08",
    "nisn": "0136751727",
    "nis": "262707008",
    "name": "Arya Saputra",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-09",
    "nisn": "0135321863",
    "nis": "262707009",
    "name": "Citra Dwi Meditia",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-10",
    "nisn": "0145088928",
    "nis": "262707010",
    "name": "Denia Saputri",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-11",
    "nisn": "3146431730",
    "nis": "262707011",
    "name": "Devinar Pristi Kinanti",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-12",
    "nisn": "3131391166",
    "nis": "262707012",
    "name": "Diana Rosmawati",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-13",
    "nisn": "0134062430",
    "nis": "262707013",
    "name": "Dika Ardiansyah",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-14",
    "nisn": "3145130476",
    "nis": "262707014",
    "name": "Dini Nuraeni",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-15",
    "nisn": "3144162279",
    "nis": "262707015",
    "name": "Dzallaludin Maullana",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-16",
    "nisn": "0145777479",
    "nis": "262707016",
    "name": "Hardiyansah",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-17",
    "nisn": "3131728749",
    "nis": "262707017",
    "name": "Ila Karomatul Aliyah",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-18",
    "nisn": "3144187945",
    "nis": "262707018",
    "name": "Indriyani",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-19",
    "nisn": "0148755198",
    "nis": "262707019",
    "name": "Jahdan Muhamad",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-20",
    "nisn": "3117095469",
    "nis": "262707020",
    "name": "Jaka Nirmansyah",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-21",
    "nisn": "3131936617",
    "nis": "262707021",
    "name": "Kayla Sofia Nurazizah",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-22",
    "nisn": "3145396458",
    "nis": "262707022",
    "name": "M. Sirojudin Ilham",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-23",
    "nisn": "0145440703",
    "nis": "262707023",
    "name": "Mariyam Nurul Hanipah Kanzania",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-24",
    "nisn": "3140520089",
    "nis": "262707024",
    "name": "Mey Mey Salsabila Nursifa",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-25",
    "nisn": "3143690128",
    "nis": "262707025",
    "name": "Moch Agi Ramlan Pratama",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-26",
    "nisn": "0137797097",
    "nis": "262707026",
    "name": "Muhamad Ikhsan Fadilah",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-27",
    "nisn": "0131094024",
    "nis": "262707027",
    "name": "Muhamad Latif Abdulloh",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-28",
    "nisn": "3131164276",
    "nis": "262707028",
    "name": "Muhamad Ridwan Raditya",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-29",
    "nisn": "3141189775",
    "nis": "262707029",
    "name": "Nisa Mustika Nurijati",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-30",
    "nisn": "0145453970",
    "nis": "262707030",
    "name": "Nursipa",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-31",
    "nisn": "3135417939",
    "nis": "262707031",
    "name": "Pramita Adya Rahma",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-32",
    "nisn": "0139566301",
    "nis": "262707032",
    "name": "Rizwan",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-33",
    "nisn": "3140886482",
    "nis": "262707033",
    "name": "Siti Meisya Ruqoyah",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-34",
    "nisn": "0133348999",
    "nis": "262707034",
    "name": "Siti Nur Aliza Marwah",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7A-35",
    "nisn": "3149950226",
    "nis": "262707035",
    "name": "Zahran Latif Azizan",
    "classId": "7-A",
    "gender": "-"
  },
  {
    "id": "7B-01",
    "nisn": "0137388595",
    "nis": "262707036",
    "name": "Abdul Latif",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-02",
    "nisn": "3138173878",
    "nis": "262707037",
    "name": "Ai Romlah",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-03",
    "nisn": "0135708747",
    "nis": "262707038",
    "name": "Alifa Rafanda Hibatillah",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-04",
    "nisn": "3142864611",
    "nis": "262707039",
    "name": "Alliya Nuraini Shafiah",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-05",
    "nisn": "0134087306",
    "nis": "262707040",
    "name": "Ari Rafa M Al Khamsyah",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-06",
    "nisn": "0129714189",
    "nis": "262707041",
    "name": "Azi Abdul Azis",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-07",
    "nisn": "0137241537",
    "nis": "262707042",
    "name": "Delendra Ihwan Al Pariz",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-08",
    "nisn": "3149795164",
    "nis": "262707043",
    "name": "Diaz Al Farizi",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-09",
    "nisn": "3140493620",
    "nis": "262707044",
    "name": "Faiha Munggaraniputri Susanto",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-10",
    "nisn": "0138941518",
    "nis": "262707045",
    "name": "Ibrahim Nur Fikram",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-11",
    "nisn": "3148738442",
    "nis": "262707046",
    "name": "Jihan Febriani",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-12",
    "nisn": "3133729793",
    "nis": "262707047",
    "name": "M Dzulpikar As Sanusi",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-13",
    "nisn": "3134721267",
    "nis": "262707048",
    "name": "M. Luthfie Yusran Maulana",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-14",
    "nisn": "3147855769",
    "nis": "262707049",
    "name": "M. Zanuar Maulidin",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-15",
    "nisn": "3146266558",
    "nis": "262707050",
    "name": "Mochamad Akbar Al Fajri",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-16",
    "nisn": "0141304418",
    "nis": "262707051",
    "name": "Mohamad Rafa Reza Ar Rasyid",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-17",
    "nisn": "0139625470",
    "nis": "262707052",
    "name": "Muhamad Ayusa",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-18",
    "nisn": "0137257796",
    "nis": "262707053",
    "name": "Muhamad Reyhan Al-Habsi",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-19",
    "nisn": "3149173852",
    "nis": "262707054",
    "name": "Muhamad Ryan Firmansyah",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-20",
    "nisn": "0141923820",
    "nis": "262707055",
    "name": "Muhammad Hamdan Rifai",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-21",
    "nisn": "0143367292",
    "nis": "262707056",
    "name": "Nadira Nur Rohmah",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-22",
    "nisn": "0141179348",
    "nis": "262707057",
    "name": "Naufal Nugraha Pratama",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-23",
    "nisn": "3144167868",
    "nis": "262707058",
    "name": "Neng Kiki",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-24",
    "nisn": "3133727410",
    "nis": "262707059",
    "name": "Pitri Nuraida",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-25",
    "nisn": "0145113727",
    "nis": "262707060",
    "name": "Raisa Salavina",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-26",
    "nisn": "0144774421",
    "nis": "262707061",
    "name": "Ranni Yulia Ningsih",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-27",
    "nisn": "0131311825",
    "nis": "262707062",
    "name": "Repan Miulid",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-28",
    "nisn": "3145328175",
    "nis": "262707063",
    "name": "Risma Handayani",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-29",
    "nisn": "0137479814",
    "nis": "262707064",
    "name": "Rizpan Arianto",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-30",
    "nisn": "0132864380",
    "nis": "262707065",
    "name": "Salsabila Nur Fadhilah",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-31",
    "nisn": "0138874194",
    "nis": "262707066",
    "name": "Septian Hardiansyah",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-32",
    "nisn": "0131381003",
    "nis": "262707067",
    "name": "Siti Hasanah",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-33",
    "nisn": "3145407025",
    "nis": "262707068",
    "name": "Siti Nur Oktaviani",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-34",
    "nisn": "0146632560",
    "nis": "262707069",
    "name": "Siti Yuliatul Hasanah",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7B-35",
    "nisn": "0148360503",
    "nis": "262707070",
    "name": "Wanda Salsabila Bilqis",
    "classId": "7-B",
    "gender": "-"
  },
  {
    "id": "7C-01",
    "nisn": "3137227558",
    "nis": "262707071",
    "name": "Abid Aqila Pranaja",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-02",
    "nisn": "3133018906",
    "nis": "262707072",
    "name": "Ajeng Wulandari",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-03",
    "nisn": "3146579000",
    "nis": "262707073",
    "name": "Alpar Ramadan",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-04",
    "nisn": "0133966355",
    "nis": "262707074",
    "name": "Aqila Azahra",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-05",
    "nisn": "0134436760",
    "nis": "262707075",
    "name": "Azzahra Septiani",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-06",
    "nisn": "0148120999",
    "nis": "262707076",
    "name": "Citra Lestari",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-07",
    "nisn": "3131578158",
    "nis": "262707077",
    "name": "Desta Azhar Maulana",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-08",
    "nisn": "0141982072",
    "nis": "262707078",
    "name": "Hafian Abiyyu Nurfatah",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-09",
    "nisn": "0141762357",
    "nis": "262707079",
    "name": "Intan Anugrah",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-10",
    "nisn": "0142461146",
    "nis": "262707080",
    "name": "Jeydan Rahadian Akbar",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-11",
    "nisn": "3145812505",
    "nis": "262707081",
    "name": "Lisnawati",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-12",
    "nisn": "0132060865",
    "nis": "262707082",
    "name": "M. Raihan Saputra",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-13",
    "nisn": "0137186132",
    "nis": "262707083",
    "name": "M.Abdila Putra Pratama",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-14",
    "nisn": "0131422889",
    "nis": "262707084",
    "name": "Moch. Nauval Rizky Pratama",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-15",
    "nisn": "0147324059",
    "nis": "262707085",
    "name": "Muhamad Aditya Irawan",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-16",
    "nisn": "0135472352",
    "nis": "262707086",
    "name": "Muhamad Fadil Al Habsi",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-17",
    "nisn": "3140074010",
    "nis": "262707087",
    "name": "Muhamad Mahabatul Arfa",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-18",
    "nisn": "3141789895",
    "nis": "262707088",
    "name": "Muhamad Saepul Fahri",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-19",
    "nisn": "3134026449",
    "nis": "262707089",
    "name": "Muhammad Fauzan",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-20",
    "nisn": "0134443247",
    "nis": "262707090",
    "name": "Nadia Adara S.P",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-21",
    "nisn": "0135605559",
    "nis": "262707091",
    "name": "Najwa Safitri",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-22",
    "nisn": "3135051210",
    "nis": "262707092",
    "name": "Neng Maryani",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-23",
    "nisn": "0149592457",
    "nis": "262707093",
    "name": "Qisya Keysyara",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-24",
    "nisn": "0132544035",
    "nis": "262707094",
    "name": "Raisa Siti Nur Azizah",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-25",
    "nisn": "3137462107",
    "nis": "262707095",
    "name": "Rendi Sopiandi Putra",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-26",
    "nisn": "0139282772",
    "nis": "262707096",
    "name": "Reysa Nur Azizah",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-27",
    "nisn": "0135647753",
    "nis": "262707097",
    "name": "Rio Santoni",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-28",
    "nisn": "3135008548",
    "nis": "262707098",
    "name": "Robby Alamsyah",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-29",
    "nisn": "3148309368",
    "nis": "262707099",
    "name": "Salsabilla Anggraeni",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-30",
    "nisn": "3138421675",
    "nis": "262707100",
    "name": "Sisil Fitria",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-31",
    "nisn": "0145801550",
    "nis": "262707101",
    "name": "Siti Mulkiatul Sa'Adah",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-32",
    "nisn": "3146849664",
    "nis": "262707102",
    "name": "Siti Silvia Ramadani",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-33",
    "nisn": "0131863843",
    "nis": "262707103",
    "name": "Syaidatina Azzahra",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7C-34",
    "nisn": "3143328439",
    "nis": "262707104",
    "name": "Yasni Khairun Nisa",
    "classId": "7-C",
    "gender": "-"
  },
  {
    "id": "7D-01",
    "nisn": "0136808566",
    "nis": "262707105",
    "name": "Adinda Putri Maharani",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-02",
    "nisn": "3147849046",
    "nis": "262707106",
    "name": "Aldiana",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-03",
    "nisn": "0147355466",
    "nis": "262707107",
    "name": "Alif Faturahman",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-04",
    "nisn": "3144481515",
    "nis": "262707108",
    "name": "Aryandi Pratama Al-Farizi",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-05",
    "nisn": "3133051767",
    "nis": "262707109",
    "name": "Azahra Putri Novianti",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-06",
    "nisn": "0144837993",
    "nis": "262707110",
    "name": "Daffa Ibnu Hafidz",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-07",
    "nisn": "0149126245",
    "nis": "262707111",
    "name": "Dini Nur Zanah",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-08",
    "nisn": "0137892853",
    "nis": "262707112",
    "name": "Farhan Zaelani",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-09",
    "nisn": "0131048586",
    "nis": "262707113",
    "name": "Intan Lestari",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-10",
    "nisn": "0133268585",
    "nis": "262707114",
    "name": "Khanza Calista Putri",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-11",
    "nisn": "3139909510",
    "nis": "262707115",
    "name": "M. Fajar",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-12",
    "nisn": "0147025795",
    "nis": "262707116",
    "name": "M. Rizki Hardiansyah",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-13",
    "nisn": "3141007845",
    "nis": "262707117",
    "name": "Maulana Malik Ibrahim",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-14",
    "nisn": "0148873388",
    "nis": "262707118",
    "name": "Mochamad Arfan Faujan",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-15",
    "nisn": "0146884649",
    "nis": "262707119",
    "name": "Muhamad Alvin Aldavi",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-16",
    "nisn": "3148254039",
    "nis": "262707120",
    "name": "Muhamad Farid",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-17",
    "nisn": "3136006895",
    "nis": "262707121",
    "name": "Muhamad Rezza Putra",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-18",
    "nisn": "3134743269",
    "nis": "262707122",
    "name": "Muhamad Salman Alfarizi",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-19",
    "nisn": "3124873348",
    "nis": "262707123",
    "name": "Muhammad Nizam Ishmatulloh",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-20",
    "nisn": "0148303807",
    "nis": "262707124",
    "name": "Nagita Althalita Ulfa",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-21",
    "nisn": "3131487121",
    "nis": "262707125",
    "name": "Naura Hasna Anida",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-22",
    "nisn": "3146610206",
    "nis": "262707126",
    "name": "Nur Siti Rahma Rahayu",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-23",
    "nisn": "3149079481",
    "nis": "262707127",
    "name": "Qorinatus Sadiyah",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-24",
    "nisn": "0143076349",
    "nis": "262707128",
    "name": "Raisha Aqiela Putri",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-25",
    "nisn": "0148151032",
    "nis": "262707129",
    "name": "Reni Anggraeni",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-26",
    "nisn": "3136444385",
    "nis": "262707130",
    "name": "Reza Alpariji",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-27",
    "nisn": "3141980620",
    "nis": "262707131",
    "name": "Risma Rosmayanti",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-28",
    "nisn": "3136918846",
    "nis": "262707132",
    "name": "Rosandi Ade Putra",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-29",
    "nisn": "3143928274",
    "nis": "262707133",
    "name": "Sandi Fikriansyah",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-30",
    "nisn": "3135175301",
    "nis": "262707134",
    "name": "Selli Saidina",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-31",
    "nisn": "3149319323",
    "nis": "262707135",
    "name": "Siti Jahra Wulandari",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-32",
    "nisn": "0146266401",
    "nis": "262707136",
    "name": "Siti Nur'Alia",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-33",
    "nisn": "3149779613",
    "nis": "262707137",
    "name": "Syara Wahyunika",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7D-34",
    "nisn": "0148709646",
    "nis": "262707138",
    "name": "Zahra Lutvia Setiawan",
    "classId": "7-D",
    "gender": "-"
  },
  {
    "id": "7E-01",
    "nisn": "3141247946",
    "nis": "262707139",
    "name": "Adam Suherman",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-02",
    "nisn": "3146314201",
    "nis": "262707140",
    "name": "Ais Patmasari",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-03",
    "nisn": "3130957722",
    "nis": "262707141",
    "name": "Alya Siti Ramadani",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-04",
    "nisn": "3149211582",
    "nis": "262707142",
    "name": "Arafi Arma Safutra",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-05",
    "nisn": "0132545606",
    "nis": "262707143",
    "name": "Cici Bunda Riyani",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-06",
    "nisn": "0134103732",
    "nis": "262707144",
    "name": "Dea Andini",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-07",
    "nisn": "3130948065",
    "nis": "262707145",
    "name": "Dionisius Mora Pangihutan Sagala",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-08",
    "nisn": "3145419844",
    "nis": "262707146",
    "name": "Hafisal Mubarok",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-09",
    "nisn": "3141153808",
    "nis": "262707147",
    "name": "Ica Nurwita",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-10",
    "nisn": "3141096430",
    "nis": "262707148",
    "name": "Keysa Rahayu Cahaya Putri",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-11",
    "nisn": "0133313280",
    "nis": "262707149",
    "name": "M Syahdan Alfizan",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-12",
    "nisn": "0124556558",
    "nis": "262707150",
    "name": "M. Rizky Fadillah",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-13",
    "nisn": "0147425541",
    "nis": "262707151",
    "name": "Moch Rafana Ridwansyah",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-14",
    "nisn": "0138503837",
    "nis": "262707152",
    "name": "Mochamad Reza Putra Setiadi",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-15",
    "nisn": "0142868510",
    "nis": "262707153",
    "name": "Muhamad Anggara Yudha",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-16",
    "nisn": "0143109742",
    "nis": "262707154",
    "name": "Muhamad Fajril Mubarok",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-17",
    "nisn": "3143610704",
    "nis": "262707155",
    "name": "Muhamad Rifal Al Pauji",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-18",
    "nisn": "0148543264",
    "nis": "262707156",
    "name": "Muhammad Fahmi Ramadhan",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-19",
    "nisn": "3144020922",
    "nis": "262707157",
    "name": "Muhammad Najril Al Shoaebi",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-20",
    "nisn": "0146376129",
    "nis": "262707158",
    "name": "Naila Izzatun Nisa",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-21",
    "nisn": "0147337944",
    "nis": "262707159",
    "name": "Naura Nadhifa Lesmana",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-22",
    "nisn": "3144530727",
    "nis": "262707160",
    "name": "Nuraeni",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-23",
    "nisn": "3147012685",
    "nis": "262707161",
    "name": "Rahma Umil Hakim",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-24",
    "nisn": "0144277671",
    "nis": "262707162",
    "name": "Raisya Humaira Az Zahra",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-25",
    "nisn": "3149868732",
    "nis": "262707163",
    "name": "Refilliana Tri Putra",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-26",
    "nisn": "0143655264",
    "nis": "262707164",
    "name": "Rifa Nursyamsyah",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-27",
    "nisn": "0131447043",
    "nis": "262707165",
    "name": "Rizab Maulana Sidiq",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-28",
    "nisn": "0137157807",
    "nis": "262707167",
    "name": "Salwa Rizkya",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-29",
    "nisn": "3143038168",
    "nis": "262707168",
    "name": "Silsil Nabila Putri",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-30",
    "nisn": "3140601858",
    "nis": "262707169",
    "name": "Siti Muhibbah Fitriyani",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-31",
    "nisn": "3138266807",
    "nis": "262707170",
    "name": "Siti Nurohmah",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-32",
    "nisn": "3137065354",
    "nis": "262707171",
    "name": "Tita Tazkiyah Tullutfi",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7E-33",
    "nisn": "3132295141",
    "nis": "262707172",
    "name": "Ziadatur Rizkoh",
    "classId": "7-E",
    "gender": "-"
  },
  {
    "id": "7F-01",
    "nisn": "3139467288",
    "nis": "262707173",
    "name": "Ahmad Ade Asikin",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-02",
    "nisn": "0136003533",
    "nis": "262707174",
    "name": "Akifa Naila",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-03",
    "nisn": "0139447071",
    "nis": "262707175",
    "name": "Anisa Nuriyanti",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-04",
    "nisn": "3121727423",
    "nis": "262707176",
    "name": "Arif Maulana",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-05",
    "nisn": "0141069822",
    "nis": "262707177",
    "name": "Bilqisa Ramadani Sawal",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-06",
    "nisn": "3137151987",
    "nis": "262707178",
    "name": "Cahyana",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-07",
    "nisn": "0133953025",
    "nis": "262707179",
    "name": "Citra Freshilia",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-08",
    "nisn": "0139260493",
    "nis": "262707180",
    "name": "Elvina Septiani",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-09",
    "nisn": "0131183896",
    "nis": "262707181",
    "name": "Fajar Saputra Devriansyah",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-10",
    "nisn": "3149509004",
    "nis": "262707182",
    "name": "Ihsan Riyandi",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-11",
    "nisn": "3149892894",
    "nis": "262707183",
    "name": "Keyla Aulia Putri",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-12",
    "nisn": "0136554522",
    "nis": "262707184",
    "name": "M. Al Fathir Lawian",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-13",
    "nisn": "0137469601",
    "nis": "262707185",
    "name": "M. Ramdansyah Al-Hadad",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-14",
    "nisn": "0149835009",
    "nis": "262707186",
    "name": "Moch. Haikal",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-15",
    "nisn": "0137148097",
    "nis": "262707187",
    "name": "Moh Fahrizal",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-16",
    "nisn": "0134464763",
    "nis": "262707188",
    "name": "Muhamad Adlan Nurohman",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-17",
    "nisn": "3135143850",
    "nis": "262707189",
    "name": "Muhamad Habibi",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-18",
    "nisn": "0138404107",
    "nis": "262707190",
    "name": "Muhamad Rizki Alfiansyah",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-19",
    "nisn": "3134390507",
    "nis": "262707191",
    "name": "Muhammad Alvin Prasetya",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-20",
    "nisn": "3114241009",
    "nis": "262707192",
    "name": "Muhammad Rizky Sofian",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-21",
    "nisn": "0147174940",
    "nis": "262707193",
    "name": "Nabila Maharani",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-22",
    "nisn": "0139954366",
    "nis": "262707194",
    "name": "Naima Nur Rohmah",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-23",
    "nisn": "3143490054",
    "nis": "262707195",
    "name": "Nayla Desiyana",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-24",
    "nisn": "0134662567",
    "nis": "262707196",
    "name": "Pian Hamdani",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-25",
    "nisn": "3140650902",
    "nis": "262707197",
    "name": "Raisa Rofiah",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-26",
    "nisn": "0134764784",
    "nis": "262707198",
    "name": "Rania Maoura Melodya",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-27",
    "nisn": "0127546417",
    "nis": "262707199",
    "name": "Repa Indriyani",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-28",
    "nisn": "3143719566",
    "nis": "262707200",
    "name": "Rifky Fadillah",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-29",
    "nisn": "0144735100",
    "nis": "262707201",
    "name": "Rizky Putra Maulana",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-30",
    "nisn": "0134759664",
    "nis": "262707202",
    "name": "Sahfira Rahmawati",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-31",
    "nisn": "3146857727",
    "nis": "262707203",
    "name": "Santa Hoky Noviyani",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-32",
    "nisn": "0143244111",
    "nis": "262707204",
    "name": "Siti Fatiahtul Rahmah",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-33",
    "nisn": "0136360783",
    "nis": "262707205",
    "name": "Siti Nazar",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-34",
    "nisn": "0148939307",
    "nis": "262707206",
    "name": "Siti Sopiah",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "7F-35",
    "nisn": "0143632198",
    "nis": "262707207",
    "name": "Virzha Atallah Musyafa",
    "classId": "7-F",
    "gender": "-"
  },
  {
    "id": "8A-01",
    "nisn": "0135677030",
    "nis": "252607001",
    "name": "Ahmad Mushap Anjab",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-02",
    "nisn": "0129331044",
    "nis": "252607002",
    "name": "Ainaya Fathiyatu Rahma",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-03",
    "nisn": "0121207805",
    "nis": "252607005",
    "name": "Antika Nurbani",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-04",
    "nisn": "3119511669",
    "nis": "252607006",
    "name": "Arga Wandani",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-05",
    "nisn": "0136422882",
    "nis": "252607007",
    "name": "Bunga Sri Rahmawati",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-06",
    "nisn": "3128658475",
    "nis": "252607008",
    "name": "Fauzan Hanifulatif",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-07",
    "nisn": "3121851692",
    "nis": "252607009",
    "name": "Galang Ahmad Wiguna",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-08",
    "nisn": "3124159268",
    "nis": "252607010",
    "name": "Inggit Riyanti",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-09",
    "nisn": "0125427736",
    "nis": "252607011",
    "name": "Kamila Dewi Khumairah",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-10",
    "nisn": "0127588522",
    "nis": "252607012",
    "name": "Kania Nur Idfi",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-11",
    "nisn": "0122475098",
    "nis": "252607013",
    "name": "Lea Fitriana Rospita Rojak",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-12",
    "nisn": "3128159318",
    "nis": "252607014",
    "name": "M. Fazar",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-13",
    "nisn": "0124683543",
    "nis": "252607015",
    "name": "Muhamad Basir",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-14",
    "nisn": "3129667413",
    "nis": "252607016",
    "name": "Muhamad Habil Nugraha",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-15",
    "nisn": "0127502952",
    "nis": "252607017",
    "name": "Muhamad Zidan",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-16",
    "nisn": "3138657738",
    "nis": "252607018",
    "name": "Muhammad Azka Valiantsyah Al-Ghifari",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-17",
    "nisn": "0139111337",
    "nis": "252607019",
    "name": "Muhammad Zilan Alfajri",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-18",
    "nisn": "0122416021",
    "nis": "252607020",
    "name": "Nafisa Nur Jamilah",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-19",
    "nisn": "3122371697",
    "nis": "252607021",
    "name": "Naila Ramadani",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-20",
    "nisn": "0123078971",
    "nis": "252607022",
    "name": "Nasywa Aulia Putri Azzahra",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-21",
    "nisn": "0124347163",
    "nis": "252607023",
    "name": "Naura Auni Dwi Putri",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-22",
    "nisn": "0133345666",
    "nis": "252607024",
    "name": "Nuha Kanza Mulya",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-23",
    "nisn": "0127540155",
    "nis": "252607025",
    "name": "Raisal Permana Yaksa",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-24",
    "nisn": "3121489806",
    "nis": "252607026",
    "name": "Rifaldi Ajis Maulana",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-25",
    "nisn": "3124782865",
    "nis": "252607027",
    "name": "Salsa Nur Hikmah",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-26",
    "nisn": "0131454958",
    "nis": "252607028",
    "name": "Siti Hardina Ridianti",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-27",
    "nisn": "0126911315",
    "nis": "252607029",
    "name": "Taufiq",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-28",
    "nisn": "3127555243",
    "nis": "252607030",
    "name": "Ulfa Ramdhanisa",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-29",
    "nisn": "3129432870",
    "nis": "252607031",
    "name": "Yayang Rizki",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8A-30",
    "nisn": "3126018294",
    "nis": "252607032",
    "name": "Zahra Nanda Amelia",
    "classId": "8-A",
    "gender": "-"
  },
  {
    "id": "8B-01",
    "nisn": "0138652360",
    "nis": "252607033",
    "name": "Andiani",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-02",
    "nisn": "0125824660",
    "nis": "252607034",
    "name": "Aulia Putri Rabani",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-03",
    "nisn": "0135831816",
    "nis": "252607035",
    "name": "Cep Riki Hidayat",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-04",
    "nisn": "3129392215",
    "nis": "252607036",
    "name": "Elfira Anggraeni",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-05",
    "nisn": "0126861371",
    "nis": "252607037",
    "name": "Fatur Rohman M",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-06",
    "nisn": "3128005420",
    "nis": "252607038",
    "name": "Geri Purnama",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-07",
    "nisn": "0128573954",
    "nis": "252607039",
    "name": "Haris Firmansyah",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-08",
    "nisn": "3139167379",
    "nis": "252607040",
    "name": "Hesti Anggraeni",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-09",
    "nisn": "3113193516",
    "nis": "252607041",
    "name": "Laksmana Arya Panca Wirdan",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-10",
    "nisn": "0137271277",
    "nis": "252607042",
    "name": "M Vicky Shaputra",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-11",
    "nisn": "3129342224",
    "nis": "252607043",
    "name": "M.  Zam Zam Maulana",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-12",
    "nisn": "0123346748",
    "nis": "252607044",
    "name": "M. Lukman Hakim",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-13",
    "nisn": "0124953263",
    "nis": "252607045",
    "name": "Malikka Qinanti",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-14",
    "nisn": "3133176226",
    "nis": "252607046",
    "name": "Muhamad Fajar Hidayat",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-15",
    "nisn": "0127307542",
    "nis": "252607047",
    "name": "Muhamad Nazril Rahmani",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-16",
    "nisn": "0139565411",
    "nis": "252607048",
    "name": "Muhamad Revan Pratama",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-17",
    "nisn": "3121684734",
    "nis": "252607049",
    "name": "Muhammad Ikhmal Pratama",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-18",
    "nisn": "3137522993",
    "nis": "252607050",
    "name": "Naura Azahra",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-19",
    "nisn": "3135010597",
    "nis": "252607051",
    "name": "Nurul Ainun Habibah",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-20",
    "nisn": "3138811922",
    "nis": "252607052",
    "name": "Putri Rahma Kirana",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-21",
    "nisn": "0118076503",
    "nis": "252607053",
    "name": "Ripki",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-22",
    "nisn": "0122424817",
    "nis": "252607054",
    "name": "Rizkia Nur Putri",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-23",
    "nisn": "3123492551",
    "nis": "252607055",
    "name": "Rizky Ramadani",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-24",
    "nisn": "0131823689",
    "nis": "252607056",
    "name": "Salsa Riyani",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-25",
    "nisn": "0134906955",
    "nis": "252607057",
    "name": "Selia Nur Rahma",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-26",
    "nisn": "3132942570",
    "nis": "252607058",
    "name": "Sintia Putri Rahmi",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-27",
    "nisn": "3139996147",
    "nis": "252607059",
    "name": "Siti Putri Lisnawati",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-28",
    "nisn": "3129307827",
    "nis": "252607060",
    "name": "Siti Saskia Regina Nursipa",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-29",
    "nisn": "0126992609",
    "nis": "252607061",
    "name": "Sri Rahmawati",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-30",
    "nisn": "3121654755",
    "nis": "252607062",
    "name": "Via Oktaviani Safitri",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-31",
    "nisn": "0136052730",
    "nis": "252607063",
    "name": "Yuzia Kaila",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8B-32",
    "nisn": "0122301286",
    "nis": "252607064",
    "name": "Zihra Maulida Nurul Patimah",
    "classId": "8-B",
    "gender": "-"
  },
  {
    "id": "8C-01",
    "nisn": "3114453364",
    "nis": "252607065",
    "name": "Acep Parhan",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-02",
    "nisn": "3132576857",
    "nis": "252607066",
    "name": "Aditiya Muhamad Iskandar",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-03",
    "nisn": "0138235183",
    "nis": "252607067",
    "name": "Aina Kanza Akila",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-04",
    "nisn": "0136486466",
    "nis": "252607068",
    "name": "Alif Rizki Sulaeman",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-05",
    "nisn": "3138110082",
    "nis": "252607069",
    "name": "Aprilia Saputri",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-06",
    "nisn": "0131562763",
    "nis": "252607070",
    "name": "Aurelia Shidqia Yuhana",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-07",
    "nisn": "3129983876",
    "nis": "252607071",
    "name": "Elsa Eka Cantika",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-08",
    "nisn": "0127994497",
    "nis": "252607072",
    "name": "Inara August Fitriani",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-09",
    "nisn": "0121792376",
    "nis": "252607073",
    "name": "Kanza Amora Kasih",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-10",
    "nisn": "3125446342",
    "nis": "252607074",
    "name": "M Gio Saputra",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-11",
    "nisn": "3128025560",
    "nis": "252607075",
    "name": "Muhamad Gusyairi",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-12",
    "nisn": "0136620445",
    "nis": "252607076",
    "name": "Muhamad Ilham",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-13",
    "nisn": "0121436346",
    "nis": "252607077",
    "name": "Muhamad Rizki Afriansyah",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-14",
    "nisn": "0156575570",
    "nis": "252607078",
    "name": "Muhamad Sensen Saputra",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-15",
    "nisn": "3124347567",
    "nis": "252607079",
    "name": "Muhammad Fadilah",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-16",
    "nisn": "0126277080",
    "nis": "252607080",
    "name": "Naila Putri Permatasari",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-17",
    "nisn": "0136176594",
    "nis": "252607081",
    "name": "Nazmi Ayatul Husna",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-18",
    "nisn": "3125046155",
    "nis": "252607082",
    "name": "Nisa Hasna",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-19",
    "nisn": "3126446687",
    "nis": "252607083",
    "name": "Puspitasari",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-20",
    "nisn": "0128328473",
    "nis": "252607084",
    "name": "Rahmat Mustofa",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-21",
    "nisn": "3139726361",
    "nis": "252607085",
    "name": "Rangga Septian",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-22",
    "nisn": "0122879403",
    "nis": "252607086",
    "name": "Rani",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-23",
    "nisn": "0111964398",
    "nis": "252607087",
    "name": "Reyhan Muttakin",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-24",
    "nisn": "0129510040",
    "nis": "252607088",
    "name": "Ridwan Hidayat",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-25",
    "nisn": "3123471978",
    "nis": "252607089",
    "name": "Rifal Rizky Ananda",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-26",
    "nisn": "0134029425",
    "nis": "252607090",
    "name": "Safitri Rahmadani",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-27",
    "nisn": "0137020751",
    "nis": "252607091",
    "name": "Siti Salma",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-28",
    "nisn": "3132590608",
    "nis": "252607092",
    "name": "Siti Zahra",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-29",
    "nisn": "3139235892",
    "nis": "252607093",
    "name": "Sukma Aulia Azzahra",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-30",
    "nisn": "0123869317",
    "nis": "252607094",
    "name": "Viona Dwi Ledyyana",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-31",
    "nisn": "0127191409",
    "nis": "252607095",
    "name": "Zahra Nuraeni Ramadani",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8C-32",
    "nisn": "0135880374",
    "nis": "252607096",
    "name": "Zalaludin Muhamad Akbar",
    "classId": "8-C",
    "gender": "-"
  },
  {
    "id": "8D-01",
    "nisn": "3129408020",
    "nis": "252607097",
    "name": "Ahmad Faisal",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-02",
    "nisn": "0139175088",
    "nis": "252607098",
    "name": "Arizal Ramadian Sidik",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-03",
    "nisn": "3136515234",
    "nis": "252607099",
    "name": "Arsyila Salsabila Rivani",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-04",
    "nisn": "0129776211",
    "nis": "252607100",
    "name": "Aruna Nurhabib",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-05",
    "nisn": "0136930121",
    "nis": "252607101",
    "name": "Ashila Nurmaulida",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-06",
    "nisn": "3131500960",
    "nis": "252607102",
    "name": "Delviana",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-07",
    "nisn": "3129826131",
    "nis": "252607103",
    "name": "Desta Muhamad Akbar",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-08",
    "nisn": "3122858207",
    "nis": "252607104",
    "name": "Fadya Widiola Zahrani",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-09",
    "nisn": "3132988285",
    "nis": "252607105",
    "name": "Farel Cahya Pratama",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-10",
    "nisn": "0139073250",
    "nis": "252607106",
    "name": "Fasell Rama Alfian",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-11",
    "nisn": "0128824372",
    "nis": "252607107",
    "name": "Galih Ginanjar",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-12",
    "nisn": "0132691691",
    "nis": "252607108",
    "name": "Ibad",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-13",
    "nisn": "3124704490",
    "nis": "252607109",
    "name": "Ikbal",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-14",
    "nisn": "3133209147",
    "nis": "252607110",
    "name": "Intan Ayuni",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-15",
    "nisn": "3121163588",
    "nis": "252607111",
    "name": "Kesya Indriyani",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-16",
    "nisn": "3128266176",
    "nis": "252607112",
    "name": "Muhamad Dicki Karisma",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-17",
    "nisn": "3132540698",
    "nis": "252607113",
    "name": "Natasa Anggraeni",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-18",
    "nisn": "3126934228",
    "nis": "252607114",
    "name": "Nazwa Nurbayani",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-19",
    "nisn": "0132994379",
    "nis": "252607115",
    "name": "Putri Anggraeni",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-20",
    "nisn": "3124097419",
    "nis": "252607116",
    "name": "Raditya Maulana",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-21",
    "nisn": "0121152443",
    "nis": "252607117",
    "name": "Riska Anggraeni",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-22",
    "nisn": "3121714409",
    "nis": "252607118",
    "name": "Salma Adawiyah",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-23",
    "nisn": "3135743710",
    "nis": "252607119",
    "name": "Sania Natasya Aulia",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-24",
    "nisn": "0138759939",
    "nis": "252607120",
    "name": "Saprudin Miftah Gunawan Khoir",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-25",
    "nisn": "3126920979",
    "nis": "252607121",
    "name": "Siti Kamelia",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-26",
    "nisn": "3134598135",
    "nis": "252607122",
    "name": "Siti Salma Putri Gustianti",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-27",
    "nisn": "3124111916",
    "nis": "252607124",
    "name": "Sultan Soleh",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-28",
    "nisn": "3122915955",
    "nis": "252607125",
    "name": "Ulfah",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-29",
    "nisn": "0136822122",
    "nis": "252607126",
    "name": "Vikri Rahayu",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-30",
    "nisn": "0124859412",
    "nis": "252607127",
    "name": "Windi Lestari",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8D-31",
    "nisn": "0126284280",
    "nis": "252607128",
    "name": "Zahra Rahmadani",
    "classId": "8-D",
    "gender": "-"
  },
  {
    "id": "8E-01",
    "nisn": "3125508345",
    "nis": "252607129",
    "name": "Alif Amsor Anugrah",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-02",
    "nisn": "0127130951",
    "nis": "252607130",
    "name": "Anatasya Setiya Nurani",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-03",
    "nisn": "3134013274",
    "nis": "252607131",
    "name": "Asipa Nursaadah",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-04",
    "nisn": "3129330192",
    "nis": "252607132",
    "name": "Azril Al Tafah",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-05",
    "nisn": "3127373724",
    "nis": "252607133",
    "name": "Biru Nugie Mugia",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-06",
    "nisn": "3139566365",
    "nis": "252607134",
    "name": "Ganjar Purnama",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-07",
    "nisn": "3126641722",
    "nis": "252607135",
    "name": "Gisel Indriyani",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-08",
    "nisn": "3121879150",
    "nis": "252607136",
    "name": "Ilman Fadil",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-09",
    "nisn": "0136629351",
    "nis": "252607137",
    "name": "Jahwa Andriyana",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-10",
    "nisn": "0133116466",
    "nis": "252607138",
    "name": "Lisna Anggraeni",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-11",
    "nisn": "0121210894",
    "nis": "252607139",
    "name": "M Marwan Ripaldo",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-12",
    "nisn": "3131517625",
    "nis": "252607140",
    "name": "M. Cakra Firmansyah",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-13",
    "nisn": "0139037412",
    "nis": "252607142",
    "name": "Muhamad Reyhan Al Patah",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-14",
    "nisn": "0121762982",
    "nis": "252607143",
    "name": "Muhamad Yazid Al Fikri Ramdani",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-15",
    "nisn": "3127119148",
    "nis": "252607144",
    "name": "Muhammad Adryan Juliansyah",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-16",
    "nisn": "3125734956",
    "nis": "252607145",
    "name": "Muhammad Guntur",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-17",
    "nisn": "3131683055",
    "nis": "252607146",
    "name": "Natasya Khoirunnisa Febriany",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-18",
    "nisn": "0132645180",
    "nis": "252607147",
    "name": "Niki Nayla",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-19",
    "nisn": "0121252660",
    "nis": "252607148",
    "name": "Nofi Oktafia",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-20",
    "nisn": "3117569886",
    "nis": "252607149",
    "name": "Rendra",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-21",
    "nisn": "3134305365",
    "nis": "252607150",
    "name": "Salsa Pebrianti",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-22",
    "nisn": "3132283649",
    "nis": "252607151",
    "name": "Sania Putri",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-23",
    "nisn": "3122889415",
    "nis": "252607152",
    "name": "Silvi Nur Alisya",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-24",
    "nisn": "0134741528",
    "nis": "252607153",
    "name": "Siti Nurul Hasanah",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-25",
    "nisn": "0124429833",
    "nis": "252607154",
    "name": "Siti Salsa Syamsiyah",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-26",
    "nisn": "3122798483",
    "nis": "252607155",
    "name": "Siva",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-27",
    "nisn": "3127484117",
    "nis": "252607156",
    "name": "Sutisna",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-28",
    "nisn": "3139922161",
    "nis": "252607157",
    "name": "Umam Samsiah",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-29",
    "nisn": "3127609387",
    "nis": "252607158",
    "name": "Yasrin Apriliani",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-30",
    "nisn": "0139223639",
    "nis": "252607159",
    "name": "Zahratul Sita",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8E-31",
    "nisn": "0128284090",
    "nis": "252607160",
    "name": "Zainal Abidin",
    "classId": "8-E",
    "gender": "-"
  },
  {
    "id": "8F-01",
    "nisn": "3133492815",
    "nis": "252607161",
    "name": "Abelia Eriyanto",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-02",
    "nisn": "0139216782",
    "nis": "252607162",
    "name": "Al Ajam",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-03",
    "nisn": "3122705996",
    "nis": "252607163",
    "name": "Aldi Aditya",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-04",
    "nisn": "0125194646",
    "nis": "252607164",
    "name": "Aldi Arifin Putra",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-05",
    "nisn": "3122876302",
    "nis": "252607165",
    "name": "Alvi Nawawi",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-06",
    "nisn": "3124363219",
    "nis": "252607166",
    "name": "Alya Purnama Sari",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-07",
    "nisn": "3136045675",
    "nis": "252607167",
    "name": "Andi Setiyawan",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-08",
    "nisn": "3121433067",
    "nis": "252607168",
    "name": "Arkan Khoiry Lampard",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-09",
    "nisn": "3121808228",
    "nis": "252607169",
    "name": "Asti Melani",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-10",
    "nisn": "3126760744",
    "nis": "252607170",
    "name": "Desti Aulia",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-11",
    "nisn": "3139964702",
    "nis": "252607171",
    "name": "Dinda Nuraeni",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-12",
    "nisn": "3137095236",
    "nis": "252607172",
    "name": "Fakhri Hamzah",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-13",
    "nisn": "3133822412",
    "nis": "252607173",
    "name": "Fandi Nur Ahmad",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-14",
    "nisn": "3130765532",
    "nis": "252607174",
    "name": "Kaila Putri Apiola",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-15",
    "nisn": "0137708157",
    "nis": "252607175",
    "name": "Kheisa Ali Wahid",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-16",
    "nisn": "3123668773",
    "nis": "252607176",
    "name": "Lia Melinda",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-17",
    "nisn": "3126862475",
    "nis": "252607178",
    "name": "M. Zaky Nur Falah",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-18",
    "nisn": "3131428688",
    "nis": "252607179",
    "name": "Muhamad Salman Alfarizi",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-19",
    "nisn": "3124252867",
    "nis": "252607180",
    "name": "Muzi Ahmad Nurmana",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-20",
    "nisn": "3122513897",
    "nis": "252607181",
    "name": "Nina Halipah",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-21",
    "nisn": "3128068297",
    "nis": "252607182",
    "name": "Nita",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-22",
    "nisn": "0123474134",
    "nis": "252607183",
    "name": "Putri Ayu",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-23",
    "nisn": "3132017510",
    "nis": "252607185",
    "name": "Rio Muhamad Akbar",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-24",
    "nisn": "3134914287",
    "nis": "252607186",
    "name": "Risma Rosela",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-25",
    "nisn": "3137692974",
    "nis": "252607187",
    "name": "Sandra Putri Wardani",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-26",
    "nisn": "0139994574",
    "nis": "252607188",
    "name": "Selvi Aprilia Putri",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-27",
    "nisn": "3128517530",
    "nis": "252607189",
    "name": "Septiani",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-28",
    "nisn": "0121306300",
    "nis": "252607190",
    "name": "Shakira",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-29",
    "nisn": "0128601084",
    "nis": "252607191",
    "name": "Siti Rohimah",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "8F-30",
    "nisn": "0126665319",
    "nis": "252607192",
    "name": "Syifa Aulia Aldawiah",
    "classId": "8-F",
    "gender": "-"
  },
  {
    "id": "9A-01",
    "nisn": "3113497930",
    "nis": "242507001",
    "name": "A. Septian",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-02",
    "nisn": "0129949478",
    "nis": "242507160",
    "name": "Ahmad Khaerul Umam",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-03",
    "nisn": "0117567952",
    "nis": "242507002",
    "name": "Ahmad Raihan Fauzan",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-04",
    "nisn": "0113649750",
    "nis": "242507161",
    "name": "Aldi Mardiansyah",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-05",
    "nisn": "0123199371",
    "nis": "242507003",
    "name": "Anggun Rahma Davista",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-06",
    "nisn": "0124312711",
    "nis": "242507004",
    "name": "Calista Friscila Rhamadani",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-07",
    "nisn": "0111835196",
    "nis": "242507006",
    "name": "Dendi Saparrudin",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-08",
    "nisn": "0112214583",
    "nis": "242507008",
    "name": "Haris Haryanto",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-09",
    "nisn": "0117080619",
    "nis": "242507009",
    "name": "Irfan Muzakki",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-10",
    "nisn": "0128045802",
    "nis": "242507012",
    "name": "M. Sopian Fajar",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-11",
    "nisn": "0091402943",
    "nis": "",
    "name": "MAESYARANI MUSDALIFAH",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-12",
    "nisn": "3127422965",
    "nis": "242507014",
    "name": "Muhamad Asep Buhori",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-13",
    "nisn": "0125501572",
    "nis": "242507015",
    "name": "Muhamad Luay Al Fatih",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-14",
    "nisn": "0128089725",
    "nis": "242507016",
    "name": "Muhamad Ridwan Setiawan",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-15",
    "nisn": "0105906565",
    "nis": "242507017",
    "name": "Muhamad Rizki Minaldi",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-16",
    "nisn": "0116502792",
    "nis": "242507018",
    "name": "Muhammad Zalal",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-17",
    "nisn": "0113947666",
    "nis": "242507020",
    "name": "Nelsa Salsabila",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-18",
    "nisn": "0118586332",
    "nis": "242507021",
    "name": "Niki Budi Fortuna",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-19",
    "nisn": "0114828994",
    "nis": "242507023",
    "name": "Raisa Putri",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-20",
    "nisn": "0124880951",
    "nis": "242507024",
    "name": "Rama Februari Ismail",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-21",
    "nisn": "0114524867",
    "nis": "242507025",
    "name": "Revan Nur Alamsah",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-22",
    "nisn": "0115194734",
    "nis": "242507026",
    "name": "Riyan Hidayat",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-23",
    "nisn": "0126763123",
    "nis": "242507027",
    "name": "Saeful Iqbal",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-24",
    "nisn": "0119795744",
    "nis": "242507028",
    "name": "Sipa Novi Auliya",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-25",
    "nisn": "0115942320",
    "nis": "242507029",
    "name": "Siti Rahmayani",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-26",
    "nisn": "0124052023",
    "nis": "242507030",
    "name": "Sri Mulyani",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9A-27",
    "nisn": "0119471337",
    "nis": "242507031",
    "name": "Tri Juniarti",
    "classId": "9-A",
    "gender": "-"
  },
  {
    "id": "9B-01",
    "nisn": "0124655458",
    "nis": "242507034",
    "name": "Assyifa Ramadani",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-02",
    "nisn": "0116983681",
    "nis": "242507035",
    "name": "Cep Gugun",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-03",
    "nisn": "0112766422",
    "nis": "242507036",
    "name": "Dewi Santi",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-04",
    "nisn": "0113216755",
    "nis": "242507037",
    "name": "Fatiah Roani",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-05",
    "nisn": "0123057602",
    "nis": "242507038",
    "name": "Fiqri Kurniawan",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-06",
    "nisn": "3113045238",
    "nis": "242507039",
    "name": "Hizqil Agung Rosandy",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-07",
    "nisn": "0116715732",
    "nis": "242507040",
    "name": "M Ahid Wahidin",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-08",
    "nisn": "0124603638",
    "nis": "242507041",
    "name": "M. Fahturrohman Sodikin",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-09",
    "nisn": "0113856994",
    "nis": "242507157",
    "name": "M. Rama Albani",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-10",
    "nisn": "3117196529",
    "nis": "242507042",
    "name": "Marsya Natasya",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-11",
    "nisn": "0118735427",
    "nis": "242507158",
    "name": "Maulana Nawawi",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-12",
    "nisn": "0124362408",
    "nis": "242507043",
    "name": "Moch. Rayhan Abdul Azzis",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-13",
    "nisn": "0111847344",
    "nis": "242507044",
    "name": "Muhamad Alyas",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-14",
    "nisn": "0114271320",
    "nis": "242507045",
    "name": "Muhamad Haikal Habsy",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-15",
    "nisn": "0114629180",
    "nis": "242507046",
    "name": "Muhamad Radit",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-16",
    "nisn": "0115286888",
    "nis": "242507047",
    "name": "Muhamad Rizki Ramadan",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-17",
    "nisn": "0122707530",
    "nis": "242507049",
    "name": "Nabila Zalfaa Zain",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-18",
    "nisn": "0115715939",
    "nis": "242507051",
    "name": "Pandi Pratama",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-19",
    "nisn": "0125231501",
    "nis": "242507052",
    "name": "Putri Pebriani Kurniawan",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-20",
    "nisn": "0112684437",
    "nis": "242507159",
    "name": "Rahayu Aditia",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-21",
    "nisn": "0125099267",
    "nis": "242507162",
    "name": "Raisa Mikhayla Putri",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-22",
    "nisn": "0114901125",
    "nis": "242507053",
    "name": "Revan Prayoga Hendrajat Gunadi",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-23",
    "nisn": "0119840982",
    "nis": "242507054",
    "name": "Rezza Rahmat Pratama",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-24",
    "nisn": "0122453049",
    "nis": "242507055",
    "name": "Rima Susanti",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-25",
    "nisn": "0126680207",
    "nis": "262709149",
    "name": "Rizki Muhamad Fauzan",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-26",
    "nisn": "0118830819",
    "nis": "242507056",
    "name": "Rizki Muhamad Yusup",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-27",
    "nisn": "0128403892",
    "nis": "242507057",
    "name": "Saepul Mumin",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-28",
    "nisn": "0126877182",
    "nis": "242507059",
    "name": "Siti Aliska Musdalifah",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9B-29",
    "nisn": "3127138335",
    "nis": "242507060",
    "name": "Siti Sarah Nurohmah",
    "classId": "9-B",
    "gender": "-"
  },
  {
    "id": "9C-01",
    "nisn": "0116330628",
    "nis": "242507062",
    "name": "Adinda Zihan Fahira",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-02",
    "nisn": "0118331699",
    "nis": "242507063",
    "name": "Anugrah Abdurohman",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-03",
    "nisn": "0115860039",
    "nis": "242507064",
    "name": "Aris Adzani",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-04",
    "nisn": "0124369663",
    "nis": "242507065",
    "name": "Dafa Azka Muzaky",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-05",
    "nisn": "0112289316",
    "nis": "242507066",
    "name": "Dina Lusiana",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-06",
    "nisn": "0111583567",
    "nis": "242507067",
    "name": "Fahri Muhamad Rajiil",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-07",
    "nisn": "0124754288",
    "nis": "242507068",
    "name": "Ganesa Marselina",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-08",
    "nisn": "0115408435",
    "nis": "242507069",
    "name": "Herdi Herdianyansah",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-09",
    "nisn": "3125463444",
    "nis": "242507071",
    "name": "M. Fahri Mahesa",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-10",
    "nisn": "0119184990",
    "nis": "242507072",
    "name": "Melani Setiani",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-11",
    "nisn": "0111295418",
    "nis": "242507073",
    "name": "Moch Syahid Nurul Hilmy",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-12",
    "nisn": "0122824275",
    "nis": "242507074",
    "name": "Moch. Sandy Saputra",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-13",
    "nisn": "0111768374",
    "nis": "242507075",
    "name": "Muhamad Hambali Hadiansyah",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-14",
    "nisn": "3110161994",
    "nis": "242507076",
    "name": "Muhamad Reza",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-15",
    "nisn": "0118508712",
    "nis": "242507077",
    "name": "Muhamad Vidli Maulana",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-16",
    "nisn": "0119207867",
    "nis": "242507078",
    "name": "Muhammad Arya Maulana",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-17",
    "nisn": "0123413954",
    "nis": "242507079",
    "name": "Neng Ulpi",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-18",
    "nisn": "0117436906",
    "nis": "242507080",
    "name": "Nurul Nadhiif",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-19",
    "nisn": "0115892784",
    "nis": "242507081",
    "name": "Qisti Nurul Afikah",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-20",
    "nisn": "0122517368",
    "nis": "242507082",
    "name": "R. Aprilio Rahayu S",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-21",
    "nisn": "0115164171",
    "nis": "242507083",
    "name": "Reza Nurdiansyah",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-22",
    "nisn": "0123319868",
    "nis": "242507084",
    "name": "Ridwan Pratana Setiawan",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-23",
    "nisn": "0124164804",
    "nis": "242507085",
    "name": "Riyanti Jamilah",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-24",
    "nisn": "0119989707",
    "nis": "242507086",
    "name": "Roby Asegaf Hermawan",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-25",
    "nisn": "0128426207",
    "nis": "242507087",
    "name": "Septian Muhamad Taupik",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-26",
    "nisn": "3122298306",
    "nis": "242507088",
    "name": "Siti Asmaul Husna",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-27",
    "nisn": "0125727166",
    "nis": "242507154",
    "name": "Siti Kiara Paujiah",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-28",
    "nisn": "0116683186",
    "nis": "242507090",
    "name": "Siva",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9C-29",
    "nisn": "0122284455",
    "nis": "242507089",
    "name": "Sri Endang Rahayu",
    "classId": "9-C",
    "gender": "-"
  },
  {
    "id": "9D-01",
    "nisn": "0122177833",
    "nis": "242507093",
    "name": "Alvia Nur Holilah",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-02",
    "nisn": "0123487780",
    "nis": "242507094",
    "name": "Bilal Fattur Rahman",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-03",
    "nisn": "0123378419",
    "nis": "242507095",
    "name": "Davit Hardiansyah",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-04",
    "nisn": "0126206701",
    "nis": "242507096",
    "name": "Elsa Fitri Yani",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-05",
    "nisn": "3117420371",
    "nis": "242507097",
    "name": "Fikri Aldiansyah",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-06",
    "nisn": "0118718618",
    "nis": "242507098",
    "name": "Ihwan Baharudin Zulfikar",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-07",
    "nisn": "3110360931",
    "nis": "242507099",
    "name": "Keysha Nabila Zahran",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-08",
    "nisn": "0128026889",
    "nis": "242507100",
    "name": "M Dipa Ripana",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-09",
    "nisn": "0129677031",
    "nis": "242507101",
    "name": "M. Iqbal Rizki Pratama",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-10",
    "nisn": "3113967098",
    "nis": "242507122",
    "name": "Mohamad Nur Hasan",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-11",
    "nisn": "0113924003",
    "nis": "242507102",
    "name": "Muhamad Agung Anugrah",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-12",
    "nisn": "0119130300",
    "nis": "242507104",
    "name": "Muhamad Iksan Saepul",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-13",
    "nisn": "0116646929",
    "nis": "242507105",
    "name": "Muhamad Rifki Saputra",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-14",
    "nisn": "0115990028",
    "nis": "242507106",
    "name": "Muhamad Zulpi Apriansiah",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-15",
    "nisn": "0113969463",
    "nis": "242507107",
    "name": "Muhammad Ilham Harahap",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-16",
    "nisn": "0122252897",
    "nis": "242507108",
    "name": "Nasya Yan Jamilah",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-17",
    "nisn": "0115812491",
    "nis": "242507109",
    "name": "Nurul Siti Marwah",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-18",
    "nisn": "0125790133",
    "nis": "242507111",
    "name": "Queenera Ellya Yusup",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-19",
    "nisn": "0117181152",
    "nis": "242507112",
    "name": "Radit Kasela",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-20",
    "nisn": "0117407359",
    "nis": "242507113",
    "name": "Repan",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-21",
    "nisn": "0115893187",
    "nis": "242507114",
    "name": "Rezky Aditya Ramadhan",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-22",
    "nisn": "0113555904",
    "nis": "252608154",
    "name": "Rubi Agnes Alya",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-23",
    "nisn": "0115473057",
    "nis": "242507116",
    "name": "Salsa Bila",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-24",
    "nisn": "3124149103",
    "nis": "242507117",
    "name": "Siti Fahira",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-25",
    "nisn": "0113355338",
    "nis": "242507118",
    "name": "Siti Hapsah Sania",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-26",
    "nisn": "0121202460",
    "nis": "242507119",
    "name": "Sonia Febriyanti",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-27",
    "nisn": "0128531008",
    "nis": "242507156",
    "name": "Susan Aulia Putri",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9D-28",
    "nisn": "3126592068",
    "nis": "242507121",
    "name": "Yusril Akbar Almugni",
    "classId": "9-D",
    "gender": "-"
  },
  {
    "id": "9E-01",
    "nisn": "0116866827",
    "nis": "242507123",
    "name": "Aditia Alip Putra",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-02",
    "nisn": "0122666382",
    "nis": "242507155",
    "name": "Afika Nurhaliza Solihat",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-03",
    "nisn": "0123239996",
    "nis": "242507124",
    "name": "Caci Cahyadi",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-04",
    "nisn": "3125143987",
    "nis": "242507125",
    "name": "Ceni Pebi Ariyanti",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-05",
    "nisn": "0106485834",
    "nis": "232407088",
    "name": "Eka Oktopiani",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-06",
    "nisn": "0128820933",
    "nis": "242507128",
    "name": "Fatimah Azzahra",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-07",
    "nisn": "0128637603",
    "nis": "242507129",
    "name": "Haikal Maula Ibrahim",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-08",
    "nisn": "0112417327",
    "nis": "242507130",
    "name": "Indra Prasetya",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-09",
    "nisn": "3126310440",
    "nis": "242507131",
    "name": "Lisna Nuri Novianti",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-10",
    "nisn": "0124445442",
    "nis": "242507132",
    "name": "M Ridwan",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-11",
    "nisn": "0116061916",
    "nis": "242507133",
    "name": "M. Ramdan Alfajri",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-12",
    "nisn": "0126300554",
    "nis": "242507134",
    "name": "Muhamad Arif Maulana",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-13",
    "nisn": "0115048265",
    "nis": "242507135",
    "name": "Muhamad Fahmi Fahrizi",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-14",
    "nisn": "0119968359",
    "nis": "242507136",
    "name": "Muhamad Ilham Baharudin",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-15",
    "nisn": "0123910022",
    "nis": "242507137",
    "name": "Muhamad Rizki Apriansyah",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-16",
    "nisn": "0114092130",
    "nis": "242507138",
    "name": "Muhammad Rizal Al-Lutfi",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-17",
    "nisn": "0116004076",
    "nis": "242507139",
    "name": "Nabila Riyanti",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-18",
    "nisn": "0125566081",
    "nis": "242507140",
    "name": "Nazwa Diaz Aulia",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-19",
    "nisn": "0125362508",
    "nis": "242507141",
    "name": "Nur Alief Rizqy Ramadhan",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-20",
    "nisn": "3124112537",
    "nis": "242507142",
    "name": "Putri Taksi Heriyanti",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-21",
    "nisn": "0128713546",
    "nis": "242507143",
    "name": "Rd. Feriska Putri Lemina Sujana",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-22",
    "nisn": "0108847380",
    "nis": "242507144",
    "name": "Rendi Maolana",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-23",
    "nisn": "0115612808",
    "nis": "242507146",
    "name": "Rijal Maulana",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-24",
    "nisn": "0112391672",
    "nis": "242507147",
    "name": "Saeful Ibrahim",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-25",
    "nisn": "0111099275",
    "nis": "242507148",
    "name": "Salsabila Ramadani Saeputri",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-26",
    "nisn": "0116964265",
    "nis": "242507149",
    "name": "Siti Nurhalifah",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-27",
    "nisn": "0123403065",
    "nis": "242507150",
    "name": "Sopiyatul Muniroh",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-28",
    "nisn": "0123767794",
    "nis": "242507151",
    "name": "Tiara",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-29",
    "nisn": "0112658620",
    "nis": "242507152",
    "name": "Zahra Ainunnissa",
    "classId": "9-E",
    "gender": "-"
  },
  {
    "id": "9E-30",
    "nisn": "0111008183",
    "nis": "242507153",
    "name": "Zaqia Nurohman",
    "classId": "9-E",
    "gender": "-"
  }
];

// Official Teacher Accounts SMP Negeri 3 Cihampelas (Roster Resmi)
export const OFFICIAL_TEACHERS: TeacherUser[] = [
  {
    nip: '19720412 199703 1 002',
    name: 'Rohidin, S.Pd.',
    role: 'both',
    subject: 'Bahasa Inggris',
    classes: ['7-A', '7-B', '8-A', '9-A']
  },
  {
    nip: '19680315 199412 2 001',
    name: 'Dedeh Komalasari, S.Pd.',
    role: 'mapel',
    subject: 'Ilmu Pengetahuan Alam (IPA)',
    classes: ['7-A', '7-B', '7-C', '8-A']
  },
  {
    nip: '19710825 199601 1 001',
    name: 'E. Hamdani, S.Pd., M.M.Pd.',
    role: 'mapel',
    subject: 'PJOK',
    classes: ['7-A', '7-B', '8-A']
  },
  {
    nip: '19730514 199802 2 003',
    name: 'Dian Nuryati, SP., MM',
    role: 'mapel',
    subject: 'Ilmu Pengetahuan Sosial (IPS)',
    classes: ['7-B', '7-D', '8-A']
  },
  {
    nip: '19790820 200604 2 015',
    name: 'Rachmi Fatwalia, S.Pd.',
    role: 'mapel',
    subject: 'Bahasa Inggris',
    classes: ['7-C', '7-E', '9-B']
  },
  {
    nip: '19691110 199503 1 002',
    name: 'H. Osad, M.Pd.I',
    role: 'both',
    subject: 'Pendidikan Agama Islam (PABP)',
    classes: ['7-A', '7-F', '8-B']
  },
  {
    nip: '19750918 200003 2 002',
    name: 'Nunik Wahyuni, S.Pd.',
    role: 'both',
    subject: 'Bahasa Indonesia',
    classes: ['7-A', '7-D', '8-B']
  },
  {
    nip: '19780622 200701 2 009',
    name: 'N. Euis Kurnia, S.Pd.',
    role: 'mapel',
    subject: 'Bahasa Indonesia',
    classes: ['7-E', '7-F', '8-C']
  },
  {
    nip: '19860415 201101 2 014',
    name: 'Rifayanti Maulani, S.Pd.',
    role: 'mapel',
    subject: 'PPKn',
    classes: ['7-A', '7-B', '8-C']
  },
  {
    nip: '19850210 200902 2 008',
    name: 'Yulia M. Ahmad, S.Pd.',
    role: 'mapel',
    subject: 'Matematika',
    classes: ['7-A', '7-B', '8-A', '8-C']
  },
  {
    nip: '19840812 201001 1 015',
    name: 'Yepy Agus R, S.IP., M.Pd.',
    role: 'both',
    subject: 'PPKn',
    classes: ['7-C', '7-D', '8-D']
  },
  {
    nip: '19870105 201201 1 007',
    name: 'Dudi Yusup, S.Pd.',
    role: 'mapel',
    subject: 'Seni Budaya (SBK)',
    classes: ['7-A', '7-B', '8-A']
  },
  {
    nip: '19880520 201402 1 006',
    name: 'Gugun Gunawan, S.Pd.',
    role: 'mapel',
    subject: 'PJOK',
    classes: ['7-C', '7-D', '8-B']
  },
  {
    nip: '19900318 201503 2 009',
    name: 'Nursifa Fauziah, S.Pd.',
    role: 'mapel',
    subject: 'Ilmu Pengetahuan Alam (IPA)',
    classes: ['7-D', '7-E', '8-B']
  },
  {
    nip: '19910712 201601 2 011',
    name: 'Krisna Lestari, S.Pd.',
    role: 'mapel',
    subject: 'Seni Budaya (SBK)',
    classes: ['7-C', '7-D', '8-B']
  },
  {
    nip: '19820925 200801 2 013',
    name: 'Wiwin S, S.Pd.I., M.Pd.',
    role: 'mapel',
    subject: 'PABP & Bahasa Sunda',
    classes: ['7-A', '7-B', '8-A']
  },
  {
    nip: '19890422 201502 2 010',
    name: 'Cincin Cintawati, S.Pd.',
    role: 'mapel',
    subject: 'Ilmu Pengetahuan Alam (IPA)',
    classes: ['7-C', '7-F', '8-C']
  },
  {
    nip: '19830614 200901 1 012',
    name: 'Budiyanto, S.Pd.',
    role: 'mapel',
    subject: 'Matematika',
    classes: ['7-C', '7-D', '8-B']
  },
  {
    nip: '19920208 201701 1 008',
    name: 'Muhammad Ahiq T, S.Pd.',
    role: 'mapel',
    subject: 'Ilmu Pengetahuan Sosial (IPS)',
    classes: ['7-A', '7-C', '8-C']
  },
  {
    nip: '19930816 201802 2 007',
    name: 'Riski Ismawarni M, S.Pd.',
    role: 'mapel',
    subject: 'Bahasa Indonesia',
    classes: ['7-B', '7-C', '8-A']
  },
  {
    nip: '19901124 201602 2 012',
    name: 'Siti Nurjanah, S.Pd.',
    role: 'mapel',
    subject: 'Bahasa Inggris',
    classes: ['7-D', '7-F', '8-D']
  },
  {
    nip: '19881205 201403 2 008',
    name: 'Tina A. Rosdiana, S.Pd.I',
    role: 'mapel',
    subject: 'Pendidikan Agama Islam (PABP)',
    classes: ['7-C', '7-D', '8-C']
  },
  {
    nip: '19940618 201902 2 009',
    name: 'Sonia Winjuni L, S.Pd.',
    role: 'mapel',
    subject: 'Matematika',
    classes: ['7-E', '7-F', '8-D']
  },
  {
    nip: '19921014 201801 2 011',
    name: 'Elis Siti Sa\'adah, S.Pd.',
    role: 'mapel',
    subject: 'Bahasa Sunda',
    classes: ['7-C', '7-D', '8-B']
  },
  {
    nip: '19950522 202001 2 015',
    name: 'Nira Destriyani, S.Pd.',
    role: 'mapel',
    subject: 'Bimbingan & Konseling (BK)',
    classes: ['7-A', '7-B', '8-A']
  },
  {
    nip: '19930115 201903 1 008',
    name: 'Ichsanul Arifin, S.Kom.',
    role: 'mapel',
    subject: 'Informatika',
    classes: ['7-A', '7-B', '8-A', '9-A']
  },
  {
    nip: '19910408 201603 1 010',
    name: 'Dani Ramdani, S.Pd.',
    role: 'mapel',
    subject: 'Bahasa Indonesia',
    classes: ['7-A', '7-D', '8-D']
  },
  {
    nip: '19700608 199802 1 001',
    name: 'H. Rustandi, S.Pd., M.Pd.',
    role: 'both',
    subject: 'Manajemen Pendidikan',
    classes: ['7-A', '8-A', '9-A']
  }
];

export const DEMO_TEACHERS: TeacherUser[] = OFFICIAL_TEACHERS;

export const DEMO_STUDENT: StudentUser = {
  nisn: '0133138158',
  name: 'Abdul Hanan',
  classId: '7-A'
};

// Initial Mock Attendance State for Today
export const GET_INITIAL_ATTENDANCE = (): Record<string, ClassSessionAttendance> => {
  const today = new Date().toISOString().split('T')[0];
  return {
    '7-A': {
      classId: '7-A',
      date: today,
      subject: 'Ilmu Pengetahuan Alam (IPA)',
      teacherName: 'Dedeh Komalasari, S.Pd.',
      teacherNip: '19680315 199412 2 001',
      isSubmitted: true,
      submittedAt: '07:22 WIB',
      records: {
        '7A-01': 'H',
        '7A-02': 'H',
        '7A-03': 'S',
        '7A-04': 'H',
        '7A-05': 'H',
        '7A-06': 'H',
        '7A-07': 'I',
        '7A-08': 'H',
      },
      notes: {
        '7A-03': 'Surat dokter dititip ke satpam',
        '7A-07': 'Ada acara keluarga'
      }
    }
  };
};

const STORAGE_KEY = 'spentic_elearning_attendance_v2';

export function getStoredAttendance(): Record<string, ClassSessionAttendance> {
  if (typeof window === 'undefined') return GET_INITIAL_ATTENDANCE();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = GET_INITIAL_ATTENDANCE();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading attendance from localStorage', e);
    return GET_INITIAL_ATTENDANCE();
  }
}

export function saveStoredAttendance(data: Record<string, ClassSessionAttendance>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('elearningAttendanceUpdated'));
  } catch (e) {
    console.error('Failed saving attendance to localStorage', e);
  }
}

export interface SubjectSession {
  id: string;
  classId: string;
  date: string;
  subject: string;
  teacherName: string;
  teacherNip: string;
  submittedAt: string;
  records: Record<string, AttendanceStatus>;
  notes?: Record<string, string>;
}

export const GET_INITIAL_SESSIONS = (): SubjectSession[] => {
  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];
  const dayIndex = todayDate.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

  let sessions: SubjectSession[] = [];
  
  // Real schedule logic for Class 7-A (Siang) based on the provided PDF
  if (dayIndex === 1) { // SENIN
    sessions.push(
      { id: `${todayStr}_7-A_MTK`, classId: '7-A', date: todayStr, subject: 'Matematika', teacherName: 'Sonia Winjuni I, S.Pd.', teacherNip: '-', submittedAt: '07:20 WIB', records: { '7A-01': 'H' } },
      { id: `${todayStr}_7-A_INF`, classId: '7-A', date: todayStr, subject: 'Prakarya / Informatika', teacherName: 'Ichsanul Arifin, S.Kom', teacherNip: '-', submittedAt: '10:00 WIB', records: { '7A-01': 'H' } },
      { id: `${todayStr}_7-A_PABP`, classId: '7-A', date: todayStr, subject: 'Pendidikan Agama Islam', teacherName: 'Tina A. Rosdiana, S.Pd.I', teacherNip: '-', submittedAt: '13:00 WIB', records: { '7A-01': 'H' } }
    );
  } else if (dayIndex === 2) { // SELASA
    sessions.push(
      { id: `${todayStr}_7-A_BINDO`, classId: '7-A', date: todayStr, subject: 'Bahasa Indonesia', teacherName: 'Riski Ismawarni M, S.Pd.', teacherNip: '-', submittedAt: '07:30 WIB', records: { '7A-01': 'H' } },
      { id: `${todayStr}_7-A_IPA`, classId: '7-A', date: todayStr, subject: 'Ilmu Pengetahuan Alam (IPA)', teacherName: 'Cincin Cintawati, S.Pd.', teacherNip: '-', submittedAt: '09:00 WIB', records: { '7A-01': 'H' } },
      { id: `${todayStr}_7-A_BING`, classId: '7-A', date: todayStr, subject: 'Bahasa Inggris', teacherName: 'Siti Nurjanah, S.Pd.', teacherNip: '-', submittedAt: '11:00 WIB', records: { '7A-01': 'H' } }
    );
  } else if (dayIndex === 3) { // RABU
    sessions.push(
      { id: `${todayStr}_7-A_IPA`, classId: '7-A', date: todayStr, subject: 'Ilmu Pengetahuan Alam (IPA)', teacherName: 'Cincin Cintawati, S.Pd.', teacherNip: '-', submittedAt: '07:30 WIB', records: { '7A-01': 'H' } },
      { id: `${todayStr}_7-A_BINDO`, classId: '7-A', date: todayStr, subject: 'Bahasa Indonesia', teacherName: 'Riski Ismawarni M, S.Pd.', teacherNip: '-', submittedAt: '09:00 WIB', records: { '7A-01': 'H' } },
      { id: `${todayStr}_7-A_IPS`, classId: '7-A', date: todayStr, subject: 'Ilmu Pengetahuan Sosial (IPS)', teacherName: 'Muhammad Ahiq T, S.Pd.', teacherNip: '-', submittedAt: '11:00 WIB', records: { '7A-01': 'H' } }
    );
  } else if (dayIndex === 4) { // KAMIS
    sessions.push(
      { id: `${todayStr}_7-A_SUNDA`, classId: '7-A', date: todayStr, subject: 'Bahasa Sunda', teacherName: "Elis Siti Sa'adah, S.Pd.", teacherNip: '-', submittedAt: '07:30 WIB', records: { '7A-01': 'H' } },
      { id: `${todayStr}_7-A_BING`, classId: '7-A', date: todayStr, subject: 'Bahasa Inggris', teacherName: 'Siti Nurjanah, S.Pd.', teacherNip: '-', submittedAt: '09:00 WIB', records: { '7A-01': 'H' } },
      { id: `${todayStr}_7-A_SBK`, classId: '7-A', date: todayStr, subject: 'Seni Budaya (SBK)', teacherName: 'Dudi Yusup, S.Pd.', teacherNip: '-', submittedAt: '11:00 WIB', records: { '7A-01': 'H' } }
    );
  } else if (dayIndex === 5) { // JUM'AT
    sessions.push(
      { id: `${todayStr}_7-A_BTQ`, classId: '7-A', date: todayStr, subject: 'Pembiasaan BTQ / Literasi', teacherName: 'Wali Kelas', teacherNip: '-', submittedAt: '06:30 WIB', records: { '7A-01': 'H' } },
      { id: `${todayStr}_7-A_IPS`, classId: '7-A', date: todayStr, subject: 'Ilmu Pengetahuan Sosial (IPS)', teacherName: 'Muhammad Ahiq T, S.Pd.', teacherNip: '-', submittedAt: '08:00 WIB', records: { '7A-01': 'H' } },
      { id: `${todayStr}_7-A_PKN`, classId: '7-A', date: todayStr, subject: 'Pend. Jasmani (PJOK)', teacherName: 'E. Hamdani, S.Pd, M.M.Pd', teacherNip: '-', submittedAt: '10:00 WIB', records: { '7A-01': 'H' } }
    );
  } else {
    // Weekend fallback
    sessions.push(
      { id: `${todayStr}_7-A_EKSKUL`, classId: '7-A', date: todayStr, subject: 'Ekstrakurikuler Pramuka', teacherName: 'Pembina Pramuka', teacherNip: '-', submittedAt: '08:00 WIB', records: { '7A-01': 'H' } }
    );
  }
  
  return sessions;
};

const SESSIONS_STORAGE_KEY = 'spentic_elearning_subject_sessions_v1';

export function getStoredSessions(dateFilter?: string): SubjectSession[] {
  if (typeof window === 'undefined') return GET_INITIAL_SESSIONS();
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) {
      const initial = GET_INITIAL_SESSIONS();
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(initial));
      return dateFilter ? initial.filter(s => s.date === dateFilter) : initial;
    }
    const list: SubjectSession[] = JSON.parse(raw);
    return dateFilter ? list.filter(s => s.date === dateFilter) : list;
  } catch (e) {
    console.error('Failed reading sessions from localStorage', e);
    return GET_INITIAL_SESSIONS();
  }
}

export function saveSubjectSession(session: SubjectSession) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    let list: SubjectSession[] = raw ? JSON.parse(raw) : GET_INITIAL_SESSIONS();
    const idx = list.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      list[idx] = session;
    } else {
      list.push(session);
    }
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('elearningSessionsUpdated'));
  } catch (e) {
    console.error('Failed saving session to localStorage', e);
  }
}

const STUDENTS_STORAGE_KEY = 'spentic_elearning_students_v2';

export function getStoredStudents(): Student[] {
  if (typeof window === 'undefined') return INITIAL_STUDENTS;
  try {
    const raw = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_STUDENTS;
  } catch (e) {
    console.error('Failed reading students from localStorage', e);
    return INITIAL_STUDENTS;
  }
}

export function saveStoredStudents(students: Student[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
    window.dispatchEvent(new Event('elearningStudentsUpdated'));
  } catch (e) {
    console.error('Failed saving students to localStorage', e);
  }
}

import { safeSaveSubmissions } from './elearningStorage';

// -------------------------------------------------------------
// ASSIGNMENTS & HOMEWORK (TUGAS & PR ELEANING)
// -------------------------------------------------------------
export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-ipa-7a-1',
    title: 'Tugas Pengamatan Struktur Sel Bawang & Sel Pipi',
    subject: 'Ilmu Pengetahuan Alam (IPA)',
    teacherName: 'Dedeh Komalasari, S.Pd.',
    teacherNip: '19680315 199412 2 001',
    targetClass: '7-A',
    dueDate: '2026-10-10',
    description: 'Lakukan pengamatan perbedaan bentuk sel bawang merah dan sel epitel pipi manusia sesuai panduan Buku Paket IPA Bab 1. Simak video praktikum, kerjakan kuis pemahaman, dan kumpulkan laporan pengamatan Anda.',
    allowUpload: true,
    createdAt: '2026-10-01',
    materialUrl: 'https://example.com/Panduan_Praktikum_Mikroskop_Sel.pdf',
    materialName: 'Panduan_Praktikum_Mikroskop_Sel.pdf',
    videoUrl: 'https://www.youtube.com/watch?v=URUJD5NEXC8',
    videoTitle: 'Video Panduan Mikroskop & Struktur Sel Tumbuhan',
    quizQuestions: [
      {
        id: 'q-ipa-1',
        question: 'Bagian sel tumbuhan yang berfungsi memberi bentuk kaku dan perlindungan luar adalah...',
        options: ['A. Membran sel', 'B. Dinding sel', 'C. Sitoplasma', 'D. Vakuola'],
        correctOptionIndex: 1,
        explanation: 'Dinding sel yang tersusun dari selulosa memberikan struktur kokoh dan kaku pada tumbuhan.'
      },
      {
        id: 'q-ipa-2',
        question: 'Organel sel yang berperan sebagai pusat pengendali seluruh aktivitas sel adalah...',
        options: ['A. Mitokondria', 'B. Nukleus (Inti Sel)', 'C. Ribosom', 'D. Kloroplas'],
        correctOptionIndex: 1,
        explanation: 'Nukleus atau inti sel mengontrol seluruh proses metabolisme dan membawa materi genetik.'
      },
      {
        id: 'q-ipa-3',
        question: 'Zat warna hijau daun yang berfungsi menyerap cahaya matahari pada fotosintesis adalah...',
        options: ['A. Karotenoid', 'B. Klorofil', 'C. Antosianin', 'D. Melanin'],
        correctOptionIndex: 1,
        explanation: 'Klorofil terdapat di dalam kloroplas untuk menangkap energi foton matahari.'
      }
    ]
  },
  {
    id: 'asg-mtk-7a-1',
    title: 'Latihan Soal Operasi Hitung Bentuk Aljabar',
    subject: 'Matematika',
    teacherName: 'Yulia M. Ahmad, S.Pd.',
    teacherNip: '19850210 200902 2 008',
    targetClass: '7-A',
    dueDate: '2026-10-12',
    description: 'Pelajari video tutorial pemfaktoran aljabar di bawah, kerjakan kuis online 3 soal, lalu foto lembar catatan latihan nomor 1 sampai 5 di buku tulis Anda.',
    allowUpload: true,
    createdAt: '2026-10-02',
    materialUrl: 'https://example.com/Rangkuman_Rumus_Aljabar_Bab3.pdf',
    materialName: 'Rangkuman_Rumus_Aljabar_Bab3.pdf',
    videoUrl: 'https://www.youtube.com/watch?v=NybHckSEQBI',
    videoTitle: 'Tutorial Pemfaktoran Aljabar Mudah & Cepat',
    quizQuestions: [
      {
        id: 'q-mtk-1',
        question: 'Bentuk sederhana dari operasi aljabar 3x + 5y - x + 2y adalah...',
        options: ['A. 2x + 7y', 'B. 4x + 7y', 'C. 2x + 3y', 'D. 3x + 7y'],
        correctOptionIndex: 0,
        explanation: '(3x - x) + (5y + 2y) = 2x + 7y.'
      },
      {
        id: 'q-mtk-2',
        question: 'Koefisien dari variabel x pada bentuk aljabar 5x² - 7x + 9 adalah...',
        options: ['A. 5', 'B. -7', 'C. 7', 'D. 9'],
        correctOptionIndex: 1,
        explanation: 'Angka di depan variabel x berpangkat satu adalah -7.'
      },
      {
        id: 'q-mtk-3',
        question: 'Jika x = 3 dan y = 2, maka nilai dari 2x + 3y adalah...',
        options: ['A. 10', 'B. 12', 'C. 15', 'D. 18'],
        correctOptionIndex: 1,
        explanation: '2(3) + 3(2) = 6 + 6 = 12.'
      }
    ]
  },
  {
    id: 'asg-ing-7a-1',
    title: 'Project: Self-Introduction & Daily Routine Video',
    subject: 'Bahasa Inggris',
    teacherName: 'Rohidin, S.Pd.',
    teacherNip: '19720412 199703 1 002',
    targetClass: '7-A',
    dueDate: '2026-10-14',
    description: 'Watch the English lesson video below, take the 3-question grammar quiz, and record a short speaking video about your daily routine (1-2 minutes).',
    allowUpload: true,
    createdAt: '2026-10-03',
    materialUrl: 'https://example.com/Vocabulary_List_Daily_Routines.pdf',
    materialName: 'Vocabulary_List_Daily_Routines.pdf',
    videoUrl: 'https://www.youtube.com/watch?v=tiXtwF1d4i4',
    videoTitle: 'Daily Routines Speaking & Grammar Explanation',
    quizQuestions: [
      {
        id: 'q-ing-1',
        question: 'Complete the sentence: "She always ___ up at 05.00 AM every morning."',
        options: ['A. wake', 'B. wakes', 'C. waking', 'D. waked'],
        correctOptionIndex: 1,
        explanation: 'Third-person singular (she/he/it) takes verb + -s/-es in Simple Present Tense.'
      },
      {
        id: 'q-ing-2',
        question: 'Choose the correct form: "They ___ soccer in the school field every Friday."',
        options: ['A. plays', 'B. play', 'C. playing', 'D. played'],
        correctOptionIndex: 1,
        explanation: 'Subject "They" uses bare infinitive "play".'
      },
      {
        id: 'q-ing-3',
        question: 'Which of the following is an adverb of frequency?',
        options: ['A. Quickly', 'B. Usually', 'C. Tomorrow', 'D. Loudly'],
        correctOptionIndex: 1,
        explanation: '"Usually", "always", "sometimes", and "never" are adverbs of frequency.'
      }
    ]
  },
  {
    id: 'asg-pabp-7a-1',
    title: 'Refleksi Nilai Akhlak Terpuji & Kuis Doa Harian',
    subject: 'Pendidikan Agama Islam (PABP)',
    teacherName: 'Dra. Hj. Wiwin Winarni',
    teacherNip: '19671107 199802 2 001',
    targetClass: '7-A',
    dueDate: '2026-10-15',
    description: 'Simak tayangan video adab dan akhlak mulia berikut, selesaikan kuis pemahaman doa harian, lalu unggah foto lembar rangkuman catatan adab kepada orang tua dan guru.',
    allowUpload: true,
    createdAt: '2026-10-03',
    materialUrl: 'https://example.com/Bahan_Ajar_PABP_Adab_Siswa.pdf',
    materialName: 'Bahan_Ajar_PABP_Adab_Siswa.pdf',
    videoUrl: 'https://www.youtube.com/watch?v=d_k8c9pX_wI',
    videoTitle: 'Kajian Adab: Akhlak Mulia Kepada Orang Tua & Guru',
    quizQuestions: [
      {
        id: 'q-pabp-1',
        question: 'Sifat terpuji yang mencerminkan keselarasan antara perkataan dan perbuatan yang benar disebut...',
        options: ['A. Amanah', 'B. Shiddiq (Jujur)', 'C. Fathanah', 'D. Tabligh'],
        correctOptionIndex: 1,
        explanation: 'Shiddiq berarti benar atau jujur baik dalam niat, lisan, maupun perbuatan.'
      },
      {
        id: 'q-pabp-2',
        question: 'Doa sebelum belajar dibaca oleh seorang penuntut ilmu dengan tujuan agar...',
        options: ['A. Cepat selesai membaca', 'B. Diberi kemudahan dan keberkahan pemahaman ilmu', 'C. Mendapatkan pujian teman', 'D. Terbebas dari tugas guru'],
        correctOptionIndex: 1,
        explanation: 'Doa belajar memohon pertolongan Allah agar ilmu yang dipelajari bermanfaat dan mudah dipahami.'
      },
      {
        id: 'q-pabp-3',
        question: 'Salah satu pengamalan sikap birrul walidain (berbakti kepada orang tua) di rumah adalah...',
        options: ['A. Menolak saat dimintai tolong', 'B. Berbicara santun dan menaati nasihat kebaikan', 'C. Bersuara lebih keras dari orang tua', 'D. Menunda-nunda perintah shalat'],
        correctOptionIndex: 1,
        explanation: 'Berbicara sopan, lembut, dan tawadhu adalah wujud bakti kepada kedua orang tua.'
      }
    ]
  },
  {
    id: 'asg-sunda-7a-1',
    title: 'Pangajaran Paguneman & Tatakrama Basa Sunda',
    subject: 'Bahasa Sunda',
    teacherName: 'Dra. Hj. Wiwin Winarni',
    teacherNip: '19671107 199802 2 001',
    targetClass: '7-A',
    dueDate: '2026-10-16',
    description: 'Regepkeun video conto paguneman dina basa Sunda lemes di handap, jawab kuis tatakrama basa, sarta seratkeun hiji paguneman pondok di buku catetan.',
    allowUpload: true,
    createdAt: '2026-10-03',
    materialUrl: 'https://example.com/Modul_Tatakrama_Basa_Sunda_SMP.pdf',
    materialName: 'Modul_Tatakrama_Basa_Sunda_SMP.pdf',
    videoUrl: 'https://www.youtube.com/watch?v=sundaPaguneman',
    videoTitle: 'Conto Paguneman & Ragam Basa Lemes di Sakola',
    quizQuestions: [
      {
        id: 'q-sunda-1',
        question: 'Ragam basa Sunda anu luyu digunakeun nalika nyarios ka saluhureun (sapertos ka guru/sepuh) nyaeta...',
        options: ['A. Basa loma', 'B. Basa lemes / hormat', 'C. Basa garihal', 'D. Basa kasar'],
        correctOptionIndex: 1,
        explanation: 'Basa lemes hormat ka batur dianggo pikeun ngajenan jalma anu saluhureun.'
      },
      {
        id: 'q-sunda-2',
        question: 'Kecap lemes keur diri sorangan tina kecap "dahar" nyaeta...',
        options: ['A. Neda', 'B. Tuang', 'C. Nyatu', 'D. Lebok'],
        correctOptionIndex: 0,
        explanation: 'Keur diri sorangan nganggo "neda", sedengkeun pikeun batur saluhureun nganggo "tuang".'
      },
      {
        id: 'q-sunda-3',
        question: 'Dina istilah pancakaki Sunda, sebutan pikeun anakna anak urang nyaeta...',
        options: ['A. Buyut', 'B. Incu', 'C. Bao', 'D. Jangga wareng'],
        correctOptionIndex: 1,
        explanation: 'Rundayan kulawarga: Indung/Bapa ➔ Anak ➔ Incu ➔ Buyut ➔ Bao.'
      }
    ]
  },
  {
    id: 'asg-inf-7a-1',
    title: 'Pengenalan Perangkat Keras Komputer & Logika Komputasi',
    subject: 'Informatika',
    teacherName: 'Ichsanul Arifin, S.Kom.',
    teacherNip: '19930115 201903 1 008',
    targetClass: '7-A',
    dueDate: '2026-10-17',
    description: 'Saksikan video penjelasan arsitektur komputer (CPU, RAM, Storage), selesaikan kuis interaktif Informatika, dan buat tabel fungsi komponen komputer.',
    allowUpload: true,
    createdAt: '2026-10-03',
    materialUrl: 'https://example.com/Bahan_Ajar_Informatika_Kelas7.pdf',
    materialName: 'Bahan_Ajar_Informatika_Kelas7.pdf',
    videoUrl: 'https://www.youtube.com/watch?v=AkFi90lZmXA',
    videoTitle: 'How Computers Work: CPU, Memory, and Storage Overview',
    quizQuestions: [
      {
        id: 'q-inf-1',
        question: 'Perangkat keras yang sering disebut sebagai "otak" komputer untuk memproses instruksi adalah...',
        options: ['A. RAM', 'B. CPU (Central Processing Unit)', 'C. Hard Disk', 'D. Power Supply'],
        correctOptionIndex: 1,
        explanation: 'CPU bertugas mengeksekusi instruksi aritmatika dan logika dalam sistem komputer.'
      },
      {
        id: 'q-inf-2',
        question: 'Jenis memori komputer yang bersifat volatile (data hilang saat listrik mati) adalah...',
        options: ['A. ROM', 'B. RAM (Random Access Memory)', 'C. SSD', 'D. Flashdisk'],
        correctOptionIndex: 1,
        explanation: 'RAM menyimpan data sementara untuk program yang sedang berjalan.'
      },
      {
        id: 'q-inf-3',
        question: 'Manakah dari perangkat berikut yang termasuk perangkat masukan (input device)?',
        options: ['A. Monitor', 'B. Keyboard & Mouse', 'C. Printer', 'D. Speaker'],
        correctOptionIndex: 1,
        explanation: 'Keyboard dan mouse memasukkan sinyal input ke dalam komputer.'
      }
    ]
  }
];

export const INITIAL_SUBMISSIONS: AssignmentSubmission[] = [
  {
    id: 'sub-ipa-abdulhanan',
    assignmentId: 'asg-ipa-7a-1',
    studentId: '7A-01',
    studentName: 'Abdul Hanan',
    studentClass: '7-A',
    submittedAt: '02 Okt 2026, 14:30 WIB',
    fileName: 'Laporan_Pengamatan_Sel_AbdulHanan_7A.pdf',
    fileSize: '1.8 MB',
    answerText: 'Tugas pengamatan sel bawang merah dan sel epitel pipi sudah saya kerjakan lengkap dengan gambar sketsa mikroskop dan tabel perbedaannya.',
    grade: 95,
    quizScore: 100,
    feedback: 'Bagus sekali Abdul! Kuis dapat 100 dan sketsa mikroskopis digambar dengan teliti.',
    status: 'graded'
  },
  {
    id: 'sub-mtk-cantikadewi',
    assignmentId: 'asg-mtk-7a-1',
    studentId: '7A-04',
    studentName: 'Cantika Dewi',
    studentClass: '7-A',
    submittedAt: '02 Okt 2026, 15:10 WIB',
    fileName: 'Latihan_Faktorisasi_Aljabar_Cantika.pdf',
    fileSize: '1.4 MB',
    answerText: 'Langkah pemfaktoran aljabar nomor 1 sampai 5 sudah dikerjakan lengkap dengan langkah pembuktian.',
    grade: 92,
    quizScore: 100,
    feedback: 'Penyelesaian faktorisasi aljabar sangat runut dan kuis aljabar sempurna!',
    status: 'graded'
  },
  {
    id: 'sub-ing-muhammadfarhan',
    assignmentId: 'asg-ing-7a-1',
    studentId: '7A-02',
    studentName: 'Muhammad Farhan',
    studentClass: '7-A',
    submittedAt: '03 Okt 2026, 09:15 WIB',
    fileName: 'Self_Introduction_Daily_Routine_Farhan.mp4',
    fileSize: '14.2 MB',
    fileData: 'https://www.w3schools.com/html/mov_bbb.mp4',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    answerText: 'Good morning Mr. Rohidin, this is my English speaking project about my self-introduction and daily routines at SMP Negeri 3 Cihampelas.',
    quizScore: 100,
    status: 'submitted'
  },
  {
    id: 'sub-ing-alyanurfadilah',
    assignmentId: 'asg-ing-7a-1',
    studentId: '7A-03',
    studentName: 'Alya Nurfadilah',
    studentClass: '7-A',
    submittedAt: '03 Okt 2026, 10:20 WIB',
    fileName: 'English_Worksheet_Daily_Routines_Alya.pdf',
    fileSize: '1.2 MB',
    answerText: 'Here is my written transcript and worksheet for Chapter 2 Daily Activities and Simple Present Tense exercises.',
    grade: 96,
    quizScore: 100,
    feedback: 'Excellent vocabulary and clear sentence structure, Alya! Great job!',
    status: 'graded'
  },
  {
    id: 'sub-pabp-abdulhanan',
    assignmentId: 'asg-pabp-7a-1',
    studentId: '7A-01',
    studentName: 'Abdul Hanan',
    studentClass: '7-A',
    submittedAt: '03 Okt 2026, 11:00 WIB',
    fileName: 'Catatan_Adab_PABP_AbdulHanan.pdf',
    fileSize: '1.1 MB',
    answerText: 'Ibu Wiwin, rangkuman adab kepada orang tua dan guru telah saya tulis di buku catatan PABP beserta doa harian.',
    grade: 98,
    quizScore: 100,
    feedback: 'MashaAllah, tulisan rapi dan pemahaman adab sangat terpuji!',
    status: 'graded'
  }
];

const ASSIGNMENTS_STORAGE_KEY = 'spentic_elearning_assignments_v1';
const SUBMISSIONS_STORAGE_KEY = 'spentic_elearning_submissions_v1';

export function getStoredAssignments(): Assignment[] {
  if (typeof window === 'undefined') return INITIAL_ASSIGNMENTS;
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(INITIAL_ASSIGNMENTS));
      return INITIAL_ASSIGNMENTS;
    }
    const list: Assignment[] = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) {
      localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(INITIAL_ASSIGNMENTS));
      return INITIAL_ASSIGNMENTS;
    }

    // Auto-merge newly added assignments or upgrade missing quizzes/materials
    let hasChanges = false;
    INITIAL_ASSIGNMENTS.forEach(initAsg => {
      const idx = list.findIndex(a => a.id === initAsg.id);
      if (idx < 0) {
        list.push(initAsg);
        hasChanges = true;
      } else if (!list[idx].quizQuestions && initAsg.quizQuestions) {
        list[idx] = {
          ...initAsg,
          ...list[idx],
          materialUrl: list[idx].materialUrl || initAsg.materialUrl,
          materialName: list[idx].materialName || initAsg.materialName,
          videoUrl: list[idx].videoUrl || initAsg.videoUrl,
          videoTitle: list[idx].videoTitle || initAsg.videoTitle,
          quizQuestions: initAsg.quizQuestions
        };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(list));
    }
    return list;
  } catch (e) {
    console.error('Failed reading assignments from localStorage', e);
    return INITIAL_ASSIGNMENTS;
  }
}

export function saveStoredAssignment(assignment: Assignment) {
  if (typeof window === 'undefined') return;
  try {
    const list = getStoredAssignments();
    const idx = list.findIndex(a => a.id === assignment.id);
    if (idx >= 0) {
      list[idx] = assignment;
    } else {
      list.unshift(assignment);
    }
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('elearningAssignmentsUpdated'));
  } catch (e) {
    console.error('Failed saving assignment to localStorage', e);
  }
}

export function deleteStoredAssignment(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const list = getStoredAssignments().filter(a => a.id !== id);
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('elearningAssignmentsUpdated'));
  } catch (e) {
    console.error('Failed deleting assignment from localStorage', e);
  }
}

export function getStoredSubmissions(): AssignmentSubmission[] {
  if (typeof window === 'undefined') return INITIAL_SUBMISSIONS;
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (!raw) {
      safeSaveSubmissions(INITIAL_SUBMISSIONS);
      return INITIAL_SUBMISSIONS;
    }
    const list: AssignmentSubmission[] = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) {
      safeSaveSubmissions(INITIAL_SUBMISSIONS);
      return INITIAL_SUBMISSIONS;
    }

    // Auto-merge initial sample submissions if not yet present
    let hasMissingInitial = false;
    INITIAL_SUBMISSIONS.forEach(initSub => {
      if (!list.some(s => s.id === initSub.id)) {
        list.push(initSub);
        hasMissingInitial = true;
      }
    });

    // Auto-sanitize: if any item from older test has bloated base64, clean it up silently
    let hasBloat = false;
    list.forEach((sub: AssignmentSubmission) => {
      if (sub.fileData && sub.fileData.length > 50000) {
        hasBloat = true;
        sub.fileData = undefined;
      }
    });
    if (hasBloat || hasMissingInitial) {
      safeSaveSubmissions(list);
    }
    return list;
  } catch (e) {
    console.error('Failed reading submissions from localStorage', e);
    return INITIAL_SUBMISSIONS;
  }
}

export function saveStoredSubmission(submission: AssignmentSubmission) {
  if (typeof window === 'undefined') return;
  try {
    const list = getStoredSubmissions();
    const idx = list.findIndex(
      s => s.id === submission.id || (s.assignmentId === submission.assignmentId && s.studentId === submission.studentId)
    );
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...submission };
    } else {
      list.push(submission);
    }
    // Use safe storage that will never crash with QuotaExceededError
    safeSaveSubmissions(list);
  } catch (e) {
    console.error('Failed saving submission safely', e);
  }
}




