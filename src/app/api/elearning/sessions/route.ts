import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
      date: typeof r.date === 'string' ? r.date : r.date.toISOString().split('T')[0],
      subject: r.subject,
      teacherName: r.teacher_name,
      teacherNip: r.teacher_nip,
      submittedAt: r.submitted_at,
      records: r.records ? JSON.parse(r.records) : {},
      notes: r.notes ? JSON.parse(r.notes) : {},
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

    // Simpan juga ke attendance_records jika ada detail presensi
    if (records && typeof records === 'object') {
      for (const [studentId, status] of Object.entries(records)) {
        await query(`
          INSERT INTO attendance_records (
            session_id, student_id, student_name, class_id, date, subject, status, note
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE status=VALUES(status), note=VALUES(note);
        `, [
          sessionId,
          studentId,
          studentId, // fallback name jika tidak disediakan
          classId,
          date || new Date().toISOString().split('T')[0],
          subject,
          status,
          notes?.[studentId] || null
        ]);
      }
    }

    return NextResponse.json({ success: true, id: sessionId, message: 'Presensi & jurnal mengajar berhasil disimpan di database!' });
  } catch (error: any) {
    console.error('Error saving subject session:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
