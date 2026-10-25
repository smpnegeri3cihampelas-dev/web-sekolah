import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gradeLevel = searchParams.get('grade');
    const status = searchParams.get('status');

    let sql = 'SELECT * FROM cbt_exam_packages WHERE 1=1';
    const params: any[] = [];

    if (gradeLevel) {
      sql += ' AND (grade_level = ? OR grade_level = "Semua")';
      params.push(gradeLevel);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const rows = await query<any[]>(sql, params);

    const packages = rows.map(r => ({
      id: r.id,
      title: r.title,
      subject: r.subject,
      gradeLevel: r.grade_level,
      targetClasses: r.target_classes ? JSON.parse(r.target_classes) : [],
      semester: r.semester,
      academicYear: r.academic_year,
      durationMinutes: r.duration_minutes,
      token: r.token,
      passingGrade: r.passing_grade,
      totalQuestions: r.total_questions,
      status: r.status,
      teacherName: r.teacher_name,
      instructions: r.instructions,
      examDate: r.exam_date,
      startTime: r.start_time,
      endTime: r.end_time,
      emergencyPaused: Boolean(r.emergency_paused),
      emergencyPauseReason: r.emergency_pause_reason,
      questions: r.questions ? JSON.parse(r.questions) : [],
      createdAt: r.created_at
    }));

    return NextResponse.json({ success: true, count: packages.length, data: packages });
  } catch (error: any) {
    console.error('Error fetching CBT packages:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      title,
      subject,
      gradeLevel,
      targetClasses,
      semester,
      academicYear,
      durationMinutes,
      token,
      passingGrade,
      status,
      teacherName,
      instructions,
      examDate,
      startTime,
      endTime,
      emergencyPaused,
      emergencyPauseReason,
      questions
    } = body;

    const pkgId = id || `cbt-${Date.now()}`;
    const totalQuestions = questions ? questions.length : 0;

    await query(`
      INSERT INTO cbt_exam_packages (
        id, title, subject, grade_level, target_classes, semester,
        academic_year, duration_minutes, token, passing_grade, total_questions,
        status, teacher_name, instructions, exam_date, start_time, end_time,
        emergency_paused, emergency_pause_reason, questions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title=VALUES(title),
        token=VALUES(token),
        status=VALUES(status),
        total_questions=VALUES(total_questions),
        emergency_paused=VALUES(emergency_paused),
        emergency_pause_reason=VALUES(emergency_pause_reason),
        questions=VALUES(questions);
    `, [
      pkgId,
      title,
      subject,
      gradeLevel || 'Semua',
      JSON.stringify(targetClasses || []),
      semester || 'Ganjil (PTS/STS)',
      academicYear || '2026/2027',
      durationMinutes || 60,
      token,
      passingGrade || 75,
      totalQuestions,
      status || 'active',
      teacherName || 'Panitia Ujian',
      instructions || null,
      examDate || null,
      startTime || null,
      endTime || null,
      emergencyPaused ? 1 : 0,
      emergencyPauseReason || null,
      JSON.stringify(questions || [])
    ]);

    return NextResponse.json({ success: true, id: pkgId, message: 'Paket CBT berhasil disimpan di database!' });
  } catch (error: any) {
    console.error('Error saving CBT package:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID paket ujian wajib disertakan!' }, { status: 400 });
    }

    await query('DELETE FROM cbt_exam_packages WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: `Paket ujian ${id} berhasil dihapus dari database!` });
  } catch (error: any) {
    console.error('Error deleting CBT package:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

