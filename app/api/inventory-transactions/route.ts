import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  const client = await pool.connect();
  try {
    // Truy vấn kết hợp (JOIN) bảng inventory_transactions với bảng products và orders
    // Để lấy ra tên sản phẩm và mã đơn hàng (Mã PO hoặc SO)
    const result = await client.query(`
      SELECT 
        it.id,
        it.transaction_type,
        it.quantity,
        it.created_at,
        it.notes,
        p.sku,
        p.name AS product_name,
        COALESCE(o.order_number, o.order_code) AS reference_code
      FROM inventory_transactions it
      LEFT JOIN products p ON it.product_id = p.id
      LEFT JOIN orders o ON it.reference_id = o.id
      ORDER BY it.created_at DESC, it.id DESC
      LIMIT 100
    `);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Lỗi khi lấy lịch sử giao dịch:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}