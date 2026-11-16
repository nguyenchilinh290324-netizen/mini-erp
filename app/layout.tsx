import './globals.css';
import GlobalToolbar from '@/app/components/GlobalToolbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <GlobalToolbar />
        {children}
      </body>
    </html>
  );
}