import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

function toLocalDateString(val: any): string {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  if (typeof val === 'string') {
    if (val.includes('T')) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    }
    const match = val.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    return val.split('T')[0];
  }
  return String(val);
}

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
      examDate: toLocalDateString(r.exam_date),
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
    const cleanExamDate = toLocalDateString(examDate) || null;

    await query(`
      INSERT INTO cbt_exam_packages (
        id, title, subject, grade_level, target_classes, semester,
        academic_year, duration_minutes, token, passing_grade, total_questions,
        status, teacher_name, instructions, exam_date, start_time, end_time,
        emergency_paused, emergency_pause_reason, questions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title=VALUES(title),
        subject=VALUES(subject),
        grade_level=VALUES(grade_level),
        target_classes=VALUES(target_classes),
        semester=VALUES(semester),
        academic_year=VALUES(academic_year),
        duration_minutes=VALUES(duration_minutes),
        token=VALUES(token),
        passing_grade=VALUES(passing_grade),
        total_questions=VALUES(total_questions),
        status=VALUES(status),
        teacher_name=VALUES(teacher_name),
        instructions=VALUES(instructions),
        exam_date=VALUES(exam_date),
        start_time=VALUES(start_time),
        end_time=VALUES(end_time),
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
      cleanExamDate,
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

