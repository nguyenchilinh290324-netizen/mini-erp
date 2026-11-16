import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM partners ORDER BY id DESC');
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi lấy danh sách đối tác' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const query = `
      INSERT INTO partners (type, name, tax_code, contact_person, phone, email, address)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const values = [data.type, data.name, data.tax_code, data.contact_person, data.phone, data.email, data.address];
    const result = await pool.query(query, values);
    return NextResponse.json({ success: true, message: 'Đã thêm đối tác', data: result.rows[0] });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi thêm đối tác', error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const query = `
      UPDATE partners 
      SET type = $1, name = $2, tax_code = $3, contact_person = $4, phone = $5, email = $6, address = $7
      WHERE id = $8 RETURNING *
    `;
    const values = [data.type, data.name, data.tax_code, data.contact_person, data.phone, data.email, data.address, data.id];
    const result = await pool.query(query, values);
    return NextResponse.json({ success: true, message: 'Đã cập nhật', data: result.rows[0] });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi cập nhật', error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await pool.query('DELETE FROM partners WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Đã xoá đối tác' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi xoá (có thể do đối tác đã có đơn hàng)' }, { status: 500 });
  }
}