import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DEFAULT_SCHOOL_IDENTITY, SchoolIdentity } from '@/lib/settingsConstants';
import { OFFICIAL_KALDIK_SMPN3 } from '@/lib/agendaConstants';
import { DEFAULT_GALLERY_PHOTOS } from '@/lib/galleryConstants';
import { DEFAULT_LEADERS, DEFAULT_TEACHERS, DEFAULT_DATA_POKOK, isTendikOrTu } from '@/lib/schoolConstants';
import { DEFAULT_WARTA } from '@/lib/wartaConstants';

function cleanTeacherUsername(name: string): string {
  const rawName = name || '';
  const base = rawName.split(',')[0].trim();
  const withoutPrefix = base.replace(/^(H\.|Hj\.|Drs\.|Dra\.|Dr\.|Prof\.|Ir\.|H\b|Hj\b)\s*/gi, '');
  const clean = withoutPrefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return clean || 'guru';
}

// Helper: Ensure school_settings table exists and seed default identity if missing
async function ensureSettingsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS school_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const existing = await query<any[]>('SELECT setting_value FROM school_settings WHERE setting_key = "schoolIdentity" LIMIT 1');
    if (!existing || existing.length === 0 || !existing[0].setting_value) {
      await query(
        `INSERT INTO school_settings (setting_key, setting_value)
         VALUES ('schoolIdentity', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [JSON.stringify(DEFAULT_SCHOOL_IDENTITY)]
      );
    }
  } catch (err) {
    console.error('Error ensuring settings table:', err);
  }
}

export async function GET() {
  try {
    await ensureSettingsTable();

    const [identityRows, passRows, adminUserRows] = await Promise.all([
      query<any[]>('SELECT setting_value, updated_at FROM school_settings WHERE setting_key = "schoolIdentity" LIMIT 1'),
      query<any[]>('SELECT setting_value FROM school_settings WHERE setting_key = "adminPassword" LIMIT 1'),
      query<any[]>('SELECT password FROM users WHERE role = "admin" OR username = "admin" LIMIT 1')
    ]);

    let identity: SchoolIdentity = DEFAULT_SCHOOL_IDENTITY;
    let updatedAt = '';

    if (identityRows && identityRows.length > 0 && identityRows[0].setting_value) {
      try {
        const parsed = JSON.parse(identityRows[0].setting_value);
        identity = { ...DEFAULT_SCHOOL_IDENTITY, ...parsed };
        updatedAt = identityRows[0].updated_at || '';
      } catch {}
    }

    const currentAdminPass = adminUserRows?.[0]?.password || passRows?.[0]?.setting_value || 'admin123';
    const hasCustomPassword = currentAdminPass !== 'admin123';

    return NextResponse.json({
      success: true,
      identity,
      hasCustomPassword,
      updatedAt
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSettingsTable();
    const body = await req.json();
    const action = body.action || '';

    // 1. Action: Update School Identity
    if (action === 'update_identity' || body.identity) {
      const idData = body.identity || body;
      const cleanIdentity: SchoolIdentity = {
        schoolName: String(idData.schoolName || DEFAULT_SCHOOL_IDENTITY.schoolName).trim(),
        npsn: String(idData.npsn || DEFAULT_SCHOOL_IDENTITY.npsn).trim(),
        akreditasi: String(idData.akreditasi || DEFAULT_SCHOOL_IDENTITY.akreditasi).trim(),
        region: String(idData.region || DEFAULT_SCHOOL_IDENTITY.region).trim(),
        address: idData.address || DEFAULT_SCHOOL_IDENTITY.address,
        email: idData.email || DEFAULT_SCHOOL_IDENTITY.email,
        phone: idData.phone || DEFAULT_SCHOOL_IDENTITY.phone,
        updatedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      };

      await query(
        `INSERT INTO school_settings (setting_key, setting_value)
         VALUES ('schoolIdentity', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [JSON.stringify(cleanIdentity)]
      );

      return NextResponse.json({
        success: true,
        message: 'Identitas resmi sekolah berhasil disimpan ke Database MariaDB.',
        identity: cleanIdentity
      });
    }

    // 2. Action: Update Admin Password
    if (action === 'update_password' || body.password) {
      const newPassword = String(body.password || '').trim();
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({
          success: false,
          error: 'Kata sandi minimal harus 6 karakter!'
        }, { status: 400 });
      }

      // Update in MariaDB users table for login authentication
      await query(
        `UPDATE users SET password = ? WHERE role = 'admin' OR username = 'admin'`,
        [newPassword]
      );

      // Also store in school_settings for persistent configuration
      await query(
        `INSERT INTO school_settings (setting_key, setting_value)
         VALUES ('adminPassword', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [newPassword]
      );

      return NextResponse.json({
        success: true,
        message: 'Kata sandi admin berhasil diperbarui di Database MariaDB & langsung aktif untuk login.'
      });
    }

    // 3. Action: Reset School Identity to Default
    if (action === 'reset_identity') {
      await query(
        `INSERT INTO school_settings (setting_key, setting_value)
         VALUES ('schoolIdentity', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [JSON.stringify(DEFAULT_SCHOOL_IDENTITY)]
      );

      return NextResponse.json({
        success: true,
        message: 'Identitas sekolah berhasil direset ke standar resmi.',
        identity: DEFAULT_SCHOOL_IDENTITY
      });
    }

    // 4. Action: Reset Admin Password to Default ('admin123')
    if (action === 'reset_password') {
      await query(`UPDATE users SET password = 'admin123' WHERE role = 'admin' OR username = 'admin'`);
      await query(`DELETE FROM school_settings WHERE setting_key = 'adminPassword'`);

      return NextResponse.json({
        success: true,
        message: 'Kata sandi admin berhasil direset ke bawaan sistem (admin123).'
      });
    }

    // 5. Action: Full Master Reset
    if (action === 'master_reset') {
      // 5.1 Reset Identity, Data Pokok, Kaldik PDF Info, & Admin Password
      await query(
        `INSERT INTO school_settings (setting_key, setting_value)
         VALUES ('schoolIdentity', ?), ('dataPokok', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [JSON.stringify(DEFAULT_SCHOOL_IDENTITY), JSON.stringify(DEFAULT_DATA_POKOK)]
      );
      await query(`UPDATE users SET password = 'admin123' WHERE role = 'admin' OR username = 'admin'`);
      await query(`DELETE FROM school_settings WHERE setting_key IN ('adminPassword', 'kaldikPdfInfo')`);

      // 5.2 Reset Warta (7 default articles)
      await query('DELETE FROM warta');
      for (const item of DEFAULT_WARTA) {
        await query(
          `INSERT INTO warta (id, title, category, date, views, src, excerpt, content, status, author)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            item.title,
            item.category,
            item.date,
            item.views || '1',
            item.src,
            item.excerpt || '',
            item.content || '',
            item.status || 'Published',
            item.author || 'Admin Humas'
          ]
        );
      }

      // 5.3 Reset Agenda (27 Kaldik)
      await query('DELETE FROM agenda');
      for (const item of OFFICIAL_KALDIK_SMPN3) {
        await query(
          `INSERT INTO agenda (id, name, date, category, status, semester, title)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [item.id, item.name, item.date, item.category, item.status || 'Mendatang', item.semester || 'Semester 1', item.title || item.name]
        );
      }

      // 5.4 Reset Gallery (8 default photos)
      await query('DELETE FROM gallery');
      for (const item of DEFAULT_GALLERY_PHOTOS) {
        await query(
          `INSERT INTO gallery (id, title, category, image_url, caption)
           VALUES (?, ?, ?, ?, ?)`,
          [item.id, item.title, item.category, item.src, item.desc || '']
        );
      }

      // 5.5 Reset Leaders & Teachers (+ sync users table)
      await query('DELETE FROM leaders');
      for (let i = 0; i < DEFAULT_LEADERS.length; i++) {
        const l = DEFAULT_LEADERS[i];
        await query(
          `INSERT INTO leaders (id, name, role, badge, nip, quote, status, photo, badge_color, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [l.id, l.name, l.role, l.badge || '', l.nip || '-', l.quote || '', l.status || 'Aktif', l.photo || '/teachers/default_avatar.svg', l.badgeColor || 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10', i + 1]
        );
      }

      await query('DELETE FROM teachers');
      await query(`DELETE FROM users WHERE role = 'guru_mapel'`);
      try {
        await query(`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS nuptk VARCHAR(100) DEFAULT NULL`);
      } catch {}
      for (const t of DEFAULT_TEACHERS) {
        const tendik = isTendikOrTu(t);
        const uname = tendik ? null : (t.username || cleanTeacherUsername(t.name));
        const pass = tendik ? null : (t.password || 'guru123');
        await query(
          `INSERT INTO teachers (id, name, username, phone, role, subject, category, nip, nuptk, photo, status, active, quote, password)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [t.id, t.name, uname, t.phone || '', t.role || 'Guru Mata Pelajaran', t.subject || '', t.category || 'MIPA', t.nip || '-', t.nuptk || null, t.photo || '/teachers/default_avatar.svg', t.status || 'GTT / Honorer', t.active !== false ? 1 : 0, t.quote || '', pass]
        );
        if (!tendik && uname && pass) {
          await query(
            `INSERT INTO users (username, password, name, role, identifier, subject, phone, status)
             VALUES (?, ?, ?, 'guru_mapel', ?, ?, ?, ?)`,
            [uname, pass, t.name, t.nip || '-', t.subject || 'Mata Pelajaran', t.phone || null, t.active !== false ? 'active' : 'inactive']
          );
        }
      }

      // 5.6 Reset Students & Sync Classes Total
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const filePath = path.join(process.cwd(), 'scripts', 'parsed_students.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        const officialList = parsed.students || [];
        const officialNisns = new Set(officialList.map((s: any) => String(s.nisn).trim()));
        const currentRows = await query<any[]>(`SELECT id, nisn FROM students`);
        const extraIds = currentRows.filter(r => !officialNisns.has(String(r.nisn).trim())).map(r => r.id);
        if (extraIds.length > 0) {
          for (const extraId of extraIds) {
            await query(`DELETE FROM students WHERE id = ?`, [extraId]);
          }
        }
        const existingNisnMap = new Map<string, number>();
        for (const r of currentRows) {
          const n = String(r.nisn || '').trim();
          if (officialNisns.has(n)) existingNisnMap.set(n, r.id);
        }
        for (const s of officialList) {
          const cleanNisn = String(s.nisn || '').trim();
          const cleanNis = s.nis ? String(s.nis).trim() : null;
          const cleanClass = String(s.classId || s.class_id || '7-A').trim();
          const cleanName = String(s.name || '').trim();
          const cleanGender = s.gender || '-';
          const cleanStudentId = s.id || `${cleanClass.replace('-', '')}-01`;
          const dbId = existingNisnMap.get(cleanNisn);
          if (dbId) {
            await query(
              `UPDATE students SET student_id = ?, nis = ?, name = ?, class_id = ?, gender = ?, status = 'Aktif', exit_reason = NULL, exit_date = NULL, exit_marked_by = NULL, password = 'siswa123' WHERE id = ?`,
              [cleanStudentId, cleanNis, cleanName, cleanClass, cleanGender, dbId]
            );
          } else {
            await query(
              `INSERT INTO students (student_id, nis, nisn, name, class_id, gender, password, status)
               VALUES (?, ?, ?, ?, ?, ?, 'siswa123', 'Aktif')`,
              [cleanStudentId, cleanNis, cleanNisn, cleanName, cleanClass, cleanGender]
            );
          }
        }
        await query(`
          UPDATE classes c
          SET c.total_students = (
            SELECT COUNT(*) FROM students s
            WHERE s.class_id = c.id AND (s.status IS NULL OR s.status != 'Keluar')
          )
        `);
      } catch (err) {
        console.warn('Student reset during master reset:', err);
      }

      return NextResponse.json({
        success: true,
        message: 'Seluruh database website (Identitas, Password, Warta, GTK, Siswa, Agenda, dan Galeri) berhasil direset ke kondisi master sekolah!'
      });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak dikenali' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  return POST(req);
}
