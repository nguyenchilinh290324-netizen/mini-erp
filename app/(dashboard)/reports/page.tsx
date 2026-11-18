import { pool } from '@/lib/db';
import RevenueChart from '@/app/components/RevenueChart';

export const dynamic = 'force-dynamic';

const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
};

export default async function ReportsPage() {
  const client = await pool.connect();

  try {
    // 1. Tổng doanh thu & Số đơn hàng (Chỉ tính các đơn Bán Hàng - SALES đã HOÀN THÀNH)
    const revRes = await client.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS revenue,
        COUNT(id) AS total_orders
      FROM orders 
      WHERE order_type = 'SALES' AND status = 'COMPLETED'
    `);
    const totalRevenue = Number(revRes.rows[0]?.revenue || 0);
    const totalOrders = Number(revRes.rows[0]?.total_orders || 0);

    // 2. Tổng giá vốn (COGS) dựa trên giá vốn nhập vào của từng sản phẩm trong các đơn đã bán
    const cogsRes = await client.query(`
      SELECT 
        COALESCE(SUM(oi.quantity * COALESCE(p.cost_price, 0)), 0) AS cogs
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.order_type = 'SALES' AND o.status = 'COMPLETED'
    `);
    const totalCOGS = Number(cogsRes.rows[0]?.cogs || 0);

    // 3. Tính Lợi nhuận gộp & Biên lợi nhuận (%)
    const grossProfit = totalRevenue - totalCOGS;
    const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(2) : 0;

    // 4. Biểu đồ Doanh thu 7 ngày gần nhất
    const chartRes = await client.query(`
      SELECT TO_CHAR(order_date, 'DD/MM') as name, SUM(total_amount) as total
      FROM orders
      WHERE order_type = 'SALES' AND status = 'COMPLETED' 
        AND order_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY TO_CHAR(order_date, 'DD/MM'), DATE(order_date)
      ORDER BY DATE(order_date) ASC
    `);
    const chartData = chartRes.rows.map(row => ({
      name: row.name,
      total: Number(row.total)
    }));

    // 5. Top 5 Sản phẩm Bán chạy nhất (Tính theo số lượng đã giao)
    const topProductsRes = await client.query(`
      SELECT 
        p.id, p.sku, p.name, 
        SUM(oi.quantity) as total_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.order_type = 'SALES' AND o.status = 'COMPLETED'
      GROUP BY p.id, p.sku, p.name
      ORDER BY total_sold DESC
      LIMIT 5
    `);
    const topProducts = topProductsRes.rows;

    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>📊 Báo cáo Thống kê & Phân tích</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>Theo dõi kết quả kinh doanh, lợi nhuận và doanh số bán hàng</p>
        </div>

        {/* CÁC THẺ KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Tổng Doanh Thu</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1d4ed8', marginTop: '8px' }}>{formatCurrency(totalRevenue)}</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Tổng Giá Vốn & Chi Phí</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#b91c1c', marginTop: '8px' }}>{formatCurrency(totalCOGS)}</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Lợi Nhuận Gộp (Kênh Bán)</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#047857', marginTop: '8px' }}>{formatCurrency(grossProfit)}</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Biên Lợi Nhuận / Tổng Đơn</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#6d28d9', marginTop: '8px' }}>
              {profitMargin}% <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 400 }}>/ {totalOrders} đơn</span>
            </div>
          </div>
        </div>

        {/* BIỂU ĐỒ & TOP SẢN PHẨM */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          {/* Khu vực Biểu đồ */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📈 Biểu đồ Doanh thu (7 ngày gần nhất)
            </h3>
            {chartData.length > 0 ? (
              <RevenueChart data={chartData} />
            ) : (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                Chưa có dữ liệu giao dịch.
              </div>
            )}
          </div>

          {/* Khu vực Top Sản phẩm */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏆 Top 5 Sản phẩm Bán chạy
            </h3>
            {topProducts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {topProducts.map((p, idx) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: idx < topProducts.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    
                    {/* Icon thứ hạng */}
                    <div style={{ 
                      width: '28px', height: '28px', borderRadius: '50%', 
                      backgroundColor: idx === 0 ? '#fef08a' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#ffedd5' : '#f8fafc', 
                      color: idx === 0 ? '#a16207' : idx === 1 ? '#475569' : idx === 2 ? '#c2410c' : '#94a3b8', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' 
                    }}>
                      {idx + 1}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{p.sku}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{p.name}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#15803d', fontSize: '14px' }}>{p.total_sold}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Đã bán</div>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
                Chưa có đơn hàng nào hoàn thành.
              </div>
            )}
          </div>

        </div>
      </div>
    );
  } catch (error) {
    console.error('Lỗi tải báo cáo:', error);
    return <div style={{ padding: '24px', color: 'red' }}>Lỗi kết nối cơ sở dữ liệu. Vui lòng tải lại trang.</div>;
  } finally {
    client.release();
  }
}