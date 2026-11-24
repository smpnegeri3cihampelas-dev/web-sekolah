import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

function formatWibDate(d: Date): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
  } catch {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

function toLocalDateString(val: any): string {
  if (!val) return formatWibDate(new Date());
  if (val instanceof Date && !isNaN(val.getTime())) {
    return formatWibDate(val);
  }
  if (typeof val === 'string') {
    if (val.includes('T')) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return formatWibDate(d);
    }
    const match = val.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    return val.split('T')[0];
  }
  return String(val);
}

function parseJsonArraySafe<T = any>(raw: any): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const examDate = searchParams.get('date');

    let sql = 'SELECT * FROM cbt_supervisor_schedules WHERE 1=1';
    const params: any[] = [];

    if (examDate) {
      sql += ' AND exam_date = ?';
      params.push(toLocalDateString(examDate));
    }

    sql += ' ORDER BY exam_date DESC, id ASC';

    const rows = await query<any[]>(sql, params);

    // Deduplicate by exam_date keeping the latest row
    const map = new Map<string, any>();
    for (const r of rows) {
      const cleanDate = toLocalDateString(r.exam_date);
      let isUserEdited = true;
      if (r.notes) {
        try {
          const parsedNotes = JSON.parse(r.notes);
          if (typeof parsedNotes?.isUserEdited === 'boolean') {
            isUserEdited = parsedNotes.isUserEdited;
          }
        } catch {}
      }

      map.set(cleanDate, {
        examDate: cleanDate,
        sessions: parseJsonArraySafe(r.sessions),
        entries: parseJsonArraySafe(r.entries),
        isUserEdited
      });
    }

    const schedules = Array.from(map.values());
    return NextResponse.json({ success: true, count: schedules.length, data: schedules });
  } catch (error: any) {
    console.error('Error fetching CBT supervisor schedules:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { examDate, sessions, entries, isUserEdited } = body || {};

    const cleanDate = toLocalDateString(examDate);
    const sessionsArr = Array.isArray(sessions) ? sessions : [];
    const entriesArr = Array.isArray(entries) ? entries : [];
    const notesJson = JSON.stringify({ isUserEdited: Boolean(isUserEdited) });

    const existingRows = await query<any[]>(
      'SELECT id FROM cbt_supervisor_schedules WHERE exam_date = ? ORDER BY id DESC',
      [cleanDate]
    );

    if (existingRows.length > 0) {
      const primaryId = existingRows[0].id;
      await query(
        `UPDATE cbt_supervisor_schedules
         SET sessions = ?, entries = ?, notes = ?
         WHERE id = ?`,
        [JSON.stringify(sessionsArr), JSON.stringify(entriesArr), notesJson, primaryId]
      );

      if (existingRows.length > 1) {
        const dupIds = existingRows.slice(1).map(r => r.id);
        await query(
          `DELETE FROM cbt_supervisor_schedules WHERE id IN (${dupIds.map(() => '?').join(',')})`,
          dupIds
        );
      }
    } else {
      await query(
        `INSERT INTO cbt_supervisor_schedules (exam_date, sessions, entries, notes)
         VALUES (?, ?, ?, ?)`,
        [cleanDate, JSON.stringify(sessionsArr), JSON.stringify(entriesArr), notesJson]
      );
    }

    return NextResponse.json({
      success: true,
      examDate: cleanDate,
      message: 'Jadwal pengawas ruang CBT berhasil disimpan di database!'
    });
  } catch (error: any) {
    console.error('Error saving CBT supervisor schedule:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
