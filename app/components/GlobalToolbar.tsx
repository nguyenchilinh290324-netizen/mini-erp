'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Bộ từ điển chuyên ngành ERP Việt <-> Trung tự động quét trên mọi trang
const DICTIONARY: Record<string, string> = {
  'HỆ THỐNG QUẢN TRỊ KMĐ ERP (金明台 ERP)': '金明台 ERP 综合管理系统',
  'Trung tâm điều hành tổng hợp: Kho vận, Mua hàng, Bán hàng & Công nợ': '综合运营中心：仓储、采购、销售与账款管理',
  'Đăng xuất': '退出登录',
  '🧭 DANH MỤC TẤT CẢ PHÂN HỆ (Chọn để truy cập nhanh)': '🧭 系统功能模块导航 (点击快速访问)',
  '📦 Quản lý Sản phẩm': '📦 产品管理',
  'Danh mục, giá vốn, giá bán': '产品目录、成本价、销售价',
  '🏭 Quản lý Kho hàng': '🏭 仓库管理',
  'Tồn kho & Xuất nhập tồn': '实时库存与出入库汇总',
  '🔄 Lịch sử Giao dịch Kho': '🔄 库存交易记录',
  'Thẻ kho & Kiểm kê': '库存卡与盘点记录',
  '🛒 Đơn Bán hàng (Sales)': '🛒 销售订单 (Sales)',
  'Tạo đơn & Xuất hàng': '创建销售单与出库',
  '📥 Đơn Mua hàng (PO)': '📥 采购订单 (PO)',
  'Nhập hàng từ NCC': '供应商采购入库',
  '👥 Khách hàng': '👥 客户管理',
  'Thông tin & lịch sử mua': '客户资料与交易历史',
  '🤝 Nhà cung cấp & Đối tác': '🤝 供应商与合作伙伴',
  'Danh bạ nhà cung ứng': '供应商名录管理',
  '💰 Quản lý Công nợ': '💰 应收应付账款 (AR/AP)',
  'Phải thu (AR) & Phải trả (AP)': '客户应收与供应商应付',
  '🚚 Vận chuyển & Giao nhận': '🚚 物流与配送管理',
  'Theo dõi lộ trình đơn': '订单配送状态追踪',
  '📊 Báo cáo Thống kê': '📊 统计报表中心',
  'Lợi nhuận & Doanh số': '利润分析与销售统计',
  'DOANH THU THỰC TẾ (ĐÃ GIAO)': '实际营业收入 (已交付)',
  'ĐƠN HÀNG MỚI (THÁNG NÀY)': '本月新增订单',
  'CÔNG NỢ PHẢI THU (KHÁCH NỢ)': '应收账款总额 (客户欠款)',
  '📋 DANH SÁCH SẢN PHẨM & TỒN KHO TRỰC TIẾP': '📋 实时产品目录与库存清单',
  '+ Thêm / Chỉnh sửa Sản phẩm →': '+ 新增 / 编辑产品 →',
  'Mã SKU': 'SKU 编码',
  'Tên sản phẩm': '产品名称',
  'ĐVT': '单位',
  'Giá vốn': '成本价',
  'Giá bán': '销售价',
  'Tồn kho': '当前库存',
  '📈 BIỂU ĐỒ DOANH THU 7 NGÀY GẦN NHẤT': '📈 最近 7 天营业额趋势图',
  'Chưa có dữ liệu giao dịch': '暂无交易数据',
  'Cái': '个',
  'Cuộn': '卷',
  'Bộ': '套',
  'Chiếc': '件',
  'Thùng': '箱',
  'Hộp': '盒',
  'Đôi': '双',
  'Kg': '公斤',
  'Mét': '米',
  'Tấm': '张',
  // Trang Quản lý Danh mục Hàng hoá & Modal
  'Quản lý Danh mục Hàng hoá': '商品目录管理',
  '+ Thêm Sản Phẩm Mới': '+ 新增产品',
  '📥 Nhập từ File Excel': '📥 从 Excel 导入',
  '⏳ Đang tải lên Neon...': '⏳ 正在上传至数据库...',
  '📤 Xuất File Excel Mẫu': '📤 导出 Excel 模板',
  'Tên Hàng Hoá': '产品名称',
  'Tên Tiếng Trung': '中文名称',
  'Quy Cách': '规格型号',
  'Giá Vốn': '成本价',
  'Giá Bán': '销售价',
  'Tồn Kho': '当前库存',
  'Hành Động': '操作',
  'Sửa': '编辑',
  'Xoá': '删除',
  'Đang tải dữ liệu...': '正在加载数据...',
  'Không tìm thấy sản phẩm nào.': '未找到相关产品。',
  'Thêm Sản phẩm Mới': '新增产品',
  'Chỉnh sửa Sản phẩm': '编辑产品',
  'Mã SKU *': 'SKU 编码 *',
  'Đơn vị tính (ĐVT)': '计量单位 (单位)',
  'Tên Hàng Hoá (Tiếng Việt) *': '产品名称 (越南语) *',
  'Tên Tiếng Trung (中文名称)': '中文名称',
  'Quy Cách (规格型号)': '规格型号',
  'Giá Vốn (VNĐ)': '成本价 (VNĐ)',
  'Giá Bán (VNĐ)': '销售价 (VNĐ)',
  'Danh Mục': '产品分类',
  'Hình ảnh sản phẩm (Tải lên Cloudflare R2)': '产品图片 (上传至 Cloudflare R2)',
  'Đang tải ảnh lên R2...': '正在上传图片至 R2...',
  'Huỷ': '取消',
  'Lưu Sản Phẩm': '保存产品',
  '🏭 Quản lý Tồn Kho (Kho tổng)': '🏭 总库存管理',
  'Theo dõi số lượng hàng hoá và giá trị lưu kho thực tế': '实时监控实际库存数量与库存价值',
  '🔄 Xem Thẻ Kho / Lịch sử Xuất Nhập': '🔄 查看库存卡 / 出入库记录',
  'TỔNG MÃ HÀNG (SKU)': '商品总数 (SKU)',
  'TỔNG SỐ LƯỢNG TỒN': '库存总件数',
  'TỔNG GIÁ TRỊ KHO (Theo giá vốn)': '库存总价值 (按成本价)',
  'CẢNH BÁO SẮP HẾT HÀNG (≤10)': '库存预警 (≤10件)',
  'mã': '个编码',
  'sp': '件',
  'mã cần nhập': '个需采购',
  'Chi tiết tồn kho hiện tại': '当前库存明细',
  'Tra cứu nhanh SKU, tên hàng...': '快速检索 SKU、商品名称...',
  'Tên Sản Phẩm (Việt/Trung)': '产品名称 (越/中)',
  'Đơn Giá Vốn': '成本单价',
  'Tồn Hiện Tại': '当前库存',
  'Tổng Trị Giá (VND)': '总价值 (越南盾)',
  'Đang tải dữ liệu kho...': '正在加载库存数据...',
  'Kho chưa có sản phẩm nào.': '仓库暂无任何商品。',
  '🚚 Theo dõi Vận chuyển & Giao nhận': '🚚 物流与配送管理',
  'Mã Vận Đơn': '运单号',
  'Đơn Hàng (Ref)': '关联订单',
  'Khách Nhận': '收货客户',
  'Đơn Vị & Tài Xế': '承运方与司机',
  'Phí Ship (VND)': '运费 (VND)',
  'Trạng Thái': '状态',
  '⏳ CHỜ LẤY HÀNG': '⏳ 待取件',
  '🚚 ĐANG GIAO': '🚚 配送中',
  '✅ ĐÃ GIAO XONG': '✅ 已送达',
  'Giao Tài Xế': '分配司机',
  'Xác Nhận Đã Giao': '确认送达',
  '📊 Báo cáo Thống kê & Phân tích': '📊 统计报表与数据分析',
  'Theo dõi kết quả kinh doanh, lợi nhuận và doanh số bán hàng': '监控经营业绩、利润与销售额',
  'TỔNG DOANH THU': '总营业额',
  'TỔNG GIÁ VỐN & CHI PHÍ': '总成本与费用',
  'LỢI NHUẬN GỘP (KÊNH BÁN)': '销售毛利',
  'BIÊN LỢI NHUẬN / TỔNG ĐƠN': '毛利率 / 总订单数',
  'đơn': '单',
  '📈 Biểu đồ Doanh thu (7 ngày gần nhất)': '📈 营业额趋势图 (最近7天)',
  'Doanh thu': '营业额',
  '🏆 Top 5 Sản phẩm Bán chạy': '🏆 畅销产品 Top 5排行榜',
  'đã bán': '已售',
  'Đang tổng hợp dữ liệu báo cáo...': '正在汇总报表数据...',
  'Chưa có đơn hàng nào hoàn thành.': '暂无已完成的订单。',
  'Phân Loại': '行业分类',
  'Phân loại / Ngành nghề': '供应商分类 / 行业',
  'Tìm theo Mã NCC, Tên công ty, Phân loại, SĐT...': '按供应商编号、公司名称、分类、电话搜索...',
  '🛒 Quản lý Đơn Mua Hàng (PO)': '🛒 采购订单管理 (PO)',
  'Quản lý mua hàng, theo dõi báo giá và duyệt nhập kho': '管理采购，追踪报价及审批入库',
  '+ Tạo Đơn PO Mới': '+ 创建新采购单',
  'Tra cứu Mã PO, Tên Nhà cung cấp...': '按采购单号、供应商名称搜索...',
  'Mã Đơn PO': '采购单号',
  'Ngày Lập Đơn': '制单日期',
  'Tổng Tiền (VND)': '总金额 (VND)',
  'Thao Tác': '操作',
  'Đang tải danh sách Đơn hàng...': '正在加载订单列表...',
  'Chưa có Đơn mua hàng nào.': '暂无采购订单。',
  'Xem chi tiết': '查看详情',
  'Chi tiết Đơn PO:': '采购订单详情:',
  'Liên hệ:': '联系人:',
  'Ngày lập:': '制单日期:',
  'Trạng thái hiện tại:': '当前状态:',
  'Danh sách Sản phẩm': '产品列表',
  'Tên Sản phẩm': '产品名称',
  'SL': '数量',
  'Đơn giá': '单价',
  'Thành tiền': '金额',
  'Cộng tiền hàng:': '货款合计:',
  'Thuế GTGT': '增值税',
  'Tổng cộng:': '总计:',
  'Đóng': '关闭',
  'Duyệt Đơn (Approve)': '审批通过 (Approve)',
  '⏳ CHỜ DUYỆT': '⏳ 待审批',
  '📝 ĐÃ DUYỆT / CHỜ NHẬP': '📝 已审批 / 待入库',
  '✅ ĐÃ NHẬP KHO': '✅ 已入库',
  '❌ ĐÃ HUỶ': '❌ 已取消',
};

