'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const translations = {
  vi: {
    title: 'Hệ thống Quản lý Cung ứng KMĐ ERP',
    usernamePlaceholder: 'Tài khoản / Mã nhân viên (VD: JM001)',
    passwordPlaceholder: 'Mật khẩu',
    loginBtn: 'Đăng nhập',
    loggingIn: 'Đang xác thực...',
    errorConnect: 'Mất kết nối đến máy chủ',
    errorDefault: 'Đăng nhập thất bại',
  },
  zh: {
    title: '金明台 ERP 采购管理系统',
    usernamePlaceholder: '账号 / 员工编号 (例: JM001)',
    passwordPlaceholder: '密码',
    loginBtn: '登录',
    loggingIn: '登录中...',
    errorConnect: '服务器连接失败',
    errorDefault: '登录失败',
  }
};

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'vi' | 'zh'>('vi');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[lang];

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
        setError(data.error || t.errorDefault);
      }
    } catch (err) {
      setError(t.errorConnect);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#eef2f6',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Segoe UI, Roboto, Arial, sans-serif',
      padding: '20px',
      position: 'relative'
    }}>
      
      {/* NÚT CHUYỂN ĐỔI NGÔN NGỮ VIỆT - TRUNG Ở GÓC TRÊN PHẢI */}
      <div style={{
        position: 'absolute',
        top: '24px',
        right: '32px',
        display: 'flex',
        gap: '8px',
        backgroundColor: '#ffffff',
        padding: '6px 10px',
        borderRadius: '6px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        border: '1px solid #dce1e7'
      }}>
        <button
          type="button"
          onClick={() => setLang('vi')}
          style={{
            padding: '5px 12px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: lang === 'vi' ? 600 : 400,
            backgroundColor: lang === 'vi' ? '#0d56a6' : 'transparent',
            color: lang === 'vi' ? '#ffffff' : '#4b5563',
            fontSize: '13px',
            transition: 'all 0.2s'
          }}
        >
          🇻🇳 Tiếng Việt
        </button>
        <button
          type="button"
          onClick={() => setLang('zh')}
          style={{
            padding: '5px 12px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: lang === 'zh' ? 600 : 400,
            backgroundColor: lang === 'zh' ? '#0d56a6' : 'transparent',
            color: lang === 'zh' ? '#ffffff' : '#4b5563',
            fontSize: '13px',
            transition: 'all 0.2s'
          }}
        >
          🇨🇳 中文
        </button>
      </div>

      {/* KHUNG CHÍNH VIỀN VÀNG CAM GIỐNG HÌNH 1 */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e5a000',
        width: '100%',
        maxWidth: '720px',
        padding: '40px 48px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '48px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        
        {/* CỘT TRÁI: HÌNH ẢNH ĐẠI DIỆN */}
        <div style={{
          width: '230px',
          height: '290px',
          flexShrink: 0,
          backgroundColor: '#f3f4f6',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img
            src="/bg-login.jpg"
            alt="ERP Banner"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>

        {/* CỘT PHẢI: FORM ĐĂNG NHẬP */}
        <div style={{
          flex: 1,
          minWidth: '260px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h1 style={{
            color: '#0d56a6',
            fontSize: '21px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            marginBottom: '26px',
            marginTop: 0,
            lineHeight: '1.4'
          }}>
            {t.title}
          </h1>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              padding: '10px 12px',
              fontSize: '13px',
              border: '1px solid #fecaca',
              marginBottom: '16px',
              borderRadius: '2px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.usernamePlaceholder}
                required
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  color: '#111827',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                required
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 38px 0 12px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  color: '#111827',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  fontSize: '14px'
                }}
                title="Hiện/Ẩn mật khẩu"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                height: '38px',
                backgroundColor: '#0d56a6',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                marginTop: '4px',
                letterSpacing: '1px'
              }}
            >
              {isLoading ? t.loggingIn : t.loginBtn}
            </button>
          </form>

          {/* LOGO VÀ THƯƠNG HIỆU BÊN DƯỚI NÚT ĐĂNG NHẬP */}
          <div style={{
            marginTop: '34px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <img
              src="/logo.png"
              alt="Logo"
              style={{
                height: '34px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
            <div style={{
              backgroundColor: '#0d56a6',
              color: '#ffffff',
              padding: '5px 14px',
              fontWeight: 700,
              fontSize: '16px',
              letterSpacing: '1px'
            }}>
              KIM MINH ĐÀI <span>金明台</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}