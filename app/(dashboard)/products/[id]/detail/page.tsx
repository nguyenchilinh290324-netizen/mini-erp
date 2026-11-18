import { pool } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  let product = null;
  const client = await pool.connect();

  try {
    // Truy vấn chỉ lấy từ bảng products, không JOIN để tránh lỗi sập trang
    const res = await client.query(`SELECT * FROM products WHERE id = $1`, [params.id]);
    
    if (res.rows.length > 0) {
      product = res.rows[0];
    }
  } catch (error) {
    console.error('Lỗi tải chi tiết SP:', error);
  } finally {
    client.release();
  }

  if (!product) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Không tìm thấy sản phẩm hoặc lỗi kết nối.</h2>
        <Link href="/inventory" style={{ color: '#0d56a6' }}>Quay lại trang Kho</Link>
      </div>
    );
  }

  const images = [
    product.image_url || '/placeholder.png',
    product.image_url || '/placeholder.png', 
    product.image_url || '/placeholder.png'
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* Breadcrumb / Nút quay lại */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/inventory" style={{ textDecoration: 'none', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>← Quay lại Kho</Link>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>Chi tiết Vật tư</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '32px', backgroundColor: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        {/* KHU VỰC HÌNH ẢNH (GALLERY) */}
        <div>
          {/* Ảnh chính */}
          <div style={{ width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <img src={images[0]} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f8fafc' }} />
          </div>
          {/* 3 Ảnh phụ (Thumbnails) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {images.map((img, idx) => (
              <div key={idx} style={{ height: '100px', borderRadius: '6px', border: '1px solid #cbd5e1', overflow: 'hidden', cursor: 'pointer' }}>
                <img src={img} alt={`Thumb ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>

        {/* KHU VỰC THÔNG TIN CHI TIẾT */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '4px', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
                SKU: {product.sku}
              </div>
              <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', color: '#0f172a' }}>{product.name}</h1>
              <h2 style={{ fontSize: '18px', margin: '0 0 24px 0', color: '#64748b', fontWeight: 400 }}>{product.name_zh}</h2>
            </div>
            
            {/* Tag Trạng thái tồn kho */}
            <div style={{ padding: '8px 16px', backgroundColor: product.stock_quantity > 10 ? '#dcfce3' : '#fee2e2', color: product.stock_quantity > 10 ? '#16a34a' : '#dc2626', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>TỒN KHO</div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{product.stock_quantity} <span style={{ fontSize: '14px' }}>{product.unit}</span></div>
            </div>
          </div>

          <div style={{ borderBottom: '1px solid #e2e8f0', margin: '24px 0' }}></div>

          {/* CÁC THÔNG SỐ KỸ THUẬT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#64748b' }}>Phân loại (Category):</p>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{product.category || 'Vật tư chung'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#64748b' }}>Quy cách / Tiêu chuẩn (规格型号):</p>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{product.specifications || product.short_desc || 'Theo tiêu chuẩn NSX'}</p>
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#334155' }}>Mô tả chi tiết (详细描述)</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
              {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}