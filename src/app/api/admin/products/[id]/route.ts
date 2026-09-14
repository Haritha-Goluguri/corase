import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Product from "@/models/Product";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();
    
    // Map frontend fields to DB fields
    const updateData: any = { ...body };
    if (body.name) updateData.title = body.name;
    if (body.images) {
      updateData.images = body.images;
    } else if (body.image) {
      updateData.images = [body.image];
    }
    
    // Remove frontend-only fields
    delete updateData.name;
    delete updateData.image;
    
    const filter = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ id }, { _id: id }] } : { id };
    const product = await Product.findOneAndUpdate(filter, updateData, { new: true });
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error("Patch error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const filter = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ id }, { _id: id }] } : { id };
    const product = await Product.findOneAndDelete(filter);
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
