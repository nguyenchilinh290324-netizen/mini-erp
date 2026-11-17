'use client';

import { useState, useEffect } from 'react';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/deliveries');
      const data = await res.json();
      if (Array.isArray(data)) setDeliveries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  const updateStatus = async (id: number, currentStatus: string) => {
    let newStatus = '';
    if (currentStatus === 'PENDING') newStatus = 'IN_TRANSIT';
    else if (currentStatus === 'IN_TRANSIT') newStatus = 'DELIVERED';
    else return;

    if (!confirm(`Xác nhận cập nhật trạng thái đơn này thành: ${newStatus === 'IN_TRANSIT' ? 'ĐANG GIAO' : 'ĐÃ GIAO XONG'}?`)) return;

    const res = await fetch('/api/deliveries', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus })
    });

    if (res.ok) loadDeliveries();
    else alert('Lỗi cập nhật trạng thái');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '12px' }}>⏳ CHỜ LẤY HÀNG</span>;
      case 'IN_TRANSIT': return <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '12px' }}>🚚 ĐANG GIAO</span>;
      case 'DELIVERED': return <span style={{ background: '#dcfce3', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '12px' }}>✅ ĐÃ GIAO XONG</span>;
      case 'CANCELLED': return <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '12px' }}>❌ ĐÃ HUỶ</span>;
      default: return <span>{status}</span>;
    }
  };

  const filtered = deliveries.filter(d => 
    d.tracking_number?.toLowerCase().includes(search.toLowerCase()) || 
    d.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.order_ref?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>🚚 Theo dõi Vận chuyển & Giao nhận</h1>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Tra cứu mã vận đơn (Lalamove), tên khách hàng, mã đơn SO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '400px', padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Mã Vận Đơn</th>
              <th style={{ padding: '12px' }}>Đơn Hàng (Ref)</th>
              <th style={{ padding: '12px' }}>Khách Nhận</th>
              <th style={{ padding: '12px' }}>Đơn Vị & Tài Xế</th>
              <th style={{ padding: '12px' }}>Phí Ship (VND)</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Trạng Thái</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center' }}>Đang tải lộ trình...</td></tr>
            ) : filtered.length > 0 ? (
              filtered.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#0d56a6' }}>{d.tracking_number}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{d.order_ref}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{d.customer_name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>📍 {d.delivery_address}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#f59e0b' }}>{d.carrier}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>📞 {d.driver_name} - {d.driver_phone}</div>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{Number(d.shipping_fee).toLocaleString('vi-VN')}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{getStatusBadge(d.status)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {d.status === 'PENDING' && (
                      <button onClick={() => updateStatus(d.id, d.status)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Giao Tài Xế</button>
                    )}
                    {d.status === 'IN_TRANSIT' && (
                      <button onClick={() => updateStatus(d.id, d.status)} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Xác Nhận Đã Giao</button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Chưa có chuyến giao hàng nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}