import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: Request) {
  const client = await pool.connect();
  
  try {
    const body = await request.json();
    const { partner_id, items } = body;

    if (!partner_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Tạo order_code tự động (VD: SO-123456)
    const order_code = `SO-${Date.now().toString().slice(-6)}`;
    
    // Tính tổng tiền
    const total_amount = items.reduce((sum: number, item: any) => 
      sum + (Number(item.quantity) * Number(item.unit_price)), 0
    );

    // 2. Insert vào bảng orders
    // ĐÃ FIX: Bổ sung cột order_date và truyền giá trị CURRENT_TIMESTAMP trực tiếp
    const orderRes = await client.query(
      `INSERT INTO orders (order_code, order_type, partner_id, status, total_amount, order_date)
       VALUES ($1, 'SALES', $2, 'DRAFT', $3, CURRENT_TIMESTAMP)
       RETURNING id`,
      [order_code, partner_id, total_amount]
    );
    const orderId = orderRes.rows[0].id;

    // 3. Insert chi tiết vào order_items
    for (const item of items) {
      // KHÔNG CẦN TÍNH item_total Ở ĐÂY NỮA
      
      // BỎ CỘT total_price KHỎI CÂU LỆNH INSERT
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.unit_price]
      );
    }

    await client.query('COMMIT');
    
    return NextResponse.json({ success: true, order_id: orderId }, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    // In ra màn hình Terminal VS Code để theo dõi
    console.error('Lỗi khi tạo SO:', error.message);
    
    // ĐÃ FIX: Trả lỗi chi tiết của PostgreSQL về giao diện Web
    return NextResponse.json({ error: error.message || 'Lỗi khi tạo đơn hàng' }, { status: 500 });
  } finally {
    client.release();
  }
}