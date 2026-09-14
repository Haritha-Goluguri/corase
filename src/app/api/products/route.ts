import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Product from "@/models/Product";

// Force dynamic so query params (e.g. ?featured=true) always work correctly
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured");

    const query: Record<string, unknown> = {};
    if (featured === "true") {
      query.isFeatured = true;
    }

    // Lean projection — only fetch fields the client needs
    const rawProducts = await Product.find(query)
      .sort({ createdAt: -1 })
      .select("id title price description images category variants isNewDrop isFeatured status")
      .lean();

    const products = (rawProducts as any[]).map((p) => ({
      id: p.id,
      name: p.title,
      price: p.price,
      description: p.description,
      images: p.images || [],
      image: p.images?.[0] || "",
      category: p.category || "Tshirts",
      variants: p.variants || [],
      sizes: (p.variants || []).map((v: any) => v.size),
      isNewDrop: p.isNewDrop,
      isFeatured: p.isFeatured,
      status: p.status || "none",
      color: "#ffffff",
    }));

    return NextResponse.json(products, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
