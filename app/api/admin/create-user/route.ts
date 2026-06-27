import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://api-service:3002';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization') ?? '';

    const res = await fetch(`${API_URL}/auth/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
