import { NextResponse } from 'next/server';
import { pool } from '@/lib/db'; // Đảm bảo đường dẫn này trỏ đúng file config DB của bạn
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

// Lấy secret key từ .env
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret');

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    const client = await pool.connect();
    let user;
    try {
      const res = await client.query('SELECT * FROM users WHERE username = $1', [username]);
      user = res.rows[0];
    } finally {
      client.release();
    }

    // Kiểm tra tài khoản
    if (!user) {
      return NextResponse.json({ error: 'Sai tài khoản hoặc mật khẩu' }, { status: 401 });
    }

    // Kiểm tra mật khẩu (So sánh password nhập vào với mã hash trong DB)
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Sai tài khoản hoặc mật khẩu' }, { status: 401 });
    }

    // Tạo JWT Token chứa thông tin user (Hạn 1 ngày)
    const token = await new SignJWT({ 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      name: user.full_name 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // Trả về Cookie bảo mật (Trình duyệt tự lưu, Hacker không lấy được qua JS)
    const response = NextResponse.json({ success: true, role: user.role });
    response.cookies.set('erp_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 ngày
    });

    return response;

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Lỗi server nội bộ' }, { status: 500 });
  }
}