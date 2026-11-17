import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    // 1. Tự động đảm bảo các bảng giao dịch đã tồn tại
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        order_type VARCHAR(20) NOT NULL, -- 'PO' (Mua) hoặc 'SO' (Bán)
        partner_id INTEGER,
        total_amount NUMERIC(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'PENDING',
        order_date DATE,
        expected_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER,
        quantity NUMERIC(15,2) DEFAULT 1,
        unit_price NUMERIC(15,2) DEFAULT 0,
        total_price NUMERIC(15,2) DEFAULT 0
      );
    `);

    const body = await req.json();
    const { partner_id, order_date, expected_date, total_amount, items } = body;

    if (!partner_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 2. Tạo mã PO tự động theo ngày (VD: PO-261118-001)
    const dateStr = new Date(order_date).toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const countRes = await client.query(`SELECT COUNT(*) FROM orders WHERE order_type = 'PO' AND order_number LIKE $1`, [`PO-${dateStr}-%`]);
    const count = parseInt(countRes.rows[0].count) + 1;
    const orderNumber = `PO-${dateStr}-${count.toString().padStart(3, '0')}`;

    // 3. Lưu vào bảng orders
    const orderRes = await client.query(
      `INSERT INTO orders (order_number, order_type, partner_id, total_amount, status, order_date, expected_date) 
       VALUES ($1, 'PO', $2, $3, 'PENDING', $4, $5) RETURNING id`,
      [orderNumber, partner_id, total_amount, order_date, expected_date || null]
    );
    const orderId = orderRes.rows[0].id;

    // 4. Lưu chi tiết từng sản phẩm vào bảng order_items
    for (const item of items) {
      const itemTotal = Number(item.quantity) * Number(item.unitPrice);
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) 
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.productId, item.quantity, item.unitPrice, itemTotal]
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Tạo PO thành công', orderId, orderNumber });

  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Lỗi tạo PO:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT o.*, s.name as partner_name, s.code as partner_code
      FROM orders o
      LEFT JOIN suppliers s ON o.partner_id = s.id
      WHERE o.order_type = 'PO'
      ORDER BY o.id DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}