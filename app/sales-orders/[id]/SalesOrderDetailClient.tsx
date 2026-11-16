"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import PaymentModal from "@/app/components/PaymentModal";

interface OrderItem { 
  sku: string; 
  name: string; 
  quantity: number; 
  unit_price: number; 
  total_price: number; 
}

// Bổ sung interface PaymentRecord
interface PaymentRecord {
  id: number;
  amount: string;
  payment_date: string;
  payment_method: string;
  reference_code: string;
  notes: string;
}

// Cập nhật Type Order
interface Order { 
  id: string; 
  order_code: string; 
  partner_id: number;
  partner_name: string; 
  status: string; 
  total_amount: number; 
  paid_amount?: number; 
  payment_status?: string; 
  created_at: string; 
  items: OrderItem[]; 
  payments?: PaymentRecord[]; // Thêm mảng payments nhận từ Server
}

export default function SalesOrderDetailClient({ initialOrder }: { initialOrder: Order }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isApproving, setIsApproving] = useState(false);
  
  // State điều khiển Modal Thanh toán
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Tính toán công nợ
  const totalAmount = Number(order.total_amount || 0);
  const paidAmount = Number(order.paid_amount || 0);
  const remainingAmount = totalAmount - paidAmount;

  // 1. Tạo Ref để trỏ vào vùng giao diện cần in
  const printRef = useRef<HTMLDivElement>(null);

  // 2. Cấu hình hàm In PDF theo CHUẨN MỚI CỦA v3.x
  const handlePrint = useReactToPrint({
    contentRef: printRef, 
    documentTitle: `Don_Hang_${order.order_code}`,
  });

  const handleApprove = async () => {
    if (!confirm("Xác nhận duyệt đơn bán hàng và xuất kho?")) return;
    setIsApproving(true);
    try {
      const res = await fetch("/api/sales-orders/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Duyệt đơn và xuất kho thành công!");
      setOrder((prev) => ({ ...prev, status: "COMPLETED" }));
      router.refresh(); 
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsApproving(false);
    }
  };

  // Nạp lại dữ liệu sau khi thanh toán xong
  const handlePaymentSuccess = () => {
    router.refresh();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Vùng công cụ */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
        <div className="flex gap-3">
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium"
          >
            Quay lại
          </button>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => handlePrint()}
            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded font-medium flex items-center gap-2"
          >
            In / Lưu PDF
          </button>

          {order.status === "DRAFT" && (
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
            >
              {isApproving ? "Đang xử lý..." : "Duyệt Đơn & Xuất Kho"}
            </button>
          )}
        </div>
      </div>

      {/* VÙNG NỘI DUNG IN */}
      <div ref={printRef} className="bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0">
        
        <div className="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">Đơn Bán Hàng</h1>
            <p className="text-gray-500 mt-2 font-medium">Mã đơn: {order.order_code}</p>
            <p className="text-gray-500">Ngày tạo: {new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800">CÔNG TY TNHH SAYDA VIỆT NAM</h2>
            <p className="text-gray-600 mt-1">Đường Võ Cường, TP. Bắc Ninh</p>
            <p className="text-gray-600">Email: contact@sayda.vn</p>
          </div>
        </div>

        <div className="mb-8 flex justify-between items-end">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2 border-l-4 border-blue-600 pl-2">THÔNG TIN KHÁCH HÀNG</h3>
            <p className="text-gray-800 font-semibold text-lg">{order.partner_name}</p>
          </div>
          
          <div className="text-right">
            <span className={`px-4 py-1.5 text-sm font-bold rounded-full border ${
              order.payment_status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 
              order.payment_status === 'PARTIAL' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              {order.payment_status === 'PAID' ? 'ĐÃ THANH TOÁN ĐỦ' : 
               order.payment_status === 'PARTIAL' ? 'THANH TOÁN MỘT PHẦN' : 'CHƯA THANH TOÁN'}
            </span>
          </div>
        </div>

        <table className="w-full text-left border-collapse mb-8">
          <thead>
            <tr className="bg-gray-100 text-gray-800 border-y-2 border-gray-800">
              <th className="p-3 font-bold">STT</th>
              <th className="p-3 font-bold">Mã Hàng (SKU)</th>
              <th className="p-3 font-bold">Tên Sản Phẩm</th>
              <th className="p-3 font-bold text-right">SL</th>
              <th className="p-3 font-bold text-right">Đơn giá</th>
              <th className="p-3 font-bold text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {order.items.map((item, i) => (
              <tr key={i}>
                <td className="p-3 font-medium text-gray-600">{i + 1}</td>
                <td className="p-3 font-medium">{item.sku}</td>
                <td className="p-3">{item.name}</td>
                <td className="p-3 text-right font-semibold">{item.quantity}</td>
                <td className="p-3 text-right">{Number(item.unit_price).toLocaleString('vi-VN')} ₫</td>
                <td className="p-3 text-right font-semibold">{Number(item.total_price).toLocaleString('vi-VN')} ₫</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* KHU VỰC TỔNG KẾT TÀI CHÍNH */}
        <div className="flex justify-end mb-12">
          <div className="w-full md:w-1/2 lg:w-5/12 bg-gray-50 p-5 rounded-lg border border-gray-200 print:bg-transparent print:border-none print:p-0">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-600">Tổng tiền hàng:</span>
              <span className="font-semibold text-gray-900">{totalAmount.toLocaleString('vi-VN')} ₫</span>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-gray-600">Đã thanh toán / Cọc:</span>
              <span className="font-semibold text-green-600">{paidAmount.toLocaleString('vi-VN')} ₫</span>
            </div>

            <div className="flex justify-between items-center border-t-2 border-gray-800 pt-3 mb-1">
              <span className="font-bold text-lg text-gray-800">CÒN PHẢI THU:</span>
              <span className="font-bold text-2xl text-red-600">{remainingAmount.toLocaleString('vi-VN')} ₫</span>
            </div>
            <p className="text-xs text-gray-500 text-right italic">(Đã bao gồm VAT nếu có)</p>

            {/* NÚT THAO TÁC - Ẩn khi in ấn */}
            <div className="print:hidden mt-6 pt-4 border-t border-gray-200">
              {order.payment_status === 'PAID' ? (
                <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-2.5 px-4 rounded-md cursor-not-allowed">
                  Đã hoàn tất thu tiền
                </button>
              ) : (
                <button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-md transition-colors flex justify-center items-center gap-2"
                >
                  Ghi nhận thu tiền
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between px-10 text-center mt-16 pt-10">
          <div>
            <p className="font-bold text-gray-800">ĐẠI DIỆN KHÁCH HÀNG</p>
            <p className="text-sm text-gray-500 italic mt-1">(Ký & Ghi rõ họ tên)</p>
          </div>
          <div>
            <p className="font-bold text-gray-800">NGƯỜI LẬP ĐƠN</p>
            <p className="text-sm text-gray-500 italic mt-1">(Ký & Ghi rõ họ tên)</p>
          </div>
        </div>
      </div>

      {/* BẢNG LỊCH SỬ THANH TOÁN (Ẩn khi in) */}
      {order.payments && order.payments.length > 0 && (
        <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden print:hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Lịch sử thu tiền
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày GD</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hình thức</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Tham Chiếu</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm">
                {order.payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                      {new Date(payment.payment_date).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                      {payment.payment_method === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : 
                       payment.payment_method === 'TIEN_MAT' ? 'Tiền mặt' : 
                       payment.payment_method === 'CAN_TRU' ? 'Cấn trừ' : payment.payment_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {payment.reference_code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-green-600">
                      +{Number(payment.amount).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate" title={payment.notes}>
                      {payment.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL THANH TOÁN */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        orderId={Number(order.id)}
        partnerId={order.partner_id}
        orderType="IN"
        totalAmount={totalAmount}
        paidAmount={paidAmount}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  ); 
}