import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isTendikOrTu } from '@/lib/schoolConstants';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, role } = body;

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        message: 'Username/Identifier dan kata sandi wajib diisi!'
      }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Query ke tabel users
    let sql = 'SELECT * FROM users WHERE LOWER(username) = ? OR identifier = ?';
    const params = [cleanUsername, username.trim()];

    const users = await query<any[]>(sql, params);

    if (!users || users.length === 0) {
      // Cek apakah siswa (hanya by 10-digit NISN ketat tanpa spasi) di tabel students
      if (role === 'siswa') {
        const trimmedInput = username.trim();
        if (/\s/.test(username) || !/^\d{10}$/.test(trimmedInput)) {
          return NextResponse.json({
            success: false,
            message: 'NISN tidak boleh mengandung spasi dan harus tepat 10 digit angka!'
          }, { status: 400 });
        }

        const students = await query<any[]>(
          'SELECT * FROM students WHERE nisn = ?',
          [trimmedInput]
        );

        if (students && students.length > 0) {
          const s = students[0];
          const customPass = s.password && s.password !== 'siswa123' ? s.password : null;
          const isValidPass = customPass ? password === customPass : password === 'siswa123';
          if (isValidPass) {
            return NextResponse.json({
              success: true,
              user: {
                id: s.id,
                username: s.nisn,
                name: s.name,
                role: 'siswa',
                identifier: s.nisn,
                classId: s.class_id,
                gender: s.gender
              }
            });
          }
        }
      }

      // Cek apakah guru (hanya by username tanpa gelar & ketat tanpa spasi) di tabel teachers
      if (role === 'guru' || role === 'guru_mapel') {
        if (/\s/.test(username)) {
          return NextResponse.json({
            success: false,
            message: 'User ID guru tidak boleh menggunakan spasi! Wajib disatukan (contoh: ichsanularifin).'
          }, { status: 400 });
        }

        const teachers = await query<any[]>(
          'SELECT * FROM teachers WHERE username = ?',
          [cleanUsername]
        );

        if (teachers && teachers.length > 0) {
          const t = teachers[0];
          if (isTendikOrTu(t)) {
            return NextResponse.json({
              success: false,
              message: 'Staf Tata Usaha (TU) tidak memerlukan akun login E-Learning.'
            }, { status: 403 });
          }
          const customPass = t.password && t.password !== 'guru123' ? t.password : null;
          const isValidPass = customPass ? password === customPass : password === 'guru123';
          if (isValidPass) {
            return NextResponse.json({
              success: true,
              user: {
                id: t.id,
                username: t.username,
                name: t.name,
                role: 'guru_mapel',
                identifier: t.nip,
                subject: t.subject
              }
            });
          }
        }
      }

      return NextResponse.json({
        success: false,
        message: 'Akun tidak ditemukan atau kredensial tidak sesuai.'
      }, { status: 401 });
    }

    const user = users[0];

    // Verifikasi password (1 default password per role atau password kustom tersimpan)
    const defaultPasswordMap: Record<string, string> = {
      admin: 'admin123',
      guru: 'guru123',
      guru_mapel: 'guru123',
      piket: 'piket123',
      guru_piket: 'piket123',
      panitia: 'panitia123',
      siswa: 'siswa123'
    };
    const roleDefault = defaultPasswordMap[user.role] || 'admin123';
    let expectedPassword = user.password || roleDefault;

    // Jika role guru_mapel, periksa juga tabel teachers (tempat password terbaru guru disimpan)
    if (user.role === 'guru_mapel') {
      try {
        const tRows = await query<any[]>(
          'SELECT password, subject, nip, name FROM teachers WHERE username = ? OR (nip IS NOT NULL AND nip != "-" AND nip = ?) LIMIT 1',
          [cleanUsername, user.identifier || '']
        );
        if (tRows && tRows.length > 0 && tRows[0].password) {
          expectedPassword = tRows[0].password;
          if (tRows[0].subject) user.subject = tRows[0].subject;
          if (tRows[0].nip) user.identifier = tRows[0].nip;
          if (tRows[0].name) user.name = tRows[0].name;
        }
      } catch {}
    }

    // Verifikasi kata sandi ketat: sesuai database
    if (password !== expectedPassword && !(user.password && password === user.password)) {
      return NextResponse.json({
        success: false,
        message: 'Kata sandi tidak sesuai! Silakan periksa kembali.'
      }, { status: 401 });
    }

    // Role check if specified
    const isRoleMatch =
      !role ||
      user.role === role ||
      (role === 'guru' && user.role === 'guru_mapel') ||
      (role === 'piket' && user.role === 'guru_piket');

    if (!isRoleMatch) {
      return NextResponse.json({
        success: false,
        message: `Akun ini tidak memiliki hak akses sebagai ${role}.`
      }, { status: 403 });
    }

    // Catat log login
    try {
      await query(
        'INSERT INTO activity_logs (user_identifier, user_role, action, details) VALUES (?, ?, ?, ?)',
        [user.username, user.role, 'LOGIN', `Login sukses sebagai ${user.role}`]
      );
    } catch {}

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        identifier: user.identifier,
        subject: user.subject,
        classId: user.class_id,
        phone: user.phone
      }
    });

  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Action: Ganti kata sandi mandiri untuk Guru Mapel, Meja Piket, Panitia, atau Siswa
    if (body.action === 'change_password') {
      const { role, username, nipOrNisn, name, currentPassword, newPassword } = body;
      const cleanCur = String(currentPassword || '').trim();
      const cleanNew = String(newPassword || '').trim();

      if (!cleanCur || !cleanNew || cleanNew.length < 4) {
        return NextResponse.json(
          { success: false, message: 'Kata sandi baru minimal 4 karakter!' },
          { status: 400 }
        );
      }

      if (role === 'guru_piket' || role === 'piket') {
        const uRows = await query<any[]>(
          `SELECT id, password FROM users WHERE role = 'guru_piket' OR LOWER(username) = 'piket' LIMIT 1`
        );
        const dbPass = uRows?.[0]?.password || 'piket123';
        if (cleanCur !== dbPass) {
          return NextResponse.json(
            { success: false, message: 'Kata sandi saat ini salah!' },
            { status: 401 }
          );
        }
        if (uRows && uRows.length > 0) {
          await query(`UPDATE users SET password = ? WHERE id = ?`, [cleanNew, uRows[0].id]);
        } else {
          await query(
            `INSERT INTO users (username, password, name, role, identifier, subject, status)
             VALUES ('piket', ?, 'Stasiun Meja Piket Utama', 'guru_piket', 'POSKO-PIKET', 'Pusat Monitoring Rombel', 'active')`,
            [cleanNew]
          );
        }
        return NextResponse.json({
          success: true,
          message: 'Kata sandi Stasiun Meja Piket berhasil diperbarui di database MariaDB!'
        });
      }

      if (role === 'panitia') {
        const uRows = await query<any[]>(
          `SELECT id, password FROM users WHERE role = 'panitia' OR LOWER(username) = 'panitia' LIMIT 1`
        );
        const dbPass = uRows?.[0]?.password || 'panitia123';
        if (cleanCur !== dbPass) {
          return NextResponse.json(
            { success: false, message: 'Kata sandi saat ini salah!' },
            { status: 401 }
          );
        }
        if (uRows && uRows.length > 0) {
          await query(`UPDATE users SET password = ? WHERE id = ?`, [cleanNew, uRows[0].id]);
        } else {
          await query(
            `INSERT INTO users (username, password, name, role, identifier, subject, status)
             VALUES ('panitia', ?, 'Panitia Asesmen CBT', 'panitia', 'PANITIA-CBT', 'Pusat Kendali Ujian', 'active')`,
            [cleanNew]
          );
        }
        return NextResponse.json({
          success: true,
          message: 'Kata sandi Panitia CBT berhasil diperbarui di database MariaDB!'
        });
      }

      if (role === 'guru_mapel' || role === 'guru') {
        const cleanUser = String(username || '').trim().toLowerCase();
        const cleanNipNoSpace = String(nipOrNisn || '').replace(/\s+/g, '');
        const cleanName = String(name || '').trim();

        const [tRows, uRows] = await Promise.all([
          query<any[]>(
            `SELECT id, username, nip, name, password FROM teachers
             WHERE LOWER(username) = ?
                OR (? != '' AND ? != '-' AND REPLACE(nip, ' ', '') = ?)
                OR LOWER(name) = LOWER(?)
             LIMIT 1`,
            [cleanUser, cleanNipNoSpace, cleanNipNoSpace, cleanNipNoSpace, cleanName]
          ),
          query<any[]>(
            `SELECT id, username, identifier, name, password FROM users
             WHERE role = 'guru_mapel'
               AND (LOWER(username) = ?
                    OR (? != '' AND ? != '-' AND REPLACE(identifier, ' ', '') = ?)
                    OR LOWER(name) = LOWER(?))
             LIMIT 1`,
            [cleanUser, cleanNipNoSpace, cleanNipNoSpace, cleanNipNoSpace, cleanName]
          )
        ]);

        const teacherPass = tRows?.[0]?.password || '';
        const userPass = uRows?.[0]?.password || '';
        const dbPass = teacherPass || userPass || 'guru123';

        const isCurrentValid =
          cleanCur === dbPass ||
          (teacherPass && cleanCur === teacherPass) ||
          (userPass && cleanCur === userPass);

        if (!isCurrentValid) {
          return NextResponse.json(
            { success: false, error: 'Kata sandi saat ini salah! Masukkan sandi Anda dengan benar.' },
            { status: 401 }
          );
        }

        if (tRows && tRows.length > 0) {
          await query(`UPDATE teachers SET password = ? WHERE id = ?`, [cleanNew, tRows[0].id]);
        }
        if (uRows && uRows.length > 0) {
          await query(`UPDATE users SET password = ? WHERE id = ?`, [cleanNew, uRows[0].id]);
        } else {
          await query(
            `UPDATE users SET password = ?
             WHERE role = 'guru_mapel' AND (LOWER(username) = ? OR LOWER(name) = LOWER(?))`,
            [cleanNew, cleanUser, cleanName]
          ).catch(() => {});
        }

        return NextResponse.json({
          success: true,
          message: 'Kata sandi akun guru berhasil diperbarui di database MariaDB!'
        });
      }

      if (role === 'siswa') {
        const cleanNisn = String(nipOrNisn || username || '').trim();
        const sRows = await query<any[]>(
          `SELECT id, password FROM students WHERE nisn = ? LIMIT 1`,
          [cleanNisn]
        );
        if (!sRows || sRows.length === 0) {
          return NextResponse.json(
            { success: false, message: 'Data siswa tidak ditemukan di database!' },
            { status: 404 }
          );
        }
        const dbPass = sRows[0].password || 'siswa123';
        if (cleanCur !== dbPass) {
          return NextResponse.json(
            { success: false, message: 'Kata sandi saat ini salah!' },
            { status: 401 }
          );
        }
        await query(`UPDATE students SET password = ? WHERE id = ?`, [cleanNew, sRows[0].id]);
        return NextResponse.json({
          success: true,
          message: 'Kata sandi siswa berhasil diperbarui di database MariaDB!'
        });
      }
    }

    if (body.action === 'sync_all_tables') {
      // 1. Sync admin, panitia, piket in users table
      await query(`UPDATE users SET password = 'admin123' WHERE role = 'admin'`);
      await query(`UPDATE users SET password = 'panitia123' WHERE role = 'panitia'`);
      await query(`UPDATE users SET password = 'piket123' WHERE role = 'guru_piket'`);

      // 2. Sync guru_mapel in users table with clean usernames & guru123 password
      const usersGuru = await query<any[]>(`SELECT id, name, identifier FROM users WHERE role = 'guru_mapel'`);
      for (const ug of usersGuru) {
        const rawName = ug.name || '';
        const base = rawName.split(',')[0].trim();
        const withoutPrefix = base.replace(/^(H\.|Hj\.|Drs\.|Dra\.|Dr\.|Prof\.|Ir\.|H\b|Hj\b)\s*/gi, '');
        const clean = withoutPrefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'guru';
        await query(`UPDATE users SET username = ?, password = 'guru123' WHERE id = ?`, [clean, ug.id]);
      }

      // 3. Ensure teachers table has clean usernames & guru123 password
      const teachers = await query<any[]>(`SELECT id, name FROM teachers`);
      for (const t of teachers) {
        const rawName = t.name || '';
        const base = rawName.split(',')[0].trim();
        const withoutPrefix = base.replace(/^(H\.|Hj\.|Drs\.|Dra\.|Dr\.|Prof\.|Ir\.|H\b|Hj\b)\s*/gi, '');
        const clean = withoutPrefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'guru';
        await query(`UPDATE teachers SET username = ?, password = IF(password = 'spentic123' OR password IS NULL OR password = '', 'guru123', password) WHERE id = ?`, [clean, t.id]);
      }

      // 4. Ensure students table has clean siswa123 password
      await query(`UPDATE students SET password = 'siswa123' WHERE password = '123456' OR password IS NULL OR password = ''`);

      return NextResponse.json({
        success: true,
        message: 'Seluruh tabel users, teachers, dan students di MariaDB berhasil disinkronkan secara total!'
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const [usersRows, teachersRows, studentsRows] = await Promise.all([
      query<any[]>('SELECT id, username, role, name, identifier FROM users'),
      query<any[]>('SELECT id, name, username, password FROM teachers'),
      query<any[]>('SELECT COUNT(*) as total, SUM(CASE WHEN password = "siswa123" THEN 1 ELSE 0 END) as validPass, SUM(CASE WHEN LENGTH(nisn) = 10 AND nisn NOT LIKE "% %" THEN 1 ELSE 0 END) as validNisn FROM students')
    ]);

    const teacherCount = teachersRows.length;
    const teachersWithCleanUsername = teachersRows.filter(t => t.username && !/\s/.test(t.username) && !/[A-Z]/.test(t.username)).length;
    const teachersWithDefaultPass = teachersRows.filter(t => t.password === 'guru123').length;

    const studentStats = studentsRows[0] || {};

    return NextResponse.json({
      success: true,
      message: 'Status Sinkronisasi Database MariaDB Live',
      data: {
        admin: usersRows,
        teachers: {
          total: teacherCount,
          cleanUsernamesCount: teachersWithCleanUsername,
          defaultPasswordsCount: teachersWithDefaultPass,
          isFullySynced: teacherCount > 0 && teacherCount === teachersWithCleanUsername && teacherCount === teachersWithDefaultPass
        },
        students: {
          total: Number(studentStats.total || 0),
          cleanNisnCount: Number(studentStats.validNisn || 0),
          defaultPasswordsCount: Number(studentStats.validPass || 0),
          isFullySynced: Number(studentStats.total) > 0 && Number(studentStats.total) === Number(studentStats.validNisn) && Number(studentStats.total) === Number(studentStats.validPass)
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
