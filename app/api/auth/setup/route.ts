import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  const client = await pool.connect();
  try {
    // 1. Mã hóa chuẩn xác chữ 'admin123'
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // 2. Cập nhật lại vào database cho tài khoản admin
    await client.query(
      `UPDATE users SET password = $1 WHERE username = 'admin'`,
      [hashedPassword]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Đã reset mật khẩu thành công! Mật khẩu mới là: admin123',
      new_hash: hashedPassword
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi' }, { status: 500 });
  } finally {
    client.release();
  }
}