'use client';

import { useState, useEffect } from 'react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    name_zh: '',
    contact_person: '',
    phone: '',
    address: ''
  });

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      if (Array.isArray(data)) setSuppliers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ code: '', name: '', name_zh: '', contact_person: '', phone: '', address: '' });
      loadSuppliers();
    } else {
      alert('Không thể lưu nhà cung cấp');
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.code?.toLowerCase().includes(search.toLowerCase()) ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.name_zh?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search)
  );

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>
          🤝 Quản lý Nhà cung cấp & Đối tác
        </h1>
        <button
          onClick={() => setShowModal(true)}
          style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
        >
          + Thêm Nhà Cung Cấp
        </button>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Tìm theo Mã NCC, Tên công ty, Tên tiếng Trung, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '360px', padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Mã NCC</th>
              <th style={{ padding: '12px' }}>Tên Nhà Cung Cấp</th>
              <th style={{ padding: '12px' }}>Tên Tiếng Trung</th>
              <th style={{ padding: '12px' }}>Người Phụ Trách</th>
              <th style={{ padding: '12px' }}>Số Điện Thoại</th>
              <th style={{ padding: '12px' }}>Địa Chỉ Kho / Nhà Máy</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center' }}>Đang tải dữ liệu...</td></tr>
            ) : filtered.length > 0 ? (
              filtered.map((s) => (
                <tr key={s.id || s.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#047857' }}>{s.code}</td>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                  <td style={{ padding: '12px', color: '#0d56a6' }}>{s.name_zh || '-'}</td>
                  <td style={{ padding: '12px' }}>{s.contact_person || '-'}</td>
                  <td style={{ padding: '12px' }}>{s.phone || '-'}</td>
                  <td style={{ padding: '12px', color: '#475569' }}>{s.address || '-'}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu nhà cung cấp.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '500px', borderRadius: '10px', padding: '24px' }}>
            <h2 style={{ marginTop: 0, fontSize: '18px' }}>Thêm / Cập nhật Nhà cung cấp</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input required placeholder="Mã Nhà cung cấp (VD: NCC-003)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={{ padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              <input required placeholder="Tên Nhà cung cấp (Tiếng Việt)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              <input placeholder="Tên Tiếng Trung (中文名称)" value={form.name_zh} onChange={(e) => setForm({ ...form, name_zh: e.target.value })} style={{ padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              <input placeholder="Người phụ trách liên hệ" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} style={{ padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              <input placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              <input placeholder="Địa chỉ" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={{ padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Huỷ</button>
                <button type="submit" style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Lưu Nhà Cung Cấp</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}