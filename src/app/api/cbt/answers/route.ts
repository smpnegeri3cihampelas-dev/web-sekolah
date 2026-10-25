import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');
    const studentNisn = searchParams.get('nisn');
    const classId = searchParams.get('classId');
    const roomName = searchParams.get('room');

    let sql = 'SELECT * FROM cbt_student_answers WHERE 1=1';
    const params: any[] = [];

    if (examId) {
      sql += ' AND exam_id = ?';
      params.push(examId);
    }

    if (studentNisn) {
      sql += ' AND student_nisn = ?';
      params.push(studentNisn);
    }

    if (classId) {
      sql += ' AND class_id = ?';
      params.push(classId);
    }

    if (roomName) {
      sql += ' AND room_name = ?';
      params.push(roomName);
    }

    sql += ' ORDER BY score DESC, submitted_at DESC';

    const rows = await query<any[]>(sql, params);

    const answers = rows.map(r => ({
      examId: r.exam_id,
      studentId: r.student_id,
      studentNisn: r.student_nisn,
      studentName: r.student_name,
      classId: r.class_id,
      roomName: r.room_name,
      answers: r.answers ? JSON.parse(r.answers) : {},
      doubtfuls: r.doubtfuls ? JSON.parse(r.doubtfuls) : {},
      audioPlayCount: r.audio_play_count ? JSON.parse(r.audio_play_count) : {},
      startedAt: r.started_at,
      submittedAt: r.submitted_at,
      isSubmitted: Boolean(r.is_submitted),
      score: Number(r.score) || 0,
      totalScore: Number(r.total_score) || 0,
      correctCount: r.correct_count,
      wrongCount: r.wrong_count,
      isPassed: Boolean(r.is_passed),
      violationCount: r.violation_count
    }));

    return NextResponse.json({ success: true, count: answers.length, data: answers });
  } catch (error: any) {
    console.error('Error fetching CBT student answers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      examId,
      studentId,
      studentNisn,
      studentName,
      classId,
      roomName,
      answers,
      doubtfuls,
      audioPlayCount,
      startedAt,
      submittedAt,
      isSubmitted,
      score,
      totalScore,
      correctCount,
      wrongCount,
      isPassed,
      violationCount
    } = body;

    await query(`
      INSERT INTO cbt_student_answers (
        exam_id, student_id, student_nisn, student_name, class_id, room_name,
        answers, doubtfuls, audio_play_count, started_at, submitted_at,
        is_submitted, score, total_score, correct_count, wrong_count, is_passed, violation_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        answers=VALUES(answers),
        doubtfuls=VALUES(doubtfuls),
        audio_play_count=VALUES(audio_play_count),
        submitted_at=VALUES(submitted_at),
        is_submitted=VALUES(is_submitted),
        score=VALUES(score),
        total_score=VALUES(total_score),
        correct_count=VALUES(correct_count),
        wrong_count=VALUES(wrong_count),
        is_passed=VALUES(is_passed),
        violation_count=VALUES(violation_count);
    `, [
      examId,
      studentId || studentNisn,
      studentNisn,
      studentName,
      classId,
      roomName || 'Ruang 01',
      JSON.stringify(answers || {}),
      JSON.stringify(doubtfuls || {}),
      JSON.stringify(audioPlayCount || {}),
      startedAt || new Date().toISOString(),
      submittedAt || null,
      isSubmitted ? 1 : 0,
      score || 0,
      totalScore || 0,
      correctCount || 0,
      wrongCount || 0,
      isPassed ? 1 : 0,
      violationCount || 0
    ]);

    return NextResponse.json({
      success: true,
      message: isSubmitted ? 'Ujian CBT berhasil diselesaikan dan nilai telah tersimpan di server!' : 'Jawaban sementara berhasil disinkronkan ke server!'
    });
  } catch (error: any) {
    console.error('Error saving CBT student answer:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
