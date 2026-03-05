import { type ChangeEvent, type FormEvent, useState } from "react";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithCredentials, registerProvider } from "@/lib/authStorage";
import { compressImage } from "@/lib/compressImage";

const RegisterAdminProvider = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  // Login fields
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Register fields
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    providerName: "",
    logo: "",
  });

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = String(reader.result || "");
        const compressed = await compressImage(raw, 200, 200, 0.7);
        setForm((prev) => ({ ...prev, logo: compressed }));
      } catch {
        setForm((prev) => ({ ...prev, logo: String(reader.result || "") }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    const user = loginWithCredentials(loginUser, loginPass);
    if (!user) {
      setMessage("Credenciales inválidas.");
      return;
    }
    setMessage("Ingresando...");
    setTimeout(() => navigate("/admin"), 500);
  };

  const handleRegister = (event: FormEvent) => {
    event.preventDefault();
    const result = registerProvider(form);
    if (!result.ok) {
      setMessage(result.error || "No se pudo registrar.");
      return;
    }
    setMessage("Proveedor creado. Redirigiendo...");
    setTimeout(() => navigate("/admin"), 900);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto w-full max-w-lg rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Panel de Proveedor</p>
        <h1 className="font-display mt-2 text-3xl">
          {mode === "login" ? "Iniciar Sesión" : "Registro de Proveedor"}
        </h1>

        {/* Toggle tabs */}
        <div className="mt-4 flex rounded-lg border border-border/60 bg-background/50 p-1">
          <button
            type="button"
            onClick={() => { setMode("login"); setMessage(""); }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${
              mode === "login"
                ? "bg-primary/20 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LogIn className="h-4 w-4" />
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setMessage(""); }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${
              mode === "register"
                ? "bg-primary/20 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Registrarse
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Usuario</Label>
              <Input value={loginUser} onChange={(e) => setLoginUser(e.target.value)} placeholder="Tu usuario" />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {message && <p className="text-sm text-destructive">{message}</p>}
            <Button type="submit" className="w-full bg-gradient-brand text-primary-foreground shadow-neon">
              Iniciar Sesión
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Usuario</Label>
              <Input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Celular</Label>
              <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Nombre comercial</Label>
              <Input value={form.providerName} onChange={(e) => setForm((p) => ({ ...p, providerName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Logo (opcional)</Label>
              <Input type="file" accept="image/*" onChange={handleLogoUpload} />
              {form.logo && <img src={form.logo} alt="Logo" className="h-16 w-16 rounded-full border border-border object-cover" />}
            </div>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            <Button type="submit" className="w-full bg-gradient-brand text-primary-foreground shadow-neon">
              Registrar proveedor
            </Button>
          </form>
        )}
      </section>
    </main>
  );
};

export default RegisterAdminProvider;
