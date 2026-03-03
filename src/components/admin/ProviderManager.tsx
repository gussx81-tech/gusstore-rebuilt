import { type ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, UserCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  loadProviderUsers,
  updateUserProfile,
  updateUserPassword,
} from "@/lib/authStorage";
import type { ProviderUser } from "@/types/user";

const ProviderManager = () => {
  const [providers, setProviders] = useState<ProviderUser[]>(() => loadProviderUsers());
  const [editingProvider, setEditingProvider] = useState<ProviderUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLogo, setEditLogo] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [message, setMessage] = useState("");

  const refresh = () => setProviders(loadProviderUsers());

  const openEdit = (provider: ProviderUser) => {
    setEditingProvider(provider);
    setEditName(provider.providerName);
    setEditPhone(provider.phone);
    setEditEmail(provider.email);
    setEditLogo(provider.logo || "");
    setEditPassword("");
    setMessage("");
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditLogo(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!editingProvider) return;

    updateUserProfile(editingProvider.id, {
      providerName: editName,
      phone: editPhone,
      logo: editLogo || undefined,
    });

    // Update password directly without asking for old password (Super Admin power)
    if (editPassword.trim()) {
      // Direct password override for super admin
      const raw = localStorage.getItem("gusstore_providers_v1");
      if (raw) {
        try {
          const users = JSON.parse(raw) as ProviderUser[];
          const idx = users.findIndex((u) => u.id === editingProvider.id);
          if (idx !== -1) {
            users[idx] = { ...users[idx], password: editPassword.trim() };
            localStorage.setItem("gusstore_providers_v1", JSON.stringify(users));
          }
        } catch { /* ignore */ }
      }
    }

    refresh();
    setEditingProvider(null);
    setMessage("Proveedor actualizado.");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este proveedor? Sus productos permanecerán.")) return;

    const raw = localStorage.getItem("gusstore_providers_v1");
    if (!raw) return;
    try {
      const users = JSON.parse(raw) as ProviderUser[];
      const filtered = users.filter((u) => u.id !== id);
      localStorage.setItem("gusstore_providers_v1", JSON.stringify(filtered));
      refresh();
    } catch { /* ignore */ }
  };

  return (
    <section className="glass-card rounded-2xl p-5 space-y-4">
      <h2 className="font-display text-2xl">Gestión de Proveedores</h2>
      {message && <p className="text-sm text-primary">{message}</p>}

      {providers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay proveedores registrados aún.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {providers.map((provider) => (
            <div key={provider.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3">
              {provider.logo ? (
                <img src={provider.logo} alt="" className="h-10 w-10 rounded-full object-cover border border-border" />
              ) : (
                <UserCircle className="h-10 w-10 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{provider.providerName}</p>
                <p className="truncate text-xs text-muted-foreground">@{provider.username} · {provider.phone}</p>
                <p className="truncate text-xs text-muted-foreground">{provider.email}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(provider)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(provider.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editingProvider} onOpenChange={(open) => !open && setEditingProvider(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Proveedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del proveedor</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email (solo lectura)</Label>
              <Input value={editEmail} disabled className="opacity-60" />
            </div>
            <div className="space-y-2">
              <Label>Nueva contraseña (dejar vacío para no cambiar)</Label>
              <Input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                {editLogo ? (
                  <img src={editLogo} alt="" className="h-10 w-10 rounded-full object-cover border border-border" />
                ) : (
                  <UserCircle className="h-10 w-10 text-muted-foreground" />
                )}
                <Input type="file" accept="image/*" onChange={handleLogoUpload} className="max-w-xs" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="bg-gradient-brand text-primary-foreground shadow-neon">
                Guardar cambios
              </Button>
              <Button variant="outline" onClick={() => setEditingProvider(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ProviderManager;
