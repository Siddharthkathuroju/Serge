import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = params.id;
    const DJANGO_URL = process.env.NEXT_PUBLIC_DJANGO_BACKEND_URL || 'http://localhost:8000';
    
    // Forward request to Django
    const res = await fetch(`${DJANGO_URL}/image/details/${imageId}/`, {
      method: "GET",
    });

    const data = await res.json();
    console.log("Django details response:", data); // Debug log

    if (!res.ok) {
      throw new Error(data.error || "Django details fetch failed");
    }

    // Return the complete Django response
    return NextResponse.json(data);
  } catch (error) {
    console.error("Details fetch error:", error);
    const message = error instanceof Error ? error.message : 'Compression failed';
    return NextResponse.json(
      { error: message || "Details fetch failed" },
      { status: 500 }
    );
  }
} 