import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

function formatWibDate(d: Date): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
  } catch {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

function toLocalDateString(val: any): string {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val.getTime())) {
    return formatWibDate(val);
  }
  if (typeof val === 'string') {
    if (val.includes('T')) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return formatWibDate(d);
    }
    const match = val.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    return val.split('T')[0];
  }
  return String(val);
}

function parseJsonArraySafe<T = any>(raw: any): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const gradeLevel = searchParams.get('grade');
    const status = searchParams.get('status');
    const subject = searchParams.get('subject');
    const teacherName = searchParams.get('teacherName');

    let sql = 'SELECT * FROM cbt_exam_packages WHERE 1=1';
    const params: any[] = [];

    if (id) {
      sql += ' AND id = ?';
      params.push(id);
    }

    if (gradeLevel) {
      sql += ' AND (grade_level = ? OR grade_level = "Semua")';
      params.push(gradeLevel);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (subject) {
      sql += ' AND subject = ?';
      params.push(subject);
    }

    if (teacherName) {
      sql += ' AND teacher_name = ?';
      params.push(teacherName);
    }

    sql += ' ORDER BY created_at DESC';

    const rows = await query<any[]>(sql, params);

    const packages = rows.map(r => {
      const parsedTargetClasses = parseJsonArraySafe<string>(r.target_classes);
      const parsedQuestions = parseJsonArraySafe<any>(r.questions).map((q: any, idx: number) => ({
        ...q,
        number: idx + 1
      }));

      return {
        id: r.id,
        title: r.title,
        subject: r.subject,
        gradeLevel: r.grade_level || '7',
        targetClasses: parsedTargetClasses,
        semester: r.semester || 'Ganjil (PTS/STS)',
        academicYear: r.academic_year || '2026/2027',
        durationMinutes: Number(r.duration_minutes) || 60,
        token: r.token || '',
        passingGrade: Number(r.passing_grade) || 75,
        totalQuestions: parsedQuestions.length > 0 ? parsedQuestions.length : (Number(r.total_questions) || 0),
        status: r.status || 'active',
        teacherName: r.teacher_name || 'Guru Pengampu',
        instructions: r.instructions || 'Kerjakan ujian dengan jujur dan teliti. Patuhi seluruh tata tertib asesmen.',
        examDate: toLocalDateString(r.exam_date),
        startTime: r.start_time || '07:30',
        endTime: r.end_time || '09:00',
        emergencyPaused: Boolean(r.emergency_paused),
        emergencyPauseReason: r.emergency_pause_reason || undefined,
        questions: parsedQuestions,
        createdAt: toLocalDateString(r.created_at) || r.created_at
      };
    });

    return NextResponse.json({ success: true, count: packages.length, data: packages });
  } catch (error: any) {
    console.error('Error fetching CBT packages:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function upsertSingleCbtPackage(item: any): Promise<string> {
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
  } = item;

  const pkgId = id || `cbt_${Date.now()}`;
  const normalizedQuestions = Array.isArray(questions)
    ? questions.map((q: any, idx: number) => ({
        ...q,
        number: idx + 1
      }))
    : [];
  const totalQuestions = normalizedQuestions.length;
  const cleanExamDate = toLocalDateString(examDate) || null;
  const validStatus = status === 'draft' || status === 'completed' ? status : 'active';

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
    (title || 'Paket Ujian CBT').trim(),
    (subject || 'Informatika').trim(),
    gradeLevel || 'Semua',
    JSON.stringify(Array.isArray(targetClasses) ? targetClasses : []),
    semester || 'Ganjil (PTS/STS)',
    academicYear || '2026/2027',
    Number(durationMinutes) || 60,
    (token || 'CBT2026').toUpperCase().trim(),
    Number(passingGrade) || 75,
    totalQuestions,
    validStatus,
    teacherName || 'Guru Pengampu',
    instructions || 'Kerjakan ujian dengan jujur dan teliti. Patuhi seluruh tata tertib asesmen.',
    cleanExamDate,
    startTime || '07:30',
    endTime || '09:00',
    emergencyPaused ? 1 : 0,
    emergencyPauseReason || null,
    JSON.stringify(normalizedQuestions)
  ]);

  return pkgId;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (Array.isArray(body?.packages)) {
      const savedIds: string[] = [];
      for (const pkg of body.packages) {
        if (pkg && (pkg.id || pkg.title)) {
          const pkgId = await upsertSingleCbtPackage(pkg);
          savedIds.push(pkgId);
        }
      }
      return NextResponse.json({
        success: true,
        ids: savedIds,
        message: `${savedIds.length} paket CBT beserta soalnya berhasil disinkronkan ke database!`
      });
    }

    const pkgId = await upsertSingleCbtPackage(body);
    return NextResponse.json({
      success: true,
      id: pkgId,
      message: 'Paket CBT beserta butir soalnya berhasil disimpan di database!'
    });
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

    await query('DELETE FROM cbt_student_answers WHERE exam_id = ?', [id]);
    await query('DELETE FROM cbt_exam_packages WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: `Paket ujian ${id} beserta soal dan sesi jawabannya berhasil dihapus dari database!` });
  } catch (error: any) {
    console.error('Error deleting CBT package:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

