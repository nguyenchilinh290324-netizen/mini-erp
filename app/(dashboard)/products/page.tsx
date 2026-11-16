'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface Product {
  id?: number;
  sku: string;
  name: string;
  name_zh: string;
  specification: string;
  category: string;
  unit: string;
  cost_price: number;
  sell_price: number;
  stock_quantity: number;
  image_url: string;
}

const initialForm: Product = {
  sku: '',
  name: '',
  name_zh: '',
  specification: '',
  category: '',
  unit: 'Cái',
  cost_price: 0,
  sell_price: 0,
  stock_quantity: 0,
  image_url: ''
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Product>(initialForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [importingExcel, setImportingExcel] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.error('Lỗi tải sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Xử lý Upload ảnh trực tiếp lên Cloudflare R2
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormData(prev => ({ ...prev, image_url: data.url }));
      } else {
        alert(data.error || 'Lỗi tải ảnh lên R2');
      }
    } catch (err) {
      alert('Không thể kết nối API upload R2');
    } finally {
      setUploadingImage(false);
    }
  };

  // Lưu sản phẩm (Thêm mới hoặc Sửa)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData(initialForm);
        fetchProducts();
      } else {
        const err = await res.json();
        alert(err.error || 'Lỗi khi lưu sản phẩm');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  // Xoá sản phẩm
  const handleDelete = async (id?: number) => {
    if (!id || !confirm('Bạn có chắc chắn muốn xoá sản phẩm này?')) return;
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  // Đọc file Excel mẫu và đẩy hàng loạt lên Neon DB
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingExcel(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const mappedItems = rows
        .map((row) => ({
          sku: row['Mã SKU (SKU)'] || row['SKU'] || row['Mã SKU'] || '',
          name: row['Tên Hàng Hoá (Name)'] || row['Name'] || row['Tên Hàng Hoá'] || '',
          name_zh: row['Tên Tiếng Trung (中文名称)'] || row['NameZH'] || row['Tên Tiếng Trung'] || '',
          specification: row['Quy Cách (规格型号)'] || row['Specification'] || row['Quy Cách'] || '',
          category: row['Danh Mục (Category)'] || row['Category'] || row['Danh Mục'] || '',
          unit: row['ĐVT (单位)'] || row['Unit'] || row['ĐVT'] || 'Cái',
          cost_price: Number(String(row['Giá Vốn (成本价)'] || row['CostPrice'] || row['Giá Vốn'] || 0).replace(/,/g, '')),
          sell_price: Number(String(row['Giá Bán (销售价)'] || row['SellPrice'] || row['Giá Bán'] || 0).replace(/,/g, '')),
          stock_quantity: Number(String(row['Tồn Kho (库存)'] || row['Stock'] || row['Tồn Kho'] || 0).replace(/,/g, '')),
          image_url: row['Link Ảnh R2 (图片链接 - Tuỳ chọn)'] || row['ImageURL'] || ''
        }))
        .filter((item) => item.sku && item.name);

      if (mappedItems.length === 0) {
        alert('Không tìm thấy dòng dữ liệu hợp lệ! Vui lòng giữ nguyên dòng tiêu đề cột của file Excel mẫu.');
        setImportingExcel(false);
        return;
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: mappedItems })
      });

      if (res.ok) {
        alert(`Đã nhập thành công ${mappedItems.length} sản phẩm lên Neon DB!`);
        fetchProducts();
      } else {
        const err = await res.json();
        alert('Lỗi khi nhập Excel: ' + (err.error || ''));
      }
    } catch (error) {
      alert('File Excel không hợp lệ!');
    } finally {
      setImportingExcel(false);
      e.target.value = '';
    }
  };

  // Xuất danh sách hiện tại ra file Excel
  const handleExportExcel = () => {
    const exportRows = products.map((p) => ({
      'Mã SKU (SKU)': p.sku,
      'Tên Hàng Hoá (Name)': p.name,
      'Tên Tiếng Trung (中文名称)': p.name_zh || '',
      'Quy Cách (规格型号)': p.specification || '',
      'Danh Mục (Category)': p.category || '',
      'ĐVT (单位)': p.unit || 'Cái',
      'Giá Vốn (成本价)': Number(p.cost_price || 0),
      'Giá Bán (销售价)': Number(p.sell_price || 0),
      'Tồn Kho (库存)': Number(p.stock_quantity || 0),
      'Link Ảnh R2 (图片链接 - Tuỳ chọn)': p.image_url || ''
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh_Muc_San_Pham');
    XLSX.writeFile(wb, 'KMD_ERP_Danh_Muc_San_Pham.xlsx');
  };

  const filteredProducts = products.filter(
    (p) =>
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.name_zh?.toLowerCase().includes(search.toLowerCase()) ||
      p.specification?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>
          Quản lý Danh mục Hàng hoá
        </h1>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        {/* THANH CÔNG CỤ THÊM MỚI & NHẬP/XUẤT EXCEL */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              onClick={() => {
                setFormData(initialForm);
                setIsModalOpen(true);
              }}
              style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
            >
              + Thêm Sản Phẩm Mới
            </button>

            <label
              style={{ backgroundColor: '#0d56a6', color: '#ffffff', padding: '10px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', display: 'inline-block' }}
            >
              {importingExcel ? '⏳ Đang tải lên Neon...' : '📥 Nhập từ File Excel'}
              <input type="file" accept=".xlsx,.xls" onChange={handleExcelImport} style={{ display: 'none' }} disabled={importingExcel} />
            </label>

            <button
              onClick={handleExportExcel}
              style={{ backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
            >
              📤 Xuất File Excel Mẫu
            </button>
          </div>

          <input
            type="text"
            placeholder="Tìm theo SKU, Tên Việt, Tên Trung, Quy cách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '320px', padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
          />
        </div>

        {/* BẢNG DANH SÁCH SẢN PHẨM */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>SKU</th>
                <th style={{ padding: '12px' }}>Tên Hàng Hoá</th>
                <th style={{ padding: '12px' }}>Tên Tiếng Trung</th>
                <th style={{ padding: '12px' }}>Quy Cách</th>
                <th style={{ padding: '12px' }}>ĐVT</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Giá Vốn</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Giá Bán</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Tồn Kho</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu...</td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <tr key={p.id || p.sku} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{p.sku}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                        ) : null}
                        <span style={{ fontWeight: 500, color: '#1e293b' }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: '#0d56a6', fontWeight: 500 }}>{p.name_zh || '-'}</td>
                    <td style={{ padding: '12px', color: '#475569' }}>{p.specification || '-'}</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{p.unit || 'Cái'}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#475569' }}>{Number(p.cost_price).toLocaleString('vi-VN')}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>{Number(p.sell_price).toLocaleString('vi-VN')}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>{p.stock_quantity}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          setFormData(p);
                          setIsModalOpen(true);
                        }}
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', marginRight: '10px' }}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Không tìm thấy sản phẩm nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM / SỬA SẢN PHẨM & UPLOAD ẢNH R2 */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '620px', borderRadius: '10px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: 700 }}>
              {formData.id ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm Mới'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Mã SKU *</label>
                <input required value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Đơn vị tính (ĐVT)</label>
                <input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Tên Hàng Hoá (Tiếng Việt) *</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Tên Tiếng Trung (中文名称)</label>
                <input value={formData.name_zh} onChange={(e) => setFormData({ ...formData, name_zh: e.target.value })} placeholder="VD: 无铅焊锡丝" style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Quy Cách (规格型号)</label>
                <input value={formData.specification} onChange={(e) => setFormData({ ...formData, specification: e.target.value })} placeholder="VD: 0.8mm - Cuộn 500g" style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Giá Vốn (VNĐ)</label>
                <input type="number" value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Giá Bán (VNĐ)</label>
                <input type="number" value={formData.sell_price} onChange={(e) => setFormData({ ...formData, sell_price: Number(e.target.value) })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Tồn Kho</label>
                <input type="number" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Danh Mục</label>
                <input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Hình ảnh sản phẩm (Tải lên Cloudflare R2)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                  {uploadingImage && <span style={{ fontSize: '13px', color: '#0d56a6' }}>Đang tải ảnh lên R2...</span>}
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  )}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '9px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}>
                  Huỷ
                </button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#0d56a6', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}>
                  Lưu Sản Phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}