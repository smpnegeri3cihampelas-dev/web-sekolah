import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DEFAULT_WARTA } from '@/lib/wartaConstants';

export async function GET() {
  try {
    // Ensure columns support rich text and compressed images
    try {
      await query(`ALTER TABLE warta MODIFY COLUMN src LONGTEXT, MODIFY COLUMN content LONGTEXT, MODIFY COLUMN excerpt TEXT`);
    } catch {}

    const rows = await query<any[]>('SELECT * FROM warta ORDER BY id DESC');
    const items = rows.map(r => ({
      id: Number(r.id),
      title: r.title,
      category: r.category,
      date: r.date,
      views: r.views || '1',
      status: r.status || 'Published',
      src: r.src || '/slide1.jpeg',
      excerpt: r.excerpt || '',
      content: r.content || '',
      author: r.author || 'Admin Humas'
    }));

    return NextResponse.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error: any) {
    console.error('Error fetching warta:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Batch insertion / seeding
    if (Array.isArray(body.items)) {
      for (const item of body.items) {
        await query(
          `INSERT INTO warta (id, title, category, date, views, src, excerpt, content, status, author)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             title = VALUES(title), 
             category = VALUES(category), 
             date = VALUES(date), 
             views = VALUES(views), 
             src = VALUES(src), 
             excerpt = VALUES(excerpt), 
             content = VALUES(content), 
             status = VALUES(status), 
             author = VALUES(author)`,
          [
            item.id || null,
            item.title || 'Berita Baru',
            item.category || 'Kegiatan',
            item.date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            item.views || '1',
            item.src || '/slide1.jpeg',
            item.excerpt || '',
            item.content || '',
            item.status || 'Published',
            item.author || 'Admin Humas'
          ]
        );
      }

      return NextResponse.json({
        success: true,
        message: `${body.items.length} warta berhasil disimpan ke database cloud`
      });
    }

    // 2. Single item insertion
    const { title, category, date, views, src, excerpt, content, status, author } = body;
    const result = await query(
      `INSERT INTO warta (title, category, date, views, src, excerpt, content, status, author)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title || 'Berita Baru',
        category || 'Kegiatan',
        date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        views || '1',
        src || '/slide1.jpeg',
        excerpt || '',
        content || '',
        status || 'Published',
        author || 'Admin Humas'
      ]
    );

    const insertId = (result as any).insertId;
    const newItem = {
      id: insertId,
      title: title || 'Berita Baru',
      category: category || 'Kegiatan',
      date: date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      views: views || '1',
      src: src || '/slide1.jpeg',
      excerpt: excerpt || '',
      content: content || '',
      status: status || 'Published',
      author: author || 'Admin Humas'
    };

    return NextResponse.json({
      success: true,
      data: newItem,
      insertId,
      message: `Warta "${title}" berhasil ditambahkan ke database cloud`
    });
  } catch (error: any) {
    console.error('Error creating warta:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, category, date, views, src, excerpt, content, status, author } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID warta diperlukan' }, { status: 400 });
    }

    await query(
      `UPDATE warta 
       SET title = COALESCE(?, title),
           category = COALESCE(?, category),
           date = COALESCE(?, date),
           views = COALESCE(?, views),
           src = COALESCE(?, src),
           excerpt = COALESCE(?, excerpt),
           content = COALESCE(?, content),
           status = COALESCE(?, status),
           author = COALESCE(?, author)
       WHERE id = ?`,
      [
        title || null,
        category || null,
        date || null,
        views || null,
        src || null,
        excerpt !== undefined ? excerpt : null,
        content !== undefined ? content : null,
        status || null,
        author || null,
        id
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Warta ID ${id} berhasil diperbarui di database cloud`
    });
  } catch (error: any) {
    console.error('Error updating warta:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id, action } = body;

    if (action === 'reset') {
      await query(`TRUNCATE TABLE warta`);
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
            item.status,
            item.author || 'Admin Humas'
          ]
        );
      }

      return NextResponse.json({
        success: true,
        count: DEFAULT_WARTA.length,
        message: `Database warta berhasil direset ke ${DEFAULT_WARTA.length} artikel awal`
      });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID warta diperlukan' }, { status: 400 });
    }

    await query(`DELETE FROM warta WHERE id = ?`, [id]);

    return NextResponse.json({
      success: true,
      message: `Warta ID ${id} berhasil dihapus dari database cloud`
    });
  } catch (error: any) {
    console.error('Error deleting warta:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
