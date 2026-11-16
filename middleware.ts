import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Lấy secret key từ .env (Phải giống hệt key ở API Login)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret');

// Các đường dẫn công khai không cần bảo vệ
const publicPaths = ['/login', '/api/auth/login', '/api/auth/setup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lấy token từ Cookie
  const token = request.cookies.get('erp_token')?.value;

  // 1. Xử lý trường hợp CHƯA CÓ TOKEN (Chưa đăng nhập)
  if (!token && !publicPaths.includes(pathname)) {
    // Nếu đang gọi API nội bộ -> Trả về lỗi 401 (Unauthorized)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 401 });
    }
    // Nếu đang truy cập các trang giao diện -> Đẩy về trang /login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Xử lý trường hợp ĐÃ CÓ TOKEN
  if (token) {
    try {
      // Xác thực token xem có bị làm giả hoặc hết hạn không
      await jwtVerify(token, JWT_SECRET);

      // Nếu token hợp lệ mà người dùng lại cố vào trang /login -> Đẩy thẳng về Dashboard
      if (pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      // Token lỗi hoặc hết hạn
      if (!publicPaths.includes(pathname)) {
        // Xóa token hỏng và đẩy về login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('erp_token');
        return response;
      }
    }
  }

  return NextResponse.next(); // Cho phép đi tiếp nếu mọi thứ hợp lệ
}

// Cấu hình để Middleware KHÔNG chặn các file tĩnh (Hình ảnh, CSS, JS)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};