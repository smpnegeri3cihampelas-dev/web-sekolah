import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query<any[]>('SELECT * FROM cbt_exam_rooms ORDER BY sort_order ASC');
    const rooms = rows.map(r => {
      let parsedClasses = [];
      let parsedAssigned = [];
      try {
        parsedClasses = typeof r.classes === 'string' ? JSON.parse(r.classes) : (r.classes || []);
      } catch {}
      try {
        parsedAssigned = typeof r.assigned_student_ids === 'string' ? JSON.parse(r.assigned_student_ids) : (r.assigned_student_ids || []);
      } catch {}

      return {
        id: r.id,
        name: r.name,
        classes: parsedClasses,
        capacity: Number(r.capacity) || 35,
        label: r.label,
        supervisorName: r.supervisor_name || 'Guru Pengawas',
        assignedStudentIds: Array.isArray(parsedAssigned) ? parsedAssigned : []
      };
    });
    return NextResponse.json({ success: true, count: rooms.length, data: rooms });
  } catch (error: any) {
    console.error('Error fetching CBT rooms:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rooms, forceEmpty } = body;

    if (!Array.isArray(rooms)) {
      return NextResponse.json({ success: false, message: 'Format data rooms harus berupa array!' }, { status: 400 });
    }

    // Lindungi konfigurasi ruangan yang sudah berisi siswa dari penimpaan tak sengaja oleh browser baru/cache kosong
    const incomingHasContent = rooms.some(
      (r: any) =>
        (Array.isArray(r.assignedStudentIds) && r.assignedStudentIds.length > 0) ||
        (Array.isArray(r.classes) && r.classes.length > 0)
    );
    if (!incomingHasContent && !forceEmpty) {
      const existingRows = await query<any[]>('SELECT classes, assigned_student_ids FROM cbt_exam_rooms');
      const dbHasPopulated = existingRows.some((row) => {
        try {
          const c = typeof row.classes === 'string' ? JSON.parse(row.classes) : row.classes;
          const a = typeof row.assigned_student_ids === 'string' ? JSON.parse(row.assigned_student_ids) : row.assigned_student_ids;
          return (Array.isArray(c) && c.length > 0) || (Array.isArray(a) && a.length > 0);
        } catch {
          return false;
        }
      });
      if (dbHasPopulated) {
        return NextResponse.json({
          success: true,
          ignored: true,
          message: 'Pengaturan ruangan yang sudah terisi di server dipertahankan (diabaikan penimpaan kosong otomatis).'
        });
      }
    }

    if (rooms.length === 0) {
      return NextResponse.json({ success: true, message: 'Tidak ada ruangan untuk diperbarui.' });
    }

    const placeholders: string[] = [];
    const params: (string | number | null)[] = [];
    for (let i = 0; i < rooms.length; i++) {
      const r = rooms[i];
      const assignedJson =
        r.assignedStudentIds && Array.isArray(r.assignedStudentIds) && r.assignedStudentIds.length > 0
          ? JSON.stringify(r.assignedStudentIds)
          : null;

      placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?)');
      params.push(
        String(r.id),
        String(r.name),
        JSON.stringify(r.classes || []),
        Number(r.capacity) || 35,
        String(r.label || r.name),
        String(r.supervisorName || 'Guru Pengawas'),
        assignedJson,
        i + 1
      );
    }

    await query(
      `
        INSERT INTO cbt_exam_rooms (id, name, classes, capacity, label, supervisor_name, assigned_student_ids, sort_order)
        VALUES ${placeholders.join(', ')}
        ON DUPLICATE KEY UPDATE
          name=VALUES(name),
          classes=VALUES(classes),
          capacity=VALUES(capacity),
          label=VALUES(label),
          supervisor_name=VALUES(supervisor_name),
          assigned_student_ids=VALUES(assigned_student_ids),
          sort_order=VALUES(sort_order);
      `,
      params
    );

    return NextResponse.json({ success: true, message: 'Konfigurasi ruang CBT berhasil disinkronkan ke Hostinger MariaDB!' });
  } catch (error: any) {
    console.error('Error saving CBT rooms:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { roomId, roomName, supervisorName } = body || {};

    if ((!roomId && !roomName) || !supervisorName || typeof supervisorName !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Parameter roomId/roomName dan supervisorName wajib diisi!' },
        { status: 400 }
      );
    }

    const cleanSup = supervisorName.trim();
    if (roomId && roomName) {
      await query(
        'UPDATE cbt_exam_rooms SET supervisor_name = ? WHERE id = ? OR name = ?',
        [cleanSup, roomId, roomName]
      );
    } else if (roomId) {
      await query('UPDATE cbt_exam_rooms SET supervisor_name = ? WHERE id = ?', [cleanSup, roomId]);
    } else {
      await query('UPDATE cbt_exam_rooms SET supervisor_name = ? WHERE name = ?', [cleanSup, roomName]);
    }

    return NextResponse.json({ success: true, message: 'Nama pengawas ruangan berhasil diperbarui!' });
  } catch (error: any) {
    console.error('Error updating CBT room supervisor:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
