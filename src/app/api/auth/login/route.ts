import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
      guru_piket: 'piket123',
      panitia: 'panitia123',
      siswa: 'siswa123'
    };
    const roleDefault = defaultPasswordMap[user.role] || 'admin123';
    const expectedPassword = user.password || roleDefault;

    if (password !== expectedPassword) {
      return NextResponse.json({
        success: false,
        message: 'Kata sandi tidak sesuai! Silakan periksa kembali.'
      }, { status: 401 });
    }

    // Role check if specified
    if (role && user.role !== role && !(role === 'guru' && user.role === 'guru_mapel')) {
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
