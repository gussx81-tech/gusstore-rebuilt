import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCroppedImage } from "@/lib/cropImage";
import { createWhatsAppUrl, loadCategories } from "@/lib/productsStorage";
import type { Product, ProductStock } from "@/types/product";
import type { AppUser } from "@/types/user";

interface ProductEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProduct?: Product | null;
  onSave: (product: Product) => void;
  onDelete?: (id: string) => void;
  categories: string[];
  currentUser: AppUser;
}

interface ProductDraft {
  name: string;
  price: number;
  stock: ProductStock;
  category: string;
  image: string;
}

const ProductEditorDialog = ({
  open,
  onOpenChange,
  initialProduct,
  onSave,
  onDelete,
  categories,
  currentUser,
}: ProductEditorDialogProps) => {
  const isEditing = Boolean(initialProduct);
  const [draft, setDraft] = useState<ProductDraft>({
    name: "",
    price: 0,
    stock: "Disponible",
    category: categories[0] || "Streaming",
    image: "",
  });
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImage, setCropImage] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  useEffect(() => {
    if (!open) return;

    if (initialProduct) {
      setDraft({
        name: initialProduct.name,
        price: initialProduct.price,
        stock: initialProduct.stock,
        category: initialProduct.category || categories[0] || "Streaming",
        image: initialProduct.image,
      });
    } else {
      setDraft({ name: "", price: 0, stock: "Disponible", category: categories[0] || "Streaming", image: "" });
    }
  }, [open, initialProduct, categories]);

  const categoryOptions = useMemo(() => {
    if (categories.length) return categories;
    return loadCategories();
  }, [categories]);

  const handleUploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(String(reader.result));
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    const cropped = await getCroppedImage(cropImage, croppedAreaPixels);
    setDraft((prev) => ({ ...prev, image: cropped }));
    setCropOpen(false);
  };

  const handleSaveProduct = () => {
    if (!draft.name.trim() || draft.price <= 0) return;

    const ownerData = initialProduct
      ? {
          ownerId: initialProduct.ownerId,
          ownerUsername: initialProduct.ownerUsername,
          ownerName: initialProduct.ownerName || "Gusstore",
          ownerPhone: initialProduct.ownerPhone,
          ownerLogo: initialProduct.ownerLogo,
        }
      : {
          ownerId: currentUser.id,
          ownerUsername: currentUser.username,
          ownerName: currentUser.providerName || currentUser.username || "Gusstore",
          ownerPhone: currentUser.phone,
          ownerLogo: currentUser.logo,
        };

    onSave({
      id: initialProduct?.id ?? crypto.randomUUID(),
      name: draft.name.trim(),
      price: Number(draft.price),
      stock: draft.stock,
      category: draft.category,
      whatsappUrl: createWhatsAppUrl(draft.name.trim(), Number(draft.price), ownerData.ownerPhone, ownerData.ownerName),
      image: draft.image,
      ...ownerData,
    });

    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border/70 bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{isEditing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Nombre</Label>
            <Input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Precio (S/)</Label>
                <Input type="number" value={draft.price || ""} onChange={(e) => setDraft((p) => ({ ...p, price: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Stock</Label>
                <select
                  value={draft.stock}
                  onChange={(e) => setDraft((p) => ({ ...p, stock: e.target.value as ProductStock }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Agotado">Agotado</option>
                </select>
              </div>
              <div>
                <Label>Categoría</Label>
                <select
                  value={draft.category}
                  onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Label>Imagen</Label>
            <Input type="file" accept="image/*" onChange={handleUploadImage} />
            {draft.image && <img src={draft.image} className="mt-2 h-32 w-full rounded-lg object-cover" alt="Preview" />}

            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={handleSaveProduct} className="w-full bg-gradient-brand text-primary-foreground font-bold">
                Guardar
              </Button>
              {isEditing && onDelete && initialProduct && (
                <Button variant="outline" onClick={() => onDelete(initialProduct.id)} className="w-full font-bold">
                  ELIMINAR PRODUCTO
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent>
          <div className="relative h-64 w-full overflow-hidden rounded-xl">
            <Cropper
              image={cropImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, ap) => setCroppedAreaPixels(ap)}
            />
          </div>
          <Button onClick={handleCropSave} className="w-full bg-gradient-brand text-primary-foreground">
            Guardar Recorte
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductEditorDialog;
