'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  name_zh: string;
  specification: string;
  unit: string;
  cost_price: number;
  stock_quantity: number;
  image_url: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (Array.isArray(data)) {
          setInventory(data);
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu kho:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // Tính toán các chỉ số kho hàng
  const totalItems = inventory.length;
  const totalStock = inventory.reduce((sum, item) => sum + Number(item.stock_quantity || 0), 0);
  const totalValue = inventory.reduce((sum, item) => sum + (Number(item.stock_quantity || 0) * Number(item.cost_price || 0)), 0);
  const lowStockItems = inventory.filter(item => item.stock_quantity <= 10).length;

  const filtered = inventory.filter(item => 
    item.sku.toLowerCase().includes(search.toLowerCase()) || 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.name_zh && item.name_zh.toLowerCase().includes(search.toLowerCase()))
  );

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      
      {/* TIÊU ĐỀ & NÚT ĐIỀU HƯỚNG */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>🏭 Quản lý Tồn Kho (Kho tổng)</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>Theo dõi số lượng hàng hoá và giá trị lưu kho thực tế</p>
        </div>
        <Link 
          href="/inventory/transactions"
          style={{ backgroundColor: '#0ea5e9', color: '#fff', padding: '10px 18px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          🔄 Xem Thẻ Kho / Lịch sử Xuất Nhập
        </Link>
      </div>

      {/* 4 THẺ THỐNG KÊ (KPI KHO) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>TỔNG MÃ HÀNG (SKU)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>{totalItems} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>mã</span></div>
        </div>
        
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>TỔNG SỐ LƯỢNG TỒN</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>{totalStock} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>sp</span></div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #8b5cf6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>TỔNG GIÁ TRỊ KHO (Theo giá vốn)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>{formatCurrency(totalValue)}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #ef4444', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>CẢNH BÁO SẮP HẾT HÀNG (≤10)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444', marginTop: '8px' }}>{lowStockItems} <span style={{ fontSize: '14px', fontWeight: 400, color: '#ef4444' }}>mã cần nhập</span></div>
        </div>
      </div>

      {/* BẢNG TỒN KHO CHI TIẾT */}
      <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', margin: 0, color: '#1e293b' }}>Chi tiết tồn kho hiện tại</h2>
          <input
            type="text"
            placeholder="Tra cứu nhanh SKU, tên hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '300px', padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px', color: '#475569' }}>Mã SKU</th>
                <th style={{ padding: '12px', color: '#475569' }}>Tên Sản Phẩm (Việt/Trung)</th>
                <th style={{ padding: '12px', color: '#475569' }}>Quy Cách</th>
                <th style={{ padding: '12px', color: '#475569', textAlign: 'center' }}>ĐVT</th>
                <th style={{ padding: '12px', color: '#475569', textAlign: 'right' }}>Đơn Giá Vốn</th>
                <th style={{ padding: '12px', color: '#475569', textAlign: 'center' }}>Tồn Hiện Tại</th>
                <th style={{ padding: '12px', color: '#475569', textAlign: 'right' }}>Tổng Trị Giá (VND)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu kho...</td></tr>
              ) : filtered.length > 0 ? (
                filtered.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: '#0d56a6' }}>{item.sku}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {item.image_url && <img src={item.image_url} alt="img" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }} />}
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.name}</div>
                          {item.name_zh && <div style={{ fontSize: '12px', color: '#64748b' }}>{item.name_zh}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: '#475569' }}>{item.specification || '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#475569' }}>{item.unit}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{formatCurrency(item.cost_price)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        backgroundColor: item.stock_quantity <= 10 ? '#fef2f2' : '#f0fdf4',
                        color: item.stock_quantity <= 10 ? '#ef4444' : '#10b981'
                      }}>
                        {item.stock_quantity}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                      {formatCurrency(Number(item.cost_price) * Number(item.stock_quantity))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Kho chưa có sản phẩm nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}