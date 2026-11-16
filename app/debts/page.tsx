import { Pool } from 'pg';
import Link from 'next/link';

// Tắt cache Next.js để dữ liệu công nợ luôn realtime
export const dynamic = 'force-dynamic'; 

// Cấu hình kết nối Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Định nghĩa Type TypeScript cho dữ liệu trả về
interface DebtRecord {
  partner_id: number;
  partner_name: string;
  total_receivable: string; // Khách nợ mình (A/R) - Tiền thu từ SALES
  total_payable: string;    // Mình nợ NCC (A/P) - Tiền trả cho PURCHASE
}

async function getDebtsData(): Promise<DebtRecord[]> {
  const client = await pool.connect();
  try {
    // Câu lệnh SQL gom nhóm (GROUP BY) theo đối tác, tính tổng nợ dựa trên Đơn Bán (SALES) và Đơn Mua (PURCHASE)
    // Chỉ tính công nợ cho các đơn hàng không ở trạng thái DRAFT/CANCELLED
    const res = await client.query(`
      SELECT 
        p.id AS partner_id,
        p.name AS partner_name,
        COALESCE(SUM(CASE WHEN o.order_type = 'SALES' THEN o.total_amount - COALESCE(o.paid_amount, 0) ELSE 0 END), 0) AS total_receivable,
        COALESCE(SUM(CASE WHEN o.order_type = 'PURCHASE' THEN o.total_amount - COALESCE(o.paid_amount, 0) ELSE 0 END), 0) AS total_payable
      FROM partners p
      JOIN orders o ON p.id = o.partner_id
      WHERE o.status != 'DRAFT' AND o.status != 'CANCELLED'
      GROUP BY p.id, p.name
      HAVING 
        SUM(CASE WHEN o.order_type = 'SALES' THEN o.total_amount - COALESCE(o.paid_amount, 0) ELSE 0 END) > 0 
        OR 
        SUM(CASE WHEN o.order_type = 'PURCHASE' THEN o.total_amount - COALESCE(o.paid_amount, 0) ELSE 0 END) > 0
      ORDER BY total_receivable DESC, total_payable DESC;
    `);
    return res.rows;
  } finally {
    client.release(); // Luôn nhớ trả client lại cho pool
  }
}

// Hàm format tiền tệ VNĐ
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
};

export default async function DebtsDashboard() {
  const debts = await getDebtsData();

  // Tính tổng cộng toàn bộ hệ thống
  const totalSystemReceivable = debts.reduce((sum, item) => sum + Number(item.total_receivable), 0);
  const totalSystemPayable = debts.reduce((sum, item) => sum + Number(item.total_payable), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Tổng hợp Công nợ (A/R & A/P)</h1>
      </div>

      {/* Thẻ Summary (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-blue-600 mb-1">Phải thu khách hàng (A/R)</p>
          <h2 className="text-3xl font-bold text-blue-800">{formatCurrency(totalSystemReceivable)}</h2>
          <p className="text-xs text-blue-500 mt-2">Tổng dòng tiền đang kẹt tại khách hàng</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-red-600 mb-1">Phải trả nhà cung cấp (A/P)</p>
          <h2 className="text-3xl font-bold text-red-800">{formatCurrency(totalSystemPayable)}</h2>
          <p className="text-xs text-red-500 mt-2">Tổng tiền cần chuẩn bị thanh toán cho NCC</p>
        </div>
      </div>

      {/* Bảng chi tiết Công nợ theo đối tác */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đối tác</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Phải thu (Họ nợ mình)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Phải trả (Mình nợ họ)</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {debts.length > 0 ? (
              debts.map((debt) => (
                <tr key={debt.partner_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{debt.partner_name}</div>
                    <div className="text-xs text-gray-500">ID: {debt.partner_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {Number(debt.total_receivable) > 0 ? (
                      <span className="font-semibold text-blue-600">{formatCurrency(debt.total_receivable)}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {Number(debt.total_payable) > 0 ? (
                      <span className="font-semibold text-red-600">{formatCurrency(debt.total_payable)}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Link 
                      href={`/partners/${debt.partner_id}`} 
                      className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                  Tuyệt vời! Hiện tại không có công nợ nào tồn đọng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}