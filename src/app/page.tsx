import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-28 text-center">
      <h1 className="from-brand-silver to-brand-silver-2 bg-linear-to-r bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
        NurvexThink
      </h1>
      <p className="text-brand-muted mt-6 max-w-2xl text-lg">
        Software, built and published. Explore our products, read the blog, or request custom
        software on demand.
      </p>
      <div className="mt-10 flex gap-4">
        <Link href="/products" className={buttonVariants({ size: "lg" })}>
          Explore products
        </Link>
        <Link href="/order" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Request custom software
        </Link>
      </div>
      {/* 3D metallic "NT" hero is added in the 3D milestone plan */}
    </section>
  );
}
