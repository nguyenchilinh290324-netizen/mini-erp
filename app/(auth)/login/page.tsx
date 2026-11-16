'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError('Mất kết nối đến máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Thẻ div cha này sẽ load ảnh bg-login.jpg từ thư mục public làm nền
    <div 
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/bg-login.jpg')" }}
    >
      {/* Lớp mờ màu đen phủ lên ảnh để form đăng nhập và chữ nổi bật hơn */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-0"></div>
      
      {/* THANH MENU TRÊN CÙNG */}
      <div className="bg-white/95 h-10 w-full flex justify-end items-center px-4 md:px-12 gap-6 text-sm text-gray-700 border-b relative z-10 shadow-sm">
        <button className="flex items-center gap-1 hover:text-[#df7a36] transition-colors">
          <span>🛒</span> Xem giỏ hàng
        </button>
        <button className="flex items-center gap-1 hover:text-[#df7a36] transition-colors">
          <span>🇻🇳</span> Tiếng Việt ▾
        </button>
        <button className="hover:text-[#df7a36] transition-colors">VND ▾</button>
        <button className="flex items-center gap-1 hover:text-[#df7a36] transition-colors">
          <span>👤</span> Tài khoản của tôi ▾
        </button>
      </div>

      {/* KHU VỰC FORM ĐĂNG NHẬP */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="bg-white w-full max-w-[400px] p-8 shadow-2xl rounded-sm">
          
          <div className="text-center mb-8">
            {/* Gọi logo từ thư mục public */}
            <img src="/logo.png" alt="Logo" className="h-12 mx-auto mb-3 object-contain" />
            <h1 className="text-[24px] font-bold text-gray-900 leading-tight">
              Đăng nhập Secure<br />Client
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 text-sm text-center border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">
                Địa chỉ email / Tài khoản
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 focus:border-[#df7a36] focus:ring-1 focus:ring-[#df7a36] outline-none text-sm transition-colors"
                placeholder="Nhập tài khoản admin..."
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[13px] font-medium text-gray-600">
                  Mật khẩu
                </label>
                <Link href="#" className="text-[13px] text-[#df7a36] hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 focus:border-[#df7a36] focus:ring-1 focus:ring-[#df7a36] outline-none text-sm transition-colors"
                placeholder="••••••••••••"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="remember" className="w-4 h-4 text-[#df7a36] border-gray-300 rounded cursor-pointer" />
              <label htmlFor="remember" className="text-[13px] text-gray-600 cursor-pointer">
                Ghi nhớ thông tin đăng nhập
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#df7a36] hover:bg-[#d65a18] text-white font-bold py-2.5 px-4 text-sm transition-colors disabled:opacity-70 mt-2 shadow-md"
            >
              {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-8 text-center text-[13px] text-gray-500 pt-6 border-t border-gray-100">
            Bạn chưa có tài khoản? <Link href="#" className="text-[#df7a36] hover:underline">Tạo tài khoản mới</Link>
          </div>

        </div>
      </div>
    </div>
  );
}