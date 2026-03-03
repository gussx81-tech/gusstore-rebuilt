import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createWhatsAppUrl } from "@/lib/productsStorage";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const stockClasses =
    product.stock === "Disponible"
      ? "border-success/40 bg-success/20 text-success"
      : "border-destructive/40 bg-destructive/20 text-destructive";

  const isSuperAdminProduct = product.ownerUsername === "Guss81";

  return (
    <article className="glass-card group overflow-hidden rounded-2xl p-2 transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden rounded-xl">
        <img
          src={product.image}
          alt={`Servicio ${product.name}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="space-y-2 p-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{product.name}</h3>
          <span className={`rounded-full border px-2 py-1 text-[10px] font-medium ${stockClasses}`}>{product.stock}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{isSuperAdminProduct ? "Gusstore" : product.ownerName}</span>
          {isSuperAdminProduct && <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-label="Proveedor verificado" />}
        </div>

        <p className="text-base font-bold text-primary">S/ {product.price.toFixed(2)}</p>

        <Button asChild className="w-full bg-gradient-brand text-primary-foreground shadow-neon transition-transform hover:scale-[1.02]">
          <a href={createWhatsAppUrl(product.name, product.price, product.ownerPhone)} target="_blank" rel="noreferrer">
            Pedir por WhatsApp
          </a>
        </Button>
      </div>
    </article>
  );
};

export default ProductCard;
