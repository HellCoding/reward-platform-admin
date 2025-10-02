import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 이미지 최적화를 위한 standalone 출력 모드
  output: 'standalone',
  
  // 환경별 설정
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // 프로덕션 빌드 최적화
  poweredByHeader: false,
  reactStrictMode: true,
  
  // 실험적 기능 (필요시)
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog']
  }
};

export default nextConfig;
