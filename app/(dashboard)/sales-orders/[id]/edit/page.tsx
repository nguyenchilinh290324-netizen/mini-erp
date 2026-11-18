'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

// Component Tìm kiếm & Chọn (SearchableSelect)
const SearchableSelect = ({ options, value, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt: any) => opt.id.toString() === value?.toString());
  const filteredOptions = options.filter((opt: any) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => { setIsOpen(!isOpen); setSearchTerm(''); }}
        style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ color: selectedOption ? '#0f172a' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span style={{ fontSize: '12px', color: '#64748b' }}>▼</span>
      </div>

      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: '4px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <input autoFocus type="text" placeholder="Gõ để tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px', border: 'none', borderBottom: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} />
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {filteredOptions.length > 0 ? filteredOptions.map((opt: any) => (
              <div key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); }} style={{ padding: '10px 14px', fontSize: '14px', cursor: 'pointer', backgroundColor: value === opt.id ? '#f0f9ff' : 'transparent', borderBottom: '1px solid #f8fafc' }}>
                {opt.label}
              </div>
            )) : <div style={{ padding: '10px 14px', fontSize: '14px', color: '#94a3b8', textAlign: 'center' }}>Không tìm thấy kết quả</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default function EditSOPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;

  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orderNumber, setOrderNumber] = useState('');
  
  const [customerId, setCustomerId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [customOrderCode, setCustomOrderCode] = useState('');
  const [notes, setNotes] = useState('');
  const [vatRate, setVatRate] = useState<number>(0); 
  
  const [items, setItems] = useState([{ productId: '', quantity: 1, unitPrice: 0, unit: '', nameZh: '' }]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([ fetch('/api/customers'), fetch('/api/products') ]);
        const custData = await custRes.json();
        const prodData = await prodRes.json();
        if (Array.isArray(custData)) setCustomers(custData);
        if (Array.isArray(prodData)) setProducts(prodData);

        // Lấy chi tiết đơn hàng
        const orderRes = await fetch(`/api/sales-orders/${orderId}`);
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          if (orderData.status !== 'PENDING') {
            alert('Chỉ có thể sửa đơn hàng Đang chờ duyệt!');
            router.push('/sales-orders');
            return;
          }
          
          setOrderNumber(orderData.display_number);
          setCustomOrderCode(orderData.display_number);
          setCustomerId(orderData.partner_id?.toString() || '');
          setOrderDate(orderData.order_date ? new Date(orderData.order_date).toISOString().split('T')[0] : '');
          setExpectedDate(orderData.expected_date ? new Date(orderData.expected_date).toISOString().split('T')[0] : '');
          setNotes(orderData.notes || '');
          setVatRate(Number(orderData.vat_rate) || 0);
          
          if (orderData.items && orderData.items.length > 0) {
            setItems(orderData.items.map((i: any) => ({
              productId: i.product_id?.toString(),
              quantity: Number(i.quantity),
              unitPrice: Number(i.unit_price),
              unit: i.unit || 'Cái',
              nameZh: i.name_zh || ''
            })));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [orderId, router]);

  const customerOptions = customers.map(c => ({ id: c.id, label: `${c.code || 'KH'} - ${c.name}` }));
  const productOptions = products.map(p => ({ id: p.id, label: `${p.sku} - ${p.name}` }));

  const handleProductChange = (index: number, val: string) => {
    const newItems = [...items];
    const selectedProd = products.find(p => p.id.toString() === val.toString());
    newItems[index].productId = val;
    if (selectedProd) {
      newItems[index].unitPrice = Number(selectedProd.sell_price || 0);
      newItems[index].unit = selectedProd.unit || 'Cái';
      newItems[index].nameZh = selectedProd.name_zh || '';
    }
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: string, val: string) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = Number(val);
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { productId: '', quantity: 1, unitPrice: 0, unit: '', nameZh: '' }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const subTotalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const vatAmount = subTotalAmount * (vatRate / 100);
  const totalAmount = subTotalAmount + vatAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return alert('Vui lòng chọn khách hàng!');
    const validItems = items.filter(i => i.productId && i.quantity > 0);
    if (validItems.length === 0) return alert('Vui lòng chọn ít nhất 1 sản phẩm!');

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/sales-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: customerId,
          order_date: orderDate,
          expected_date: expectedDate || null,
          custom_order_code: customOrderCode,
          total_amount: totalAmount,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          notes: notes,
          items: validItems
        })
      });

      if (res.ok) {
        alert('Cập nhật SO thành công!');
        router.push('/sales-orders');
      } else {
        const errorData = await res.json();
        alert('Lỗi: ' + (errorData.error || 'Không thể cập nhật SO'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu đơn hàng...</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Chỉnh sửa Đơn Bán (SO): <span style={{color: '#ea580c'}}>{orderNumber}</span></h1>
        <button onClick={() => router.push('/sales-orders')} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>Quay lại</button>
      </div>
      
      <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        
        {/* THÔNG TIN CHUNG */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Khách Hàng (*):</label>
            <SearchableSelect options={customerOptions} value={customerId} onChange={setCustomerId} placeholder="-- Chọn Khách hàng --" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Mã SO (Có thể sửa):</label>
            <input type="text" value={customOrderCode} onChange={e => setCustomOrderCode(e.target.value)} style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Ngày Lập Đơn (*):</label>
            <input type="date" required value={orderDate} onChange={e => setOrderDate(e.target.value)} style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Ngày Giao Hàng:</label>
            <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Ghi chú Đơn hàng (Tiếng Việt / Trung):</label>
          <input type="text" placeholder="Nhập ghi chú giao hàng, yêu cầu đóng gói..." value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}></div>

        {/* CHI TIẾT HÀNG HÓA */}
        <div style={{ marginBottom: '16px', fontWeight: 600, color: '#334155' }}>Chi Tiết Hàng Hoá</div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
          <div style={{ flex: '2.5' }}>Sản phẩm (Mã - Tên)</div>
          <div style={{ flex: '1.2' }}>Tên Tiếng Trung</div>
          <div style={{ flex: '0.6', textAlign: 'center' }}>ĐVT</div>
          <div style={{ flex: '0.8' }}>Số Lượng</div>
          <div style={{ flex: '1' }}>Đơn Giá Bán</div>
          <div style={{ flex: '1', textAlign: 'right' }}>Thành Tiền</div>
          <div style={{ width: '40px' }}></div>
        </div>

        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: '2.5' }}>
              <SearchableSelect options={productOptions} value={item.productId} onChange={(val: string) => handleProductChange(index, val)} placeholder="-- Chọn SP --" />
            </div>
            
            <div style={{ flex: '1.2' }}>
              <input type="text" readOnly value={item.nameZh} placeholder="Tên CN" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '14px', boxSizing: 'border-box', color: '#64748b' }} />
            </div>

            <div style={{ flex: '0.6' }}>
              <input type="text" readOnly value={item.unit} placeholder="ĐVT" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '14px', boxSizing: 'border-box', textAlign: 'center', color: '#64748b' }} />
            </div>

            <div style={{ flex: '0.8' }}>
              <input type="number" min="1" placeholder="SL" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            
            <div style={{ flex: '1' }}>
              <input type="number" min="0" placeholder="Đơn giá" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ flex: '1', textAlign: 'right', fontWeight: 700, color: '#15803d', fontSize: '15px' }}>
              {formatCurrency(item.quantity * item.unitPrice)}
            </div>
            
            <div style={{ width: '40px', textAlign: 'right' }}>
              <button type="button" onClick={() => removeItem(index)} disabled={items.length === 1} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', opacity: items.length === 1 ? 0.3 : 1 }}>Xoá</button>
            </div>
          </div>
        ))}

        <button type="button" onClick={addItem} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px dashed #cbd5e1', backgroundColor: '#f8fafc', color: '#334155', fontWeight: 600, cursor: 'pointer', fontSize: '13px', width: '100%' }}>
          + Thêm dòng sản phẩm
        </button>

        <div style={{ borderBottom: '1px solid #e2e8f0', margin: '24px 0' }}></div>

        {/* KHU VỰC TỔNG KẾT & VAT */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569' }}>
                    <span>Cộng tiền hàng:</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(subTotalAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Thuế GTGT (VAT):</span>
                        <select value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}>
                            <option value={0}>0%</option>
                            <option value={8}>8%</option>
                            <option value={10}>10%</option>
                        </select>
                    </div>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(vatAmount)}</span>
                </div>
                <div style={{ borderBottom: '1px solid #e2e8f0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Tổng cộng:</span>
                    <span style={{ color: '#ea580c', fontWeight: 700, fontSize: '22px' }}>{formatCurrency(totalAmount)}</span>
                </div>
            </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#eab308', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '6px', fontWeight: 700, fontSize: '15px', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi Đơn SO'}
          </button>
        </div>
      </form>
    </div>
  );
}