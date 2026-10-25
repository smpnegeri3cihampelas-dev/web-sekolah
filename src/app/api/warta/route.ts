import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query('SELECT * FROM warta ORDER BY id DESC');
    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error: any) {
    console.error('Error fetching warta:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, category, date, src, excerpt, content, status, author } = body;

    const result = await query(
      `INSERT INTO warta (title, category, date, src, excerpt, content, status, author)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title || 'Berita Baru',
        category || 'Kegiatan',
        date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        src || '/slide1.jpeg',
        excerpt || '',
        content || '',
        status || 'Published',
        author || 'Admin Humas'
      ]
    );

    return NextResponse.json({ success: true, insertId: (result as any).insertId });
  } catch (error: any) {
    console.error('Error creating warta:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
