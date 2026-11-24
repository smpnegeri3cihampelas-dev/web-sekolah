import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DEFAULT_LEADERS, DEFAULT_TEACHERS, DEFAULT_DATA_POKOK, Leader, Teacher, DataPokok, isTendikOrTu } from '@/lib/schoolConstants';

function cleanTeacherUsername(name: string): string {
  const rawName = name || '';
  const base = rawName.split(',')[0].trim();
  const withoutPrefix = base.replace(/^(H\.|Hj\.|Drs\.|Dra\.|Dr\.|Prof\.|Ir\.|H\b|Hj\b)\s*/gi, '');
  const clean = withoutPrefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return clean || 'guru';
}

export async function GET() {
  try {
    // Ensure column definitions support compressed images, longer quotes, and nuptk
    try {
      await query(`ALTER TABLE leaders MODIFY COLUMN photo LONGTEXT, MODIFY COLUMN quote TEXT`);
      await query(`ALTER TABLE teachers MODIFY COLUMN photo LONGTEXT, MODIFY COLUMN quote TEXT`);
      await query(`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS nuptk VARCHAR(100) DEFAULT NULL`);
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
    const teachers: Teacher[] = teachersRows.map(r => {
      const tendik = isTendikOrTu(r);
      return {
        id: Number(r.id),
        name: r.name,
        username: tendik ? undefined : (r.username || cleanTeacherUsername(r.name)),
        phone: r.phone || '',
        role: r.role || 'Guru Mata Pelajaran',
        subject: r.subject || 'Mata Pelajaran',
        category: r.category || 'MIPA',
        nip: r.nip || '-',
        nuptk: r.nuptk || undefined,
        photo: r.photo || '/teachers/default_avatar.svg',
        status: r.status || 'GTT / Honorer',
        active: Boolean(r.active !== 0 && r.active !== false),
        quote: r.quote || '',
        password: tendik ? undefined : (r.password || 'guru123')
      };
    });

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
      const cleanRole = String(t.role || cleanSubject || 'Guru Mata Pelajaran').trim();
      const cleanCategory = String(t.category || 'MIPA').trim();
      const cleanNip = String(t.nip || '-').trim();
      const cleanNuptk = t.nuptk ? String(t.nuptk).trim() : null;
      const cleanStatus = String(t.status || 'GTT / Honorer').trim();
      const photo = t.photo || '/teachers/default_avatar.svg';
      const quote = t.quote || '';
      const phone = t.phone || '';
      const isTendik = isTendikOrTu({ category: cleanCategory, subject: cleanSubject, role: cleanRole, status: cleanStatus });
      const username = isTendik ? null : cleanTeacherUsername(cleanName);
      const active = t.active !== false ? 1 : 0;
      const password = isTendik ? null : (t.password || 'guru123');

      try {
        await query(`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS nuptk VARCHAR(100) DEFAULT NULL`);
      } catch {}

      const result = await query(
        `INSERT INTO teachers (name, username, phone, role, subject, category, nip, nuptk, photo, status, active, quote, password)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [cleanName, username, phone, cleanRole, cleanSubject, cleanCategory, cleanNip, cleanNuptk, photo, cleanStatus, active, quote, password]
      );

      // Sinkronkan akun guru baru ke tabel users (HANYA untuk Guru Pendidik, BUKAN TU / Tenaga Kependidikan)
      if (!isTendik && username && password) {
        try {
          const existingUsers = await query<any[]>(
            `SELECT id FROM users WHERE role = 'guru_mapel' AND (LOWER(username) = ? OR (identifier IS NOT NULL AND identifier != '-' AND identifier = ?)) LIMIT 1`,
            [username.toLowerCase(), cleanNip]
          );
          if (existingUsers.length > 0) {
            await query(
              `UPDATE users SET username = ?, password = ?, name = ?, identifier = ?, subject = ?, phone = ?, status = ? WHERE id = ?`,
              [username, password, cleanName, cleanNip, cleanSubject, phone || null, active ? 'active' : 'inactive', existingUsers[0].id]
            );
          } else {
            await query(
              `INSERT INTO users (username, password, name, role, identifier, subject, phone, status)
               VALUES (?, ?, ?, 'guru_mapel', ?, ?, ?, ?)`,
              [username, password, cleanName, cleanNip, cleanSubject, phone || null, active ? 'active' : 'inactive']
            );
          }
        } catch (err) {
          console.warn('Could not sync new teacher to users table:', err);
        }
      }

      const insertId = (result as any).insertId;
      const newTeacher: Teacher = {
        id: insertId,
        name: cleanName,
        username: username || undefined,
        phone,
        role: cleanRole,
        subject: cleanSubject,
        category: cleanCategory,
        nip: cleanNip,
        nuptk: cleanNuptk || undefined,
        photo,
        status: cleanStatus,
        active: Boolean(active),
        quote,
        password: password || undefined
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
    const { type, id, leader, teacher, dataPokok, action } = body;

    // Standardize all teacher usernames without title and combined, plus default passwords to guru123
    if (action === 'standardize_usernames' || action === 'standardize_all') {
      const rows = await query<any[]>('SELECT id, name FROM teachers');
      for (const row of rows) {
        const clean = cleanTeacherUsername(row.name);
        await query(
          'UPDATE teachers SET username = ?, password = IF(password = "spentic123" OR password IS NULL OR password = "", "guru123", password) WHERE id = ?',
          [clean, row.id]
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Username dan password seluruh guru berhasil distandarisasi tanpa gelar dan disatukan di database MariaDB'
      });
    }

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

      // Sinkronkan foto pimpinan ke tabel teachers jika nama cocok
      if (l.photo && l.name) {
        try {
          await query(
            `UPDATE teachers SET photo = ? WHERE LOWER(name) = LOWER(?)`,
            [l.photo, String(l.name).trim()]
          );
        } catch {}
      }

      return NextResponse.json({
        success: true,
        message: `Data pimpinan ID ${targetId} berhasil diperbarui di database cloud`
      });
    }

    // 2. Update Teacher
    if (type === 'teacher') {
      const t = teacher || body;
      const targetId = id || t?.id;
      const targetNip = t?.nip ? String(t.nip).trim() : null;
      const targetUsername = t?.username ? String(t.username).trim() : (t?.name ? cleanTeacherUsername(String(t.name)) : null);

      if (!targetId && !targetNip && !targetUsername) {
        return NextResponse.json({ success: false, error: 'ID, NIP, atau username guru diperlukan' }, { status: 400 });
      }

      // Ambil data guru lama sebelum update untuk pencocokan sinkronisasi tabel users
      const oldRows = await query<any[]>(
        `SELECT id, name, nip, nuptk, username, subject, role, category, status, phone, active, password FROM teachers
         WHERE id = ? OR (nip IS NOT NULL AND nip != '-' AND nip = ?) OR username = ? LIMIT 1`,
        [targetId || 0, targetNip || '', targetUsername || '']
      );
      const oldTeacher = oldRows[0];

      const effectiveCategory = t.category || oldTeacher?.category || 'MIPA';
      const effectiveSubjectForCheck = t.subject || oldTeacher?.subject || '';
      const effectiveRoleForCheck = t.role || oldTeacher?.role || '';
      const effectiveStatusForCheck = t.status || oldTeacher?.status || '';
      const isTendik = isTendikOrTu({
        category: effectiveCategory,
        subject: effectiveSubjectForCheck,
        role: effectiveRoleForCheck,
        status: effectiveStatusForCheck
      });

      const activeVal = t.active !== undefined ? (t.active ? 1 : 0) : null;

      await query(
        `UPDATE teachers 
         SET name = COALESCE(?, name),
             role = COALESCE(?, role),
             subject = COALESCE(?, subject),
             category = COALESCE(?, category),
             nip = COALESCE(?, nip),
             nuptk = COALESCE(?, nuptk),
             photo = COALESCE(?, photo),
             status = COALESCE(?, status),
             active = COALESCE(?, active),
             quote = COALESCE(?, quote),
             phone = COALESCE(?, phone),
             username = ?,
             password = COALESCE(?, password)
         WHERE id = ? OR (nip IS NOT NULL AND nip != '-' AND nip = ?) OR username = ?`,
        [
          t.name || null,
          t.role || null,
          t.subject || null,
          t.category || null,
          t.nip !== undefined ? t.nip : null,
          t.nuptk !== undefined ? (t.nuptk || null) : null,
          t.photo || null,
          t.status || null,
          activeVal,
          t.quote !== undefined ? t.quote : null,
          t.phone !== undefined ? t.phone : null,
          isTendik ? null : (targetUsername || oldTeacher?.username || null),
          isTendik ? null : (t.password || null),
          targetId || 0,
          targetNip || '',
          targetUsername || ''
        ]
      );

      // Sinkronkan foto guru ke tabel leaders jika guru tersebut juga menjabat pimpinan
      if (t.photo && (t.name || oldTeacher?.name)) {
        try {
          await query(
            `UPDATE leaders SET photo = ? WHERE LOWER(name) = LOWER(?)`,
            [t.photo, String(t.name || oldTeacher?.name).trim()]
          );
        } catch {}
      }

      // Sinkronkan perubahan ke tabel users (Hapus dari users jika TU/Tendik, atau update/insert jika Guru Mapel)
      try {
        const effectiveName = t.name ? String(t.name).trim() : (oldTeacher?.name || '');
        const effectiveUsername = targetUsername || oldTeacher?.username || cleanTeacherUsername(effectiveName);
        const oldUsername = oldTeacher?.username || cleanTeacherUsername(oldTeacher?.name || effectiveName);
        const oldNipClean = (oldTeacher?.nip || '').replace(/\s+/g, '');

        if (isTendik) {
          await query(
            `DELETE FROM users
             WHERE role = 'guru_mapel'
               AND (
                 LOWER(username) = ?
                 OR LOWER(username) = ?
                 OR (REPLACE(identifier, ' ', '') = ? AND ? != '' AND ? != '-')
                 OR name = ?
               )`,
            [oldUsername.toLowerCase(), effectiveUsername.toLowerCase(), oldNipClean, oldNipClean, oldNipClean, oldTeacher?.name || effectiveName]
          );
        } else {
          const effectiveNip = t.nip !== undefined ? String(t.nip).trim() : (oldTeacher?.nip || '-');
          const effectiveSubject = t.subject ? String(t.subject).trim() : (oldTeacher?.subject || 'Mata Pelajaran');
          const effectivePhone = t.phone !== undefined ? (t.phone ? String(t.phone).trim() : null) : (oldTeacher?.phone || null);
          const effectiveStatus = t.active !== undefined
            ? (t.active ? 'active' : 'inactive')
            : ((oldTeacher?.active === 0 || oldTeacher?.active === false) ? 'inactive' : 'active');
          const effectivePassword = t.password ? String(t.password).trim() : (oldTeacher?.password || 'guru123');

          const matchedUsers = await query<any[]>(
            `SELECT id FROM users
             WHERE role = 'guru_mapel'
               AND (
                 LOWER(username) = ?
                 OR LOWER(username) = ?
                 OR (REPLACE(identifier, ' ', '') = ? AND ? != '' AND ? != '-')
                 OR name = ?
               )
             LIMIT 1`,
            [oldUsername.toLowerCase(), effectiveUsername.toLowerCase(), oldNipClean, oldNipClean, oldNipClean, oldTeacher?.name || effectiveName]
          );

          if (matchedUsers.length > 0) {
            await query(
              `UPDATE users
               SET username = ?, password = ?, name = ?, identifier = ?, subject = ?, phone = ?, status = ?
               WHERE id = ?`,
              [effectiveUsername, effectivePassword, effectiveName, effectiveNip, effectiveSubject, effectivePhone, effectiveStatus, matchedUsers[0].id]
            );
          } else if (effectiveName) {
            await query(
              `INSERT INTO users (username, password, name, role, identifier, subject, phone, status)
               VALUES (?, ?, ?, 'guru_mapel', ?, ?, ?, ?)`,
              [effectiveUsername, effectivePassword, effectiveName, effectiveNip, effectiveSubject, effectivePhone, effectiveStatus]
            );
          }
        }
      } catch (err) {
        console.warn('Could not sync updated teacher to users table:', err);
      }

      return NextResponse.json({
        success: true,
        message: `Data guru "${t.name || targetId || targetUsername}" berhasil diperbarui di database cloud`
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

      const oldRows = await query<any[]>(`SELECT name, nip, username FROM teachers WHERE id = ? LIMIT 1`, [targetId]);
      await query(`DELETE FROM teachers WHERE id = ?`, [targetId]);

      if (oldRows.length > 0) {
        try {
          const tr = oldRows[0];
          const uname = tr.username || cleanTeacherUsername(tr.name || '');
          const cleanNip = (tr.nip || '').replace(/\s+/g, '');
          await query(
            `DELETE FROM users WHERE role = 'guru_mapel' AND (LOWER(username) = ? OR (REPLACE(identifier, ' ', '') = ? AND ? != '' AND ? != '-') OR name = ?)`,
            [uname.toLowerCase(), cleanNip, cleanNip, cleanNip, tr.name || '']
          );
        } catch {}
      }

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

    // 2. Reset Teachers & TU Staff
    await query(`TRUNCATE TABLE teachers`);
    await query(`DELETE FROM users WHERE role = 'guru_mapel'`);
    for (const t of DEFAULT_TEACHERS) {
      const tendik = isTendikOrTu(t);
      const username = tendik ? null : (t.username || cleanTeacherUsername(t.name));
      const password = tendik ? null : (t.password || 'guru123');
      await query(
        `INSERT INTO teachers (id, name, username, phone, role, subject, category, nip, nuptk, photo, status, active, quote, password)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id,
          t.name,
          username,
          t.phone || '',
          t.role || 'Guru Mata Pelajaran',
          t.subject,
          t.category || 'MIPA',
          t.nip,
          t.nuptk || null,
          t.photo,
          t.status,
          t.active !== false ? 1 : 0,
          t.quote || '',
          password
        ]
      );
      if (!tendik && username && password) {
        await query(
          `INSERT INTO users (username, password, name, role, identifier, subject, phone, status)
           VALUES (?, ?, ?, 'guru_mapel', ?, ?, ?, ?)`,
          [
            username,
            password,
            t.name,
            t.nip || '-',
            t.subject || 'Mata Pelajaran',
            t.phone || null,
            t.active !== false ? 'active' : 'inactive'
          ]
        );
      }
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
