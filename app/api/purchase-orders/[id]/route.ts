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