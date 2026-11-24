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

function parseRecordsSafe(raw: any): Record<string, 'H' | 'S' | 'I' | 'A'> {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function isPlaceholderSupervisor(name?: string): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  return trimmed === '' || trimmed === 'Guru Pengawas' || trimmed === 'Guru Pengawas Ruang';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomName = searchParams.get('room');
    const examId = searchParams.get('examId');
    const date = searchParams.get('date');

    let sql = 'SELECT * FROM cbt_room_attendances WHERE 1=1';
    const params: any[] = [];

    if (roomName) {
      sql += ' AND room_name = ?';
      params.push(roomName);
    }

    if (examId) {
      sql += ' AND exam_id = ?';
      params.push(examId);
    }

    if (date) {
      sql += ' AND date = ?';
      params.push(toLocalDateString(date));
    }

    sql += ' ORDER BY id ASC';

    const rows = await query<any[]>(sql, params);

    // Deduplicate by composite key `${roomName}_${examId}_${date}` keeping the latest row
    const map = new Map<string, any>();
    for (const r of rows) {
      const cleanDate = toLocalDateString(r.date);
      const key = `${r.room_name}_${r.exam_id}_${cleanDate}`;
      map.set(key, {
        roomName: r.room_name,
        examId: r.exam_id,
        examTitle: r.exam_title || 'Ujian CBT',
        date: cleanDate,
        supervisorName: r.supervisor_name || 'Guru Pengawas Ruang',
        token: r.token || '',
        records: parseRecordsSafe(r.records),
        notes: r.notes || 'Ujian berlangsung tertib, aman, dan lancar tanpa kendala teknis.',
        isBapSubmitted: Boolean(r.is_bap_submitted),
        submittedAt: r.submitted_at || undefined
      });
    }

    const attendances = Array.from(map.values());
    return NextResponse.json({ success: true, count: attendances.length, data: attendances });
  } catch (error: any) {
    console.error('Error fetching CBT room attendances:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function upsertRoomAttendance(item: any) {
  const {
    roomName,
    examId,
    examTitle,
    date,
    supervisorName,
    token,
    records,
    notes,
    isBapSubmitted,
    submittedAt,
    mergeRecordsOnly
  } = item || {};

  if (!roomName || !examId) {
    throw new Error('roomName dan examId wajib disertakan');
  }

  const cleanDate = toLocalDateString(date);
  const incomingRecords = parseRecordsSafe(records);

  const existingRows = await query<any[]>(
    'SELECT * FROM cbt_room_attendances WHERE room_name = ? AND exam_id = ? AND date = ? ORDER BY id DESC',
    [roomName, examId, cleanDate]
  );

  if (existingRows.length > 0) {
    const primary = existingRows[0];
    const existingRecords = parseRecordsSafe(primary.records);

    // If mergeRecordsOnly is set (e.g. when a student auto-marks themselves present), merge without overwriting supervisor statuses
    const finalRecords = mergeRecordsOnly
      ? { ...incomingRecords, ...existingRecords, ...incomingRecords }
      : { ...existingRecords, ...incomingRecords };

    const finalSupervisor = !isPlaceholderSupervisor(supervisorName)
      ? supervisorName.trim()
      : !isPlaceholderSupervisor(primary.supervisor_name)
      ? primary.supervisor_name
      : (supervisorName || 'Guru Pengawas Ruang');

    const finalNotes =
      notes !== undefined && notes !== null && String(notes).trim() !== ''
        ? String(notes)
        : (primary.notes || 'Ujian berlangsung tertib, aman, dan lancar tanpa kendala teknis.');

    const finalIsBap =
      typeof isBapSubmitted === 'boolean'
        ? (isBapSubmitted ? 1 : 0)
        : (primary.is_bap_submitted ? 1 : 0);

    const finalSubmittedAt =
      isBapSubmitted === false
        ? null
        : submittedAt !== undefined
        ? (submittedAt || null)
        : (primary.submitted_at || null);

    await query(
      `UPDATE cbt_room_attendances
       SET exam_title = ?, supervisor_name = ?, token = ?, records = ?, notes = ?, is_bap_submitted = ?, submitted_at = ?
       WHERE id = ?`,
      [
        examTitle || primary.exam_title || 'Ujian CBT',
        finalSupervisor,
        token || primary.token || '',
        JSON.stringify(finalRecords),
        finalNotes,
        finalIsBap,
        finalSubmittedAt,
        primary.id
      ]
    );

    // Clean up any older duplicate rows for the same room + exam + date
    if (existingRows.length > 1) {
      const duplicateIds = existingRows.slice(1).map(r => r.id);
      await query(
        `DELETE FROM cbt_room_attendances WHERE id IN (${duplicateIds.map(() => '?').join(',')})`,
        duplicateIds
      );
    }

    return primary.id;
  }

  const res = await query<any>(
    `INSERT INTO cbt_room_attendances (
      room_name, exam_id, exam_title, date, supervisor_name, token, records, notes, is_bap_submitted, submitted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      roomName,
      examId,
      examTitle || 'Ujian CBT',
      cleanDate,
      supervisorName || 'Guru Pengawas Ruang',
      token || '',
      JSON.stringify(incomingRecords),
      notes || 'Ujian berlangsung tertib, aman, dan lancar tanpa kendala teknis.',
      isBapSubmitted ? 1 : 0,
      submittedAt || null
    ]
  );

  return res?.insertId;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (Array.isArray(body?.attendances)) {
      for (const att of body.attendances) {
        if (att?.roomName && att?.examId) {
          await upsertRoomAttendance(att);
        }
      }
      return NextResponse.json({
        success: true,
        message: `${body.attendances.length} presensi & BAP ruang CBT berhasil disinkronkan ke database!`
      });
    }

    await upsertRoomAttendance(body);
    return NextResponse.json({
      success: true,
      message: 'Presensi & Berita Acara Pelaksanaan (BAP) ruang ujian berhasil disimpan di database!'
    });
  } catch (error: any) {
    console.error('Error saving CBT room attendance:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
