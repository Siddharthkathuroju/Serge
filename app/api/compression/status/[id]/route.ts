import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const DJANGO_URL = process.env.NEXT_PUBLIC_DJANGO_BACKEND_URL || 'http://localhost:8000';
    const imageId = params.id;

    const res = await fetch(`${DJANGO_URL}/image/compression-status/${imageId}/`);

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to get compression status');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Compression status error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get compression status' }, { status: 500 });
  }
}
