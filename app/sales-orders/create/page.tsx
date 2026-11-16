import { pool } from '@/lib/db';
import SalesOrderClient from './SalesOrderClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tạo Đơn Bán Hàng (SO) | Mini-ERP',
};

// ĐÂY LÀ DÒNG QUAN TRỌNG NHẤT: Bắt buộc Next.js không được Cache trang này
export const dynamic = 'force-dynamic';

export default async function CreateSalesOrderPage() {
  // 1. Lấy danh sách Khách hàng
  const partnersRes = await pool.query(
    `SELECT id, name, phone FROM partners WHERE type IN ('CUSTOMER', 'BOTH') ORDER BY name ASC`
  );

  // 2. Lấy danh sách Sản phẩm (Dùng COALESCE để tránh lỗi NULL)
  const productsRes = await pool.query(
    `SELECT id, sku, name, sell_price, stock_quantity 
     FROM products 
     WHERE COALESCE(stock_quantity, 0) > 0 
     ORDER BY sku ASC`
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tạo Đơn Bán Hàng (SO)</h1>
      <SalesOrderClient 
        customers={partnersRes.rows} 
        products={productsRes.rows} 
      />
    </div>
  );
}