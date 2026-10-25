import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query('SELECT * FROM gallery ORDER BY id ASC');
    return NextResponse.json({
      success: true,
      data: rows
    });
  } catch (error: any) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
