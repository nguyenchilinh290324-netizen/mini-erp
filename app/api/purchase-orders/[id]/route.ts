import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const client = await pool.connect();
  try {
    const orderId = params.id;

    // 1. Lấy thông tin chung của đơn hàng
    const orderRes = await client.query(`
      SELECT o.*, COALESCE(o.order_number, o.order_code) as display_number, 
             s.name as partner_name, s.code as partner_code, s.contact_person, s.phone
      FROM orders o
      LEFT JOIN suppliers s ON o.partner_id = s.id
      WHERE o.id = $1
    `, [orderId]);

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // 2. Lấy chi tiết các sản phẩm trong đơn hàng
    const itemsRes = await client.query(`
      SELECT oi.*, p.name as product_name, p.sku, p.unit
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [orderId]);

    return NextResponse.json({
      ...orderRes.rows[0],
      items: itemsRes.rows
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
// Thêm hàm PUT này vào bên dưới hàm GET hiện có trong file
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const client = await pool.connect();
  try {
    const orderId = params.id;
    const body = await req.json();
    const { partner_id, order_date, expected_date, total_amount, vat_rate, vat_amount, items } = body;

    if (!partner_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Kiểm tra xem đơn hàng có phải đang PENDING không (chỉ PENDING mới được sửa)
    const checkOrder = await client.query(`SELECT status FROM orders WHERE id = $1`, [orderId]);
    if (checkOrder.rows.length === 0) throw new Error('Không tìm thấy đơn hàng');
    if (checkOrder.rows[0].status !== 'PENDING') throw new Error('Chỉ có thể sửa đơn hàng Đang Chờ Duyệt');

    // 2. Cập nhật thông tin chung của đơn hàng
    await client.query(
      `UPDATE orders 
       SET partner_id = $1, order_date = $2, expected_date = $3, total_amount = $4, vat_rate = $5, vat_amount = $6 
       WHERE id = $7`,
      [partner_id, order_date, expected_date || null, total_amount, vat_rate || 0, vat_amount || 0, orderId]
    );

    // 3. Xóa các sản phẩm cũ trong đơn
    await client.query(`DELETE FROM order_items WHERE order_id = $1`, [orderId]);

    // 4. Thêm lại danh sách sản phẩm mới
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
        [orderId, item.productId, item.quantity, item.unitPrice]
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Cập nhật PO thành công' });

  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {});
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}