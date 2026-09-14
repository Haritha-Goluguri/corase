import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongoose";
import Product from "@/models/Product";
import ProductClient from "@/components/products/ProductClient";
import mongoose from "mongoose";

interface Props {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
  try {
    await connectToDatabase();
    const isValidMongoId = mongoose.Types.ObjectId.isValid(id);
    const rawProduct = await Product.findOne(
      isValidMongoId ? { $or: [{ id }, { _id: id }] } : { id }
    ).lean();
    
    if (!rawProduct) return null;

    const images = (rawProduct as any).images || [];
    const variants = rawProduct.variants || [];

    // Map to the format used in the frontend
    return {
      id: rawProduct.id || (rawProduct as any)._id?.toString(),
      name: (rawProduct as any).title,
      price: rawProduct.price,
      description: rawProduct.description,
      images: images,
      image: images[0] || "/placeholder.jpg",
      category: rawProduct.category || "Tshirts",
      variants: variants,
      sizes: variants.map((v: any) => v.size),
      isNewDrop: rawProduct.isNewDrop,
      isFeatured: rawProduct.isFeatured,
      color: "#ffffff",
    };
  } catch (error) {
    console.error("Error fetching product for metadata:", error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product Not Found | CORASE",
    };
  }

  const title = `${product.name} | CORASE Streetwear`;
  const description = `${product.description.slice(0, 160)}... Buy ${product.name} for ₹${product.price} at CORASE.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: product.image,
          width: 800,
          height: 1000,
          alt: product.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.image],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image,
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": "CORASE"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://corase.in/product/${id}`,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClient productId={id} initialProduct={product} />
    </>
  );
}
