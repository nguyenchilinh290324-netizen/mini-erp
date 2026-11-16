import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// Đảm bảo bảng products luôn có cột name_zh và specification
async function ensureColumns(client: any) {
  await client.query(`
    ALTER TABLE products ADD COLUMN IF NOT EXISTS name_zh VARCHAR(255) DEFAULT '';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS specification TEXT DEFAULT '';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(255) DEFAULT '';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
  `);
}

export async function GET() {
  const client = await pool.connect();
  try {
    await ensureColumns(client);
    const result = await client.query(`
      SELECT id, sku, name, COALESCE(name_zh, '') as name_zh, COALESCE(specification, '') as specification,
             COALESCE(category, '') as category, COALESCE(unit, 'Cái') as unit,
             COALESCE(cost_price, 0) as cost_price, COALESCE(sell_price, 0) as sell_price,
             COALESCE(stock_quantity, 0) as stock_quantity, COALESCE(image_url, '') as image_url
      FROM products
      ORDER BY id DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    await ensureColumns(client);
    const body = await req.json();

    // Trường hợp 1: Nhập hàng loạt từ file Excel (mảng items)
    if (Array.isArray(body.items)) {
      await client.query('BEGIN');
      for (const item of body.items) {
        if (!item.sku || !item.name) continue;
        await client.query(
          `INSERT INTO products (sku, name, name_zh, specification, category, unit, cost_price, sell_price, stock_quantity, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (sku) DO UPDATE SET
             name = EXCLUDED.name,
             name_zh = EXCLUDED.name_zh,
             specification = EXCLUDED.specification,
             category = EXCLUDED.category,
             unit = EXCLUDED.unit,
             cost_price = EXCLUDED.cost_price,
             sell_price = EXCLUDED.sell_price,
             stock_quantity = EXCLUDED.stock_quantity,
             image_url = CASE WHEN EXCLUDED.image_url != '' THEN EXCLUDED.image_url ELSE products.image_url END`,
          [
            String(item.sku).trim(),
            String(item.name).trim(),
            String(item.name_zh || '').trim(),
            String(item.specification || '').trim(),
            String(item.category || '').trim(),
            String(item.unit || 'Cái').trim(),
            Number(item.cost_price || 0),
            Number(item.sell_price || 0),
            Number(item.stock_quantity || 0),
            String(item.image_url || '').trim(),
          ]
        );
      }
      await client.query('COMMIT');
      return NextResponse.json({ message: 'Import thành công' });
    }

    // Trường hợp 2: Thêm hoặc cập nhật 1 sản phẩm lẻ
    const { id, sku, name, name_zh, specification, category, unit, cost_price, sell_price, stock_quantity, image_url } = body;

    if (id) {
      await client.query(
        `UPDATE products
         SET sku = $1, name = $2, name_zh = $3, specification = $4, category = $5,
             unit = $6, cost_price = $7, sell_price = $8, stock_quantity = $9, image_url = $10
         WHERE id = $11`,
        [sku, name, name_zh || '', specification || '', category || '', unit || 'Cái', Number(cost_price || 0), Number(sell_price || 0), Number(stock_quantity || 0), image_url || '', id]
      );
      return NextResponse.json({ message: 'Cập nhật thành công' });
    } else {
      await client.query(
        `INSERT INTO products (sku, name, name_zh, specification, category, unit, cost_price, sell_price, stock_quantity, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [sku, name, name_zh || '', specification || '', category || '', unit || 'Cái', Number(cost_price || 0), Number(sell_price || 0), Number(stock_quantity || 0), image_url || '']
      );
      return NextResponse.json({ message: 'Thêm mới thành công' });
    }
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {});
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: Request) {
  const client = await pool.connect();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });
    await client.query('DELETE FROM products WHERE id = $1', [id]);
    return NextResponse.json({ message: 'Đã xoá sản phẩm' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}