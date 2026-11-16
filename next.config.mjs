/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tắt kiểm tra lỗi TypeScript khi đẩy lên Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  // Tắt kiểm tra lỗi ESLint khi đẩy lên Vercel
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;