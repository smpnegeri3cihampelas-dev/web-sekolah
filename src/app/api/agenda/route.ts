import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { OFFICIAL_KALDIK_SMPN3, DEFAULT_PDF_URL, DEFAULT_PDF_NAME, KaldikPdfInfo, getAgendaSortTime } from '@/lib/agendaConstants';

// Helper: Auto-seed 27 official kaldik items if table is empty
async function ensureAgendaSeeded() {
  const existing = await query<any[]>('SELECT COUNT(*) as count FROM agenda');
  const count = existing?.[0]?.count ?? 0;
  if (count === 0) {
    for (const item of OFFICIAL_KALDIK_SMPN3) {
      await query(
        `INSERT INTO agenda (id, name, date, category, status, semester, title)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           name = VALUES(name),
           date = VALUES(date),
           category = VALUES(category),
           status = VALUES(status),
           semester = VALUES(semester),
           title = VALUES(title)`,
        [
          item.id,
          item.name,
          item.date,
          item.category,
          item.status || 'Mendatang',
          item.semester || 'Semester 1',
          item.title || item.name
        ]
      );
    }
  }
}

export async function GET() {
  try {
    await ensureAgendaSeeded();

    const [rows, settingsRows] = await Promise.all([
      query<any[]>('SELECT * FROM agenda ORDER BY id ASC'),
      query<any[]>('SELECT setting_value FROM school_settings WHERE setting_key = "kaldikPdfInfo" LIMIT 1')
    ]);

    let pdfInfo: KaldikPdfInfo = {
      url: DEFAULT_PDF_URL,
      fileName: DEFAULT_PDF_NAME
    };

    if (settingsRows && settingsRows.length > 0 && settingsRows[0].setting_value) {
      try {
        const parsed = JSON.parse(settingsRows[0].setting_value);
        if (parsed && parsed.url) {
          pdfInfo = parsed;
        }
      } catch (err) {
        console.error('Failed to parse kaldikPdfInfo from DB:', err);
      }
    }

    const sortedRows = Array.isArray(rows)
      ? [...rows].sort((a: any, b: any) => {
          const timeA = getAgendaSortTime(a.date);
          const timeB = getAgendaSortTime(b.date);
          if (timeA !== timeB) return timeA - timeB;
          return (Number(a.id) || 0) - (Number(b.id) || 0);
        })
      : [];

    return NextResponse.json({
      success: true,
      data: sortedRows,
      pdfInfo
    });
  } catch (error: any) {
    console.error('Error fetching agenda:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check for bulk reset action
    if (body.action === 'reset') {
      await query('DELETE FROM agenda');
      for (const item of OFFICIAL_KALDIK_SMPN3) {
        await query(
          `INSERT INTO agenda (id, name, date, category, status, semester, title)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            item.name,
            item.date,
            item.category,
            item.status || 'Mendatang',
            item.semester || 'Semester 1',
            item.title || item.name
          ]
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Berhasil mereset kalender akademik ke 27 agenda resmi.'
      });
    }

    const { name, date, category, status, semester, title } = body;

    const result = await query(
      `INSERT INTO agenda (name, date, category, status, semester, title)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name || title || 'Agenda Baru',
        date || '',
        category || 'Akademik',
        status || 'Mendatang',
        semester || 'Semester 1',
        title || name || ''
      ]
    );

    const insertId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      insertId,
      data: {
        id: insertId,
        name: name || title || 'Agenda Baru',
        date: date || '',
        category: category || 'Akademik',
        status: status || 'Mendatang',
        semester: semester || 'Semester 1',
        title: title || name || ''
      }
    });
  } catch (error: any) {
    console.error('Error creating agenda:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    // 1. Action: update PDF document settings
    if (body.action === 'update_pdf') {
      const pdfInfo = body.pdfInfo;
      if (!pdfInfo || !pdfInfo.url) {
        return NextResponse.json({ success: false, error: 'Informasi PDF tidak lengkap' }, { status: 400 });
      }

      await query(
        `INSERT INTO school_settings (setting_key, setting_value)
         VALUES ('kaldikPdfInfo', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [JSON.stringify(pdfInfo)]
      );

      return NextResponse.json({
        success: true,
        message: 'Informasi dokumen PDF kalender berhasil disimpan ke database.',
        pdfInfo
      });
    }

    // 2. Action: reset PDF document settings
    if (body.action === 'reset_pdf') {
      await query('DELETE FROM school_settings WHERE setting_key = "kaldikPdfInfo"');
      return NextResponse.json({
        success: true,
        message: 'Dokumen PDF dikembalikan ke berkas bawaan server.',
        pdfInfo: { url: DEFAULT_PDF_URL, fileName: DEFAULT_PDF_NAME }
      });
    }

    // 3. Single Agenda Item Update
    const { id, name, title, date, category, status, semester } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID agenda wajib disertakan' }, { status: 400 });
    }

    await query(
      `UPDATE agenda SET
         name = ?,
         title = ?,
         date = ?,
         category = ?,
         status = ?,
         semester = ?
       WHERE id = ?`,
      [
        name || title || 'Agenda',
        title || name || 'Agenda',
        date || '',
        category || 'Akademik',
        status || 'Mendatang',
        semester || 'Semester 1',
        id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Agenda berhasil diperbarui di database.',
      data: { id, name, title, date, category, status, semester }
    });
  } catch (error: any) {
    console.error('Error updating agenda:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const idParam = searchParams.get('id');

    // Handle reset via DELETE ?action=reset
    if (action === 'reset') {
      await query('DELETE FROM agenda');
      for (const item of OFFICIAL_KALDIK_SMPN3) {
        await query(
          `INSERT INTO agenda (id, name, date, category, status, semester, title)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            item.name,
            item.date,
            item.category,
            item.status || 'Mendatang',
            item.semester || 'Semester 1',
            item.title || item.name
          ]
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Berhasil mereset kalender akademik ke 27 agenda resmi.'
      });
    }

    // Single item deletion
    let idToDelete = idParam ? parseInt(idParam, 10) : null;
    if (!idToDelete) {
      try {
        const body = await req.json();
        if (body.action === 'reset') {
          await query('DELETE FROM agenda');
          for (const item of OFFICIAL_KALDIK_SMPN3) {
            await query(
              `INSERT INTO agenda (id, name, date, category, status, semester, title)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                item.id,
                item.name,
                item.date,
                item.category,
                item.status || 'Mendatang',
                item.semester || 'Semester 1',
                item.title || item.name
              ]
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Berhasil mereset kalender akademik ke 27 agenda resmi.'
          });
        }
        if (body.id) {
          idToDelete = body.id;
        }
      } catch {}
    }

    if (!idToDelete) {
      return NextResponse.json({ success: false, error: 'ID agenda wajib disertakan' }, { status: 400 });
    }

    await query('DELETE FROM agenda WHERE id = ?', [idToDelete]);

    return NextResponse.json({
      success: true,
      message: `Agenda #${idToDelete} berhasil dihapus dari database.`,
      id: idToDelete
    });
  } catch (error: any) {
    console.error('Error deleting agenda:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
