import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';

export async function POST(req: Request) {
  const client = await pool.connect(); // Dùng client riêng để chạy Transaction
  
  try {
    const data = await req.json();
    const { partner_id, order_date, delivery_date, items, total_amount } = data;

    await client.query('BEGIN'); // Bắt đầu Transaction

    // 1. Tạo mã PO tự động (Ví dụ: PO-1700123456)
    const order_code = `PO-${Date.now().toString().slice(-6)}`;

    // 2. Lưu vào bảng orders
    const orderQuery = `
      INSERT INTO orders (order_code, order_type, partner_id, status, total_amount, order_date, delivery_date)
      VALUES ($1, 'PURCHASE', $2, 'DRAFT', $3, $4, $5) RETURNING id
    `;
    const orderRes = await client.query(orderQuery, [order_code, partner_id, total_amount, order_date, delivery_date]);
    const order_id = orderRes.rows[0].id;

    // 3. Vòng lặp lưu từng sản phẩm vào bảng order_items
    for (const item of items) {
      const itemQuery = `
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
      `;
      await client.query(itemQuery, [order_id, item.product_id, item.quantity, item.unit_price]);
    }

    await client.query('COMMIT'); // Lưu thành công toàn bộ
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tạo PO thành công!', 
      order_code 
    });

  } catch (error) {
    await client.query('ROLLBACK'); // Hoàn tác tất cả nếu có bất kỳ lỗi nào
    console.error('Lỗi tạo Đơn hàng:', error);
    return NextResponse.json({ success: false, message: 'Lỗi tạo Đơn hàng', error: String(error) }, { status: 500 });
  } finally {
    client.release(); // Trả kết nối lại cho pool
  }
}