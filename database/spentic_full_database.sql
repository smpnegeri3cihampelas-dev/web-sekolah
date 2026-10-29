-- ============================================================================
-- DATABASE SCHEMAS & INITIAL SEED: SMP NEGERI 3 CIHAMPELAS (SPENTIC)
-- Server: Hostinger MariaDB 11.8+ / MySQL 8.0+
-- Database: u571416603_spentic_db
-- Target: Sistem Informasi Sekolah, Landing Page, E-Learning, CBT & Manajemen Admin
-- Dibuat secara otomatis dan telah aktif di live database Hostinger.
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

-- ----------------------------------------------------------------------------
-- 1. TABEL: users (Akun Terpadu untuk Multi-Role: Admin, Guru, Piket, Panitia, Siswa)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'guru_mapel', 'guru_piket', 'panitia', 'siswa') NOT NULL,
  `identifier` VARCHAR(100) NULL COMMENT 'NIP Guru / NISN Siswa / Kode Akun',
  `subject` VARCHAR(150) NULL COMMENT 'Mata pelajaran pengampu jika guru',
  `class_id` VARCHAR(50) NULL COMMENT 'Rombel siswa / wali kelas',
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(150) NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_identifier` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. TABEL: classes (17 Rombongan Belajar Resmi SMPN 3 Cihampelas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `classes` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'e.g. 7-A, 8-A, 9-A',
  `name` VARCHAR(100) NOT NULL COMMENT 'e.g. Kelas 7-A',
  `grade_level` INT NOT NULL COMMENT '7, 8, 9',
  `wali_kelas` VARCHAR(255) DEFAULT NULL,
  `total_students` INT DEFAULT 0,
  `academic_year` VARCHAR(50) DEFAULT '2026/2027',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_grade_level` (`grade_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. TABEL: subjects (Mata Pelajaran Kurikulum Merdeka)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'e.g. MTK, IPA, INF',
  `code` VARCHAR(20) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(100) DEFAULT 'Wajib',
  `kkm` INT DEFAULT 75,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. TABEL: class_schedules (Jadwal Pelajaran KBM Mingguan)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `class_schedules` (
  `id` VARCHAR(100) PRIMARY KEY,
  `class_id` VARCHAR(50) NOT NULL,
  `day_name` VARCHAR(20) NOT NULL,
  `day_index` INT NOT NULL COMMENT '1=Senin s/d 5=Jumat',
  `time_slot` VARCHAR(50) NOT NULL,
  `subject` VARCHAR(150) NOT NULL,
  `teacher_name` VARCHAR(255) NOT NULL,
  `teacher_nip` VARCHAR(100) DEFAULT '-',
  `order_index` INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_schedule_class` (`class_id`),
  INDEX `idx_schedule_day` (`day_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. TABEL: teachers (Data Guru & Tenaga Kependidikan / GTK)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(100) UNIQUE,
  `phone` VARCHAR(50),
  `role` VARCHAR(100) DEFAULT 'Guru Mata Pelajaran',
  `subject` VARCHAR(100),
  `category` VARCHAR(100),
  `nip` VARCHAR(100),
  `photo` TEXT,
  `status` VARCHAR(100) DEFAULT 'PNS',
  `active` TINYINT(1) DEFAULT 1,
  `quote` TEXT,
  `password` VARCHAR(255) DEFAULT 'spentic123',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. TABEL: students (Data 535 Peserta Didik Aktif)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` VARCHAR(50),
  `nis` VARCHAR(50),
  `nisn` VARCHAR(50) UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `class_id` VARCHAR(50) NOT NULL,
  `gender` VARCHAR(10) DEFAULT '-',
  `password` VARCHAR(255) DEFAULT '123456',
  `status` VARCHAR(50) DEFAULT 'Aktif' COMMENT 'Aktif, Keluar, Pindah Sekolah',
  `exit_reason` VARCHAR(255) DEFAULT NULL COMMENT 'Alasan keluar / pindah sekolah',
  `exit_date` VARCHAR(50) DEFAULT NULL COMMENT 'Tanggal siswa keluar',
  `exit_marked_by` VARCHAR(255) DEFAULT NULL COMMENT 'Guru atau Meja Piket yang menandai',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_student_class` (`class_id`),
  INDEX `idx_student_nisn` (`nisn`),
  INDEX `idx_student_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. TABEL: subject_sessions (E-Learning - Sesi Pembelajaran & Presensi Rombel)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subject_sessions` (
  `id` VARCHAR(100) PRIMARY KEY COMMENT 'e.g. 2026-10-25_7-A_MTK',
  `class_id` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `subject` VARCHAR(150) NOT NULL,
  `teacher_name` VARCHAR(255) NOT NULL,
  `teacher_nip` VARCHAR(100) DEFAULT '-',
  `submitted_at` VARCHAR(50) DEFAULT NULL,
  `is_submitted` TINYINT(1) DEFAULT 1,
  `topic_material` TEXT DEFAULT NULL COMMENT 'Jurnal mengajar / topik materi yang disampaikan',
  `records` LONGTEXT NOT NULL COMMENT 'JSON Record<studentId, H|S|I|A|T>',
  `notes` LONGTEXT DEFAULT NULL COMMENT 'JSON Record<studentId, note>',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_session_class_date` (`class_id`, `date`),
  INDEX `idx_session_teacher` (`teacher_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. TABEL: attendance_records (Detail Presensi Siswa per Pertemuan)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` VARCHAR(100) NOT NULL,
  `student_id` VARCHAR(50) NOT NULL,
  `student_nisn` VARCHAR(50) NULL,
  `student_name` VARCHAR(255) NOT NULL,
  `class_id` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `subject` VARCHAR(150) NOT NULL,
  `status` ENUM('H', 'S', 'I', 'A', 'T') NOT NULL DEFAULT 'H',
  `note` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_att_student` (`student_id`),
  INDEX `idx_att_class_date` (`class_id`, `date`),
  INDEX `idx_att_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. TABEL: assignments (E-Learning - Tugas & Materi Pembelajaran Guru)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assignments` (
  `id` VARCHAR(100) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(150) NOT NULL,
  `teacher_name` VARCHAR(255) NOT NULL,
  `teacher_nip` VARCHAR(100) DEFAULT '-',
  `target_class` VARCHAR(50) NOT NULL,
  `due_date` VARCHAR(50) NOT NULL,
  `description` LONGTEXT NOT NULL,
  `allow_upload` TINYINT(1) DEFAULT 1,
  `material_url` TEXT DEFAULT NULL,
  `material_name` VARCHAR(255) DEFAULT NULL,
  `video_url` TEXT DEFAULT NULL,
  `video_title` VARCHAR(255) DEFAULT NULL,
  `quiz_questions` LONGTEXT DEFAULT NULL COMMENT 'JSON QuizQuestion[]',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_asg_class` (`target_class`),
  INDEX `idx_asg_subject` (`subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. TABEL: assignment_submissions (E-Learning - Pengumpulan Tugas Siswa & Nilai)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assignment_submissions` (
  `id` VARCHAR(100) PRIMARY KEY,
  `assignment_id` VARCHAR(100) NOT NULL,
  `student_id` VARCHAR(50) NOT NULL,
  `student_name` VARCHAR(255) NOT NULL,
  `student_class` VARCHAR(50) NOT NULL,
  `submitted_at` VARCHAR(50) NOT NULL,
  `file_name` VARCHAR(255) DEFAULT NULL,
  `file_size` VARCHAR(50) DEFAULT NULL,
  `file_url` LONGTEXT DEFAULT NULL,
  `video_url` TEXT DEFAULT NULL,
  `answer_text` LONGTEXT DEFAULT NULL,
  `grade` INT DEFAULT NULL COMMENT 'Nilai 0 - 100',
  `feedback` TEXT DEFAULT NULL COMMENT 'Catatan koreksi guru',
  `status` ENUM('submitted', 'graded') DEFAULT 'submitted',
  `quiz_answers` LONGTEXT DEFAULT NULL COMMENT 'JSON number[]',
  `quiz_score` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sub_asg` (`assignment_id`),
  INDEX `idx_sub_student` (`student_id`),
  INDEX `idx_sub_class` (`student_class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. TABEL: piket_journal (Stasiun Meja Piket - Jurnal Harian & Rekap Ketertiban)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `piket_journal` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `date` DATE NOT NULL,
  `officer_name` VARCHAR(255) NOT NULL,
  `officer_nip` VARCHAR(100) DEFAULT '-',
  `total_classes_checked` INT DEFAULT 17,
  `total_late` INT DEFAULT 0,
  `total_sick` INT DEFAULT 0,
  `total_permit` INT DEFAULT 0,
  `total_alpha` INT DEFAULT 0,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_piket_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. TABEL: student_permits (Stasiun Meja Piket - Dispensasi & Keterlambatan)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_permits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_nisn` VARCHAR(50) NOT NULL,
  `student_name` VARCHAR(255) NOT NULL,
  `class_id` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `time` VARCHAR(20) NOT NULL,
  `type` ENUM('Terlambat', 'Dispen/Izin Keluar', 'Pulang Sakit', 'Lainnya') DEFAULT 'Terlambat',
  `reason` TEXT NOT NULL,
  `approved_by` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_permit_date` (`date`),
  INDEX `idx_permit_nisn` (`student_nisn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. TABEL: cbt_exam_packages (CBT - Bank Soal & Paket Ujian CBT)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbt_exam_packages` (
  `id` VARCHAR(100) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(150) NOT NULL,
  `grade_level` VARCHAR(20) NOT NULL COMMENT '7, 8, 9, Semua',
  `target_classes` LONGTEXT NOT NULL COMMENT 'JSON array [7-A, 7-B...]',
  `semester` VARCHAR(100) NOT NULL,
  `academic_year` VARCHAR(50) DEFAULT '2026/2027',
  `duration_minutes` INT NOT NULL DEFAULT 60,
  `token` VARCHAR(50) NOT NULL,
  `passing_grade` INT NOT NULL DEFAULT 75,
  `total_questions` INT NOT NULL DEFAULT 0,
  `status` ENUM('active', 'draft', 'completed') DEFAULT 'active',
  `teacher_name` VARCHAR(255) NOT NULL,
  `instructions` TEXT DEFAULT NULL,
  `exam_date` DATE DEFAULT NULL,
  `start_time` VARCHAR(20) DEFAULT NULL,
  `end_time` VARCHAR(20) DEFAULT NULL,
  `emergency_paused` TINYINT(1) DEFAULT 0,
  `emergency_pause_reason` TEXT DEFAULT NULL,
  `questions` LONGTEXT NOT NULL COMMENT 'JSON CbtQuestion[]',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cbt_token` (`token`),
  INDEX `idx_cbt_grade` (`grade_level`),
  INDEX `idx_cbt_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. TABEL: cbt_exam_rooms (CBT - Konfigurasi 17 Ruang Ujian Panitia)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbt_exam_rooms` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT 'ruang-01 s/d ruang-17',
  `name` VARCHAR(100) NOT NULL COMMENT 'Ruang 01',
  `classes` LONGTEXT NOT NULL COMMENT 'JSON array [7-A]',
  `capacity` INT NOT NULL DEFAULT 35,
  `label` VARCHAR(255) NOT NULL,
  `supervisor_name` VARCHAR(255) DEFAULT 'Guru Pengawas',
  `assigned_student_ids` LONGTEXT DEFAULT NULL,
  `sort_order` INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. TABEL: cbt_supervisor_schedules (CBT - Jadwal Penugasan Pengawas Ruang)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbt_supervisor_schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `exam_date` DATE NOT NULL,
  `sessions` LONGTEXT NOT NULL COMMENT 'JSON CbtScheduleSessionSlot[] (Jam 1, Jam 2, dst)',
  `entries` LONGTEXT NOT NULL COMMENT 'JSON CbtSupervisorScheduleEntry[]',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sup_date` (`exam_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. TABEL: cbt_student_answers (CBT - Lembar Pengerjaan & Hasil Nilai Siswa)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbt_student_answers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `exam_id` VARCHAR(100) NOT NULL,
  `student_id` VARCHAR(50) NOT NULL,
  `student_nisn` VARCHAR(50) NOT NULL,
  `student_name` VARCHAR(255) NOT NULL,
  `class_id` VARCHAR(50) NOT NULL,
  `room_name` VARCHAR(100) NOT NULL,
  `answers` LONGTEXT NOT NULL COMMENT 'JSON Record<questionId, answer>',
  `doubtfuls` LONGTEXT DEFAULT NULL COMMENT 'JSON Record<questionId, boolean>',
  `audio_play_count` LONGTEXT DEFAULT NULL COMMENT 'JSON Record<questionId, number>',
  `started_at` VARCHAR(50) NOT NULL,
  `submitted_at` VARCHAR(50) DEFAULT NULL,
  `is_submitted` TINYINT(1) DEFAULT 0,
  `score` DECIMAL(5,2) DEFAULT 0.00,
  `total_score` DECIMAL(5,2) DEFAULT 0.00,
  `correct_count` INT DEFAULT 0,
  `wrong_count` INT DEFAULT 0,
  `is_passed` TINYINT(1) DEFAULT 0,
  `violation_count` INT DEFAULT 0 COMMENT 'Anti-cheat tab switch count',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_exam_nisn` (`exam_id`, `student_nisn`),
  INDEX `idx_cbt_ans_exam` (`exam_id`),
  INDEX `idx_cbt_ans_class` (`class_id`),
  INDEX `idx_cbt_ans_room` (`room_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 17. TABEL: cbt_room_attendances (CBT - Berita Acara & Daftar Hadir Ruang)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbt_room_attendances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_name` VARCHAR(100) NOT NULL,
  `exam_id` VARCHAR(100) NOT NULL,
  `exam_title` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  `supervisor_name` VARCHAR(255) NOT NULL,
  `token` VARCHAR(50) NOT NULL,
  `records` LONGTEXT NOT NULL COMMENT 'JSON Record<studentId, H|S|I|A>',
  `notes` TEXT DEFAULT NULL,
  `is_bap_submitted` TINYINT(1) DEFAULT 0,
  `submitted_at` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_bap_room_date` (`room_name`, `date`),
  INDEX `idx_bap_exam` (`exam_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 18. TABEL: warta (Landing Page & Admin - Berita, Artikel & Liputan Sekolah)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `warta` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'Kegiatan',
  `date` VARCHAR(50) NOT NULL,
  `views` VARCHAR(50) DEFAULT '0',
  `status` VARCHAR(50) DEFAULT 'Published',
  `src` TEXT,
  `excerpt` TEXT,
  `content` LONGTEXT,
  `author` VARCHAR(100) DEFAULT 'Admin Humas',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 19. TABEL: agenda (Landing Page & Admin - Kalender Pendidikan & Agenda)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `agenda` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `date` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) DEFAULT 'Akademik',
  `status` VARCHAR(50) DEFAULT 'Mendatang',
  `semester` VARCHAR(50) DEFAULT 'Semester 1',
  `title` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 20. TABEL: leaders (Landing Page & Admin - Struktur Pimpinan Sekolah)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `leaders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `role` VARCHAR(100) NOT NULL,
  `badge` VARCHAR(100),
  `nip` VARCHAR(100),
  `quote` TEXT,
  `status` VARCHAR(100),
  `photo` TEXT,
  `badge_color` VARCHAR(100),
  `sort_order` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 21. TABEL: gallery (Landing Page & Admin - Galeri Foto & Fasilitas Sekolah)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `gallery` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255),
  `category` VARCHAR(100) DEFAULT 'Dokumentasi',
  `image_url` TEXT,
  `caption` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 22. TABEL: school_settings (Landing Page & Admin - Data Pokok & Pengaturan)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `school_settings` (
  `setting_key` VARCHAR(100) PRIMARY KEY,
  `setting_value` LONGTEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 23. TABEL: contact_messages (Landing Page - Buku Tamu & Pesan Pengunjung)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sender_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `subject` VARCHAR(255) DEFAULT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 24. TABEL: activity_logs (Audit Trail Aktivitas Admin & Sistem)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_identifier` VARCHAR(100) NOT NULL,
  `user_role` VARCHAR(50) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_log_role` (`user_role`),
  INDEX `idx_log_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
