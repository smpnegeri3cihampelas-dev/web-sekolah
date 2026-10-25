import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query('SELECT * FROM agenda ORDER BY id ASC');
    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error: any) {
    console.error('Error fetching agenda:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
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

    return NextResponse.json({ success: true, insertId: (result as any).insertId });
  } catch (error: any) {
    console.error('Error creating agenda:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
