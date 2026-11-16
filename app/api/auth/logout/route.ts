import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Đã đăng xuất' });
  
  // Xóa cookie erp_token
  response.cookies.delete('erp_token');
  
  return response;
}