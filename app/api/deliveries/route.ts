import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM deliveries ORDER BY id DESC');
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(req: Request) {
  const client = await pool.connect();
  try {
    const { id, status } = await req.json();
    let query = 'UPDATE deliveries SET status = $1';
    let params: any[] = [status];

    if (status === 'DELIVERED') {
      query += ', actual_delivery = CURRENT_TIMESTAMP';
    }
    
    query += ' WHERE id = $2';
    params.push(id);

    await client.query(query, params);
    return NextResponse.json({ message: 'Cập nhật trạng thái thành công' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}