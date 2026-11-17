'use client';

import { useState, useEffect } from 'react';

export default function InventoryTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/inventory-transactions');
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error('Lỗi tải dữ liệu lịch sử:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const getTransactionTypeLabel = (type: string) => {
    if (type.includes('IN_PO') || type === 'IN') {
      return <span style={{ backgroundColor: '#dcfce3', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '12px' }}>📥 NHẬP KHO</span>;
    }
    if (type.includes('OUT_SO') || type === 'OUT') {
      return <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '12px' }}>📤 XUẤT KHO</span>;
    }
    return <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '12px' }}>{type}</span>;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>🔄 Lịch sử Xuất/Nhập kho</h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>Theo dõi biến động số lượng vật tư, thiết bị</p>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600 }}>Thời gian</th>
              <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600 }}>Sản phẩm (SKU - Tên)</th>
              <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600 }}>Loại GD</th>
              <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600, textAlign: 'center' }}>Số lượng</th>
              <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600 }}>Mã tham chiếu</th>
              <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600 }}>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu...</td></tr>
            ) : transactions.length > 0 ? (
              transactions.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 24px' }}>{new Date(t.created_at).toLocaleString('vi-VN')}</td>
                  <td style={{ padding: '16px 24px', fontWeight: 500, color: '#0f172a' }}>
                    <span style={{ color: '#0d56a6', fontWeight: 700 }}>{t.sku}</span><br/>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>{t.product_name}</span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>{getTransactionTypeLabel(t.transaction_type)}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, fontSize: '16px', color: t.transaction_type.includes('IN') ? '#16a34a' : '#dc2626' }}>
                    {t.transaction_type.includes('IN') ? '+' : '-'}{t.quantity}
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: '#334155' }}>{t.reference_code || '-'}</td>
                  <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '13px' }}>{t.notes}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Chưa có giao dịch xuất/nhập kho nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}