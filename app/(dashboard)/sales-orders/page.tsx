'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SalesOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // State khóa nút tránh bấm 2 lần
  const [isApproving, setIsApproving] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales-orders');
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/sales-orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data);
      } else {
        alert('Lỗi tải chi tiết đơn hàng');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // HÀM MỚI: XỬ LÝ DUYỆT XUẤT KHO
  const handleApprove = async () => {
    if (!selectedOrder || !confirm('Bạn có chắc chắn muốn duyệt đơn SO này? Hệ thống sẽ tự động trừ tồn kho.')) return;
    
    setIsApproving(true);
    try {
      const res = await fetch(`/api/sales-orders/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: selectedOrder.id })
      });

      if (res.ok) {
        alert('Duyệt và xuất kho thành công!');
        setSelectedOrder(null); // Đóng popup
        loadOrders(); // Tải lại danh sách SO
      } else {
        const data = await res.json();
        alert('Lỗi: ' + (data.error || 'Không thể xuất kho'));
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsApproving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '12px' }}>⏳ CHỜ DUYỆT / XUẤT</span>;
      case 'APPROVED': return <span style={{ background: '#dbeafe', color: '#2563eb', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '12px' }}>📝 ĐÃ DUYỆT / CHỜ GIAO</span>;
      case 'COMPLETED': return <span style={{ background: '#dcfce3', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '12px' }}>✅ ĐÃ GIAO / HOÀN THÀNH</span>;
      case 'CANCELLED': return <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '12px' }}>❌ ĐÃ HUỶ</span>;
      default: return <span>{status}</span>;
    }
  };

  const filtered = orders.filter(o => 
    o.display_number?.toLowerCase().includes(search.toLowerCase()) || 
    o.partner_name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>🛒 Quản lý Đơn Bán Hàng (SO)</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>Quản lý xuất hàng, theo dõi đơn bán và doanh thu</p>
        </div>
        <Link 
          href="/sales-orders/create"
          style={{ backgroundColor: '#ea580c', color: '#fff', padding: '10px 18px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          + Tạo Đơn Bán Hàng (SO)
        </Link>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Tra cứu Mã SO, Tên Khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '400px', padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Mã Đơn SO</th>
              <th style={{ padding: '12px' }}>Khách Hàng</th>
              <th style={{ padding: '12px' }}>Ngày Lập Đơn</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Tổng Tiền (VND)</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Trạng Thái</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách Đơn hàng...</td></tr>
            ) : filtered.length > 0 ? (
              filtered.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#0d56a6' }}>{o.display_number}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{o.partner_name} <br/><span style={{fontSize: '12px', color: '#64748b', fontWeight: 400}}>{o.partner_code}</span></td>
                  <td style={{ padding: '12px' }}>{new Date(o.order_date).toLocaleDateString('vi-VN')}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#ea580c' }}>{formatCurrency(Number(o.total_amount))}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{getStatusBadge(o.status)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => openDetail(o.id)}
                        style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                      >
                        Xem
                      </button>
                      
                      {o.status === 'PENDING' && (
                        <Link 
                          href={`/sales-orders/${o.id}/edit`}
                          style={{ background: '#eab308', color: '#fff', border: '1px solid #ca8a04', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
                        >
                          Sửa
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Chưa có Đơn bán hàng nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* POPUP CHI TIẾT */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '900px', borderRadius: '10px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Chi tiết Đơn Bán (SO): <span style={{ color: '#0d56a6' }}>{selectedOrder.display_number}</span></h2>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
              <div>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#475569' }}>Khách Hàng: <strong style={{ color: '#0f172a' }}>{selectedOrder.partner_name}</strong></p>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#475569' }}>Liên hệ: {selectedOrder.contact_person || '-'} - {selectedOrder.phone || ''}</p>
                <p style={{ margin: '0 0 0 0', fontSize: '14px', color: '#475569' }}>Ghi chú: <span style={{ fontStyle: 'italic', color: '#b91c1c' }}>{selectedOrder.notes || '(Không có)'}</span></p>
              </div>
              <div>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#475569' }}>Ngày lập: {new Date(selectedOrder.order_date).toLocaleDateString('vi-VN')}</p>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#475569' }}>Trạng thái hiện tại: {getStatusBadge(selectedOrder.status)}</p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>SKU</th>
                  <th style={{ padding: '10px' }}>Tên SP / Tên Tiếng Trung</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>ĐVT</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>SL</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Đơn giá Bán</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item: any, idx: number) => {
                  const itemTotal = Number(item.quantity) * Number(item.unit_price);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{item.sku}</td>
                      <td style={{ padding: '10px' }}><div>{item.product_name}</div><div style={{ fontSize: '12px', color: '#64748b' }}>{item.name_zh}</div></td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>{item.unit || 'Cái'}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(Number(item.unit_price))}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#15803d' }}>{formatCurrency(itemTotal)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569' }}><span>Cộng tiền hàng:</span><span style={{ fontWeight: 600 }}>{formatCurrency(Number(selectedOrder.total_amount) - Number(selectedOrder.vat_amount || 0))}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569' }}><span>Thuế GTGT ({selectedOrder.vat_rate || 0}%):</span><span style={{ fontWeight: 600 }}>{formatCurrency(Number(selectedOrder.vat_amount || 0))}</span></div>
                  <div style={{ borderBottom: '1px solid #e2e8f0', margin: '4px 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Tổng Thanh Toán:</span><span style={{ padding: '0', textAlign: 'right', fontWeight: 700, fontSize: '20px', color: '#ea580c' }}>{formatCurrency(Number(selectedOrder.total_amount))}</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '2px solid #e2e8f0', paddingTop: '16px' }}>
              <button onClick={() => setSelectedOrder(null)} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Đóng</button>
              
              {/* ĐÃ TÍCH HỢP HÀM DUYỆT VÀO NÚT NÀY */}
              {selectedOrder.status === 'PENDING' && (
                <button 
                  onClick={handleApprove} 
                  disabled={isApproving}
                  style={{ 
                    padding: '10px 20px', borderRadius: '6px', border: 'none', 
                    background: '#ea580c', color: '#fff', fontWeight: 600, 
                    cursor: isApproving ? 'not-allowed' : 'pointer',
                    opacity: isApproving ? 0.7 : 1
                  }}
                >
                  {isApproving ? 'Đang duyệt xuất...' : 'Duyệt Xuất Kho'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}