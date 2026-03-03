import { type ChangeEvent, type FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerProvider } from "@/lib/authStorage";

const RegisterAdminProvider = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    providerName: "",
    logo: "",
  });

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, logo: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = registerProvider(form);

    if (!result.ok) {
      setMessage(result.error || "No se pudo registrar el proveedor.");
      return;
    }

    setMessage("Proveedor creado correctamente. Redirigiendo a /admin...");
    setTimeout(() => navigate("/admin"), 900);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto w-full max-w-lg rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Ruta secreta</p>
        <h1 className="font-display mt-2 text-3xl">Registro de Proveedor</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider-user">Usuario</Label>
            <Input id="provider-user" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider-email">Email</Label>
            <Input id="provider-email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider-password">Contraseña</Label>
            <div className="relative">
              <Input
                id="provider-password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider-phone">Celular del proveedor</Label>
            <Input id="provider-phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider-name">Nombre del proveedor</Label>
            <Input id="provider-name" value={form.providerName} onChange={(e) => setForm((p) => ({ ...p, providerName: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider-logo">Logo del proveedor</Label>
            <Input id="provider-logo" type="file" accept="image/*" onChange={handleLogoUpload} />
            {form.logo && <img src={form.logo} alt="Logo de proveedor" className="h-16 w-16 rounded-full border border-border object-cover" />}
          </div>

          {message && <p className="text-sm text-muted-foreground">{message}</p>}

          <Button type="submit" className="w-full bg-gradient-brand text-primary-foreground shadow-neon">
            Registrar proveedor
          </Button>
        </form>
      </section>
    </main>
  );
};

export default RegisterAdminProvider;
