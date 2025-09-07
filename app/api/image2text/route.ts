import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const image = formData.get('image');
  if (!image) {
    return NextResponse.json({ success: false, error: 'No image uploaded' }, { status: 400 });
  }

  // Forward to Django backend
  const DJANGO_URL = process.env.NEXT_PUBLIC_DJANGO_BACKEND_URL || 'http://localhost:8000';
  const backendRes = await fetch(`${DJANGO_URL}/image/image2text/`, {
    method: 'POST',
    body: formData,
  });

  let data;
  try {
    data = await backendRes.json();
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Invalid response from backend' }, { status: 500 });
  }

  return NextResponse.json(data, { status: backendRes.status });
}
