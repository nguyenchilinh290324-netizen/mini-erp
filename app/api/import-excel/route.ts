import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
  let client;
  try {
    // 1. Nhận file từ giao diện
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'Chưa có file Excel nào được tải lên.' }, { status: 400 });
    }

    // 2. Đọc file Excel bằng thư viện xlsx
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Lấy sheet đầu tiên
    const worksheet = workbook.Sheets[sheetName];
    
    // Chuyển đổi dữ liệu Excel thành mảng JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json({ success: false, message: 'File Excel không có dữ liệu.' }, { status: 400 });
    }

    // 3. Mở kết nối Database và chạy Transaction
    client = await pool.connect();
    await client.query('BEGIN'); // Bắt đầu Transaction an toàn
    
    let importedCount = 0;

    for (const row of data as any[]) {
      // Map các cột từ Excel
      const sku = row['SKU'];
      const name = row['Name'];
      
      // Bỏ qua nếu thiếu SKU hoặc Tên
      if (!sku || !name) continue; 

      const category = row['Category'] || null;
      const unit = row['Unit'] || 'Cái';
      const cost_price = parseFloat(row['CostPrice']) || 0;
      const sell_price = parseFloat(row['SellPrice']) || 0;
      const stock_quantity = parseInt(row['Stock']) || 0;

      // Câu lệnh UPSERT: Nếu SKU đã có thì Cập nhật, chưa có thì Thêm mới
      const query = `
        INSERT INTO products (sku, name, category, unit, cost_price, sell_price, stock_quantity)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (sku) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          unit = EXCLUDED.unit,
          cost_price = EXCLUDED.cost_price,
          sell_price = EXCLUDED.sell_price,
          stock_quantity = EXCLUDED.stock_quantity
      `;
      
      await client.query(query, [sku, name, category, unit, cost_price, sell_price, stock_quantity]);
      importedCount++;
    }

    await client.query('COMMIT'); // Lưu thay đổi
    
    return NextResponse.json({ 
      success: true, 
      message: `Đã nhập/cập nhật thành công ${importedCount} sản phẩm.` 
    });

  } catch (error) {
    if (client) await client.query('ROLLBACK'); // Hoàn tác nếu có lỗi
    console.error('Lỗi import excel:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi xử lý file Excel', error: String(error) }, 
      { status: 500 }
    );
  } finally {
    if (client) client.release(); // Trả lại kết nối cho pool
  }
}