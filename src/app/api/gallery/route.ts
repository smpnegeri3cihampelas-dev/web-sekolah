import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DEFAULT_GALLERY_PHOTOS } from '@/lib/galleryConstants';

// Helper: Auto-ensure table structure and seed if empty
async function ensureGalleryTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS gallery (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'FASILITAS',
        image_url LONGTEXT NOT NULL,
        caption TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure columns support large base64 compressed photos
    try {
      await query('ALTER TABLE gallery MODIFY COLUMN image_url LONGTEXT, MODIFY COLUMN caption TEXT, MODIFY COLUMN title VARCHAR(255), MODIFY COLUMN category VARCHAR(100)');
    } catch {}

    const existing = await query<any[]>('SELECT COUNT(*) as count FROM gallery');
    const count = existing?.[0]?.count ?? 0;
    if (count === 0) {
      for (const item of DEFAULT_GALLERY_PHOTOS) {
        await query(
          `INSERT INTO gallery (id, title, category, image_url, caption)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             title = VALUES(title),
             category = VALUES(category),
             image_url = VALUES(image_url),
             caption = VALUES(caption)`,
          [item.id, item.title, item.category, item.src, item.desc || '']
        );
      }
    }
  } catch (err) {
    console.error('Error ensuring gallery table:', err);
  }
}

export async function GET() {
  try {
    await ensureGalleryTable();

    const rows = await query<any[]>('SELECT * FROM gallery ORDER BY id DESC');
    const items = rows.map((r: any) => ({
      id: Number(r.id),
      title: r.title || 'Dokumentasi Sekolah',
      category: (r.category || 'FASILITAS').toUpperCase(),
      src: r.image_url || r.src || '/gallery_2.jpg',
      desc: r.caption || r.desc || '',
      created_at: r.created_at
    }));

    return NextResponse.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error: any) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureGalleryTable();
    const body = await req.json();

    // 1. Bulk reset action
    if (body.action === 'reset') {
      await query('DELETE FROM gallery');
      for (const item of DEFAULT_GALLERY_PHOTOS) {
        await query(
          `INSERT INTO gallery (id, title, category, image_url, caption)
           VALUES (?, ?, ?, ?, ?)`,
          [item.id, item.title, item.category, item.src, item.desc || '']
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Berhasil mereset galeri ke 8 foto dokumentasi standar sekolah.'
      });
    }

    // 2. Batch insertion
    if (Array.isArray(body.items)) {
      for (const item of body.items) {
        await query(
          `INSERT INTO gallery (title, category, image_url, caption)
           VALUES (?, ?, ?, ?)`,
          [
            item.title || 'Dokumentasi Sekolah',
            (item.category || 'FASILITAS').toUpperCase(),
            item.src || item.image_url || '/gallery_2.jpg',
            item.desc || item.caption || ''
          ]
        );
      }
      return NextResponse.json({
        success: true,
        message: `${body.items.length} media galeri berhasil disimpan ke database.`
      });
    }

    // 3. Single Item Insertion
    const { title, category, src, image_url, desc, caption } = body;
    const finalSrc = src || image_url || '/gallery_2.jpg';
    const finalDesc = desc || caption || '';
    const finalCat = (category || 'FASILITAS').toUpperCase();

    const result = await query(
      `INSERT INTO gallery (title, category, image_url, caption)
       VALUES (?, ?, ?, ?)`,
      [title || 'Dokumentasi Baru', finalCat, finalSrc, finalDesc]
    );

    const insertId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      insertId,
      data: {
        id: insertId,
        title: title || 'Dokumentasi Baru',
        category: finalCat,
        src: finalSrc,
        desc: finalDesc
      }
    });
  } catch (error: any) {
    console.error('Error adding gallery item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, category, src, image_url, desc, caption } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID media galeri wajib disertakan' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category.toUpperCase());
    }
    if (src !== undefined || image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(src || image_url);
    }
    if (desc !== undefined || caption !== undefined) {
      updates.push('caption = ?');
      params.push(desc || caption);
    }

    if (updates.length > 0) {
      params.push(id);
      await query(`UPDATE gallery SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    return NextResponse.json({
      success: true,
      message: 'Media galeri berhasil diperbarui di database.',
      data: { id, title, category, src: src || image_url, desc: desc || caption }
    });
  } catch (error: any) {
    console.error('Error updating gallery item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const idParam = searchParams.get('id');

    // Handle reset via ?action=reset
    if (action === 'reset') {
      await query('DELETE FROM gallery');
      for (const item of DEFAULT_GALLERY_PHOTOS) {
        await query(
          `INSERT INTO gallery (id, title, category, image_url, caption)
           VALUES (?, ?, ?, ?, ?)`,
          [item.id, item.title, item.category, item.src, item.desc || '']
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Galeri berhasil direset ke 8 foto dokumentasi standar.'
      });
    }

    let idToDelete = idParam ? parseInt(idParam, 10) : null;
    if (!idToDelete) {
      try {
        const body = await req.json();
        if (body.action === 'reset') {
          await query('DELETE FROM gallery');
          for (const item of DEFAULT_GALLERY_PHOTOS) {
            await query(
              `INSERT INTO gallery (id, title, category, image_url, caption)
               VALUES (?, ?, ?, ?, ?)`,
              [item.id, item.title, item.category, item.src, item.desc || '']
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Galeri berhasil direset ke 8 foto dokumentasi standar.'
          });
        }
        if (body.id) idToDelete = parseInt(body.id, 10);
      } catch {}
    }

    if (!idToDelete) {
      return NextResponse.json({ success: false, error: 'ID media galeri wajib disertakan' }, { status: 400 });
    }

    await query('DELETE FROM gallery WHERE id = ?', [idToDelete]);

    return NextResponse.json({
      success: true,
      message: `Media galeri ID ${idToDelete} berhasil dihapus dari database.`
    });
  } catch (error: any) {
    console.error('Error deleting gallery item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
