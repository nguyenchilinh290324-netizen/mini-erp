import RevenueChart from '@/app/components/RevenueChart';
import LogoutButton from '@/app/components/LogoutButton';

export default function DashboardPage() {
  const mockChartData = [
    { name: '10/11', total: 15000000 },
    { name: '11/11', total: 25000000 },
    { name: '12/11', total: 18000000 },
    { name: '13/11', total: 32000000 },
    { name: '14/11', total: 28000000 },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">SAYDA ERP Dashboard</h1>
          <p className="text-sm text-gray-500">Tổng quan hệ thống quản trị</p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Tổng Doanh Thu', value: '118.000.000 đ', color: 'text-blue-600' },
          { title: 'Đơn Hàng Mới', value: '24', color: 'text-green-600' },
          { title: 'Sản Phẩm Tồn Kho', value: '1,432', color: 'text-orange-600' },
          { title: 'Khách Hàng', value: '89', color: 'text-purple-600' }
        ].map((kpi, index) => (
          <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">{kpi.title}</h3>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Doanh thu 5 ngày gần nhất</h2>
        {/* Gọi món đồ nội thất (Biểu đồ) ra đây */}
        <RevenueChart data={mockChartData} />
      </div>
    </div>
  );
}