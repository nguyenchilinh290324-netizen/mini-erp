import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  const client = await pool.connect();

  try {
    const body = await request.json();
    const { 
      order_id, 
      partner_id, 
      payment_type, // 'IN' (thu từ SO) hoặc 'OUT' (trả cho PO)
      amount, 
      payment_method, 
      reference_code, 
      notes 
    } = body;

    // Validate dữ liệu cơ bản
    if (!order_id || !partner_id || !payment_type || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Thiếu dữ liệu bắt buộc hoặc số tiền không hợp lệ' }, { status: 400 });
    }

    // Bắt đầu Transaction
    await client.query('BEGIN');

    // 1. Lưu lịch sử thanh toán vào bảng payments
    const insertPaymentQuery = `
      INSERT INTO payments (order_id, partner_id, payment_type, amount, payment_method, reference_code, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, payment_date;
    `;
    const paymentValues = [order_id, partner_id, payment_type, amount, payment_method, reference_code, notes];
    await client.query(insertPaymentQuery, paymentValues);

    // 2. Cập nhật paid_amount và payment_status trong bảng orders
    const updateOrderQuery = `
      UPDATE orders
      SET 
        paid_amount = COALESCE(paid_amount, 0) + $1,
        payment_status = CASE
          WHEN COALESCE(paid_amount, 0) + $1 >= total_amount THEN 'PAID'
          WHEN COALESCE(paid_amount, 0) + $1 > 0 THEN 'PARTIAL'
          ELSE 'UNPAID'
        END
      WHERE id = $2
      RETURNING total_amount, paid_amount, payment_status;
    `;
    const updateOrderRes = await client.query(updateOrderQuery, [amount, order_id]);
    const updatedOrder = updateOrderRes.rows[0];

    // Xác nhận Transaction
    await client.query('COMMIT');

    return NextResponse.json({ 
      success: true, 
      message: 'Ghi nhận thanh toán thành công',
      order: updatedOrder
    }, { status: 200 });

  } catch (error) {
    // Nếu có lỗi ở bất kỳ bước nào, Rollback lại toàn bộ
    await client.query('ROLLBACK');
    console.error('Lỗi khi ghi nhận thanh toán:', error);
    return NextResponse.json({ error: 'Lỗi server khi xử lý thanh toán' }, { status: 500 });
  } finally {
    // Luôn nhớ trả kết nối lại cho pool
    client.release();
  }
}