'use client';
import { useState, useEffect } from 'react';

export default function CreatePOPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Trạng thái của Form
  const [partnerId, setPartnerId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  
  // Trạng thái của giỏ hàng (các dòng sản phẩm)
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tải danh sách Nhà cung cấp và Sản phẩm
  useEffect(() => {
    const fetchData = async () => {
      const [resPartners, resProducts] = await Promise.all([
        fetch('/api/partners'),
        fetch('/api/products')
      ]);
      const jsonPartners = await resPartners.json();
      const jsonProducts = await resProducts.json();
      
      // Chỉ lấy nhà cung cấp (SUPPLIER hoặc BOTH)
      if (jsonPartners.success) {
        setSuppliers(jsonPartners.data.filter((p: any) => p.type !== 'CUSTOMER'));
      }
      if (jsonProducts.success) {
        setProducts(jsonProducts.data);
      }
    };
    fetchData();
  }, []);

  // Xử lý thay đổi dữ liệu trên từng dòng sản phẩm
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    
    if (field === 'product_id') {
      // Tự động điền giá vốn (Cost Price) khi chọn sản phẩm
      const selectedProd = products.find(p => p.id.toString() === value);
      newItems[index] = { 
        ...newItems[index], 
        product_id: value, 
        unit_price: selectedProd ? Number(selectedProd.cost_price) : 0 
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: Number(value) };
    }
    setItems(newItems);
  };

  // Thêm / Xoá dòng sản phẩm
  const addItem = () => setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  // Tính tổng tiền đơn hàng
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId) return alert('Vui lòng chọn Nhà cung cấp!');
    if (items.some(item => !item.product_id)) return alert('Vui lòng chọn sản phẩm cho tất cả các dòng!');
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: partnerId,
          order_date: orderDate,
          delivery_date: deliveryDate || null,
          total_amount: totalAmount,
          items: items
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🎉 ${data.message} Mã đơn: ${data.order_code}`);
        // Reset form hoặc chuyển hướng về trang danh sách PO
        setPartnerId('');
        setItems([{ product_id: '', quantity: 1, unit_price: 0 }]);
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: 'auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>Tạo Đơn Mua Hàng (PO)</h1>
      
      <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        
        {/* THÔNG TIN CHUNG */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nhà Cung Cấp (*):</label>
            <select required value={partnerId} onChange={e => setPartnerId(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
              <option value="">-- Chọn Nhà Cung Cấp --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {s.phone}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ngày Lập Đơn (*):</label>
            <input required type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ngày Yêu Cầu Giao (Dự kiến):</label>
            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
          </div>
        </div>

        {/* CHI TIẾT SẢN PHẨM */}
        <h3 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', marginBottom: '15px' }}>Chi Tiết Hàng Hoá</h3>
        
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ flex: 3 }}>
              <select required value={item.product_id} onChange={e => handleItemChange(index, 'product_id', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                <option value="">-- Chọn sản phẩm --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <input required type="number" min="1" placeholder="SL" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
            </div>
            
            <div style={{ flex: 1 }}>
              <input required type="number" placeholder="Đơn giá" value={item.unit_price} onChange={e => handleItemChange(index, 'unit_price', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
            </div>
            
            <div style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#166534' }}>
              {new Intl.NumberFormat('vi-VN').format(item.quantity * item.unit_price)} đ
            </div>
            
            <button type="button" onClick={() => removeItem(index)} disabled={items.length === 1} style={{ padding: '8px 12px', color: 'red', border: 'none', background: 'none', cursor: items.length > 1 ? 'pointer' : 'not-allowed' }}>
              Xoá
            </button>
          </div>
        ))}
        
        <button type="button" onClick={addItem} style={{ padding: '10px 15px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px' }}>
          + Thêm Dòng Sản Phẩm
        </button>

        {/* TỔNG KẾT & SUBMIT */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e5e7eb' }}>
          <div style={{ fontSize: '20px' }}>
            Tổng cộng: <strong style={{ color: '#b91c1c' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</strong>
          </div>
          
          <button type="submit" disabled={isSubmitting} style={{ padding: '15px 30px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận & Tạo Đơn (PO)'}
          </button>
        </div>
      </form>
    </div>
  );
}