'use client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout}
      className="text-sm font-medium text-red-600 hover:text-red-800 bg-red-50 px-4 py-2 rounded-md transition-colors"
    >
      Đăng xuất
    </button>
  );
}