import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2 } from '../../../lib/r2';

export async function POST(req: Request) {
  try {
    // 1. Lấy dữ liệu file từ form client gửi lên
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'Chưa có file nào được chọn' }, { status: 400 });
    }

    // 2. Chuyển đổi file thành Buffer để upload
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 3. Đổi tên file để tránh trùng lặp (thêm timestamp)
    const fileName = `test-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    
    // 4. Lấy tên Bucket từ biến môi trường (hoặc fix cứng 'erp-miniv0')
    const bucketName = process.env.R2_BUCKET_NAME || 'erp-miniv0';

    // 5. Khởi tạo lệnh đẩy file lên R2
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    // 6. Thực thi upload
    await r2.send(command);

    return NextResponse.json({
      success: true,
      message: 'Upload thành công lên R2!',
      data: {
        fileName: fileName,
        fileType: file.type,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`
      }
    });

  } catch (error) {
    console.error('Lỗi upload R2:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Lỗi upload lên R2', 
        error: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
}