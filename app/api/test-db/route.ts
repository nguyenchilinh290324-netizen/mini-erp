import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db'; // Đường dẫn tương đối trỏ về file db.ts

export async function GET() {
  try {
    // Thực thi một câu lệnh SQL cơ bản để lấy thời gian hiện tại từ hệ thống Neon
    const result = await pool.query('SELECT NOW() as current_time, version()');
    
    return NextResponse.json({
      success: true,
      message: 'Kết nối Neon PostgreSQL thành công!',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Lỗi kết nối database:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Lỗi kết nối đến Neon', 
        error: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
}