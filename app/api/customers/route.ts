import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM customers ORDER BY id DESC');
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
    const { code, name, name_zh, contact_person, phone, address } = await req.json();
    await client.query(
      `INSERT INTO customers (code, name, name_zh, contact_person, phone, address) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, name_zh = EXCLUDED.name_zh, contact_person = EXCLUDED.contact_person, phone = EXCLUDED.phone, address = EXCLUDED.address`,
      [code, name, name_zh || '', contact_person || '', phone || '', address || '']
    );
    return NextResponse.json({ message: 'Lưu khách hàng thành công' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}