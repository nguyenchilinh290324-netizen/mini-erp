import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    // 1. AUTO-MIGRATION: Đảm bảo bảng và cột tồn tại
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS order_items (id SERIAL PRIMARY KEY);
      
      DO $$
      BEGIN
        BEGIN ALTER TABLE orders ADD COLUMN order_number VARCHAR(50); EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN order_code VARCHAR(50); EXCEPTION WHEN duplicate_column THEN END;
        -- Thêm cột order_type với giá trị mặc định là 'PURCHASE' thay vì 'PO'
        BEGIN ALTER TABLE orders ADD COLUMN order_type VARCHAR(20) DEFAULT 'PURCHASE'; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN partner_id INTEGER; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN total_amount NUMERIC(15,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT 'PENDING'; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN order_date DATE; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN expected_date DATE; EXCEPTION WHEN duplicate_column THEN END;
      END $$;
    `);

    await client.query(`ALTER TABLE orders ALTER COLUMN order_code DROP NOT NULL`).catch(() => {});
    await client.query(`ALTER TABLE orders ALTER COLUMN order_number DROP NOT NULL`).catch(() => {});

    // 2. XỬ LÝ LƯU ĐƠN HÀNG
    const body = await req.json();
    const { partner_id, order_date, expected_date, total_amount, items } = body;

    if (!partner_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 3. TẠO MÃ ĐƠN TỰ ĐỘNG (Vẫn giữ tiền tố PO- để dễ nhìn: PO-261118-001)
    const dateStr = new Date(order_date).toISOString().slice(2, 10).replace(/-/g, '');
    
    // Tìm mã PO lớn nhất trong ngày. Chú ý: order_type = 'PURCHASE'
    const countRes = await client.query(`
      SELECT COUNT(*) FROM orders 
      WHERE order_type = 'PURCHASE' 
      AND (order_number LIKE $1 OR order_code LIKE $1)
    `, [`PO-${dateStr}-%`]);
    
    const count = parseInt(countRes.rows[0].count) + 1;
    const orderNumber = `PO-${dateStr}-${count.toString().padStart(3, '0')}`;

    // 4. LƯU BẢNG ORDERS: Lưu order_type = 'PURCHASE' để khớp với Constraint
    const orderRes = await client.query(
      `INSERT INTO orders (order_number, order_code, order_type, partner_id, total_amount, status, order_date, expected_date) 
       VALUES ($1, $2, 'PURCHASE', $3, $4, 'PENDING', $5, $6) RETURNING id`,
      [orderNumber, orderNumber, partner_id, total_amount, order_date, expected_date || null]
    );
    const orderId = orderRes.rows[0].id;

    // 5. LƯU BẢNG ORDER_ITEMS
    for (const item of items) {
      const itemTotal = Number(item.quantity) * Number(item.unitPrice);
      
      await client.query(`
        DO $$ BEGIN
          BEGIN ALTER TABLE order_items ADD COLUMN total_price NUMERIC(15,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
          BEGIN ALTER TABLE order_items ADD COLUMN unit_price NUMERIC(15,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
          BEGIN ALTER TABLE order_items ADD COLUMN quantity NUMERIC(15,2) DEFAULT 1; EXCEPTION WHEN duplicate_column THEN END;
          BEGIN ALTER TABLE order_items ADD COLUMN product_id INTEGER; EXCEPTION WHEN duplicate_column THEN END;
          BEGIN ALTER TABLE order_items ADD COLUMN order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_column THEN END;
        END $$;
      `).catch(() => {});

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
    // Chỉ lấy các đơn hàng có order_type = 'PURCHASE'
    const result = await client.query(`
      SELECT o.*, COALESCE(o.order_number, o.order_code) as display_number, s.name as partner_name, s.code as partner_code
      FROM orders o
      LEFT JOIN suppliers s ON o.partner_id = s.id
      WHERE o.order_type = 'PURCHASE'
      ORDER BY o.id DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}