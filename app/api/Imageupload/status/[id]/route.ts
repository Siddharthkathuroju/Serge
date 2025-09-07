import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = params.id;
    const DJANGO_URL = process.env.NEXT_PUBLIC_DJANGO_BACKEND_URL || 'http://localhost:8000';
    
    // Forward request to Django
    const res = await fetch(`${DJANGO_URL}/image/status/${imageId}/`, {
      method: "GET",
    });

    const data = await res.json();
    console.log("Django status response:", data); // Debug log

    if (!res.ok) {
      throw new Error(data.error || "Django status check failed");
    }

    // Return the complete Django response
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: error.message || "Status check failed" },
      { status: 500 }
    );
  }
} 