import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    // 1. AUTO-MIGRATION: Đảm bảo bảng và các cột tồn tại
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS order_items (id SERIAL PRIMARY KEY);
      
      DO $$
      BEGIN
        BEGIN ALTER TABLE orders ADD COLUMN order_number VARCHAR(50); EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN order_code VARCHAR(50); EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN order_type VARCHAR(20) DEFAULT 'SALES'; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN partner_id INTEGER; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN total_amount NUMERIC(15,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN vat_rate NUMERIC(5,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN vat_amount NUMERIC(15,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT 'PENDING'; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN order_date DATE; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN expected_date DATE; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE orders ADD COLUMN notes TEXT; EXCEPTION WHEN duplicate_column THEN END; -- Cột Ghi chú
      END $$;
    `);

    // Gỡ bỏ các ràng buộc có thể gây lỗi
    await client.query(`ALTER TABLE orders ALTER COLUMN order_code DROP NOT NULL`).catch(() => {});
    await client.query(`ALTER TABLE orders ALTER COLUMN order_number DROP NOT NULL`).catch(() => {});
    await client.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_partner_id_fkey`).catch(() => {});

    // 2. NHẬN DỮ LIỆU TỪ GIAO DIỆN
    const body = await req.json();
    const { partner_id, order_date, expected_date, custom_order_code, total_amount, vat_rate, vat_amount, notes, items } = body;

    if (!partner_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc (Khách hàng hoặc Sản phẩm)' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 3. TẠO HOẶC NHẬN MÃ SO
    let finalOrderNumber = custom_order_code;
    if (!finalOrderNumber || finalOrderNumber.trim() === '') {
      const dateStr = new Date(order_date).toISOString().slice(2, 10).replace(/-/g, '');
      const countRes = await client.query(`
        SELECT COUNT(*) FROM orders 
        WHERE order_type = 'SALES' 
        AND (order_number LIKE $1 OR order_code LIKE $1)
      `, [`SO-${dateStr}-%`]);
      const count = parseInt(countRes.rows[0].count) + 1;
      finalOrderNumber = `SO-${dateStr}-${count.toString().padStart(3, '0')}`;
    }

    // 4. LƯU BẢNG ORDERS (order_type = 'SALES')
    const orderRes = await client.query(
      `INSERT INTO orders (order_number, order_code, order_type, partner_id, total_amount, vat_rate, vat_amount, status, order_date, expected_date, notes) 
       VALUES ($1, $2, 'SALES', $3, $4, $5, $6, 'PENDING', $7, $8, $9) RETURNING id`,
      [finalOrderNumber, finalOrderNumber, partner_id, total_amount, vat_rate || 0, vat_amount || 0, order_date, expected_date || null, notes || '']
    );
    const orderId = orderRes.rows[0].id;

    // 5. LƯU BẢNG ORDER_ITEMS
    for (const item of items) {
      await client.query(`
        DO $$ BEGIN
          BEGIN ALTER TABLE order_items ADD COLUMN unit_price NUMERIC(15,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
          BEGIN ALTER TABLE order_items ADD COLUMN quantity NUMERIC(15,2) DEFAULT 1; EXCEPTION WHEN duplicate_column THEN END;
          BEGIN ALTER TABLE order_items ADD COLUMN product_id INTEGER; EXCEPTION WHEN duplicate_column THEN END;
          BEGIN ALTER TABLE order_items ADD COLUMN order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_column THEN END;
        END $$;
      `).catch(() => {});

      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price) 
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.productId, item.quantity, item.unitPrice]
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Tạo Đơn Bán Hàng (SO) thành công', orderId, orderNumber: finalOrderNumber });

  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Lỗi tạo SO:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET() {
  const client = await pool.connect();
  try {
    // Chỉ lấy các đơn hàng có order_type = 'SALES', liên kết với bảng customers
    const result = await client.query(`
      SELECT o.*, COALESCE(o.order_number, o.order_code) as display_number, c.name as partner_name, c.code as partner_code
      FROM orders o
      LEFT JOIN customers c ON o.partner_id = c.id
      WHERE o.order_type = 'SALES'
      ORDER BY o.id DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}