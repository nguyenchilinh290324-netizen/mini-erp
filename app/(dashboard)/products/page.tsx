'use client';
import { useState, useEffect } from 'react';
import LogoutButton from '@/app/components/LogoutButton';

// Khởi tạo dữ liệu form rỗng
const initialForm = { id: null, sku: '', name: '', category: '', unit: 'Cái', cost_price: 0, sell_price: 0, stock_quantity: 0, image_url: '' };

export default function ProductsPage() {
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        // Gắn thẳng link R2 vào form để chuẩn bị lưu database
        setFormData({ ...formData, image_url: data.url }); 
      } else {
        alert('Lỗi tải ảnh lên R2: ' + data.message);
      }
    } catch (err) {
      alert('Lỗi kết nối khi tải ảnh.');
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  const [products, setProducts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State cho Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProducts = async () => {
    setLoadingData(true);
    const res = await fetch('/api/products');
    const json = await res.json();
    if (json.success) setProducts(json.data);
    setLoadingData(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  // Mở form Thêm mới
  const handleAddNew = () => {
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  // Mở form Sửa
  const handleEdit = (product: any) => {
    setFormData(product);
    setIsModalOpen(true);
  };

  // Lưu dữ liệu (Thêm mới hoặc Cập nhật)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const method = formData.id ? 'PUT' : 'POST'; // Có ID thì PUT, không có thì POST
    
    try {
      const res = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchProducts(); // Tải lại danh sách
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsSaving(false);
    }
  };

  // Xoá sản phẩm
  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xoá mặt hàng này?')) return;
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: 'auto' }}>
      
      {/* Đưa tiêu đề và Nút Đăng xuất lên cùng 1 hàng */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', color: '#111827', margin: 0 }}>Quản lý Danh mục Hàng hoá</h1>
        <LogoutButton />
      </div>
      
      <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <button 
            onClick={handleAddNew}
            style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            + Thêm Sản Phẩm Mới
          </button>
          <input 
            type="text" 
            placeholder="Tìm kiếm theo SKU hoặc Tên..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '10px', width: '300px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
        </div>

        {loadingData ? ( <p>Đang tải dữ liệu...</p> ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                <th style={{ padding: '12px' }}>SKU</th>
                <th style={{ padding: '12px' }}>Tên Hàng Hoá</th>
                <th style={{ padding: '12px' }}>ĐVT</th>
                <th style={{ padding: '12px' }}>Giá Vốn</th>
                <th style={{ padding: '12px' }}>Giá Bán</th>
                <th style={{ padding: '12px' }}>Tồn Kho</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{product.sku}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Hiển thị ảnh thumbnail nhỏ trong bảng nếu có */}
                      {product.image_url && (
                        <img src={product.image_url} alt={product.sku} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      )}
                      {product.name}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>{product.unit}</td>
                  <td style={{ padding: '12px' }}>{product.cost_price}</td>
                  <td style={{ padding: '12px', color: '#15803d', fontWeight: 'bold' }}>{product.sell_price}</td>
                  <td style={{ padding: '12px' }}>{product.stock_quantity}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button onClick={() => handleEdit(product)} style={{ marginRight: '10px', padding: '5px 10px', cursor: 'pointer' }}>Sửa</button>
                    <button onClick={() => handleDelete(product.id)} style={{ padding: '5px 10px', color: 'red', cursor: 'pointer' }}>Xoá</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL FORM THÊM/SỬA SẢN PHẨM */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>{formData.id ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h2>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>SKU:</label>
                <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Tên Hàng Hoá:</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>

              {/* Phần Upload Ảnh */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Ảnh Sản Phẩm:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ flex: 1, padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  {isUploadingImage && <span style={{ color: '#2563eb', fontSize: '14px' }}>Đang tải lên R2...</span>}
                </div>
                {/* Hiển thị ảnh xem trước nếu đã có link */}
                {formData.image_url && (
                  <div style={{ marginTop: '10px', width: '80px', height: '80px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                    <img src={formData.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Danh Mục:</label>
                  <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>ĐVT:</label>
                  <input required type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Giá Vốn:</label>
                  <input type="number" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Giá Bán:</label>
                  <input type="number" value={formData.sell_price} onChange={e => setFormData({...formData, sell_price: Number(e.target.value)})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Tồn Kho:</label>
                  <input type="number" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: Number(e.target.value)})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 15px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9fafb' }}>Huỷ</button>
                <button type="submit" disabled={isSaving} style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {isSaving ? 'Đang lưu...' : 'Lưu Sản Phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}