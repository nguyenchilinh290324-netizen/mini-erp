import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const client = await pool.connect();
  try {
    const orderId = params.id;

    // 1. Lấy thông tin chung của đơn bán hàng, join với bảng customers
    const orderRes = await client.query(`
      SELECT o.*, COALESCE(o.order_number, o.order_code) as display_number, 
             c.name as partner_name, c.code as partner_code, c.contact_person, c.phone
      FROM orders o
      LEFT JOIN customers c ON o.partner_id = c.id
      WHERE o.id = $1 AND o.order_type = 'SALES'
    `, [orderId]);

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy đơn bán hàng' }, { status: 404 });
    }

    // 2. Lấy chi tiết sản phẩm trong đơn
    const itemsRes = await client.query(`
      SELECT oi.*, p.name as product_name, COALESCE(p.name_zh, '') as name_zh, p.sku, p.unit
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
// Thêm hàm PUT này vào dưới cùng của file app/api/sales-orders/[id]/route.ts
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const client = await pool.connect();
  try {
    const orderId = params.id;
    const body = await req.json();
    const { partner_id, order_date, expected_date, custom_order_code, total_amount, vat_rate, vat_amount, notes, items } = body;

    if (!partner_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Kiểm tra trạng thái đơn (chỉ cho phép sửa đơn PENDING)
    const checkOrder = await client.query(`SELECT status FROM orders WHERE id = $1 AND order_type = 'SALES'`, [orderId]);
    if (checkOrder.rows.length === 0) throw new Error('Không tìm thấy đơn hàng');
    if (checkOrder.rows[0].status !== 'PENDING') throw new Error('Chỉ có thể sửa đơn hàng Đang chờ duyệt');

    // 2. Cập nhật thông tin chung của đơn hàng
    // Nếu có mã SO mới thì cập nhật, không thì giữ nguyên
    await client.query(
      `UPDATE orders 
       SET partner_id = $1, 
           order_date = $2, 
           expected_date = $3, 
           order_code = COALESCE($4, order_code), 
           order_number = COALESCE($4, order_number), 
           total_amount = $5, 
           vat_rate = $6, 
           vat_amount = $7, 
           notes = $8
       WHERE id = $9`,
      [partner_id, order_date, expected_date || null, custom_order_code || null, total_amount, vat_rate || 0, vat_amount || 0, notes || '', orderId]
    );

    // 3. Xóa chi tiết sản phẩm cũ
    await client.query(`DELETE FROM order_items WHERE order_id = $1`, [orderId]);

    // 4. Thêm lại chi tiết sản phẩm mới
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
        [orderId, item.productId, item.quantity, item.unitPrice]
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Cập nhật Đơn Bán Hàng thành công' });

  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {});
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}