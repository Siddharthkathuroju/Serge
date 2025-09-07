import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const DJANGO_URL = process.env.NEXT_PUBLIC_DJANGO_BACKEND_URL || 'http://localhost:8000';
    const imageId = params.id;

    const res = await fetch(`${DJANGO_URL}/image/compress/${imageId}/`, {
      method: 'POST'
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Compression failed');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Compression error:', error);
    // Type guard for error.message
    const message = error instanceof Error ? error.message : 'Compression failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
