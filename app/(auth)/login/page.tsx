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
    <div className="min-h-screen flex flex-col bg-[#d65a18]">
      
      {/* THANH MENU TRÊN CÙNG (GIỐNG TRONG ẢNH) */}
      <div className="bg-white h-10 w-full flex justify-end items-center px-4 md:px-12 gap-6 text-sm text-gray-600 border-b">
        <button className="flex items-center gap-1 hover:text-gray-900">
          <span>🛒</span> Xem giỏ hàng
        </button>
        <button className="flex items-center gap-1 hover:text-gray-900">
          <span>🇻🇳</span> Tiếng Việt ▾
        </button>
        <button className="hover:text-gray-900">VND ▾</button>
        <button className="flex items-center gap-1 hover:text-gray-900">
          <span>👤</span> Tài khoản của tôi ▾
        </button>
      </div>

      {/* KHU VỰC FORM ĐĂNG NHẬP */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-[400px] p-8 shadow-xl rounded-sm">
          
          <h1 className="text-[26px] font-bold text-center text-gray-900 mb-8 leading-tight">
            Đăng nhập Secure<br />Client
          </h1>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 text-sm text-center border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[13px] text-gray-500 mb-1.5">
                Địa chỉ email / Tài khoản
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:border-[#d65a18] focus:ring-1 focus:ring-[#d65a18] outline-none text-sm transition-colors"
                placeholder="Nhập tài khoản admin..."
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[13px] text-gray-500">
                  Mật khẩu
                </label>
                <Link href="#" className="text-[13px] text-[#d65a18] hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:border-[#d65a18] focus:ring-1 focus:ring-[#d65a18] outline-none text-sm transition-colors"
                placeholder="••••••••••••"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="remember" className="w-4 h-4 text-[#d65a18] border-gray-300 rounded" />
              <label htmlFor="remember" className="text-[13px] text-gray-700">
                Ghi nhớ thông tin đăng nhập
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#df7a36] hover:bg-[#d65a18] text-white font-bold py-2.5 px-4 text-sm transition-colors disabled:opacity-70 mt-2"
            >
              {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-8 text-center text-[13px] text-gray-500 pt-6 border-t border-gray-100">
            Bạn chưa có tài khoản? <Link href="#" className="text-[#d65a18] hover:underline">Tạo tài khoản mới</Link>
          </div>

        </div>
      </div>
    </div>
  );
}