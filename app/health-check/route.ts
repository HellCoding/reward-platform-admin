import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 기본적인 애플리케이션 상태 체크
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (err) {
    console.error('Health check failed:', err);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    );
  }
}