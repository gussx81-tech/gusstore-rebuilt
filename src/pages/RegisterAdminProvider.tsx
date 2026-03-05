import { type FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithCredentials, SUPER_ADMIN_ID } from "@/lib/authStorage";

const RegisterAdminProvider = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    const user = loginWithCredentials(username, password);

    if (!user || user.id !== SUPER_ADMIN_ID) {
      setError("Acceso restringido. Solo el administrador principal puede ingresar.");
      return;
    }

    setError("");
    navigate("/admin");
  };

  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Acceso restringido</p>
        <h1 className="font-display mt-2 text-3xl">Panel Admin</h1>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Usuario</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tu usuario" />
          </div>
          <div className="space-y-2">
            <Label>Contraseña</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full bg-gradient-brand text-primary-foreground shadow-neon">
            Entrar al panel
          </Button>
        </form>
      </section>
    </main>
  );
};

export default RegisterAdminProvider;
