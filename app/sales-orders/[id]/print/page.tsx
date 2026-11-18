'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function PrintQuotationPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    // Tải dữ liệu đơn hàng
    fetch(`/api/sales-orders/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        // Tự động mở hộp thoại In/Lưu PDF sau 1 giây khi render xong
        setTimeout(() => window.print(), 1000);
      });
  }, [params.id]);

  if (!order) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu Báo giá...</div>;
  
  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div style={{ backgroundColor: '#e5e7eb', minHeight: '100vh', padding: '20px 0' }}>
        <div className="print-container" style={{ backgroundColor: '#fff', padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: '"Times New Roman", Times, serif', color: '#000', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            
            {/* Cấu hình CSS cho máy in A4 */}
            <style dangerouslySetInnerHTML={{__html: `
            @media print {
                body { background: white !important; margin: 0; padding: 0; }
                .print-container { box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
                @page { size: A4; margin: 15mm; }
                .no-print { display: none !important; }
            }
            `}} />
            
            {/* Header Công ty KMĐ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '24px' }}>
            <div>
                <h2 style={{ margin: 0, fontSize: '18px', textTransform: 'uppercase', color: '#0d56a6' }}>CÔNG TY TNHH CÔNG NGHỆ KIM MINH ĐÀI VIỆT NAM</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px' }}>Khu Công nghiệp Thương mại và Dịch vụ VSIP Bắc Ninh II, Xã Tam Giang, Huyện Yên Phong, Bắc Ninh</p>
                <p style={{ margin: '4px 0 0', fontSize: '13px' }}>SĐT: 0898997570 - Người phụ trách: Linh</p>
            </div>
            </div>

            {/* Tiêu đề Báo giá */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ margin: 0, fontSize: '26px' }}>BẢNG BÁO GIÁ</h1>
            <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 'normal' }}>报价单 / QUOTATION</h3>
            <p style={{ margin: '8px 0 0', fontSize: '14px', fontStyle: 'italic' }}>Mã Số (Ref No): <strong>{order.display_number}</strong></p>
            </div>

            {/* Thông tin Khách hàng */}
            <div style={{ marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>
            <p style={{ margin: 0 }}><strong>Kính gửi (To):</strong> {order.partner_name}</p>
            <p style={{ margin: 0 }}><strong>Người liên hệ (Attn):</strong> {order.contact_person || '-'} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>SĐT (Tel):</strong> {order.phone || '-'}</p>
            <p style={{ margin: 0 }}><strong>Ngày báo giá (Date):</strong> {new Date(order.order_date).toLocaleDateString('vi-VN')}</p>
            <p style={{ margin: 0 }}><strong>Ghi chú (Notes):</strong> {order.notes || '-'}</p>
            </div>

            {/* Bảng chi tiết hàng hóa */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '14px' }}>
            <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ border: '1px solid #000', padding: '10px 4px', textAlign: 'center', width: '50px' }}>STT</th>
                    <th style={{ border: '1px solid #000', padding: '10px 8px', textAlign: 'left' }}>Tên Hàng Hóa / Tên Tiếng Trung<br/><span style={{fontSize: '11px', fontWeight: 'normal'}}>Descriptions</span></th>
                    <th style={{ border: '1px solid #000', padding: '10px 4px', textAlign: 'center', width: '60px' }}>ĐVT<br/><span style={{fontSize: '11px', fontWeight: 'normal'}}>Unit</span></th>
                    <th style={{ border: '1px solid #000', padding: '10px 4px', textAlign: 'center', width: '70px' }}>Số Lượng<br/><span style={{fontSize: '11px', fontWeight: 'normal'}}>Qty</span></th>
                    <th style={{ border: '1px solid #000', padding: '10px 8px', textAlign: 'right', width: '110px' }}>Đơn Giá<br/><span style={{fontSize: '11px', fontWeight: 'normal'}}>Price (VND)</span></th>
                    <th style={{ border: '1px solid #000', padding: '10px 8px', textAlign: 'right', width: '120px' }}>Thành Tiền<br/><span style={{fontSize: '11px', fontWeight: 'normal'}}>Amount (VND)</span></th>
                </tr>
            </thead>
            <tbody>
                {order.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #000', padding: '8px' }}>
                            <strong style={{ display: 'block', marginBottom: '2px' }}>{item.product_name}</strong>
                            <span style={{ fontSize: '13px' }}>{item.name_zh}</span>
                        </td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.unit || 'Cái'}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatCurrency(Number(item.unit_price))}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatCurrency(Number(item.quantity) * Number(item.unit_price))}</td>
                    </tr>
                ))}
            </tbody>
            </table>

            {/* Tổng tiền */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '40px', fontSize: '14px' }}>
                <table style={{ width: '320px', borderCollapse: 'collapse' }}>
                <tbody>
                    <tr>
                        <td style={{ padding: '6px', fontWeight: 'bold' }}>Cộng tiền hàng (Subtotal):</td>
                        <td style={{ padding: '6px', textAlign: 'right' }}>{formatCurrency(Number(order.total_amount) - Number(order.vat_amount || 0))}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '6px', fontWeight: 'bold' }}>Thuế GTGT (VAT {order.vat_rate || 0}%):</td>
                        <td style={{ padding: '6px', textAlign: 'right' }}>{formatCurrency(Number(order.vat_amount || 0))}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '6px', fontWeight: 'bold', fontSize: '16px', borderTop: '2px solid #000' }}>Tổng Thanh Toán (Total):</td>
                        <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px', borderTop: '2px solid #000' }}>{formatCurrency(Number(order.total_amount))}</td>
                    </tr>
                </tbody>
                </table>
            </div>

            {/* Chữ ký */}
            <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', marginTop: '50px', fontSize: '14px' }}>
            <div style={{ width: '40%' }}>
                <strong>ĐẠI DIỆN KHÁCH HÀNG</strong><br/>
                <span style={{ fontSize: '12px' }}>Customer's Representative</span>
                <p style={{ marginTop: '8px', fontStyle: 'italic' }}>(Ký và ghi rõ họ tên)</p>
            </div>
            <div style={{ width: '40%' }}>
                <strong>ĐẠI DIỆN BÊN BÁO GIÁ</strong><br/>
                <span style={{ fontSize: '12px' }}>Supplier's Representative</span>
                <p style={{ marginTop: '8px', fontStyle: 'italic' }}>(Ký và ghi rõ họ tên)</p>
            </div>
            </div>

            {/* Các nút hành động (Sẽ bị ẩn khi in ra PDF nhờ class no-print) */}
            <div className="no-print" style={{ textAlign: 'center', marginTop: '80px', borderTop: '1px dashed #cbd5e1', paddingTop: '20px' }}>
            <button onClick={() => window.print()} style={{ padding: '10px 24px', background: '#0d56a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>🖨️ In / Lưu PDF</button>
            <button onClick={() => window.close()} style={{ padding: '10px 24px', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '12px', fontWeight: 600 }}>Đóng Tab Này</button>
            </div>
        </div>
    </div>
  );
}