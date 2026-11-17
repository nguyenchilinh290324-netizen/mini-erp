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
      `SELECT status FROM orders WHERE id = $1 AND order_type = 'PURCHASE'`,
      [order_id]
    );

    if (checkOrder.rows.length === 0) {
      throw new Error('Không tìm thấy đơn mua hàng PO này.');
    }
    if (checkOrder.rows[0].status !== 'PENDING') {
      throw new Error('Đơn hàng này đã được duyệt hoặc không ở trạng thái chờ duyệt.');
    }

    // 2. Cập nhật trạng thái đơn hàng thành COMPLETED
    await client.query(
      `UPDATE orders SET status = 'COMPLETED' WHERE id = $1`,
      [order_id]
    );

    // 3. Lấy danh sách sản phẩm trong đơn để cộng tồn kho
    const itemsRes = await client.query(
      `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
      [order_id]
    );

    // 4. Cộng tồn kho và ghi log lịch sử giao dịch (Inventory Transactions)
    for (const item of itemsRes.rows) {
      // Cập nhật bảng products (cộng số lượng)
      await client.query(
        `UPDATE products SET stock_quantity = COALESCE(stock_quantity, 0) + $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      );

      // Tự động kiểm tra và tạo bảng inventory_transactions nếu chưa có
      await client.query(`
        CREATE TABLE IF NOT EXISTS inventory_transactions (
          id SERIAL PRIMARY KEY,
          product_id INTEGER,
          transaction_type VARCHAR(50),
          quantity NUMERIC(15,2),
          reference_id INTEGER,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Ghi nhận lịch sử nhập kho
      await client.query(
        `INSERT INTO inventory_transactions (product_id, transaction_type, quantity, reference_id, notes)
         VALUES ($1, 'IN_PO', $2, $3, 'Nhập hàng từ Đơn PO')`,
        [item.product_id, item.quantity, order_id]
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Duyệt đơn và nhập kho thành công' });

  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Lỗi duyệt PO:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}