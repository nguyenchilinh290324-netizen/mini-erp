import { pool } from '@/lib/db';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lịch sử Xuất/Nhập kho | Mini-ERP',
};

// Khai báo type cho dòng dữ liệu trả về từ DB
interface InventoryTransaction {
  id: string;
  created_at: Date;
  transaction_type: 'IN' | 'OUT';
  quantity: number;
  notes: string;
  reference_id: string;
  sku: string;
  name: string;
}

export default async function InventoryTransactionsPage() {
  // Thực thi truy vấn lấy lịch sử kho, JOIN với bảng products để lấy SKU & Name
  // Sắp xếp theo thời gian mới nhất (DESC)
  const result = await pool.query(`
    SELECT 
      it.id,
      it.created_at,
      it.transaction_type,
      it.quantity,
      it.notes,
      it.reference_id,
      p.sku,
      p.name
    FROM inventory_transactions it
    JOIN products p ON it.product_id = p.id
    ORDER BY it.created_at DESC
    LIMIT 100 -- Tạm thời giới hạn 100 bản ghi mới nhất
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
                transactions.map((txn) => (
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
                      <div className="font-semibold text-gray-800">{txn.sku}</div>
                      <div className="text-gray-500 text-xs truncate max-w-[250px]">{txn.name}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          txn.transaction_type === 'IN'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {txn.transaction_type === 'IN' ? 'NHẬP KHO' : 'XUẤT KHO'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium">
                      <span className={txn.transaction_type === 'IN' ? 'text-green-600' : 'text-orange-600'}>
                        {txn.transaction_type === 'IN' ? '+' : '-'}{txn.quantity}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">
                        #{txn.reference_id}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 text-sm max-w-[200px]">
                      {txn.notes}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}