import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductEditorDialog from "@/components/admin/ProductEditorDialog";
import ProviderManager from "@/components/admin/ProviderManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearSession,
  loadSessionUser,
  loginWithCredentials,
  SUPER_ADMIN_ID,
  SUPER_ADMIN_PROVIDER_NAME,
  SUPER_ADMIN_PHONE,
  updateUserPassword,
  updateUserProfile,
} from "@/lib/authStorage";
import {
  createWhatsAppUrl,
  loadAnnouncement,
  loadCategories,
  loadProducts,
  saveAnnouncement,
  saveCategories,
  saveProducts,
} from "@/lib/productsStorage";
import type { Product } from "@/types/product";
import type { AppUser } from "@/types/user";

const Admin = () => {
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [announcement, setAnnouncement] = useState(() => loadAnnouncement());
  const [categories, setCategories] = useState<string[]>(() => loadCategories());
  const [newCategory, setNewCategory] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [sessionUser, setSessionUser] = useState<AppUser | null>(() => loadSessionUser());

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileLogo, setProfileLogo] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    if (!sessionUser) return;
    setProfileName(sessionUser.providerName);
    setProfilePhone(sessionUser.phone);
    setProfileLogo(sessionUser.logo || "");
  }, [sessionUser]);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveAnnouncement(announcement);
  }, [announcement]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  const isSuperAdmin = sessionUser?.id === SUPER_ADMIN_ID;

  // Filtrado de vista: Cada uno ve lo suyo, el Super Admin ve todo.
  const visibleProducts = useMemo(() => {
    if (!sessionUser) return [];
    return isSuperAdmin ? products : products.filter((product) => product.ownerId === sessionUser.id);
  }, [products, isSuperAdmin, sessionUser]);

  const totalStock = useMemo(
    () => visibleProducts.filter((product) => product.stock === "Disponible").length,
    [visibleProducts],
  );

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    const user = loginWithCredentials(username, password);
    if (!user) {
      setLoginError("Credenciales inválidas.");
      return;
    }
    setSessionUser(user);
    setLoginError("");
    setUsername("");
    setPassword("");
  };

  const handleSaveProduct = (product: Product) => {
    if (!sessionUser) return;

    // Si eres Super Admin, mantenemos los datos originales si existen.
    // Si eres Admin normal, forzamos tus datos de proveedor.
    const normalizedProduct = isSuperAdmin && product.ownerId 
      ? { ...product } 
      : {
          ...product,
          ownerId: sessionUser.id,
          ownerUsername: sessionUser.username,
          ownerName: sessionUser.providerName,
          ownerPhone: sessionUser.phone,
          ownerLogo: sessionUser.logo,
          whatsappUrl: createWhatsAppUrl(product.name, product.price, sessionUser.phone),
        };

    setProducts((prev) => {
      const exists = prev.some((item) => item.id === normalizedProduct.id);
      return exists
        ? prev.map((item) => (item.id === normalizedProduct.id ? normalizedProduct : item))
        : [normalizedProduct, ...prev];
    });
  };

  const handleDeleteProduct = (id: string) => {
    const target = products.find((product) => product.id === id);
    if (!target || !sessionUser) return;

    // PROTECCIÓN: Solo el dueño o el Super Admin pueden borrar una tarjeta específica.
    if (!isSuperAdmin && target.ownerId !== sessionUser.id) {
      alert("No tienes permiso para eliminar este servicio.");
      return;
    }

    if (confirm("¿Estás seguro de que quieres eliminar esta tarjeta?")) {
      setProducts((prev) => prev.filter((product) => product.id !== id));
      setDialogOpen(false);
      setActiveProduct(null);
    }
  };

  const handleAddCategory = () => {
    if (!isSuperAdmin) return;
    const trimmed = newCategory.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories((prev) => [...prev, trimmed]);
    setNewCategory("");
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    if (!isSuperAdmin) return;
    const remaining = categories.filter((category) => category !== categoryToDelete);
    if (!remaining.length) return;
    setCategories(remaining);
    setProducts((prev) =>
      prev.map((product) =>
        product.category === categoryToDelete ? { ...product, category: remaining[0] } : product,
      ),
    );
  };

  const handleLogout = () => {
    clearSession();
    setSessionUser(null);
    setProfileMessage("");
    setPasswordMessage("");
  };

  const handleProfileLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfileLogo(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    if (!sessionUser) return;
    const updates = isSuperAdmin
      ? { logo: profileLogo || undefined }
      : {
          providerName: profileName,
          phone: profilePhone,
          logo: profileLogo || undefined,
        };

    const updated = updateUserProfile(sessionUser.id, updates);
    if (!updated) {
      setProfileMessage("Error al actualizar perfil.");
      return;
    }

    setSessionUser(updated);
    setProducts((prev) =>
      prev.map((product) => {
        if (product.ownerId !== sessionUser.id) return product;
        const ownerName = isSuperAdmin ? SUPER_ADMIN_PROVIDER_NAME : updated.providerName;
        const ownerPhone = isSuperAdmin ? SUPER_ADMIN_PHONE : updated.phone;
        return {
          ...product,
          ownerName,
          ownerPhone,
          ownerLogo: updated.logo,
          whatsappUrl: createWhatsAppUrl(product.name, product.price, ownerPhone),
        };
      }),
    );
    setProfileMessage("Perfil actualizado correctamente.");
  };

  const handlePasswordChange = (event: FormEvent) => {
    event.preventDefault();
    if (!sessionUser) return;
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Las contraseñas no coinciden.");
      return;
    }
    const result = updateUserPassword(sessionUser.id, currentPassword, newPassword);
    if (!result.ok) {
      setPasswordMessage(result.error || "Error al actualizar.");
      return;
    }
    setPasswordMessage("Contraseña actualizada.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  if (!sessionUser) {
    return (
      <main className="relative min-h-screen bg-background px-4 py-16">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Panel Admin</p>
          <h1 className="font-display mt-2 text-3xl text-foreground">Gusstore.lat</h1>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Usuario</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tu usuario" />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {loginError && <p className="text-sm text-destructive">{loginError}</p>}
            <Button type="submit" className="w-full bg-gradient-brand shadow-neon">Entrar al panel</Button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <header className="glass-card rounded-2xl p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-primary/40 bg-card">
                {sessionUser.logo ? (
                  <img src={sessionUser.logo} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary">
                    {(sessionUser.providerName || sessionUser.username || "?").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-display text-3xl">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {visibleProducts.length} servicios · {totalStock} disponibles
              </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { setActiveProduct(null); setDialogOpen(true); }} className="bg-gradient-brand shadow-neon">
                Nuevo producto
              </Button>
              <Button variant="outline" onClick={handleLogout}>Salir</Button>
            </div>
          </div>
        </header>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Productos</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="providers">Proveedores</TabsTrigger>}
            <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {isSuperAdmin && (
              <section className="glass-card rounded-2xl p-5 space-y-4">
                <Label>Banner y Categorías Globales</Label>
                <Input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="Banner de ofertas" />
                <div className="flex gap-2">
                  <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nueva categoría" />
                  <Button onClick={handleAddCategory}>Crear</Button>
                </div>
              </section>
            )}

            <section className="grid gap-4 md:grid-cols-2">
              {visibleProducts.map((product) => (
                <article key={product.id} className="glass-card rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <img src={product.image} className="h-20 w-20 rounded-lg border object-cover" />
                    <div className="flex-1">
                      <h2 className="font-semibold">{product.name}</h2>
                      <p className="text-sm font-bold text-primary">S/ {product.price.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{product.stock} · {product.category}</p>
                      {isSuperAdmin && <p className="text-[10px] text-primary">Dueño: {product.ownerName}</p>}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => { setActiveProduct(product); setDialogOpen(true); }}>Editar</Button>
                    <Button variant="outline" onClick={() => handleDeleteProduct(product.id)}>Eliminar</Button>
                  </div>
                </article>
              ))}
            </section>
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="providers">
              <ProviderManager />
            </TabsContent>
          )}

          <TabsContent value="profile">
            <section className="glass-card rounded-2xl p-5 space-y-5">
              <h2 className="font-display text-2xl">Ajustes de Perfil</h2>
              {!isSuperAdmin && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input placeholder="Nombre Comercial" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                  <Input placeholder="WhatsApp" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-full border bg-card">
                  {profileLogo ? <img src={profileLogo} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs">Sin foto</div>}
                </div>
                <Input type="file" accept="image/*" onChange={handleProfileLogoUpload} className="max-w-xs" />
              </div>
              <Button onClick={handleSaveProfile}>Guardar Cambios</Button>

              <form onSubmit={handlePasswordChange} className="border-t pt-4 space-y-3">
                <h3 className="font-semibold">Seguridad</h3>
                <Input type="password" placeholder="Contraseña Actual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                <Input type="password" placeholder="Nueva Contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <Input type="password" placeholder="Repetir Nueva" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <Button type="submit" variant="secondary">Actualizar Contraseña</Button>
                {passwordMessage && <p className="text-xs">{passwordMessage}</p>}
              </form>
            </section>
          </TabsContent>
        </Tabs>
      </section>

      <ProductEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialProduct={activeProduct}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        categories={categories}
        currentUser={sessionUser}
      />
    </main>
  );
};

export default Admin;
