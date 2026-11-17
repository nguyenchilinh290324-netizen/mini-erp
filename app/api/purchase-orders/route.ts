import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    // 1. TỰ ĐỘNG CẤU TRÚC LẠI BẢNG (AUTO-MIGRATION)
    // Tạo bảng nếu chưa có
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY
      );
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY
      );
    `);

    // Thêm các cột cần thiết vào orders (bỏ qua nếu đã tồn tại)
    await client.query(`
      DO $$
      BEGIN
        BEGIN ALTER TABLE orders ADD COLUMN order_number VARCHAR(50) UNIQUE; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN order_type VARCHAR(20) DEFAULT 'PO'; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN partner_id INTEGER; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN total_amount NUMERIC(15,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT 'PENDING'; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN order_date DATE; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN expected_date DATE; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP; EXCEPTION WHEN duplicate_column THEN END;
      END $$;
    `);

    // Thêm các cột cần thiết vào order_items (bỏ qua nếu đã tồn tại)
    await client.query(`
      DO $$
      BEGIN
        BEGIN ALTER TABLE order_items ADD COLUMN order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE order_items ADD COLUMN product_id INTEGER; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE order_items ADD COLUMN quantity NUMERIC(15,2) DEFAULT 1; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE order_items ADD COLUMN unit_price NUMERIC(15,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE order_items ADD COLUMN total_price NUMERIC(15,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
      END $$;
    `);

    // 2. XỬ LÝ LƯU ĐƠN HÀNG
    const body = await req.json();
    const { partner_id, order_date, expected_date, total_amount, items } = body;

    if (!partner_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Tạo mã PO tự động
    const dateStr = new Date(order_date).toISOString().slice(2, 10).replace(/-/g, '');
    const countRes = await client.query(`SELECT COUNT(*) FROM orders WHERE order_type = 'PO' AND order_number LIKE $1`, [`PO-${dateStr}-%`]);
    const count = parseInt(countRes.rows[0].count) + 1;
    const orderNumber = `PO-${dateStr}-${count.toString().padStart(3, '0')}`;

    // Lưu bảng orders
    const orderRes = await client.query(
      `INSERT INTO orders (order_number, order_type, partner_id, total_amount, status, order_date, expected_date) 
       VALUES ($1, 'PO', $2, $3, 'PENDING', $4, $5) RETURNING id`,
      [orderNumber, partner_id, total_amount, order_date, expected_date || null]
    );
    const orderId = orderRes.rows[0].id;

    // Lưu bảng order_items
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
    // Đảm bảo bảng suppliers tồn tại (để LEFT JOIN không bị lỗi)
    await client.query(`CREATE TABLE IF NOT EXISTS suppliers (id SERIAL PRIMARY KEY, name VARCHAR(255), code VARCHAR(50))`);
    
    // Nếu bảng orders chưa có cột order_number thì bỏ qua truy vấn (tránh lỗi 500 khi vào trang Danh sách PO)
    const checkCol = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='orders' AND column_name='order_number'
    `);
    
    if (checkCol.rows.length === 0) {
      return NextResponse.json([]); // Trả về rỗng nếu chưa có đơn nào tạo ra cấu trúc
    }

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