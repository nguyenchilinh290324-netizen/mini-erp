"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PaymentModal from "@/app/components/PaymentModal"; // Chú ý kiểm tra đúng đường dẫn

// Khai báo kiểu dữ liệu
interface OrderItem {
  product_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_code: string;
  partner_id: number; // Bắt buộc phải có để truyền vào Modal
  partner_name: string;
  status: string;
  total_amount: number;
  paid_amount?: number; // Cột mới từ Database
  payment_status?: string; // Cột mới từ Database
  created_at: string;
  items: OrderItem[];
}

export default function PurchaseOrderDetailClient({ initialOrder }: { initialOrder: Order }) {
  const router = useRouter();
  
  // Quản lý state cục bộ
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isApproving, setIsApproving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // State điều khiển Modal Thanh toán
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Tính toán công nợ
  const totalAmount = Number(order.total_amount || 0);
  const paidAmount = Number(order.paid_amount || 0);
  const remainingAmount = totalAmount - paidAmount;

  const handleApprove = async () => {
    if (!confirm("Bạn có chắc chắn muốn duyệt đơn này và nhập kho? Thao tác này không thể hoàn tác.")) {
      return;
    }

    setIsApproving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/purchase-orders/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Lỗi khi duyệt đơn hàng");
      }

      setMessage({ text: "Duyệt đơn và nhập kho thành công!", type: "success" });
      setOrder((prev) => ({ ...prev, status: "COMPLETED" }));
      router.refresh(); 

    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setIsApproving(false);
    }
  };

  // Nạp lại dữ liệu sau khi thanh toán NCC thành công
  const handlePaymentSuccess = () => {
    router.refresh();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-5xl mx-auto">
      {/* Header Thông tin chung */}
      <div className="flex justify-between items-start mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Đơn Mua Hàng #{order.order_code}
          </h1>
          <p className="text-gray-500 mt-1">Nhà cung cấp: {order.partner_name}</p>
          <p className="text-gray-500">Ngày tạo: {new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
        </div>
        
        <div className="flex flex-col items-end space-y-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              order.status === "COMPLETED"
                ? "bg-green-100 text-green-700"
                : order.status === "DRAFT"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {order.status === "COMPLETED" ? "Đã nhập kho" : "Bản nháp"}
          </span>

          {/* Nút Duyệt */}
          {order.status === "DRAFT" && (
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center"
            >
              {isApproving ? "Đang xử lý..." : "Duyệt & Nhập Kho"}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Bảng Chi tiết mặt hàng */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Chi tiết sản phẩm</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200 text-sm text-gray-600">
                <th className="p-3 font-medium">SKU</th>
                <th className="p-3 font-medium">Sản phẩm</th>
                <th className="p-3 font-medium text-right">Số lượng</th>
                <th className="p-3 font-medium text-right">Đơn giá</th>
                <th className="p-3 font-medium text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {order.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-800 font-medium">{item.sku}</td>
                  <td className="p-3 text-gray-600">{item.name}</td>
                  <td className="p-3 text-gray-800 text-right">{item.quantity}</td>
                  <td className="p-3 text-gray-800 text-right">
                    {Number(item.unit_price).toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="p-3 font-medium text-right">
                    {Number(item.total_price).toLocaleString('vi-VN')} ₫
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KHU VỰC TỔNG KẾT TÀI CHÍNH & THANH TOÁN */}
      <div className="mt-8 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Trạng thái thanh toán:</h3>
          <span className={`px-3 py-1.5 text-sm font-bold rounded-full border ${
            order.payment_status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 
            order.payment_status === 'PARTIAL' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
            'bg-red-50 text-red-700 border-red-200'
          }`}>
            {order.payment_status === 'PAID' ? 'ĐÃ THANH TOÁN NCC' : 
             order.payment_status === 'PARTIAL' ? 'THANH TOÁN MỘT PHẦN' : 'CHƯA THANH TOÁN'}
          </span>
        </div>
        
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Tóm tắt thanh toán</h3>
          
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-600">Tổng tiền đơn hàng:</span>
            <span className="font-semibold">{totalAmount.toLocaleString('vi-VN')} ₫</span>
          </div>
          
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-600">Đã trả NCC:</span>
            <span className="text-green-600 font-semibold">{paidAmount.toLocaleString('vi-VN')} ₫</span>
          </div>
          
          <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t">
            <span>Còn nợ NCC:</span>
            <span className="text-red-600">{remainingAmount.toLocaleString('vi-VN')} ₫</span>
          </div>

          <div className="mt-5">
            {order.payment_status === 'PAID' ? (
              <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-2.5 px-4 rounded-md cursor-not-allowed">
                Đã hoàn tất thanh toán
              </button>
            ) : (
              <button 
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-md transition-colors"
              >
                Chi tiền trả NCC
              </button>
            )}
          </div>
        </div>
      </div>

      {/* COMPONENT MODAL THANH TOÁN */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        orderId={Number(order.id)}
        partnerId={order.partner_id}
        orderType="OUT" // 'OUT' cho Đơn Mua Hàng (PO)
        totalAmount={totalAmount}
        paidAmount={paidAmount}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}