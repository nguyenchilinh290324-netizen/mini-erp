import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2 } from '../../../lib/r2';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ success: false, message: 'Chưa có file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    // Thêm timestamp để tên file không bị trùng
    const fileName = `products/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const bucketName = process.env.R2_BUCKET_NAME || 'erp-miniv0';

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });
    
    await r2.send(command);

    // Trả về tên file (hoặc ghép luôn với R2_PUBLIC_URL nếu bạn đã cấu hình public bucket)
    // Nếu bạn dùng Public URL của Cloudflare, hãy thêm R2_PUBLIC_URL="https://..." vào file .env.local
    const publicUrl = process.env.R2_PUBLIC_URL ? `${process.env.R2_PUBLIC_URL}/${fileName}` : fileName;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('Lỗi Upload R2:', error);
    return NextResponse.json({ success: false, message: 'Lỗi khi tải ảnh lên R2' }, { status: 500 });
  }
}