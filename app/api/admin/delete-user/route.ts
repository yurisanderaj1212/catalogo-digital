import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://api-service:3002';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    const token = request.headers.get('authorization') ?? '';

    const res = await fetch(`${API_URL}/auth/delete-user/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: token },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
