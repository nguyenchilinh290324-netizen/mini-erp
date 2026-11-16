import './globals.css'; // Dòng này cực kỳ quan trọng để load giao diện Tailwind

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  ); 
}