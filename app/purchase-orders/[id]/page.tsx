import { pool } from '@/lib/db';
import { notFound } from 'next/navigation';
import PurchaseOrderDetailClient from './PurchaseOrderDetailClient';

// Cập nhật type của params thành Promise
export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Giải nén Promise để lấy id
  const { id } = await params;

  // Fetch PO Data (Thay params.id thành id)
  const orderRes = await pool.query(
    `SELECT o.*, p.name as partner_name 
     FROM orders o 
     LEFT JOIN partners p ON o.partner_id = p.id 
     WHERE o.id = $1`,
    [id] 
  );

  if (orderRes.rowCount === 0) return notFound();

  // Fetch Items Data (Thay params.id thành id)
  const itemsRes = await pool.query(
    `SELECT oi.*, pr.sku, pr.name 
     FROM order_items oi 
     JOIN products pr ON oi.product_id = pr.id 
     WHERE oi.order_id = $1`,
    [id]
  );

  const orderData = {
    ...orderRes.rows[0],
    items: itemsRes.rows,
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <PurchaseOrderDetailClient initialOrder={orderData} />
    </div>
  );
}