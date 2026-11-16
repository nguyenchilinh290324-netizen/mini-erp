import { NextResponse } from 'next/server';
// Đường dẫn import cấu hình DB của bạn (tuỳ chỉnh theo project thực tế, ví dụ: '@/lib/db')
import { pool } from '@/lib/db'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: 'Thiếu thông tin mã đơn hàng (order_id)' },
        { status: 400 }
      );
    }

    // Mượn 1 client độc lập từ pool để chạy Transaction
    const client = await pool.connect();

    try {
      // Bắt đầu Transaction
      await client.query('BEGIN');

      // 1. Kiểm tra trạng thái đơn hàng (Chỉ duyệt đơn đang ở trạng thái DRAFT)
      const orderRes = await client.query(
        `SELECT id, status FROM orders WHERE id = $1`,
        [order_id]
      );

      if (orderRes.rowCount === 0) {
        throw new Error('Không tìm thấy đơn hàng.');
      }
      
      const currentStatus = orderRes.rows[0].status;
      if (currentStatus !== 'DRAFT') {
        throw new Error(`Đơn hàng đã được duyệt hoặc đang ở trạng thái: ${currentStatus}`);
      }

      // 2. Cập nhật trạng thái đơn hàng thành COMPLETED (hoặc RECEIVED)
      await client.query(
        `UPDATE orders SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [order_id]
      );

      // 3. Lấy danh sách các mặt hàng thuộc đơn này
      const itemsRes = await client.query(
        `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
        [order_id]
      );

      // 4. Lặp qua từng mặt hàng để cộng tồn kho và ghi log
      for (const item of itemsRes.rows) {
        const { product_id, quantity } = item;

        // 4a. Cộng dồn số lượng vào cột stock_quantity của bảng products
        await client.query(
          `UPDATE products 
           SET stock_quantity = COALESCE(stock_quantity, 0) + $1 
           WHERE id = $2`,
          [quantity, product_id]
        );

        // 4b. Ghi nhận giao dịch vào bảng inventory_transactions
        await client.query(
          `INSERT INTO inventory_transactions 
             (product_id, transaction_type, quantity, reference_id, notes, created_at)
           VALUES 
             ($1, 'IN', $2, $3, $4, CURRENT_TIMESTAMP)`,
          [
            product_id, 
            quantity, 
            order_id, 
            `Nhập kho từ đơn mua hàng (PO) số #${order_id}`
          ]
        );
      }

      // Nếu tất cả truy vấn đều thành công -> Xác nhận lưu vào Database
      await client.query('COMMIT');
      
      return NextResponse.json(
        { success: true, message: 'Duyệt đơn và nhập kho thành công!' },
        { status: 200 }
      );

    } catch (error: any) {
      // Nếu có BẤT KỲ lỗi nào xảy ra ở các bước trên -> Huỷ bỏ toàn bộ thao tác
      await client.query('ROLLBACK');
      throw error; // Ném lỗi ra ngoài block catch bên ngoài để xử lý chung
    } finally {
      // Bắt buộc phải trả client lại cho pool sau khi dùng xong
      client.release();
    }

  } catch (error: any) {
    console.error('Lỗi khi duyệt đơn PO:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi máy chủ nội bộ' },
      { status: 500 }
    );
  }
}