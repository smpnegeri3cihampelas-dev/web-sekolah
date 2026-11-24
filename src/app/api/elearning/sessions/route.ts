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

    const [rows, piketSettingRows, piketJournalRows] = await Promise.all([
      query<any[]>(sql, params),
      query<any[]>('SELECT setting_value FROM school_settings WHERE setting_key = "piketDutyTeacher" LIMIT 1').catch(() => []),
      query<any[]>('SELECT officer_name FROM piket_journal ORDER BY date DESC, id DESC LIMIT 1').catch(() => [])
    ]);

    const piketDutyTeacher =
      piketSettingRows?.[0]?.setting_value ||
      piketJournalRows?.[0]?.officer_name ||
      undefined;

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

    return NextResponse.json({
      success: true,
      count: sessions.length,
      data: sessions,
      piketDutyTeacher
    });
  } catch (error: any) {
    console.error('Error fetching subject sessions:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Action khusus: Simpan petugas meja piket aktif ke school_settings & piket_journal
    if (body.action === 'update_piket_officer' && body.piketDutyTeacher) {
      const officerName = String(body.piketDutyTeacher).trim();
      const targetDate = toLocalDateString(body.date || new Date());

      await query(
        `INSERT INTO school_settings (setting_key, setting_value)
         VALUES ('piketDutyTeacher', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [officerName]
      );

      try {
        const existingJournal = await query<any[]>(
          'SELECT id FROM piket_journal WHERE date = ? LIMIT 1',
          [targetDate]
        );
        if (existingJournal && existingJournal.length > 0) {
          await query(
            'UPDATE piket_journal SET officer_name = ? WHERE id = ?',
            [officerName, existingJournal[0].id]
          );
        } else {
          await query(
            'INSERT INTO piket_journal (date, officer_name, officer_nip, notes) VALUES (?, ?, ?, ?)',
            [targetDate, officerName, body.officerNip || '-', 'Petugas Meja Piket Harian']
          );
        }
      } catch {}

      return NextResponse.json({
        success: true,
        piketDutyTeacher: officerName,
        message: 'Petugas Meja Piket berhasil disinkronkan ke database!'
      });
    }

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

    const cleanDate = toLocalDateString(date || new Date());
    const sessionId = id || `${cleanDate}_${classId}_${(subject || 'Mapel').replace(/[^a-zA-Z0-9]/g, '')}`;

    await query(`
      INSERT INTO subject_sessions (
        id, class_id, date, subject, teacher_name, teacher_nip,
        submitted_at, is_submitted, topic_material, records, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        subject=VALUES(subject),
        teacher_name=VALUES(teacher_name),
        teacher_nip=VALUES(teacher_nip),
        submitted_at=VALUES(submitted_at),
        topic_material=VALUES(topic_material),
        records=VALUES(records),
        notes=VALUES(notes);
    `, [
      sessionId,
      classId,
      cleanDate,
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

        for (const [studentId, status] of entries) {
          placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?)');
          values.push(
            sessionId,
            studentId,
            studentId,
            classId,
            cleanDate,
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

      // Jika sesi ini disimpan oleh Meja Piket, sinkronkan juga ringkasan ke tabel piket_journal
      if (String(sessionId).endsWith('_PIKET') || String(subject).toLowerCase().includes('piket')) {
        try {
          let lateCount = 0, sickCount = 0, permitCount = 0, alphaCount = 0;
          for (const st of Object.values(records)) {
            if (st === 'T') lateCount++;
            else if (st === 'S') sickCount++;
            else if (st === 'I') permitCount++;
            else if (st === 'A') alphaCount++;
          }
          const cleanOfficer = String(teacherName || 'Petugas Piket').replace(/\s*\(Guru Piket.*\)$/i, '').trim();
          const existingJournal = await query<any[]>(
            'SELECT id FROM piket_journal WHERE date = ? LIMIT 1',
            [cleanDate]
          );
          if (existingJournal && existingJournal.length > 0) {
            await query(
              `UPDATE piket_journal
               SET officer_name = ?, total_late = ?, total_sick = ?, total_permit = ?, total_alpha = ?
               WHERE id = ?`,
              [cleanOfficer, lateCount, sickCount, permitCount, alphaCount, existingJournal[0].id]
            );
          } else {
            await query(
              `INSERT INTO piket_journal (date, officer_name, officer_nip, total_late, total_sick, total_permit, total_alpha, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [cleanDate, cleanOfficer, teacherNip || '-', lateCount, sickCount, permitCount, alphaCount, `Presensi Piket Kelas ${classId}`]
            );
          }
        } catch {}
      }
    }

    return NextResponse.json({ success: true, id: sessionId, message: 'Presensi & jurnal mengajar berhasil disimpan di database!' });
  } catch (error: any) {
    console.error('Error saving subject session:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
