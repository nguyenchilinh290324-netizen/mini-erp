'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePOPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [supplierId, setSupplierId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  
  const [items, setItems] = useState([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load danh sách nhà cung cấp & sản phẩm từ API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, prodRes] = await Promise.all([
          fetch('/api/suppliers'),
          fetch('/api/products')
        ]);
        
        const supData = await supRes.json();
        const prodData = await prodRes.json();
        
        if (Array.isArray(supData)) setSuppliers(supData);
        if (Array.isArray(prodData)) setProducts(prodData);
      } catch (err) {
        console.error('Lỗi tải dữ liệu:', err);
      }
    };
    fetchData();
  }, []);

  const handleProductChange = (index: number, val: string) => {
    const newItems = [...items];
    const selectedProd = products.find(p => p.id.toString() === val);
    
    newItems[index].productId = val;
    // Tự động điền giá vốn (cost_price) khi chọn sản phẩm
    if (selectedProd) {
      newItems[index].unitPrice = Number(selectedProd.cost_price || 0);
    }
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: string, val: string) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = Number(val);
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { productId: '', quantity: 1, unitPrice: 0 }]);
  
  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      alert('Vui lòng chọn nhà cung cấp!');
      return;
    }
    
    const validItems = items.filter(i => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: supplierId,
          order_date: orderDate,
          expected_date: expectedDate || null,
          total_amount: totalAmount,
          items: validItems
        })
      });

      if (res.ok) {
        alert('Tạo PO thành công!');
        router.push('/purchase-orders'); // Chuyển về trang danh sách PO
      } else {
        const errorData = await res.json();
        alert('Lỗi: ' + (errorData.error || 'Không thể tạo PO'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Tạo Đơn Mua Hàng (PO)</h1>
      
      <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        
        {/* THÔNG TIN CHUNG */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Nhà Cung Cấp (*):</label>
            <select 
              required
              value={supplierId} 
              onChange={e => setSupplierId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            >
              <option value="">-- Chọn Nhà Cung Cấp --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Ngày Lập Đơn (*):</label>
            <input 
              type="date" 
              required
              value={orderDate} 
              onChange={e => setOrderDate(e.target.value)}
              style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Ngày Yêu Cầu Giao (Dự kiến):</label>
            <input 
              type="date" 
              value={expectedDate} 
              onChange={e => setExpectedDate(e.target.value)}
              style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>
        </div>

        <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}></div>

        {/* CHI TIẾT SẢN PHẨM */}
        <div style={{ marginBottom: '12px', fontWeight: 600, color: '#334155' }}>Chi Tiết Hàng Hoá</div>
        
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ flex: '2' }}>
              <select 
                value={item.productId} 
                onChange={e => handleProductChange(index, e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              >
                <option value="">-- Chọn sản phẩm --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ flex: '1' }}>
              <input 
                type="number" 
                min="1"
                placeholder="Số lượng"
                value={item.quantity} 
                onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                title="Số lượng nhập"
              />
            </div>
            
            <div style={{ flex: '1' }}>
              <input 
                type="number" 
                min="0"
                placeholder="Đơn giá"
                value={item.unitPrice} 
                onChange={e => handleItemChange(index, 'unitPrice', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                title="Đơn giá nhập"
              />
            </div>

            <div style={{ flex: '1', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
              {formatCurrency(item.quantity * item.unitPrice)}
            </div>
            
            <div>
              <button 
                type="button" 
                onClick={() => removeItem(index)}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', padding: '10px' }}
                disabled={items.length === 1}
              >
                Xoá
              </button>
            </div>
          </div>
        ))}

        <button 
          type="button" 
          onClick={addItem}
          style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#334155', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
        >
          + Thêm Dòng Sản Phẩm
        </button>

        <div style={{ borderBottom: '1px solid #e2e8f0', margin: '32px 0' }}></div>

        {/* TỔNG TIỀN & XÁC NHẬN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
            Tổng cộng: <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '22px' }}>{formatCurrency(totalAmount)}</span>
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '6px', fontWeight: 700, fontSize: '15px', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 
            }}
          >
            {isSubmitting ? 'Đang tạo...' : 'Xác Nhận & Tạo Đơn (PO)'}
          </button>
        </div>
      </form>
    </div>
  );
}