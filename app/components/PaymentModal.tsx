'use client';

import { useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  partnerId: number;
  orderType: 'IN' | 'OUT'; // 'IN' cho SO (Thu tiền), 'OUT' cho PO (Trả tiền)
  totalAmount: number;
  paidAmount: number;
  onSuccess: () => void; // Callback để reload lại data trang chi tiết sau khi thanh toán thành công
}

export default function PaymentModal({
  isOpen,
  onClose,
  orderId,
  partnerId,
  orderType,
  totalAmount,
  paidAmount,
  onSuccess,
}: PaymentModalProps) {
  // Mặc định gợi ý số tiền thanh toán là số tiền còn nợ
  const remainingAmount = totalAmount - (paidAmount || 0);
  
  const [amount, setAmount] = useState<number | string>(remainingAmount);
  const [paymentMethod, setPaymentMethod] = useState('CHUYEN_KHOAN');
  const [referenceCode, setReferenceCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) <= 0) {
      alert('Số tiền thanh toán phải lớn hơn 0');
      return;
    }
    if (Number(amount) > remainingAmount) {
      alert('Số tiền thanh toán không được vượt quá số tiền còn nợ');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          partner_id: partnerId,
          payment_type: orderType,
          amount: Number(amount),
          payment_method: paymentMethod,
          reference_code: referenceCode,
          notes: notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Ghi nhận thanh toán thành công!');
        onSuccess(); // Cập nhật lại UI
        onClose(); // Đóng modal
      } else {
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối đến server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">
            {orderType === 'IN' ? 'Thu tiền khách hàng (SO)' : 'Thanh toán cho NCC (PO)'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex justify-between text-sm mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <span className="text-gray-600">Còn nợ:</span>
            <span className="font-bold text-blue-700">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remainingAmount)}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền thanh toán *</label>
            <input
              type="number"
              required
              max={remainingAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CHUYEN_KHOAN">Chuyển khoản</option>
              <option value="TIEN_MAT">Tiền mặt</option>
              <option value="CAN_TRU">Cấn trừ công nợ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã tham chiếu (Mã GD Ngân hàng)</label>
            <input
              type="text"
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Vd: FT2332..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-300"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}