import { pool } from '@/lib/db';
import RevenueChart from '@/app/components/RevenueChart';
import LogoutButton from '@/app/components/LogoutButton';
import Link from 'next/link';

// Tắt cache để Dashboard luôn realtime mỗi khi F5
export const dynamic = 'force-dynamic';

// Format tiền tệ VNĐ
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
    const totalRevenue = revenueRes.rows[0].total;

    // 2. KPI: Tổng số đơn hàng
    const ordersCountRes = await client.query(`
      SELECT COUNT(id) AS count 
      FROM orders 
      WHERE order_type = 'SALES' AND date_trunc('month', order_date) = date_trunc('month', CURRENT_DATE)
    `);
    const totalOrdersThisMonth = ordersCountRes.rows[0].count;

    // 3. KPI: Công nợ Phải thu khách hàng (A/R)
    const arRes = await client.query(`
      SELECT COALESCE(SUM(total_amount - COALESCE(paid_amount, 0)), 0) AS total 
      FROM orders 
      WHERE order_type = 'SALES' AND status != 'DRAFT' AND status != 'CANCELLED'
    `);
    const totalAR = arRes.rows[0].total;

    // 4. DATA BIỂU ĐỒ: Doanh thu 7 ngày gần nhất
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

    // 5. CẢNH BÁO: Top 5 Sản phẩm sắp hết hàng (Tồn kho <= 10)
    const lowStockRes = await client.query(`
      SELECT id, sku, name, stock_quantity 
      FROM products 
      WHERE stock_quantity <= 10 
      ORDER BY stock_quantity ASC 
      LIMIT 5
    `);
    const lowStockProducts = lowStockRes.rows;

    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
        
        {/* HEADER VỚI NÚT ĐĂNG XUẤT */}
        <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">SAYDA ERP Dashboard</h1>
            <p className="text-sm text-gray-500">Tổng quan hệ thống quản trị</p>
          </div>
          <LogoutButton />
        </div>

        {/* KHỐI 1: KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-blue-500">
            <p className="text-sm font-medium text-gray-500">Doanh thu thực tế (Đã giao)</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(totalRevenue)}</h2>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-green-500">
            <p className="text-sm font-medium text-gray-500">Đơn hàng mới (Tháng này)</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">{totalOrdersThisMonth} <span className="text-sm font-normal text-gray-400">đơn</span></h2>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-orange-500">
            <p className="text-sm font-medium text-gray-500">Công nợ phải thu (Khách nợ)</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(totalAR)}</h2>
          </div>
        </div>

        {/* KHỐI 2: CHIA CỘT BIỂU ĐỒ & CẢNH BÁO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CỘT TRÁI (2/3): Biểu đồ doanh thu */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Biểu đồ doanh thu (7 ngày gần nhất)</h3>
            {chartData.length > 0 ? (
              <RevenueChart data={chartData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                Chưa có dữ liệu giao dịch
              </div>
            )}
          </div>

          {/* CỘT PHẢI (1/3): Cảnh báo tồn kho */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Cảnh báo hết hàng
            </h3>
            
            <div className="flex-1">
              {lowStockProducts.length > 0 ? (
                <ul className="space-y-4">
                  {lowStockProducts.map(product => (
                    <li key={product.id} className="flex justify-between items-center pb-3 border-b border-gray-50 last:border-0">
                      <div className="truncate pr-4">
                        <p className="text-sm font-bold text-gray-800 truncate" title={product.name}>{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                          product.stock_quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {product.stock_quantity} Tồn
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-500 text-center pb-10">
                  Kho hàng đang ổn định.<br/>Không có mặt hàng nào cần nhập gấp.
                </div>
              )}
            </div>

            <Link href="/products" className="mt-4 block w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 bg-blue-50 rounded-lg transition-colors">
              Xem toàn bộ kho hàng &rarr;
            </Link>
          </div>
        </div>

      </div>
    );
  } finally {
    client.release();
  }
}