const PLACEHOLDER_DICT: Record<string, string> = {
  'Tìm theo SKU, Tên Việt, Tên Trung, Quy cách...': '按 SKU、越文名、中文名、规格搜索...',
  'Tìm kiếm theo SKU hoặc Tên...': '按 SKU 或名称搜索...',
};

export default function GlobalToolbar() {
  const pathname = usePathname();
  const [lang, setLang] = useState<'vi' | 'zh'>('vi');

  useEffect(() => {
    const saved = localStorage.getItem('kmd_erp_lang') as 'vi' | 'zh';
    if (saved === 'zh' || saved === 'vi') {
      setLang(saved);
    }
  }, []);

  useEffect(() => {
    const translatePage = () => {
      // 1. Dịch toàn bộ văn bản hiển thị
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const parentTag = node.parentElement?.tagName;
        if (parentTag === 'SCRIPT' || parentTag === 'STYLE' || node.parentElement?.closest('.no-translate')) {
          continue;
        }
        const text = node.nodeValue?.trim();
        if (!text) continue;

        if (lang === 'zh') {
          if (DICTIONARY[text]) {
            (node as any)._originalVi = text;
            node.nodeValue = node.nodeValue!.replace(text, DICTIONARY[text]);
          } else if (text.endsWith(' đơn')) {
            (node as any)._originalVi = text;
            node.nodeValue = text.replace(' đơn', ' 单');
          }
        } else if (lang === 'vi') {
          if ((node as any)._originalVi) {
            node.nodeValue = (node as any)._originalVi;
          } else {
            const viKey = Object.keys(DICTIONARY).find(key => DICTIONARY[key] === text);
            if (viKey) {
              node.nodeValue = node.nodeValue!.replace(text, viKey);
            } else if (text.endsWith(' 单')) {
              node.nodeValue = text.replace(' 单', ' đơn');
            }
          }
        }
      }

      // 2. Dịch luôn chữ gợi ý trong các ô tìm kiếm (input placeholder)
      const inputs = document.querySelectorAll('input[placeholder]');
      inputs.forEach((el) => {
        const input = el as HTMLInputElement;
        const ph = input.placeholder?.trim();
        if (!ph) return;
        if (lang === 'zh' && PLACEHOLDER_DICT[ph]) {
          (input as any)._originalPh = ph;
          input.placeholder = PLACEHOLDER_DICT[ph];
        } else if (lang === 'vi') {
          if ((input as any)._originalPh) {
            input.placeholder = (input as any)._originalPh;
          } else {
            const viPh = Object.keys(PLACEHOLDER_DICT).find(k => PLACEHOLDER_DICT[k] === ph);
            if (viPh) input.placeholder = viPh;
          }
        }
      });
    };

    const timer = setTimeout(translatePage, 80);

    // Tự động dịch ngay khi dữ liệu từ Neon DB tải xong hoặc khi mở Popup
    const observer = new MutationObserver(() => {
      if (lang === 'zh') translatePage();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [lang, pathname]);

  const switchLanguage = (newLang: 'vi' | 'zh') => {
    setLang(newLang);
    localStorage.setItem('kmd_erp_lang', newLang);
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (pathname === '/login') return null;

  return (
    <div
      className="no-print no-translate"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        backgroundColor: '#0d56a6',
        color: '#ffffff',
        padding: '10px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontFamily: 'Segoe UI, Arial, sans-serif'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link
          href="/"
          style={{
            color: '#ffffff',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            padding: '6px 12px',
            borderRadius: '6px'
          }}
        >
          🏠 {lang === 'zh' ? '返回首页 (Trang chủ)' : 'Trang chủ KMĐ ERP'}
        </Link>
        <span style={{ fontSize: '13px', opacity: 0.85 }}>
          {lang === 'zh' ? '金明台越南科技有限公司' : 'CÔNG TY TNHH CÔNG NGHỆ KIM MINH ĐÀI VIỆT NAM'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            backgroundColor: 'rgba(0,0,0,0.2)',
            padding: '3px',
            borderRadius: '6px'
          }}
        >
          <button
            type="button"
            onClick={() => switchLanguage('vi')}
            style={{
              padding: '5px 10px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: lang === 'vi' ? '#ffffff' : 'transparent',
              color: lang === 'vi' ? '#0d56a6' : '#ffffff'
            }}
          >
            🇻🇳 Tiếng Việt
          </button>
          <button
            type="button"
            onClick={() => switchLanguage('zh')}
            style={{
              padding: '5px 10px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: lang === 'zh' ? '#ffffff' : 'transparent',
              color: lang === 'zh' ? '#0d56a6' : '#ffffff'
            }}
          >
            🇨🇳 中文 (Tiếng Trung)
          </button>
        </div>

        <button
          type="button"
          onClick={handleExportPDF}
          style={{
            backgroundColor: '#e5a000',
            color: '#ffffff',
            border: 'none',
            padding: '7px 14px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          📄 {lang === 'zh' ? '导出 PDF / 打印' : 'Xuất PDF / In trang này'}
        </button>
      </div>
    </div>
  );
}