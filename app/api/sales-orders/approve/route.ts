import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json({ error: 'Thiếu ID đơn hàng' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Kiểm tra trạng thái đơn hàng (chỉ duyệt đơn đang PENDING)
    const checkOrder = await client.query(
      `SELECT status FROM orders WHERE id = $1 AND order_type = 'SALES'`,
      [order_id]
    );

    if (checkOrder.rows.length === 0) {
      throw new Error('Không tìm thấy đơn bán hàng SO này.');
    }
    if (checkOrder.rows[0].status !== 'PENDING') {
      throw new Error('Đơn hàng này đã được duyệt hoặc không ở trạng thái chờ xuất kho.');
    }

    // 2. Cập nhật trạng thái đơn hàng thành COMPLETED (Đã xuất kho/Hoàn thành)
    await client.query(
      `UPDATE orders SET status = 'COMPLETED' WHERE id = $1`,
      [order_id]
    );

    // 3. Lấy danh sách sản phẩm trong đơn để TRỪ tồn kho
    const itemsRes = await client.query(
      `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
      [order_id]
    );

    // 4. Trừ tồn kho và ghi log lịch sử giao dịch (Inventory Transactions)
    for (const item of itemsRes.rows) {
      // Cập nhật bảng products (TRỪ số lượng)
      await client.query(
        `UPDATE products SET stock_quantity = COALESCE(stock_quantity, 0) - $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      );

      // Ghi nhận lịch sử XUẤT kho
      await client.query(
        `INSERT INTO inventory_transactions (product_id, transaction_type, quantity, reference_id, notes)
         VALUES ($1, 'OUT_SO', $2, $3, 'Xuất hàng từ Đơn SO')`,
        [item.product_id, item.quantity, order_id]
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Duyệt xuất kho thành công' });

  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Lỗi duyệt SO:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}