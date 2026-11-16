import { pool } from '@/lib/db';
import RevenueChart from '@/app/components/RevenueChart';
import LogoutButton from '@/app/components/LogoutButton';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
};

export default async function DashboardPage() {
  const client = await pool.connect();

  try {
    // 1. KPI: Tổng doanh thu
    const revenueRes = await client.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS total 
      FROM orders 
      WHERE order_type = 'SALES' AND status = 'COMPLETED'
    `);
    const totalRevenue = revenueRes.rows[0]?.total || 0;

    // 2. KPI: Tổng số đơn hàng tháng này
    const ordersCountRes = await client.query(`
      SELECT COUNT(id) AS count 
      FROM orders 
      WHERE order_type = 'SALES' AND date_trunc('month', order_date) = date_trunc('month', CURRENT_DATE)
    `);
    const totalOrdersThisMonth = ordersCountRes.rows[0]?.count || 0;

    // 3. KPI: Công nợ Phải thu (A/R)
    const arRes = await client.query(`
      SELECT COALESCE(SUM(total_amount - COALESCE(paid_amount, 0)), 0) AS total 
      FROM orders 
      WHERE order_type = 'SALES' AND status != 'DRAFT' AND status != 'CANCELLED'
    `);
    const totalAR = arRes.rows[0]?.total || 0;

    // 4. Biểu đồ doanh thu 7 ngày
    const chartRes = await client.query(`
      SELECT TO_CHAR(order_date, 'DD/MM') as name, SUM(total_amount) as total
      FROM orders
      WHERE order_type = 'SALES' AND status != 'CANCELLED'
      GROUP BY TO_CHAR(order_date, 'DD/MM'), DATE(order_date)
      ORDER BY DATE(order_date) ASC
      LIMIT 7
    `);
    const chartData = chartRes.rows.map(row => ({
      name: row.name,
      total: Number(row.total)
    }));

    // 5. Danh sách sản phẩm hiển thị trực tiếp ngay trên trang chủ
    const productsRes = await client.query(`
      SELECT id, sku, name, unit, cost_price, sell_price, stock_quantity 
      FROM products 
      ORDER BY id DESC 
      LIMIT 15
    `);
    const allProducts = productsRes.rows;

    // Danh sách tất cả các phân hệ trong hệ thống để bấm chọn ngay tại Trang Chủ
    const navModules = [
      { name: '📦 Quản lý Sản phẩm', desc: 'Danh mục, giá vốn, giá bán', href: '/products', bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
      { name: '🏭 Quản lý Kho hàng', desc: 'Tồn kho & Xuất nhập tồn', href: '/inventory', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
      { name: '🔄 Lịch sử Giao dịch Kho', desc: 'Thẻ kho & Kiểm kê', href: '/inventory/transactions', bg: '#ecfdf5', border: '#a7f3d0', text: '#047857' },
      { name: '🛒 Đơn Bán hàng (Sales)', desc: 'Tạo đơn & Xuất hàng', href: '/sales-orders/create', bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
      { name: '📥 Đơn Mua hàng (PO)', desc: 'Nhập hàng từ NCC', href: '/purchase-orders/create', bg: '#fefce8', border: '#fef08a', text: '#a16207' },
      { name: '👥 Khách hàng', desc: 'Thông tin & lịch sử mua', href: '/customers', bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce' },
      { name: '🤝 Nhà cung cấp & Đối tác', desc: 'Danh bạ nhà cung ứng', href: '/suppliers', bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9' },
      { name: '💰 Quản lý Công nợ', desc: 'Phải thu (AR) & Phải trả (AP)', href: '/debts', bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' },
      { name: '🚚 Vận chuyển & Giao nhận', desc: 'Theo dõi lộ trình đơn', href: '/deliveries', bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' },
      { name: '📊 Báo cáo Thống kê', desc: 'Lợi nhuận & Doanh số', href: '/reports', bg: '#f8fafc', border: '#e2e8f0', text: '#334155' },
    ];

    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', backgroundColor: '#f4f6f9', minHeight: '100vh', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
        
        {/* THANH TIÊU ĐỀ TRANG CHỦ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '18px 24px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px', borderLeft: '5px solid #0d56a6' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>HỆ THỐNG QUẢN TRỊ KMĐ ERP (金明台 ERP)</h1>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>Trung tâm điều hành tổng hợp: Kho vận, Mua hàng, Bán hàng & Công nợ</p>
          </div>
          <LogoutButton />
        </div>

        {/* BẢNG ĐIỀU KHIỂN TRUNG TÂM: TẤT CẢ CÁC TRANG CHỨC NĂNG NẰM TẠI ĐÂY */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px 24px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
            🧭 DANH MỤC TẤT CẢ PHÂN HỆ (Chọn để truy cập nhanh)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {navModules.map((mod, idx) => (
              <Link
                key={idx}
                href={mod.href}
                style={{
                  display: 'block',
                  padding: '14px 16px',
                  backgroundColor: mod.bg,
                  border: `1px solid ${mod.border}`,
                  borderRadius: '8px',
                  textDecoration: 'none',
                  transition: 'transform 0.15s ease'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '14px', color: mod.text, marginBottom: '4px' }}>{mod.name}</div>
                <div style={{ fontSize: '12px', color: '#4b5563' }}>{mod.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* KHỐI 1: CHỈ SỐ TÀI CHÍNH (KPI) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #2563eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, fontWeight: 600 }}>DOANH THU THỰC TẾ (ĐÃ GIAO)</p>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: '8px 0 0 0' }}>{formatCurrency(totalRevenue)}</h2>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #16a34a', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, fontWeight: 600 }}>ĐƠN HÀNG MỚI (THÁNG NÀY)</p>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: '8px 0 0 0' }}>{totalOrdersThisMonth} đơn</h2>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #ea580c', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, fontWeight: 600 }}>CÔNG NỢ PHẢI THU (KHÁCH NỢ)</p>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: '8px 0 0 0' }}>{formatCurrency(totalAR)}</h2>
          </div>
        </div>

        {/* KHỐI 2: DANH SÁCH SẢN PHẨM & TỒN KHO TRỰC TIẾP TRÊN TRANG CHỦ */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
              📋 DANH SÁCH SẢN PHẨM & TỒN KHO TRỰC TIẾP
            </h3>
            <Link href="/products" style={{ backgroundColor: '#0d56a6', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
              + Thêm / Chỉnh sửa Sản phẩm &rarr;
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '12px', color: '#475569' }}>Mã SKU</th>
                  <th style={{ padding: '12px', color: '#475569' }}>Tên sản phẩm</th>
                  <th style={{ padding: '12px', color: '#475569' }}>ĐVT</th>
                  <th style={{ padding: '12px', color: '#475569', textAlign: 'right' }}>Giá vốn</th>
                  <th style={{ padding: '12px', color: '#475569', textAlign: 'right' }}>Giá bán</th>
                  <th style={{ padding: '12px', color: '#475569', textAlign: 'center' }}>Tồn kho</th>
                </tr>
              </thead>
              <tbody>
                {allProducts.length > 0 ? (
                  allProducts.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#0d56a6' }}>{item.sku}</td>
                      <td style={{ padding: '12px', color: '#1e293b', fontWeight: 500 }}>{item.name}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{item.unit || 'Cái'}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{formatCurrency(item.cost_price || 0)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{formatCurrency(item.sell_price || 0)}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: item.stock_quantity <= 10 ? '#fef2f2' : '#f0fdf4',
                          color: item.stock_quantity <= 10 ? '#dc2626' : '#15803d'
                        }}>
                          {item.stock_quantity}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      Chưa có sản phẩm nào trong kho. Hãy bấm vào nút "+ Thêm / Chỉnh sửa Sản phẩm" để tạo mới.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* KHỐI 3: BIỂU ĐỒ DOANH THU */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginTop: 0, marginBottom: '16px' }}>
            📈 BIỂU ĐỒ DOANH THU 7 NGÀY GẦN NHẤT
          </h3>
          {chartData.length > 0 ? (
            <RevenueChart data={chartData} />
          ) : (
            <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
              Chưa có dữ liệu giao dịch
            </div>
          )}
        </div>

      </div>
    );
  } finally {
    client.release();
  }
}