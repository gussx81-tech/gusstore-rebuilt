import { useEffect, useMemo, useState } from "react";
import HeroSection from "@/components/store/HeroSection";
import ProductCard from "@/components/store/ProductCard";
import { loadAnnouncement, loadCategories, loadProducts } from "@/lib/productsStorage";
import type { Product } from "@/types/product";

const ALL_FILTER = "Todos";

const Index = () => {
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [announcement, setAnnouncement] = useState(() => loadAnnouncement());
  const [categories, setCategories] = useState<string[]>(() => loadCategories());
  const [activeCategory, setActiveCategory] = useState(ALL_FILTER);

  useEffect(() => {
    const syncData = () => {
      setProducts(loadProducts());
      setAnnouncement(loadAnnouncement());
      setCategories(loadCategories());
    };

    window.addEventListener("storage", syncData);
    window.addEventListener("focus", syncData);

    return () => {
      window.removeEventListener("storage", syncData);
      window.removeEventListener("focus", syncData);
    };
  }, []);

  useEffect(() => {
    document.title = "Gusstore.lat | Entretenimiento sin límites";

    const description = "Streaming, recargas y suscripciones premium en Gusstore.lat. Compra rápida por WhatsApp con stock actualizado.";
    let metaDescription = document.querySelector("meta[name='description']");

    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }

    metaDescription.setAttribute("content", description);

    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }

    canonical.setAttribute("href", window.location.origin);
  }, []);

  const filteredProducts = useMemo(() => {
    if (activeCategory === ALL_FILTER) return products;
    return products.filter((product) => product.category === activeCategory);
  }, [products, activeCategory]);

  const availableProducts = useMemo(
    () => filteredProducts.filter((product) => product.stock === "Disponible").length,
    [filteredProducts],
  );

  const categoryFilters = useMemo(() => [ALL_FILTER, ...categories], [categories]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/60 bg-card/70 py-2">
        <div className="mx-auto w-full max-w-6xl px-4 text-center text-sm font-medium text-foreground sm:px-6 lg:px-10">
          {announcement}
        </div>
      </section>

      <HeroSection />

      <main id="catalogo" className="relative mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-10">
        <section className="mb-6 flex flex-wrap gap-2">
          {categoryFilters.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-all ${
                  isActive
                    ? "border-primary bg-primary/20 text-foreground shadow-neon"
                    : "border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {category}
              </button>
            );
          })}
        </section>

        <section className="mb-7 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Catálogo</p>
            <h2 className="font-display text-3xl">Servicios destacados</h2>
          </div>
          <p className="text-sm text-muted-foreground">{availableProducts} disponibles</p>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      </main>
    </div>
  );
};

export default Index;
