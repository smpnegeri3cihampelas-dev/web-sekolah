import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const teacherName = searchParams.get('teacherName');

    let sql = 'SELECT * FROM assignments WHERE 1=1';
    const params: any[] = [];

    if (classId) {
      sql += ' AND (target_class = ? OR target_class = "Semua")';
      params.push(classId);
    }

    if (teacherName) {
      sql += ' AND teacher_name = ?';
      params.push(teacherName);
    }

    sql += ' ORDER BY created_at DESC';

    const rows = await query<any[]>(sql, params);
    
    // Parse json columns
    const assignments = rows.map(r => ({
      id: r.id,
      title: r.title,
      subject: r.subject,
      teacherName: r.teacher_name,
      teacherNip: r.teacher_nip,
      targetClass: r.target_class,
      dueDate: r.due_date,
      description: r.description,
      allowUpload: Boolean(r.allow_upload),
      materialUrl: r.material_url,
      materialName: r.material_name,
      videoUrl: r.video_url,
      videoTitle: r.video_title,
      quizQuestions: r.quiz_questions ? JSON.parse(r.quiz_questions) : [],
      createdAt: r.created_at
    }));

    return NextResponse.json({ success: true, count: assignments.length, data: assignments });
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
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
      teacherName,
      teacherNip,
      targetClass,
      dueDate,
      description,
      allowUpload,
      materialUrl,
      materialName,
      videoUrl,
      videoTitle,
      quizQuestions
    } = body;

    const assignmentId = id || `asg-${Date.now()}`;

    await query(`
      INSERT INTO assignments (
        id, title, subject, teacher_name, teacher_nip, target_class,
        due_date, description, allow_upload, material_url, material_name,
        video_url, video_title, quiz_questions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title=VALUES(title),
        subject=VALUES(subject),
        due_date=VALUES(due_date),
        description=VALUES(description),
        quiz_questions=VALUES(quiz_questions);
    `, [
      assignmentId,
      title,
      subject,
      teacherName,
      teacherNip || '-',
      targetClass,
      dueDate,
      description,
      allowUpload ? 1 : 0,
      materialUrl || null,
      materialName || null,
      videoUrl || null,
      videoTitle || null,
      quizQuestions ? JSON.stringify(quizQuestions) : null
    ]);

    return NextResponse.json({ success: true, id: assignmentId, message: 'Tugas berhasil disimpan!' });
  } catch (error: any) {
    console.error('Error saving assignment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID tugas wajib disertakan!' }, { status: 400 });
    }

    await query('DELETE FROM assignments WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: `Tugas ${id} berhasil dihapus dari database!` });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

