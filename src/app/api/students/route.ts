import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const search = searchParams.get('q');

    let sql = 'SELECT id, student_id, nis, nisn, name, class_id, gender, status FROM students WHERE 1=1';
    const params: any[] = [];

    if (classId) {
      sql += ' AND class_id = ?';
      params.push(classId);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR nis LIKE ? OR nisn LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY class_id ASC, name ASC';

    const rows = await query(sql, params);
    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
