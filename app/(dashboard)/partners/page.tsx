'use client';
import { useState, useEffect } from 'react';

const initialForm = { id: null, type: 'CUSTOMER', name: '', tax_code: '', contact_person: '', phone: '', email: '', address: '' };

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPartners = async () => {
    setLoading(true);
    const res = await fetch('/api/partners');
    const json = await res.json();
    if (json.success) setPartners(json.data);
    setLoading(false);
  };

  useEffect(() => { fetchPartners(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const method = formData.id ? 'PUT' : 'POST';
    try {
      const res = await fetch('/api/partners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchPartners();
      } else alert(data.message);
    } catch (err) {
      alert('Lỗi kết nối');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xoá đối tác này?')) return;
    const res = await fetch(`/api/partners?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) fetchPartners();
    else alert(data.message);
  };

  const filtered = partners.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: 'auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>Danh Bạ Đối Tác</h1>
      
      <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button onClick={() => { setFormData(initialForm); setIsModalOpen(true); }} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            + Thêm Đối Tác Mới
          </button>
          <input type="text" placeholder="Tìm tên đối tác..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px', width: '300px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
        </div>

        {loading ? <p>Đang tải...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                <th style={{ padding: '12px' }}>Phân Loại</th>
                <th style={{ padding: '12px' }}>Tên Đối Tác</th>
                <th style={{ padding: '12px' }}>Điện Thoại</th>
                <th style={{ padding: '12px' }}>MST</th>
                <th style={{ padding: '12px' }}>Công Nợ</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', backgroundColor: p.type === 'CUSTOMER' ? '#dbeafe' : '#fce7f3', color: p.type === 'CUSTOMER' ? '#1e40af' : '#be185d' }}>
                      {p.type === 'CUSTOMER' ? 'Khách Hàng' : p.type === 'SUPPLIER' ? 'Nhà Cung Cấp' : 'Cả Hai'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.name}</td>
                  <td style={{ padding: '12px' }}>{p.phone}</td>
                  <td style={{ padding: '12px' }}>{p.tax_code}</td>
                  <td style={{ padding: '12px', color: '#b91c1c', fontWeight: 'bold' }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.debt_balance || 0)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button onClick={() => { setFormData(p); setIsModalOpen(true); }} style={{ marginRight: '10px', cursor: 'pointer' }}>Sửa</button>
                    <button onClick={() => handleDelete(p.id)} style={{ color: 'red', cursor: 'pointer' }}>Xoá</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '500px' }}>
            <h2 style={{ marginTop: 0 }}>{formData.id ? 'Sửa Đối Tác' : 'Thêm Đối Tác'}</h2>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Loại đối tác:</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                  <option value="CUSTOMER">Khách Hàng (Bán ra)</option>
                  <option value="SUPPLIER">Nhà Cung Cấp (Mua vào)</option>
                  <option value="BOTH">Cả Hai</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Tên Đối Tác (Công ty / Cá nhân):</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Mã Số Thuế:</label>
                  <input type="text" value={formData.tax_code} onChange={e => setFormData({...formData, tax_code: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Điện Thoại:</label>
                  <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Địa Chỉ:</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 15px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9fafb' }}>Huỷ</button>
                <button type="submit" disabled={isSaving} style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {isSaving ? 'Đang lưu...' : 'Lưu Đối Tác'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}