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
  'Kg': '公斤'
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
    };

    const timer = setTimeout(translatePage, 80);
    return () => clearTimeout(timer);
  }, [lang, pathname]);

  const switchLanguage = (newLang: 'vi' | 'zh') => {
    setLang(newLang);
    localStorage.setItem('kmd_erp_lang', newLang);
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Không hiện thanh công cụ này ở màn hình login (vì màn hình login đã có nút riêng)
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
      {/* Nút quay về Trang chủ từ bất kỳ trang con nào */}
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

      {/* Cụm nút Ngôn ngữ Việt/Trung & Xuất PDF */}
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