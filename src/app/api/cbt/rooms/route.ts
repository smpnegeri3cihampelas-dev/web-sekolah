import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query<any[]>('SELECT * FROM cbt_exam_rooms ORDER BY sort_order ASC');
    const rooms = rows.map(r => ({
      id: r.id,
      name: r.name,
      classes: r.classes ? JSON.parse(r.classes) : [],
      capacity: r.capacity,
      label: r.label,
      supervisorName: r.supervisor_name || 'Guru Pengawas',
      assignedStudentIds: r.assigned_student_ids ? JSON.parse(r.assigned_student_ids) : []
    }));
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
      await query(`
        INSERT INTO cbt_exam_rooms (id, name, classes, capacity, label, supervisor_name, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          classes=VALUES(classes),
          capacity=VALUES(capacity),
          label=VALUES(label),
          supervisor_name=VALUES(supervisor_name);
      `, [
        r.id,
        r.name,
        JSON.stringify(r.classes || []),
        r.capacity || 35,
        r.label || `${r.name}`,
        r.supervisorName || 'Guru Pengawas',
        i + 1
      ]);
    }

    return NextResponse.json({ success: true, message: 'Konfigurasi 17 ruang CBT berhasil diperbarui di server!' });
  } catch (error: any) {
    console.error('Error saving CBT rooms:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
