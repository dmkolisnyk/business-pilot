import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth/cookies';

export async function POST(): Promise<NextResponse> {
  const response = new NextResponse(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store',
    },
  });

  return clearAuthCookie(response);
}

