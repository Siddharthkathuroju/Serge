import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const DJANGO_URL = process.env.NEXT_PUBLIC_DJANGO_BACKEND_URL || 'http://localhost:8000';
    // Get the form data from the request
    const formData = await req.formData();
    
    // Forward request to Django with the same form data
    const res = await fetch(`${DJANGO_URL}/image/upload/`, {
      method: "POST",
      body: formData, // Pass the form data directly
    });

    const data = await res.json();
    console.log("Django response:", data); // Debug log

    if (!res.ok) {
      throw new Error(data.error || "Django upload failed");
    }

    // Return the complete Django response
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
