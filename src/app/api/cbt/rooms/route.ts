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
    const { rooms } = body;

    if (!Array.isArray(rooms)) {
      return NextResponse.json({ success: false, message: 'Format data rooms harus berupa array!' }, { status: 400 });
    }

    for (let i = 0; i < rooms.length; i++) {
      const r = rooms[i];
      const assignedJson = r.assignedStudentIds && Array.isArray(r.assignedStudentIds) && r.assignedStudentIds.length > 0
        ? JSON.stringify(r.assignedStudentIds)
        : null;

      await query(`
        INSERT INTO cbt_exam_rooms (id, name, classes, capacity, label, supervisor_name, assigned_student_ids, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name=VALUES(name),
          classes=VALUES(classes),
          capacity=VALUES(capacity),
          label=VALUES(label),
          supervisor_name=VALUES(supervisor_name),
          assigned_student_ids=VALUES(assigned_student_ids),
          sort_order=VALUES(sort_order);
      `, [
        r.id,
        r.name,
        JSON.stringify(r.classes || []),
        r.capacity || 35,
        r.label || `${r.name}`,
        r.supervisorName || 'Guru Pengawas',
        assignedJson,
        i + 1
      ]);
    }

    return NextResponse.json({ success: true, message: 'Konfigurasi ruang CBT berhasil disinkronkan ke Hostinger MariaDB!' });
  } catch (error: any) {
    console.error('Error saving CBT rooms:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
