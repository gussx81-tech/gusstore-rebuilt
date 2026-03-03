import heroImage from "@/assets/cineplus.jpg";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <header className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Banner de entretenimiento premium" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
      </div>

      <div className="hero-aurora relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 lg:px-10">
        <p className="mb-4 text-sm uppercase tracking-[0.28em] text-muted-foreground">Gusstore.lat · Tienda Digital</p>
        <h1 className="font-display neon-title text-4xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl">
          ENTRETENIMIENTO
          <br />
          SIN LÍMITES
        </h1>
        <p className="mt-6 max-w-xl text-sm text-foreground/90 sm:text-base">
          Streaming, recargas y suscripciones con entrega rápida. Compra en segundos y activa tu servicio al instante.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="bg-gradient-brand text-primary-foreground shadow-neon transition-transform hover:scale-[1.03]">
            <a href="#catalogo">Ver catálogo</a>
          </Button>
          <Button asChild variant="outline" className="border-primary/40 bg-card/30 backdrop-blur-md hover:bg-card/60">
            <a href="https://codesperu.lat/pay?item=Consulta%20Gusstore" target="_blank" rel="noreferrer">
              Atención directa
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default HeroSection;
