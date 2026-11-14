import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DEFAULT_LEADERS, DEFAULT_TEACHERS, DEFAULT_DATA_POKOK, Leader, Teacher, DataPokok } from '@/lib/schoolConstants';

export async function GET() {
  try {
    // Ensure column definitions support compressed images and longer quotes
    try {
      await query(`ALTER TABLE leaders MODIFY COLUMN photo LONGTEXT, MODIFY COLUMN quote TEXT`);
      await query(`ALTER TABLE teachers MODIFY COLUMN photo LONGTEXT, MODIFY COLUMN quote TEXT`);
    } catch {}

    const [leadersRows, teachersRows, settingsRows] = await Promise.all([
      query<any[]>('SELECT * FROM leaders ORDER BY sort_order ASC, id ASC'),
      query<any[]>('SELECT * FROM teachers ORDER BY id ASC'),
      query<any[]>('SELECT setting_value FROM school_settings WHERE setting_key = "dataPokok" LIMIT 1')
    ]);

    // Format leaders
    const leaders: Leader[] = leadersRows.map(r => ({
      id: Number(r.id),
      name: r.name,
      role: r.role,
      badge: r.badge || '',
      nip: r.nip || '-',
      quote: r.quote || '',
      status: r.status || 'Aktif',
      photo: r.photo || '/teachers/default_avatar.svg',
      badgeColor: r.badge_color || r.badgeColor || 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10'
    }));

    // Format teachers
    const teachers: Teacher[] = teachersRows.map(r => ({
      id: Number(r.id),
      name: r.name,
      username: r.username || '',
      phone: r.phone || '',
      role: r.role || 'Guru Mata Pelajaran',
      subject: r.subject || 'Mata Pelajaran',
      category: r.category || 'MIPA',
      nip: r.nip || '-',
      photo: r.photo || '/teachers/default_avatar.svg',
      status: r.status || 'GTT / Honorer',
      active: Boolean(r.active !== 0 && r.active !== false),
      quote: r.quote || ''
    }));

    // Format Data Pokok
    let dataPokok: DataPokok = DEFAULT_DATA_POKOK;
    if (settingsRows && settingsRows.length > 0 && settingsRows[0].setting_value) {
      try {
        dataPokok = JSON.parse(settingsRows[0].setting_value);
      } catch (e) {
        dataPokok = DEFAULT_DATA_POKOK;
      }
    }

    return NextResponse.json({
      success: true,
      leaders: leaders.length > 0 ? leaders : DEFAULT_LEADERS,
      teachers: teachers.length > 0 ? teachers : DEFAULT_TEACHERS,
      dataPokok
    });
  } catch (error: any) {
    console.error('Error fetching school data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, teacher, dataPokok, action } = body;

    // Reset action
    if (action === 'reset' || type === 'reset') {
      return await handleResetSchoolData();
    }

    // Add new teacher
    if (type === 'teacher' || (!type && teacher)) {
      const t = teacher || body;
      const cleanName = String(t.name || 'Guru Baru').trim();
      const cleanSubject = String(t.subject || 'Mata Pelajaran').trim();
      const cleanRole = String(t.role || 'Guru Mata Pelajaran').trim();
      const cleanCategory = String(t.category || 'MIPA').trim();
      const cleanNip = String(t.nip || '-').trim();
      const cleanStatus = String(t.status || 'GTT / Honorer').trim();
      const photo = t.photo || '/teachers/default_avatar.svg';
      const quote = t.quote || '';
      const phone = t.phone || '';
      const username = t.username || cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const active = t.active !== false ? 1 : 0;
      const password = t.password || 'spentic123';

      const result = await query(
        `INSERT INTO teachers (name, username, phone, role, subject, category, nip, photo, status, active, quote, password)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [cleanName, username, phone, cleanRole, cleanSubject, cleanCategory, cleanNip, photo, cleanStatus, active, quote, password]
      );

      const insertId = (result as any).insertId;
      const newTeacher: Teacher = {
        id: insertId,
        name: cleanName,
        username,
        phone,
        role: cleanRole,
        subject: cleanSubject,
        category: cleanCategory,
        nip: cleanNip,
        photo,
        status: cleanStatus,
        active: Boolean(active),
        quote
      };

      return NextResponse.json({
        success: true,
        data: newTeacher,
        insertId,
        message: `Guru "${cleanName}" berhasil ditambahkan ke database cloud`
      });
    }

    // Update Data Pokok
    if (type === 'dataPokok' && dataPokok) {
      await query(
        `INSERT INTO school_settings (setting_key, setting_value)
         VALUES ('dataPokok', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [JSON.stringify(dataPokok)]
      );

      return NextResponse.json({
        success: true,
        message: 'Data pokok sekolah berhasil disimpan ke database cloud'
      });
    }

    return NextResponse.json({ success: false, error: 'Tipe permintaan POST tidak valid' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in POST /api/school:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { type, id, leader, teacher, dataPokok } = body;

    // 1. Update Leader
    if (type === 'leader') {
      const targetId = id || leader?.id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'ID pimpinan diperlukan' }, { status: 400 });
      }

      const l = leader || body;
      await query(
        `UPDATE leaders 
         SET name = COALESCE(?, name),
             role = COALESCE(?, role),
             badge = COALESCE(?, badge),
             nip = COALESCE(?, nip),
             quote = COALESCE(?, quote),
             status = COALESCE(?, status),
             photo = COALESCE(?, photo),
             badge_color = COALESCE(?, badge_color)
         WHERE id = ?`,
        [
          l.name || null,
          l.role || null,
          l.badge !== undefined ? l.badge : null,
          l.nip !== undefined ? l.nip : null,
          l.quote !== undefined ? l.quote : null,
          l.status !== undefined ? l.status : null,
          l.photo || null,
          l.badgeColor || l.badge_color || null,
          targetId
        ]
      );

      return NextResponse.json({
        success: true,
        message: `Data pimpinan ID ${targetId} berhasil diperbarui di database cloud`
      });
    }

    // 2. Update Teacher
    if (type === 'teacher') {
      const targetId = id || teacher?.id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'ID guru diperlukan' }, { status: 400 });
      }

      const t = teacher || body;
      const activeVal = t.active !== undefined ? (t.active ? 1 : 0) : null;

      await query(
        `UPDATE teachers 
         SET name = COALESCE(?, name),
             role = COALESCE(?, role),
             subject = COALESCE(?, subject),
             category = COALESCE(?, category),
             nip = COALESCE(?, nip),
             photo = COALESCE(?, photo),
             status = COALESCE(?, status),
             active = COALESCE(?, active),
             quote = COALESCE(?, quote),
             phone = COALESCE(?, phone),
             username = COALESCE(?, username),
             password = COALESCE(?, password)
         WHERE id = ?`,
        [
          t.name || null,
          t.role || null,
          t.subject || null,
          t.category || null,
          t.nip !== undefined ? t.nip : null,
          t.photo || null,
          t.status || null,
          activeVal,
          t.quote !== undefined ? t.quote : null,
          t.phone !== undefined ? t.phone : null,
          t.username || null,
          t.password || null,
          targetId
        ]
      );

      return NextResponse.json({
        success: true,
        message: `Data guru ID ${targetId} berhasil diperbarui di database cloud`
      });
    }

    // 3. Update Data Pokok
    if (type === 'dataPokok') {
      const dp = dataPokok || body.data;
      if (!dp) {
        return NextResponse.json({ success: false, error: 'Data pokok diperlukan' }, { status: 400 });
      }

      await query(
        `INSERT INTO school_settings (setting_key, setting_value)
         VALUES ('dataPokok', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [JSON.stringify(dp)]
      );

      return NextResponse.json({
        success: true,
        message: 'Data pokok sekolah berhasil diperbarui di database cloud'
      });
    }

    return NextResponse.json({ success: false, error: 'Tipe permintaan PUT tidak valid' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in PUT /api/school:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { type, id, action } = body;

    // Reset action
    if (action === 'reset' || type === 'reset') {
      return await handleResetSchoolData();
    }

    // Delete teacher
    if (type === 'teacher' || (!type && id)) {
      const targetId = id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'ID guru diperlukan' }, { status: 400 });
      }

      await query(`DELETE FROM teachers WHERE id = ?`, [targetId]);

      return NextResponse.json({
        success: true,
        message: `Guru ID ${targetId} berhasil dihapus dari database cloud`
      });
    }

    return NextResponse.json({ success: false, error: 'Tipe permintaan DELETE tidak valid' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in DELETE /api/school:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handleResetSchoolData() {
  try {
    // 1. Reset Leaders
    await query(`TRUNCATE TABLE leaders`);
    for (let i = 0; i < DEFAULT_LEADERS.length; i++) {
      const l = DEFAULT_LEADERS[i];
      await query(
        `INSERT INTO leaders (id, name, role, badge, nip, quote, status, photo, badge_color, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          l.id,
          l.name,
          l.role,
          l.badge || '',
          l.nip,
          l.quote,
          l.status,
          l.photo,
          l.badgeColor || 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10',
          i + 1
        ]
      );
    }

    // 2. Reset Teachers
    await query(`TRUNCATE TABLE teachers`);
    for (const t of DEFAULT_TEACHERS) {
      const username = t.username || t.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      await query(
        `INSERT INTO teachers (id, name, username, phone, role, subject, category, nip, photo, status, active, quote, password)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'spentic123')`,
        [
          t.id,
          t.name,
          username,
          t.phone || '',
          t.role || 'Guru Mata Pelajaran',
          t.subject,
          t.category || 'MIPA',
          t.nip,
          t.photo,
          t.status,
          t.active !== false ? 1 : 0,
          t.quote || ''
        ]
      );
    }

    // 3. Reset Data Pokok
    await query(
      `INSERT INTO school_settings (setting_key, setting_value)
       VALUES ('dataPokok', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [JSON.stringify(DEFAULT_DATA_POKOK)]
    );

    return NextResponse.json({
      success: true,
      message: `Database berhasil direset ke ${DEFAULT_LEADERS.length} pimpinan, ${DEFAULT_TEACHERS.length} guru, dan data pokok default`
    });
  } catch (error: any) {
    console.error('Error resetting school data in DB:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
