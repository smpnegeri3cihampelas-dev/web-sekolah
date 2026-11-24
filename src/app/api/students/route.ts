import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function syncClassesTotalStudents() {
  try {
    await query(`
      UPDATE classes c
      SET c.total_students = (
        SELECT COUNT(*) FROM students s
        WHERE s.class_id = c.id AND (s.status IS NULL OR s.status != 'Keluar')
      )
    `);
  } catch (e) {
    console.warn('Could not sync classes.total_students:', e);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const search = searchParams.get('q');

    let sql = 'SELECT id, student_id, nis, nisn, name, class_id, gender, status, exit_reason, exit_date, exit_marked_by, password FROM students WHERE 1=1';
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
      exitMarkedBy: r.exit_marked_by || undefined,
      password: r.password || 'siswa123'
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

    await syncClassesTotalStudents();

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

        const existing = await query<any[]>(
          `SELECT id FROM students WHERE nisn = ? OR student_id = ? LIMIT 1`,
          [nisn, studentId]
        );

        if (existing.length > 0) {
          await query(
            `UPDATE students SET student_id = ?, nis = COALESCE(?, nis), nisn = ?, name = ?, class_id = ?, gender = ?, status = ? WHERE id = ?`,
            [studentId, nis, nisn, name, classId, gender, status, existing[0].id]
          );
        } else {
          await query(
            `INSERT INTO students (student_id, nis, nisn, name, class_id, gender, password, status)
             VALUES (?, ?, ?, ?, ?, ?, 'siswa123', ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name), class_id = VALUES(class_id), nisn = VALUES(nisn), gender = VALUES(gender), status = VALUES(status)`,
            [studentId, nis, nisn, name, classId, gender, status]
          );
        }
      }

      await syncClassesTotalStudents();

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
        `UPDATE students SET name = ?, class_id = ?, nis = COALESCE(?, nis), gender = COALESCE(?, gender), status = 'Aktif' WHERE id = ?`,
        [cleanName, cleanClass, cleanNis, gender || null, existing.id]
      );
      await syncClassesTotalStudents();

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
    await syncClassesTotalStudents();

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
    const { id, studentId, name, nisn, nis, classId, gender, password, action } = body;

    // Standardize all default passwords in database
    if (action === 'standardize_passwords') {
      await query(`UPDATE students SET password = 'siswa123' WHERE password = '123456' OR password IS NULL OR password = ''`);
      return NextResponse.json({
        success: true,
        message: 'Password bawaan seluruh siswa berhasil distandarisasi ke siswa123 di cloud database'
      });
    }

    const targetId = studentId || id;
    if (!targetId && !nisn) {
      return NextResponse.json({ success: false, error: 'ID atau NISN diperlukan' }, { status: 400 });
    }

    const cleanNis = nis ? String(nis).trim() : null;

    await query(
      `UPDATE students SET 
         name = COALESCE(?, name), 
         nisn = COALESCE(?, nisn), 
         nis = COALESCE(?, nis), 
         class_id = COALESCE(?, class_id), 
         gender = COALESCE(?, gender),
         password = COALESCE(?, password)
       WHERE student_id = ? OR id = ? OR nisn = ?`,
      [name || null, nisn || null, cleanNis, classId || null, gender || null, password || null, targetId || '', targetId || 0, nisn || '']
    );
    await syncClassesTotalStudents();

    return NextResponse.json({
      success: true,
      message: `Data siswa "${name || targetId || nisn}" berhasil diperbarui di database cloud`
    });
  } catch (error: any) {
    console.error('Error updating student:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { studentId, id, nisn, action } = body;

    // Reset action: restore students table back to official 535 initial students
    if (action === 'reset') {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'scripts', 'parsed_students.json');
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(fileContent);
      const officialList = parsed.students || [];
      const officialNisns = new Set(officialList.map((s: any) => String(s.nisn).trim()));

      // Fetch all current students in DB
      const currentRows = await query<any[]>(`SELECT id, student_id, nisn FROM students`);
      const extraIds = currentRows.filter(r => !officialNisns.has(String(r.nisn).trim())).map(r => r.id);

      if (extraIds.length > 0) {
        for (const extraId of extraIds) {
          await query(`DELETE FROM students WHERE id = ?`, [extraId]);
        }
      }

      // Restore all 535 official students (both existing and any previously deleted ones)
      const existingNisnMap = new Map<string, number>();
      for (const r of currentRows) {
        const n = String(r.nisn || '').trim();
        if (officialNisns.has(n)) existingNisnMap.set(n, r.id);
      }

      for (const s of officialList) {
        const cleanNisn = String(s.nisn || '').trim();
        const cleanNis = s.nis ? String(s.nis).trim() : null;
        const cleanClass = String(s.classId || s.class_id || '7-A').trim();
        const cleanName = String(s.name || '').trim();
        const cleanGender = s.gender || '-';
        const cleanStudentId = s.id || `${cleanClass.replace('-', '')}-01`;
        const dbId = existingNisnMap.get(cleanNisn);

        if (dbId) {
          await query(
            `UPDATE students SET student_id = ?, nis = ?, name = ?, class_id = ?, gender = ?, status = 'Aktif', exit_reason = NULL, exit_date = NULL, exit_marked_by = NULL, password = 'siswa123' WHERE id = ?`,
            [cleanStudentId, cleanNis, cleanName, cleanClass, cleanGender, dbId]
          );
        } else {
          await query(
            `INSERT INTO students (student_id, nis, nisn, name, class_id, gender, password, status)
             VALUES (?, ?, ?, ?, ?, ?, 'siswa123', 'Aktif')`,
            [cleanStudentId, cleanNis, cleanNisn, cleanName, cleanClass, cleanGender]
          );
        }
      }

      await syncClassesTotalStudents();

      return NextResponse.json({
        success: true,
        count: officialList.length,
        deletedExtraCount: extraIds.length,
        message: `Database berhasil direset ke ${officialList.length} siswa awal. ${extraIds.length} siswa uji coba / tambahan telah dihapus.`
      });
    }

    if (!studentId && !id && !nisn) {
      return NextResponse.json({ success: false, error: 'ID atau NISN diperlukan' }, { status: 400 });
    }

    await query(
      `DELETE FROM students WHERE student_id = ? OR id = ? OR nisn = ?`,
      [studentId || '', id || 0, nisn || '']
    );
    await syncClassesTotalStudents();

    return NextResponse.json({
      success: true,
      message: 'Data siswa berhasil dihapus dari database cloud'
    });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


