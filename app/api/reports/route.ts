import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  const client = await pool.connect();
  try {
    // 1. Thống kê tổng quan
    const kpiRes = await client.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COALESCE(SUM(total_amount * 0.7), 0) AS estimated_cost, -- Giả sử giá vốn chiếm 70% doanh thu để làm báo cáo mẫu
        COUNT(id) AS total_orders
      FROM orders 
      WHERE order_type = 'SALES' AND status = 'COMPLETED'
    `);

    // 2. Doanh thu theo 7 ngày gần nhất
    const chartRes = await client.query(`
      SELECT TO_CHAR(order_date, 'DD/MM') as name, SUM(total_amount) as revenue
      FROM orders
      WHERE order_type = 'SALES' AND status = 'COMPLETED'
      GROUP BY TO_CHAR(order_date, 'DD/MM'), DATE(order_date)
      ORDER BY DATE(order_date) ASC
      LIMIT 7
    `);

    // 3. Top 5 sản phẩm bán chạy nhất
    const topProductsRes = await client.query(`
      SELECT p.sku, p.name, SUM(oi.quantity) as sold_qty
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.order_type = 'SALES' AND o.status = 'COMPLETED'
      GROUP BY p.sku, p.name
      ORDER BY sold_qty DESC
      LIMIT 5
    `);

    const data = {
      kpi: kpiRes.rows[0],
      chartData: chartRes.rows.map(row => ({ name: row.name, revenue: Number(row.revenue) })),
      topProducts: topProductsRes.rows
    };

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}