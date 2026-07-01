import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "../actions";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/products"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Products
      </Link>
      <h1 className="font-heading text-2xl font-bold tracking-tight">New product</h1>
      <ProductForm action={createProduct} submitLabel="Create product" />
    </div>
  );
}
