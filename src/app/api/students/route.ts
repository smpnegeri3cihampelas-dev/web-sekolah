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

