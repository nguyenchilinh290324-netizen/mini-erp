import { pool } from '@/lib/db';
import { Metadata } from 'next';

// Ngăn Vercel cố gắng build tĩnh (prerender) trang này để tránh lỗi sập Build
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lịch sử Xuất/Nhập kho | Mini-ERP',
};

interface InventoryTransaction {
  id: string;
  created_at: Date;
  transaction_type: string;
  quantity: number;
  notes: string;
  reference_code: string | null;
  sku: string;
  name: string;
}

export default async function InventoryTransactionsPage() {
  // Thêm ::text vào các điều kiện JOIN để ép kiểu, khắc phục triệt để lỗi "text = integer"
  const result = await pool.query(`
    SELECT 
      it.id,
      it.created_at,
      it.transaction_type,
      it.quantity,
      it.notes,
      COALESCE(o.order_number, o.order_code) AS reference_code,
      p.sku,
      p.name
    FROM inventory_transactions it
    LEFT JOIN products p ON it.product_id::text = p.id::text
    LEFT JOIN orders o ON it.reference_id::text = o.id::text
    ORDER BY it.created_at DESC
    LIMIT 100
  `);

  const transactions: InventoryTransaction[] = result.rows;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lịch sử Xuất/Nhập kho</h1>
          <p className="text-gray-500 mt-1">Theo dõi biến động số lượng vật tư, thiết bị</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                <th className="p-4 font-medium whitespace-nowrap">Thời gian</th>
                <th className="p-4 font-medium">Sản phẩm (SKU - Tên)</th>
                <th className="p-4 font-medium text-center">Loại GD</th>
                <th className="p-4 font-medium text-right">Số lượng</th>
                <th className="p-4 font-medium text-center">Mã tham chiếu</th>
                <th className="p-4 font-medium">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Chưa có giao dịch xuất/nhập kho nào.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const isIncoming = txn.transaction_type.includes('IN');
                  return (
                    <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-gray-600 whitespace-nowrap">
                        {new Date(txn.created_at).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-800 text-blue-700">{txn.sku}</div>
                        <div className="text-gray-500 text-xs truncate max-w-[250px]">{txn.name}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            isIncoming
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isIncoming ? '📥 NHẬP KHO' : '📤 XUẤT KHO'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-base">
                        <span className={isIncoming ? 'text-green-600' : 'text-red-600'}>
                          {isIncoming ? '+' : '-'}{txn.quantity}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-mono font-semibold border border-gray-200">
                          {txn.reference_code || '-'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 text-sm max-w-[200px]">
                        {txn.notes}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}