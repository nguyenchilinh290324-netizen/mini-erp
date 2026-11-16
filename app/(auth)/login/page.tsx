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
    <div className="min-h-screen flex flex-col bg-blue-600">
      
      {/* THANH MENU TRÊN CÙNG */}
      <div className="bg-white h-10 w-full flex justify-end items-center px-4 md:px-12 gap-6 text-sm text-gray-600 border-b">
        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
          <span>🛒</span> Xem giỏ hàng
        </button>
        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
          <span>🇻🇳</span> Tiếng Việt ▾
        </button>
        <button className="hover:text-blue-600 transition-colors">VND ▾</button>
        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
          <span>👤</span> Tài khoản của tôi ▾
        </button>
      </div>

      {/* KHU VỰC FORM ĐĂNG NHẬP CĂN GIỮA */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-[400px] p-8 shadow-2xl rounded-lg">
          
          <h1 className="text-[26px] font-bold text-center text-gray-900 mb-8 leading-tight">
            Đăng nhập Secure<br />Client
          </h1>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 text-sm text-center border border-red-100 rounded">
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm transition-colors"
                placeholder="Nhập tài khoản admin..."
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[13px] font-medium text-gray-600">
                  Mật khẩu
                </label>
                <Link href="#" className="text-[13px] text-blue-600 hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm transition-colors"
                placeholder="••••••••••••"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="remember" className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer" />
              <label htmlFor="remember" className="text-[13px] text-gray-600 cursor-pointer">
                Ghi nhớ thông tin đăng nhập
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded text-sm transition-colors disabled:opacity-70 mt-2 shadow-md shadow-blue-500/30"
            >
              {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-8 text-center text-[13px] text-gray-500 pt-6 border-t border-gray-100">
            Bạn chưa có tài khoản? <Link href="#" className="text-blue-600 font-medium hover:underline">Tạo tài khoản mới</Link>
          </div>

        </div>
      </div>
    </div>
  );
}