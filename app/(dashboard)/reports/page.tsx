'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/reports');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Lỗi tải báo cáo:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tổng hợp dữ liệu báo cáo...</div>;
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const revenue = Number(data?.kpi?.total_revenue || 0);
  const cost = Number(data?.kpi?.estimated_cost || 0);
  const profit = revenue - cost;
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0';

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>📊 Báo cáo Thống kê & Phân tích</h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>Theo dõi kết quả kinh doanh, lợi nhuận và doanh số bán hàng</p>
      </div>

      {/* 4 THẺ KPI TÀI CHÍNH */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>TỔNG DOANH THU</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1d4ed8', marginTop: '8px' }}>{formatCurrency(revenue)}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #ef4444', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>TỔNG GIÁ VỐN & CHI PHÍ</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#b91c1c', marginTop: '8px' }}>{formatCurrency(cost)}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>LỢI NHUẬN GỘP (KÊNH BÁN)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#047857', marginTop: '8px' }}>{formatCurrency(profit)}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #8b5cf6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>BIÊN LỢI NHUẬN / TỔNG ĐƠN</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#6d28d9', marginTop: '8px' }}>
            {margin}% <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>/ {data?.kpi?.total_orders || 0} đơn</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* BIỂU ĐỒ DOANH THU */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginTop: 0, marginBottom: '20px' }}>📈 Biểu đồ Doanh thu (7 ngày gần nhất)</h3>
          <div style={{ height: '320px', width: '100%' }}>
            {data?.chartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" name="Doanh thu" fill="#0d56a6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Chưa có dữ liệu giao dịch.</div>
            )}
          </div>
        </div>

        {/* BẢNG XẾP HẠNG SẢN PHẨM BÁN CHẠY */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginTop: 0, marginBottom: '20px' }}>🏆 Top 5 Sản phẩm Bán chạy</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data?.topProducts?.length > 0 ? (
              data.topProducts.map((p: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: idx !== data.topProducts.length - 1 ? '1px solid #f1f5f9' : 'none', paddingBottom: idx !== data.topProducts.length - 1 ? '12px' : '0' }}>
                  <div style={{ width: '28px', height: '28px', backgroundColor: idx === 0 ? '#fef08a' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#ffedd5' : '#f8fafc', color: idx < 3 ? '#854d0e' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 700, fontSize: '13px' }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', lineHeight: '1.4' }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{p.sku}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#0d56a6' }}>{p.sold_qty} <span style={{ fontSize: '11px', fontWeight: 400 }}>đã bán</span></div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>Chưa có đơn hàng nào hoàn thành.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}