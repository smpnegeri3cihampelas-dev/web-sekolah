import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');
    const studentId = searchParams.get('studentId');
    const studentClass = searchParams.get('class');

    let sql = 'SELECT * FROM assignment_submissions WHERE 1=1';
    const params: any[] = [];

    if (assignmentId) {
      sql += ' AND assignment_id = ?';
      params.push(assignmentId);
    }

    if (studentId) {
      sql += ' AND student_id = ?';
      params.push(studentId);
    }

    if (studentClass) {
      sql += ' AND student_class = ?';
      params.push(studentClass);
    }

    sql += ' ORDER BY created_at DESC';

    const rows = await query<any[]>(sql, params);

    const submissions = rows.map(r => ({
      id: r.id,
      assignmentId: r.assignment_id,
      studentId: r.student_id,
      studentName: r.student_name,
      studentClass: r.student_class,
      submittedAt: r.submitted_at,
      fileName: r.file_name,
      fileSize: r.file_size,
      fileData: r.file_url,
      videoUrl: r.video_url,
      answerText: r.answer_text,
      grade: r.grade,
      feedback: r.feedback,
      status: r.status,
      quizAnswers: r.quiz_answers ? JSON.parse(r.quiz_answers) : undefined,
      quizScore: r.quiz_score
    }));

    return NextResponse.json({ success: true, count: submissions.length, data: submissions });
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      assignmentId,
      studentId,
      studentName,
      studentClass,
      submittedAt,
      fileName,
      fileSize,
      fileData,
      videoUrl,
      answerText,
      grade,
      feedback,
      status,
      quizAnswers,
      quizScore
    } = body;

    const subId = id || `sub-${Date.now()}`;

    await query(`
      INSERT INTO assignment_submissions (
        id, assignment_id, student_id, student_name, student_class,
        submitted_at, file_name, file_size, file_url, video_url,
        answer_text, grade, feedback, status, quiz_answers, quiz_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        grade=VALUES(grade),
        feedback=VALUES(feedback),
        status=VALUES(status),
        file_url=VALUES(file_url),
        answer_text=VALUES(answer_text),
        quiz_answers=VALUES(quiz_answers),
        quiz_score=VALUES(quiz_score);
    `, [
      subId,
      assignmentId,
      studentId,
      studentName,
      studentClass,
      submittedAt || new Date().toLocaleString('id-ID'),
      fileName || null,
      fileSize || null,
      fileData || null,
      videoUrl || null,
      answerText || null,
      grade !== undefined ? grade : null,
      feedback || null,
      status || (grade !== undefined ? 'graded' : 'submitted'),
      quizAnswers ? JSON.stringify(quizAnswers) : null,
      quizScore !== undefined ? quizScore : null
    ]);

    return NextResponse.json({ success: true, id: subId, message: 'Pengumpulan tugas berhasil disimpan!' });
  } catch (error: any) {
    console.error('Error saving submission:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
