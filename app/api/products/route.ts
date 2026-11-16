import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';

export async function GET() {
  try {
    // Lấy dữ liệu và sắp xếp sản phẩm mới tạo lên đầu
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    
    return NextResponse.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách sản phẩm:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi lấy dữ liệu từ database' }, 
      { status: 500 }
    );
  }
}
// (Giữ nguyên hàm GET hiện tại ở trên cùng)

// Thêm mới sản phẩm
// Cập nhật trong hàm POST
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const query = `
      INSERT INTO products (sku, name, category, unit, cost_price, sell_price, stock_quantity, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `;
    const values = [data.sku, data.name, data.category, data.unit, data.cost_price, data.sell_price, data.stock_quantity, data.image_url];
    const result = await pool.query(query, values);
    return NextResponse.json({ success: true, message: 'Đã thêm', data: result.rows[0] });
  } catch (error) { /*...*/ }
}

// Cập nhật sản phẩm
// Cập nhật trong hàm PUT
export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const query = `
      UPDATE products 
      SET sku = $1, name = $2, category = $3, unit = $4, cost_price = $5, sell_price = $6, stock_quantity = $7, image_url = $8
      WHERE id = $9 RETURNING *
    `;
    const values = [data.sku, data.name, data.category, data.unit, data.cost_price, data.sell_price, data.stock_quantity, data.image_url, data.id];
    const result = await pool.query(query, values);
    return NextResponse.json({ success: true, message: 'Đã cập nhật', data: result.rows[0] });
  } catch (error) { /*...*/ }
}

// Xoá sản phẩm
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Đã xoá sản phẩm' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi xoá sản phẩm', error: String(error) }, { status: 500 });
  }
}