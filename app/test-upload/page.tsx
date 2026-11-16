'use client';
import { useState } from 'react';

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert('Vui lòng chọn một file ảnh hoặc PDF!');
      return;
    }
    
    setLoading(true);
    setResult(null);

    // Chuẩn bị dữ liệu Form
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Gọi API vừa tạo
      const res = await fetch('/api/test-upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, message: 'Lỗi khi gọi API' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Test Upload File Lên Cloudflare R2</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="file" 
          accept="image/*,.pdf" 
          onChange={(e) => setFile(e.target.files?.[0] || null)} 
          style={{ padding: '10px', border: '1px solid #ccc', width: '100%' }}
        />
      </div>

      <button 
        onClick={handleUpload} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: loading ? '#ccc' : '#0070f3', 
          color: 'white', 
          border: 'none', 
          cursor: loading ? 'not-allowed' : 'pointer' 
        }}
      >
        {loading ? 'Đang đẩy lên R2...' : 'Tải lên R2'}
      </button>

      {/* Hiển thị kết quả trả về từ R2 */}
      {result && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: result.success ? '#e6fffa' : '#fff5f5', borderRadius: '5px' }}>
          <strong>Kết quả:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: '10px' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}