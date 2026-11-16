import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: Request) {
  const client = await pool.connect();

  try {
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Thiếu mã đơn hàng' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Kiểm tra trạng thái đơn SO
    const orderRes = await client.query(
      `SELECT status FROM orders WHERE id = $1 AND order_type = 'SALES'`,
      [order_id]
    );

    if (orderRes.rowCount === 0) throw new Error('Không tìm thấy đơn bán hàng.');
    if (orderRes.rows[0].status !== 'DRAFT') throw new Error('Đơn hàng đã được duyệt.');

    // 2. Lấy danh sách mặt hàng cần xuất
    const itemsRes = await client.query(
      `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
      [order_id]
    );

    // 3. Trừ tồn kho và Ghi log
    for (const item of itemsRes.rows) {
      const { product_id, quantity } = item;

      // Cập nhật tồn kho có điều kiện (Chỉ thành công nếu tồn kho hiện tại >= số lượng xuất)
      const updateStock = await client.query(
        `UPDATE products 
         SET stock_quantity = stock_quantity - $1 
         WHERE id = $2 AND stock_quantity >= $1
         RETURNING id, sku`,
        [quantity, product_id]
      );

      // Nếu rowCount === 0 nghĩa là tồn kho không đủ để trừ
      if (updateStock.rowCount === 0) {
        throw new Error(`Sản phẩm không đủ tồn kho để xuất. Vui lòng kiểm tra lại!`);
      }

      // Ghi log xuất kho (OUT)
      await client.query(
        `INSERT INTO inventory_transactions 
           (product_id, transaction_type, quantity, reference_id, notes, created_at)
         VALUES ($1, 'OUT', $2, $3, $4, CURRENT_TIMESTAMP)`,
        [
          product_id, 
          quantity, 
          order_id, 
          `Xuất kho cho Đơn bán hàng (SO) số #${order_id}`
        ]
      );
    }

    // 4. Đổi trạng thái đơn thành COMPLETED
    await client.query(
      `UPDATE orders SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [order_id]
    );

    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: 'Duyệt đơn & Xuất kho thành công!' }, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống' }, { status: 500 });
  } finally {
    client.release();
  }
}