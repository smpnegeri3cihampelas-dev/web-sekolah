import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [leaders, teachers, settings] = await Promise.all([
      query('SELECT * FROM leaders ORDER BY sort_order ASC, id ASC'),
      query('SELECT * FROM teachers ORDER BY id ASC'),
      query('SELECT setting_value FROM school_settings WHERE setting_key = "dataPokok" LIMIT 1')
    ]);

    let dataPokok = { siswa: '535', rombel: '17', guru: '34', staf: '8' };
    if (settings && settings.length > 0 && settings[0].setting_value) {
      try {
        dataPokok = JSON.parse(settings[0].setting_value);
      } catch (e) {
        // use fallback
      }
    }

    return NextResponse.json({
      success: true,
      leaders,
      teachers,
      dataPokok
    });
  } catch (error: any) {
    console.error('Error fetching school data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
