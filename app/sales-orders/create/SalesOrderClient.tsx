"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Customer { id: string; name: string; }
interface Product { id: string; sku: string; name: string; sell_price: number; stock_quantity: number; }
interface OrderItem { product_id: string; quantity: number; unit_price: number; total_price: number; max_stock: number; }

export default function SalesOrderClient({ customers, products }: { customers: Customer[], products: Product[] }) {
  const router = useRouter();
  const [partnerId, setPartnerId] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAddItem = () => {
    setItems([...items, { product_id: "", quantity: 1, unit_price: 0, total_price: 0, max_stock: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleChangeItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index] }; // Clone object để React nhận diện thay đổi state

    if (field === "product_id") {
      // ÉP KIỂU VỀ STRING: Đảm bảo so sánh chính xác tuyệt đối
      const selectedProduct = products.find(p => String(p.id) === String(value));
      
      if (selectedProduct) {
        item.product_id = String(selectedProduct.id);
        item.unit_price = Number(selectedProduct.sell_price) || 0;
        item.max_stock = Number(selectedProduct.stock_quantity) || 0;
        item.quantity = 1;
      } else {
        item.product_id = "";
        item.unit_price = 0;
        item.max_stock = 0;
      }
    } else if (field === "quantity") {
      const qty = Number(value);
      // LOGIC CHẶN TỒN KHO: Không cho nhập quá max_stock
      if (qty > item.max_stock) {
        alert(`Trong kho chỉ còn ${item.max_stock} sản phẩm này!`);
        item.quantity = item.max_stock;
      } else if (qty < 1) {
        item.quantity = 1;
      } else {
        item.quantity = qty;
      }
    } else if (field === "unit_price") {
      item.unit_price = Number(value);
    }

    // Tự động tính thành tiền
    item.total_price = item.quantity * item.unit_price;
    newItems[index] = item;
    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!partnerId) return setError("Vui lòng chọn khách hàng.");
    if (items.length === 0) return setError("Đơn hàng phải có ít nhất 1 sản phẩm.");
    if (items.some(i => !i.product_id)) return setError("Vui lòng chọn mã sản phẩm cho tất cả các dòng.");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner_id: partnerId,
          order_type: "SALES", // Xác định đây là đơn bán
          items: items.map(i => ({
            product_id: i.product_id,
            quantity: i.quantity,
            unit_price: i.unit_price
          }))
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/sales-orders/${data.order_id}`); // Chuyển sang trang chi tiết SO
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
        <select
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
          className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">-- Chọn khách hàng --</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-800">Danh sách mặt hàng</h3>
          <button type="button" onClick={handleAddItem} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm font-medium">
            + Thêm dòng
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-md text-gray-500">
            Chưa có sản phẩm nào. Bấm "Thêm dòng" để bắt đầu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y text-sm">
                  <th className="p-2 w-1/3">Sản phẩm (Tồn kho)</th>
                  <th className="p-2 w-24">Số lượng</th>
                  <th className="p-2 w-40">Đơn giá bán</th>
                  <th className="p-2 text-right">Thành tiền</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="p-2">
                      <select
                        value={item.product_id}
                        onChange={(e) => handleChangeItem(index, "product_id", e.target.value)}
                        className="w-full border-gray-300 rounded p-1.5 border text-sm"
                        required
                      >
                        <option value="">-- Chọn mã hàng --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.sku} - {p.name} (Tồn: {p.stock_quantity})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        max={item.max_stock || 1}
                        value={item.quantity}
                        onChange={(e) => handleChangeItem(index, "quantity", e.target.value)}
                        className="w-full border-gray-300 rounded p-1.5 border text-sm text-center"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleChangeItem(index, "unit_price", e.target.value)}
                        className="w-full border-gray-300 rounded p-1.5 border text-sm text-right"
                        required
                      />
                    </td>
                    <td className="p-2 text-right font-medium text-gray-700">
                      {item.total_price.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="p-2 text-center">
                      <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end items-center mt-6 pt-4 border-t gap-6">
        <div className="text-lg">
          Tổng tiền: <span className="text-blue-600 font-bold text-xl">{totalAmount.toLocaleString('vi-VN')} ₫</span>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || items.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
        >
          {isSubmitting ? "Đang lưu..." : "Lưu Bản Nháp (SO)"}
        </button>
      </div>
    </form>
  );
}