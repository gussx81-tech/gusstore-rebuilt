import { useEffect, useMemo, useState } from "react";
import HeroSection from "@/components/store/HeroSection";
import ProductCard from "@/components/store/ProductCard";
import { fetchProducts, loadAnnouncement, loadCategories } from "@/lib/productsStorage";
import type { Product } from "@/types/product";

const ALL_FILTER = "Todos";

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [announcement, setAnnouncement] = useState(() => loadAnnouncement());
  const [categories, setCategories] = useState<string[]>(() => loadCategories());
  const [activeCategory, setActiveCategory] = useState(ALL_FILTER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
      setLoading(false);
    };
    load();

    const syncLocal = () => {
      setAnnouncement(loadAnnouncement());
      setCategories(loadCategories());
    };

    window.addEventListener("storage", syncLocal);
    window.addEventListener("focus", () => {
      syncLocal();
      load();
    });

    return () => {
      window.removeEventListener("storage", syncLocal);
      window.removeEventListener("focus", syncLocal);
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-6xl">📭</div>
            <h3 className="font-display text-2xl text-foreground">AÚN NO HAY NADA AQUÍ</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Los productos aparecerán cuando el administrador los publique.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        )}
      </main>

      <footer className="border-t border-border/40 bg-card/30 backdrop-blur-sm py-6">
        <div className="mx-auto flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium tracking-widest uppercase">Gusstore.lat</span>
          <span className="text-border">|</span>
          <a
            href="https://t.me/Gusstream"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            @Gusstream
          </a>
          <span className="text-border">-</span>
          <span>Único Desarrollador</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
