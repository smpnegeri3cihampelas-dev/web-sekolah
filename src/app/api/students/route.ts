import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const search = searchParams.get('q');

    let sql = 'SELECT id, student_id, nis, nisn, name, class_id, gender, status, exit_reason, exit_date, exit_marked_by FROM students WHERE 1=1';
    const params: any[] = [];

    if (classId) {
      sql += ' AND class_id = ?';
      params.push(classId);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR nis LIKE ? OR nisn LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY class_id ASC, name ASC';

    const rows = await query<any[]>(sql, params);
    const students = rows.map(r => ({
      id: r.student_id || String(r.id),
      dbId: r.id,
      nisn: r.nisn,
      nis: r.nis,
      name: r.name,
      classId: r.class_id,
      gender: r.gender,
      status: r.status || 'Aktif',
      exitReason: r.exit_reason || undefined,
      exitDate: r.exit_date || undefined,
      exitMarkedBy: r.exit_marked_by || undefined
    }));

    return NextResponse.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { studentId, nisn, status, exitReason, exitDate, exitMarkedBy } = body;

    if (!studentId && !nisn) {
      return NextResponse.json({ success: false, error: 'studentId atau nisn diperlukan' }, { status: 400 });
    }

    const newStatus = status || 'Keluar';
    const reason = exitReason || 'Pindah / Keluar Sekolah';
    const date = exitDate || new Date().toISOString().split('T')[0];
    const markedBy = exitMarkedBy || 'Guru / Meja Piket';

    if (newStatus === 'Aktif') {
      await query(
        `UPDATE students SET status = 'Aktif', exit_reason = NULL, exit_date = NULL, exit_marked_by = NULL WHERE student_id = ? OR nisn = ?`,
        [studentId || '', nisn || '']
      );
    } else {
      await query(
        `UPDATE students SET status = ?, exit_reason = ?, exit_date = ?, exit_marked_by = ? WHERE student_id = ? OR nisn = ?`,
        [newStatus, reason, date, markedBy, studentId || '', nisn || '']
      );
    }

    // Audit trail logging
    try {
      await query(
        `INSERT INTO activity_logs (user_name, role, action, ip_address) VALUES (?, ?, ?, ?)`,
        [
          markedBy,
          'guru/piket',
          `Mengubah status siswa (${studentId || nisn}) menjadi ${newStatus}: ${reason}`,
          '127.0.0.1'
        ]
      );
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Status siswa berhasil diubah menjadi ${newStatus}`
    });
  } catch (error: any) {
    console.error('Error updating student status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Batch insertion (e.g. from Excel import)
    if (Array.isArray(body.students)) {
      const students = body.students;
      for (const s of students) {
        const classId = (s.classId || s.class_id || '7-A').toUpperCase().trim();
        const studentId = s.id || `${classId.replace('-', '')}-${String(Math.floor(10 + Math.random() * 90))}`;
        const nis = s.nis ? String(s.nis).trim() : null;
        const nisn = s.nisn ? String(s.nisn).trim() : '';
        const name = s.name ? String(s.name).trim() : '';
        const gender = s.gender || '-';
        const status = s.status || 'Aktif';

        if (!name || !nisn) continue;

        await query(
          `INSERT INTO students (student_id, nis, nisn, name, class_id, gender, password, status)
           VALUES (?, ?, ?, ?, ?, ?, 'siswa123', ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), class_id = VALUES(class_id), nisn = VALUES(nisn), status = VALUES(status)`,
          [studentId, nis, nisn, name, classId, gender, status]
        );
      }

      return NextResponse.json({
        success: true,
        message: `${students.length} siswa berhasil disimpan ke cloud database`
      });
    }

    // 2. Single student insertion
    const { name, nisn, nis, classId, gender, status } = body;
    if (!name || !nisn || !classId) {
      return NextResponse.json({ success: false, error: 'Nama, NISN, dan Kelas wajib diisi' }, { status: 400 });
    }

    const cleanClass = String(classId).toUpperCase().trim();
    const cleanName = String(name).trim();
    const cleanNisn = String(nisn).trim();
    const cleanNis = nis ? String(nis).trim() : null;

    // Check if NISN already exists
    const existingNisn = await query<any[]>(
      `SELECT id, student_id, name, class_id FROM students WHERE nisn = ?`,
      [cleanNisn]
    );

    if (existingNisn.length > 0) {
      // Update existing student
      const existing = existingNisn[0];
      await query(
        `UPDATE students SET name = ?, class_id = ?, nis = COALESCE(?, nis), status = 'Aktif' WHERE id = ?`,
        [cleanName, cleanClass, cleanNis, existing.id]
      );

      return NextResponse.json({
        success: true,
        data: {
          id: existing.student_id,
          dbId: existing.id,
          name: cleanName,
          nisn: cleanNisn,
          nis: cleanNis || '',
          classId: cleanClass,
          gender: gender || '-',
          status: 'Aktif'
        },
        message: `Data siswa "${cleanName}" (${cleanNisn}) berhasil diperbarui ke database`
      });
    }

    // Generate student_id based on count in this class
    const existingInClass = await query<any[]>(
      `SELECT COUNT(*) as cnt FROM students WHERE class_id = ?`,
      [cleanClass]
    );
    const nextNum = (existingInClass[0]?.cnt || 0) + 1;
    const generatedStudentId = body.id || `${cleanClass.replace('-', '')}-${String(nextNum).padStart(2, '0')}`;

    const result = await query(
      `INSERT INTO students (student_id, nis, nisn, name, class_id, gender, password, status)
       VALUES (?, ?, ?, ?, ?, ?, 'siswa123', ?)`,
      [generatedStudentId, cleanNis, cleanNisn, cleanName, cleanClass, gender || '-', status || 'Aktif']
    );

    const newStudent = {
      id: generatedStudentId,
      dbId: (result as any).insertId,
      name: cleanName,
      nisn: cleanNisn,
      nis: cleanNis || '',
      classId: cleanClass,
      gender: gender || '-',
      status: status || 'Aktif'
    };

    return NextResponse.json({
      success: true,
      data: newStudent,
      message: `Siswa "${cleanName}" berhasil ditambahkan ke database cloud`
    });
  } catch (error: any) {
    console.error('Error adding student:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, studentId, name, nisn, nis, classId, gender } = body;

    const targetId = studentId || id;
    if (!targetId && !nisn) {
      return NextResponse.json({ success: false, error: 'ID atau NISN diperlukan' }, { status: 400 });
    }

    const cleanNis = nis ? String(nis).trim() : null;

    await query(
      `UPDATE students SET name = ?, nisn = ?, nis = ?, class_id = ?, gender = COALESCE(?, gender)
       WHERE student_id = ? OR id = ? OR nisn = ?`,
      [name, nisn, cleanNis, classId, gender || null, targetId || '', targetId || 0, nisn || '']
    );

    return NextResponse.json({
      success: true,
      message: `Data siswa "${name}" berhasil diperbarui di database cloud`
    });
  } catch (error: any) {
    console.error('Error updating student:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { studentId, id, nisn } = body;

    if (!studentId && !id && !nisn) {
      return NextResponse.json({ success: false, error: 'ID atau NISN diperlukan' }, { status: 400 });
    }

    await query(
      `DELETE FROM students WHERE student_id = ? OR id = ? OR nisn = ?`,
      [studentId || '', id || 0, nisn || '']
    );

    return NextResponse.json({
      success: true,
      message: 'Data siswa berhasil dihapus dari database cloud'
    });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


