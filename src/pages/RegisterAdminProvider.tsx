import { type ChangeEvent, type FormEvent, useCallback, useState } from "react";
import { Eye, EyeOff, Upload, User, CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { loginWithCredentials, registerProvider, SUPER_ADMIN_ID } from "@/lib/authStorage";
import { compressImage } from "@/lib/compressImage";

type Mode = "login" | "register";

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const validateImageFile = (file: File): string | null => {
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    return "Solo se permiten imágenes JPG, PNG o WEBP.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "La imagen no debe superar 5MB.";
  }
  return null;
};

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Error al leer el archivo."));
    reader.readAsDataURL(file);
  });

interface FieldErrors {
  username?: string;
  email?: string;
  password?: string;
  phone?: string;
  providerName?: string;
  profilePhoto?: string;
  cardPhoto?: string;
}

const RegisterAdminProvider = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login fields
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Register fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [providerName, setProviderName] = useState("");

  // Separate image states
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [profilePhotoBase64, setProfilePhotoBase64] = useState("");
  const [cardPhotoPreview, setCardPhotoPreview] = useState("");
  const [cardPhotoBase64, setCardPhotoBase64] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // ── Login handler ──
  const handleLogin = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      setLoginError("");

      if (!loginUsername.trim() || !loginPassword) {
        setLoginError("Completa usuario y contraseña.");
        return;
      }

      const user = loginWithCredentials(loginUsername, loginPassword);
      if (!user || user.id !== SUPER_ADMIN_ID) {
        setLoginError("Acceso restringido. Solo el administrador principal puede ingresar.");
        return;
      }

      setMode("register");
      toast({
        title: "Bienvenido, Admin",
        description: "Ahora puedes registrar un nuevo proveedor.",
      });
    },
    [loginUsername, loginPassword],
  );

  // ── Image handlers (strictly separated) ──
  const handleProfilePhoto = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, profilePhoto: error }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, profilePhoto: undefined }));

    try {
      const raw = await readFileAsBase64(file);
      const compressed = await compressImage(raw, 200, 200, 0.8);
      setProfilePhotoPreview(compressed);
      setProfilePhotoBase64(compressed);
    } catch {
      setFieldErrors((prev) => ({ ...prev, profilePhoto: "Error al procesar la imagen." }));
    }
  }, []);

  const handleCardPhoto = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, cardPhoto: error }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, cardPhoto: undefined }));

    try {
      const raw = await readFileAsBase64(file);
      const compressed = await compressImage(raw, 400, 250, 0.75);
      setCardPhotoPreview(compressed);
      setCardPhotoBase64(compressed);
    } catch {
      setFieldErrors((prev) => ({ ...prev, cardPhoto: "Error al procesar la imagen." }));
    }
  }, []);

  // ── Form validation ──
  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    if (!username.trim()) errors.username = "El usuario es obligatorio.";
    if (!email.trim()) errors.email = "El correo es obligatorio.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Correo inválido.";
    if (!password) errors.password = "La contraseña es obligatoria.";
    else if (password.length < 6) errors.password = "Mínimo 6 caracteres.";
    if (!phone.trim()) errors.phone = "El teléfono es obligatorio.";
    if (!providerName.trim()) errors.providerName = "El nombre del negocio es obligatorio.";
    if (!profilePhotoBase64) errors.profilePhoto = "La foto de perfil es obligatoria.";
    if (!cardPhotoBase64) errors.cardPhoto = "La foto de tarjeta es obligatoria.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Register handler ──
  const handleRegister = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      setIsLoading(true);

      // Small delay to show loading state
      await new Promise((r) => setTimeout(r, 300));

      const result = registerProvider({
        username: username.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        providerName: providerName.trim(),
        logo: profilePhotoBase64,
      });

      setIsLoading(false);

      if (!result.ok) {
        toast({
          title: "Error al registrar",
          description: result.error || "Ocurrió un error inesperado.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "¡Proveedor registrado!",
        description: `${providerName.trim()} fue registrado exitosamente.`,
      });

      // Reset form
      setUsername("");
      setEmail("");
      setPassword("");
      setPhone("");
      setProviderName("");
      setProfilePhotoPreview("");
      setProfilePhotoBase64("");
      setCardPhotoPreview("");
      setCardPhotoBase64("");
      setFieldErrors({});
    },
    [username, email, password, phone, providerName, profilePhotoBase64, cardPhotoBase64],
  );

  // ── Error helper ──
  const FieldError = ({ message }: { message?: string }) =>
    message ? <p className="mt-1 text-xs text-destructive">{message}</p> : null;

  // ═══════════ LOGIN VIEW ═══════════
  if (mode === "login") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16 text-foreground">
        <section className="w-full max-w-md rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Acceso restringido
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Panel de Registro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Solo el administrador principal puede registrar proveedores.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-user">Usuario</Label>
              <Input
                id="login-user"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Tu usuario"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-pass">Contraseña</Label>
              <div className="relative">
                <Input
                  id="login-pass"
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {loginError && <p className="text-sm text-destructive">{loginError}</p>}
            <Button
              type="submit"
              className="w-full bg-gradient-brand text-primary-foreground shadow-neon"
            >
              Acceder
            </Button>
          </form>
        </section>
      </main>
    );
  }

  // ═══════════ REGISTER VIEW ═══════════
  return (
    <main className="flex min-h-screen items-start justify-center bg-background px-4 py-10 text-foreground sm:py-16">
      <section className="w-full max-w-lg rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-xl sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Nuevo proveedor
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Registro</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="text-muted-foreground hover:text-foreground"
          >
            Ir al panel
          </Button>
        </div>

        <form onSubmit={handleRegister} className="mt-6 space-y-5">
          {/* ── Profile Photo ── */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Foto de Perfil <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-border">
                {profilePhotoPreview ? (
                  <AvatarImage src={profilePhotoPreview} alt="Foto de perfil" />
                ) : (
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                )}
              </Avatar>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                <Upload className="h-4 w-4" />
                Subir foto
                <input
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES}
                  onChange={handleProfilePhoto}
                  className="hidden"
                />
              </label>
            </div>
            <FieldError message={fieldErrors.profilePhoto} />
          </div>

          {/* ── Card / Document Photo ── */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-accent" />
              Foto de Tarjeta / Documento <span className="text-destructive">*</span>
            </Label>
            {cardPhotoPreview ? (
              <div className="relative overflow-hidden rounded-lg border border-border">
                <img
                  src={cardPhotoPreview}
                  alt="Foto de tarjeta"
                  className="h-36 w-full object-cover sm:h-44"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCardPhotoPreview("");
                    setCardPhotoBase64("");
                  }}
                  className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-1 text-xs text-destructive backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-foreground">
                <Upload className="h-6 w-6" />
                <span>Subir foto de tarjeta</span>
                <span className="text-xs">JPG, PNG o WEBP (máx. 5MB)</span>
                <input
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES}
                  onChange={handleCardPhoto}
                  className="hidden"
                />
              </label>
            )}
            <FieldError message={fieldErrors.cardPhoto} />
          </div>

          {/* ── Text Fields ── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-user">
                Usuario <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reg-user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: proveedor01"
                autoComplete="username"
              />
              <FieldError message={fieldErrors.username} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-email">
                Correo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
              />
              <FieldError message={fieldErrors.email} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-pass">
              Contraseña <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="reg-pass"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="pr-11"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute inset-y-0 right-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError message={fieldErrors.password} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-phone">
                Teléfono <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="51928862832"
                autoComplete="tel"
              />
              <FieldError message={fieldErrors.phone} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-biz">
                Nombre del Negocio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reg-biz"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="Mi Tienda"
              />
              <FieldError message={fieldErrors.providerName} />
            </div>
          </div>

          {/* ── Submit ── */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-brand text-primary-foreground shadow-neon"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Registrar Proveedor
              </>
            )}
          </Button>
        </form>
      </section>
    </main>
  );
};

export default RegisterAdminProvider;
