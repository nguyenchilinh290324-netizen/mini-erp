import { pool } from '@/lib/db';
import { notFound } from 'next/navigation';
import SalesOrderDetailClient from './SalesOrderDetailClient';

export default async function SalesOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Fetch SO Data
  const orderRes = await pool.query(
    `SELECT o.*, p.name as partner_name, p.phone, p.address
     FROM orders o 
     LEFT JOIN partners p ON o.partner_id = p.id 
     WHERE o.id = $1 AND o.order_type = 'SALES'`,
    [id]
  );

  if (orderRes.rowCount === 0) return notFound();

  // 2. Fetch Items Data
  const itemsRes = await pool.query(
    `SELECT oi.*, pr.sku, pr.name 
     FROM order_items oi 
     JOIN products pr ON oi.product_id = pr.id 
     WHERE oi.order_id = $1`,
    [id]
  );

  // 3. THÊM MỚI: Fetch Payment History (Lịch sử thanh toán)
  const paymentsRes = await pool.query(
    `SELECT id, amount, payment_date, payment_method, reference_code, notes 
     FROM payments 
     WHERE order_id = $1 
     ORDER BY payment_date DESC`,
    [id]
  );

  // Gom toàn bộ dữ liệu truyền xuống Client
  const orderData = {
    ...orderRes.rows[0],
    items: itemsRes.rows,
    payments: paymentsRes.rows, // Truyền thêm mảng payments
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <SalesOrderDetailClient initialOrder={orderData} />
    </div>
  );
}