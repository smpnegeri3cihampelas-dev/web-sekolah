import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

function toLocalDateString(val: any): string {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  if (typeof val === 'string') {
    const match = val.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    return val.split('T')[0];
  }
  return String(val);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const date = searchParams.get('date');
    const teacherName = searchParams.get('teacherName');

    let sql = 'SELECT * FROM subject_sessions WHERE 1=1';
    const params: any[] = [];

    if (classId) {
      sql += ' AND class_id = ?';
      params.push(classId);
    }

    if (date) {
      sql += ' AND date = ?';
      params.push(date);
    }

    if (teacherName) {
      sql += ' AND teacher_name = ?';
      params.push(teacherName);
    }

    sql += ' ORDER BY date DESC, created_at DESC';

    const rows = await query<any[]>(sql, params);

    const sessions = rows.map(r => ({
      id: r.id,
      classId: r.class_id,
      date: toLocalDateString(r.date),
      subject: r.subject,
      teacherName: r.teacher_name,
      teacherNip: r.teacher_nip,
      submittedAt: r.submitted_at,
      records: typeof r.records === 'string' ? JSON.parse(r.records) : (r.records || {}),
      notes: typeof r.notes === 'string' ? JSON.parse(r.notes) : (r.notes || {}),
      topicMaterial: r.topic_material
    }));

    return NextResponse.json({ success: true, count: sessions.length, data: sessions });
  } catch (error: any) {
    console.error('Error fetching subject sessions:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      classId,
      date,
      subject,
      teacherName,
      teacherNip,
      submittedAt,
      records,
      notes,
      topicMaterial
    } = body;

    const sessionId = id || `${date}_${classId}_${subject.replace(/[^a-zA-Z0-9]/g, '')}`;

    await query(`
      INSERT INTO subject_sessions (
        id, class_id, date, subject, teacher_name, teacher_nip,
        submitted_at, is_submitted, topic_material, records, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        submitted_at=VALUES(submitted_at),
        topic_material=VALUES(topic_material),
        records=VALUES(records),
        notes=VALUES(notes);
    `, [
      sessionId,
      classId,
      date || new Date().toISOString().split('T')[0],
      subject,
      teacherName,
      teacherNip || '-',
      submittedAt || new Date().toLocaleTimeString('id-ID'),
      topicMaterial || null,
      JSON.stringify(records || {}),
      JSON.stringify(notes || {})
    ]);

    // Simpan juga ke attendance_records secara bulk (tanpa duplikasi)
    if (records && typeof records === 'object') {
      const entries = Object.entries(records);
      if (entries.length > 0) {
        await query('DELETE FROM attendance_records WHERE session_id = ?', [sessionId]);
        const placeholders: string[] = [];
        const values: any[] = [];
        const sessionDate = date || toLocalDateString(new Date());

        for (const [studentId, status] of entries) {
          placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?)');
          values.push(
            sessionId,
            studentId,
            studentId,
            classId,
            sessionDate,
            subject,
            status,
            notes?.[studentId] || null
          );
        }

        await query(`
          INSERT INTO attendance_records (
            session_id, student_id, student_name, class_id, date, subject, status, note
          ) VALUES ${placeholders.join(', ')}
        `, values);
      }
    }

    return NextResponse.json({ success: true, id: sessionId, message: 'Presensi & jurnal mengajar berhasil disimpan di database!' });
  } catch (error: any) {
    console.error('Error saving subject session:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
